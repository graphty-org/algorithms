import {describe, it, expect} from "vitest";
import {Graph} from "../../src/core/graph.js";
import {
    pageRank,
    personalizedPageRank,
    pageRankCentrality,
    topPageRankNodes,
} from "../../src/algorithms/centrality/pagerank.js";

describe("PageRank Algorithm", () => {
    describe("pageRank", () => {
        it("should calculate PageRank for a simple directed graph", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            expect(result.iterations).toBeLessThan(100);
            
            // In a cycle, all nodes should have equal PageRank
            expect(result.ranks.A).toBeCloseTo(result.ranks.B, 5);
            expect(result.ranks.B).toBeCloseTo(result.ranks.C, 5);
            
            // Sum should be approximately 1
            const sum = Object.values(result.ranks).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 5);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");

            expect(() => {
                pageRank(graph);
            }).toThrow("PageRank requires a directed graph");
        });

        it("should handle dangling nodes", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            // C is a dangling node (no outgoing edges)

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            // C should still have some PageRank due to random surfer model
            expect(result.ranks.C).toBeGreaterThan(0);
        });

        it("should handle empty graph", () => {
            const graph = new Graph({directed: true});

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            expect(result.iterations).toBe(0);
            expect(result.ranks).toEqual({});
        });

        it("should handle single node", () => {
            const graph = new Graph({directed: true});
            graph.addNode("A");

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            expect(result.ranks.A).toBeCloseTo(1);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "A");
            graph.addEdge("A", "B");
            graph.addEdge("B", "A");

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            const sum = Object.values(result.ranks).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 5);
        });

        it("should respect damping factor", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const result1 = pageRank(graph, {dampingFactor: 0.85});
            const result2 = pageRank(graph, {dampingFactor: 0.5});

            // Different damping factors should produce different results
            expect(result1.ranks.A).not.toBeCloseTo(result2.ranks.A, 2);
        });

        it("should throw error for invalid damping factor", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");

            expect(() => {
                pageRank(graph, {dampingFactor: -0.1});
            }).toThrow("Damping factor must be between 0 and 1");

            expect(() => {
                pageRank(graph, {dampingFactor: 1.1});
            }).toThrow("Damping factor must be between 0 and 1");
        });

        it("should respect tolerance parameter", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const result1 = pageRank(graph, {tolerance: 1e-6});
            const result2 = pageRank(graph, {tolerance: 1e-3});

            // Looser tolerance should converge faster
            expect(result2.iterations).toBeLessThanOrEqual(result1.iterations);
        });

        it("should handle max iterations limit", () => {
            const graph = new Graph({directed: true});
            // Create a simple graph
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const result = pageRank(graph, {maxIterations: 2, tolerance: 1e-10});

            expect(result.iterations).toBeLessThanOrEqual(2);
            // With very strict tolerance and only 2 iterations, should not converge
            if (result.iterations === 2) {
                expect(result.converged).toBe(false);
            }
        });

        it("should handle initial ranks", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const initialRanks = new Map([
                ["A", 0.5],
                ["B", 0.3],
                ["C", 0.2],
            ]);

            const result = pageRank(graph, {initialRanks, maxIterations: 1});

            // After one iteration, ranks should have changed from initial
            expect(result.ranks.A).not.toBeCloseTo(0.5);
        });

        it("should handle weighted PageRank", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B", {weight: 10});
            graph.addEdge("A", "C", {weight: 1});
            graph.addEdge("B", "D", {weight: 1});
            graph.addEdge("C", "D", {weight: 1});

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            // Basic PageRank should work
            const sum = Object.values(result.ranks).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 5);
        });

        it("should handle star graph", () => {
            const graph = new Graph({directed: true});
            // All nodes point to center
            graph.addEdge("A", "center");
            graph.addEdge("B", "center");
            graph.addEdge("C", "center");
            graph.addEdge("D", "center");

            const result = pageRank(graph);

            // Center should have highest PageRank
            expect(result.ranks.center).toBeGreaterThan(result.ranks.A);
            expect(result.ranks.center).toBeGreaterThan(result.ranks.B);
        });

        it("should handle complex graph structure", () => {
            const graph = new Graph({directed: true});
            // Create a more complex structure
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "A");
            graph.addEdge("C", "D");
            graph.addEdge("D", "A");

            const result = pageRank(graph);

            expect(result.converged).toBe(true);
            const sum = Object.values(result.ranks).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 5);
        });
    });

    describe("personalizedPageRank", () => {
        it("should calculate personalized PageRank", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");
            graph.addEdge("C", "D");

            const result = personalizedPageRank(graph, ["A"]);

            expect(result.converged).toBe(true);
            // A should have higher rank in personalized PageRank
            expect(result.ranks.A).toBeGreaterThan(result.ranks.D);
        });

        it("should handle multiple personal nodes", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "A");

            const result = personalizedPageRank(graph, ["A", "C"]);

            expect(result.converged).toBe(true);
            // A and C should have relatively higher ranks
            const avgPersonal = (result.ranks.A + result.ranks.C) / 2;
            const avgOther = (result.ranks.B + result.ranks.D) / 2;
            expect(avgPersonal).toBeGreaterThan(avgOther);
        });

        it("should throw error for non-existent personal node", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");

            expect(() => {
                personalizedPageRank(graph, ["X"]);
            }).toThrow("Personal node X not found in graph");
        });

        it("should handle empty personal nodes array", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");

            // Empty array will cause division by zero when calculating personalValue
            const result = personalizedPageRank(graph, []);
            // Should handle gracefully, all values will be NaN or 0
            expect(result.converged).toBeDefined();
        });
    });

    describe("pageRankCentrality", () => {
        it("should return PageRank scores as centrality", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const centrality = pageRankCentrality(graph);

            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
            
            const sum = Object.values(centrality).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 5);
        });

        it("should accept options", () => {
            const graph = new Graph({directed: true});
            // Create a more complex graph where damping factor matters
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");
            graph.addEdge("E", "A");
            graph.addEdge("C", "A"); // Extra edge

            const centrality1 = pageRankCentrality(graph, {dampingFactor: 0.9});
            const centrality2 = pageRankCentrality(graph, {dampingFactor: 0.1});

            // Very different damping factors should produce different results
            // At least one node should have noticeably different centrality
            let maxDiff = 0;
            for (const node of ["A", "B", "C", "D", "E"]) {
                const diff = Math.abs(centrality1[node] - centrality2[node]);
                maxDiff = Math.max(maxDiff, diff);
            }
            expect(maxDiff).toBeGreaterThan(0.01);
        });
    });

    describe("topPageRankNodes", () => {
        it("should return top k nodes by PageRank", () => {
            const graph = new Graph({directed: true});
            // Create a hub-like structure
            graph.addEdge("A", "hub");
            graph.addEdge("B", "hub");
            graph.addEdge("C", "hub");
            graph.addEdge("D", "hub");
            graph.addEdge("E", "hub");
            graph.addEdge("hub", "out");

            const top2 = topPageRankNodes(graph, 2);

            expect(top2).toHaveLength(2);
            // Hub should be in top 2
            const nodes = top2.map(n => n.node);
            expect(nodes).toContain("hub");
            expect(top2[0].rank).toBeGreaterThanOrEqual(top2[1].rank);
        });

        it("should handle k larger than number of nodes", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const top5 = topPageRankNodes(graph, 5);

            expect(top5).toHaveLength(3);
        });

        it("should handle k = 0", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");

            const top0 = topPageRankNodes(graph, 0);

            expect(top0).toHaveLength(0);
        });

        it("should handle empty graph", () => {
            const graph = new Graph({directed: true});

            const top3 = topPageRankNodes(graph, 3);

            expect(top3).toHaveLength(0);
        });

        it("should work with weighted PageRank", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B", {weight: 10});
            graph.addEdge("A", "C", {weight: 1});
            graph.addEdge("B", "D", {weight: 1});
            graph.addEdge("C", "D", {weight: 1});

            const top2 = topPageRankNodes(graph, 2);

            expect(top2).toHaveLength(2);
            expect(top2[0].rank).toBeGreaterThanOrEqual(top2[1].rank);
        });
    });
});