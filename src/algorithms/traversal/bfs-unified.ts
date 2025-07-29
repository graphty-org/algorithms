import type {Graph} from "../../core/graph.js";
import {CSRGraph} from "../../optimized/csr-graph.js";
import {DirectionOptimizedBFS} from "../../optimized/direction-optimized-bfs.js";
import {toCSRGraph} from "../../optimized/graph-adapter.js";
import type {NodeId, ShortestPathResult, TraversalOptions, TraversalResult} from "../../types/index.js";
import {reconstructPath} from "../../utils/graph-utilities.js";

/**
 * Unified BFS implementation that automatically optimizes for large graphs
 *
 * This module provides a single, user-friendly BFS implementation that:
 * - Automatically uses Direction-Optimized BFS for large graphs (>10k nodes)
 * - Maintains backward compatibility with existing APIs
 * - Requires no configuration or understanding of optimization thresholds
 * - Provides the best performance by default
 */

// Cache for CSR conversions to avoid repeated conversions
const csrCache = new WeakMap<Graph, CSRGraph>();

/**
 * Get or create CSR representation of a graph
 */
function getCSRGraph(graph: Graph): CSRGraph {
    let csrGraph = csrCache.get(graph);
    if (!csrGraph) {
        csrGraph = toCSRGraph(graph);
        csrCache.set(graph, csrGraph);
    }

    return csrGraph;
}

/**
 * Perform breadth-first search starting from a given node
 *
 * Automatically uses the most optimized implementation based on graph size.
 * No configuration needed - just call this function for the best performance.
 */
export function breadthFirstSearch(
    graph: Graph,
    startNode: NodeId,
    options: TraversalOptions = {},
): TraversalResult {
    if (!graph.hasNode(startNode)) {
        throw new Error(`Start node ${String(startNode)} not found in graph`);
    }

    // Automatically use optimized implementation for large graphs
    if (graph.nodeCount > 10000) {
        return breadthFirstSearchOptimized(graph, startNode, options);
    }

    // Standard implementation for smaller graphs
    return breadthFirstSearchStandard(graph, startNode, options);
}

/**
 * Standard BFS implementation for smaller graphs
 */
function breadthFirstSearchStandard(
    graph: Graph,
    startNode: NodeId,
    options: TraversalOptions = {},
): TraversalResult {
    const visited = new Set<NodeId>();
    const queue: {node: NodeId, level: number}[] = [];
    const order: NodeId[] = [];
    const tree = new Map<NodeId, NodeId | null>();

    // Initialize with start node
    queue.push({node: startNode, level: 0});
    visited.add(startNode);
    tree.set(startNode, null);

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
            break;
        }

        order.push(current.node);

        // Call visitor callback if provided
        if (options.visitCallback) {
            options.visitCallback(current.node, current.level);
        }

        // Early termination if target found
        if (options.targetNode && current.node === options.targetNode) {
            break;
        }

        // Explore neighbors
        for (const neighbor of graph.neighbors(current.node)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                tree.set(neighbor, current.node);
                queue.push({node: neighbor, level: current.level + 1});
            }
        }
    }

    return {visited, order, tree};
}

/**
 * Optimized BFS implementation using Direction-Optimized BFS
 */
function breadthFirstSearchOptimized(
    graph: Graph,
    startNode: NodeId,
    options: TraversalOptions = {},
): TraversalResult {
    const csrGraph = getCSRGraph(graph);

    const dobfs = new DirectionOptimizedBFS(csrGraph, {
        alpha: 15.0,
        beta: 20.0,
    });

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
 * Find shortest path between two nodes using BFS
 *
 * Automatically optimized for large graphs. Returns null if no path exists.
 */
export function shortestPathBFS(
    graph: Graph,
    source: NodeId,
    target: NodeId,
): ShortestPathResult | null {
    if (!graph.hasNode(source)) {
        throw new Error(`Source node ${String(source)} not found in graph`);
    }

    if (!graph.hasNode(target)) {
        throw new Error(`Target node ${String(target)} not found in graph`);
    }

    // Special case: source equals target
    if (source === target) {
        return {
            distance: 0,
            path: [source],
            predecessor: new Map([[source, null]]),
        };
    }

    // Use optimized implementation for large graphs
    if (graph.nodeCount > 10000) {
        return shortestPathBFSOptimized(graph, source, target);
    }

    // Standard implementation
    return shortestPathBFSStandard(graph, source, target);
}

/**
 * Standard shortest path BFS
 */
function shortestPathBFSStandard(
    graph: Graph,
    source: NodeId,
    target: NodeId,
): ShortestPathResult | null {
    const visited = new Set<NodeId>();
    const queue: {node: NodeId, distance: number}[] = [];
    const predecessor = new Map<NodeId, NodeId | null>();

    // Initialize BFS
    queue.push({node: source, distance: 0});
    visited.add(source);
    predecessor.set(source, null);

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
            break;
        }

        // Target found
        if (current.node === target) {
            const path = reconstructPath(target, predecessor);
            return {
                distance: current.distance,
                path,
                predecessor,
            };
        }

        // Explore neighbors
        for (const neighbor of graph.neighbors(current.node)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                predecessor.set(neighbor, current.node);
                queue.push({node: neighbor, distance: current.distance + 1});
            }
        }
    }

    // No path found
    return null;
}

