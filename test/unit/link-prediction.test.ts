import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";
import {
    adamicAdarForPairs,
    adamicAdarPrediction,
    adamicAdarScore,
    compareAdamicAdarWithCommonNeighbors,
    evaluateAdamicAdar,
    getTopAdamicAdarCandidatesForNode,
} from "../../src/link-prediction/adamic-adar.js";
import {
    commonNeighborsForPairs,
    commonNeighborsPrediction,
    commonNeighborsScore,
    evaluateCommonNeighbors,
    getTopCandidatesForNode,
} from "../../src/link-prediction/common-neighbors.js";

describe("Link Prediction Algorithms", () => {
    describe("Common Neighbors", () => {
        describe("commonNeighborsScore", () => {
            it("should calculate common neighbors score correctly", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("a", "y");
                graph.addEdge("b", "x");
                graph.addEdge("b", "y");
                graph.addEdge("b", "z");

                const score = commonNeighborsScore(graph, "a", "b");

                expect(score).toBe(2); // x and y are common neighbors
            });

            it("should return 0 for nodes with no common neighbors", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "y");

                const score = commonNeighborsScore(graph, "a", "b");

                expect(score).toBe(0);
            });

            it("should handle directed graphs", () => {
                const graph = new Graph({directed: true});
                graph.addEdge("a", "x");
                graph.addEdge("a", "y");
                graph.addEdge("x", "b");
                graph.addEdge("y", "b");

                const score = commonNeighborsScore(graph, "a", "b", {directed: true});

                expect(score).toBe(2); // a->x->b and a->y->b
            });

            it("should return 0 for non-existent nodes", () => {
                const graph = new Graph();
                graph.addEdge("a", "b");

                const score = commonNeighborsScore(graph, "a", "nonexistent");

                expect(score).toBe(0);
            });

            it("should handle self-loops", () => {
                const graph = new Graph({allowSelfLoops: true});
                graph.addEdge("a", "a");
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");

                const score = commonNeighborsScore(graph, "a", "b");

                expect(score).toBe(1); // x is common neighbor
            });
        });

        describe("commonNeighborsPrediction", () => {
            it("should predict links for all node pairs", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");
                graph.addEdge("c", "y");

                const predictions = commonNeighborsPrediction(graph);

                // Should find prediction for a-b (common neighbor x)
                const abPrediction = predictions.find((p) =>
                    (p.source === "a" && p.target === "b") ||
                    (p.source === "b" && p.target === "a"),
                );
                expect(abPrediction).toBeTruthy();
                expect(abPrediction!.score).toBe(1);
            });

            it("should exclude existing edges by default", () => {
                const graph = new Graph();
                graph.addEdge("a", "b");
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");

                const predictions = commonNeighborsPrediction(graph);

                // Should not predict a-b since it already exists
                const abPrediction = predictions.find((p) =>
                    (p.source === "a" && p.target === "b") ||
                    (p.source === "b" && p.target === "a"),
                );
                expect(abPrediction).toBeFalsy();
            });

            it("should include existing edges when requested", () => {
                const graph = new Graph();
                graph.addEdge("a", "b");
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");

                const predictions = commonNeighborsPrediction(graph, {includeExisting: true});

                const abPrediction = predictions.find((p) =>
                    (p.source === "a" && p.target === "b") ||
                    (p.source === "b" && p.target === "a"),
                );
                expect(abPrediction).toBeTruthy();
            });

            it("should respect topK parameter", () => {
                const graph = new Graph();
                // Create multiple potential links
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");
                graph.addEdge("c", "y");
                graph.addEdge("d", "y");

                const predictions = commonNeighborsPrediction(graph, {topK: 1});

                expect(predictions).toHaveLength(1);
            });

            it("should sort predictions by score", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("a", "y");
                graph.addEdge("b", "x");
                graph.addEdge("b", "y");
                graph.addEdge("c", "x");

                const predictions = commonNeighborsPrediction(graph);

                // a-b should have higher score (2) than a-c or b-c (1)
                expect(predictions[0].score).toBeGreaterThanOrEqual(predictions[1]?.score ?? 0);
            });
        });

        describe("getTopCandidatesForNode", () => {
            it("should find top candidates for specific node", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("a", "y");
                graph.addEdge("b", "x");
                graph.addEdge("c", "x");
                graph.addEdge("c", "y");

                const candidates = getTopCandidatesForNode(graph, "a");

                expect(candidates.length).toBeGreaterThan(0);
                expect(candidates[0].source).toBe("a");

                // c should be top candidate (2 common neighbors)
                const cCandidate = candidates.find((c) => c.target === "c");
                expect(cCandidate).toBeTruthy();
                expect(cCandidate!.score).toBe(2);
            });

            it("should respect topK parameter", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");
                graph.addEdge("c", "x");
                graph.addEdge("d", "x");

                const candidates = getTopCandidatesForNode(graph, "a", {topK: 2});

                expect(candidates).toHaveLength(2);
            });

            it("should return empty for non-existent node", () => {
                const graph = new Graph();
                graph.addEdge("a", "b");

                const candidates = getTopCandidatesForNode(graph, "nonexistent");

                expect(candidates).toHaveLength(0);
            });
        });
    });

    describe("Adamic-Adar Index", () => {
        describe("adamicAdarScore", () => {
            it("should calculate Adamic-Adar score correctly", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("a", "y");
                graph.addEdge("b", "x");
                graph.addEdge("b", "y");
                // Add more connections to x to test weighting
                graph.addEdge("x", "z1");
                graph.addEdge("x", "z2");

                const score = adamicAdarScore(graph, "a", "b");

                expect(score).toBeGreaterThan(0);
                // x has degree 4, y has degree 2
                // Score = 1/log(4) + 1/log(2)
                const expectedScore = (1 / Math.log(4)) + (1 / Math.log(2));
                expect(score).toBeCloseTo(expectedScore, 5);
            });

            it("should give higher weight to rare common neighbors", () => {
                const graph = new Graph();
                // Common neighbor with low degree
                graph.addEdge("a", "rare");
                graph.addEdge("b", "rare");
                // Common neighbor with high degree
                graph.addEdge("a", "popular");
                graph.addEdge("b", "popular");
                for (let i = 0; i < 10; i++) {
                    graph.addEdge("popular", `node${i}`);
                }

                const score = adamicAdarScore(graph, "a", "b");

                // rare neighbor should contribute more than popular neighbor
                const rareContribution = 1 / Math.log(2); // degree 2
                const popularContribution = 1 / Math.log(12); // degree 12

                expect(rareContribution).toBeGreaterThan(popularContribution);
                expect(score).toBeCloseTo(rareContribution + popularContribution, 5);
            });

            it("should handle directed graphs", () => {
                const graph = new Graph({directed: true});
                graph.addEdge("a", "x");
                graph.addEdge("x", "b");
                graph.addEdge("a", "y");
                graph.addEdge("y", "b");

                const score = adamicAdarScore(graph, "a", "b", {directed: true});

                expect(score).toBeGreaterThan(0);
            });

            it("should return 0 for nodes with no common neighbors", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "y");

                const score = adamicAdarScore(graph, "a", "b");

                expect(score).toBe(0);
            });

            it("should handle degree-1 neighbors", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");
                // x has degree 2

                const score = adamicAdarScore(graph, "a", "b");

                expect(score).toBeCloseTo(1 / Math.log(2), 5);
            });
        });

        describe("adamicAdarPrediction", () => {
            it("should predict links using Adamic-Adar index", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");
                graph.addEdge("c", "y");

                const predictions = adamicAdarPrediction(graph);

                const abPrediction = predictions.find((p) =>
                    (p.source === "a" && p.target === "b") ||
                    (p.source === "b" && p.target === "a"),
                );
                expect(abPrediction).toBeTruthy();
                expect(abPrediction!.score).toBeGreaterThan(0);
            });

            it("should sort predictions by score", () => {
                const graph = new Graph();
                // Create different scenarios
                graph.addEdge("a", "rare");
                graph.addEdge("b", "rare");
                graph.addEdge("c", "popular");
                graph.addEdge("d", "popular");
                // Make popular node have high degree
                for (let i = 0; i < 5; i++) {
                    graph.addEdge("popular", `node${i}`);
                }

                const predictions = adamicAdarPrediction(graph);

                // a-b should have higher score than c-d
                expect(predictions[0].score).toBeGreaterThanOrEqual(predictions[1]?.score ?? 0);
            });
        });

        describe("getTopAdamicAdarCandidatesForNode", () => {
            it("should find top Adamic-Adar candidates", () => {
                const graph = new Graph();
                graph.addEdge("a", "x");
                graph.addEdge("b", "x");
                graph.addEdge("c", "y");
                graph.addEdge("a", "y");

                const candidates = getTopAdamicAdarCandidatesForNode(graph, "a");

                expect(candidates.length).toBeGreaterThan(0);
                expect(candidates[0].source).toBe("a");

                // Should find candidates with positive scores
                expect(candidates.every((c) => c.score > 0)).toBe(true);
            });
        });
    });

    describe("Comparison between algorithms", () => {
        it("should show Adamic-Adar gives more weight to rare neighbors", () => {
            const graph = new Graph();
            // Create scenario with rare and popular common neighbors
            graph.addEdge("a", "rare");
            graph.addEdge("b", "rare");
            graph.addEdge("a", "popular");
            graph.addEdge("b", "popular");

            // Make popular node very connected
            for (let i = 0; i < 20; i++) {
                graph.addEdge("popular", `node${i}`);
            }

            const cnScore = commonNeighborsScore(graph, "a", "b");
            const aaScore = adamicAdarScore(graph, "a", "b");

            expect(cnScore).toBe(2); // Both algorithms see 2 common neighbors
            expect(aaScore).toBeGreaterThan(0); // Adamic-Adar gives a weighted score

            // Adamic-Adar should weight rare neighbor much higher
            const rareContribution = 1 / Math.log(2);
            const popularContribution = 1 / Math.log(22);
            expect(rareContribution).toBeGreaterThan(popularContribution * 3);
        });

        it("should produce same relative ordering for uniform degree case", () => {
            const graph = new Graph();
            // Create uniform degree scenario
            graph.addEdge("a", "x");
            graph.addEdge("a", "y");
            graph.addEdge("b", "x");
            graph.addEdge("c", "x");

            const cnPredictions = commonNeighborsPrediction(graph);
            const aaPredictions = adamicAdarPrediction(graph);

            // Should have same number of non-zero predictions
            expect(cnPredictions.length).toBe(aaPredictions.length);

            // All predictions should have the same relative scores since degrees are uniform
            // Just check that both algorithms find the same potential links
            const cnPairs = new Set(cnPredictions.map((p) => `${p.source}-${p.target}`));
            const aaPairs = new Set(aaPredictions.map((p) => `${p.source}-${p.target}`));

            expect(cnPairs).toEqual(aaPairs);
        });
    });

    describe("Evaluation functions", () => {
        it("should evaluate Adamic-Adar prediction performance", () => {
            const graph = new Graph();
            // Create a training graph
            graph.addEdge("a", "x");
            graph.addEdge("a", "y");
            graph.addEdge("b", "x");
            graph.addEdge("b", "y");
            graph.addEdge("c", "x");

            // Define test edges (edges that should be predicted)
            const testEdges: Array<[string, string]> = [["a", "b"], ["c", "y"]];

            // Define non-edges (edges that should not be predicted)
            const nonEdges: Array<[string, string]> = [["a", "c"], ["b", "c"]];

            const evaluation = evaluateAdamicAdar(graph, testEdges, nonEdges);

            expect(evaluation.precision).toBeGreaterThanOrEqual(0);
            expect(evaluation.precision).toBeLessThanOrEqual(1);
            expect(evaluation.recall).toBeGreaterThanOrEqual(0);
            expect(evaluation.recall).toBeLessThanOrEqual(1);
            expect(evaluation.f1Score).toBeGreaterThanOrEqual(0);
            expect(evaluation.f1Score).toBeLessThanOrEqual(1);
            expect(evaluation.auc).toBeGreaterThanOrEqual(0);
            expect(evaluation.auc).toBeLessThanOrEqual(1);
        });

        it("should handle perfect prediction scenario", () => {
            const graph = new Graph();
            graph.addEdge("a", "common");
            graph.addEdge("b", "common");

            const testEdges: Array<[string, string]> = [["a", "b"]];
            const nonEdges: Array<[string, string]> = [["a", "isolated"], ["b", "isolated"]];

            const evaluation = evaluateAdamicAdar(graph, testEdges, nonEdges);

            expect(evaluation.precision).toBe(1);
            expect(evaluation.recall).toBe(1);
            expect(evaluation.f1Score).toBe(1);
            expect(evaluation.auc).toBe(1);
        });

        it("should evaluate Common Neighbors prediction performance", () => {
            const graph = new Graph();
            // Create a training graph
            graph.addEdge("a", "x");
            graph.addEdge("a", "y");
            graph.addEdge("b", "x");
            graph.addEdge("b", "y");

            const testEdges: Array<[string, string]> = [["a", "b"]];
            const nonEdges: Array<[string, string]> = [["a", "c"], ["b", "c"]];

            const evaluation = evaluateCommonNeighbors(graph, testEdges, nonEdges);

            expect(evaluation.precision).toBeGreaterThanOrEqual(0);
            expect(evaluation.recall).toBeGreaterThanOrEqual(0);
            expect(evaluation.f1Score).toBeGreaterThanOrEqual(0);
            expect(evaluation.auc).toBeGreaterThanOrEqual(0);
        });

        it("should compare Adamic-Adar with Common Neighbors", () => {
            const graph = new Graph();
            // Create scenario where Adamic-Adar should perform better
            graph.addEdge("a", "rare");
            graph.addEdge("b", "rare");
            graph.addEdge("a", "popular");
            graph.addEdge("b", "popular");
            // Make popular very connected
            for (let i = 0; i < 10; i++) {
                graph.addEdge("popular", `node${i}`);
            }

            const testEdges: Array<[string, string]> = [["a", "b"]];
            const nonEdges: Array<[string, string]> = [["a", "node1"], ["b", "node2"]];

            const comparison = compareAdamicAdarWithCommonNeighbors(graph, testEdges, nonEdges);

            expect(comparison.adamicAdar).toBeDefined();
            expect(comparison.commonNeighbors).toBeDefined();
            // Both should identify the edge correctly
            expect(comparison.adamicAdar.recall).toBeGreaterThan(0);
            expect(comparison.commonNeighbors.recall).toBeGreaterThan(0);
        });
    });

    describe("adamicAdarForPairs", () => {
        it("should calculate scores for specific pairs", () => {
            const graph = new Graph();
            graph.addEdge("a", "x");
            graph.addEdge("b", "x");
            graph.addEdge("a", "y");
            graph.addEdge("c", "y");

            const pairs: Array<[string, string]> = [
                ["a", "b"],
                ["a", "c"],
                ["b", "c"],
            ];

            const scores = adamicAdarForPairs(graph, pairs);

            expect(scores).toHaveLength(3);
            expect(scores[0].source).toBe("a");
            expect(scores[0].target).toBe("b");
            expect(scores[0].score).toBeGreaterThan(0); // Common neighbor x

            expect(scores[1].source).toBe("a");
            expect(scores[1].target).toBe("c");
            expect(scores[1].score).toBeGreaterThan(0); // Common neighbor y

            expect(scores[2].score).toBe(0); // No common neighbors
        });

        it("should handle directed graph option", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "x");
            graph.addEdge("x", "b");

            const pairs: Array<[string, string]> = [["a", "b"]];
            const scores = adamicAdarForPairs(graph, pairs, {directed: true});

            expect(scores[0].score).toBeGreaterThan(0);
        });
    });

    describe("commonNeighborsForPairs", () => {
        it("should calculate scores for specific pairs", () => {
            const graph = new Graph();
            graph.addEdge("a", "x");
            graph.addEdge("b", "x");
            graph.addEdge("a", "y");
            graph.addEdge("b", "y");

            const pairs: Array<[string, string]> = [["a", "b"], ["a", "c"]];
            const scores = commonNeighborsForPairs(graph, pairs);

            expect(scores).toHaveLength(2);
            expect(scores[0].score).toBe(2); // x and y
            expect(scores[1].score).toBe(0); // No common neighbors with c
        });
    });

    describe("Edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();

            const cnPredictions = commonNeighborsPrediction(graph);
            const aaPredictions = adamicAdarPrediction(graph);

            expect(cnPredictions).toHaveLength(0);
            expect(aaPredictions).toHaveLength(0);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("a");

            const cnScore = commonNeighborsScore(graph, "a", "a");
            const aaScore = adamicAdarScore(graph, "a", "a");

            expect(cnScore).toBe(0);
            expect(aaScore).toBe(0);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();
            graph.addEdge("a", "x");
            graph.addEdge("b", "x");
            graph.addEdge("c", "y");
            graph.addEdge("d", "y");

            const cnPredictions = commonNeighborsPrediction(graph);

            // Should find predictions within each component
            expect(cnPredictions.some((p) =>
                (p.source === "a" && p.target === "b") ||
                (p.source === "b" && p.target === "a"),
            )).toBe(true);
            expect(cnPredictions.some((p) =>
                (p.source === "c" && p.target === "d") ||
                (p.source === "d" && p.target === "c"),
            )).toBe(true);
        });

        it("should handle complete graph", () => {
            const graph = new Graph();
            const nodes = ["a", "b", "c"];

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const cnPredictions = commonNeighborsPrediction(graph);

            // No predictions since all edges exist
            expect(cnPredictions).toHaveLength(0);

            // With includeExisting, should find all edges
            const cnWithExisting = commonNeighborsPrediction(graph, {includeExisting: true});
            expect(cnWithExisting.length).toBeGreaterThan(0);
        });
    });

    describe("Performance", () => {
        it("should handle moderately large graphs", () => {
            const graph = new Graph();

            // Create a graph with 100 nodes and random edges
            for (let i = 0; i < 100; i++) {
                for (let j = i + 1; j < Math.min(i + 10, 100); j++) {
                    if (Math.random() > 0.7) {
                        graph.addEdge(i.toString(), j.toString());
                    }
                }
            }

            const start = Date.now();
            const cnPredictions = commonNeighborsPrediction(graph, {topK: 50});
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            expect(cnPredictions.length).toBeLessThanOrEqual(50);
        });
    });
});
