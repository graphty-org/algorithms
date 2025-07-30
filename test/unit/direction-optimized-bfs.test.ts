import {describe, expect, it} from "vitest";

import {CSRGraph} from "../../src/optimized/csr-graph.js";
import {DirectionOptimizedBFS, directionOptimizedBFS} from "../../src/optimized/direction-optimized-bfs.js";

describe("DirectionOptimizedBFS", () => {
    describe("basic functionality", () => {
        it("should perform BFS on a simple graph", () => {
            const adjacencyList = new Map([
                ["a", ["b", "c"]],
                ["b", ["d"]],
                ["c", ["d"]],
                ["d", []],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);
            const result = bfs.search("a");

            expect(result.visitedCount).toBe(4);
            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("b")).toBe(1);
            expect(result.distances.get("c")).toBe(1);
            expect(result.distances.get("d")).toBe(2);

            expect(result.parents.get("a")).toBeNull();
            expect(result.parents.get("b")).toBe("a");
            expect(result.parents.get("c")).toBe("a");
            expect(["b", "c"]).toContain(result.parents.get("d")); // Could be from either b or c
        });

        it("should handle disconnected components", () => {
            const adjacencyList = new Map([
                ["a", ["b"]],
                ["b", []],
                ["c", ["d"]],
                ["d", []],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const result = directionOptimizedBFS(csrGraph, "a");

            expect(result.visitedCount).toBe(2);
            expect(result.distances.has("c")).toBe(false);
            expect(result.distances.has("d")).toBe(false);
        });

        it("should handle single node", () => {
            const adjacencyList = new Map([["a", []]]);

            const csrGraph = new CSRGraph(adjacencyList);
            const result = directionOptimizedBFS(csrGraph, "a");

            expect(result.visitedCount).toBe(1);
            expect(result.distances.get("a")).toBe(0);
            expect(result.parents.get("a")).toBeNull();
        });
    });

    describe("direction switching", () => {
        it("should switch directions on dense frontiers", () => {
            // Create a graph that will trigger direction switching
            // Star graph: one hub connected to many nodes
            const adjacencyList = new Map<number, number[]>();
            const hubNode = 0;
            const leafCount = 100;

            adjacencyList.set(hubNode, []);
            for (let i = 1; i <= leafCount; i++) {
                adjacencyList.get(hubNode)!.push(i);
                adjacencyList.set(i, [hubNode]); // Bidirectional for bottom-up
            }

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph, {alpha: 10, beta: 20});
            const result = bfs.search(hubNode);

            expect(result.visitedCount).toBe(leafCount + 1);

            // All leaves should be at distance 1
            for (let i = 1; i <= leafCount; i++) {
                expect(result.distances.get(i)).toBe(1);
                expect(result.parents.get(i)).toBe(hubNode);
            }
        });

        it("should handle grid graphs efficiently", () => {
            // Create a small grid graph
            const size = 10;
            const adjacencyList = new Map<string, string[]>();

            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const node = `${i},${j}`;
                    const neighbors: string[] = [];

                    // Add neighbors (4-connected grid)
                    if (i > 0) {
                        neighbors.push(`${i - 1},${j}`);
                    }
                    if (i < size - 1) {
                        neighbors.push(`${i + 1},${j}`);
                    }
                    if (j > 0) {
                        neighbors.push(`${i},${j - 1}`);
                    }
                    if (j < size - 1) {
                        neighbors.push(`${i},${j + 1}`);
                    }

                    adjacencyList.set(node, neighbors);
                }
            }

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);
            const result = bfs.search("0,0");

            expect(result.visitedCount).toBe(size * size);

            // Check distances follow Manhattan distance
            expect(result.distances.get("0,0")).toBe(0);
            expect(result.distances.get("0,1")).toBe(1);
            expect(result.distances.get("1,0")).toBe(1);
            expect(result.distances.get("1,1")).toBe(2);
            expect(result.distances.get(`${size - 1},${size - 1}`)).toBe(2 * (size - 1));
        });
    });

    describe("multi-source BFS", () => {
        it("should handle multiple sources", () => {
            const adjacencyList = new Map([
                ["a", ["b"]],
                ["b", ["c"]],
                ["c", []],
                ["d", ["c"]],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);
            const result = bfs.searchMultiple(["a", "d"]);

            expect(result.visitedCount).toBe(4);
            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("d")).toBe(0);
            expect(result.distances.get("b")).toBe(1);
            expect(result.distances.get("c")).toBe(1); // Reachable from d in 1 step
        });

        it("should find shortest paths from multiple sources", () => {
            const adjacencyList = new Map([
                ["a", ["b", "c"]],
                ["b", ["d"]],
                ["c", ["d"]],
                ["d", ["e"]],
                ["e", []],
                ["f", ["d"]], // Another source that's closer to d
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);
            const result = bfs.searchMultiple(["a", "f"]);

            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("f")).toBe(0);
            expect(result.distances.get("d")).toBe(1); // Closer from f
            expect(result.parents.get("d")).toBe("f"); // Parent should be f, not b or c
        });
    });

    describe("performance characteristics", () => {
        it("should handle large sparse graphs", () => {
            // Create a large sparse graph (binary tree)
            const nodeCount = 10000;
            const adjacencyList = new Map<number, number[]>();

            for (let i = 0; i < nodeCount; i++) {
                const neighbors: number[] = [];
                const leftChild = (2 * i) + 1;
                const rightChild = (2 * i) + 2;

                if (leftChild < nodeCount) {
                    neighbors.push(leftChild);
                }
                if (rightChild < nodeCount) {
                    neighbors.push(rightChild);
                }

                adjacencyList.set(i, neighbors);
            }

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);

            const startTime = performance.now();
            const result = bfs.search(0);
            const duration = performance.now() - startTime;

            expect(result.visitedCount).toBe(nodeCount);
            expect(duration).toBeLessThan(100); // Should complete in < 100ms

            // Check some distances
            expect(result.distances.get(0)).toBe(0);
            expect(result.distances.get(1)).toBe(1);
            expect(result.distances.get(3)).toBe(2);
            expect(result.distances.get(7)).toBe(3);
        });

        it("should efficiently handle social network-like graphs", () => {
            // Create a graph with power-law degree distribution
            const nodeCount = 1000;
            const adjacencyList = new Map<number, number[]>();

            // Initialize all nodes
            for (let i = 0; i < nodeCount; i++) {
                adjacencyList.set(i, []);
            }

            // Create hubs (high-degree nodes)
            const hubCount = 10;
            for (let hub = 0; hub < hubCount; hub++) {
                // Each hub connects to many nodes
                for (let i = 0; i < nodeCount / 10; i++) {
                    const target = Math.floor(Math.random() * nodeCount);
                    if (target !== hub) {
                        adjacencyList.get(hub)!.push(target);
                        adjacencyList.get(target)!.push(hub); // Bidirectional
                    }
                }
            }

            // Add some random edges between non-hub nodes
            for (let i = hubCount; i < nodeCount; i++) {
                const degree = Math.floor(Math.random() * 5) + 1;
                for (let j = 0; j < degree; j++) {
                    const target = Math.floor(Math.random() * nodeCount);
                    if (target !== i && !adjacencyList.get(i)!.includes(target)) {
                        adjacencyList.get(i)!.push(target);
                    }
                }
            }

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);

            const startTime = performance.now();
            const result = bfs.search(0);
            const duration = performance.now() - startTime;

            expect(result.visitedCount).toBeGreaterThan(nodeCount * 0.8); // Most nodes reachable
            expect(duration).toBeLessThan(20); // Should be very fast due to small diameter
        });
    });

    describe("reset functionality", () => {
        it("should allow reuse after reset", () => {
            const adjacencyList = new Map([
                ["a", ["b", "c"]],
                ["b", []],
                ["c", []],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);

            // First search
            const result1 = bfs.search("a");
            expect(result1.visitedCount).toBe(3);

            // Reset and search from different node
            bfs.reset();
            const result2 = bfs.search("b");
            expect(result2.visitedCount).toBe(1);
            expect(result2.distances.get("b")).toBe(0);
            expect(result2.distances.has("a")).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should handle self-loops", () => {
            const adjacencyList = new Map([
                ["a", ["a", "b"]], // Self-loop
                ["b", []],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const result = directionOptimizedBFS(csrGraph, "a");

            expect(result.visitedCount).toBe(2);
            expect(result.distances.get("a")).toBe(0);
            expect(result.distances.get("b")).toBe(1);
        });

        it("should handle empty graph", () => {
            const adjacencyList = new Map<string, string[]>();
            const csrGraph = new CSRGraph(adjacencyList);

            expect(csrGraph.nodeCount()).toBe(0);
            // Should not crash on empty graph
        });

        it("should throw on non-existent source", () => {
            const adjacencyList = new Map([["a", []]]);
            const csrGraph = new CSRGraph(adjacencyList);
            const bfs = new DirectionOptimizedBFS(csrGraph);

            expect(() => bfs.search("b")).toThrow("Node b not found in graph");
        });
    });
});
