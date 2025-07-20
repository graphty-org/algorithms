import {describe, expect, it} from "vitest";

import {allPairsShortestPath, dijkstra, dijkstraPath, singleSourceShortestPath} from "../../src/algorithms/shortest-path/dijkstra.js";
import {Graph} from "../../src/core/graph.js";

describe("Dijkstra Algorithm", () => {
    describe("dijkstra", () => {
        it("should find shortest paths from source to all nodes", () => {
            const graph = new Graph();

            // Create a weighted graph
            graph.addEdge("a", "b", 4);
            graph.addEdge("a", "c", 2);
            graph.addEdge("b", "c", 1);
            graph.addEdge("b", "d", 5);
            graph.addEdge("c", "d", 8);
            graph.addEdge("c", "e", 10);
            graph.addEdge("d", "e", 2);

            const results = dijkstra(graph, "a");

            expect(results.get("a")!.distance).toBe(0);
            expect(results.get("b")!.distance).toBe(3); // a -> c -> b
            expect(results.get("c")!.distance).toBe(2); // a -> c
            expect(results.get("d")!.distance).toBe(8); // a -> c -> b -> d
            expect(results.get("e")!.distance).toBe(10); // a -> c -> b -> d -> e
        });

        it("should build correct shortest path trees", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1);
            graph.addEdge("a", "c", 4);
            graph.addEdge("b", "c", 2);
            graph.addEdge("c", "d", 1);

            const results = dijkstra(graph, "a");

            expect(results.get("a")!.path).toEqual(["a"]);
            expect(results.get("b")!.path).toEqual(["a", "b"]);
            expect(results.get("c")!.path).toEqual(["a", "b", "c"]);
            expect(results.get("d")!.path).toEqual(["a", "b", "c", "d"]);
        });

        it("should handle early termination with target", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1);
            graph.addEdge("a", "c", 10);
            graph.addEdge("b", "d", 1);
            graph.addEdge("c", "d", 1);

            const results = dijkstra(graph, "a", {target: "b"});

            expect(results.has("a")).toBe(true);
            expect(results.has("b")).toBe(true);
            // May not have processed all nodes due to early termination
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two disconnected components
            graph.addEdge("a", "b", 1);
            graph.addEdge("c", "d", 1);

            const results = dijkstra(graph, "a");

            expect(results.has("a")).toBe(true);
            expect(results.has("b")).toBe(true);
            expect(results.has("c")).toBe(false);
            expect(results.has("d")).toBe(false);
        });

        it("should throw error for negative edge weights", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", -1);

            expect(() => dijkstra(graph, "a")).toThrow("Dijkstra's algorithm does not support negative edge weights");
        });

        it("should throw error for non-existent source", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => dijkstra(graph, "nonexistent")).toThrow("Source node nonexistent not found");
        });

        it("should handle single node graph", () => {
            const graph = new Graph();

            graph.addNode("only");

            const results = dijkstra(graph, "only");

            expect(results.size).toBe(1);
            expect(results.get("only")!.distance).toBe(0);
            expect(results.get("only")!.path).toEqual(["only"]);
        });

        it("should handle zero-weight edges", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 0);
            graph.addEdge("b", "c", 1);

            const results = dijkstra(graph, "a");

            expect(results.get("b")!.distance).toBe(0);
            expect(results.get("c")!.distance).toBe(1);
        });

        it("should handle default edge weights", () => {
            const graph = new Graph();

            // Add edges without explicit weights (should default to 1)
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const results = dijkstra(graph, "a");

            expect(results.get("b")!.distance).toBe(1);
            expect(results.get("c")!.distance).toBe(2);
        });
    });

    describe("dijkstraPath", () => {
        it("should find shortest path between two specific nodes", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1);
            graph.addEdge("a", "c", 4);
            graph.addEdge("b", "c", 2);
            graph.addEdge("c", "d", 1);

            const result = dijkstraPath(graph, "a", "d");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(4); // a -> b -> c -> d
            expect(result!.path).toEqual(["a", "b", "c", "d"]);
        });

        it("should return null for unreachable target", () => {
            const graph = new Graph();

            // Two disconnected nodes
            graph.addNode("a");
            graph.addNode("b");

            const result = dijkstraPath(graph, "a", "b");

            expect(result).toBeNull();
        });

        it("should handle same source and target", () => {
            const graph = new Graph();

            graph.addNode("a");

            const result = dijkstraPath(graph, "a", "a");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(0);
            expect(result!.path).toEqual(["a"]);
        });

        it("should throw error for non-existent nodes", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => dijkstraPath(graph, "nonexistent", "a")).toThrow("Source node nonexistent not found");
            expect(() => dijkstraPath(graph, "a", "nonexistent")).toThrow("Target node nonexistent not found");
        });

        it("should find optimal path in complex graph", () => {
            const graph = new Graph();

            // Create a graph where direct path is not optimal
            graph.addEdge("start", "direct", 10);
            graph.addEdge("start", "via1", 1);
            graph.addEdge("via1", "via2", 1);
            graph.addEdge("via2", "direct", 1);

            const result = dijkstraPath(graph, "start", "direct");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(3); // start -> via1 -> via2 -> direct
            expect(result!.path).toEqual(["start", "via1", "via2", "direct"]);
        });
    });

    describe("singleSourceShortestPath", () => {
        it("should find distances to all reachable nodes", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 2);
            graph.addEdge("a", "c", 1);
            graph.addEdge("c", "d", 3);

            const distances = singleSourceShortestPath(graph, "a");

            expect(distances.get("a")).toBe(0);
            expect(distances.get("b")).toBe(2);
            expect(distances.get("c")).toBe(1);
            expect(distances.get("d")).toBe(4);
        });

        it("should respect cutoff distance", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", 2);
            graph.addEdge("c", "d", 3);

            const distances = singleSourceShortestPath(graph, "a", 2);

            expect(distances.has("a")).toBe(true);
            expect(distances.has("b")).toBe(true);
            expect(distances.has("c")).toBe(false); // Distance 3 > cutoff 2
            expect(distances.has("d")).toBe(false);
        });

        it("should only include reachable nodes", () => {
            const graph = new Graph();

            // Two disconnected components
            graph.addEdge("a", "b", 1);
            graph.addEdge("c", "d", 1);

            const distances = singleSourceShortestPath(graph, "a");

            expect(distances.size).toBe(2);
            expect(distances.has("a")).toBe(true);
            expect(distances.has("b")).toBe(true);
            expect(distances.has("c")).toBe(false);
            expect(distances.has("d")).toBe(false);
        });

        it("should handle cutoff of zero", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1);

            const distances = singleSourceShortestPath(graph, "a", 0);

            expect(distances.size).toBe(1);
            expect(distances.get("a")).toBe(0);
            expect(distances.has("b")).toBe(false);
        });
    });

    describe("allPairsShortestPath", () => {
        it("should compute shortest paths between all pairs", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", 2);
            graph.addEdge("a", "c", 4);

            const results = allPairsShortestPath(graph);

            expect(results.size).toBe(3);

            // Check distances from 'a'
            expect(results.get("a")!.get("a")).toBe(0);
            expect(results.get("a")!.get("b")).toBe(1);
            expect(results.get("a")!.get("c")).toBe(3); // a -> b -> c is shorter than direct

            // Check distances from 'b'
            expect(results.get("b")!.get("a")).toBe(1);
            expect(results.get("b")!.get("b")).toBe(0);
            expect(results.get("b")!.get("c")).toBe(2);

            // Check distances from 'c'
            expect(results.get("c")!.get("a")).toBe(3);
            expect(results.get("c")!.get("b")).toBe(2);
            expect(results.get("c")!.get("c")).toBe(0);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two disconnected pairs
            graph.addEdge("a", "b", 1);
            graph.addEdge("c", "d", 1);

            const results = allPairsShortestPath(graph);

            expect(results.size).toBe(4);

            // Within components
            expect(results.get("a")!.get("b")).toBe(1);
            expect(results.get("c")!.get("d")).toBe(1);

            // Between components (should not exist)
            expect(results.get("a")!.has("c")).toBe(false);
            expect(results.get("a")!.has("d")).toBe(false);
        });

        it("should handle single node", () => {
            const graph = new Graph();

            graph.addNode("only");

            const results = allPairsShortestPath(graph);

            expect(results.size).toBe(1);
            expect(results.get("only")!.get("only")).toBe(0);
        });
    });

    describe("edge cases", () => {
        it("should handle directed graphs correctly", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("c", "a", 1); // a can't reach c in directed graph

            const results = dijkstra(graph, "a");

            expect(results.has("a")).toBe(true);
            expect(results.has("b")).toBe(true);
            expect(results.has("c")).toBe(false);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a", 5);
            graph.addEdge("a", "b", 1);

            const results = dijkstra(graph, "a");

            expect(results.get("a")!.distance).toBe(0);
            expect(results.get("b")!.distance).toBe(1);
        });

        it("should work with numeric node IDs", () => {
            const graph = new Graph();

            graph.addEdge(1, 2, 3);
            graph.addEdge(2, 3, 2);

            const result = dijkstraPath(graph, 1, 3);

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(5);
            expect(result!.path).toEqual([1, 2, 3]);
        });

        it("should handle large weights", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1000000);
            graph.addEdge("a", "c", 1);
            graph.addEdge("c", "b", 1);

            const result = dijkstraPath(graph, "a", "b");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(2); // a -> c -> b is much shorter
        });

        it("should handle floating point weights", () => {
            const graph = new Graph();

            graph.addEdge("a", "b", 1.5);
            graph.addEdge("b", "c", 2.3);

            const results = dijkstra(graph, "a");

            expect(results.get("b")!.distance).toBeCloseTo(1.5);
            expect(results.get("c")!.distance).toBeCloseTo(3.8);
        });

        it("should handle graphs with parallel edges", () => {
            const graph = new Graph({allowParallelEdges: false});

            // Add edge, then try to add another with different weight
            graph.addEdge("a", "b", 5);
            // This should throw due to parallel edges not being allowed
            expect(() => {
                graph.addEdge("a", "b", 1);
            }).toThrow("Parallel edges are not allowed");
        });

        it("should handle empty graph", () => {
            const graph = new Graph();

            expect(() => dijkstra(graph, "nonexistent")).toThrow("Source node nonexistent not found");
        });

        it("should handle large graphs efficiently", () => {
            const graph = new Graph();
            const nodes = 1000;

            // Create a path graph with weights
            for (let i = 0; i < nodes - 1; i++) {
                graph.addEdge(i, i + 1, 1);
            }

            const result = dijkstraPath(graph, 0, nodes - 1);

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(nodes - 1);
            expect(result!.path).toHaveLength(nodes);
        });

        it("should prioritize shorter paths correctly", () => {
            const graph = new Graph();

            // Create a graph where greedy approach would fail
            graph.addEdge("start", "expensive", 1);
            graph.addEdge("expensive", "end", 100);
            graph.addEdge("start", "cheap1", 10);
            graph.addEdge("cheap1", "cheap2", 10);
            graph.addEdge("cheap2", "end", 10);

            const result = dijkstraPath(graph, "start", "end");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(30); // start -> cheap1 -> cheap2 -> end
            expect(result!.path).toEqual(["start", "cheap1", "cheap2", "end"]);
        });
    });
});
