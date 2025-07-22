import {describe, expect, it} from "vitest";

import {katzCentrality, nodeKatzCentrality} from "../../src/algorithms/centrality/katz.js";
import {Graph} from "../../src/core/graph.js";

describe("Katz Centrality", () => {
    describe("katzCentrality", () => {
        it("should calculate Katz centrality for a simple graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = katzCentrality(graph);

            // All nodes should have some centrality (at least beta value)
            expect(centrality.a).toBeGreaterThan(0);
            expect(centrality.b).toBeGreaterThan(0);
            expect(centrality.c).toBeGreaterThan(0);

            // Values should be approximately equal for symmetric graph
            expect(centrality.a).toBeCloseTo(centrality.b, 2);
            expect(centrality.b).toBeCloseTo(centrality.c, 2);
        });

        it("should handle star graph correctly", () => {
            const graph = new Graph();
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");

            const centrality = katzCentrality(graph);

            // Center should have higher centrality due to more connections
            expect(centrality.center).toBeGreaterThan(centrality.a);
            expect(centrality.center).toBeGreaterThan(centrality.b);
            expect(centrality.center).toBeGreaterThan(centrality.c);

            // Leaf nodes should have equal centrality
            expect(centrality.a).toBeCloseTo(centrality.b, 3);
            expect(centrality.b).toBeCloseTo(centrality.c, 3);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = katzCentrality(graph);

            // All nodes should have some centrality
            expect(centrality.a).toBeGreaterThan(0);
            expect(centrality.b).toBeGreaterThan(0);
            expect(centrality.c).toBeGreaterThan(0);
        });

        it("should respect alpha parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const lowAlpha = katzCentrality(graph, {alpha: 0.05, normalized: false});
            const highAlpha = katzCentrality(graph, {alpha: 0.2, normalized: false});

            // Higher alpha should lead to larger differences between connected nodes
            const lowDiff = Math.abs(lowAlpha.b - lowAlpha.a);
            const highDiff = Math.abs(highAlpha.b - highAlpha.a);

            expect(highDiff).toBeGreaterThan(lowDiff);
        });

        it("should respect beta parameter", () => {
            const graph = new Graph();
            graph.addNode("isolated");
            graph.addEdge("a", "b");

            const lowBeta = katzCentrality(graph, {beta: 0.5, normalized: false});
            const highBeta = katzCentrality(graph, {beta: 2.0, normalized: false});

            // Isolated node should have exactly beta centrality
            expect(lowBeta.isolated).toBeCloseTo(0.5, 3);
            expect(highBeta.isolated).toBeCloseTo(2.0, 3);

            // All values should be proportionally higher with higher beta
            expect(highBeta.a).toBeGreaterThan(lowBeta.a);
            expect(highBeta.b).toBeGreaterThan(lowBeta.b);
        });

        it("should respect normalization option", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const normalized = katzCentrality(graph, {normalized: true});
            const unnormalized = katzCentrality(graph, {normalized: false});

            // Normalized should be in [0, 1] range
            const normalizedValues = Object.values(normalized);
            expect(Math.max(... normalizedValues)).toBeLessThanOrEqual(1);
            expect(Math.min(... normalizedValues)).toBeGreaterThanOrEqual(0);

            // Relative ordering should be preserved
            expect((normalized.b > normalized.a) === (unnormalized.b > unnormalized.a)).toBe(true);
        });

        it("should converge within maxIterations", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = katzCentrality(graph, {maxIterations: 10});

            expect(Object.keys(centrality)).toHaveLength(3);
            expect(centrality.a).toBeGreaterThan(0);
        });

        it("should handle tolerance parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const looseTolerance = katzCentrality(graph, {tolerance: 1e-2, maxIterations: 100});
            const strictTolerance = katzCentrality(graph, {tolerance: 1e-8, maxIterations: 100});

            // Should get valid results with both tolerances
            expect(Object.keys(looseTolerance)).toHaveLength(3);
            expect(Object.keys(strictTolerance)).toHaveLength(3);
        });
    });

    describe("edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();
            const centrality = katzCentrality(graph);

            expect(centrality).toEqual({});
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("a");

            const centrality = katzCentrality(graph, {beta: 1.0});

            expect(centrality.a).toBeCloseTo(1.0, 3);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const centrality = katzCentrality(graph, {beta: 1.0});

            expect(Object.keys(centrality)).toHaveLength(4);

            // Similar structure should yield similar centrality
            expect(centrality.a).toBeCloseTo(centrality.c, 2);
            expect(centrality.b).toBeCloseTo(centrality.d, 2);
        });

        it("should handle isolated nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addNode("isolated");

            const centrality = katzCentrality(graph, {beta: 1.0, normalized: false});

            // Isolated node should have exactly beta centrality
            expect(centrality.isolated).toBeCloseTo(1.0, 3);
            expect(centrality.a).toBeGreaterThan(1.0);
            expect(centrality.b).toBeGreaterThan(1.0);
        });

        it("should handle graph with no edges", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("b");
            graph.addNode("c");

            const centrality = katzCentrality(graph, {beta: 2.0});

            // All nodes should have exactly beta centrality
            expect(centrality.a).toBeCloseTo(2.0, 3);
            expect(centrality.b).toBeCloseTo(2.0, 3);
            expect(centrality.c).toBeCloseTo(2.0, 3);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const centrality = katzCentrality(graph);

            expect(centrality.a).toBeGreaterThan(centrality.b);
        });
    });

    describe("nodeKatzCentrality", () => {
        it("should calculate centrality for specific node", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centralityB = nodeKatzCentrality(graph, "b");

            expect(centralityB).toBeGreaterThan(0);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");

            expect(() => {
                nodeKatzCentrality(graph, "nonexistent");
            }).toThrow("Node nonexistent not found in graph");
        });

        it("should match full centrality calculation", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const fullCentrality = katzCentrality(graph);
            const singleCentrality = nodeKatzCentrality(graph, "b");

            expect(singleCentrality).toBeCloseTo(fullCentrality.b, 5);
        });
    });

    describe("mathematical properties", () => {
        it("should satisfy Katz centrality formula", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            const alpha = 0.1;
            const beta = 1.0;
            const centrality = katzCentrality(graph, {alpha, beta, normalized: false});

            // For node 'a': should be approximately alpha * (centrality[b] + centrality[c]) + beta
            const expectedA = (alpha * (centrality.b + centrality.c)) + beta;
            expect(centrality.a).toBeCloseTo(expectedA, 2);
        });

        it("should be monotonic with respect to beta", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");

            const centralityBeta1 = katzCentrality(graph, {beta: 1.0, normalized: false});
            const centralityBeta2 = katzCentrality(graph, {beta: 2.0, normalized: false});

            // All centrality values should increase with higher beta
            expect(centralityBeta2.a).toBeGreaterThan(centralityBeta1.a);
            expect(centralityBeta2.b).toBeGreaterThan(centralityBeta1.b);
        });
    });

    describe("performance", () => {
        it("should handle moderately large graphs", () => {
            const graph = new Graph();

            // Create a graph with 50 nodes
            for (let i = 0; i < 50; i++) {
                for (let j = i + 1; j < Math.min(i + 3, 50); j++) {
                    graph.addEdge(i.toString(), j.toString());
                }
            }

            const start = Date.now();
            const centrality = katzCentrality(graph, {maxIterations: 50});
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
            expect(Object.keys(centrality)).toHaveLength(50);
        });
    });
});
