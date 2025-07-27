import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";

/**
 * Reconstructs a path from source to target using a predecessor map
 * @param target - The target node
 * @param predecessor - Map of node to its predecessor in the path
 * @returns Array of nodes from source to target, or empty array if no path exists
 */
export function reconstructPath<T>(
    target: T,
    predecessor: Map<T, T | null>,
): T[] {
    const path: T[] = [];
    let current: T | null = target;

    // Build path backwards from target to source
    while (current !== null) {
        path.unshift(current);
        const pred = predecessor.get(current);
        if (pred === undefined) {
            // No path exists
            return [];
        }

        current = pred;
    }

    return path;
}

/**
 * Find common neighbors between two nodes
 * @param graph - The graph
 * @param source - First node
 * @param target - Second node
 * @param directed - Whether to consider edge direction
 * @returns Set of common neighbor node IDs
 */
export function getCommonNeighbors(
    graph: Graph,
    source: NodeId,
    target: NodeId,
    directed = false,
): Set<NodeId> {
    const sourceNeighbors = new Set(
        directed ? graph.outNeighbors(source) : graph.neighbors(source),
    );
    const targetNeighbors = new Set(
        directed ? graph.outNeighbors(target) : graph.neighbors(target),
    );

    const common = new Set<NodeId>();
    for (const neighbor of sourceNeighbors) {
        if (targetNeighbors.has(neighbor)) {
            common.add(neighbor);
        }
    }

    return common;
}

/**
 * Find common neighbors for link prediction in directed graphs
 * This finds nodes that form a path from source to target (source->X->target)
 * @param graph - The graph
 * @param source - First node
 * @param target - Second node
 * @returns Set of intermediate node IDs
 */
export function getIntermediateNodes(
    graph: Graph,
    source: NodeId,
    target: NodeId,
): Set<NodeId> {
    const sourceOutNeighbors = new Set(graph.outNeighbors(source));
    const targetInNeighbors = new Set(graph.inNeighbors(target));

    const common = new Set<NodeId>();
    for (const neighbor of sourceOutNeighbors) {
        if (targetInNeighbors.has(neighbor)) {
            common.add(neighbor);
        }
    }

    return common;
}
