import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";
import {bfsWithPathCounting} from "../traversal/bfs-variants.js";

/**
 * Betweenness centrality implementation using Brandes' algorithm
 *
 * Measures the extent to which a node lies on paths between other nodes.
 * Uses the fast O(VE) algorithm by Ulrik Brandes.
 */

/**
 * Betweenness centrality options
 */
export interface BetweennessCentralityOptions {
    /**
     * Whether to normalize the centrality values (default: false)
     */
    normalized?: boolean;
    /**
     * Whether to use endpoints in path counting (default: false)
     */
    endpoints?: boolean;
    /**
     * Whether to use optimized BFS implementation for large graphs
     */
    optimized?: boolean;
}

/**
 * Result of Brandes algorithm computation for a single source
 */
interface BrandesResult {
    stack: NodeId[];
    predecessors: Map<NodeId, NodeId[]>;
    sigma: Map<NodeId, number>;
    distance: Map<NodeId, number>;
}

/**
 * Run single-source shortest path computation using BFS
 */
function brandesSingleSource(graph: Graph, source: NodeId, optimized?: boolean): BrandesResult {
    const result = bfsWithPathCounting(graph, source, optimized !== undefined ? {optimized} : {});

    return {
        stack: result.stack,
        predecessors: result.predecessors,
        sigma: result.sigma,
        distance: result.distances,
    };
}

/**
 * Accumulate betweenness contributions from a single source
 */
function accumulateBetweenness(
    result: BrandesResult,
    source: NodeId,
    centrality: Record<string, number>,
    options: BetweennessCentralityOptions,
): void {
    const {stack, predecessors, sigma} = result;
    const delta = new Map<NodeId, number>();

    // Initialize delta
    for (const node of stack) {
        delta.set(node, 0);
    }

    // Accumulation - back-propagation of dependencies
    // Process nodes in reverse BFS order
    for (let i = stack.length - 1; i >= 0; i--) {
        const w = stack[i];
        if (!w) {
            continue;
        }

        const wPreds = predecessors.get(w) ?? [];
        const wSigma = sigma.get(w) ?? 0;
        const wDelta = delta.get(w) ?? 0;

        for (const v of wPreds) {
            const vSigma = sigma.get(v) ?? 0;
            const vDelta = delta.get(v) ?? 0;

            if (vSigma > 0 && wSigma > 0) {
                let contribution = (vSigma / wSigma) * (1 + wDelta);

                // Apply endpoints option: when false, exclude endpoint contributions
                if (!options.endpoints) {
                    // For standard betweenness, don't count paths that only involve endpoints
                    const isTargetEndpoint = wPreds.length === 0 && w !== source;
                    if (isTargetEndpoint) {
                        contribution = 0; // Exclude endpoint contributions
                    }
                }

                delta.set(v, vDelta + contribution);
            }
        }

        if (w !== source) {
            const currentCentrality = centrality[String(w)] ?? 0;
            centrality[String(w)] = currentCentrality + wDelta;
        }
    }
}

/**
 * Accumulate edge betweenness contributions from a single source
 */
function accumulateEdgeBetweenness(
    result: BrandesResult,
    source: NodeId,
    edgeCentrality: Map<string, number>,
    options: BetweennessCentralityOptions,
): void {
    const {stack, predecessors, sigma} = result;
    const delta = new Map<NodeId, number>();

    // Initialize delta
    for (const node of stack) {
        delta.set(node, 0);
    }

    // Accumulation for edges
    // Process nodes in reverse BFS order
    for (let i = stack.length - 1; i >= 0; i--) {
        const w = stack[i];
        if (!w) {
            continue;
        }

        const wPreds = predecessors.get(w) ?? [];
        const wSigma = sigma.get(w) ?? 0;
        const wDelta = delta.get(w) ?? 0;

        for (const v of wPreds) {
            const vSigma = sigma.get(v) ?? 0;

            if (vSigma > 0 && wSigma > 0) {
                let edgeContribution = (vSigma / wSigma) * (1 + wDelta);

                // Apply endpoints option for edge betweenness
                if (!options.endpoints) {
                    const isTargetEndpoint = wPreds.length === 0 && w !== source;
                    if (isTargetEndpoint) {
                        edgeContribution = 0; // Exclude endpoint contributions
                    }
                }

                // Update edge centrality
                const edgeKey = `${String(v)}-${String(w)}`;
                const currentEdgeCentrality = edgeCentrality.get(edgeKey) ?? 0;
                edgeCentrality.set(edgeKey, currentEdgeCentrality + edgeContribution);

                // Update node delta
                const vDelta = delta.get(v) ?? 0;
                delta.set(v, vDelta + edgeContribution);
            }
        }
    }
}

