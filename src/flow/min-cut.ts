/**
 * Minimum Cut Algorithms
 *
 * Various algorithms for finding minimum cuts in graphs
 */

import type {Graph} from "../core/graph.js";
import {graphToMap} from "../utils/graph-converters.js";
import {fordFulkerson} from "./ford-fulkerson.js";

export interface MinCutResult {
    cutValue: number;
    partition1: Set<string>;
    partition2: Set<string>;
    cutEdges: {from: string, to: string, weight: number}[];
}

/**
 * Find minimum s-t cut using max flow
 * The minimum cut value equals the maximum flow value (max-flow min-cut theorem)
 *
 * @param graph - Weighted graph - accepts Graph class or Map representation
 * @param source - Source node
 * @param sink - Sink node
 * @returns Minimum cut information
 *
 * Time Complexity: Same as max flow algorithm used
 */
export function minSTCut(
    graph: Graph | Map<string, Map<string, number>>,
    source: string,
    sink: string,
): MinCutResult {
    // Convert Graph to Map representation if needed
    const graphMap = graph instanceof Map ? graph : graphToMap(graph);
    const flowResult = fordFulkerson(graphMap, source, sink);

    if (!flowResult.minCut) {
        return {
            cutValue: 0,
            partition1: new Set(),
            partition2: new Set(),
            cutEdges: [],
        };
    }

    const cutEdges: {from: string, to: string, weight: number}[] = [];

    // Find actual cut edges and their weights
    for (const [u, v] of flowResult.minCut.edges) {
        const weight = graphMap.get(u)?.get(v) ?? 0;
        if (weight > 0) {
            cutEdges.push({from: u, to: v, weight});
        }
    }

    return {
        cutValue: flowResult.maxFlow,
        partition1: flowResult.minCut.source,
        partition2: flowResult.minCut.sink,
        cutEdges,
    };
}

/**
 * Stoer-Wagner algorithm for finding global minimum cut
 * Finds the minimum cut that separates the graph into two parts
 *
 * @param graph - Undirected weighted graph - accepts Graph class or Map representation
 * @returns Global minimum cut
 *
 * Time Complexity: O(V³) or O(VE + V² log V) with heap
 */
export function stoerWagner(
    graph: Graph | Map<string, Map<string, number>>,
): MinCutResult {
    // Convert Graph to Map representation if needed
    const graphMap = graph instanceof Map ? graph : graphToMap(graph);
    // Convert to undirected if necessary
    const undirectedGraph = makeUndirected(graphMap);
    // Keep a copy for finding cut edges later
    const originalGraph = makeUndirected(graphMap);

    if (undirectedGraph.size < 2) {
        return {
            cutValue: 0,
            partition1: new Set(undirectedGraph.keys()),
            partition2: new Set(),
            cutEdges: [],
        };
    }

    // Initialize
    const nodes = Array.from(undirectedGraph.keys());
    const originalNodes = new Set(nodes); // Keep track of original nodes
    let minCutValue = Infinity;
    let bestPartition = new Set<string>();
    const contractionMap = new Map<string, Set<string>>();

    // Initialize contraction map
    for (const node of nodes) {
        contractionMap.set(node, new Set([node]));
    }

    // Contract graph V-1 times
    while (nodes.length > 1) {
        const cut = minimumCutPhase(undirectedGraph, nodes);

        if (cut.value < minCutValue) {
            minCutValue = cut.value;
            // Store the actual nodes that would be in partition with t
            const cutTNodes = contractionMap.get(cut.t);
            if (cutTNodes) {
                bestPartition = new Set(cutTNodes);
            }
        }

        // Contract the last two nodes
        const tNodes = contractionMap.get(cut.t);
        const sNodes = contractionMap.get(cut.s);
        if (!tNodes || !sNodes) {
            continue;
        }

        for (const node of tNodes) {
            sNodes.add(node);
        }
        contractionMap.delete(cut.t);

        contractNodes(undirectedGraph, nodes, cut.s, cut.t);
    }

    // Build result
    const partition1 = bestPartition;
    const partition2 = new Set<string>();

    for (const node of originalNodes) {
        if (!partition1.has(node)) {
            partition2.add(node);
        }
    }

    // Find cut edges
    const cutEdges: {from: string, to: string, weight: number}[] = [];
    for (const u of partition1) {
        const neighbors = originalGraph.get(u);
        if (neighbors) {
            for (const [v, weight] of neighbors) {
                if (partition2.has(v)) {
                    cutEdges.push({from: u, to: v, weight});
                }
            }
        }
    }

    return {
        cutValue: minCutValue,
        partition1,
        partition2,
        cutEdges,
    };
}

