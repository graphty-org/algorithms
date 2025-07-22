import {Graph} from "../../core/graph.js";
import type {CommunityResult, LouvainOptions, NodeId} from "../../types/index.js";

/**
 * Louvain community detection algorithm
 *
 * Implements the Louvain method for community detection in graphs.
 * Uses modularity optimization to find community structure.
 *
 * References:
 * - Blondel, V. D., Guillaume, J. L., Lambiotte, R., & Lefebvre, E. (2008).
 *   Fast unfolding of communities in large networks.
 *   Journal of statistical mechanics: theory and experiment, 2008(10), P10008.
 *
 * @param graph - The input graph
 * @param options - Algorithm options
 * @returns Community detection result with communities, modularity, and iterations
 */
export function louvain(
    graph: Graph,
    options: LouvainOptions = {},
): CommunityResult {
    const resolution = options.resolution ?? 1.0;
    const maxIterations = options.maxIterations ?? 100;
    const tolerance = options.tolerance ?? 1e-6;

    // Initialize: each node in its own community
    const communities = initializeCommunities(graph);
    let modularity = calculateModularity(graph, communities, resolution);
    let iteration = 0;
    let improved = true;

    while (iteration < maxIterations && improved) {
        // Phase 1: Local optimization
        improved = louvainPhase1(graph, communities, resolution);

        if (improved) {
            const newModularity = calculateModularity(graph, communities, resolution);

            // Check for convergence
            if ((newModularity - modularity) < tolerance) {
                break;
            }

            modularity = newModularity;
            iteration++;
        }
    }

    return {
        communities: extractCommunities(communities),
        modularity: calculateModularity(graph, communities, resolution),
        iterations: iteration,
    };
}

/**
 * Initialize communities: each node in its own community
 */
function initializeCommunities(graph: Graph): Map<NodeId, number> {
    const communities = new Map<NodeId, number>();
    let communityId = 0;

    for (const node of graph.nodes()) {
        communities.set(node.id, communityId++);
    }

    return communities;
}

/**
 * Phase 1 of Louvain algorithm: Local optimization
 * For each node, try moving to neighboring communities and keep the move
 * that provides the best modularity gain.
 */
function louvainPhase1(
    graph: Graph,
    communities: Map<NodeId, number>,
    resolution: number,
): boolean {
    let globalImprovement = false;
    let localImprovement = true;

    while (localImprovement) {
        localImprovement = false;

        for (const node of graph.nodes()) {
            const nodeId = node.id;
            const currentCommunity = communities.get(nodeId);

            if (currentCommunity === undefined) {
                continue;
            }

            // Calculate current modularity contribution
            const currentModularity = nodeModularityContribution(
                graph, nodeId, currentCommunity, communities, resolution,
            );

            let bestCommunity = currentCommunity;
            let bestModularity = currentModularity;

            // Try moving to neighboring communities
            const neighborCommunities = getNeighborCommunities(graph, nodeId, communities);

            for (const neighborCommunity of neighborCommunities) {
                if (neighborCommunity === currentCommunity) {
                    continue;
                }

                const newModularity = nodeModularityContribution(
                    graph, nodeId, neighborCommunity, communities, resolution,
                );

                if (newModularity > bestModularity) {
                    bestModularity = newModularity;
                    bestCommunity = neighborCommunity;
                }
            }

            // Move node if improvement found
            if (bestCommunity !== currentCommunity) {
                communities.set(nodeId, bestCommunity);
                localImprovement = true;
                globalImprovement = true;
            }
        }
    }

    return globalImprovement;
}

/**
 * Calculate modularity contribution of a node to a specific community
 */
