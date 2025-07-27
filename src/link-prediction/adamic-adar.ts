import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";
import {getCommonNeighbors, getIntermediateNodes} from "../utils/graph-utilities.js";
import type {LinkPredictionOptions, LinkPredictionScore} from "./common-neighbors.js";

/**
 * Adamic-Adar Index link prediction implementation
 *
 * Predicts the likelihood of a link between two nodes based on their common
 * neighbors, weighted by the inverse logarithm of the neighbors' degrees.
 * This gives higher weight to rare common neighbors.
 *
 * Formula: AA(x,y) = Σ (1 / log(|Γ(z)|)) for all z ∈ Γ(x) ∩ Γ(y)
 * where Γ(z) is the set of neighbors of node z
 *
 * Time complexity: O(k²) where k is the average degree
 * Space complexity: O(k)
 */

/**
 * Calculate Adamic-Adar index for a pair of nodes
 */
export function adamicAdarScore(
    graph: Graph,
    source: NodeId,
    target: NodeId,
    options: LinkPredictionOptions = {},
): number {
    if (!graph.hasNode(source) || !graph.hasNode(target)) {
        return 0;
    }

    const {directed = false} = options;

    // Use utility function to get common neighbors
    // For directed graphs, we want intermediate nodes that form paths source->X->target
    const commonNeighborsSet = directed ?
        getIntermediateNodes(graph, source, target) :
        getCommonNeighbors(graph, source, target, false);

    // Calculate Adamic-Adar score
    let score = 0;
    for (const neighbor of commonNeighborsSet) {
        const degree = directed ?
            graph.outDegree(neighbor) : // Use out-degree for directed graphs
            graph.degree(neighbor); // Use total degree for undirected graphs

        if (degree > 1) {
            score += 1 / Math.log(degree);
        } else if (degree === 1) {
            // For degree 1, we can't use log(1) = 0, so use a small constant
            score += 1; // or some other reasonable value
        }
    }

    return score;
}

/**
 * Calculate Adamic-Adar scores for all possible node pairs
 */
export function adamicAdarPrediction(
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

            const score = adamicAdarScore(graph, source, target, {directed});

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
 * Calculate Adamic-Adar scores for specific node pairs
 */
export function adamicAdarForPairs(
    graph: Graph,
    pairs: [NodeId, NodeId][],
    options: LinkPredictionOptions = {},
): LinkPredictionScore[] {
    return pairs.map(([source, target]) => ({
        source,
        target,
        score: adamicAdarScore(graph, source, target, options),
    }));
}

/**
 * Get top Adamic-Adar candidates for link prediction for a specific node
 */
export function getTopAdamicAdarCandidatesForNode(
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

        const score = adamicAdarScore(graph, node, target, {directed});

        if (score > 0) {
            scores.push({source: node, target, score});
        }
    }

    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK);
}

/**
 * Calculate precision and recall for Adamic-Adar link prediction evaluation
 */
export function evaluateAdamicAdar(
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
    const testScores = adamicAdarForPairs(trainingGraph, testEdges, options);
    const nonEdgeScores = adamicAdarForPairs(trainingGraph, nonEdges, options);

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

/**
 * Compare Adamic-Adar with Common Neighbors for the same dataset
 */
export function compareAdamicAdarWithCommonNeighbors(
    graph: Graph,
    testEdges: [NodeId, NodeId][],
    nonEdges: [NodeId, NodeId][],
    options: LinkPredictionOptions = {},
): {
        adamicAdar: ReturnType<typeof evaluateAdamicAdar>;
        commonNeighbors: {
            precision: number;
            recall: number;
            f1Score: number;
            auc: number;
        };
    } {
    // Import common neighbors evaluation function
    // Since we're using ES modules, we can't use require. Instead, we'll implement a simple version here
    const commonNeighborsPairs = (pairs: [NodeId, NodeId][]): LinkPredictionScore[] =>
        pairs.map(([source, target]) => ({
            source,
            target,
            score: getCommonNeighbors(graph, source, target, options.directed).size,
        }));

    const testScores = commonNeighborsPairs(testEdges);
    const nonEdgeScores = commonNeighborsPairs(nonEdges);

    const allScores = [
        ... testScores.map((s) => ({... s, isActualEdge: true})),
        ... nonEdgeScores.map((s) => ({... s, isActualEdge: false})),
    ].sort((a, b) => b.score - a.score);

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
        auc = 0.5;
    }

    const commonNeighborsResults = {
        precision: bestPrecision,
        recall: bestRecall,
        f1Score: bestF1,
        auc,
    };

    const adamicAdarResults = evaluateAdamicAdar(graph, testEdges, nonEdges, options);

    return {
        adamicAdar: adamicAdarResults,
        commonNeighbors: commonNeighborsResults,
    };
}
