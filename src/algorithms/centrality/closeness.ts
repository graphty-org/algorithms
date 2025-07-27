import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";
import {bfsDistancesOnly, bfsWeightedDistances} from "../traversal/bfs-variants.js";

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
 * Calculate closeness centrality from distances
 */
function calculateClosenessFromDistances(
    distances: Map<NodeId, number>,
    sourceNode: NodeId,
    totalNodes: number,
    options: ClosenessCentralityOptions,
): number {
    if (distances.size <= 1) {
        return 0; // No other nodes reachable
    }

    let centrality = 0;

    if (options.harmonic) {
        // Harmonic centrality: sum of reciprocals of distances
        for (const [targetNode, distance] of distances) {
            if (targetNode !== sourceNode && distance > 0 && distance < Infinity) {
                centrality += 1 / distance;
            }
        }

        // Normalization for harmonic centrality
        if (options.normalized && totalNodes > 1) {
            centrality = centrality / (totalNodes - 1);
        }
    } else {
        // Standard closeness: reciprocal of sum of distances
        let totalDistance = 0;
        let reachableNodes = 0;

        for (const [targetNode, distance] of distances) {
            if (targetNode !== sourceNode && distance < Infinity) {
                totalDistance += distance;
                reachableNodes++;
            }
        }

        if (totalDistance > 0) {
            centrality = 1 / totalDistance;

            // Wasserman and Faust normalization for disconnected graphs
            if (options.normalized && totalNodes > 1) {
                centrality = centrality * reachableNodes / (totalNodes - 1);
            }
        }
    }

    return centrality;
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

    // Use optimized BFS variant for unweighted graphs
    const distances = bfsDistancesOnly(graph, node, options.cutoff);
    const totalNodes = graph.nodeCount;

    return calculateClosenessFromDistances(distances, node, totalNodes, options);
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

    // Use optimized weighted BFS variant (simplified Dijkstra)
    const distances = bfsWeightedDistances(graph, node, options.cutoff);
    const totalNodes = graph.nodeCount;

    return calculateClosenessFromDistances(distances, node, totalNodes, options);
}
