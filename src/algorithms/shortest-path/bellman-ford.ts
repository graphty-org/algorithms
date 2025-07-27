import type {Graph} from "../../core/graph.js";
import type {NodeId, ShortestPathResult} from "../../types/index.js";
import {reconstructPath} from "../../utils/graph-utilities.js";

/**
 * Bellman-Ford algorithm implementation for single-source shortest paths
 *
 * Finds shortest paths from a source node to all other nodes in a weighted graph.
 * Unlike Dijkstra's algorithm, it can handle negative edge weights and detect
 * negative cycles.
 */

/**
 * Bellman-Ford algorithm options
 */
export interface BellmanFordOptions {
    /**
     * Target node for early termination (optional)
     */
    target?: NodeId;
}

/**
 * Result of Bellman-Ford algorithm
 */
export interface BellmanFordResult {
    /**
     * Distance from source to each reachable node
     */
    distances: Map<NodeId, number>;
    /**
     * Predecessor of each node in shortest path tree
     */
    predecessors: Map<NodeId, NodeId | null>;
    /**
     * Whether a negative cycle was detected
     */
    hasNegativeCycle: boolean;
    /**
     * Nodes involved in negative cycle (if any)
     */
    negativeCycleNodes: NodeId[];
}

/**
 * Find shortest paths from source using Bellman-Ford algorithm
 */
export function bellmanFord(
    graph: Graph,
    source: NodeId,
    options: BellmanFordOptions = {},
): BellmanFordResult {
    if (!graph.hasNode(source)) {
        throw new Error(`Source node ${String(source)} not found in graph`);
    }

    const distances = new Map<NodeId, number>();
    const predecessors = new Map<NodeId, NodeId | null>();
    const nodes = Array.from(graph.nodes()).map((node) => node.id);

    // Initialize distances
    for (const nodeId of nodes) {
        distances.set(nodeId, nodeId === source ? 0 : Infinity);
        predecessors.set(nodeId, null);
    }

    // Relax edges |V| - 1 times
    for (let i = 0; i < nodes.length - 1; i++) {
        let updated = false;

        for (const edge of Array.from(graph.edges())) {
            const u = edge.source;
            const v = edge.target;
            const weight = edge.weight ?? 1;

            const distanceU = distances.get(u);
            const distanceV = distances.get(v);

            if (distanceU !== undefined && distanceV !== undefined && distanceU !== Infinity) {
                const newDistance = distanceU + weight;

                if (newDistance < distanceV) {
                    distances.set(v, newDistance);
                    predecessors.set(v, u);
                    updated = true;

                    // Early termination if target reached
                    if (options.target && v === options.target) {
                        break;
                    }
                }
            }
        }

        // If no update in this iteration, we can stop early
        if (!updated) {
            break;
        }
    }

    // Check for negative cycles
    const negativeCycleNodes: NodeId[] = [];
    let hasNegativeCycle = false;

    for (const edge of graph.edges()) {
        const u = edge.source;
        const v = edge.target;
        const weight = edge.weight ?? 1;

        const distanceU = distances.get(u);
        const distanceV = distances.get(v);

        if (distanceU !== undefined && distanceV !== undefined && distanceU !== Infinity) {
            const newDistance = distanceU + weight;

            if (newDistance < distanceV) {
                hasNegativeCycle = true;
                negativeCycleNodes.push(v);
            }
        }
    }

    return {
        distances,
        predecessors,
        hasNegativeCycle,
        negativeCycleNodes,
    };
}

/**
 * Find shortest path between two specific nodes using Bellman-Ford
 */
export function bellmanFordPath(
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

    const result = bellmanFord(graph, source, {target});

    if (result.hasNegativeCycle) {
        throw new Error("Graph contains a negative cycle");
    }

    const distance = result.distances.get(target);

    if (distance === undefined || distance === Infinity) {
        return null; // No path exists
    }

    // Reconstruct path
    const path = reconstructPath(target, result.predecessors);

    return {
        distance,
        path,
        predecessor: result.predecessors,
    };
}

/**
 * Check if graph has negative cycles using Bellman-Ford
 */
export function hasNegativeCycle(graph: Graph): boolean {
    const nodes = Array.from(graph.nodes());

    if (nodes.length === 0) {
        return false;
    }

    // Need to check from multiple sources in case of disconnected components
    const checked = new Set<NodeId>();

    for (const node of nodes) {
        if (!checked.has(node.id)) {
            const result = bellmanFord(graph, node.id);

            if (result.hasNegativeCycle) {
                return true;
            }

            // Mark all reachable nodes as checked
            for (const [nodeId, distance] of Array.from(result.distances)) {
                if (distance !== Infinity) {
                    checked.add(nodeId);
                }
            }
        }
    }

    return false;
}

