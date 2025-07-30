import {bfsAugmentingPath} from "../algorithms/traversal/bfs-variants.js";
import type {Graph} from "../core/graph.js";
import {graphToMap} from "../utils/graph-converters.js";

/**
 * Ford-Fulkerson Algorithm for Maximum Flow
 *
 * Finds the maximum flow from source to sink in a flow network
 * using the method of augmenting paths.
 */

export interface FlowEdge {
    from: string;
    to: string;
    capacity: number;
    flow: number;
}

export interface FlowNetwork {
    nodes: Set<string>;
    edges: Map<string, Map<string, FlowEdge>>;
}

export interface MaxFlowResult {
    maxFlow: number;
    flowGraph: Map<string, Map<string, number>>;
    minCut?: {source: Set<string>, sink: Set<string>, edges: [string, string][]};
}

/**
 * Create residual graph from original graph
 */
function createResidualGraph(
    graph: Map<string, Map<string, number>>,
): Map<string, Map<string, number>> {
    const residual = new Map<string, Map<string, number>>();

    for (const [u, neighbors] of graph) {
        residual.set(u, new Map());
        for (const [v, capacity] of neighbors) {
            const uResidualNeighbors = residual.get(u);
            if (uResidualNeighbors) {
                uResidualNeighbors.set(v, capacity);
            }
        }
    }

    return residual;
}

/**
 * Find augmenting path using DFS
 */
function findAugmentingPathDFS(
    residualGraph: Map<string, Map<string, number>>,
    source: string,
    sink: string,
): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];

    function dfs(node: string): boolean {
        if (node === sink) {
            path.push(node);
            return true;
        }

        visited.add(node);
        path.push(node);

        const neighbors = residualGraph.get(node);
        if (neighbors) {
            for (const [neighbor, capacity] of neighbors) {
                if (!visited.has(neighbor) && capacity > 0) {
                    if (dfs(neighbor)) {
                        return true;
                    }
                }
            }
        }

        path.pop();
        return false;
    }

    if (dfs(source)) {
        return path;
    }

    return null;
}

/**
 * Update flow along an augmenting path
 */
function updateFlow(
    residualGraph: Map<string, Map<string, number>>,
    flowGraph: Map<string, Map<string, number>>,
    originalGraph: Map<string, Map<string, number>>,
    path: string[],
    pathFlow: number,
): void {
    for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        if (!u || !v) {
            continue;
        }

        // Update residual graph
        const uEdges = residualGraph.get(u);
        if (uEdges) {
            const currentCapacity = uEdges.get(v);
            if (currentCapacity !== undefined) {
                uEdges.set(v, currentCapacity - pathFlow);
            }
        }

        // Add reverse edge
        if (!residualGraph.has(v)) {
            residualGraph.set(v, new Map());
        }

        const vEdges = residualGraph.get(v);
        if (vEdges) {
            vEdges.set(u, (vEdges.get(u) ?? 0) + pathFlow);
        }

        // Update flow graph
        if (originalGraph.get(u)?.has(v)) {
            const uFlowEdges = flowGraph.get(u);
            if (uFlowEdges) {
                const currentFlow = uFlowEdges.get(v) ?? 0;
                uFlowEdges.set(v, currentFlow + pathFlow);
            }
        } else if (originalGraph.get(v)?.has(u)) {
            // This is a reverse flow
            const vFlowEdges = flowGraph.get(v);
            if (vFlowEdges) {
                const currentFlow = vFlowEdges.get(u) ?? 0;
                vFlowEdges.set(u, currentFlow - pathFlow);
            }
        }
    }
}

/**
 * Find minimum cut from source side
 */
