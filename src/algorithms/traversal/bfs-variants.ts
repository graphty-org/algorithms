import type {Graph} from "../../core/graph.js";
import {PriorityQueue} from "../../data-structures/priority-queue.js";
import {CSRGraph} from "../../optimized/csr-graph.js";
import {DirectionOptimizedBFS} from "../../optimized/direction-optimized-bfs.js";
import {toCSRGraph} from "../../optimized/graph-adapter.js";
import type {NodeId} from "../../types/index.js";

/**
 * BFS that tracks shortest path counts (for betweenness centrality)
 *
 * This variant of BFS computes:
 * - Shortest distances from source to all reachable nodes
 * - All predecessors on shortest paths
 * - Number of shortest paths (sigma)
 * - Stack of nodes in reverse BFS order
 */
export function bfsWithPathCounting(
    graph: Graph,
    source: NodeId,
    options: {optimized?: boolean} = {},
): {
        distances: Map<NodeId, number>;
        predecessors: Map<NodeId, NodeId[]>;
        sigma: Map<NodeId, number>;
        stack: NodeId[];
    } {
    const useOptimized = options.optimized ?? false;

    // Use CSR format for large graphs
    if (useOptimized && graph.nodeCount > 10000) {
        const csrGraph = toCSRGraph(graph);
        return bfsWithPathCountingCSR(csrGraph, source);
    }

    const distances = new Map<NodeId, number>();
    const predecessors = new Map<NodeId, NodeId[]>();
    const sigma = new Map<NodeId, number>();
    const stack: NodeId[] = [];
    const queue: NodeId[] = [];

    // Initialize
    distances.set(source, 0);
    sigma.set(source, 1);
    queue.push(source);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) {
            continue;
        }

        stack.push(current);

        const currentDistance = distances.get(current) ?? 0;
        const currentSigma = sigma.get(current) ?? 0;

        // Process neighbors
        const neighbors = graph.neighbors(current);
        for (const neighbor of neighbors) {
            // First time visiting this neighbor
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDistance + 1);
                queue.push(neighbor);
            }

            // Found a shortest path to neighbor
            if (distances.get(neighbor) === currentDistance + 1) {
                const neighborSigma = sigma.get(neighbor) ?? 0;
                sigma.set(neighbor, neighborSigma + currentSigma);

                const preds = predecessors.get(neighbor) ?? [];
                preds.push(current);
                predecessors.set(neighbor, preds);
            }
        }
    }

    return {
        distances,
        predecessors,
        sigma,
        stack,
    };
}

/**
 * BFS that only returns distances (for closeness centrality)
 *
 * Optimized variant that skips predecessor tracking
 */
export function bfsDistancesOnly(
    graph: Graph,
    source: NodeId,
    cutoff?: number,
    options: {optimized?: boolean} = {},
): Map<NodeId, number> {
    const useOptimized = options.optimized ?? false;

    // Use CSR format for large graphs
    if (useOptimized && graph.nodeCount > 10000) {
        const csrGraph = toCSRGraph(graph);
        return bfsDistancesOnlyCSR(csrGraph, source, cutoff);
    }

    const distances = new Map<NodeId, number>();
    const queue: NodeId[] = [];

    distances.set(source, 0);
    queue.push(source);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) {
            continue;
        }

        const currentDistance = distances.get(current) ?? 0;

        // Stop if we've reached the cutoff distance
        if (cutoff !== undefined && currentDistance >= cutoff) {
            continue;
        }

        const neighbors = graph.neighbors(current);
        for (const neighbor of neighbors) {
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDistance + 1);
                queue.push(neighbor);
            }
        }
    }

    return distances;
}

/**
 * BFS for bipartite checking with partition sets
 *
 * Returns whether the graph is bipartite and the two partitions if it is
 */
