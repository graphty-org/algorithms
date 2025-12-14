import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {
    breadthFirstSearch,
    isBipartite,
    shortestPathBFS,
    singleSourceShortestPathBFS} from "../../src/algorithms/traversal/bfs.js";
import {Graph} from "../../src/core/graph.js";
import {configureOptimizations} from "../../src/optimized/graph-adapter.js";
import type {NodeId} from "../../src/types/index.js";

describe("BFS Algorithms", () => {
    // Reset optimizations before each test to ensure isolation
    beforeEach(() => {
        configureOptimizations({
            useDirectionOptimizedBFS: false,
            useCSRFormat: false,
            useBitPackedStructures: false,
        });
    });

    describe("breadthFirstSearch", () => {
        it("should traverse graph in breadth-first order", () => {
            const graph = new Graph();

            // Create a simple graph
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");

            const result = breadthFirstSearch(graph, "A");

            expect(result.visited).toEqual(new Set(["A", "B", "C", "D", "E"]));
            expect(result.order).toHaveLength(5);
            expect(result.order[0]).toBe("A");

            // B and C should come before D (but their relative order doesn't matter)
            const bIndex = result.order.indexOf("B");
            const cIndex = result.order.indexOf("C");
            const dIndex = result.order.indexOf("D");
            expect(bIndex).toBeLessThan(dIndex);
            expect(cIndex).toBeLessThan(dIndex);
        });

        it("should build correct spanning tree", () => {
            const graph = new Graph();

            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");

            const result = breadthFirstSearch(graph, "A");

            expect(result.tree).toBeDefined();
            expect(result.tree?.get("A")).toBeNull();
            expect(result.tree?.get("B")).toBe("A");
            expect(result.tree?.get("C")).toBe("A");
            expect(result.tree?.has("D")).toBe(true);

            // D's parent should be either B or C (whichever was visited first)
            const dParent = result.tree?.get("D");
            expect(dParent === "B" || dParent === "C").toBe(true);
        });

        it("should handle early termination with target node", () => {
            const graph = new Graph();

            // Create a linear graph
            for (let i = 0; i < 10; i++) {
                graph.addEdge(i, i + 1);
            }

            const result = breadthFirstSearch(graph, 0, {targetNode: 5});

            // Should have visited nodes 0-5 but not beyond
            expect(result.visited.has(5)).toBe(true);
            expect(result.visited.has(6)).toBe(false);
            expect(result.order).toContain(5);
            expect(result.order).not.toContain(6);
        });

        it("should call visitor callback with correct parameters", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");

            const visits: Array<{node: NodeId; level: number}> = [];

            breadthFirstSearch(graph, "A", {
                visitCallback: (node, level) => visits.push({node, level}),
            });

            expect(visits).toHaveLength(4);
            expect(visits[0]).toEqual({node: "A", level: 0});

            // B and C at level 1
            const level1Nodes = visits.filter((v) => v.level === 1).map((v) => v.node);
            expect(level1Nodes).toContain("B");
            expect(level1Nodes).toContain("C");

            // D at level 2
            expect(visits.find((v) => v.node === "D")?.level).toBe(2);
        });

        it("should throw error for non-existent start node", () => {
            const graph = new Graph();
            graph.addNode("A");

            expect(() => breadthFirstSearch(graph, "B")).toThrow(
                "Start node B not found in graph",
            );
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Component 1
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            // Component 2
            graph.addEdge("X", "Y");
            graph.addEdge("Y", "Z");

            const result = breadthFirstSearch(graph, "A");

            // Should only visit component 1
            expect(result.visited).toEqual(new Set(["A", "B", "C"]));
            expect(result.visited.has("X")).toBe(false);
        });

        it("should handle single node graph", () => {
            const graph = new Graph();
            graph.addNode("A");

            const result = breadthFirstSearch(graph, "A");

            expect(result.visited).toEqual(new Set(["A"]));
            expect(result.order).toEqual(["A"]);
            expect(result.tree?.get("A")).toBeNull();
        });
    });

    describe("shortestPathBFS", () => {
        it("should find shortest path in unweighted graph", () => {
            const graph = new Graph();

            // Create a graph with multiple paths
            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");
            graph.addEdge("B", "E"); // Shorter path

            const result = shortestPathBFS(graph, "A", "E");

            expect(result).not.toBeNull();
            expect(result?.distance).toBe(2);
            expect(result?.path).toEqual(["A", "B", "E"]);
        });

        it("should return null for unreachable target", () => {
            const graph = new Graph();

            graph.addEdge("A", "B");
            graph.addEdge("X", "Y");

            const result = shortestPathBFS(graph, "A", "X");
            expect(result).toBeNull();
        });

        it("should handle same source and target", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addEdge("A", "B");

            const result = shortestPathBFS(graph, "A", "A");

            expect(result).not.toBeNull();
            expect(result?.distance).toBe(0);
            expect(result?.path).toEqual(["A"]);
        });

        it("should throw error for non-existent nodes", () => {
            const graph = new Graph();
            graph.addNode("A");

            expect(() => shortestPathBFS(graph, "A", "B")).toThrow(
                "Target node B not found in graph",
            );

            expect(() => shortestPathBFS(graph, "B", "A")).toThrow(
                "Source node B not found in graph",
            );
        });

        it("should find shortest path in complex graph", () => {
            const graph = new Graph();

            // Create a more complex graph
            for (let i = 0; i < 10; i++) {
                graph.addNode(i);
            }

            // Add edges creating multiple paths
            graph.addEdge(0, 1);
            graph.addEdge(0, 2);
            graph.addEdge(1, 3);
            graph.addEdge(2, 3);
            graph.addEdge(3, 4);
            graph.addEdge(1, 4); // Shortcut
            graph.addEdge(4, 5);
            graph.addEdge(5, 6);
            graph.addEdge(4, 7);
            graph.addEdge(7, 8);
            graph.addEdge(6, 9);
            graph.addEdge(8, 9);

            const result = shortestPathBFS(graph, 0, 9);

            expect(result).not.toBeNull();
            expect(result?.distance).toBe(5);

            // Verify path is valid
            const path = result?.path || [];
            expect(path[0]).toBe(0);
            expect(path[path.length - 1]).toBe(9);

            // Each consecutive pair should be connected
            for (let i = 0; i < path.length - 1; i++) {
                expect(graph.hasEdge(path[i], path[i + 1]) ||
               graph.hasEdge(path[i + 1], path[i])).toBe(true);
            }
        });
    });

    describe("singleSourceShortestPathBFS", () => {
        it("should find shortest paths to all reachable nodes", () => {
            const graph = new Graph();

            graph.addEdge("A", "B");
            graph.addEdge("A", "C");
            graph.addEdge("B", "D");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");

            const results = singleSourceShortestPathBFS(graph, "A");

            expect(results.size).toBe(5);

            expect(results.get("A")?.distance).toBe(0);
            expect(results.get("B")?.distance).toBe(1);
            expect(results.get("C")?.distance).toBe(1);
            expect(results.get("D")?.distance).toBe(2);
            expect(results.get("E")?.distance).toBe(3);
        });

        it("should only include reachable nodes", () => {
            const graph = new Graph();

            // Component 1
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            // Component 2
            graph.addEdge("X", "Y");

            const results = singleSourceShortestPathBFS(graph, "A");

            expect(results.size).toBe(3);
            expect(results.has("A")).toBe(true);
            expect(results.has("B")).toBe(true);
            expect(results.has("C")).toBe(true);
            expect(results.has("X")).toBe(false);
            expect(results.has("Y")).toBe(false);
        });

        it("should provide correct paths for all nodes", () => {
            const graph = new Graph();

            // Create a tree structure
            graph.addEdge(1, 2);
            graph.addEdge(1, 3);
            graph.addEdge(2, 4);
            graph.addEdge(2, 5);
            graph.addEdge(3, 6);
            graph.addEdge(3, 7);

            const results = singleSourceShortestPathBFS(graph, 1);

            // Check specific paths
            expect(results.get(1)?.path).toEqual([1]);
            expect(results.get(2)?.path).toEqual([1, 2]);
            expect(results.get(3)?.path).toEqual([1, 3]);
            expect(results.get(4)?.path).toEqual([1, 2, 4]);
            expect(results.get(5)?.path).toEqual([1, 2, 5]);
            expect(results.get(6)?.path).toEqual([1, 3, 6]);
            expect(results.get(7)?.path).toEqual([1, 3, 7]);
        });
    });

    describe("isBipartite", () => {
        it("should return true for bipartite graph", () => {
            const graph = new Graph({directed: false});

            // Create a simple bipartite graph (square)
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "A");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should return false for graph with odd cycle", () => {
            const graph = new Graph({directed: false});

            // Create a triangle (odd cycle)
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            expect(isBipartite(graph)).toBe(false);
        });

        it("should return true for graph with even cycle", () => {
            const graph = new Graph({directed: false});

            // Create a hexagon (even cycle)
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");
            graph.addEdge("E", "F");
            graph.addEdge("F", "A");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph({directed: false});

            // Component 1: bipartite
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "A");

            // Component 2: not bipartite (triangle)
            graph.addEdge("X", "Y");
            graph.addEdge("Y", "Z");
            graph.addEdge("Z", "X");

            expect(isBipartite(graph)).toBe(false);
        });

        it("should handle single node", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should handle empty graph", () => {
            const graph = new Graph({directed: false});

            expect(isBipartite(graph)).toBe(true);
        });

        it("should throw error for directed graph", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");

            expect(() => isBipartite(graph)).toThrow(
                "Bipartite test requires an undirected graph",
            );
        });

        it("should detect non-bipartite in complex graph", () => {
            const graph = new Graph({directed: false});

            // Create a more complex graph with an odd cycle embedded
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");
            graph.addEdge("E", "A"); // 5-cycle (odd)
            graph.addEdge("A", "F");
            graph.addEdge("F", "G");
            graph.addEdge("G", "H");

            expect(isBipartite(graph)).toBe(false);
        });
    });

    describe("Automatic BFS Optimization", () => {
        describe("configuration and performance", () => {
            afterEach(() => {
                // Reset to default config after each test
                configureOptimizations({
                    useDirectionOptimizedBFS: true,
                    useCSRFormat: true,
                    useBitPackedStructures: true,
                });
            });

            it("should automatically use optimizations for large graphs", () => {
                const graph = new Graph();
                const nodeCount = 15000; // Large enough to trigger optimizations

                // Create a simple chain
                for (let i = 0; i < nodeCount; i++) {
                    if (i > 0) {
                        graph.addEdge(i - 1, i);
                    }
                }

                // Enable optimizations
                configureOptimizations({
                    useDirectionOptimizedBFS: true,
                    useCSRFormat: true,
                });

                // Standard BFS should automatically use optimizations
                const result = breadthFirstSearch(graph, 0);

                // Verify it traversed the entire chain
                expect(result.visited.size).toBe(nodeCount);
                expect(result.order.length).toBe(nodeCount);
            });

            it("should automatically optimize based on graph size", () => {
                // Small graph - should use standard BFS
                const smallGraph = new Graph();
                for (let i = 0; i < 100; i++) {
                    if (i > 0) {
                        smallGraph.addEdge(i - 1, i);
                    }
                }

                // Large graph - should use optimized BFS
                const largeGraph = new Graph();
                for (let i = 0; i < 15000; i++) {
                    if (i > 0) {
                        largeGraph.addEdge(i - 1, i);
                    }
                }

                // Both should work correctly
                const smallResult = breadthFirstSearch(smallGraph, 0);
                const largeResult = breadthFirstSearch(largeGraph, 0);

                expect(smallResult.visited.size).toBe(100);
                expect(largeResult.visited.size).toBe(15000);

                // Performance difference should be noticeable
                const smallStart = performance.now();
                for (let i = 0; i < 10; i++) {
                    breadthFirstSearch(smallGraph, 0);
                }
                const smallTimeTotal = performance.now() - smallStart;
                const smallTimeAvg = smallTimeTotal / 10;

                const largeStart = performance.now();
                breadthFirstSearch(largeGraph, 0);
                const largeTime = performance.now() - largeStart;

                console.log(`Small graph (100 nodes, avg per run): ${smallTimeAvg.toFixed(2)}ms`);
                console.log(`Large graph (15000 nodes, per run): ${largeTime.toFixed(2)}ms`);
            });
        });

        describe("large graph optimizations", () => {
            it("should handle very large graphs efficiently", () => {
                const graph = new Graph();
                const nodeCount = 15000;

                // Create a small-world graph
                for (let i = 0; i < nodeCount; i++) {
                    // Local connections
                    if (i + 1 < nodeCount) {
                        graph.addEdge(i, i + 1);
                    }
                    if (i + 2 < nodeCount) {
                        graph.addEdge(i, i + 2);
                    }

                    // Some long-range connections
                    if (i % 100 === 0) {
                        const target = Math.floor(Math.random() * nodeCount);
                        if (target !== i && !graph.hasEdge(i, target)) {
                            graph.addEdge(i, target);
                        }
                    }
                }

                // BFS should automatically use optimizations for this large graph
                const result = breadthFirstSearch(graph, 0);

                expect(result.visited.size).toBe(nodeCount);
                expect(result.order).toHaveLength(nodeCount);
            });

            it("should find shortest paths in large graphs", () => {
                const graph = new Graph();
                const nodeCount = 15000;

                // Create a graph with clear shortest paths
                for (let i = 0; i < nodeCount; i++) {
                    if (i + 1 < nodeCount) {
                        graph.addEdge(i, i + 1);
                    }
                    // Add some shortcuts
                    if (i % 10 === 0 && i + 10 < nodeCount) {
                        graph.addEdge(i, i + 10);
                    }
                }

                const source = 0;
                const target = 100;

                // shortestPathBFS should automatically use optimizations
                const result = shortestPathBFS(graph, source, target);

                expect(result).not.toBeNull();
                expect(result?.path[0]).toBe(source);
                expect(result?.path[result.path.length - 1]).toBe(target);

                // Should find the optimal path using shortcuts
                expect(result?.distance).toBeLessThanOrEqual(100);
            });

            it("should handle disconnected components in large graphs", () => {
                const graph = new Graph();

                // Create two large disconnected components
                for (let i = 0; i < 10000; i++) {
                    if (i > 0 && i % 2 === 0) {
                        graph.addEdge(i, i - 2);
                    }
                }

                for (let i = 10001; i < 20000; i++) {
                    if (i > 10001 && i % 2 === 1) {
                        graph.addEdge(i, i - 2);
                    }
                }

                // singleSourceShortestPathBFS should automatically use optimizations
                const result = singleSourceShortestPathBFS(graph, 0);

                // Should only find paths within the first component
                expect(result.size).toBe(5000); // Only even numbers 0-9998
                expect(result.has(10001)).toBe(false);
            });
        });
    });

    describe("Edge Cases", () => {
        it("should handle self-loops correctly", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("A", "A"); // Self-loop
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const result = breadthFirstSearch(graph, "A");

            // Self-loop shouldn't affect BFS traversal
            expect(result.visited).toEqual(new Set(["A", "B", "C"]));
            expect(result.order).toEqual(["A", "B", "C"]);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A"); // Creates a cycle but directed

            const result = breadthFirstSearch(graph, "A");

            expect(result.visited).toEqual(new Set(["A", "B", "C"]));

            // From C, we can't reach any new nodes
            const resultFromC = breadthFirstSearch(graph, "C");
            expect(resultFromC.visited).toEqual(new Set(["C", "A", "B"]));
        });

        it("should work with numeric node IDs", () => {
            const graph = new Graph();

            for (let i = 0; i < 5; i++) {
                graph.addEdge(i, i + 1);
            }

            const result = breadthFirstSearch(graph, 0);

            expect(result.visited.size).toBe(6);
            expect(result.order[0]).toBe(0);
            expect(result.order[result.order.length - 1]).toBe(5);
        });

        it("should handle large graphs efficiently", () => {
            const graph = new Graph();
            const nodeCount = 1000;

            // Create a grid-like structure
            for (let i = 0; i < nodeCount; i++) {
                // Connect to right neighbor
                if ((i + 1) % 10 !== 0 && i + 1 < nodeCount) {
                    graph.addEdge(i, i + 1);
                }
                // Connect to bottom neighbor
                if (i + 10 < nodeCount) {
                    graph.addEdge(i, i + 10);
                }
            }

            const start = performance.now();
            const result = breadthFirstSearch(graph, 0);
            const elapsed = performance.now() - start;

            expect(result.visited.size).toBe(nodeCount);
            expect(elapsed).toBeLessThan(100); // Should complete quickly
        });

        it("should handle graphs at optimization threshold", () => {
            // Enable optimizations
            configureOptimizations({
                useDirectionOptimizedBFS: true,
                useCSRFormat: true,
            });

            // Test with graph just below threshold (9999 nodes)
            const smallGraph = new Graph();
            for (let i = 0; i < 9999; i++) {
                if (i > 0) {
                    smallGraph.addEdge(i - 1, i);
                }
            }

            // Test with graph at threshold (10000 nodes)
            const mediumGraph = new Graph();
            for (let i = 0; i < 10000; i++) {
                if (i > 0) {
                    mediumGraph.addEdge(i - 1, i);
                }
            }

            // Test with graph above threshold (10001 nodes)
            const largeGraph = new Graph();
            for (let i = 0; i < 10001; i++) {
                if (i > 0) {
                    largeGraph.addEdge(i - 1, i);
                }
            }

            // All should work correctly
            const smallResult = breadthFirstSearch(smallGraph, 0);
            const mediumResult = breadthFirstSearch(mediumGraph, 0);
            const largeResult = breadthFirstSearch(largeGraph, 0);

            expect(smallResult.visited.size).toBe(9999);
            expect(mediumResult.visited.size).toBe(10000);
            expect(largeResult.visited.size).toBe(10001);
        });

        it("should handle empty graph results", () => {
            const graph = new Graph();

            // Large but completely disconnected graph
            for (let i = 0; i < 15000; i++) {
                graph.addNode(i);
            }

            // BFS should handle disconnected graphs efficiently
            const result = breadthFirstSearch(graph, 0);
            expect(result.visited.size).toBe(1); // Only source node
        });
    });
});
