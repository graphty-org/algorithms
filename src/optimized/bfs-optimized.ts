import {breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS} from "../algorithms/traversal/bfs.js";
import type {Graph} from "../core/graph.js";
import type {NodeId, ShortestPathResult, TraversalOptions, TraversalResult} from "../types/index.js";
import {CSRGraph} from "./csr-graph.js";
import {DirectionOptimizedBFS, type DirectionOptimizedBFSOptions} from "./direction-optimized-bfs.js";
import {getOptimizationConfig, toCSRGraph} from "./graph-adapter.js";

// Cache for CSR conversions
const csrCache = new WeakMap<Graph, CSRGraph>();

/**
 * Extended BFS options with optimization flags
 */
export interface OptimizedBFSOptions extends TraversalOptions {
    optimized?: boolean;
    alpha?: number;
    beta?: number;
}

/**
 * Optimized breadth-first search with backward compatibility
 *
 * Automatically uses Direction-Optimized BFS when enabled and beneficial
 */
export function bfsOptimized(
    graph: Graph,
    startNode: NodeId,
    options: OptimizedBFSOptions = {},
): TraversalResult {
    const config = getOptimizationConfig();
    const useOptimized = options.optimized ?? config.useDirectionOptimizedBFS;

    // Use standard BFS for small graphs or when optimization is disabled
    if (!useOptimized || graph.nodeCount < 10000) {
        return breadthFirstSearch(graph, startNode, options);
    }

    // Get cached CSR graph or convert
    let csrGraph = csrCache.get(graph);
    if (!csrGraph) {
        csrGraph = toCSRGraph(graph);
        csrCache.set(graph, csrGraph);
    }

    const bfsOptions: DirectionOptimizedBFSOptions = {};
    const alpha = options.alpha ?? config.bfsAlpha;
    if (alpha !== undefined) {
        bfsOptions.alpha = alpha;
    }

    const beta = options.beta ?? config.bfsBeta;
    if (beta !== undefined) {
        bfsOptions.beta = beta;
    }

    const dobfs = new DirectionOptimizedBFS(csrGraph, bfsOptions);

    const result = dobfs.search(startNode);

    // Convert result to TraversalResult format
    const visited = new Set<NodeId>();
    const order: NodeId[] = [];
    const tree = new Map<NodeId, NodeId | null>();

    // Build traversal order using BFS from distances
    const nodesByDistance = new Map<number, NodeId[]>();
    let maxDistance = 0;

    for (const [nodeId, distance] of result.distances) {
        visited.add(nodeId);
        tree.set(nodeId, result.parents.get(nodeId) ?? null);

        if (!nodesByDistance.has(distance)) {
            nodesByDistance.set(distance, []);
        }

        nodesByDistance.get(distance)?.push(nodeId);
        maxDistance = Math.max(maxDistance, distance);
    }

    // Reconstruct BFS order
    for (let d = 0; d <= maxDistance; d++) {
        const nodes = nodesByDistance.get(d);
        if (nodes) {
            order.push(... nodes);
        }
    }

    // Handle visit callback if provided
    if (options.visitCallback) {
        for (const [nodeId, distance] of result.distances) {
            options.visitCallback(nodeId, distance);
        }
    }

    return {visited, order, tree};
}

/**
 * Optimized shortest path BFS
 */
export function shortestPathBFSOptimized(
    graph: Graph,
    source: NodeId,
    target: NodeId,
    options: {optimized?: boolean} = {},
): ShortestPathResult | null {
    const config = getOptimizationConfig();
    const useOptimized = options.optimized ?? config.useDirectionOptimizedBFS;

    // Use standard BFS for small graphs
    if (!useOptimized || graph.nodeCount < 10000) {
        return shortestPathBFS(graph, source, target);
    }

    // Special case: source equals target
    if (source === target) {
        return {
            distance: 0,
            path: [source],
            predecessor: new Map([[source, null]]),
        };
    }

    // Use optimized BFS with early termination
    let csrGraph = csrCache.get(graph);
    if (!csrGraph) {
        csrGraph = toCSRGraph(graph);
        csrCache.set(graph, csrGraph);
    }

    const dobfs = new DirectionOptimizedBFS(csrGraph);

    // Perform BFS
    const result = dobfs.search(source);

    // Check if target was reached
    const distance = result.distances.get(target);
    if (distance === undefined) {
        return null; // No path found
    }

    // Reconstruct path
    const path: NodeId[] = [];
    let current: NodeId | null = target;

    while (current !== null) {
        path.unshift(current);
        current = result.parents.get(current) ?? null;
    }

    return {
        distance,
        path,
        predecessor: result.parents,
    };
}

/**
 * Optimized single-source shortest paths
 */
export function singleSourceShortestPathBFSOptimized(
    graph: Graph,
    source: NodeId,
    options: {optimized?: boolean} = {},
): Map<NodeId, ShortestPathResult> {
    const config = getOptimizationConfig();
    const useOptimized = options.optimized ?? config.useDirectionOptimizedBFS;

    // Use standard BFS for small graphs
    if (!useOptimized || graph.nodeCount < 10000) {
        return singleSourceShortestPathBFS(graph, source);
    }

    // Use optimized BFS with caching
    let csrGraph = csrCache.get(graph);
    if (!csrGraph) {
        csrGraph = toCSRGraph(graph);
        csrCache.set(graph, csrGraph);
    }

    const dobfs = new DirectionOptimizedBFS(csrGraph);
    const bfsResult = dobfs.search(source);

    // Convert to expected format
    const results = new Map<NodeId, ShortestPathResult>();

    for (const [nodeId, distance] of bfsResult.distances) {
    // Reconstruct path for each node
        const path: NodeId[] = [];
        let current: NodeId | null = nodeId;

        while (current !== null) {
            path.unshift(current);
            current = bfsResult.parents.get(current) ?? null;
        }

        results.set(nodeId, {
            distance,
            path,
            predecessor: new Map(bfsResult.parents),
        });
    }

    return results;
}

/**
 * Export optimized versions as drop-in replacements
 */
export const optimizedTraversal = {
    breadthFirstSearch: bfsOptimized,
    shortestPathBFS: shortestPathBFSOptimized,
    singleSourceShortestPathBFS: singleSourceShortestPathBFSOptimized,
};