export function bfsColoringWithPartitions(
    graph: Graph,
): {
        isBipartite: boolean;
        partitions?: [Set<NodeId>, Set<NodeId>];
    } {
    const colors = new Map<NodeId, number>();
    const partitionA = new Set<NodeId>();
    const partitionB = new Set<NodeId>();

    // Handle disconnected components
    for (const node of graph.nodes()) {
        if (!colors.has(node.id)) {
            const queue: NodeId[] = [node.id];
            colors.set(node.id, 0);
            partitionA.add(node.id);

            while (queue.length > 0) {
                const current = queue.shift();
                if (current === undefined) {
                    continue;
                }

                const currentColor = colors.get(current) ?? 0;
                const nextColor = 1 - currentColor;

                for (const neighbor of graph.neighbors(current)) {
                    if (!colors.has(neighbor)) {
                        colors.set(neighbor, nextColor);
                        queue.push(neighbor);

                        if (nextColor === 0) {
                            partitionA.add(neighbor);
                        } else {
                            partitionB.add(neighbor);
                        }
                    } else if (colors.get(neighbor) === currentColor) {
                        // Same color as current node - not bipartite
                        return {isBipartite: false};
                    }
                }
            }
        }
    }

    return {
        isBipartite: true,
        partitions: [partitionA, partitionB],
    };
}

/**
 * BFS for finding augmenting paths (for flow algorithms)
 *
 * Finds a path from source to sink in a residual graph with positive capacity
 */
export function bfsAugmentingPath(
    residualGraph: Map<string, Map<string, number>>,
    source: string,
    sink: string,
): {
    path: string[];
    pathCapacity: number;
} | null {
    const parent = new Map<string, string | null>();
    const queue: string[] = [];

    parent.set(source, null);
    queue.push(source);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) {
            continue;
        }

        if (current === sink) {
            // Reconstruct path
            const path: string[] = [];
            let node: string | null = sink;
            let pathCapacity = Infinity;

            while (node !== null) {
                path.unshift(node);
                const parentNode = parent.get(node);

                if (parentNode !== null && parentNode !== undefined) {
                    const capacity = residualGraph.get(parentNode)?.get(node) ?? 0;
                    pathCapacity = Math.min(pathCapacity, capacity);
                }

                node = parentNode ?? null;
            }

            return {path, pathCapacity};
        }

        const neighbors = residualGraph.get(current);
        if (neighbors) {
            for (const [neighbor, capacity] of neighbors) {
                if (!parent.has(neighbor) && capacity > 0) {
                    parent.set(neighbor, current);
                    queue.push(neighbor);
                }
            }
        }
    }

    return null;
}

/**
 * BFS for weighted graphs using priority queue (simplified Dijkstra)
 *
 * Returns distances from source using edge weights
 */
export function bfsWeightedDistances(
    graph: Graph,
    source: NodeId,
    cutoff?: number,
    options: {optimized?: boolean} = {},
): Map<NodeId, number> {
    const useOptimized = options.optimized ?? false;

    // Use CSR format for large graphs
    if (useOptimized && graph.nodeCount > 10000) {
        const csrGraph = toCSRGraph(graph);
        return bfsWeightedDistancesCSR(csrGraph, source, cutoff);
    }

    const distances = new Map<NodeId, number>();
    const visited = new Set<NodeId>();

    // Use efficient priority queue instead of array-based queue
    const queue = new PriorityQueue<NodeId>();

    distances.set(source, 0);
    queue.enqueue(source, 0);

    while (!queue.isEmpty()) {
        const current = queue.dequeue();
        if (current === undefined) {
            continue;
        }

        const currentDist = distances.get(current) ?? 0;

        if (visited.has(current)) {
            continue;
        }

        visited.add(current);

        // Stop if we've reached the cutoff distance
        if (cutoff !== undefined && currentDist >= cutoff) {
            continue;
        }

        for (const neighbor of graph.neighbors(current)) {
            if (!visited.has(neighbor)) {
                const edge = graph.getEdge(current, neighbor);
                const weight = edge?.weight ?? 1;
                const newDistance = currentDist + weight;

                const oldDistance = distances.get(neighbor);
                if (oldDistance === undefined || newDistance < oldDistance) {
                    distances.set(neighbor, newDistance);
                    queue.enqueue(neighbor, newDistance);
                }
            }
        }
    }

    return distances;
}

