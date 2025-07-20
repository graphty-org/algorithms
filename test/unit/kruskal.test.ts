import {beforeEach, describe, expect, it} from "vitest";
import {Graph, kruskalMST, minimumSpanningTree} from "../../src/index.js";

describe("Kruskal's Algorithm", () => {
    let graph: Graph;

    beforeEach(() => {
        graph = new Graph({directed: false});
    });

    describe("kruskalMST", () => {
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

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(8);
            expect(result.edges).toHaveLength(3);

            const edgeWeights = result.edges.map(e => e.weight).sort();
            expect(edgeWeights).toEqual([1, 3, 4]);
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

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(3);
            expect(result.edges).toHaveLength(3);
        });

        it("should handle single node graph", () => {
            graph.addNode("A");

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(0);
            expect(result.edges).toHaveLength(0);
        });

        it("should handle two-node graph", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B", 5);

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(5);
            expect(result.edges).toHaveLength(1);
            expect(result.edges[0].weight).toBe(5);
        });

        it("should throw error for directed graph", () => {
            const directedGraph = new Graph({directed: true});
            directedGraph.addNode("A");
            directedGraph.addNode("B");
            directedGraph.addEdge("A", "B", 1);

            expect(() => kruskalMST(directedGraph)).toThrow("Kruskal's algorithm requires an undirected graph");
        });

        it("should throw error for disconnected graph", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");

            graph.addEdge("A", "B", 1);
            graph.addEdge("C", "D", 2);

            expect(() => kruskalMST(graph)).toThrow("Graph is not connected");
        });

        it("should handle larger graph", () => {
            const nodes = ["A", "B", "C", "D", "E", "F", "G"];
            nodes.forEach(node => graph.addNode(node));

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

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(39);
            expect(result.edges).toHaveLength(6);

            const mstNodes = new Set<string>();
            result.edges.forEach(edge => {
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

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(1);
            expect(result.edges).toHaveLength(2);
            expect(result.edges[0].weight).toBe(0);
        });

        it("should handle graph with missing weights (default to 1)", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            graph.addEdge("A", "B");  // default weight 1
            graph.addEdge("B", "C", 1);
            graph.addEdge("A", "C", 2);

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(2);
            expect(result.edges).toHaveLength(2);
            
            // Should choose A-B (weight 1) and B-C (weight 1) over A-C (weight 2)
            const weights = result.edges.map(e => e.weight ?? 1).sort();
            expect(weights).toEqual([1, 1]);
        });
    });

    describe("minimumSpanningTree", () => {
        it("should be an alias for kruskalMST", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 2);
            graph.addEdge("A", "C", 3);

            const kruskalResult = kruskalMST(graph);
            const mstResult = minimumSpanningTree(graph);

            expect(mstResult.totalWeight).toBe(kruskalResult.totalWeight);
            expect(mstResult.edges.length).toBe(kruskalResult.edges.length);
        });
    });

    describe("edge cases", () => {
        it("should handle edges with reverse source/target ordering", () => {
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            // Add edges where source > target to test edge key generation
            graph.addEdge("C", "A", 1);
            graph.addEdge("C", "B", 2);
            graph.addEdge("B", "A", 3);

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(3);
            expect(result.edges).toHaveLength(2);
        });

        it("should handle graph where MST is found before examining all edges", () => {
            // Create a graph with many edges but MST can be found early
            const nodes = ["A", "B", "C", "D", "E"];
            nodes.forEach(node => graph.addNode(node));

            // Add edges with increasing weights
            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 2);
            graph.addEdge("C", "D", 3);
            graph.addEdge("D", "E", 4);
            
            // Add many heavy edges that won't be used
            graph.addEdge("A", "C", 10);
            graph.addEdge("A", "D", 11);
            graph.addEdge("A", "E", 12);
            graph.addEdge("B", "D", 13);
            graph.addEdge("B", "E", 14);
            graph.addEdge("C", "E", 15);

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(10); // 1+2+3+4
            expect(result.edges).toHaveLength(4);
            
            // Verify that we got the lightest edges
            const weights = result.edges.map(e => e.weight).sort();
            expect(weights).toEqual([1, 2, 3, 4]);
        });

        it("should handle numeric node IDs with comparison", () => {
            graph.addNode(1);
            graph.addNode(2);
            graph.addNode(10);

            // Test edge key generation with numeric IDs
            graph.addEdge(10, 1, 1);
            graph.addEdge(2, 10, 2);
            graph.addEdge(1, 2, 3);

            const result = kruskalMST(graph);

            expect(result.totalWeight).toBe(3);
            expect(result.edges).toHaveLength(2);
        });
    });
});