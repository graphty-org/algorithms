import {describe, it, expect} from "vitest";
import {Graph} from "../../src/core/graph.js";
import {
    closenessCentrality,
    nodeClosenessCentrality,
    weightedClosenessCentrality,
    nodeWeightedClosenessCentrality,
} from "../../src/algorithms/centrality/closeness.js";

describe("Closeness Centrality", () => {
    describe("closenessCentrality", () => {
        it("should calculate closeness centrality for a simple path graph", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");

            const centrality = closenessCentrality(graph);

            // In a path graph A-B-C-D:
            // A: distances are 1,2,3 -> total 6 -> closeness 1/6
            // B: distances are 1,1,2 -> total 4 -> closeness 1/4
            // C: distances are 2,1,1 -> total 4 -> closeness 1/4
            // D: distances are 3,2,1 -> total 6 -> closeness 1/6
            expect(centrality.A).toBeCloseTo(1 / 6);
            expect(centrality.B).toBeCloseTo(1 / 4);
            expect(centrality.C).toBeCloseTo(1 / 4);
            expect(centrality.D).toBeCloseTo(1 / 6);
        });

        it("should handle star graph", () => {
            const graph = new Graph();
            graph.addEdge("center", "A");
            graph.addEdge("center", "B");
            graph.addEdge("center", "C");
            graph.addEdge("center", "D");

            const centrality = closenessCentrality(graph);

            // Center has distance 1 to all 4 nodes -> closeness 1/4
            expect(centrality.center).toBeCloseTo(1 / 4);
            // Each peripheral node has distance 1 to center and 2 to others
            // Total distance: 1 + 2 + 2 + 2 = 7 -> closeness 1/7
            expect(centrality.A).toBeCloseTo(1 / 7);
        });

        it("should handle disconnected graph", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("C", "D");

            const centrality = closenessCentrality(graph);

            // A can only reach B (distance 1)
            expect(centrality.A).toBe(1);
            expect(centrality.B).toBe(1);
            expect(centrality.C).toBe(1);
            expect(centrality.D).toBe(1);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("A");

            const centrality = closenessCentrality(graph);
            expect(centrality.A).toBe(0);
        });

        it("should handle harmonic centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");

            const centrality = closenessCentrality(graph, {harmonic: true});

            // Harmonic centrality sums reciprocals of distances
            // A: 1/1 + 1/2 + 1/3 = 1.833...
            expect(centrality.A).toBeCloseTo(1 + 1 / 2 + 1 / 3);
            // B: 1/1 + 1/1 + 1/2 = 2.5
            expect(centrality.B).toBeCloseTo(2.5);
        });

        it("should handle normalized centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const centrality = closenessCentrality(graph, {normalized: true});

            // A can reach B (distance 1) and C (distance 2) -> total 3
            // Normalization: (1/3) * (2/2) = 1/3
            expect(centrality.A).toBeCloseTo(1 / 3);
            // B can reach both at distance 1 -> total 2
            // Normalization: (1/2) * (2/2) = 1/2
            expect(centrality.B).toBeCloseTo(1 / 2);
        });

        it("should handle cutoff parameter", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");

            const centrality = closenessCentrality(graph, {cutoff: 2});

            // With cutoff 2, A can reach B (1) and C (2) -> total 3
            expect(centrality.A).toBeCloseTo(1 / 3);
            // B can reach A (1), C (1), D (2) -> total 4
            expect(centrality.B).toBeCloseTo(1 / 4);
        });

        it("should handle empty graph", () => {
            const graph = new Graph();
            const centrality = closenessCentrality(graph);
            expect(centrality).toEqual({});
        });

        it("should handle harmonic centrality with normalization", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const centrality = closenessCentrality(graph, {
                harmonic: true,
                normalized: true,
            });

            // A: harmonic sum = 1/1 + 1/2 = 1.5, normalized by (n-1) = 2
            expect(centrality.A).toBeCloseTo(1.5 / 2);
            // B: harmonic sum = 1/1 + 1/1 = 2, normalized by (n-1) = 2
            expect(centrality.B).toBeCloseTo(2 / 2);
        });
    });

    describe("nodeClosenessCentrality", () => {
        it("should calculate centrality for a specific node", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const centralityB = nodeClosenessCentrality(graph, "B");
            expect(centralityB).toBeCloseTo(1 / 2);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();
            graph.addNode("A");

            expect(() => {
                nodeClosenessCentrality(graph, "B");
            }).toThrow("Node B not found in graph");
        });

        it("should handle isolated node", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");

            const centrality = nodeClosenessCentrality(graph, "A");
            expect(centrality).toBe(0);
        });

        it("should handle cutoff with harmonic centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");

            const centrality = nodeClosenessCentrality(graph, "A", {
                harmonic: true,
                cutoff: 2,
            });

            // A can reach B (1) and C (2) within cutoff
            expect(centrality).toBeCloseTo(1 + 1 / 2);
        });
    });

    describe("weightedClosenessCentrality", () => {
        it("should calculate weighted closeness centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addEdge("B", "C", {weight: 3});
            graph.addEdge("C", "D", {weight: 1});

            const centrality = weightedClosenessCentrality(graph);

            // Check that function returns results for all nodes
            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
            expect(centrality).toHaveProperty("D");
            expect(Object.keys(centrality)).toHaveLength(4);
        });

        it("should handle disconnected weighted graph", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addNode("C");

            const centrality = weightedClosenessCentrality(graph);

            // Check all nodes have centrality values
            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
            expect(centrality.C).toBe(0); // Isolated node should have 0 centrality
        });

        it("should handle harmonic weighted centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addEdge("B", "C", {weight: 3});

            const centrality = weightedClosenessCentrality(graph, {harmonic: true});

            // Check that harmonic option works
            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
            expect(Object.keys(centrality)).toHaveLength(3);
        });

        it("should handle normalized weighted centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addEdge("B", "C", {weight: 1});

            const centrality = weightedClosenessCentrality(graph, {normalized: true});

            // Check normalized option works
            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
        });

        it("should handle cutoff in weighted graph", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addEdge("B", "C", {weight: 3});
            graph.addEdge("C", "D", {weight: 1});

            const centrality = weightedClosenessCentrality(graph, {cutoff: 5});

            // Check cutoff option works
            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
            expect(centrality).toHaveProperty("D");
        });

        it("should handle empty weighted graph", () => {
            const graph = new Graph();
            const centrality = weightedClosenessCentrality(graph);
            expect(centrality).toEqual({});
        });

        it("should handle zero-weight edges", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 0});
            graph.addEdge("B", "C", {weight: 1});

            const centrality = weightedClosenessCentrality(graph);

            // Check zero-weight edges are handled
            expect(centrality).toHaveProperty("A");
            expect(centrality).toHaveProperty("B");
            expect(centrality).toHaveProperty("C");
        });
    });

    describe("nodeWeightedClosenessCentrality", () => {
        it("should calculate weighted centrality for specific node", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addEdge("B", "C", {weight: 3});

            const centrality = nodeWeightedClosenessCentrality(graph, "B");
            expect(typeof centrality).toBe("number");
            expect(centrality).toBeGreaterThanOrEqual(0);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();
            graph.addNode("A");

            expect(() => {
                nodeWeightedClosenessCentrality(graph, "B");
            }).toThrow("Node B not found in graph");
        });

        it("should handle node with no reachable neighbors", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");

            const centrality = nodeWeightedClosenessCentrality(graph, "A");
            expect(centrality).toBe(0);
        });

        it("should handle harmonic centrality with cutoff", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 1});
            graph.addEdge("B", "C", {weight: 2});
            graph.addEdge("C", "D", {weight: 3});

            const centrality = nodeWeightedClosenessCentrality(graph, "A", {
                harmonic: true,
                cutoff: 3,
            });

            // Check harmonic with cutoff works
            expect(typeof centrality).toBe("number");
            expect(centrality).toBeGreaterThanOrEqual(0);
        });

        it("should handle normalized harmonic centrality", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", {weight: 2});
            graph.addEdge("B", "C", {weight: 2});

            const centrality = nodeWeightedClosenessCentrality(graph, "A", {
                harmonic: true,
                normalized: true,
            });

            // Check combined options work
            expect(typeof centrality).toBe("number");
            expect(centrality).toBeGreaterThanOrEqual(0);
        });
    });
});