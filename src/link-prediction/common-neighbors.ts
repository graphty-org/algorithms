import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";

/**
 * Common Neighbors link prediction implementation
 *
 * Predicts the likelihood of a link between two nodes based on the number
 * of common neighbors they share. The intuition is that nodes with many
 * common neighbors are more likely to be connected.
 *
 * Time complexity: O(k²) where k is the average degree
 * Space complexity: O(k)
 */

export interface LinkPredictionScore {
    source: NodeId;
    target: NodeId;
    score: number;
}

export interface LinkPredictionOptions {
    directed?: boolean; // Consider direction (default: false)
    includeExisting?: boolean; // Include existing edges (default: false)
    topK?: number; // Return only top K predictions
}

/**
 * Calculate common neighbors score for a pair of nodes
 */
export function commonNeighborsScore(
    graph: Graph,
    source: NodeId,
    target: NodeId,
    options: LinkPredictionOptions = {},
): number {
    if (!graph.hasNode(source) || !graph.hasNode(target)) {
        return 0;
    }

    const {directed = false} = options;

    // Get neighbors
    const sourceNeighbors = new Set(
        directed ? Array.from(graph.outNeighbors(source)) : Array.from(graph.neighbors(source)),
    );
    const targetNeighbors = new Set(
        directed ? Array.from(graph.inNeighbors(target)) : Array.from(graph.neighbors(target)),
    );

    // Count common neighbors
    let commonCount = 0;
    for (const neighbor of sourceNeighbors) {
        if (targetNeighbors.has(neighbor)) {
            commonCount++;
        }
    }

    return commonCount;
}

/**
 * Calculate common neighbors scores for all possible node pairs
 */
export function commonNeighborsPrediction(
    graph: Graph,
    options: LinkPredictionOptions = {},
): LinkPredictionScore[] {
    const {
        directed = false,
        includeExisting = false,
        topK,
    } = options;

    const scores: LinkPredictionScore[] = [];
    const nodes = Array.from(graph.nodes()).map((n) => n.id);

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const source = nodes[i];
            const target = nodes[j];

            if (!source || !target) {
                continue;
            }

            // Skip existing edges unless requested
            if (!includeExisting && graph.hasEdge(source, target)) {
                continue;
            }

            const score = commonNeighborsScore(graph, source, target, {directed});

            if (score > 0) {
                scores.push({source, target, score});

                // For undirected graphs, also add the reverse pair
                if (!directed && source !== target) {
                    scores.push({source: target, target: source, score});
                }
            }
        }
    }

    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);

    // Return top K if specified
    if (topK && topK > 0) {
        return scores.slice(0, topK);
    }

    return scores;
}

/**
 * Calculate common neighbors scores for specific node pairs
 */
export function commonNeighborsForPairs(
    graph: Graph,
    pairs: [NodeId, NodeId][],
    options: LinkPredictionOptions = {},
): LinkPredictionScore[] {
    return pairs.map(([source, target]) => ({
        source,
        target,
        score: commonNeighborsScore(graph, source, target, options),
    }));
}

/**
 * Get top candidates for link prediction for a specific node
 */
export function getTopCandidatesForNode(
    graph: Graph,
    node: NodeId,
    options: LinkPredictionOptions & {candidates?: NodeId[]} = {},
): LinkPredictionScore[] {
    if (!graph.hasNode(node)) {
        return [];
    }

    const {
        directed = false,
        includeExisting = false,
        topK = 10,
        candidates,
    } = options;

    const scores: LinkPredictionScore[] = [];
    const targetNodes = candidates ?? Array.from(graph.nodes()).map((n) => n.id);

    for (const target of targetNodes) {
        if (target === node) {
            continue;
        }

        // Skip existing edges unless requested
        if (!includeExisting && graph.hasEdge(node, target)) {
            continue;
        }

        const score = commonNeighborsScore(graph, node, target, {directed});

        if (score > 0) {
            scores.push({source: node, target, score});
        }
    }

    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK);
}

/**
 * Calculate precision and recall for link prediction evaluation
 */
export function evaluateCommonNeighbors(
    trainingGraph: Graph,
    testEdges: [NodeId, NodeId][],
    nonEdges: [NodeId, NodeId][],
    options: LinkPredictionOptions = {},
): {
        precision: number;
        recall: number;
        f1Score: number;
        auc: number;
    } {
    // Get scores for test edges and non-edges
    const testScores = commonNeighborsForPairs(trainingGraph, testEdges, options);
    const nonEdgeScores = commonNeighborsForPairs(trainingGraph, nonEdges, options);

    // Combine and sort all scores
    const allScores = [
        ... testScores.map((s) => ({... s, isActualEdge: true})),
        ... nonEdgeScores.map((s) => ({... s, isActualEdge: false})),
    ].sort((a, b) => b.score - a.score);

    // Calculate precision and recall at different thresholds
    let truePositives = 0;
    let falsePositives = 0;
    let bestF1 = 0;
    let bestPrecision = 0;
    let bestRecall = 0;

    const totalPositives = testEdges.length;

    for (const scoreItem of allScores) {
        if (scoreItem.isActualEdge) {
            truePositives++;
        } else {
            falsePositives++;
        }

        const precision = truePositives / (truePositives + falsePositives);
        const recall = truePositives / totalPositives;
        const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

        if (f1 > bestF1) {
            bestF1 = f1;
            bestPrecision = precision;
            bestRecall = recall;
        }
    }

    // Calculate AUC (Area Under Curve)
    let auc = 0;
    let tpCount = 0;
    let fpCount = 0;

    for (const item of allScores) {
        if (item.isActualEdge) {
            tpCount++;
        } else {
            auc += tpCount;
            fpCount++;
        }
    }

    if (tpCount > 0 && fpCount > 0) {
        auc = auc / (tpCount * fpCount);
    } else {
        auc = 0.5; // Random performance
    }

    return {
        precision: bestPrecision,
        recall: bestRecall,
        f1Score: bestF1,
        auc,
    };
}