/**
 * CSR-optimized version of bfsWithPathCounting
 */
function bfsWithPathCountingCSR(
    graph: CSRGraph,
    source: NodeId,
): {
        distances: Map<NodeId, number>;
        predecessors: Map<NodeId, NodeId[]>;
        sigma: Map<NodeId, number>;
        stack: NodeId[];
    } {
    const distances = new Map<NodeId, number>();
    const predecessors = new Map<NodeId, NodeId[]>();
    const sigma = new Map<NodeId, number>();
    const stack: NodeId[] = [];
    const queue: NodeId[] = [];

    // Initialize
    distances.set(source, 0);
    sigma.set(source, 1);
    queue.push(source);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) {
            continue;
        }

        stack.push(current);

        const currentDistance = distances.get(current) ?? 0;
        const currentSigma = sigma.get(current) ?? 0;

        // Process neighbors using CSR iteration
        for (const neighbor of graph.neighbors(current)) {
            // First time visiting this neighbor
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDistance + 1);
                queue.push(neighbor);
            }

            // Found a shortest path to neighbor
            if (distances.get(neighbor) === currentDistance + 1) {
                const neighborSigma = sigma.get(neighbor) ?? 0;
                sigma.set(neighbor, neighborSigma + currentSigma);

                const preds = predecessors.get(neighbor) ?? [];
                preds.push(current);
                predecessors.set(neighbor, preds);
            }
        }
    }

    return {
        distances,
        predecessors,
        sigma,
        stack,
    };
}

/**
 * CSR-optimized version of bfsDistancesOnly
 */
function bfsDistancesOnlyCSR(
    graph: CSRGraph,
    source: NodeId,
    cutoff?: number,
): Map<NodeId, number> {
    // Use Direction-Optimized BFS for best performance
    if (graph.nodeCount() > 10000) {
        const dobfs = new DirectionOptimizedBFS(graph);
        const result = dobfs.search(source);

        // Filter by cutoff if specified
        if (cutoff !== undefined) {
            const filtered = new Map<NodeId, number>();
            for (const [nodeId, distance] of result.distances) {
                if (distance <= cutoff) {
                    filtered.set(nodeId, distance);
                }
            }
            return filtered;
        }

        return result.distances;
    }

    // Fallback to standard BFS on CSR
    const distances = new Map<NodeId, number>();
    const queue: NodeId[] = [];

    distances.set(source, 0);
    queue.push(source);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) {
            continue;
        }

        const currentDistance = distances.get(current) ?? 0;

        // Stop if we've reached the cutoff distance
        if (cutoff !== undefined && currentDistance >= cutoff) {
            continue;
        }

        for (const neighbor of graph.neighbors(current)) {
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDistance + 1);
                queue.push(neighbor);
            }
        }
    }

    return distances;
}

/**
 * CSR-optimized version of bfsWeightedDistances
 */
function bfsWeightedDistancesCSR(
    graph: CSRGraph,
    source: NodeId,
    cutoff?: number,
): Map<NodeId, number> {
    const distances = new Map<NodeId, number>();
    const visited = new Set<NodeId>();

    // Use efficient priority queue
    const queue = new PriorityQueue<NodeId>();

    distances.set(source, 0);
    queue.enqueue(source, 0);

    while (!queue.isEmpty()) {
        const current = queue.dequeue();
        if (current === undefined) {
            continue;
        }

        const currentDist = distances.get(current) ?? 0;

        if (visited.has(current)) {
            continue;
        }

        visited.add(current);

        // Stop if we've reached the cutoff distance
        if (cutoff !== undefined && currentDist >= cutoff) {
            continue;
        }

        for (const neighbor of graph.neighbors(current)) {
            if (!visited.has(neighbor)) {
                // CSRGraph doesn't have edge weights in the interface, default to 1
                const weight = 1;
                const newDistance = currentDist + weight;

                const oldDistance = distances.get(neighbor);
                if (oldDistance === undefined || newDistance < oldDistance) {
                    distances.set(neighbor, newDistance);
                    queue.enqueue(neighbor, newDistance);
                }
            }
        }
    }

    return distances;
}
