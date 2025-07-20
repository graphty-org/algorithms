import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";

describe("Graph", () => {
    describe("constructor", () => {
        it("should create an empty undirected graph by default", () => {
            const graph = new Graph();

            expect(graph.nodeCount).toBe(0);
            expect(graph.totalEdgeCount).toBe(0);
            expect(graph.isDirected).toBe(false);
        });

        it("should create a directed graph when specified", () => {
            const graph = new Graph({directed: true});

            expect(graph.isDirected).toBe(true);
        });
    });

    describe("addNode", () => {
        it("should add a node to the graph", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(graph.nodeCount).toBe(1);
            expect(graph.hasNode("a")).toBe(true);
        });

        it("should not add duplicate nodes", () => {
            const graph = new Graph();

            graph.addNode("a");
            graph.addNode("a");

            expect(graph.nodeCount).toBe(1);
        });

        it("should add node with data", () => {
            const graph = new Graph();
            const data = {label: "Node A", color: "red"};

            graph.addNode("a", data);

            const node = graph.getNode("a");
            expect(node?.data).toEqual(data);
        });
    });

    describe("addEdge", () => {
        it("should add an edge between two nodes", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(graph.nodeCount).toBe(2);
            expect(graph.totalEdgeCount).toBe(1);
            expect(graph.hasEdge("a", "b")).toBe(true);
        });

        it("should add nodes automatically when adding an edge", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(graph.hasNode("a")).toBe(true);
            expect(graph.hasNode("b")).toBe(true);
        });

        it("should create bidirectional edges for undirected graphs", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(graph.hasEdge("a", "b")).toBe(true);
            expect(graph.hasEdge("b", "a")).toBe(true);
        });

        it("should create unidirectional edges for directed graphs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");

            expect(graph.hasEdge("a", "b")).toBe(true);
            expect(graph.hasEdge("b", "a")).toBe(false);
        });

        it("should add edge with weight and data", () => {
            const graph = new Graph();
            const data = {type: "road", speed: 60};

            graph.addEdge("a", "b", 5, data);

            const edge = graph.getEdge("a", "b");
            expect(edge?.weight).toBe(5);
            expect(edge?.data).toEqual(data);
        });
    });

    describe("removeNode", () => {
        it("should remove a node and its edges", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const removed = graph.removeNode("b");

            expect(removed).toBe(true);
            expect(graph.hasNode("b")).toBe(false);
            expect(graph.hasEdge("a", "b")).toBe(false);
            expect(graph.hasEdge("b", "c")).toBe(false);
            expect(graph.totalEdgeCount).toBe(0);
        });

        it("should return false when removing non-existent node", () => {
            const graph = new Graph();

            const removed = graph.removeNode("nonexistent");

            expect(removed).toBe(false);
        });
    });

    describe("removeEdge", () => {
        it("should remove an edge from undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            const removed = graph.removeEdge("a", "b");

            expect(removed).toBe(true);
            expect(graph.hasEdge("a", "b")).toBe(false);
            expect(graph.hasEdge("b", "a")).toBe(false);
            expect(graph.totalEdgeCount).toBe(0);
        });

        it("should remove an edge from directed graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");

            const removed = graph.removeEdge("a", "b");

            expect(removed).toBe(true);
            expect(graph.hasEdge("a", "b")).toBe(false);
            expect(graph.totalEdgeCount).toBe(0);
        });

        it("should return false when removing non-existent edge", () => {
            const graph = new Graph();

            const removed = graph.removeEdge("a", "b");

            expect(removed).toBe(false);
        });
    });

    describe("degree calculations", () => {
        it("should calculate degree for undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            expect(graph.degree("a")).toBe(2);
            expect(graph.degree("b")).toBe(1);
        });

        it("should calculate in-degree and out-degree for directed graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "a");

            expect(graph.inDegree("a")).toBe(1);
            expect(graph.outDegree("a")).toBe(1);
            expect(graph.degree("a")).toBe(2);
        });
    });

    describe("iteration", () => {
        it("should iterate over nodes", () => {
            const graph = new Graph();

            graph.addNode("a");
            graph.addNode("b");
            graph.addNode("c");

            const nodeIds = Array.from(graph.nodes()).map((node) => node.id);
            expect(nodeIds).toHaveLength(3);
            expect(nodeIds).toContain("a");
            expect(nodeIds).toContain("b");
            expect(nodeIds).toContain("c");
        });

        it("should iterate over edges", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const edges = Array.from(graph.edges());
            expect(edges).toHaveLength(2);
        });

        it("should iterate over neighbors", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            const neighbors = Array.from(graph.neighbors("a"));
            expect(neighbors).toHaveLength(2);
            expect(neighbors).toContain("b");
            expect(neighbors).toContain("c");
        });
    });

    describe("clone", () => {
        it("should create an independent copy of the graph", () => {
            const original = new Graph();
            original.addEdge("a", "b", 5);

            const cloned = original.clone();

            // Verify the clone has the same structure
            expect(cloned.nodeCount).toBe(original.nodeCount);
            expect(cloned.totalEdgeCount).toBe(original.totalEdgeCount);
            expect(cloned.hasEdge("a", "b")).toBe(true);

            // Verify they are independent
            original.addNode("c");
            expect(cloned.hasNode("c")).toBe(false);
        });
    });
});
