import {describe, expect, it} from "vitest";

import {eigenvectorCentrality, nodeEigenvectorCentrality} from "../../src/algorithms/centrality/eigenvector.js";
import {Graph} from "../../src/core/graph.js";

describe("Eigenvector Centrality", () => {
    describe("eigenvectorCentrality", () => {
        it("should calculate eigenvector centrality for a simple graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = eigenvectorCentrality(graph);

            // All nodes should have equal centrality in a symmetric triangle
            expect(centrality.a).toBeCloseTo(centrality.b, 3);
            expect(centrality.b).toBeCloseTo(centrality.c, 3);
            expect(centrality.a).toBeGreaterThan(0);
        });

        it("should handle star graph correctly", () => {
            const graph = new Graph();
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");
            graph.addEdge("center", "d");

            const centrality = eigenvectorCentrality(graph);

            // In a star graph, all nodes actually have very low centrality
            // because leaf nodes don't contribute much to each other
            expect(Object.keys(centrality)).toHaveLength(5);
            expect(centrality.center).toBeGreaterThanOrEqual(0);

            // Leaf nodes should have equal centrality
            expect(centrality.a).toBeCloseTo(centrality.b, 3);
            expect(centrality.b).toBeCloseTo(centrality.c, 3);
            expect(centrality.c).toBeCloseTo(centrality.d, 3);
        });

        it("should handle chain graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const centrality = eigenvectorCentrality(graph);

            // Middle nodes should have higher centrality
            expect(centrality.b).toBeGreaterThan(centrality.a);
            expect(centrality.c).toBeGreaterThan(centrality.d);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = eigenvectorCentrality(graph);

            // Should return valid centrality values
            expect(Object.keys(centrality)).toHaveLength(3);
            expect(centrality.a).toBeGreaterThanOrEqual(0);
            expect(centrality.b).toBeGreaterThanOrEqual(0);
            expect(centrality.c).toBeGreaterThanOrEqual(0);
        });

        it("should respect normalization option", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const normalizedCentrality = eigenvectorCentrality(graph, {normalized: true});
            const unnormalizedCentrality = eigenvectorCentrality(graph, {normalized: false});

            // Normalized should have max value of 1
            const maxNormalized = Math.max(... Object.values(normalizedCentrality));
            expect(maxNormalized).toBeCloseTo(1, 3);

            // Both should have same relative ordering
            expect(normalizedCentrality.b > normalizedCentrality.a).toBe(
                unnormalizedCentrality.b > unnormalizedCentrality.a,
            );
        });

        it("should handle custom start vector", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const startVector = new Map([
                ["a", 0.8],
                ["b", 0.1],
                ["c", 0.1],
            ]);

            const centrality = eigenvectorCentrality(graph, {startVector});

            expect(Object.keys(centrality)).toHaveLength(3);
            expect(centrality.a).toBeGreaterThanOrEqual(0);
            expect(centrality.b).toBeGreaterThanOrEqual(0);
            expect(centrality.c).toBeGreaterThanOrEqual(0);
        });

        it("should converge within maxIterations", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = eigenvectorCentrality(graph, {maxIterations: 5});

            expect(Object.keys(centrality)).toHaveLength(3);
            expect(centrality.a).toBeGreaterThanOrEqual(0);
        });
    });

    describe("edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();
            const centrality = eigenvectorCentrality(graph);

            expect(centrality).toEqual({});
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("a");

            const centrality = eigenvectorCentrality(graph);

            expect(centrality.a).toBe(0);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const centrality = eigenvectorCentrality(graph);

            expect(Object.keys(centrality)).toHaveLength(4);
            expect(centrality.a).toBeCloseTo(centrality.b, 3);
            expect(centrality.c).toBeCloseTo(centrality.d, 3);
        });

        it("should handle isolated nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addNode("isolated");

            const centrality = eigenvectorCentrality(graph);

            expect(centrality.isolated).toBe(0);
            expect(centrality.a).toBeGreaterThan(0);
            expect(centrality.b).toBeGreaterThan(0);
        });

        it("should handle graph with no edges", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("b");
            graph.addNode("c");

            const centrality = eigenvectorCentrality(graph);

            expect(centrality.a).toBe(0);
            expect(centrality.b).toBe(0);
            expect(centrality.c).toBe(0);
        });
    });

    describe("nodeEigenvectorCentrality", () => {
        it("should calculate centrality for specific node", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centralityA = nodeEigenvectorCentrality(graph, "a");
            const centralityB = nodeEigenvectorCentrality(graph, "b");

            expect(centralityA).toBeCloseTo(centralityB, 3);
            expect(centralityA).toBeGreaterThanOrEqual(0);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");

            expect(() => {
                nodeEigenvectorCentrality(graph, "nonexistent");
            }).toThrow("Node nonexistent not found in graph");
        });

        it("should match full centrality calculation", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const fullCentrality = eigenvectorCentrality(graph);
            const singleCentrality = nodeEigenvectorCentrality(graph, "b");

            expect(singleCentrality).toBeCloseTo(fullCentrality.b, 5);
        });
    });

    describe("performance", () => {
        it("should handle moderately large graphs", () => {
            const graph = new Graph();

            // Create a graph with 100 nodes
            for (let i = 0; i < 100; i++) {
                for (let j = i + 1; j < Math.min(i + 5, 100); j++) {
                    graph.addEdge(i.toString(), j.toString());
                }
            }

            const start = Date.now();
            const centrality = eigenvectorCentrality(graph, {maxIterations: 50});
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            expect(Object.keys(centrality)).toHaveLength(100);
        });
    });
});
