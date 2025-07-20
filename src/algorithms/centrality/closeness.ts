import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * Closeness centrality implementation
 *
 * Measures how close a node is to all other nodes in the graph.
 * Uses BFS to compute shortest path distances efficiently.
 */

/**
 * Closeness centrality options
 */
export interface ClosenessCentralityOptions {
    /**
     * Whether to normalize the centrality values (default: false)
     */
    normalized?: boolean;
    /**
     * Use harmonic mean instead of reciprocal of sum (default: false)
     * Better for disconnected graphs
     */
    harmonic?: boolean;
    /**
     * Consider only nodes within this distance (default: undefined = all nodes)
     */
    cutoff?: number;
}

/**
 * Calculate closeness centrality for all nodes
 */
export function closenessCentrality(
    graph: Graph,
    options: ClosenessCentralityOptions = {},
): Record<string, number> {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const centrality: Record<string, number> = {};

    for (const sourceNode of nodes) {
        centrality[String(sourceNode)] = nodeClosenessCentrality(graph, sourceNode, options);
    }

    return centrality;
}

/**
 * Calculate closeness centrality for a specific node
 */
export function nodeClosenessCentrality(
    graph: Graph,
    node: NodeId,
    options: ClosenessCentralityOptions = {},
): number {
    if (!graph.hasNode(node)) {
        throw new Error(`Node ${String(node)} not found in graph`);
    }

    const distances = singleSourceShortestPathLengths(graph, node, options.cutoff);
    
    if (distances.size <= 1) {
        return 0; // No other nodes reachable
    }

    let centrality = 0;

    if (options.harmonic) {
        // Harmonic centrality: sum of reciprocals of distances
        for (const [targetNode, distance] of distances) {
            if (targetNode !== node && distance > 0) {
                centrality += 1 / distance;
            }
        }
    } else {
        // Standard closeness: reciprocal of sum of distances
        let totalDistance = 0;
        let reachableNodes = 0;

        for (const [targetNode, distance] of distances) {
            if (targetNode !== node) {
                totalDistance += distance;
                reachableNodes++;
            }
        }

        if (totalDistance > 0) {
            centrality = 1 / totalDistance;

            // Wasserman and Faust normalization for disconnected graphs
            if (options.normalized) {
                const n = Array.from(graph.nodes()).length;
                centrality = centrality * reachableNodes / (n - 1);
            }
        }
    }

    // Normalization for harmonic centrality
    if (options.harmonic && options.normalized) {
        const n = Array.from(graph.nodes()).length;
        if (n > 1) {
            centrality = centrality / (n - 1);
        }
    }

    return centrality;
}

/**
 * Single-source shortest path lengths using BFS (for unweighted graphs)
 */
function singleSourceShortestPathLengths(
    graph: Graph,
    source: NodeId,
    cutoff?: number,
): Map<NodeId, number> {
    const distances = new Map<NodeId, number>();
    const visited = new Set<NodeId>();
    const queue: {node: NodeId, distance: number}[] = [];

    // Initialize
    queue.push({node: source, distance: 0});
    visited.add(source);
    distances.set(source, 0);

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
            break;
        }

        // Skip if beyond cutoff
        if (cutoff !== undefined && current.distance >= cutoff) {
            continue;
        }

        // Explore neighbors
        for (const neighbor of graph.neighbors(current.node)) {
            if (!visited.has(neighbor)) {
                const newDistance = current.distance + 1;

                // Skip if beyond cutoff
                if (cutoff !== undefined && newDistance > cutoff) {
                    continue;
                }

                visited.add(neighbor);
                distances.set(neighbor, newDistance);
                queue.push({node: neighbor, distance: newDistance});
            }
        }
    }

    return distances;
}

/**
 * Calculate weighted closeness centrality using Dijkstra's algorithm
 */
export function weightedClosenessCentrality(
    graph: Graph,
    options: ClosenessCentralityOptions = {},
): Record<string, number> {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const centrality: Record<string, number> = {};

    for (const sourceNode of nodes) {
        centrality[String(sourceNode)] = nodeWeightedClosenessCentrality(graph, sourceNode, options);
    }

    return centrality;
}

/**
 * Calculate weighted closeness centrality for a specific node using Dijkstra
 */
export function nodeWeightedClosenessCentrality(
    graph: Graph,
    node: NodeId,
    options: ClosenessCentralityOptions = {},
): number {
    if (!graph.hasNode(node)) {
        throw new Error(`Node ${String(node)} not found in graph`);
    }

    const distances = dijkstraDistances(graph, node, options.cutoff);
    
    if (distances.size <= 1) {
        return 0; // No other nodes reachable
    }

    let centrality = 0;

    if (options.harmonic) {
        // Harmonic centrality: sum of reciprocals of distances
        for (const [targetNode, distance] of distances) {
            if (targetNode !== node && distance > 0 && distance < Infinity) {
                centrality += 1 / distance;
            }
        }
    } else {
        // Standard closeness: reciprocal of sum of distances
        let totalDistance = 0;
        let reachableNodes = 0;

        for (const [targetNode, distance] of distances) {
            if (targetNode !== node && distance < Infinity) {
                totalDistance += distance;
                reachableNodes++;
            }
        }

        if (totalDistance > 0) {
            centrality = 1 / totalDistance;

            // Wasserman and Faust normalization for disconnected graphs
            if (options.normalized) {
                const n = Array.from(graph.nodes()).length;
                centrality = centrality * reachableNodes / (n - 1);
            }
        }
    }

    // Normalization for harmonic centrality
    if (options.harmonic && options.normalized) {
        const n = Array.from(graph.nodes()).length;
        if (n > 1) {
            centrality = centrality / (n - 1);
        }
    }

    return centrality;
}

/**
 * Single-source shortest path distances using Dijkstra's algorithm
 */
function dijkstraDistances(
    graph: Graph,
    source: NodeId,
    cutoff?: number,
): Map<NodeId, number> {
    const distances = new Map<NodeId, number>();
    const visited = new Set<NodeId>();
    const pq: {node: NodeId, distance: number}[] = [];

    // Initialize distances
    for (const node of graph.nodes()) {
        distances.set(node.id, node.id === source ? 0 : Infinity);
    }

    pq.push({node: source, distance: 0});

    while (pq.length > 0) {
        // Simple priority queue (could be optimized with a proper heap)
        pq.sort((a, b) => a.distance - b.distance);
        const current = pq.shift();

        if (!current || visited.has(current.node)) {
            continue;
        }

        visited.add(current.node);

        // Skip if beyond cutoff
        if (cutoff !== undefined && current.distance > cutoff) {
            continue;
        }

        // Explore neighbors
        for (const neighbor of graph.neighbors(current.node)) {
            if (visited.has(neighbor)) {
                continue;
            }

            const edge = graph.getEdge(current.node, neighbor);
            if (!edge) {
                continue;
            }

            const edgeWeight = edge.weight ?? 1;
            const tentativeDistance = current.distance + edgeWeight;
            const currentDistance = distances.get(neighbor) ?? Infinity;

            if (tentativeDistance < currentDistance) {
                distances.set(neighbor, tentativeDistance);
                
                // Skip if beyond cutoff
                if (cutoff === undefined || tentativeDistance <= cutoff) {
                    pq.push({node: neighbor, distance: tentativeDistance});
                }
            }
        }
    }

    return distances;
}