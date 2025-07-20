import {describe, expect, it} from "vitest";

import {bellmanFord, bellmanFordPath, hasNegativeCycle} from "../../src/algorithms/shortest-path/bellman-ford.js";
import {Graph} from "../../src/core/graph.js";

describe("Bellman-Ford Algorithm", () => {
    describe("bellmanFord", () => {
        it("should find shortest paths in positive weight graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 4);
            graph.addEdge("a", "c", 2);
            graph.addEdge("b", "c", 1);
            graph.addEdge("b", "d", 5);
            graph.addEdge("c", "d", 8);
            graph.addEdge("c", "e", 10);
            graph.addEdge("d", "e", 2);

            const result = bellmanFord(graph, "a");

            expect(result.hasNegativeCycle).toBe(false);
            expect(result.negativeCycleNodes).toHaveLength(0);
            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("b")).toBe(4);
            expect(result.distances.get("c")).toBe(2);
            expect(result.distances.get("d")).toBe(9);
            expect(result.distances.get("e")).toBe(11);
        });

        it("should handle negative weights without negative cycles", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("a", "c", 4);
            graph.addEdge("b", "c", -3);
            graph.addEdge("b", "d", 2);
            graph.addEdge("c", "d", 3);

            const result = bellmanFord(graph, "a");

            expect(result.hasNegativeCycle).toBe(false);
            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("b")).toBe(1);
            expect(result.distances.get("c")).toBe(-2); // a -> b -> c
            expect(result.distances.get("d")).toBe(1); // a -> b -> c -> d
        });

        it("should detect negative cycles", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", -3);
            graph.addEdge("c", "d", 2);
            graph.addEdge("d", "b", -1); // Creates negative cycle: b -> c -> d -> b

            const result = bellmanFord(graph, "a");

            expect(result.hasNegativeCycle).toBe(true);
            expect(result.negativeCycleNodes.length).toBeGreaterThan(0);
        });

        it("should handle disconnected graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("c", "d", 2);

            const result = bellmanFord(graph, "a");

            expect(result.hasNegativeCycle).toBe(false);
            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("b")).toBe(1);
            expect(result.distances.get("c")).toBe(Infinity);
            expect(result.distances.get("d")).toBe(Infinity);
        });

        it("should handle single node graph", () => {
            const graph = new Graph({directed: true});

            graph.addNode("only");

            const result = bellmanFord(graph, "only");

            expect(result.hasNegativeCycle).toBe(false);
            expect(result.distances.get("only")).toBe(0);
        });

        it("should handle early termination with target", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("a", "c", 10);
            graph.addEdge("b", "d", 1);
            graph.addEdge("c", "d", 1);

            const result = bellmanFord(graph, "a", {target: "b"});

            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("b")).toBe(1);
        });

        it("should throw error for non-existent source", () => {
            const graph = new Graph({directed: true});

            graph.addNode("a");

            expect(() => bellmanFord(graph, "nonexistent")).toThrow("Source node nonexistent not found");
        });

        it("should handle zero-weight edges", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 0);
            graph.addEdge("b", "c", 1);

            const result = bellmanFord(graph, "a");

            expect(result.distances.get("b")).toBe(0);
            expect(result.distances.get("c")).toBe(1);
        });

        it("should handle default edge weights", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = bellmanFord(graph, "a");

            expect(result.distances.get("b")).toBe(1);
            expect(result.distances.get("c")).toBe(2);
        });
    });

    describe("bellmanFordPath", () => {
        it("should find shortest path between two nodes", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("a", "c", 4);
            graph.addEdge("b", "c", 2);
            graph.addEdge("c", "d", 1);

            const result = bellmanFordPath(graph, "a", "d");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(4); // a -> b -> c -> d
            expect(result!.path).toEqual(["a", "b", "c", "d"]);
        });

        it("should return null for unreachable target", () => {
            const graph = new Graph({directed: true});

            graph.addNode("a");
            graph.addNode("b");

            const result = bellmanFordPath(graph, "a", "b");

            expect(result).toBeNull();
        });

        it("should handle same source and target", () => {
            const graph = new Graph({directed: true});

            graph.addNode("a");

            const result = bellmanFordPath(graph, "a", "a");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(0);
            expect(result!.path).toEqual(["a"]);
        });

        it("should throw error for negative cycle", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", -3);
            graph.addEdge("c", "b", 1); // Negative cycle

            expect(() => bellmanFordPath(graph, "a", "c")).toThrow("Graph contains a negative cycle");
        });

        it("should throw error for non-existent nodes", () => {
            const graph = new Graph({directed: true});

            graph.addNode("a");

            expect(() => bellmanFordPath(graph, "nonexistent", "a")).toThrow("Source node nonexistent not found");
            expect(() => bellmanFordPath(graph, "a", "nonexistent")).toThrow("Target node nonexistent not found");
        });

        it("should find path with negative weights", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 5);
            graph.addEdge("a", "c", 2);
            graph.addEdge("c", "b", -4);

            const result = bellmanFordPath(graph, "a", "b");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(-2); // a -> c -> b
            expect(result!.path).toEqual(["a", "c", "b"]);
        });
    });

    describe("hasNegativeCycle", () => {
        it("should return false for graph without negative cycle", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", 2);
            graph.addEdge("c", "a", 3);

            expect(hasNegativeCycle(graph)).toBe(false);
        });

        it("should return true for graph with negative cycle", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", -3);
            graph.addEdge("c", "a", 1); // Total cycle weight: -1

            expect(hasNegativeCycle(graph)).toBe(true);
        });

        it("should return false for empty graph", () => {
            const graph = new Graph({directed: true});

            expect(hasNegativeCycle(graph)).toBe(false);
        });

        it("should return false for single node", () => {
            const graph = new Graph({directed: true});

            graph.addNode("only");

            expect(hasNegativeCycle(graph)).toBe(false);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph({directed: true});

            // Component 1: no negative cycle
            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "a", 2);

            // Component 2: has negative cycle
            graph.addEdge("c", "d", -1);
            graph.addEdge("d", "c", -1);

            expect(hasNegativeCycle(graph)).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle self-loops", () => {
            const graph = new Graph({directed: true, allowSelfLoops: true});

            graph.addEdge("a", "a", -1); // Negative self-loop
            graph.addEdge("a", "b", 1);

            const result = bellmanFord(graph, "a");

            expect(result.hasNegativeCycle).toBe(true);
        });

        it("should work with numeric node IDs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge(1, 2, 3);
            graph.addEdge(2, 3, -1);

            const result = bellmanFord(graph, 1);

            expect(result.distances.get(1)).toBe(0);
            expect(result.distances.get(2)).toBe(3);
            expect(result.distances.get(3)).toBe(2);
        });

        it("should handle large weights", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1000000);
            graph.addEdge("a", "c", 1);
            graph.addEdge("c", "b", -999998);

            const result = bellmanFord(graph, "a");

            expect(result.distances.get("b")).toBe(-999997); // a -> c -> b is shorter
        });

        it("should handle floating point weights", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1.5);
            graph.addEdge("b", "c", -0.3);

            const result = bellmanFord(graph, "a");

            expect(result.distances.get("b")).toBeCloseTo(1.5);
            expect(result.distances.get("c")).toBeCloseTo(1.2);
        });

        it("should handle complex negative cycle detection", () => {
            const graph = new Graph({directed: true});

            // Create a complex graph with nested cycles
            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", 1);
            graph.addEdge("c", "d", -3);
            graph.addEdge("d", "b", 1); // Negative cycle: b -> c -> d -> b (weight: -1)
            graph.addEdge("c", "e", 1);
            graph.addEdge("e", "f", 1);

            const result = bellmanFord(graph, "a");

            expect(result.hasNegativeCycle).toBe(true);
        });
    });
});