function findMinCut(
    residualGraph: Map<string, Map<string, number>>,
    source: string,
): {source: Set<string>, sink: Set<string>, edges: [string, string][]} {
    // Find all reachable nodes from source in residual graph
    const sourceSet = new Set<string>();
    const queue = [source];
    sourceSet.add(source);

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
            continue;
        }

        const neighbors = residualGraph.get(current);

        if (neighbors) {
            for (const [neighbor, capacity] of neighbors) {
                if (!sourceSet.has(neighbor) && capacity > 0) {
                    sourceSet.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
    }

    // All other nodes are in sink set
    const sinkSet = new Set<string>();
    for (const node of residualGraph.keys()) {
        if (!sourceSet.has(node)) {
            sinkSet.add(node);
        }
    }

    // Find cut edges
    const cutEdges: [string, string][] = [];
    for (const u of sourceSet) {
        const neighbors = residualGraph.get(u);
        if (neighbors) {
            for (const v of neighbors.keys()) {
                if (sinkSet.has(v)) {
                    cutEdges.push([u, v]);
                }
            }
        }
    }

    return {source: sourceSet, sink: sinkSet, edges: cutEdges};
}

/**
 * Core max flow algorithm implementation
 */
function maxFlowCore(
    graph: Map<string, Map<string, number>>,
    source: string,
    sink: string,
    findPath: (residual: Map<string, Map<string, number>>, src: string, snk: string) => {path: string[], pathCapacity: number} | null,
): MaxFlowResult {
    if (!graph.has(source) || !graph.has(sink)) {
        return {maxFlow: 0, flowGraph: new Map()};
    }

    // Create residual graph
    const residualGraph = createResidualGraph(graph);
    const flowGraph = new Map<string, Map<string, number>>();

    // Initialize flow graph
    for (const [u, neighbors] of graph) {
        flowGraph.set(u, new Map());
        for (const v of neighbors.keys()) {
            const uFlowNeighbors = flowGraph.get(u);
            if (uFlowNeighbors) {
                uFlowNeighbors.set(v, 0);
            }
        }
    }

    let maxFlow = 0;
    let pathResult = findPath(residualGraph, source, sink);

    while (pathResult !== null) {
        const {path, pathCapacity} = pathResult;

        // Update flow
        updateFlow(residualGraph, flowGraph, graph, path, pathCapacity);
        maxFlow += pathCapacity;

        // Find next path
        pathResult = findPath(residualGraph, source, sink);
    }

    // Find minimum cut
    const minCut = findMinCut(residualGraph, source);

    return {maxFlow, flowGraph, minCut};
}

/**
 * Internal implementation of Ford-Fulkerson algorithm using DFS
 */
function fordFulkersonImpl(
    graph: Map<string, Map<string, number>>,
    source: string,
    sink: string,
): MaxFlowResult {
    // Adapter function for DFS path finding
    const findPathDFS = (residual: Map<string, Map<string, number>>, src: string, snk: string): {path: string[], pathCapacity: number} | null => {
        const path = findAugmentingPathDFS(residual, src, snk);
        if (!path) {
            return null;
        }

        // Calculate path capacity
        let pathCapacity = Infinity;
        for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];
            if (u && v) {
                const capacity = residual.get(u)?.get(v);
                if (capacity !== undefined) {
                    pathCapacity = Math.min(pathCapacity, capacity);
                }
            }
        }

        return {path, pathCapacity};
    };

    return maxFlowCore(graph, source, sink, findPathDFS);
}

/**
 * Internal implementation of Edmonds-Karp algorithm
 */
function edmondsKarpImpl(
    graph: Map<string, Map<string, number>>,
    source: string,
    sink: string,
): MaxFlowResult {
    // Use BFS variant for path finding
    const findPathBFS = (residual: Map<string, Map<string, number>>, src: string, snk: string): {path: string[], pathCapacity: number} | null => {
        return bfsAugmentingPath(residual, src, snk);
    };

    return maxFlowCore(graph, source, sink, findPathBFS);
}

/**
 * Utility function to create a flow network for bipartite matching
 */
export function createBipartiteFlowNetwork(
    leftNodes: string[],
    rightNodes: string[],
    edges: [string, string][],
): {graph: Map<string, Map<string, number>>, source: string, sink: string} {
    const graph = new Map<string, Map<string, number>>();
    const source = "__source__";
    const sink = "__sink__";

    // Add source connections to left nodes
    graph.set(source, new Map());
    for (const left of leftNodes) {
        const sourceNeighbors = graph.get(source);
        if (sourceNeighbors) {
            sourceNeighbors.set(left, 1);
        }

        graph.set(left, new Map());
    }

    // Add edges between left and right
    for (const [left, right] of edges) {
        if (!graph.has(left)) {
            graph.set(left, new Map());
        }

        const leftNeighbors = graph.get(left);
        if (leftNeighbors) {
            leftNeighbors.set(right, 1);
        }
    }

    // Add right node connections to sink
    for (const right of rightNodes) {
        if (!graph.has(right)) {
            graph.set(right, new Map());
        }

        const rightNeighbors = graph.get(right);
        if (rightNeighbors) {
            rightNeighbors.set(sink, 1);
        }
    }

    graph.set(sink, new Map());

    return {graph, source, sink};
}

/**
 * Ford-Fulkerson algorithm using DFS for finding augmenting paths
 *
 * @param graph - Adjacency list representation with capacities - accepts Graph class or Map
 * @param source - Source node
 * @param sink - Sink node
 * @returns Maximum flow value and flow graph
 *
 * Time Complexity: O(E * f) where f is the maximum flow
 * Space Complexity: O(V + E)
 */
export function fordFulkerson(
    graph: Graph,
    source: string,
    sink: string,
): MaxFlowResult {
    // Convert Graph to Map representation
    const graphMap = graphToMap(graph);
    return fordFulkersonImpl(graphMap, source, sink);
}

/**
 * Edmonds-Karp algorithm (Ford-Fulkerson with BFS)
 * More efficient implementation with better time complexity
 *
 * @param graph - Adjacency list representation with capacities - accepts Graph class or Map
 * @param source - Source node
 * @param sink - Sink node
 * @returns Maximum flow value and flow graph
 *
 * Time Complexity: O(V * E²)
 */
export function edmondsKarp(
    graph: Graph | Map<string, Map<string, number>>,
    source: string,
    sink: string,
): MaxFlowResult {
    // Convert Graph to Map representation if needed
    const graphMap = graph instanceof Map ? graph : graphToMap(graph);
    return edmondsKarpImpl(graphMap, source, sink);
}
