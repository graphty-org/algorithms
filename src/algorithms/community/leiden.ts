/**
 * Leiden Algorithm for Community Detection
 *
 * An improved version of the Louvain algorithm that guarantees
 * well-connected communities and provides better quality partitions.
 *
 * Reference: Traag, V.A., Waltman, L. & van Eck, N.J. (2019)
 * "From Louvain to Leiden: guaranteeing well-connected communities"
 */

// Louvain import removed - not used in this implementation

import type {Graph} from "../../core/graph.js";
import {graphToMap} from "../../utils/graph-converters.js";
import {SeededRandom, shuffle} from "../../utils/math-utilities.js";

export interface LeidenOptions {
    resolution?: number;
    randomSeed?: number;
    maxIterations?: number;
    threshold?: number;
}

export interface LeidenResult {
    communities: Map<string, number>;
    modularity: number;
    iterations: number;
}

/**
 * Internal implementation of Leiden algorithm for community detection
 * Improves upon Louvain by ensuring well-connected communities
 */
function leidenImpl(
    graph: Map<string, Map<string, number>>,
    options: LeidenOptions = {},
): LeidenResult {
    const {
        resolution = 1.0,
        randomSeed = 42,
        maxIterations = 100,
        threshold = 1e-7,
    } = options;

    // Handle empty graph
    if (graph.size === 0) {
        return {
            communities: new Map(),
            modularity: 0,
            iterations: 0,
        };
    }

    // Initialize random number generator
    const random = SeededRandom.createGenerator(randomSeed);

    // Calculate total weight
    let totalWeight = 0;
    const degrees = new Map<string, number>();

    for (const [node, neighbors] of graph) {
        let degree = 0;
        for (const weight of neighbors.values()) {
            degree += weight;
            totalWeight += weight;
        }
        degrees.set(node, degree);
    }
    totalWeight /= 2; // Each edge counted twice

    // Initialize communities - each node in its own community
    const communities = new Map<string, number>();
    const nodes = Array.from(graph.keys());
    nodes.forEach((node, i) => communities.set(node, i));

    let modularity = calculateModularity(graph, communities, degrees, totalWeight, resolution);
    let bestModularity = modularity;
    let bestCommunities = new Map(communities);
    let iterations = 0;

    // Main Leiden loop
    while (iterations < maxIterations) {
        iterations++;
        let improved = false;

        // Phase 1: Local moving of nodes (fast)
        const nodeOrder = [... nodes];
        shuffle(nodeOrder, random);

        for (const node of nodeOrder) {
            const currentCommunity = communities.get(node);
            if (currentCommunity === undefined) {
                continue;
            }

            const neighborCommunities = getNeighborCommunities(node, graph, communities);

            let bestCommunity = currentCommunity;
            let bestGain = 0;

            // Try moving to each neighbor community
            for (const [community] of neighborCommunities) {
                if (community === currentCommunity) {
                    continue;
                }

                const gain = calculateModularityGain(
                    node, community, graph, communities, degrees, totalWeight, resolution,
                );

                if (gain > bestGain) {
                    bestGain = gain;
                    bestCommunity = community;
                }
            }

            // Move node if beneficial
            if (bestCommunity !== currentCommunity) {
                communities.set(node, bestCommunity);
                modularity += bestGain;
                improved = true;
            }
        }

        // Phase 2: Refinement (Leiden improvement over Louvain)
        // Create aggregate network based on current partition
        createAggregateNetwork(graph, communities);

        // Refine partition using aggregate network
        const subsetPartition = refinePartition(
            graph, communities,
        );

        // Apply refined partition
        for (const [node, newCommunity] of subsetPartition) {
            communities.set(node, newCommunity);
        }

        // Recalculate modularity
        modularity = calculateModularity(graph, communities, degrees, totalWeight, resolution);

        // Check if we've improved
        if (modularity > bestModularity + threshold) {
            bestModularity = modularity;
            bestCommunities = new Map(communities);
            improved = true;
        }

        if (!improved) {
            break;
        }

        // Phase 3: Aggregate network (create super-nodes)
        const aggregated = aggregateCommunities(graph, communities);
        if (aggregated.graph.size === graph.size) {
            break;
        } // No aggregation possible

        // Continue with aggregated network
        const {graph: newGraph} = aggregated;
        graph = newGraph;
        communities.clear();
        let communityId = 0;
        for (const node of graph.keys()) {
            communities.set(node, communityId++);
        }
    }

    // Map back to original nodes
    const finalCommunities = new Map<string, number>();
    for (const [node, community] of bestCommunities) {
        finalCommunities.set(node, community);
    }

    // Renumber communities consecutively
    const communityRenumber = new Map<number, number>();
    let newId = 0;
    for (const community of new Set(finalCommunities.values())) {
        communityRenumber.set(community, newId++);
    }
    for (const [node, community] of finalCommunities) {
        const newCommunityId = communityRenumber.get(community);
        if (newCommunityId !== undefined) {
            finalCommunities.set(node, newCommunityId);
        }
    }

    return {
        communities: finalCommunities,
        modularity: bestModularity,
        iterations,
    };
}

