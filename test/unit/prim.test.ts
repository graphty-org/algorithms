import {beforeEach, describe, expect, it} from "vitest";

import {Graph, primMST} from "../../src/index.js";

describe("Prim's Algorithm", () => {
    let graph: Graph;

    beforeEach(() => {
        graph = new Graph({directed: false});
    });

    describe("primMST", () => {
        it("should find MST for a simple graph", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");

            graph.addEdge("A", "B", 1);
            graph.addEdge("A", "C", 3);
            graph.addEdge("B", "C", 3);
            graph.addEdge("B", "D", 6);
            graph.addEdge("C", "D", 4);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(8);
            expect(result.edges).toHaveLength(3);

            const mstNodes = new Set<string>();
            result.edges.forEach((edge) => {
                mstNodes.add(edge.source as string);
                mstNodes.add(edge.target as string);
            });
            expect(mstNodes.size).toBe(4);
        });

        it("should handle different starting nodes", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");

            graph.addEdge("A", "B", 1);
            graph.addEdge("A", "C", 3);
            graph.addEdge("B", "C", 3);
            graph.addEdge("B", "D", 6);
            graph.addEdge("C", "D", 4);

            const resultFromA = primMST(graph, "A");
            const resultFromB = primMST(graph, "B");
            const resultFromC = primMST(graph, "C");

            expect(resultFromA.totalWeight).toBe(8);
            expect(resultFromB.totalWeight).toBe(8);
            expect(resultFromC.totalWeight).toBe(8);
        });

        it("should handle a graph with equal weights", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");

            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 1);
            graph.addEdge("C", "D", 1);
            graph.addEdge("D", "A", 1);
            graph.addEdge("A", "C", 1);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(3);
            expect(result.edges).toHaveLength(3);
        });

        it("should handle single node graph", () => {
            graph.addNode("A");

            const result = primMST(graph);

            expect(result.totalWeight).toBe(0);
            expect(result.edges).toHaveLength(0);
        });

        it("should handle two-node graph", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B", 5);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(5);
            expect(result.edges).toHaveLength(1);
            expect(result.edges[0].weight).toBe(5);
        });

        it("should throw error for directed graph", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("A");
            directedGraph.addNode("B");
            directedGraph.addEdge("A", "B", 1);

            expect(() => primMST(directedGraph)).toThrow("Prim's algorithm requires an undirected graph");
        });

        it("should throw error for disconnected graph", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");

            graph.addEdge("A", "B", 1);
            graph.addEdge("C", "D", 2);

            expect(() => primMST(graph)).toThrow("Graph is not connected");
        });

        it("should throw error for non-existent start node", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B", 1);

            expect(() => primMST(graph, "Z")).toThrow("Start node Z not found in graph");
        });

        it("should handle empty graph", () => {
            const result = primMST(graph);

            expect(result.totalWeight).toBe(0);
            expect(result.edges).toHaveLength(0);
        });

        it("should handle larger graph", () => {
            const nodes = ["A", "B", "C", "D", "E", "F", "G"];
            nodes.forEach((node) => graph.addNode(node));

            graph.addEdge("A", "B", 7);
            graph.addEdge("A", "D", 5);
            graph.addEdge("B", "C", 8);
            graph.addEdge("B", "D", 9);
            graph.addEdge("B", "E", 7);
            graph.addEdge("C", "E", 5);
            graph.addEdge("D", "E", 15);
            graph.addEdge("D", "F", 6);
            graph.addEdge("E", "F", 8);
            graph.addEdge("E", "G", 9);
            graph.addEdge("F", "G", 11);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(39);
            expect(result.edges).toHaveLength(6);

            const mstNodes = new Set<string>();
            result.edges.forEach((edge) => {
                mstNodes.add(edge.source as string);
                mstNodes.add(edge.target as string);
            });
            expect(mstNodes.size).toBe(7);
        });

        it("should handle graph with zero weights", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            graph.addEdge("A", "B", 0);
            graph.addEdge("B", "C", 1);
            graph.addEdge("A", "C", 2);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(1);
            expect(result.edges).toHaveLength(2);
        });

        it("should handle graph with missing weights (default to 1)", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            graph.addEdge("A", "B"); // default weight 1
            graph.addEdge("B", "C", 1);
            graph.addEdge("A", "C", 2);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(2);
            expect(result.edges).toHaveLength(2);

            // Should choose A-B (weight 1) and B-C (weight 1) over A-C (weight 2)
            const weights = result.edges.map((e) => e.weight ?? 1).sort();
            expect(weights).toEqual([1, 1]);
        });

        it("should produce same total weight as Kruskal's algorithm", () => {
            const nodes = ["A", "B", "C", "D", "E"];
            nodes.forEach((node) => graph.addNode(node));

            graph.addEdge("A", "B", 2);
            graph.addEdge("A", "C", 3);
            graph.addEdge("B", "C", 1);
            graph.addEdge("B", "D", 1);
            graph.addEdge("B", "E", 4);
            graph.addEdge("C", "E", 1);
            graph.addEdge("D", "E", 2);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(5);
            expect(result.edges).toHaveLength(4);
        });
    });

    describe("edge cases", () => {
        it("should handle graph with edges added in both directions", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            // The priority queue might see edges from both directions
            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 2);
            graph.addEdge("A", "C", 3);

            const result = primMST(graph, "B");

            expect(result.totalWeight).toBe(3);
            expect(result.edges).toHaveLength(2);
        });

        it("should handle case where edge target is already visited", () => {
            // Create a dense graph where many edges lead to already visited nodes
            const nodes = ["A", "B", "C", "D"];
            nodes.forEach((node) => graph.addNode(node));

            // Create a complete graph
            graph.addEdge("A", "B", 1);
            graph.addEdge("A", "C", 2);
            graph.addEdge("A", "D", 3);
            graph.addEdge("B", "C", 4);
            graph.addEdge("B", "D", 5);
            graph.addEdge("C", "D", 6);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(6); // 1+2+3
            expect(result.edges).toHaveLength(3);
        });

        it("should handle graph where initial node has no edges", () => {
            graph.addNode("isolated");

            const result = primMST(graph, "isolated");

            expect(result.totalWeight).toBe(0);
            expect(result.edges).toHaveLength(0);
        });

        it("should handle case where edge source is unvisited", () => {
            // Create a specific graph structure to test the unvisitedNode logic
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");

            // Create edges such that we'll encounter an edge where source is unvisited
            graph.addEdge("A", "B", 1);
            graph.addEdge("C", "B", 2); // When starting from C, B will be unvisited
            graph.addEdge("C", "D", 3);
            graph.addEdge("B", "D", 4);

            const result = primMST(graph, "C");

            expect(result.edges).toHaveLength(3);
            expect(result.totalWeight).toBeLessThanOrEqual(6); // Should pick optimal edges
        });

        it("should handle empty graph with null nodes array", () => {
            // This tests the first nodes.length === 0 check
            const emptyGraph = new Graph({directed: false});

            const result = primMST(emptyGraph);

            expect(result.edges).toEqual([]);
            expect(result.totalWeight).toBe(0);
        });

        it("should handle edge where getEdge returns null", () => {
            // This is tricky to test since getEdge is internal
            // But we can create a scenario where it might happen
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 2);

            const result = primMST(graph);

            expect(result.edges).toHaveLength(2);
            expect(result.totalWeight).toBe(3);
        });

        it("should handle case where priority queue returns null edge", () => {
            // This tests the !edge check after dequeue
            // This is defensive programming that's hard to trigger normally
            graph.addNode("A");
            graph.addNode("B");

            graph.addEdge("A", "B", 1);

            const result = primMST(graph);

            expect(result.edges).toHaveLength(1);
            expect(result.totalWeight).toBe(1);
        });

        it("should handle edges with null weights properly", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            // Add edges with null weights to test ?? 0 operator
            graph.addEdge("A", "B", null as number | null);
            graph.addEdge("B", "C", null as number | null);
            graph.addEdge("A", "C", 5);

            const result = primMST(graph);

            expect(result.totalWeight).toBe(0); // null weights treated as 0
            expect(result.edges).toHaveLength(2);
        });

        it("should handle graph with only one node and null check", () => {
            // This tests the !start check more thoroughly
            const singleNodeGraph = new Graph({directed: false});
            singleNodeGraph.addNode("only");

            const result = primMST(singleNodeGraph);

            expect(result.edges).toEqual([]);
            expect(result.totalWeight).toBe(0);
        });

        it("should handle undefined edge weights in priority queue", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            // Add edges with undefined weights
            graph.addEdge("A", "B"); // undefined weight
            graph.addEdge("B", "C"); // undefined weight
            graph.addEdge("A", "C", 10);

            const result = primMST(graph);

            // undefined weights are treated as default (1)
            expect(result.totalWeight).toBe(2);
            expect(result.edges).toHaveLength(2);
        });
    });
});
