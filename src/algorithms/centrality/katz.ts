import type {Graph} from "../../core/graph.js";
import type {CentralityOptions, CentralityResult} from "../../types/index.js";

/**
 * Katz centrality implementation
 *
 * A generalization of eigenvector centrality that gives each node a base amount
 * of influence regardless of its position in the network. Uses an attenuation
 * factor (alpha) to control how much a node's centrality depends on its neighbors.
 *
 * Katz centrality = alpha * sum(neighbors' centrality) + beta
 *
 * Time complexity: O(V + E) per iteration
 * Space complexity: O(V)
 */

export interface KatzCentralityOptions extends CentralityOptions {
    alpha?: number; // Attenuation factor (default: 0.1)
    beta?: number; // Base centrality weight (default: 1.0)
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number; // Convergence tolerance (default: 1e-6)
}

/**
 * Calculate Katz centrality for all nodes in the graph
 * Uses iterative method to compute centrality scores
 */
export function katzCentrality(
    graph: Graph,
    options: KatzCentralityOptions = {},
): CentralityResult {
    const {
        alpha = 0.1,
        beta = 1.0,
        maxIterations = 100,
        tolerance = 1e-6,
        normalized = true,
    } = options;

    const centrality: CentralityResult = {};
    const nodes = Array.from(graph.nodes());
    const nodeIds = nodes.map((node) => node.id);

    if (nodeIds.length === 0) {
        return centrality;
    }

    // Check if alpha is valid (should be less than 1/lambda_max)
    // For simplicity, we'll trust the user's choice or use conservative default

    // Initialize centrality scores
    let currentScores = new Map<string, number>();
    let previousScores = new Map<string, number>();

    // Start with beta for all nodes
    for (const nodeId of nodeIds) {
        currentScores.set(nodeId.toString(), beta);
    }

    // Iterative computation
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        previousScores = new Map(currentScores);
        currentScores = new Map();

        // Update each node's centrality
        for (const nodeId of nodeIds) {
            let sum = 0;

            // For directed graphs, use in-neighbors
            // For undirected graphs, use all neighbors
            const neighbors = graph.isDirected ?
                Array.from(graph.inNeighbors(nodeId)) :
                graph.neighbors(nodeId);

            for (const neighbor of neighbors) {
                const neighborKey = neighbor.toString();
                sum += previousScores.get(neighborKey) ?? 0;
            }

            currentScores.set(nodeId.toString(), (alpha * sum) + beta);
        }

        // Check for convergence
        let maxDiff = 0;
        for (const [nodeId, value] of Array.from(currentScores)) {
            const prevValue = previousScores.get(nodeId) ?? 0;
            const diff = Math.abs(value - prevValue);
            maxDiff = Math.max(maxDiff, diff);
        }

        if (maxDiff < tolerance) {
            break;
        }
    }

    // Prepare results
    for (const [nodeId, value] of Array.from(currentScores)) {
        centrality[nodeId] = value;
    }

    // Normalize if requested
    if (normalized) {
        let maxValue = 0;
        let minValue = Number.POSITIVE_INFINITY;

        for (const value of Object.values(centrality)) {
            maxValue = Math.max(maxValue, value);
            minValue = Math.min(minValue, value);
        }

        const range = maxValue - minValue;
        if (range > 0) {
            for (const nodeId of Object.keys(centrality)) {
                const centralityValue = centrality[nodeId];
                if (centralityValue !== undefined) {
                    centrality[nodeId] = (centralityValue - minValue) / range;
                }
            }
        }
    }

    return centrality;
}

/**
 * Calculate Katz centrality for a specific node
 */
export function nodeKatzCentrality(
    graph: Graph,
    nodeId: string | number,
    options: KatzCentralityOptions = {},
): number {
    if (!graph.hasNode(nodeId)) {
        throw new Error(`Node ${String(nodeId)} not found in graph`);
    }

    const centrality = katzCentrality(graph, options);
    return centrality[nodeId.toString()] ?? 0;
}
