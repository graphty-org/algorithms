import {describe, expect, it} from "vitest";

import {
    kargerMinCut,
    minSTCut,
    stoerWagner} from "../../src/flow/min-cut";

describe("Minimum Cut Algorithms", () => {
    describe("minSTCut", () => {
        it("should find minimum s-t cut in simple graph", () => {
            const graph = new Map([
                ["s", new Map([["a", 3], ["b", 2]])],
                ["a", new Map([["t", 2]])],
                ["b", new Map([["t", 3]])],
                ["t", new Map()],
            ]);

            const result = minSTCut(graph, "s", "t");

            // For this graph: s->a(3), s->b(2), a->t(2), b->t(3)
            // Path 1: s->a->t flow = min(3,2) = 2
            // Path 2: s->b->t flow = min(2,3) = 2
            // Total max flow = 2 + 2 = 4
            expect(result.cutValue).toBe(4);
            expect(result.partition1.has("s")).toBe(true);
            expect(result.partition2.has("t")).toBe(true);
            expect(result.cutEdges.length).toBeGreaterThan(0);
        });

        it("should find bottleneck cut", () => {
            const graph = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["c", 1]])], // Bottleneck
                ["b", new Map([["c", 1]])], // Bottleneck
                ["c", new Map([["t", 10]])],
                ["t", new Map()],
            ]);

            const result = minSTCut(graph, "s", "t");

            expect(result.cutValue).toBe(2);
            // The cut should separate {s, a, b} from {c, t}
            expect(result.partition1.has("s")).toBe(true);
            expect(result.partition1.has("a")).toBe(true);
            expect(result.partition1.has("b")).toBe(true);
            expect(result.partition2.has("c")).toBe(true);
            expect(result.partition2.has("t")).toBe(true);
        });

        it("should handle single edge cut", () => {
            const graph = new Map([
                ["s", new Map([["a", 5]])],
                ["a", new Map([["b", 3]])], // Min cut
                ["b", new Map([["t", 4]])],
                ["t", new Map()],
            ]);

            const result = minSTCut(graph, "s", "t");

            expect(result.cutValue).toBe(3);
            expect(result.cutEdges).toHaveLength(1);
            expect(result.cutEdges[0]).toEqual({from: "a", to: "b", weight: 3});
        });

        it("should return empty cut for non-existent nodes", () => {
            const graph = new Map([
                ["a", new Map([["b", 10]])],
            ]);

            const result = minSTCut(graph, "x", "y");

            expect(result.cutValue).toBe(0);
            expect(result.partition1.size).toBe(0);
            expect(result.partition2.size).toBe(0);
        });

        it("should handle disconnected source and sink", () => {
            const graph = new Map([
                ["s", new Map([["a", 10]])],
                ["a", new Map()],
                ["b", new Map([["t", 10]])],
                ["t", new Map()],
            ]);

            const result = minSTCut(graph, "s", "t");

            expect(result.cutValue).toBe(0);
            expect(result.cutEdges).toHaveLength(0);
        });
    });

    describe("stoerWagner", () => {
        it("should find global minimum cut in simple graph", () => {
            const graph = new Map([
                ["a", new Map([["b", 2], ["c", 3]])],
                ["b", new Map([["a", 2], ["c", 1], ["d", 3]])],
                ["c", new Map([["a", 3], ["b", 1], ["d", 1]])],
                ["d", new Map([["b", 3], ["c", 1]])],
            ]);

            const result = stoerWagner(graph);

            // The minimum cut should separate one node from the rest
            // Cut d from {a,b,c}: edges c-d(1) + b-d(3) = 4
            // Or cut between {a,c} and {b,d}: edges a-b(2) + c-b(1) + c-d(1) = 4
            // Both have value 4, which is the minimum
            expect(result.cutValue).toBe(4);
            expect(result.partition1.size + result.partition2.size).toBe(4);
        });

        it("should handle complete graph", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1], ["d", 1]])],
                ["b", new Map([["a", 1], ["c", 1], ["d", 1]])],
                ["c", new Map([["a", 1], ["b", 1], ["d", 1]])],
                ["d", new Map([["a", 1], ["b", 1], ["c", 1]])],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(3); // Cut one node from others
        });

        it("should handle graph with different weight edges", () => {
            const graph = new Map([
                ["a", new Map([["b", 10], ["c", 1]])],
                ["b", new Map([["a", 10], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(2); // Cut c from {a, b}
        });

        it("should handle single edge graph", () => {
            const graph = new Map([
                ["a", new Map([["b", 5]])],
                ["b", new Map([["a", 5]])],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(5);
            expect(result.cutEdges).toHaveLength(1);
        });

        it("should handle empty graph", () => {
            const graph = new Map<string, Map<string, number>>();

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(0);
            expect(result.partition1.size).toBe(0);
            expect(result.partition2.size).toBe(0);
        });

        it("should handle single node graph", () => {
            const graph = new Map([
                ["a", new Map()],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(0);
            expect(result.partition1.size).toBe(1);
            expect(result.partition2.size).toBe(0);
        });

        it("should find correct cut in weighted cycle", () => {
            const graph = new Map([
                ["a", new Map([["b", 3], ["d", 2]])],
                ["b", new Map([["a", 3], ["c", 4]])],
                ["c", new Map([["b", 4], ["d", 1]])],
                ["d", new Map([["c", 1], ["a", 2]])],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(3); // Cut between {c,d} and {a,b}
        });
    });

    describe("kargerMinCut", () => {
        it("should find minimum cut with high probability", () => {
            const graph = new Map([
                ["a", new Map([["b", 2], ["c", 3]])],
                ["b", new Map([["a", 2], ["c", 1], ["d", 3]])],
                ["c", new Map([["a", 3], ["b", 1], ["d", 1]])],
                ["d", new Map([["b", 3], ["c", 1]])],
            ]);

            // Run multiple times to ensure we get the correct answer
            let minCut = Infinity;
            for (let i = 0; i < 10; i++) {
                const result = kargerMinCut(graph, 100);
                minCut = Math.min(minCut, result.cutValue);
            }

            expect(minCut).toBe(4); // Same as Stoer-Wagner result
        });

        it("should handle simple triangle graph", () => {
            const graph = new Map([
                ["a", new Map([["b", 1], ["c", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
            ]);

            const result = kargerMinCut(graph, 100);

            expect(result.cutValue).toBe(2);
        });

        it("should handle graph with multiple min cuts", () => {
            const graph = new Map([
                ["a", new Map([["b", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["b", 1], ["d", 1]])],
                ["d", new Map([["c", 1]])],
            ]);

            const result = kargerMinCut(graph, 100);

            expect(result.cutValue).toBe(1);
            expect(result.cutEdges).toHaveLength(1);
        });

        it("should handle complete graph", () => {
            const n = 5;
            const graph = new Map<string, Map<string, number>>();

            // Create complete graph
            for (let i = 0; i < n; i++) {
                graph.set(`v${i}`, new Map());
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        graph.get(`v${i}`)!.set(`v${j}`, 1);
                    }
                }
            }

            const result = kargerMinCut(graph, 200);

            expect(result.cutValue).toBe(n - 1); // Min cut in complete graph
        });

        it("should handle weighted edges correctly", () => {
            const graph = new Map([
                ["a", new Map([["b", 10], ["c", 1]])],
                ["b", new Map([["a", 10], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
            ]);

            const result = kargerMinCut(graph, 200);

            expect(result.cutValue).toBe(2);
        });

        it("should work with single iteration", () => {
            const graph = new Map([
                ["a", new Map([["b", 5]])],
                ["b", new Map([["a", 5]])],
            ]);

            const result = kargerMinCut(graph, 1);

            expect(result.cutValue).toBe(5);
        });
    });

    describe("edge cases", () => {
        it("should handle graphs with parallel edges", () => {
            const graph = new Map([
                ["a", new Map([["b", 5]])],
                ["b", new Map([["a", 5]])], // Parallel edge in undirected representation
            ]);

            const stResult = stoerWagner(graph);
            const kResult = kargerMinCut(graph, 50);

            expect(stResult.cutValue).toBe(5);
            expect(kResult.cutValue).toBe(5);
        });

        it("should handle large weights", () => {
            const graph = new Map([
                ["a", new Map([["b", 1e6], ["c", 1]])],
                ["b", new Map([["a", 1e6], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(2);
        });

        it("should handle fractional weights", () => {
            const graph = new Map([
                ["a", new Map([["b", 2.5], ["c", 1.5]])],
                ["b", new Map([["a", 2.5], ["c", 0.5]])],
                ["c", new Map([["a", 1.5], ["b", 0.5]])],
            ]);

            const result = stoerWagner(graph);

            expect(result.cutValue).toBe(2);
        });

        it("should provide consistent partitions", () => {
            const graph = new Map([
                ["a", new Map([["b", 3], ["c", 2]])],
                ["b", new Map([["a", 3], ["d", 2]])],
                ["c", new Map([["a", 2], ["d", 3]])],
                ["d", new Map([["b", 2], ["c", 3]])],
            ]);

            const result = stoerWagner(graph);

            // Every node should be in exactly one partition
            const allNodes = new Set(["a", "b", "c", "d"]);
            for (const node of allNodes) {
                const inP1 = result.partition1.has(node);
                const inP2 = result.partition2.has(node);
                expect(inP1 || inP2).toBe(true);
                expect(inP1 && inP2).toBe(false);
            }
        });
    });
});