/**
 * Minimum cut phase of Stoer-Wagner algorithm
 */
function minimumCutPhase(
    graph: Map<string, Map<string, number>>,
    nodes: string[],
): {s: string, t: string, value: number, partition: string[]} {
    const n = nodes.length;
    const weight = new Map<string, number>();
    const added = new Set<string>();
    const order: string[] = [];

    // Initialize weights to 0
    for (const node of nodes) {
        weight.set(node, 0);
    }

    // Start with arbitrary node
    let lastAdded = nodes[0];
    if (!lastAdded) {
        return {s: "", t: "", value: 0, partition: []};
    }

    added.add(lastAdded);
    order.push(lastAdded);

    // Add remaining nodes
    for (let i = 1; i < n; i++) {
    // Update weights
        if (!lastAdded) {
            continue;
        }

        const neighbors = graph.get(lastAdded);
        if (neighbors) {
            for (const [neighbor, w] of neighbors) {
                if (!added.has(neighbor) && nodes.includes(neighbor)) {
                    const currentWeight = weight.get(neighbor);
                    if (currentWeight !== undefined) {
                        weight.set(neighbor, currentWeight + w);
                    }
                }
            }
        }

        // Find maximum weight node not yet added
        let maxWeight = -1;
        let maxNode = "";

        for (const node of nodes) {
            const nodeWeight = weight.get(node);
            if (!added.has(node) && nodeWeight !== undefined && nodeWeight > maxWeight) {
                maxWeight = nodeWeight;
                maxNode = node;
            }
        }

        added.add(maxNode);
        order.push(maxNode);
        lastAdded = maxNode;
    }

    const s = order[order.length - 2];
    const t = order[order.length - 1];
    if (!s || !t) {
        return {s: "", t: "", value: 0, partition: []};
    }

    const cutValue = weight.get(t) ?? 0;

    // Partition is all nodes except t
    const partition = order.slice(0, -1);

    return {s, t, value: cutValue, partition};
}

/**
 * Contract two nodes in the graph
 */
function contractNodes(
    graph: Map<string, Map<string, number>>,
    nodes: string[],
    s: string,
    t: string,
): void {
    // Merge t into s
    const sNeighbors = graph.get(s);
    const tNeighbors = graph.get(t);
    if (!sNeighbors || !tNeighbors) {
        return;
    }

    // Add t's edges to s
    for (const [neighbor, weight] of tNeighbors) {
        if (neighbor !== s) {
            sNeighbors.set(neighbor, (sNeighbors.get(neighbor) ?? 0) + weight);

            // Update neighbor's edge to point to s instead of t
            const neighborEdges = graph.get(neighbor);
            if (neighborEdges?.has(t)) {
                neighborEdges.delete(t);
                neighborEdges.set(s, (neighborEdges.get(s) ?? 0) + weight);
            }
        }
    }

    // Remove t from graph
    graph.delete(t);
    sNeighbors.delete(t);

    // Remove t from nodes array
    const index = nodes.indexOf(t);
    if (index > -1) {
        nodes.splice(index, 1);
    }
}

/**
 * Convert directed graph to undirected
 */
function makeUndirected(
    graph: Map<string, Map<string, number>>,
): Map<string, Map<string, number>> {
    const undirected = new Map<string, Map<string, number>>();

    // Initialize all nodes
    for (const node of graph.keys()) {
        undirected.set(node, new Map());
    }

    // Add edges in both directions
    for (const [u, neighbors] of graph) {
        for (const [v, weight] of neighbors) {
            const uNeighbors = undirected.get(u);
            if (uNeighbors) {
                uNeighbors.set(v, weight);
            }

            if (!undirected.has(v)) {
                undirected.set(v, new Map());
            }

            const vNeighbors = undirected.get(v);
            if (vNeighbors) {
                vNeighbors.set(u, weight);
            }
        }
    }

    return undirected;
}

/**
 * Karger's randomized min-cut algorithm
 * Probabilistic algorithm that finds min cut with high probability
 *
 * @param graph - Undirected graph - accepts Graph class or Map representation
 * @param iterations - Number of iterations (higher = better accuracy)
 * @returns Minimum cut found
 *
 * Time Complexity: O(V² * iterations)
 */
