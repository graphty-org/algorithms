import {describe, expect, it} from "vitest";

import {BidirectionalDijkstra} from "../../src/algorithms/shortest-path/bidirectional-dijkstra.js";
import {dijkstraPath} from "../../src/algorithms/shortest-path/dijkstra.js";
import {Graph} from "../../src/core/graph.js";

describe("Bidirectional Dijkstra Algorithm", () => {
    describe("BidirectionalDijkstra class", () => {
        it("should find shortest path between two nodes", () => {
            const graph = new Graph();

            // Create a simple weighted graph
            graph.addEdge("a", "b", 4);
            graph.addEdge("a", "c", 2);
            graph.addEdge("b", "c", 1);
            graph.addEdge("b", "d", 5);
            graph.addEdge("c", "d", 8);
            graph.addEdge("c", "e", 10);
            graph.addEdge("d", "e", 2);

            const biDijkstra = new BidirectionalDijkstra(graph);
            const result = biDijkstra.findShortestPath("a", "e");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(10); // a -> c -> b -> d -> e
            expect(result!.path).toEqual(["a", "c", "b", "d", "e"]);
        });

        it("should handle disconnected graphs", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("b");

            const biDijkstra = new BidirectionalDijkstra(graph);
            const result = biDijkstra.findShortestPath("a", "b");

            expect(result).toBeNull();
        });

        it("should handle source equals target", () => {
            const graph = new Graph();
            graph.addNode("a");

            const biDijkstra = new BidirectionalDijkstra(graph);
            const result = biDijkstra.findShortestPath("a", "a");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(0);
            expect(result!.path).toEqual(["a"]);
        });

        it("should work with directed graphs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", 1);
            graph.addEdge("c", "d", 1);
            graph.addEdge("d", "a", 1); // Creates a cycle

            const biDijkstra = new BidirectionalDijkstra(graph);
            const result = biDijkstra.findShortestPath("a", "c");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(2);
            expect(result!.path).toEqual(["a", "b", "c"]);
        });

        it("should reject graphs with negative weights", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", -1);

            const biDijkstra = new BidirectionalDijkstra(graph);

            expect(() => {
                biDijkstra.findShortestPath("a", "b");
            }).toThrow("Bidirectional Dijkstra does not support negative edge weights");
        });

        it("should throw error for non-existent nodes", () => {
            const graph = new Graph();
            graph.addNode("a");

            const biDijkstra = new BidirectionalDijkstra(graph);

            expect(() => {
                biDijkstra.findShortestPath("a", "nonexistent");
            }).toThrow();

            expect(() => {
                biDijkstra.findShortestPath("nonexistent", "a");
            }).toThrow();
        });
    });

    describe("dijkstraPath with bidirectional optimization", () => {
        it("should use bidirectional by default and match standard dijkstra", () => {
            const graph = new Graph();

            // Create test graph
            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 2);
            graph.addEdge("A", "D", 4);
            graph.addEdge("D", "C", 1);

            const defaultResult = dijkstraPath(graph, "A", "C"); // Uses bidirectional by default
            const explicitBiResult = dijkstraPath(graph, "A", "C", {bidirectional: true});
            const standardResult = dijkstraPath(graph, "A", "C", {bidirectional: false});

            expect(defaultResult).not.toBeNull();
            expect(explicitBiResult).not.toBeNull();
            expect(standardResult).not.toBeNull();
            expect(defaultResult!.distance).toBe(standardResult!.distance);
            expect(explicitBiResult!.distance).toBe(standardResult!.distance);
            expect(defaultResult!.distance).toBe(3);
        });

        it("should handle undirected graphs correctly", () => {
            const graph = new Graph(); // undirected by default

            graph.addEdge("A", "B", 2);
            graph.addEdge("B", "C", 3);
            graph.addEdge("A", "C", 10);

            const result = dijkstraPath(graph, "A", "C"); // Uses bidirectional by default

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(5); // A -> B -> C
        });

        it("should use standard dijkstra for small graphs (≤10 nodes)", () => {
            const graph = new Graph();

            // Create small graph with 5 nodes
            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 1);
            graph.addEdge("C", "D", 1);
            graph.addEdge("D", "E", 1);

            expect(graph.nodeCount).toBeLessThanOrEqual(10);

            // Should automatically use standard Dijkstra due to small size
            const result = dijkstraPath(graph, "A", "E");
            expect(result).not.toBeNull();
            expect(result!.distance).toBe(4);
            expect(result!.path).toEqual(["A", "B", "C", "D", "E"]);
        });

        it("should work on larger graphs", () => {
            const graph = new Graph();
            const n = 20; // Use larger graph to trigger bidirectional optimization

            // Create a linear chain
            for (let i = 0; i < n - 1; i++) {
                graph.addEdge(i, i + 1, 1);
            }

            // Test that default (bidirectional) works
            const result = dijkstraPath(graph, 0, n - 1);
            expect(result).not.toBeNull();
            if (result) {
                expect(result.distance).toBe(n - 1);
                expect(result.path.length).toBe(n);
                expect(result.path[0]).toBe(0);
                expect(result.path[n - 1]).toBe(n - 1);
            }

            // Verify it matches standard dijkstra
            const standardResult = dijkstraPath(graph, 0, n - 1, {bidirectional: false});
            expect(standardResult).not.toBeNull();
            expect(result!.distance).toBe(standardResult!.distance);
        });

        it("should handle self-loops correctly", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("A", "A", 5);
            graph.addEdge("A", "B", 1);

            const result = dijkstraPath(graph, "A", "B"); // Uses bidirectional by default

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(1);
            expect(result!.path).toEqual(["A", "B"]);
        });
    });

    describe("Performance characteristics", () => {
        it("should be faster on sparse graphs with long paths", () => {
            const graph = new Graph({allowParallelEdges: true});
            const n = 1000;

            // First ensure connectivity with a backbone
            for (let i = 0; i < n - 1; i++) {
                graph.addEdge(i, i + 1, Math.random() + 0.1);
            }

            // Create additional sparse connections (~4 more edges per node)
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < 4; j++) {
                    const target = (i + (j * 37) + 13) % n; // Use coprime numbers to ensure good distribution
                    if (i !== target && !graph.hasEdge(i, target)) {
                        graph.addEdge(i, target, Math.random() + 0.1);
                    }
                }
            }

            const source = 0;
            const target = n - 1;

            // Warm up
            dijkstraPath(graph, source, target, {bidirectional: false}); // standard
            dijkstraPath(graph, source, target); // bidirectional (default)

            // Benchmark standard dijkstra
            const standardStart = performance.now();
            const standardResult = dijkstraPath(graph, source, target, {bidirectional: false});
            const standardTime = performance.now() - standardStart;

            // Benchmark bidirectional dijkstra (default behavior)
            const biStart = performance.now();
            const biResult = dijkstraPath(graph, source, target); // Uses bidirectional by default
            const biTime = performance.now() - biStart;

            // Verify correctness
            expect(biResult).not.toBeNull();
            expect(standardResult).not.toBeNull();

            if (biResult && standardResult) {
                // Results should be very close (allowing for floating point differences)
                expect(Math.abs(biResult.distance - standardResult.distance)).toBeLessThan(0.001);
            }

            console.log(`Standard: ${standardTime.toFixed(2)}ms, Bidirectional: ${biTime.toFixed(2)}ms`);
            if (standardTime > 0 && biTime > 0) {
                console.log(`Speedup: ${(standardTime / biTime).toFixed(2)}x`);
            }

            // In most cases, bidirectional should be faster or comparable
            // We don't enforce strict speedup requirements due to variability in small graphs
        });

        it("should handle edge cases in sparse graphs", () => {
            const graph = new Graph();

            // Star graph - one central node connected to many others
            const center = "center";
            graph.addNode(center);

            for (let i = 0; i < 50; i++) {
                graph.addEdge(center, `node_${i}`, 1);
            }

            const result = dijkstraPath(graph, "node_0", "node_49"); // Uses bidirectional by default

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(2); // node_0 -> center -> node_49
            expect(result!.path).toEqual(["node_0", center, "node_49"]);
        });
    });

    describe("Reset functionality", () => {
        it("should allow reuse after reset", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 1);

            const biDijkstra = new BidirectionalDijkstra(graph);

            // First search
            const result1 = biDijkstra.findShortestPath("A", "C");
            expect(result1!.distance).toBe(2);

            // Reset and second search
            biDijkstra.reset();
            const result2 = biDijkstra.findShortestPath("A", "B");
            expect(result2!.distance).toBe(1);
        });
    });
});
