import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";
import {GraphAdapter, graphToMap, mapToGraph} from "../../src/utils/graph-converters.js";

describe("Graph Converters", () => {
    describe("graphToMap", () => {
        it("should convert undirected graph to map representation", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("A", "B", 2);
            graph.addEdge("B", "C", 3);
            graph.addEdge("A", "C", 1);

            const map = graphToMap(graph);

            expect(map.size).toBe(3);
            expect(map.get("A")?.get("B")).toBe(2);
            expect(map.get("B")?.get("A")).toBe(2); // Undirected
            expect(map.get("B")?.get("C")).toBe(3);
            expect(map.get("C")?.get("B")).toBe(3); // Undirected
            expect(map.get("A")?.get("C")).toBe(1);
            expect(map.get("C")?.get("A")).toBe(1); // Undirected
        });

        it("should convert directed graph to map representation", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B", 2);
            graph.addEdge("B", "C", 3);
            graph.addEdge("C", "A", 1);

            const map = graphToMap(graph);

            expect(map.size).toBe(3);
            expect(map.get("A")?.get("B")).toBe(2);
            expect(map.get("B")?.get("A")).toBeUndefined(); // Directed
            expect(map.get("B")?.get("C")).toBe(3);
            expect(map.get("C")?.get("B")).toBeUndefined(); // Directed
            expect(map.get("C")?.get("A")).toBe(1);
            expect(map.get("A")?.get("C")).toBeUndefined(); // Directed
        });

        it("should handle isolated nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("C", "D");

            const map = graphToMap(graph);

            expect(map.size).toBe(4);
            expect(map.get("A")?.size).toBe(0);
            expect(map.get("B")?.size).toBe(0);
            expect(map.get("C")?.get("D")).toBe(1);
        });

        it("should use default weight of 1", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            const map = graphToMap(graph);

            expect(map.get("A")?.get("B")).toBe(1);
        });
    });

    describe("mapToGraph", () => {
        it("should convert map to undirected graph", () => {
            const map = new Map([
                ["A", new Map([["B", 2], ["C", 1]])],
                ["B", new Map([["A", 2], ["C", 3]])],
                ["C", new Map([["A", 1], ["B", 3]])],
            ]);

            const graph = mapToGraph(map, false);

            expect(graph.nodeCount).toBe(3);
            expect(graph.edgeCount).toBe(3); // Each edge counted once
            expect(graph.isDirected).toBe(false);
            expect(graph.getEdge("A", "B")?.weight).toBe(2);
            expect(graph.getEdge("B", "C")?.weight).toBe(3);
            expect(graph.getEdge("A", "C")?.weight).toBe(1);
        });

        it("should convert map to directed graph", () => {
            const map = new Map([
                ["A", new Map([["B", 2]])],
                ["B", new Map([["C", 3]])],
                ["C", new Map([["A", 1]])],
            ]);

            const graph = mapToGraph(map, true);

            expect(graph.nodeCount).toBe(3);
            expect(graph.edgeCount).toBe(3);
            expect(graph.isDirected).toBe(true);
            expect(graph.getEdge("A", "B")?.weight).toBe(2);
            expect(graph.getEdge("B", "A")).toBeUndefined(); // No reverse edge
            expect(graph.getEdge("B", "C")?.weight).toBe(3);
            expect(graph.getEdge("C", "A")?.weight).toBe(1);
        });

        it("should handle isolated nodes", () => {
            const map = new Map([
                ["A", new Map()],
                ["B", new Map()],
                ["C", new Map([["D", 1]])],
                ["D", new Map()],
            ]);

            const graph = mapToGraph(map);

            expect(graph.nodeCount).toBe(4);
            expect(graph.hasNode("A")).toBe(true);
            expect(graph.hasNode("B")).toBe(true);
            expect(graph.degree("A")).toBe(0);
            expect(graph.degree("B")).toBe(0);
        });
    });

    describe("GraphAdapter", () => {
        const map = new Map([
            ["A", new Map([["B", 2], ["C", 1]])],
            ["B", new Map([["A", 2], ["C", 3]])],
            ["C", new Map([["A", 1], ["B", 3]])],
        ]);

        it("should provide nodes() method", () => {
            const adapter = new GraphAdapter(map, false);
            const nodes = adapter.nodes();

            expect(nodes.length).toBe(3);
            expect(nodes.map((n) => n.id).sort()).toEqual(["A", "B", "C"]);
        });

        it("should provide nodeCount property", () => {
            const adapter = new GraphAdapter(map);
            expect(adapter.nodeCount).toBe(3);
        });

        it("should provide hasNode() method", () => {
            const adapter = new GraphAdapter(map);

            expect(adapter.hasNode("A")).toBe(true);
            expect(adapter.hasNode("B")).toBe(true);
            expect(adapter.hasNode("D")).toBe(false);
        });

        it("should provide neighbors() method", () => {
            const adapter = new GraphAdapter(map);

            expect(adapter.neighbors("A").sort()).toEqual(["B", "C"]);
            expect(adapter.neighbors("B").sort()).toEqual(["A", "C"]);
            expect(adapter.neighbors("D")).toEqual([]);
        });

        it("should provide getEdge() method", () => {
            const adapter = new GraphAdapter(map);

            const edge = adapter.getEdge("A", "B");
            expect(edge).toEqual({source: "A", target: "B", weight: 2});

            expect(adapter.getEdge("A", "D")).toBeNull();
            expect(adapter.getEdge("D", "A")).toBeNull();
        });

        it("should provide hasEdge() method", () => {
            const adapter = new GraphAdapter(map);

            expect(adapter.hasEdge("A", "B")).toBe(true);
            expect(adapter.hasEdge("B", "A")).toBe(true);
            expect(adapter.hasEdge("A", "D")).toBe(false);
        });

        it("should provide edges() method for undirected graph", () => {
            const adapter = new GraphAdapter(map, false);
            const edges = adapter.edges();

            expect(edges.length).toBe(3); // Each edge counted once
            expect(edges).toContainEqual({source: "A", target: "B", weight: 2});
            expect(edges).toContainEqual({source: "A", target: "C", weight: 1});
            expect(edges).toContainEqual({source: "B", target: "C", weight: 3});
        });

        it("should provide edges() method for directed graph", () => {
            const directedMap = new Map([
                ["A", new Map([["B", 2]])],
                ["B", new Map([["C", 3]])],
                ["C", new Map([["A", 1]])],
            ]);
            const adapter = new GraphAdapter(directedMap, true);
            const edges = adapter.edges();

            expect(edges.length).toBe(3);
            expect(edges).toContainEqual({source: "A", target: "B", weight: 2});
            expect(edges).toContainEqual({source: "B", target: "C", weight: 3});
            expect(edges).toContainEqual({source: "C", target: "A", weight: 1});
        });

        it("should provide edgeCount property", () => {
            const undirectedAdapter = new GraphAdapter(map, false);
            expect(undirectedAdapter.edgeCount).toBe(3);

            const directedAdapter = new GraphAdapter(map, true);
            expect(directedAdapter.edgeCount).toBe(6); // All edges counted
        });

        it("should provide degree methods", () => {
            const adapter = new GraphAdapter(map);

            expect(adapter.degree("A")).toBe(2);
            expect(adapter.degree("B")).toBe(2);
            expect(adapter.degree("C")).toBe(2);
            expect(adapter.degree("D")).toBe(0);
        });

        it("should provide in/out degree for directed graphs", () => {
            const directedMap = new Map([
                ["A", new Map([["B", 1], ["C", 1]])],
                ["B", new Map([["C", 1]])],
                ["C", new Map()],
            ]);
            const adapter = new GraphAdapter(directedMap, true);

            expect(adapter.outDegree("A")).toBe(2);
            expect(adapter.outDegree("B")).toBe(1);
            expect(adapter.outDegree("C")).toBe(0);

            expect(adapter.inDegree("A")).toBe(0);
            expect(adapter.inDegree("B")).toBe(1);
            expect(adapter.inDegree("C")).toBe(2);
        });

        it("should handle numeric node IDs", () => {
            const numericMap = new Map([
                ["1", new Map([["2", 1]])],
                ["2", new Map([["3", 1]])],
                ["3", new Map()],
            ]);
            const adapter = new GraphAdapter(numericMap);

            expect(adapter.hasNode(1)).toBe(true);
            expect(adapter.hasNode("1")).toBe(true);
            expect(adapter.neighbors(1)).toEqual(["2"]);
            expect(adapter.getEdge(1, 2)?.weight).toBe(1);
        });
    });

    describe("Round-trip conversion", () => {
        it("should preserve graph structure through conversions", () => {
            const original = new Graph({directed: false});
            original.addEdge("A", "B", 2);
            original.addEdge("B", "C", 3);
            original.addEdge("A", "C", 1);
            original.addNode("D"); // Isolated node

            const map = graphToMap(original);
            const converted = mapToGraph(map, original.isDirected);

            expect(converted.nodeCount).toBe(original.nodeCount);
            expect(converted.edgeCount).toBe(original.edgeCount);
            expect(converted.isDirected).toBe(original.isDirected);

            for (const node of original.nodes()) {
                expect(converted.hasNode(node.id)).toBe(true);
            }

            for (const edge of original.edges()) {
                const convertedEdge = converted.getEdge(edge.source, edge.target);
                expect(convertedEdge?.weight).toBe(edge.weight);
            }
        });
    });
});
