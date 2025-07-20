import type {Graph} from "../../core/graph.js";
import {PriorityQueue} from "../../data-structures/priority-queue.js";
import type {DijkstraOptions, NodeId, ShortestPathResult} from "../../types/index.js";

/**
 * Dijkstra's algorithm implementation for single-source shortest paths
 *
 * Finds shortest paths from a source node to all other nodes in a weighted graph
 * with non-negative edge weights using a priority queue for efficiency.
 */

/**
 * Find shortest paths from source to all reachable nodes using Dijkstra's algorithm
 */
export function dijkstra(
    graph: Graph,
    source: NodeId,
    options: DijkstraOptions = {},
): Map<NodeId, ShortestPathResult> {
    if (!graph.hasNode(source)) {
        throw new Error(`Source node ${String(source)} not found in graph`);
    }

    const distances = new Map<NodeId, number>();
    const previous = new Map<NodeId, NodeId | null>();
    const visited = new Set<NodeId>();
    const pq = new PriorityQueue<NodeId>();

    // Initialize distances
    for (const node of graph.nodes()) {
        const distance = node.id === source ? 0 : Infinity;
        distances.set(node.id, distance);
        previous.set(node.id, null);
        pq.enqueue(node.id, distance);
    }

    while (!pq.isEmpty()) {
        const currentNode = pq.dequeue();
        if (currentNode === undefined) {
            break;
        }

        const currentDistance = distances.get(currentNode);
        if (currentDistance === undefined) {
            continue;
        }

        // Skip if already visited (can happen with priority queue updates)
        if (visited.has(currentNode)) {
            continue;
        }

        visited.add(currentNode);

        // Early termination if target reached
        if (options.target && currentNode === options.target) {
            break;
        }

        // Skip if this node is unreachable
        if (currentDistance === Infinity) {
            break;
        }

        // Check all neighbors
        for (const neighbor of graph.neighbors(currentNode)) {
            if (visited.has(neighbor)) {
                continue;
            }

            const edge = graph.getEdge(currentNode, neighbor);
            if (!edge) {
                continue;
            }

            const edgeWeight = edge.weight ?? 1;

            if (edgeWeight < 0) {
                throw new Error("Dijkstra's algorithm does not support negative edge weights");
            }

            const tentativeDistance = currentDistance + edgeWeight;
            const neighborDistance = distances.get(neighbor);
            if (neighborDistance === undefined) {
                continue;
            }

            // Found a shorter path
            if (tentativeDistance < neighborDistance) {
                distances.set(neighbor, tentativeDistance);
                previous.set(neighbor, currentNode);
                // Add to priority queue with new distance
                pq.enqueue(neighbor, tentativeDistance);
            }
        }
    }

    // Build results
    const results = new Map<NodeId, ShortestPathResult>();

    for (const [nodeId, distance] of distances) {
        if (distance < Infinity) {
            const path = reconstructPath(nodeId, previous);
            results.set(nodeId, {
                distance,
                path,
                predecessor: new Map(previous),
            });
        }
    }

    return results;
}

/**
 * Find shortest path between two specific nodes using Dijkstra's algorithm
 */
export function dijkstraPath(
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

    const results = dijkstra(graph, source, {target});
    return results.get(target) ?? null;
}

/**
 * Single-source shortest paths with early termination optimization
 */
export function singleSourceShortestPath(
    graph: Graph,
    source: NodeId,
    cutoff?: number,
): Map<NodeId, number> {
    if (!graph.hasNode(source)) {
        throw new Error(`Source node ${String(source)} not found in graph`);
    }

    const distances = new Map<NodeId, number>();
    const visited = new Set<NodeId>();
    const pq = new PriorityQueue<NodeId>();

    // Initialize distances
    for (const node of graph.nodes()) {
        const distance = node.id === source ? 0 : Infinity;
        distances.set(node.id, distance);
        pq.enqueue(node.id, distance);
    }

    while (!pq.isEmpty()) {
        const currentNode = pq.dequeue();
        if (currentNode === undefined) {
            break;
        }

        const currentDistance = distances.get(currentNode);
        if (currentDistance === undefined) {
            continue;
        }

        // Skip if already visited
        if (visited.has(currentNode)) {
            continue;
        }

        visited.add(currentNode);

        // Skip if unreachable or beyond cutoff
        if (currentDistance === Infinity || (cutoff !== undefined && currentDistance > cutoff)) {
            break;
        }

        // Check all neighbors
        for (const neighbor of graph.neighbors(currentNode)) {
            if (visited.has(neighbor)) {
                continue;
            }

            const edge = graph.getEdge(currentNode, neighbor);
            if (!edge) {
                continue;
            }

            const edgeWeight = edge.weight ?? 1;
            const tentativeDistance = currentDistance + edgeWeight;
            const neighborDistance = distances.get(neighbor);
            if (neighborDistance === undefined) {
                continue;
            }

            // Found a shorter path
            if (tentativeDistance < neighborDistance) {
                distances.set(neighbor, tentativeDistance);
                pq.enqueue(neighbor, tentativeDistance);
            }
        }
    }

    // Filter out unreachable nodes and apply cutoff
    const result = new Map<NodeId, number>();

    for (const [nodeId, distance] of distances) {
        if (distance < Infinity && (cutoff === undefined || distance <= cutoff)) {
            result.set(nodeId, distance);
        }
    }

    return result;
}

/**
 * All-pairs shortest paths using repeated Dijkstra
 * Note: For dense graphs, consider Floyd-Warshall algorithm instead
 */
export function allPairsShortestPath(graph: Graph): Map<NodeId, Map<NodeId, number>> {
    const results = new Map<NodeId, Map<NodeId, number>>();

    for (const node of graph.nodes()) {
        const distances = singleSourceShortestPath(graph, node.id);
        results.set(node.id, distances);
    }

    return results;
}

/**
 * Reconstruct path from predecessor map
 */
function reconstructPath(target: NodeId, previous: Map<NodeId, NodeId | null>): NodeId[] {
    const path: NodeId[] = [];
    let current: NodeId | null = target;

    while (current !== null) {
        path.unshift(current);
        current = previous.get(current) ?? null;
    }

    return path;
}
