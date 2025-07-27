import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";
import {CSRGraph} from "../../src/optimized/csr-graph.js";

describe("CSRGraph", () => {
    describe("construction", () => {
        it("should create CSR graph from adjacency list", () => {
            const adjacencyList = new Map([
                ["a", ["b", "c"]],
                ["b", ["c", "d"]],
                ["c", ["d"]],
                ["d", []],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);

            expect(csrGraph.nodeCount()).toBe(4);
            expect(csrGraph.edgeCount()).toBe(5);
        });

        it("should handle weighted edges", () => {
            const adjacencyList = new Map([
                ["a", ["b", "c"]],
                ["b", ["c"]],
            ]);

            const weights = new Map([
                ["a-b", 1.5],
                ["a-c", 2.0],
                ["b-c", 0.5],
            ]);

            const csrGraph = new CSRGraph(adjacencyList, weights);

            expect(csrGraph.getEdgeWeight("a", "b")).toBe(1.5);
            expect(csrGraph.getEdgeWeight("a", "c")).toBe(2.0);
            expect(csrGraph.getEdgeWeight("b", "c")).toBe(0.5);
        });

        it("should sort neighbors for binary search", () => {
            const adjacencyList = new Map([
                [0, [3, 1, 4, 2]], // Unsorted
            ]);

            const csrGraph = new CSRGraph(adjacencyList);
            const neighbors = Array.from(csrGraph.neighbors(0));

            expect(neighbors).toEqual([1, 2, 3, 4]); // Should be sorted
        });
    });

    describe("graph operations", () => {
        let csrGraph: CSRGraph<string>;

        beforeEach(() => {
            const adjacencyList = new Map([
                ["a", ["b", "c"]],
                ["b", ["c", "d"]],
                ["c", ["d"]],
                ["d", []],
            ]);
            csrGraph = new CSRGraph(adjacencyList);
        });

        it("should check node existence", () => {
            expect(csrGraph.hasNode("a")).toBe(true);
            expect(csrGraph.hasNode("b")).toBe(true);
            expect(csrGraph.hasNode("e")).toBe(false);
        });

        it("should check edge existence with binary search", () => {
            expect(csrGraph.hasEdge("a", "b")).toBe(true);
            expect(csrGraph.hasEdge("a", "c")).toBe(true);
            expect(csrGraph.hasEdge("a", "d")).toBe(false);
            expect(csrGraph.hasEdge("b", "a")).toBe(false); // Directed
        });

        it("should get neighbors", () => {
            const aNeighbors = Array.from(csrGraph.neighbors("a"));
            expect(aNeighbors).toEqual(["b", "c"]);

            const dNeighbors = Array.from(csrGraph.neighbors("d"));
            expect(dNeighbors).toEqual([]);
        });

        it("should calculate out-degree", () => {
            expect(csrGraph.outDegree("a")).toBe(2);
            expect(csrGraph.outDegree("b")).toBe(2);
            expect(csrGraph.outDegree("c")).toBe(1);
            expect(csrGraph.outDegree("d")).toBe(0);
        });

        it("should iterate all nodes", () => {
            const nodes = Array.from(csrGraph.nodes());
            expect(nodes).toHaveLength(4);
            expect(nodes).toContain("a");
            expect(nodes).toContain("b");
            expect(nodes).toContain("c");
            expect(nodes).toContain("d");
        });
    });

    describe("node index mapping", () => {
        it("should correctly map between node IDs and indices", () => {
            const adjacencyList = new Map([
                ["node1", ["node2"]],
                ["node2", ["node3"]],
                ["node3", []],
            ]);

            const csrGraph = new CSRGraph(adjacencyList);

            const index1 = csrGraph.nodeToIndex("node1");
            const index2 = csrGraph.nodeToIndex("node2");
            const index3 = csrGraph.nodeToIndex("node3");

            expect(csrGraph.indexToNodeId(index1)).toBe("node1");
            expect(csrGraph.indexToNodeId(index2)).toBe("node2");
            expect(csrGraph.indexToNodeId(index3)).toBe("node3");
        });

        it("should throw error for non-existent node", () => {
            const csrGraph = new CSRGraph(new Map([["a", []]]));

            expect(() => csrGraph.nodeToIndex("b")).toThrow("Node b not found in graph");
        });
    });

    describe("fromGraph static method", () => {
        it("should convert standard Graph to CSR", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", 1.5);
            graph.addEdge("a", "c", 2.0);
            graph.addEdge("b", "c", 0.5);

            const csrGraph = CSRGraph.fromGraph(graph);

            expect(csrGraph.nodeCount()).toBe(3);
            expect(csrGraph.edgeCount()).toBe(6); // Undirected graph stores edges in both directions
            expect(csrGraph.hasEdge("a", "b")).toBe(true);
            expect(csrGraph.hasEdge("a", "c")).toBe(true);
            expect(csrGraph.hasEdge("b", "c")).toBe(true);
            expect(csrGraph.getEdgeWeight("a", "b")).toBe(1.5);
        });

        it("should handle undirected graphs", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const csrGraph = CSRGraph.fromGraph(graph);

            // Undirected graph has edges in both directions
            expect(csrGraph.edgeCount()).toBe(4);
            expect(csrGraph.hasEdge("a", "b")).toBe(true);
            expect(csrGraph.hasEdge("b", "a")).toBe(true);
            expect(csrGraph.hasEdge("b", "c")).toBe(true);
            expect(csrGraph.hasEdge("c", "b")).toBe(true);
        });
    });

    describe("performance characteristics", () => {
        it("should handle large graphs efficiently", () => {
            const nodeCount = 10000;
            const adjacencyList = new Map<number, number[]>();

            // Create a sparse graph
            for (let i = 0; i < nodeCount; i++) {
                const neighbors: number[] = [];
                // Each node connects to next 3 nodes
                for (let j = 1; j <= 3 && i + j < nodeCount; j++) {
                    neighbors.push(i + j);
                }
                adjacencyList.set(i, neighbors);
            }

            const startTime = performance.now();
            const csrGraph = new CSRGraph(adjacencyList);
            const constructionTime = performance.now() - startTime;

            expect(csrGraph.nodeCount()).toBe(nodeCount);
            expect(constructionTime).toBeLessThan(100); // Should construct in < 100ms

            // Test edge lookup performance
            const lookupStart = performance.now();
            for (let i = 0; i < 1000; i++) {
                csrGraph.hasEdge(i, i + 1);
            }
            const lookupTime = performance.now() - lookupStart;

            expect(lookupTime).toBeLessThan(10); // 1000 lookups in < 10ms
        });
    });
});
