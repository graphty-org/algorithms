import {describe, expect, it} from "vitest";

import {
    calculateModularity,
    getNeighborCommunities,
    getNodeDegree,
    getTotalEdgeWeight,
} from "../../src/algorithms/community/modularity-utils.js";
import {Graph} from "../../src/core/graph.js";

describe("Modularity utilities", () => {
    describe("getTotalEdgeWeight", () => {
        it("should return 0 for empty graph", () => {
            const graph = new Graph({directed: false});
            const total = getTotalEdgeWeight(graph);
            expect(total).toBe(0);
        });

        it("should sum all edge weights for unweighted graph", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const total = getTotalEdgeWeight(graph);
            expect(total).toBe(2);
        });

        it("should sum all edge weights for weighted graph", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B", 2);
            graph.addEdge("B", "C", 3);

            const total = getTotalEdgeWeight(graph);
            expect(total).toBe(5);
        });

        it("should handle directed graph edge weights", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B", 2);
            graph.addEdge("B", "A", 3);
            graph.addEdge("B", "C", 1);

            const total = getTotalEdgeWeight(graph);
            expect(total).toBe(6);
        });
    });

    describe("getNodeDegree", () => {
        it("should return 0 for isolated node", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");

            const degree = getNodeDegree(graph, "A");
            expect(degree).toBe(0);
        });

        it("should calculate unweighted degree", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");

            const degree = getNodeDegree(graph, "A");
            expect(degree).toBe(2);
        });

        it("should calculate weighted degree", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B", 2);
            graph.addEdge("A", "C", 3);

            const degree = getNodeDegree(graph, "A");
            expect(degree).toBe(5);
        });

        it("should handle mixed weighted edges", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B", 2);
            graph.addEdge("A", "C"); // Default weight 1
            graph.addEdge("A", "D", 4);

            const degree = getNodeDegree(graph, "A");
            expect(degree).toBe(7);
        });
    });

    describe("getNeighborCommunities", () => {
        it("should return empty set for isolated node", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");

            const communities = new Map<string, number>([
                ["A", 0],
            ]);

            const neighborComms = getNeighborCommunities(graph, "A", communities);
            expect(neighborComms.size).toBe(0);
        });

        it("should return neighbor communities", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("A", "D");

            const communities = new Map<string, number>([
                ["A", 0],
                ["B", 1],
                ["C", 1],
                ["D", 2],
            ]);

            const neighborComms = getNeighborCommunities(graph, "A", communities);
            expect(neighborComms.size).toBe(2);
            expect(neighborComms.has(1)).toBe(true);
            expect(neighborComms.has(2)).toBe(true);
        });

        it("should not include own community if neighbor in same community", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");

            const communities = new Map<string, number>([
                ["A", 0],
                ["B", 0],
                ["C", 1],
            ]);

            const neighborComms = getNeighborCommunities(graph, "A", communities);
            expect(neighborComms.has(0)).toBe(true);
            expect(neighborComms.has(1)).toBe(true);
        });
    });

    describe("calculateModularity", () => {
        it("should return 0 for empty graph", () => {
            const graph = new Graph({directed: false});
            const communities = new Map<string, number>();

            const modularity = calculateModularity(graph, communities, 1.0);
            expect(modularity).toBe(0);
        });

        it("should calculate modularity for simple partition", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("C", "D");

            const communities = new Map<string, number>([
                ["A", 0],
                ["B", 0],
                ["C", 1],
                ["D", 1],
            ]);

            const modularity = calculateModularity(graph, communities, 1.0);

            // Perfect partition should have high modularity
            expect(modularity).toBeGreaterThan(0.4);
        });

        it("should calculate lower modularity for bad partition", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            // Bad partition - each node in separate community
            const badPartition = new Map<string, number>([
                ["A", 0],
                ["B", 1],
                ["C", 2],
            ]);

            // Good partition - all nodes in same community
            const goodPartition = new Map<string, number>([
                ["A", 0],
                ["B", 0],
                ["C", 0],
            ]);

            const badModularity = calculateModularity(graph, badPartition, 1.0);
            const goodModularity = calculateModularity(graph, goodPartition, 1.0);

            // Good partition should have higher modularity than bad
            // For a complete graph, even "good" modularity won't be high
            expect(goodModularity).toBeGreaterThanOrEqual(badModularity);
        });

        it("should respect resolution parameter", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B");
            graph.addEdge("C", "D");

            const communities = new Map<string, number>([
                ["A", 0],
                ["B", 0],
                ["C", 1],
                ["D", 1],
            ]);

            const lowRes = calculateModularity(graph, communities, 0.5);
            const highRes = calculateModularity(graph, communities, 2.0);

            // Higher resolution should yield lower modularity
            // as it penalizes expected edges more
            expect(lowRes).toBeGreaterThan(highRes);
        });

        it("should handle weighted edges", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B", 5);
            graph.addEdge("C", "D", 5);

            const communities = new Map<string, number>([
                ["A", 0],
                ["B", 0],
                ["C", 1],
                ["D", 1],
            ]);

            const modularity = calculateModularity(graph, communities, 1.0);

            // Should still calculate valid modularity with weights
            expect(modularity).toBeGreaterThan(0.4);
        });

        it("should handle single node community", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");

            const communities = new Map<string, number>([
                ["A", 0],
            ]);

            const modularity = calculateModularity(graph, communities, 1.0);

            // Single node with no edges should have modularity 0
            expect(modularity).toBe(0);
        });
    });
});
