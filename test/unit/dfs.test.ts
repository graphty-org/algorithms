import {describe, expect, it} from "vitest";

import {depthFirstSearch, findStronglyConnectedComponents, hasCycleDFS, topologicalSort} from "../../src/algorithms/traversal/dfs.js";
import {Graph} from "../../src/core/graph.js";

describe("DFS Algorithms", () => {
    describe("depthFirstSearch", () => {
        it("should traverse graph in depth-first order", () => {
            const graph = new Graph();

            // Create a tree: a -> b -> d; a -> c
            graph.addEdge("a", "b");
            graph.addEdge("b", "d");
            graph.addEdge("a", "c");

            const result = depthFirstSearch(graph, "a");

            expect(result.visited.size).toBe(4);
            expect(result.order).toHaveLength(4);
            expect(result.order[0]).toBe("a"); // Start node first

            // In DFS, we should go deep before visiting siblings
            const cIndex = result.order.indexOf("c");
            const dIndex = result.order.indexOf("d");

            // d should come before c (depth-first)
            expect(dIndex).toBeLessThan(cIndex);
        });

        it("should build correct spanning tree", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");

            const result = depthFirstSearch(graph, "a");

            expect(result.tree!.get("a")).toBeNull();
            expect(result.tree!.get("b")).toBe("a");
            expect(result.tree!.get("c")).toBe("a");
            expect(result.tree!.get("d")).toBe("b");
        });

        it("should handle recursive implementation", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const iterativeResult = depthFirstSearch(graph, "a", {recursive: false});
            const recursiveResult = depthFirstSearch(graph, "a", {recursive: true});

            expect(iterativeResult.visited).toEqual(recursiveResult.visited);
            expect(iterativeResult.order).toEqual(recursiveResult.order);
        });

        it("should handle post-order traversal", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            const result = depthFirstSearch(graph, "a", {preOrder: false});

            expect(result.order).toHaveLength(3);
            // In post-order, children come before parent
            const aIndex = result.order.indexOf("a");
            const bIndex = result.order.indexOf("b");
            const cIndex = result.order.indexOf("c");

            expect(aIndex).toBeGreaterThan(Math.min(bIndex, cIndex));
        });

        it("should handle early termination with target node", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("c", "e");

            const result = depthFirstSearch(graph, "a", {targetNode: "b"});

            expect(result.visited.has("b")).toBe(true);
            expect(result.order).toContain("b");
        });

        it("should call visitor callback with correct parameters", () => {
            const graph = new Graph();
            const visits: {node: string, depth: number}[] = [];

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            depthFirstSearch(graph, "a", {
                visitCallback: (node, depth) => {
                    visits.push({node: node.toString(), depth});
                },
            });

            expect(visits).toHaveLength(3);
            expect(visits[0]).toEqual({node: "a", depth: 0});
            expect(visits[1]).toEqual({node: "b", depth: 1});
            expect(visits[2]).toEqual({node: "c", depth: 2});
        });

        it("should throw error for non-existent start node", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => depthFirstSearch(graph, "nonexistent")).toThrow("Start node nonexistent not found");
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two disconnected components
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const result = depthFirstSearch(graph, "a");

            expect(result.visited.has("a")).toBe(true);
            expect(result.visited.has("b")).toBe(true);
            expect(result.visited.has("c")).toBe(false);
            expect(result.visited.has("d")).toBe(false);
        });
    });

    describe("hasCycleDFS", () => {
        it("should detect cycle in undirected graph", () => {
            const graph = new Graph();

            // Create a triangle
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            expect(hasCycleDFS(graph)).toBe(true);
        });

        it("should detect cycle in directed graph", () => {
            const graph = new Graph({directed: true});

            // Create a directed cycle
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            expect(hasCycleDFS(graph)).toBe(true);
        });

        it("should return false for acyclic graph", () => {
            const graph = new Graph();

            // Create a tree (no cycles)
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");

            expect(hasCycleDFS(graph)).toBe(false);
        });

        it("should return false for single node", () => {
            const graph = new Graph();

            graph.addNode("only");

            expect(hasCycleDFS(graph)).toBe(false);
        });

        it("should return false for empty graph", () => {
            const graph = new Graph();

            expect(hasCycleDFS(graph)).toBe(false);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // One component with cycle, one without
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a"); // Cycle

            graph.addEdge("d", "e"); // No cycle

            expect(hasCycleDFS(graph)).toBe(true);
        });

        it("should detect self-loop as cycle", () => {
            const graph = new Graph({directed: true, allowSelfLoops: true});

            graph.addEdge("a", "a");

            expect(hasCycleDFS(graph)).toBe(true);
        });
    });

    describe("topologicalSort", () => {
        it("should produce valid topological ordering for DAG", () => {
            const graph = new Graph({directed: true});

            // Create a DAG: a -> b -> d; a -> c -> d
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("c", "d");

            const result = topologicalSort(graph);

            expect(result).not.toBeNull();
            expect(result).toHaveLength(4);

            // Check that the ordering is valid
            const aIndex = result!.indexOf("a");
            const bIndex = result!.indexOf("b");
            const cIndex = result!.indexOf("c");
            const dIndex = result!.indexOf("d");

            expect(aIndex).toBeLessThan(bIndex);
            expect(aIndex).toBeLessThan(cIndex);
            expect(bIndex).toBeLessThan(dIndex);
            expect(cIndex).toBeLessThan(dIndex);
        });

        it("should return null for graph with cycles", () => {
            const graph = new Graph({directed: true});

            // Create a cycle
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = topologicalSort(graph);

            expect(result).toBeNull();
        });

        it("should handle single node", () => {
            const graph = new Graph({directed: true});

            graph.addNode("only");

            const result = topologicalSort(graph);

            expect(result).toEqual(["only"]);
        });

        it("should handle empty graph", () => {
            const graph = new Graph({directed: true});

            const result = topologicalSort(graph);

            expect(result).toEqual([]);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph({directed: false});

            graph.addEdge("a", "b");

            expect(() => topologicalSort(graph)).toThrow("Topological sort requires a directed graph");
        });

        it("should handle disconnected DAG", () => {
            const graph = new Graph({directed: true});

            // Two disconnected DAGs
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const result = topologicalSort(graph);

            expect(result).not.toBeNull();
            expect(result).toHaveLength(4);

            // Each component should be in valid order
            const aIndex = result!.indexOf("a");
            const bIndex = result!.indexOf("b");
            const cIndex = result!.indexOf("c");
            const dIndex = result!.indexOf("d");

            expect(aIndex).toBeLessThan(bIndex);
            expect(cIndex).toBeLessThan(dIndex);
        });

        it("should handle complex DAG", () => {
            const graph = new Graph({directed: true});

            // More complex DAG representing dependencies
            graph.addEdge("shirt", "tie");
            graph.addEdge("shirt", "belt");
            graph.addEdge("tie", "jacket");
            graph.addEdge("belt", "jacket");
            graph.addEdge("pants", "belt");
            graph.addEdge("pants", "shoes");

            const result = topologicalSort(graph);

            expect(result).not.toBeNull();
            expect(result).toHaveLength(6);

            // Check some key dependencies
            const shirtIndex = result!.indexOf("shirt");
            const tieIndex = result!.indexOf("tie");
            const jacketIndex = result!.indexOf("jacket");
            const pantsIndex = result!.indexOf("pants");
            const beltIndex = result!.indexOf("belt");

            expect(shirtIndex).toBeLessThan(tieIndex);
            expect(tieIndex).toBeLessThan(jacketIndex);
            expect(pantsIndex).toBeLessThan(beltIndex);
            expect(beltIndex).toBeLessThan(jacketIndex);
        });
    });

    describe("findStronglyConnectedComponents", () => {
        it("should find SCCs in directed graph", () => {
            const graph = new Graph({directed: true});

            // Create a graph with two SCCs
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a"); // SCC 1: {a, b, c}

            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "d"); // SCC 2: {d, e}

            const components = findStronglyConnectedComponents(graph);

            expect(components).toHaveLength(2);

            // Find components by size
            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([2, 3]);

            // Check that all nodes are included
            const allNodes = components.flat().sort();
            expect(allNodes).toEqual(["a", "b", "c", "d", "e"]);
        });

        it("should handle single node components", () => {
            const graph = new Graph({directed: true});

            // Create a path (each node is its own SCC)
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const components = findStronglyConnectedComponents(graph);

            expect(components).toHaveLength(3);
            expect(components.every((comp) => comp.length === 1)).toBe(true);
        });

        it("should handle graph with self-loops", () => {
            const graph = new Graph({directed: true, allowSelfLoops: true});

            graph.addEdge("a", "a"); // Self-loop
            graph.addEdge("a", "b");

            const components = findStronglyConnectedComponents(graph);

            expect(components).toHaveLength(2);
            expect(components.some((comp) => comp.includes("a") && comp.length === 1)).toBe(true);
            expect(components.some((comp) => comp.includes("b") && comp.length === 1)).toBe(true);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph({directed: false});

            graph.addEdge("a", "b");

            expect(() => findStronglyConnectedComponents(graph)).toThrow("Strongly connected components require a directed graph");
        });

        it("should handle empty graph", () => {
            const graph = new Graph({directed: true});

            const components = findStronglyConnectedComponents(graph);

            expect(components).toEqual([]);
        });

        it("should handle single node", () => {
            const graph = new Graph({directed: true});

            graph.addNode("only");

            const components = findStronglyConnectedComponents(graph);

            expect(components).toEqual([["only"]]);
        });

        it("should handle complex SCC structure", () => {
            const graph = new Graph({directed: true});

            // Complex graph with multiple SCCs
            // SCC 1: {a, b}
            graph.addEdge("a", "b");
            graph.addEdge("b", "a");

            // SCC 2: {c, d, e}
            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "c");

            // Connections between SCCs
            graph.addEdge("b", "c");
            graph.addEdge("e", "f"); // f is isolated

            const components = findStronglyConnectedComponents(graph);

            expect(components).toHaveLength(3);

            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([1, 2, 3]);
        });
    });

    describe("edge cases", () => {
        it("should handle self-loops in DFS traversal", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const result = depthFirstSearch(graph, "a");

            expect(result.visited.has("a")).toBe(true);
            expect(result.visited.has("b")).toBe(true);
        });

        it("should handle directed graphs in DFS", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "a"); // a can't reach c in directed graph

            const result = depthFirstSearch(graph, "a");

            expect(result.visited.has("a")).toBe(true);
            expect(result.visited.has("b")).toBe(true);
            expect(result.visited.has("c")).toBe(false);
        });

        it("should work with numeric node IDs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge(1, 2);
            graph.addEdge(2, 3);

            const result = topologicalSort(graph);

            expect(result).toEqual([1, 2, 3]);
        });

        it("should handle large graphs efficiently", () => {
            const graph = new Graph();
            const nodes = 1000;

            // Create a path graph
            for (let i = 0; i < nodes - 1; i++) {
                graph.addEdge(i, i + 1);
            }

            const result = depthFirstSearch(graph, 0);

            expect(result.visited.size).toBe(nodes);
            expect(result.order).toHaveLength(nodes);
        });

        it("should handle recursive implementation with reasonable stack depth", () => {
            const graph = new Graph();

            // Create a path that would cause stack overflow if too deep
            for (let i = 0; i < 100; i++) {
                graph.addEdge(i, i + 1);
            }

            // Should not throw stack overflow
            expect(() => depthFirstSearch(graph, 0, {recursive: true})).not.toThrow();
        });
    });
});
