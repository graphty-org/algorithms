import {describe, expect, it} from "vitest";

import {
    degeneracyOrdering,
    getKCore,
    getKCoreSubgraph,
    kCoreDecomposition,
    kTruss,
    toUndirected} from "../../src/clustering/k-core";

describe("K-Core Decomposition", () => {
    describe("kCoreDecomposition", () => {
        it("should find k-cores in a simple graph", () => {
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["b", "c", "e"])],
                ["e", new Set(["d"])],
            ]);

            const result = kCoreDecomposition(graph);

            // e has degree 1, so it's in 1-core
            // After removing e, d has degree 2
            // a, b, c all have degree 2 after e is removed
            // So a, b, c, d form a 2-core
            expect(result.coreness.get("e")).toBe(1);
            expect(result.coreness.get("a")).toBe(2);
            expect(result.coreness.get("b")).toBe(2);
            expect(result.coreness.get("c")).toBe(2);
            expect(result.coreness.get("d")).toBe(2);
            expect(result.maxCore).toBe(2);
        });

        it("should handle complete graph", () => {
            const graph = new Map([
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c"])],
            ]);

            const result = kCoreDecomposition(graph);

            expect(result.maxCore).toBe(3); // Complete graph of 4 nodes
            for (const node of ["a", "b", "c", "d"]) {
                expect(result.coreness.get(node)).toBe(3);
            }
        });

        it("should handle star graph", () => {
            const graph = new Map([
                ["center", new Set(["a", "b", "c", "d", "e"])],
                ["a", new Set(["center"])],
                ["b", new Set(["center"])],
                ["c", new Set(["center"])],
                ["d", new Set(["center"])],
                ["e", new Set(["center"])],
            ]);

            const result = kCoreDecomposition(graph);

            expect(result.maxCore).toBe(1); // Star graph has max core 1
            for (const node of graph.keys()) {
                expect(result.coreness.get(node)).toBe(1);
            }
        });

        it("should handle disconnected graph", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
                ["c", new Set(["d"])],
                ["d", new Set(["c"])],
            ]);

            const result = kCoreDecomposition(graph);

            expect(result.maxCore).toBe(1);
            expect(result.cores.get(1)?.size).toBe(4);
        });

        it("should handle empty graph", () => {
            const graph = new Map<string, Set<string>>();

            const result = kCoreDecomposition(graph);

            expect(result.maxCore).toBe(0);
            expect(result.cores.size).toBe(0);
            expect(result.coreness.size).toBe(0);
        });

        it("should handle single node", () => {
            const graph = new Map([
                ["a", new Set<string>()],
            ]);

            const result = kCoreDecomposition(graph);

            expect(result.maxCore).toBe(0);
            expect(result.coreness.get("a")).toBe(0);
        });

        it("should handle graph with varying densities", () => {
            const graph = new Map([
                // Dense cluster
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c", "e"])],
                // Bridge
                ["e", new Set(["d", "f"])],
                // Less dense cluster
                ["f", new Set(["e", "g", "h"])],
                ["g", new Set(["f", "h"])],
                ["h", new Set(["f", "g"])],
            ]);

            const result = kCoreDecomposition(graph);

            expect(result.coreness.get("a")).toBe(3);
            expect(result.coreness.get("e")).toBe(2);
            expect(result.coreness.get("f")).toBe(2);
        });
    });

    describe("getKCore", () => {
        it("should extract k-core nodes", () => {
            const graph = new Map([
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c", "e"])],
                ["e", new Set(["d"])],
            ]);

            const core2 = getKCore(graph, 2);
            const core3 = getKCore(graph, 3);

            expect(core2.size).toBe(4); // a, b, c, d
            expect(core2.has("e")).toBe(false);
            expect(core3.size).toBe(4); // All nodes with coreness >= 3
        });

        it("should return empty set for k > max core", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
            ]);

            const core5 = getKCore(graph, 5);

            expect(core5.size).toBe(0);
        });
    });

    describe("getKCoreSubgraph", () => {
        it("should extract k-core subgraph", () => {
            const graph = new Map([
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c", "e"])],
                ["e", new Set(["d", "f"])],
                ["f", new Set(["e"])],
            ]);

            const subgraph = getKCoreSubgraph(graph, 3);

            expect(subgraph.size).toBe(4); // Only a, b, c, d
            expect(subgraph.get("a")?.size).toBe(3);
            expect(subgraph.get("d")?.has("e")).toBe(false); // e is not in 3-core
        });

        it("should handle empty k-core", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
            ]);

            const subgraph = getKCoreSubgraph(graph, 5);

            expect(subgraph.size).toBe(0);
        });
    });

    describe("degeneracyOrdering", () => {
        it("should produce valid degeneracy ordering", () => {
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["b", "c", "e"])],
                ["e", new Set(["d"])],
            ]);

            const ordering = degeneracyOrdering(graph);

            expect(ordering.length).toBe(5);
            expect(ordering[0]).toBe("e"); // Lowest degree node first
            expect(new Set(ordering)).toEqual(new Set(["a", "b", "c", "d", "e"]));
        });

        it("should handle ties consistently", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
                ["c", new Set(["d"])],
                ["d", new Set(["c"])],
            ]);

            const ordering = degeneracyOrdering(graph);

            expect(ordering.length).toBe(4);
            // All nodes have same degree, any order is valid
        });
    });

    describe("kTruss", () => {
        it("should find k-truss in triangle", () => {
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["a", "b"])],
            ]);

            const truss3 = kTruss(graph, 3);

            expect(truss3.size).toBe(3); // All edges form a triangle
            expect(truss3.has("a,b")).toBe(true);
            expect(truss3.has("a,c")).toBe(true);
            expect(truss3.has("b,c")).toBe(true);
        });

        it("should find k-truss in larger graph", () => {
            const graph = new Map([
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c", "e"])],
                ["e", new Set(["d"])],
            ]);

            const truss3 = kTruss(graph, 3);
            const truss4 = kTruss(graph, 4);

            expect(truss3.size).toBeGreaterThan(0);
            expect(truss4.size).toBe(6); // Complete K4 has 6 edges in 4-truss
        });

        it("should handle graph with no triangles", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["b", "d"])],
                ["d", new Set(["c"])],
            ]);

            const truss3 = kTruss(graph, 3);

            expect(truss3.size).toBe(0); // No triangles
        });

        it("should throw error for k < 2", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
            ]);

            expect(() => kTruss(graph, 1)).toThrow("k must be at least 2");
        });

        it("should handle diamond graph", () => {
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["b", "c"])],
            ]);

            const truss3 = kTruss(graph, 3);

            // Diamond has 4 triangles, all edges participate in at least one
            expect(truss3.size).toBe(5); // All edges except one
        });
    });

    describe("toUndirected", () => {
        it("should convert directed graph to undirected", () => {
            const directed = new Map([
                ["a", new Map([["b", 1], ["c", 2]])],
                ["b", new Map([["c", 3]])],
                ["c", new Map()],
            ]);

            const undirected = toUndirected(directed);

            expect(undirected.get("a")?.has("b")).toBe(true);
            expect(undirected.get("b")?.has("a")).toBe(true);
            expect(undirected.get("c")?.size).toBe(2); // Connected to a and b
        });

        it("should handle self-loops", () => {
            const directed = new Map([
                ["a", new Map([["a", 1], ["b", 2]])],
                ["b", new Map()],
            ]);

            const undirected = toUndirected(directed);

            expect(undirected.get("a")?.has("a")).toBe(true);
            expect(undirected.get("a")?.has("b")).toBe(true);
        });

        it("should handle empty graph", () => {
            const directed = new Map<string, Map<string, number>>();
            const undirected = toUndirected(directed);

            expect(undirected.size).toBe(0);
        });
    });

    describe("performance tests", () => {
        it("should handle large sparse graph efficiently", () => {
            const graph = new Map<number, Set<number>>();

            // Create a sparse graph with 1000 nodes
            for (let i = 0; i < 1000; i++) {
                graph.set(i, new Set());
            }

            // Add edges to create a sparse structure
            for (let i = 0; i < 1000; i++) {
                // Each node connected to 2-5 others
                const degree = 2 + Math.floor(Math.random() * 4);
                for (let j = 0; j < degree; j++) {
                    const neighbor = Math.floor(Math.random() * 1000);
                    if (neighbor !== i) {
                        graph.get(i)!.add(neighbor);
                        graph.get(neighbor)!.add(i);
                    }
                }
            }

            const startTime = Date.now();
            const result = kCoreDecomposition(graph);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100); // Should be fast
            expect(result.coreness.size).toBe(1000);
            expect(result.maxCore).toBeGreaterThan(0);
        });
    });
});
