import {describe, expect, it} from "vitest";

import {
    bfsAugmentingPath,
    bfsColoringWithPartitions,
    bfsDistancesOnly,
    bfsWeightedDistances,
    bfsWithPathCounting,
} from "../../src/algorithms/traversal/bfs-variants.js";
import {Graph} from "../../src/core/graph.js";

describe("BFS Variants", () => {
    describe("bfsWithPathCounting", () => {
        it("should track shortest path counts correctly", () => {
            const graph = new Graph();
            // Diamond graph: A -> B,C -> D
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");

            const result = bfsWithPathCounting(graph, "A");

            // Check distances
            expect(result.distances.get("A")).toBe(0);
            expect(result.distances.get("B")).toBe(1);
            expect(result.distances.get("C")).toBe(1);
            expect(result.distances.get("D")).toBe(2);

            // Check path counts (sigma)
            expect(result.sigma.get("A")).toBe(1);
            expect(result.sigma.get("B")).toBe(1);
            expect(result.sigma.get("C")).toBe(1);
            expect(result.sigma.get("D")).toBe(2); // Two paths: A->B->D and A->C->D

            // Check predecessors
            expect(result.predecessors.get("B")).toEqual(["A"]);
            expect(result.predecessors.get("C")).toEqual(["A"]);
            expect(result.predecessors.get("D")?.sort()).toEqual(["B", "C"]);

            // Check stack order (reverse BFS)
            expect(result.stack).toEqual(["A", "B", "C", "D"]);
        });

        it("should handle disconnected nodes", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addNode("C"); // Disconnected

            const result = bfsWithPathCounting(graph, "A");

            expect(result.distances.has("C")).toBe(false);
            expect(result.sigma.has("C")).toBe(false);
            expect(result.stack).not.toContain("C");
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("A", "C"); // Direct path

            const result = bfsWithPathCounting(graph, "A");

            expect(result.distances.get("C")).toBe(1); // Direct path
            expect(result.sigma.get("C")).toBe(1); // Only one shortest path
            expect(result.predecessors.get("C")).toEqual(["A"]);
        });
    });

    describe("bfsDistancesOnly", () => {
        it("should compute distances efficiently", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");

            const distances = bfsDistancesOnly(graph, "A");

            expect(distances.get("A")).toBe(0);
            expect(distances.get("B")).toBe(1);
            expect(distances.get("C")).toBe(2);
            expect(distances.get("D")).toBe(3);
        });

        it("should respect cutoff parameter", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");

            const distances = bfsDistancesOnly(graph, "A", 2);

            expect(distances.get("A")).toBe(0);
            expect(distances.get("B")).toBe(1);
            expect(distances.get("C")).toBe(2);
            expect(distances.has("D")).toBe(false); // Beyond cutoff
        });

        it("should handle cyclic graphs", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A"); // Cycle

            const distances = bfsDistancesOnly(graph, "A");

            expect(distances.get("A")).toBe(0);
            expect(distances.get("B")).toBe(1);
            expect(distances.get("C")).toBe(1); // Also distance 1 from A in undirected graph
        });
    });

    describe("bfsColoringWithPartitions", () => {
        it("should identify bipartite graph with partitions", () => {
            const graph = new Graph();
            // Bipartite: {A,C} - {B,D}
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "A");

            const result = bfsColoringWithPartitions(graph);

            expect(result.isBipartite).toBe(true);
            expect(result.partitions).toBeDefined();

            const [partA, partB] = result.partitions!;
            expect(partA.size).toBe(2);
            expect(partB.size).toBe(2);

            // Check that A and C are in same partition
            const aInPartA = partA.has("A");
            expect(partA.has("C")).toBe(aInPartA);
            expect(partB.has("C")).toBe(!aInPartA);
        });

        it("should detect non-bipartite graph", () => {
            const graph = new Graph();
            // Triangle - not bipartite
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const result = bfsColoringWithPartitions(graph);

            expect(result.isBipartite).toBe(false);
            expect(result.partitions).toBeUndefined();
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();
            // Component 1: A-B
            graph.addEdge("A", "B");
            // Component 2: C-D
            graph.addEdge("C", "D");

            const result = bfsColoringWithPartitions(graph);

            expect(result.isBipartite).toBe(true);
            expect(result.partitions).toBeDefined();

            const [partA, partB] = result.partitions!;
            expect(partA.size + partB.size).toBe(4);

            // A and C should be in different partitions from B and D
            const aInPartA = partA.has("A");
            expect(partA.has("B")).toBe(!aInPartA);
            expect(partB.has("B")).toBe(aInPartA);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("A");

            const result = bfsColoringWithPartitions(graph);

            expect(result.isBipartite).toBe(true);
            expect(result.partitions![0].size + result.partitions![1].size).toBe(1);
        });
    });

    describe("bfsAugmentingPath", () => {
        it("should find augmenting path in residual graph", () => {
            const residualGraph = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["b", 2], ["t", 10]])],
                ["b", new Map([["t", 10]])],
                ["t", new Map()],
            ]);

            const result = bfsAugmentingPath(residualGraph, "s", "t");

            expect(result).toBeDefined();
            expect(result!.path).toEqual(["s", "a", "t"]);
            expect(result!.pathCapacity).toBe(10);
        });

        it("should find path with minimum capacity", () => {
            const residualGraph = new Map([
                ["s", new Map([["a", 5]])],
                ["a", new Map([["b", 3]])],
                ["b", new Map([["t", 7]])],
                ["t", new Map()],
            ]);

            const result = bfsAugmentingPath(residualGraph, "s", "t");

            expect(result).toBeDefined();
            expect(result!.path).toEqual(["s", "a", "b", "t"]);
            expect(result!.pathCapacity).toBe(3); // Minimum capacity on path
        });

        it("should return null when no path exists", () => {
            const residualGraph = new Map([
                ["s", new Map([["a", 0]])], // Zero capacity
                ["a", new Map([["t", 10]])],
                ["t", new Map()],
            ]);

            const result = bfsAugmentingPath(residualGraph, "s", "t");

            expect(result).toBeNull();
        });

        it("should handle multiple paths and choose first found", () => {
            const residualGraph = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["t", 5]])],
                ["b", new Map([["t", 15]])],
                ["t", new Map()],
            ]);

            const result = bfsAugmentingPath(residualGraph, "s", "t");

            expect(result).toBeDefined();
            // BFS will find shortest path first
            expect(result!.path.length).toBe(3);
            expect(["s", "t"].every((node) => result!.path.includes(node))).toBe(true);
        });
    });

    describe("bfsWeightedDistances", () => {
        it("should compute weighted distances", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", 2); // weight as third parameter
            graph.addEdge("B", "C", 3);
            graph.addEdge("A", "C", 10); // Direct but longer

            const distances = bfsWeightedDistances(graph, "A");

            expect(distances.get("A")).toBe(0);
            expect(distances.get("B")).toBe(2);
            expect(distances.get("C")).toBe(5); // Via B, not direct
        });

        it("should respect cutoff for weighted graphs", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", 2);
            graph.addEdge("B", "C", 3);
            graph.addEdge("C", "D", 4);

            const distances = bfsWeightedDistances(graph, "A", 5);

            expect(distances.get("A")).toBe(0);
            expect(distances.get("B")).toBe(2);
            expect(distances.get("C")).toBe(5);
            expect(distances.has("D")).toBe(false); // Would be 9, beyond cutoff
        });

        it("should handle graphs with default weight 1", () => {
            const graph = new Graph();
            graph.addEdge("A", "B"); // No weight specified
            graph.addEdge("B", "C", 2);

            const distances = bfsWeightedDistances(graph, "A");

            expect(distances.get("B")).toBe(1); // Default weight
            expect(distances.get("C")).toBe(3); // 1 + 2
        });

        it("should find shortest weighted paths", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", 1);
            graph.addEdge("A", "C", 4);
            graph.addEdge("B", "C", 2);
            graph.addEdge("B", "D", 5);
            graph.addEdge("C", "D", 1);

            const distances = bfsWeightedDistances(graph, "A");

            expect(distances.get("D")).toBe(4); // A->B->C->D = 1+2+1
        });
    });
});