function nodeModularityContribution(
    graph: Graph,
    nodeId: NodeId,
    community: number,
    communities: Map<NodeId, number>,
    resolution: number,
): number {
    const totalEdgeWeight = getTotalEdgeWeight(graph);
    if (totalEdgeWeight === 0) {
        return 0;
    }

    let internalLinks = 0;
    let nodeDegree = 0;
    let communityDegree = 0;

    // Calculate node's connections to the community
    for (const neighbor of graph.neighbors(nodeId)) {
        const edge = graph.getEdge(nodeId, neighbor);
        const weight = edge?.weight ?? 1;
        nodeDegree += weight;

        if (communities.get(neighbor) === community) {
            internalLinks += weight;
        }
    }

    // Calculate total degree of the community (excluding the node if it's currently in it)
    for (const [otherNodeId, otherCommunity] of communities) {
        if (otherCommunity === community && otherNodeId !== nodeId) {
            communityDegree += getNodeDegree(graph, otherNodeId);
        }
    }

    // Modularity formula: Q = (1/2m) * Σ[A_ij - (k_i * k_j)/(2m)] * δ(c_i, c_j)
    const modularityIncrease = (internalLinks - ((resolution * nodeDegree * communityDegree) / (2 * totalEdgeWeight))) / totalEdgeWeight;

    return modularityIncrease;
}

/**
 * Get communities of neighboring nodes
 */
function getNeighborCommunities(
    graph: Graph,
    nodeId: NodeId,
    communities: Map<NodeId, number>,
): Set<number> {
    const neighborCommunities = new Set<number>();

    for (const neighbor of graph.neighbors(nodeId)) {
        const community = communities.get(neighbor);
        if (community !== undefined) {
            neighborCommunities.add(community);
        }
    }

    return neighborCommunities;
}

/**
 * Calculate total modularity of the current community assignment
 */
function calculateModularity(
    graph: Graph,
    communities: Map<NodeId, number>,
    resolution: number,
): number {
    const totalEdgeWeight = getTotalEdgeWeight(graph);
    if (totalEdgeWeight === 0) {
        return 0;
    }

    let modularity = 0;

    // For undirected graphs, we need to be careful not to double-count edges
    const countedEdges = new Set<string>();

    // Calculate modularity: Q = (1/2m) * Σ[A_ij - γ(k_i * k_j)/(2m)] * δ(c_i, c_j)
    for (const nodeI of graph.nodes()) {
        for (const nodeJ of graph.nodes()) {
            // Skip if already counted this pair in undirected graph
            if (!graph.isDirected) {
                const nodeIStr = String(nodeI.id);
                const nodeJStr = String(nodeJ.id);
                const edgeKey = nodeIStr <= nodeJStr ? `${nodeIStr}-${nodeJStr}` : `${nodeJStr}-${nodeIStr}`;
                if (countedEdges.has(edgeKey)) {
                    continue;
                }

                countedEdges.add(edgeKey);
            }

            if (communities.get(nodeI.id) === communities.get(nodeJ.id)) {
                const edge = graph.getEdge(nodeI.id, nodeJ.id);
                const reverseEdge = !graph.isDirected ? graph.getEdge(nodeJ.id, nodeI.id) : null;

                let edgeWeight = 0;
                if (edge) {
                    edgeWeight += edge.weight ?? 1;
                }

                if (reverseEdge && nodeI.id !== nodeJ.id) {
                    edgeWeight += reverseEdge.weight ?? 1;
                }

                const degreeI = getNodeDegree(graph, nodeI.id);
                const degreeJ = getNodeDegree(graph, nodeJ.id);

                modularity += edgeWeight - ((resolution * degreeI * degreeJ) / (2 * totalEdgeWeight));
            }
        }
    }

    return modularity / (2 * totalEdgeWeight);
}

/**
 * Extract final community structure
 */
function extractCommunities(communities: Map<NodeId, number>): NodeId[][] {
    const communityMap = new Map<number, NodeId[]>();

    for (const [nodeId, community] of communities) {
        if (!communityMap.has(community)) {
            communityMap.set(community, []);
        }

        const communityNodes = communityMap.get(community);
        if (communityNodes) {
            communityNodes.push(nodeId);
        }
    }

    return Array.from(communityMap.values());
}

/**
 * Calculate total edge weight in the graph
 */
function getTotalEdgeWeight(graph: Graph): number {
    let totalWeight = 0;

    for (const edge of graph.edges()) {
        totalWeight += edge.weight ?? 1;
    }

    return totalWeight;
}

/**
 * Get the total degree (sum of edge weights) for a node
 */
function getNodeDegree(graph: Graph, nodeId: NodeId): number {
    let degree = 0;

    for (const neighbor of graph.neighbors(nodeId)) {
        const edge = graph.getEdge(nodeId, neighbor);
        degree += edge?.weight ?? 1;
    }

    return degree;
}
