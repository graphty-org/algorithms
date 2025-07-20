import {describe, expect, it} from "vitest";

import {degreeCentrality} from "../../src/algorithms/centrality/degree.js";
import {dijkstra} from "../../src/algorithms/shortest-path/dijkstra.js";
import {breadthFirstSearch, depthFirstSearch} from "../../src/algorithms/traversal/index.js";
import {Graph} from "../../src/core/graph.js";

describe("Browser Environment Tests", () => {
    it("should create and manipulate graphs in browser", () => {
        const graph = new Graph();

        graph.addEdge("a", "b");
        graph.addEdge("b", "c");
        graph.addEdge("c", "d");

        expect(graph.nodeCount).toBe(4);
        expect(graph.totalEdgeCount).toBe(3);
    });

    it("should run BFS traversal in browser", () => {
        const graph = new Graph();

        graph.addEdge("a", "b");
        graph.addEdge("a", "c");
        graph.addEdge("b", "d");

        const result = breadthFirstSearch(graph, "a");

        expect(result.visited.size).toBe(4);
        expect(result.order).toHaveLength(4);
        expect(result.order[0]).toBe("a");
    });

    it("should run DFS traversal in browser", () => {
        const graph = new Graph();

        graph.addEdge("a", "b");
        graph.addEdge("a", "c");
        graph.addEdge("b", "d");

        const result = depthFirstSearch(graph, "a");

        expect(result.visited.size).toBe(4);
        expect(result.order).toHaveLength(4);
        expect(result.order[0]).toBe("a");
    });

    it("should calculate degree centrality in browser", () => {
        const graph = new Graph();

        graph.addEdge("center", "a");
        graph.addEdge("center", "b");
        graph.addEdge("center", "c");

        const centrality = degreeCentrality(graph);

        expect(centrality.center).toBe(3);
        expect(centrality.a).toBe(1);
    });

    it("should run Dijkstra algorithm in browser", () => {
        const graph = new Graph();

        graph.addEdge("a", "b", 1);
        graph.addEdge("b", "c", 2);
        graph.addEdge("a", "c", 4);

        const results = dijkstra(graph, "a");
        const resultC = results.get("c");

        expect(resultC).toBeDefined();
        expect(resultC?.distance).toBe(3); // a -> b -> c
        expect(resultC?.path).toEqual(["a", "b", "c"]);
    });

    it("should handle large graphs in browser", () => {
        const graph = new Graph();
        const nodeCount = 100;

        // Create a chain
        for (let i = 0; i < nodeCount - 1; i++) {
            graph.addEdge(i, i + 1);
        }

        expect(graph.nodeCount).toBe(nodeCount);

        // Run BFS to ensure traversal works
        const result = breadthFirstSearch(graph, 0);

        expect(result.visited.size).toBe(nodeCount);
        expect(result.order).toHaveLength(nodeCount);
    });
});
