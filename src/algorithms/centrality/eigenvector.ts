import type {Graph} from "../../core/graph.js";
import type {CentralityOptions, CentralityResult} from "../../types/index.js";

/**
 * Eigenvector centrality implementation
 *
 * Measures the influence of a node based on the influence of its neighbors.
 * A node has high eigenvector centrality if it is connected to nodes
 * that themselves have high eigenvector centrality.
 *
 * Time complexity: O(V + E) per iteration
 * Space complexity: O(V)
 */

export interface EigenvectorCentralityOptions extends CentralityOptions {
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number; // Convergence tolerance (default: 1e-6)
    startVector?: Map<string, number>; // Initial vector (optional)
}

/**
 * Calculate eigenvector centrality for all nodes in the graph
 * Uses the power iteration method to find the dominant eigenvector
 */
export function eigenvectorCentrality(
    graph: Graph,
    options: EigenvectorCentralityOptions = {},
): CentralityResult {
    const {
        maxIterations = 100,
        tolerance = 1e-6,
        normalized = true,
        startVector,
    } = options;

    const centrality: CentralityResult = {};
    const nodes = Array.from(graph.nodes());
    const nodeIds = nodes.map((node) => node.id);

    if (nodeIds.length === 0) {
        return centrality;
    }

    // Initialize the eigenvector
    let currentVector = new Map<string, number>();
    let previousVector = new Map<string, number>();

    if (startVector) {
        // Use provided start vector
        for (const nodeId of nodeIds) {
            const key = nodeId.toString();
            currentVector.set(key, startVector.get(key) ?? 1.0 / Math.sqrt(nodeIds.length));
        }
    } else {
        // Initialize with uniform distribution
        const initialValue = 1.0 / Math.sqrt(nodeIds.length);
        for (const nodeId of nodeIds) {
            currentVector.set(nodeId.toString(), initialValue);
        }
    }

    // Power iteration
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        previousVector = new Map(currentVector);
        currentVector = new Map();

        // Update each node's centrality based on neighbors
        for (const nodeId of nodeIds) {
            let sum = 0;
            const neighbors = Array.from(graph.neighbors(nodeId));

            for (const neighbor of neighbors) {
                const neighborKey = neighbor.toString();
                const prevValue = previousVector.get(neighborKey);
                sum += prevValue ?? 0;
            }

            currentVector.set(nodeId.toString(), sum);
        }

        // Normalize the vector
        let norm = 0;
        for (const value of Array.from(currentVector.values())) {
            norm += value * value;
        }
        norm = Math.sqrt(norm);

        if (norm === 0) {
            // Graph has no edges or is disconnected
            for (const nodeId of nodeIds) {
                centrality[nodeId.toString()] = 0;
            }
            return centrality;
        }

        // Normalize the vector
        for (const [nodeId, value] of Array.from(currentVector)) {
            currentVector.set(nodeId, value / norm);
        }

        // Check for convergence
        let maxDiff = 0;
        for (const [nodeId, value] of Array.from(currentVector)) {
            const prevValue = previousVector.get(nodeId) ?? 0;
            const diff = Math.abs(value - prevValue);
            maxDiff = Math.max(maxDiff, diff);
        }

        if (maxDiff < tolerance) {
            break;
        }
    }

    // Prepare results
    for (const [nodeId, value] of Array.from(currentVector)) {
        centrality[nodeId] = value;
    }

    // Additional normalization if requested (normalize to [0,1] range)
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
        } else {
            // All values are the same, set to 1
            for (const nodeId of Object.keys(centrality)) {
                centrality[nodeId] = maxValue > 0 ? 1 : 0;
            }
        }
    }

    return centrality;
}

/**
 * Calculate eigenvector centrality for a specific node
 */
export function nodeEigenvectorCentrality(
    graph: Graph,
    nodeId: string | number,
    options: EigenvectorCentralityOptions = {},
): number {
    if (!graph.hasNode(nodeId)) {
        throw new Error(`Node ${String(nodeId)} not found in graph`);
    }

    const centrality = eigenvectorCentrality(graph, options);
    return centrality[nodeId.toString()] ?? 0;
}
