import {Graph} from "../core/graph.js";
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

/**
 * Generate a consistent edge key for undirected graphs
 * @param source - Source node
 * @param target - Target node
 * @param isDirected - Whether the graph is directed
 * @returns A consistent edge identifier
 */
export function getEdgeKey(
    source: NodeId,
    target: NodeId,
    isDirected: boolean,
): string {
    if (isDirected) {
        return `${String(source)}->${String(target)}`;
    }

    // For undirected graphs, sort to ensure consistency
    const [first, second] = source < target ? [source, target] : [target, source];
    return `${String(first)}-${String(second)}`;
}

/**
 * Calculate total edge weight in a graph
 * @param graph - The graph
 * @returns Total weight of all edges
 */
export function getTotalEdgeWeight(graph: Graph): number {
    let totalWeight = 0;
    for (const edge of graph.edges()) {
        totalWeight += edge.weight ?? 1;
    }
    return graph.isDirected ? totalWeight : totalWeight / 2;
}

/**
 * Get node degree with optional mode for directed graphs
 * @param graph - The graph
 * @param nodeId - The node ID
 * @param mode - Degree mode for directed graphs
 * @returns Node degree
 */
export function getNodeDegree(
    graph: Graph,
    nodeId: NodeId,
    mode: "in" | "out" | "total" = "total",
): number {
    if (!graph.isDirected || mode === "total") {
        return graph.degree(nodeId);
    }

    if (mode === "in") {
        return graph.inDegree(nodeId);
    }

    return graph.outDegree(nodeId);
}

/**
 * Convert directed graph to undirected
 * @param graph - The directed graph
 * @returns A new undirected graph
 */
export function makeUndirected(graph: Graph): Graph {
    if (!graph.isDirected) {
        return graph;
    }

    const undirected = new Graph({directed: false});

    // Add all nodes
    for (const node of graph.nodes()) {
        undirected.addNode(node.id, node.data);
    }

    // Add edges (will automatically be made bidirectional)
    for (const edge of graph.edges()) {
        // For undirected, we only add each edge once
        if (!undirected.hasEdge(edge.source, edge.target)) {
            undirected.addEdge(edge.source, edge.target, edge.weight, edge.data);
        }
    }

    return undirected;
}

/**
 * Renumber communities consecutively starting from 0
 * @param communities - Map of node to community ID
 * @returns Map with renumbered community IDs
 */
export function renumberCommunities<T>(
    communities: Map<T, number>,
): Map<T, number> {
    const uniqueCommunities = new Set(communities.values());
    const remapping = new Map<number, number>();
    let newId = 0;

    for (const community of uniqueCommunities) {
        remapping.set(community, newId++);
    }

    const renumbered = new Map<T, number>();
    for (const [node, community] of communities) {
        const newCommunity = remapping.get(community);
        if (newCommunity !== undefined) {
            renumbered.set(node, newCommunity);
        }
    }

    return renumbered;
}
