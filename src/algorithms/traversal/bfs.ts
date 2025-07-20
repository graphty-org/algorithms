import type {Graph} from "../../core/graph.js";
import type {NodeId, ShortestPathResult, TraversalOptions, TraversalResult} from "../../types/index.js";

/**
 * Breadth-First Search (BFS) implementation
 *
 * Explores graph level by level from a starting node. Guarantees shortest path
 * in unweighted graphs and can be used for various graph analysis tasks.
 */

/**
 * Perform breadth-first search starting from a given node
 */
export function breadthFirstSearch(
    graph: Graph,
    startNode: NodeId,
    options: TraversalOptions = {},
): TraversalResult {
    if (!graph.hasNode(startNode)) {
        throw new Error(`Start node ${String(startNode)} not found in graph`);
    }

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
 * Find shortest path between two nodes in an unweighted graph using BFS
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
 * Find shortest paths from source to all reachable nodes using BFS
 */
export function singleSourceShortestPathBFS(
    graph: Graph,
    source: NodeId,
): Map<NodeId, ShortestPathResult> {
    if (!graph.hasNode(source)) {
        throw new Error(`Source node ${String(source)} not found in graph`);
    }

    const results = new Map<NodeId, ShortestPathResult>();
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

        // Store result for current node
        const path = reconstructPath(current.node, predecessor);
        results.set(current.node, {
            distance: current.distance,
            path,
            predecessor: new Map(predecessor),
        });

        // Explore neighbors
        for (const neighbor of graph.neighbors(current.node)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                predecessor.set(neighbor, current.node);
                queue.push({node: neighbor, distance: current.distance + 1});
            }
        }
    }

    return results;
}

/**
 * Check if the graph is bipartite using BFS coloring
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

/**
 * Reconstruct path from predecessor map
 */
function reconstructPath(target: NodeId, predecessor: Map<NodeId, NodeId | null>): NodeId[] {
    const path: NodeId[] = [];
    let current: NodeId | null = target;

    while (current !== null) {
        path.unshift(current);
        current = predecessor.get(current) ?? null;
    }

    return path;
}
