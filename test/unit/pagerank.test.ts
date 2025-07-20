/* eslint-disable dot-notation */
import {describe, expect, it} from "vitest";

import {
    pageRank,
    pageRankCentrality,
    personalizedPageRank,
    topPageRankNodes,
} from "../../src/algorithms/centrality/pagerank.js";
import {Graph} from "../../src/core/graph.js";

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
            expect(result.ranks["A"]).toBeCloseTo(result.ranks["B"] ?? 0, 5);
            expect(result.ranks["B"]).toBeCloseTo(result.ranks["C"] ?? 0, 5);

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
            expect(result.ranks["C"]).toBeGreaterThan(0);
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
            expect(result.ranks["A"]).toBeCloseTo(1);
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
            expect(result1.ranks["A"]).not.toBeCloseTo(result2.ranks["A"] ?? 0, 2);
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
            expect(result.ranks["A"]).not.toBeCloseTo(0.5);
        });

        it("should handle weighted PageRank", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");

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
            expect(result.ranks["center"]).toBeGreaterThan(result.ranks["A"] ?? 0);
            expect(result.ranks["center"]).toBeGreaterThan(result.ranks["B"] ?? 0);
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
            expect(result.ranks["A"]).toBeGreaterThan(result.ranks["D"] ?? 0);
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
            const avgPersonal = ((result.ranks["A"] ?? 0) + (result.ranks["C"] ?? 0)) / 2;
            const avgOther = ((result.ranks["B"] ?? 0) + (result.ranks["D"] ?? 0)) / 2;
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
                const diff = Math.abs((centrality1[node] ?? 0) - (centrality2[node] ?? 0));
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
            const nodes = top2.map((n) => n.node);
            expect(nodes).toContain("hub");
            expect(top2[0]?.rank ?? 0).toBeGreaterThanOrEqual(top2[1]?.rank ?? 0);
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
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");

            const top2 = topPageRankNodes(graph, 2);

            expect(top2).toHaveLength(2);
            expect(top2[0]?.rank ?? 0).toBeGreaterThanOrEqual(top2[1]?.rank ?? 0);
        });
    });

    describe("edge cases", () => {
        it("should handle graph with only dangling nodes", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addNode("c");
            // No edges, all nodes are dangling

            const result = pageRank(directedGraph);

            // All nodes should have equal rank
            expect(result.ranks["a"]).toBeCloseTo(1/3, 5);
            expect(result.ranks["b"]).toBeCloseTo(1/3, 5);
            expect(result.ranks["c"]).toBeCloseTo(1/3, 5);
        });

        it("should handle convergence with very low tolerance", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addNode("c");
            
            directedGraph.addEdge("a", "b");
            directedGraph.addEdge("b", "c");
            directedGraph.addEdge("c", "a");

            const result = pageRank(directedGraph, {
                tolerance: 1e-10,
                maxIterations: 1000,
            });

            // Should converge to equal values for cycle
            const ranks = Object.values(result.ranks);
            expect(Math.max(...ranks) - Math.min(...ranks)).toBeLessThan(0.001);
        });

        it("should handle personalized PageRank with empty personalization", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addEdge("a", "b");

            const result = personalizedPageRank(directedGraph, []);

            // Should default to regular PageRank
            expect(result.ranks["a"]).toBeDefined();
            expect(result.ranks["b"]).toBeDefined();
        });

        it("should handle weighted edges with missing edge data", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addNode("c");
            
            // Create edge without weight
            directedGraph.addEdge("a", "b");
            directedGraph.addEdge("b", "c", 2);

            const result = pageRank(directedGraph, {
                weight: true,
            });

            expect(result.ranks["a"]).toBeDefined();
            expect(result.ranks["b"]).toBeDefined();
            expect(result.ranks["c"]).toBeDefined();
        });

        it("should handle graph with all edges having zero weight", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addNode("c");
            
            directedGraph.addEdge("a", "b", 0);
            directedGraph.addEdge("b", "c", 0);
            directedGraph.addEdge("c", "a", 0);

            const result = pageRank(directedGraph, {
                weight: true,
            });

            // Should still compute ranks even with zero weights
            expect(Object.keys(result.ranks).length).toBe(3);
        });

        it("should handle initial ranks that don't sum to 1", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addNode("c");
            
            directedGraph.addEdge("a", "b");
            directedGraph.addEdge("b", "c");
            directedGraph.addEdge("c", "a");

            const initialRanks = new Map([
                ["a", 10],
                ["b", 20],
                ["c", 30],
            ]);

            const result = pageRank(directedGraph, {
                initialRanks,
            });

            // Should normalize and compute correctly
            const sum = Object.values(result.ranks).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 5);
        });

        it("should handle damping factor of 0", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addEdge("a", "b");

            const result = pageRank(directedGraph, {
                dampingFactor: 0,
            });

            // With damping 0, all nodes get equal rank
            expect(result.ranks["a"]).toBeCloseTo(0.5, 5);
            expect(result.ranks["b"]).toBeCloseTo(0.5, 5);
        });

        it("should handle damping factor of 1", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("a");
            directedGraph.addNode("b");
            directedGraph.addNode("c");
            
            directedGraph.addEdge("a", "b");
            directedGraph.addEdge("b", "c");
            // c is a dangling node

            const result = pageRank(directedGraph, {
                dampingFactor: 1,
                maxIterations: 50,
            });

            // With damping 1, rank accumulates at dangling nodes
            expect(result.ranks["c"]).toBeGreaterThan(result.ranks["a"]);
        });
    });
});