/**
 * Calculate modularity of a partition
 */
function calculateModularity(
    graph: Map<string, Map<string, number>>,
    communities: Map<string, number>,
    degrees: Map<string, number>,
    totalWeight: number,
    resolution: number,
): number {
    let modularity = 0;
    const communityWeights = new Map<number, number>();

    // Calculate internal weights for each community
    for (const [node, neighbors] of graph) {
        const nodeCommunity = communities.get(node);
        if (nodeCommunity === undefined) {
            continue;
        }

        for (const [neighbor, weight] of neighbors) {
            const neighborCommunity = communities.get(neighbor);
            if (neighborCommunity === undefined) {
                continue;
            }

            if (nodeCommunity === neighborCommunity) {
                modularity += weight;
            }
        }

        const degree = degrees.get(node);
        if (degree !== undefined) {
            communityWeights.set(nodeCommunity, (communityWeights.get(nodeCommunity) ?? 0) + degree);
        }
    }

    // Handle empty graph or zero weight
    if (totalWeight === 0) {
        return 0;
    }

    // Normalize and apply resolution
    modularity /= (2 * totalWeight);

    // Subtract expected edges
    for (const weight of communityWeights.values()) {
        modularity -= resolution * ((weight / (2 * totalWeight)) ** 2);
    }

    return modularity;
}

/**
 * Get communities of neighbors
 */
function getNeighborCommunities(
    node: string,
    graph: Map<string, Map<string, number>>,
    communities: Map<string, number>,
): Map<number, number> {
    const neighborCommunities = new Map<number, number>();
    const neighbors = graph.get(node);

    if (neighbors) {
        for (const [neighbor, weight] of neighbors) {
            const community = communities.get(neighbor);
            if (community !== undefined) {
                neighborCommunities.set(community, (neighborCommunities.get(community) ?? 0) + weight);
            }
        }
    }

    return neighborCommunities;
}

/**
 * Calculate modularity gain from moving a node to a community
 */
function calculateModularityGain(
    node: string,
    targetCommunity: number,
    graph: Map<string, Map<string, number>>,
    communities: Map<string, number>,
    degrees: Map<string, number>,
    totalWeight: number,
    resolution: number,
): number {
    const currentCommunity = communities.get(node);
    const nodeDegree = degrees.get(node);
    if (currentCommunity === undefined || nodeDegree === undefined) {
        return 0;
    }

    // Weight of edges from node to target community
    let weightToTarget = 0;
    let weightToCurrent = 0;

    const neighbors = graph.get(node);
    if (neighbors) {
        for (const [neighbor, weight] of neighbors) {
            const neighborCommunity = communities.get(neighbor);
            if (neighborCommunity === undefined) {
                continue;
            }

            if (neighborCommunity === targetCommunity) {
                weightToTarget += weight;
            } else if (neighborCommunity === currentCommunity && neighbor !== node) {
                weightToCurrent += weight;
            }
        }
    }

    // Calculate community degrees
    let targetDegree = 0;
    let currentDegree = 0;

    for (const [n, c] of communities) {
        if (c === targetCommunity && n !== node) {
            const deg = degrees.get(n);
            if (deg !== undefined) {
                targetDegree += deg;
            }
        } else if (c === currentCommunity && n !== node) {
            const deg = degrees.get(n);
            if (deg !== undefined) {
                currentDegree += deg;
            }
        }
    }

    // Modularity gain calculation
    const m2 = 2 * totalWeight;
    const gain = ((weightToTarget - weightToCurrent) / totalWeight) -
    (resolution * nodeDegree * (targetDegree - currentDegree) / (m2 * m2));

    return gain;
}

/**
 * Create aggregate network where each community becomes a super-node
 */
function createAggregateNetwork(
    graph: Map<string, Map<string, number>>,
    communities: Map<string, number>,
): {
        aggregateGraph: Map<number, Map<number, number>>;
        nodeMapping: Map<string, number>;
    } {
    const aggregateGraph = new Map<number, Map<number, number>>();
    const nodeMapping = new Map<string, number>();

    // Create mapping from nodes to communities
    for (const [node, community] of communities) {
        nodeMapping.set(node, community);
        if (!aggregateGraph.has(community)) {
            aggregateGraph.set(community, new Map());
        }
    }

    // Aggregate edges
    for (const [node, neighbors] of graph) {
        const sourceCommunity = communities.get(node);
        if (sourceCommunity === undefined) {
            continue;
        }

        for (const [neighbor, weight] of neighbors) {
            const targetCommunity = communities.get(neighbor);
            if (targetCommunity === undefined) {
                continue;
            }

            const sourceNeighbors = aggregateGraph.get(sourceCommunity);
            if (sourceNeighbors) {
                const current = sourceNeighbors.get(targetCommunity) ?? 0;
                sourceNeighbors.set(targetCommunity, current + weight);
            }
        }
    }

    return {aggregateGraph, nodeMapping};
}