/**
 * Apply normalization to centrality values
 */
function normalizeCentrality(
    centrality: Record<string, number>,
    nodeCount: number,
    isDirected: boolean,
): void {
    const n = nodeCount;
    const normalizationFactor = isDirected ?
        (n - 1) * (n - 2) :
        ((n - 1) * (n - 2)) / 2;

    if (normalizationFactor > 0) {
        for (const key in centrality) {
            const value = centrality[key];
            if (value !== undefined) {
                centrality[key] = value / normalizationFactor;
            }
        }
    }
}

/**
 * Calculate betweenness centrality for all nodes using Brandes' algorithm
 */
export function betweennessCentrality(
    graph: Graph,
    options: BetweennessCentralityOptions = {},
): Record<string, number> {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const centrality: Record<string, number> = {};

    // Initialize centrality scores
    for (const nodeId of nodes) {
        centrality[String(nodeId)] = 0;
    }

    // Brandes' algorithm - run from each source
    for (const source of nodes) {
        const result = brandesSingleSource(graph, source, options.optimized);
        accumulateBetweenness(result, source, centrality, options);
    }

    // For undirected graphs, divide by 2 (each shortest path is counted twice)
    if (!graph.isDirected) {
        for (const nodeId of nodes) {
            const key = String(nodeId);
            const value = centrality[key];
            if (value !== undefined) {
                centrality[key] = value / 2;
            }
        }
    }

    // Normalization
    if (options.normalized) {
        normalizeCentrality(centrality, nodes.length, graph.isDirected);
    }

    return centrality;
}

/**
 * Calculate betweenness centrality for a specific node
 */
export function nodeBetweennessCentrality(
    graph: Graph,
    targetNode: NodeId,
    options: BetweennessCentralityOptions = {},
): number {
    if (!graph.hasNode(targetNode)) {
        throw new Error(`Node ${String(targetNode)} not found in graph`);
    }

    const allCentralities = betweennessCentrality(graph, options);
    return allCentralities[String(targetNode)] ?? 0;
}

/**
 * Calculate edge betweenness centrality
 */
export function edgeBetweennessCentrality(
    graph: Graph,
    options: BetweennessCentralityOptions = {},
): Map<string, number> {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const edgeCentrality = new Map<string, number>();

    // Initialize edge centrality scores
    for (const edge of Array.from(graph.edges())) {
        const edgeKey = `${String(edge.source)}-${String(edge.target)}`;
        edgeCentrality.set(edgeKey, 0);
    }

    // Modified Brandes' algorithm for edge betweenness
    for (const source of nodes) {
        const result = brandesSingleSource(graph, source, options.optimized);
        accumulateEdgeBetweenness(result, source, edgeCentrality, options);
    }

    // For undirected graphs, divide by 2 (each shortest path is counted twice)
    if (!graph.isDirected) {
        for (const [edgeKey, centrality] of Array.from(edgeCentrality)) {
            edgeCentrality.set(edgeKey, centrality / 2);
        }
    }

    // Normalization for edges
    if (options.normalized) {
        const n = nodes.length;
        const normalizationFactor = graph.isDirected ?
            (n - 1) * (n - 2) :
            ((n - 1) * (n - 2)) / 2;

        if (normalizationFactor > 0) {
            for (const [edgeKey, centrality] of Array.from(edgeCentrality)) {
                edgeCentrality.set(edgeKey, centrality / normalizationFactor);
            }
        }
    }

    return edgeCentrality;
}