/**
 * Optimized shortest path using Direction-Optimized BFS
 */
function shortestPathBFSOptimized(
    graph: Graph,
    source: NodeId,
    target: NodeId,
): ShortestPathResult | null {
    const csrGraph = getCSRGraph(graph);

    const dobfs = new DirectionOptimizedBFS(csrGraph, {
        alpha: 15.0,
        beta: 20.0,
    });

    // Perform BFS
    const result = dobfs.search(source);

    // Check if target was reached
    const distance = result.distances.get(target);
    if (distance === undefined) {
        return null; // No path found
    }

    // Reconstruct path
    const path = reconstructPath(target, result.parents);

    return {
        distance,
        path,
        predecessor: result.parents,
    };
}

/**
 * Find shortest paths from source to all reachable nodes
 *
 * Automatically optimized for large graphs.
 */
export function singleSourceShortestPathBFS(
    graph: Graph,
    source: NodeId,
): Map<NodeId, ShortestPathResult> {
    if (!graph.hasNode(source)) {
        throw new Error(`Source node ${String(source)} not found in graph`);
    }

    // Use optimized implementation for large graphs
    if (graph.nodeCount > 10000) {
        return singleSourceShortestPathBFSOptimized(graph, source);
    }

    // Standard implementation
    return singleSourceShortestPathBFSStandard(graph, source);
}

/**
 * Standard single-source shortest paths
 */
function singleSourceShortestPathBFSStandard(
    graph: Graph,
    source: NodeId,
): Map<NodeId, ShortestPathResult> {
    const results = new Map<NodeId, ShortestPathResult>();
    const visited = new Set<NodeId>();
    const queue: {node: NodeId, distance: number}[] = [];
    const predecessor = new Map<NodeId, NodeId | null>();
    const distances = new Map<NodeId, number>();

    // Initialize BFS
    queue.push({node: source, distance: 0});
    visited.add(source);
    predecessor.set(source, null);
    distances.set(source, 0);

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
            break;
        }

        // Explore neighbors
        for (const neighbor of graph.neighbors(current.node)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                predecessor.set(neighbor, current.node);
                distances.set(neighbor, current.distance + 1);
                queue.push({node: neighbor, distance: current.distance + 1});
            }
        }
    }

    // Build results after BFS completes
    // This avoids copying the predecessor map for each node
    for (const [node, distance] of distances) {
        const path = reconstructPath(node, predecessor);
        results.set(node, {
            distance,
            path,
            predecessor, // Share the same predecessor map
        });
    }

    return results;
}

/**
 * Optimized single-source shortest paths
 */
function singleSourceShortestPathBFSOptimized(
    graph: Graph,
    source: NodeId,
): Map<NodeId, ShortestPathResult> {
    const csrGraph = getCSRGraph(graph);

    const dobfs = new DirectionOptimizedBFS(csrGraph, {
        alpha: 15.0,
        beta: 20.0,
    });

    const bfsResult = dobfs.search(source);

    // Convert to expected format
    const results = new Map<NodeId, ShortestPathResult>();

    for (const [nodeId, distance] of bfsResult.distances) {
        // Reconstruct path for each node
        const path = reconstructPath(nodeId, bfsResult.parents);

        results.set(nodeId, {
            distance,
            path,
            predecessor: bfsResult.parents, // Share the same predecessor map
        });
    }

    return results;
}

/**
 * Check if the graph is bipartite using BFS coloring
 *
 * Note: This function does not use Direction-Optimized BFS as the
 * coloring logic is specific and doesn't benefit from the optimization.
 */
export function isBipartite(graph: Graph): boolean {
    if (graph.isDirected) {
        throw new Error("Bipartite test requires an undirected graph");
    }

    const color = new Map<NodeId, 0 | 1>();
    const visited = new Set<NodeId>();

    // Check each connected component
    for (const node of Array.from(graph.nodes())) {
        if (!visited.has(node.id)) {
            const queue: NodeId[] = [node.id];
            color.set(node.id, 0);
            visited.add(node.id);

            while (queue.length > 0) {
                const current = queue.shift();
                if (!current) {
                    break;
                }

                const currentColor = color.get(current);
                if (currentColor === undefined) {
                    continue;
                }

                for (const neighbor of Array.from(graph.neighbors(current))) {
                    if (!visited.has(neighbor)) {
                        // Color with opposite color
                        color.set(neighbor, currentColor === 0 ? 1 : 0);
                        visited.add(neighbor);
                        queue.push(neighbor);
                    } else if (color.get(neighbor) === currentColor) {
                        // Same color as current node - not bipartite
                        return false;
                    }
                }
            }
        }
    }

    return true;
}