/**
 * Refine partition (Leiden-specific improvement)
 * Ensures well-connected communities by considering subsets
 */
function refinePartition(
    originalGraph: Map<string, Map<string, number>>,
    communities: Map<string, number>,
): Map<string, number> {
    const refined = new Map<string, number>();

    // For each community, check if it should be split
    const communityNodes = new Map<number, string[]>();
    for (const [node, community] of communities) {
        if (!communityNodes.has(community)) {
            communityNodes.set(community, []);
        }

        const nodes = communityNodes.get(community);
        if (nodes) {
            nodes.push(node);
        }
    }

    let newCommunityId = 0;

    for (const [community, nodes] of communityNodes) {
        if (nodes.length === 1) {
            // Single node community
            const singleNode = nodes[0];
            if (singleNode) {
                refined.set(singleNode, newCommunityId++);
            }

            continue;
        }

        // Check connectivity within community
        const subgraph = new Map<string, Set<string>>();
        for (const node of nodes) {
            subgraph.set(node, new Set());
            const neighbors = originalGraph.get(node);
            if (neighbors) {
                for (const [neighbor] of neighbors) {
                    if (communities.get(neighbor) === community) {
                        const nodeSet = subgraph.get(node);
                        if (nodeSet) {
                            nodeSet.add(neighbor);
                        }
                    }
                }
            }
        }

        // Find connected components within community
        const components = findConnectedComponents(subgraph);

        // Assign new community IDs to components
        for (const component of components) {
            for (const node of component) {
                refined.set(node, newCommunityId);
            }
            newCommunityId++;
        }
    }

    return refined;
}

/**
 * Find connected components in undirected graph
 */
function findConnectedComponents(graph: Map<string, Set<string>>): Set<string>[] {
    const visited = new Set<string>();
    const components: Set<string>[] = [];

    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            const component = new Set<string>();
            const queue = [node];

            while (queue.length > 0) {
                const current = queue.shift();
                if (current === undefined || visited.has(current)) {
                    continue;
                }

                visited.add(current);
                component.add(current);

                const neighbors = graph.get(current);
                if (neighbors) {
                    for (const neighbor of neighbors) {
                        if (!visited.has(neighbor)) {
                            queue.push(neighbor);
                        }
                    }
                }
            }

            components.push(component);
        }
    }

    return components;
}

/**
 * Aggregate communities into super-nodes
 */
function aggregateCommunities(
    graph: Map<string, Map<string, number>>,
    communities: Map<string, number>,
): {
        graph: Map<string, Map<string, number>>;
        mapping: Map<string, string>;
    } {
    const aggregated = new Map<string, Map<string, number>>();
    const mapping = new Map<string, string>();

    // Create super-nodes
    const communityNodes = new Map<number, string>();
    for (const community of new Set(communities.values())) {
        const superNode = `super_${String(community)}`;
        communityNodes.set(community, superNode);
        aggregated.set(superNode, new Map());
    }

    // Map original nodes to super-nodes
    for (const [node, community] of communities) {
        const superNode = communityNodes.get(community);
        if (superNode !== undefined) {
            mapping.set(node, superNode);
        }
    }

    // Aggregate edges
    for (const [node, neighbors] of graph) {
        const sourceCommunity = communities.get(node);
        if (sourceCommunity === undefined) {
            continue;
        }

        const sourceSuper = communityNodes.get(sourceCommunity);
        if (sourceSuper === undefined) {
            continue;
        }

        for (const [neighbor, weight] of neighbors) {
            const targetCommunity = communities.get(neighbor);
            if (targetCommunity === undefined) {
                continue;
            }

            const targetSuper = communityNodes.get(targetCommunity);
            if (targetSuper === undefined) {
                continue;
            }

            if (sourceSuper !== targetSuper) {
                const sourceNeighbors = aggregated.get(sourceSuper);
                if (sourceNeighbors) {
                    const current = sourceNeighbors.get(targetSuper) ?? 0;
                    sourceNeighbors.set(targetSuper, current + weight);
                }
            }
        }
    }

    return {graph: aggregated, mapping};
}

/**
 * Leiden algorithm for community detection
 * Improves upon Louvain by ensuring well-connected communities
 *
 * @param graph - Undirected weighted graph - accepts Graph class or Map representation
 * @param options - Algorithm options
 * @returns Community assignments and modularity
 *
 * Time Complexity: O(m) per iteration, typically O(m log m) total
 * Space Complexity: O(n + m)
 */
export function leiden(
    graph: Graph,
    options: LeidenOptions = {},
): LeidenResult {
    // Convert Graph to Map representation
    const graphMap = graphToMap(graph);
    return leidenImpl(graphMap, options);
}

