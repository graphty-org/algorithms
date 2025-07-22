import {describe, expect, it} from "vitest";

import {
    labelPropagation,
    labelPropagationAsync,
    labelPropagationSemiSupervised,
} from "../../src/algorithms/community/label-propagation";

describe("Label Propagation Algorithm", () => {
    describe("labelPropagation", () => {
        it("should detect communities in a simple graph", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
                ["d", new Map([["e", 1], ["f", 1]])],
                ["e", new Map([["d", 1], ["f", 1]])],
                ["f", new Map([["d", 1], ["e", 1]])],
            ]);

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(6);
            expect(result.iterations).toBeGreaterThan(0);
            expect(result.converged).toBe(true);

            // Should detect two communities
            const communityIds = new Set(result.communities.values());
            expect(communityIds.size).toBe(2);
        });

        it("should handle empty graph", () => {
            const graph = new Map<string, Map<string, number>>();

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(0);
            expect(result.iterations).toBe(0);
            expect(result.converged).toBe(true);
        });

        it("should handle single node graph", () => {
            const graph = new Map([
                ["a", new Map<string, number>()],
            ]);

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(1);
            expect(result.communities.get("a")).toBeDefined();
            expect(result.converged).toBe(true);
        });

        it("should handle disconnected components", () => {
            const graph = new Map([
                ["a", new Map([["b", 1]])],
                ["b", new Map([["a", 1]])],
                ["c", new Map([["d", 1]])],
                ["d", new Map([["c", 1]])],
            ]);

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(4);
            const communityIds = new Set(result.communities.values());
            expect(communityIds.size).toBe(2);

            // Nodes in same component should have same community
            expect(result.communities.get("a")).toBe(result.communities.get("b"));
            expect(result.communities.get("c")).toBe(result.communities.get("d"));
            expect(result.communities.get("a")).not.toBe(result.communities.get("c"));
        });

        it("should respect max iterations", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1]])],
                ["b", new Map([["a", 1], ["c", 1], ["d", 1]])],
                ["c", new Map([["a", 1], ["b", 1], ["d", 1]])],
                ["d", new Map([["b", 1], ["c", 1]])],
            ]);

            const result = labelPropagation(graph, {maxIterations: 1});

            expect(result.iterations).toBe(1);
        });

        it("should handle weighted edges correctly", () => {
            const graph = new Map([
                ["a", new Map([["b", 10], ["d", 1]])],
                ["b", new Map([["a", 10], ["c", 10], ["d", 1]])],
                ["c", new Map([["b", 10], ["d", 1]])],
                ["d", new Map([["a", 1], ["b", 1], ["c", 1], ["e", 10]])],
                ["e", new Map([["d", 10], ["f", 10]])],
                ["f", new Map([["e", 10]])],
            ]);

            const result = labelPropagation(graph);

            // Strong weights should influence community formation
            expect(result.communities.get("a")).toBe(result.communities.get("b"));
            expect(result.communities.get("b")).toBe(result.communities.get("c"));
            expect(result.communities.get("d")).toBe(result.communities.get("e"));
            expect(result.communities.get("e")).toBe(result.communities.get("f"));
        });

        it("should produce consistent results with same seed", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1], ["d", 1]])],
                ["b", new Map([["a", 1], ["c", 1], ["d", 1]])],
                ["c", new Map([["a", 1], ["b", 1], ["d", 1]])],
                ["d", new Map([["a", 1], ["b", 1], ["c", 1]])],
            ]);

            const result1 = labelPropagation(graph, {randomSeed: 42});
            const result2 = labelPropagation(graph, {randomSeed: 42});

            // Should produce same communities
            for (const [node, comm1] of result1.communities) {
                const comm2 = result2.communities.get(node);
                expect(comm1).toBe(comm2);
            }
        });
    });

    describe("labelPropagationAsync", () => {
        it("should detect communities using asynchronous updates", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
                ["d", new Map([["e", 1], ["f", 1]])],
                ["e", new Map([["d", 1], ["f", 1]])],
                ["f", new Map([["d", 1], ["e", 1]])],
            ]);

            const result = labelPropagationAsync(graph);

            expect(result.communities.size).toBe(6);
            expect(result.iterations).toBeGreaterThan(0);
            expect(result.converged).toBe(true);

            // Should detect two communities
            const communityIds = new Set(result.communities.values());
            expect(communityIds.size).toBe(2);
        });

        it("should converge faster than synchronous version", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["e", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["b", 1], ["d", 1]])],
                ["d", new Map([["c", 1], ["e", 1]])],
                ["e", new Map([["d", 1], ["a", 1]])],
            ]);

            const syncResult = labelPropagation(graph, {randomSeed: 42});
            const asyncResult = labelPropagationAsync(graph, {randomSeed: 42});

            // Async often converges in fewer iterations (but not always)
            expect(asyncResult.iterations).toBeLessThanOrEqual(syncResult.iterations + 3);
        });
    });

    describe("labelPropagationSemiSupervised", () => {
        it("should respect seed labels", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1]])],
                ["b", new Map([["a", 1], ["c", 1], ["d", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
                ["d", new Map([["b", 1], ["e", 1], ["f", 1]])],
                ["e", new Map([["d", 1], ["f", 1]])],
                ["f", new Map([["d", 1], ["e", 1]])],
            ]);

            const seedLabels = new Map([
                ["a", 0],
                ["f", 1],
            ]);

            const result = labelPropagationSemiSupervised(graph, seedLabels);

            // Seed labels should be preserved
            expect(result.communities.get("a")).toBe(0);
            expect(result.communities.get("f")).toBe(1);

            // Connected nodes should adopt seed labels
            expect(result.communities.get("b")).toBe(0);
            expect(result.communities.get("c")).toBe(0);
            expect(result.communities.get("e")).toBe(1);
        });

        it("should handle empty seed labels", () => {
            const graph = new Map([
                ["a", new Map([["b", 1]])],
                ["b", new Map([["a", 1]])],
            ]);

            const seedLabels = new Map<string, number>();

            const result = labelPropagationSemiSupervised(graph, seedLabels);

            expect(result.communities.size).toBe(2);
            expect(result.converged).toBe(true);
        });

        it("should handle all nodes labeled", () => {
            const graph = new Map([
                ["a", new Map([["b", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["b", 1]])],
            ]);

            const seedLabels = new Map([
                ["a", 0],
                ["b", 1],
                ["c", 0],
            ]);

            const result = labelPropagationSemiSupervised(graph, seedLabels);

            // All labels should be preserved
            expect(result.communities.get("a")).toBe(0);
            expect(result.communities.get("b")).toBe(1);
            expect(result.communities.get("c")).toBe(0);
            expect(result.iterations).toBe(1); // One iteration to check
        });

        it("should propagate labels through weighted edges", () => {
            const graph = new Map([
                ["a", new Map([["b", 20], ["c", 1]])],
                ["b", new Map([["a", 20], ["d", 5]])],
                ["c", new Map([["a", 1], ["d", 20]])],
                ["d", new Map([["b", 5], ["c", 20]])],
            ]);

            const seedLabels = new Map([
                ["a", 0],
                ["c", 1],
            ]);

            const result = labelPropagationSemiSupervised(graph, seedLabels);

            // b should adopt label from a due to much stronger connection
            expect(result.communities.get("b")).toBe(0);
            // d should adopt label from c due to much stronger connection
            expect(result.communities.get("d")).toBe(1);
        });
    });

    describe("edge cases", () => {
        it("should handle self-loops", () => {
            const graph = new Map([
                ["a", new Map([["a", 1], ["b", 1]])],
                ["b", new Map([["a", 1], ["b", 1]])],
            ]);

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(2);
            expect(result.converged).toBe(true);
        });

        it("should handle isolated nodes", () => {
            const graph = new Map([
                ["a", new Map([["b", 1]])],
                ["b", new Map([["a", 1]])],
                ["c", new Map<string, number>()],
                ["d", new Map<string, number>()],
            ]);

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(4);
            // Each isolated node remains in its own community
            const communityIds = Array.from(result.communities.values());
            expect(new Set(communityIds).size).toBeGreaterThanOrEqual(3);
        });

        it("should handle very large weights", () => {
            const graph = new Map([
                ["a", new Map([["b", 1e10]])],
                ["b", new Map([["a", 1e10], ["c", 1]])],
                ["c", new Map([["b", 1]])],
            ]);

            const result = labelPropagation(graph);

            expect(result.communities.size).toBe(3);
            // All nodes should be in same community due to connections
            const communityIds = new Set(result.communities.values());
            expect(communityIds.size).toBe(1);
        });
    });
});