export function kargerMinCut(
    graph: Graph | Map<string, Map<string, number>>,
    iterations = 100,
): MinCutResult {
    // Convert Graph to Map representation if needed
    const graphMap = graph instanceof Map ? graph : graphToMap(graph);
    let minCutValue = Infinity;
    let bestPartition1 = new Set<string>();
    let bestPartition2 = new Set<string>();

    for (let i = 0; i < iterations; i++) {
        const result = kargerSingleRun(graphMap);

        if (result.cutValue < minCutValue) {
            minCutValue = result.cutValue;
            bestPartition1 = result.partition1;
            bestPartition2 = result.partition2;
        }
    }

    // Find cut edges
    const cutEdges: {from: string, to: string, weight: number}[] = [];
    for (const u of bestPartition1) {
        const neighbors = graphMap.get(u);
        if (neighbors) {
            for (const [v, weight] of neighbors) {
                if (bestPartition2.has(v)) {
                    cutEdges.push({from: u, to: v, weight});
                }
            }
        }
    }

    return {
        cutValue: minCutValue,
        partition1: bestPartition1,
        partition2: bestPartition2,
        cutEdges,
    };
}

/**
 * Single run of Karger's algorithm
 */
function kargerSingleRun(
    graph: Map<string, Map<string, number>>,
): {cutValue: number, partition1: Set<string>, partition2: Set<string>} {
    // Create a copy of the graph
    const workGraph = new Map<string, Map<string, number>>();
    const superNodes = new Map<string, Set<string>>();

    // Initialize
    for (const [node, neighbors] of graph) {
        workGraph.set(node, new Map(neighbors));
        superNodes.set(node, new Set([node]));
    }

    // Contract until 2 nodes remain
    while (workGraph.size > 2) {
    // Pick random edge
        const edges: [string, string, number][] = [];
        for (const [u, neighbors] of workGraph) {
            for (const [v, weight] of neighbors) {
                if (u < v) { // Avoid duplicates
                    edges.push([u, v, weight]);
                }
            }
        }

        if (edges.length === 0) {
            break;
        }

        const randomIndex = Math.floor(Math.random() * edges.length);
        const edge = edges[randomIndex];
        if (!edge) {
            continue;
        }

        const [u, v] = edge;

        // Contract edge
        if (u && v) {
            contractKarger(workGraph, superNodes, u, v);
        }
    }

    // Calculate cut value
    const nodes = Array.from(workGraph.keys());
    if (nodes.length < 2) {
        return {
            cutValue: 0,
            partition1: new Set(),
            partition2: new Set(),
        };
    }

    const node1 = nodes[0];
    const node2 = nodes[1];
    if (!node1 || !node2) {
        return {
            cutValue: 0,
            partition1: new Set(),
            partition2: new Set(),
        };
    }

    const cutValue = workGraph.get(node1)?.get(node2) ?? 0;

    return {
        cutValue,
        partition1: superNodes.get(node1) ?? new Set(),
        partition2: superNodes.get(node2) ?? new Set(),
    };
}

/**
 * Contract edge in Karger's algorithm
 */
function contractKarger(
    graph: Map<string, Map<string, number>>,
    superNodes: Map<string, Set<string>>,
    u: string,
    v: string,
): void {
    // Merge v into u
    const uNeighbors = graph.get(u);
    const vNeighbors = graph.get(v);
    if (!uNeighbors || !vNeighbors) {
        return;
    }

    // Merge supernodes
    const uSuper = superNodes.get(u);
    const vSuper = superNodes.get(v);
    if (!uSuper || !vSuper) {
        return;
    }

    for (const node of vSuper) {
        uSuper.add(node);
    }

    // Merge edges
    for (const [neighbor, weight] of vNeighbors) {
        if (neighbor !== u) {
            uNeighbors.set(neighbor, (uNeighbors.get(neighbor) ?? 0) + weight);

            // Update neighbor's edges
            const neighborEdges = graph.get(neighbor);
            if (neighborEdges) {
                neighborEdges.delete(v);
                if (neighbor !== u) {
                    neighborEdges.set(u, (neighborEdges.get(u) ?? 0) + weight);
                }
            }
        }
    }

    // Remove self-loops
    uNeighbors.delete(u);
    uNeighbors.delete(v);

    // Remove v
    graph.delete(v);
    superNodes.delete(v);
}

