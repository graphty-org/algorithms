import {describe, expect, it} from "vitest";

import {breadthFirstSearch, isBipartite, shortestPathBFS, singleSourceShortestPathBFS} from "../../src/algorithms/traversal/bfs.js";
import {Graph} from "../../src/core/graph.js";

describe("BFS Algorithms", () => {
    describe("breadthFirstSearch", () => {
        it("should traverse graph in breadth-first order", () => {
            const graph = new Graph();

            // Create a simple tree: a -> b, c; b -> d, e
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("b", "e");

            const result = breadthFirstSearch(graph, "a");

            expect(result.visited.size).toBe(5);
            expect(result.order).toHaveLength(5);
            expect(result.order[0]).toBe("a"); // Start node first

            // Level 1 nodes (b, c) should come before level 2 nodes (d, e)
            const bIndex = result.order.indexOf("b");
            const cIndex = result.order.indexOf("c");
            const dIndex = result.order.indexOf("d");
            const eIndex = result.order.indexOf("e");

            expect(Math.max(bIndex, cIndex)).toBeLessThan(Math.min(dIndex, eIndex));
        });

        it("should build correct spanning tree", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");

            const result = breadthFirstSearch(graph, "a");

            expect(result.tree!.get("a")).toBeNull();
            expect(result.tree!.get("b")).toBe("a");
            expect(result.tree!.get("c")).toBe("a");
            expect(result.tree!.get("d")).toBe("b");
        });

        it("should handle early termination with target node", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("c", "e");

            const result = breadthFirstSearch(graph, "a", {targetNode: "b"});

            expect(result.visited.has("b")).toBe(true);
            expect(result.order).toContain("b");
            // Should not visit nodes beyond target if target is found early
            expect(result.order.length).toBeLessThanOrEqual(3);
        });

        it("should call visitor callback with correct parameters", () => {
            const graph = new Graph();
            const visits: {node: string, level: number}[] = [];

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            breadthFirstSearch(graph, "a", {
                visitCallback: (node, level) => {
                    visits.push({node: node.toString(), level});
                },
            });

            expect(visits).toHaveLength(3);
            expect(visits[0]).toEqual({node: "a", level: 0});

            const level1Visits = visits.filter((v) => v.level === 1);
            expect(level1Visits).toHaveLength(2);
        });

        it("should throw error for non-existent start node", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => breadthFirstSearch(graph, "nonexistent")).toThrow("Start node nonexistent not found");
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two disconnected components
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const result = breadthFirstSearch(graph, "a");

            expect(result.visited.has("a")).toBe(true);
            expect(result.visited.has("b")).toBe(true);
            expect(result.visited.has("c")).toBe(false);
            expect(result.visited.has("d")).toBe(false);
        });

        it("should handle single node graph", () => {
            const graph = new Graph();

            graph.addNode("only");

            const result = breadthFirstSearch(graph, "only");

            expect(result.visited.size).toBe(1);
            expect(result.order).toEqual(["only"]);
            expect(result.tree!.get("only")).toBeNull();
        });
    });

    describe("shortestPathBFS", () => {
        it("should find shortest path in unweighted graph", () => {
            const graph = new Graph();

            // Create a diamond graph: a -> b,c -> d
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("c", "d");

            const result = shortestPathBFS(graph, "a", "d");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(2);
            expect(result!.path).toHaveLength(3);
            expect(result!.path[0]).toBe("a");
            expect(result!.path[2]).toBe("d");
            // Middle node should be either b or c
            expect(["b", "c"]).toContain(result!.path[1]);
        });

        it("should return null for unreachable target", () => {
            const graph = new Graph();

            // Two disconnected nodes
            graph.addNode("a");
            graph.addNode("b");

            const result = shortestPathBFS(graph, "a", "b");

            expect(result).toBeNull();
        });

        it("should handle same source and target", () => {
            const graph = new Graph();

            graph.addNode("a");

            const result = shortestPathBFS(graph, "a", "a");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(0);
            expect(result!.path).toEqual(["a"]);
        });

        it("should throw error for non-existent nodes", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => shortestPathBFS(graph, "nonexistent", "a")).toThrow("Source node nonexistent not found");
            expect(() => shortestPathBFS(graph, "a", "nonexistent")).toThrow("Target node nonexistent not found");
        });

        it("should find shortest path in complex graph", () => {
            const graph = new Graph();

            // Create a more complex graph
            graph.addEdge("start", "a");
            graph.addEdge("start", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "c");
            graph.addEdge("c", "end");
            graph.addEdge("a", "end"); // Longer path

            const result = shortestPathBFS(graph, "start", "end");

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(2); // start -> a -> end
        });
    });

    describe("singleSourceShortestPathBFS", () => {
        it("should find shortest paths to all reachable nodes", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("c", "d");

            const results = singleSourceShortestPathBFS(graph, "a");

            expect(results.size).toBe(4);
            expect(results.get("a")!.distance).toBe(0);
            expect(results.get("b")!.distance).toBe(1);
            expect(results.get("c")!.distance).toBe(1);
            expect(results.get("d")!.distance).toBe(2);
        });

        it("should only include reachable nodes", () => {
            const graph = new Graph();

            // Two disconnected components
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const results = singleSourceShortestPathBFS(graph, "a");

            expect(results.size).toBe(2);
            expect(results.has("a")).toBe(true);
            expect(results.has("b")).toBe(true);
            expect(results.has("c")).toBe(false);
            expect(results.has("d")).toBe(false);
        });

        it("should provide correct paths for all nodes", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const results = singleSourceShortestPathBFS(graph, "a");

            expect(results.get("a")!.path).toEqual(["a"]);
            expect(results.get("b")!.path).toEqual(["a", "b"]);
            expect(results.get("c")!.path).toEqual(["a", "b", "c"]);
        });
    });

    describe("isBipartite", () => {
        it("should return true for bipartite graph", () => {
            const graph = new Graph();

            // Create a simple bipartite graph
            graph.addEdge("a1", "b1");
            graph.addEdge("a1", "b2");
            graph.addEdge("a2", "b1");
            graph.addEdge("a2", "b2");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should return false for graph with odd cycle", () => {
            const graph = new Graph();

            // Create a triangle (odd cycle)
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            expect(isBipartite(graph)).toBe(false);
        });

        it("should return true for graph with even cycle", () => {
            const graph = new Graph();

            // Create a square (even cycle)
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");
            graph.addEdge("d", "a");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two bipartite components
            graph.addEdge("a1", "b1");
            graph.addEdge("a1", "b2");

            graph.addEdge("c1", "d1");
            graph.addEdge("c1", "d2");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should handle single node", () => {
            const graph = new Graph();

            graph.addNode("only");

            expect(isBipartite(graph)).toBe(true);
        });

        it("should handle empty graph", () => {
            const graph = new Graph();

            expect(isBipartite(graph)).toBe(true);
        });

        it("should throw error for directed graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");

            expect(() => isBipartite(graph)).toThrow("Bipartite test requires an undirected graph");
        });

        it("should detect non-bipartite in complex graph", () => {
            const graph = new Graph();

            // Create a graph with both bipartite and non-bipartite parts
            graph.addEdge("a", "b"); // Bipartite part
            graph.addEdge("c", "d"); // Another bipartite part
            graph.addEdge("e", "f"); // Connect to triangle
            graph.addEdge("f", "g");
            graph.addEdge("g", "e"); // Triangle makes it non-bipartite

            expect(isBipartite(graph)).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should handle self-loops correctly", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a");

            const result = breadthFirstSearch(graph, "a");

            expect(result.visited.has("a")).toBe(true);
            expect(result.order).toEqual(["a"]);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "a"); // a can't reach c in directed graph

            const result = breadthFirstSearch(graph, "a");

            expect(result.visited.has("a")).toBe(true);
            expect(result.visited.has("b")).toBe(true);
            expect(result.visited.has("c")).toBe(false);
        });

        it("should work with numeric node IDs", () => {
            const graph = new Graph();

            graph.addEdge(1, 2);
            graph.addEdge(2, 3);

            const result = shortestPathBFS(graph, 1, 3);

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(2);
            expect(result!.path).toEqual([1, 2, 3]);
        });

        it("should handle large graphs efficiently", () => {
            const graph = new Graph();
            const nodes = 1000;

            // Create a path graph: 0 -> 1 -> 2 -> ... -> 999
            for (let i = 0; i < nodes - 1; i++) {
                graph.addEdge(i, i + 1);
            }

            const result = shortestPathBFS(graph, 0, nodes - 1);

            expect(result).not.toBeNull();
            expect(result!.distance).toBe(nodes - 1);
            expect(result!.path).toHaveLength(nodes);
        });
    });
});
