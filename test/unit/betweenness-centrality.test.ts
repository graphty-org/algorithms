import {describe, expect, it} from "vitest";

import {betweennessCentrality, edgeBetweennessCentrality, nodeBetweennessCentrality} from "../../src/algorithms/centrality/betweenness.js";
import {Graph} from "../../src/core/graph.js";

describe("Betweenness Centrality", () => {
    describe("betweennessCentrality", () => {
        it("should calculate betweenness centrality for simple path graph", () => {
            const graph = new Graph();

            // Create a path: a - b - c - d
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const centrality = betweennessCentrality(graph);

            expect(centrality["a"]).toBe(0); // Endpoint
            expect(centrality["b"]).toBe(2); // paths: a↔c, a↔d pass through b  
            expect(centrality["c"]).toBe(2); // paths: a↔d, b↔d pass through c
            expect(centrality["d"]).toBe(0); // Endpoint
        });

        it("should calculate betweenness centrality for star graph", () => {
            const graph = new Graph();

            // Create a star: center connected to a, b, c
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");

            const centrality = betweennessCentrality(graph);

            expect(centrality["center"]).toBe(3); // All paths between periphery nodes go through center
            expect(centrality["a"]).toBe(0);
            expect(centrality["b"]).toBe(0);
            expect(centrality["c"]).toBe(0);
        });

        it("should calculate normalized betweenness centrality", () => {
            const graph = new Graph();

            // Create a path: a - b - c
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centrality = betweennessCentrality(graph, {normalized: true});

            // For 3 nodes in undirected graph: normalization factor = (3-1)*(3-2)/2 = 1
            expect(centrality["a"]).toBe(0);
            expect(centrality["b"]).toBe(1); // 1 path / 1 = 1
            expect(centrality["c"]).toBe(0);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("a", "c");

            const centrality = betweennessCentrality(graph);

            expect(centrality["a"]).toBe(0);
            expect(centrality["b"]).toBe(0); // Direct path a->c exists
            expect(centrality["c"]).toBe(0);
        });

        it("should handle single node graph", () => {
            const graph = new Graph();

            graph.addNode("only");

            const centrality = betweennessCentrality(graph);

            expect(centrality["only"]).toBe(0);
        });

        it("should handle empty graph", () => {
            const graph = new Graph();

            const centrality = betweennessCentrality(graph);

            expect(Object.keys(centrality)).toHaveLength(0);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two disconnected edges
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const centrality = betweennessCentrality(graph);

            expect(centrality["a"]).toBe(0);
            expect(centrality["b"]).toBe(0);
            expect(centrality["c"]).toBe(0);
            expect(centrality["d"]).toBe(0);
        });

        it("should handle triangle graph", () => {
            const graph = new Graph();

            // Create a triangle
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const centrality = betweennessCentrality(graph);

            // In a triangle, all nodes have equal betweenness (all are equally central)
            expect(centrality["a"]).toBe(0);
            expect(centrality["b"]).toBe(0);
            expect(centrality["c"]).toBe(0);
        });

        it("should handle bridge node correctly", () => {
            const graph = new Graph();

            // Create two triangles connected by a bridge
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");
            graph.addEdge("c", "d"); // Bridge
            graph.addEdge("d", "e");
            graph.addEdge("e", "f");
            graph.addEdge("f", "d");

            const centrality = betweennessCentrality(graph);

            // c and d should have high betweenness as they bridge the two components
            expect(centrality["c"]).toBeGreaterThan(centrality["a"]);
            expect(centrality["d"]).toBeGreaterThan(centrality["e"]);
        });

        it("should convert node IDs to strings in result", () => {
            const graph = new Graph();

            graph.addEdge(1, 2);
            graph.addEdge(2, 3);

            const centrality = betweennessCentrality(graph);

            expect(centrality["1"]).toBe(0);
            expect(centrality["2"]).toBe(1);
            expect(centrality["3"]).toBe(0);
        });
    });

    describe("nodeBetweennessCentrality", () => {
        it("should calculate centrality for specific node", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const centralityB = nodeBetweennessCentrality(graph, "b");
            const centralityA = nodeBetweennessCentrality(graph, "a");

            expect(centralityB).toBe(2);
            expect(centralityA).toBe(0);
        });

        it("should handle normalized centrality for specific node", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centrality = nodeBetweennessCentrality(graph, "b", {normalized: true});

            expect(centrality).toBe(1);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => nodeBetweennessCentrality(graph, "nonexistent")).toThrow("Node nonexistent not found");
        });

        it("should handle numeric node ID", () => {
            const graph = new Graph();

            graph.addEdge(1, 2);
            graph.addEdge(2, 3);

            const centrality = nodeBetweennessCentrality(graph, 2);

            expect(centrality).toBe(1);
        });
    });

    describe("edgeBetweennessCentrality", () => {
        it("should calculate edge betweenness centrality", () => {
            const graph = new Graph();

            // Create a path: a - b - c
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centrality = edgeBetweennessCentrality(graph);

            expect(centrality.get("a-b")).toBe(1);
            expect(centrality.get("b-c")).toBe(1);
        });

        it("should calculate edge betweenness for star graph", () => {
            const graph = new Graph();

            // Create a star
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");

            const centrality = edgeBetweennessCentrality(graph);

            // Each edge from center carries equal betweenness
            expect(centrality.get("center-a")).toBe(1.5);
            expect(centrality.get("center-b")).toBe(1.5);
            expect(centrality.get("center-c")).toBe(1.5);
        });

        it("should handle normalized edge betweenness", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centrality = edgeBetweennessCentrality(graph, {normalized: true});

            expect(centrality.get("a-b")).toBe(1);
            expect(centrality.get("b-c")).toBe(1);
        });

        it("should handle directed graphs for edge betweenness", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centrality = edgeBetweennessCentrality(graph);

            expect(centrality.get("a-b")).toBe(2);
            expect(centrality.get("b-c")).toBe(2);
        });

        it("should handle bridge edges correctly", () => {
            const graph = new Graph();

            // Two components connected by a bridge
            graph.addEdge("a", "b");
            graph.addEdge("b", "bridge1");
            graph.addEdge("bridge1", "bridge2");
            graph.addEdge("bridge2", "c");
            graph.addEdge("c", "d");

            const centrality = edgeBetweennessCentrality(graph);

            // Bridge edge should have highest betweenness
            const bridgeEdgeCentrality = centrality.get("bridge1-bridge2");
            const normalEdgeCentrality = centrality.get("a-b");

            expect(bridgeEdgeCentrality).toBeGreaterThan(normalEdgeCentrality!);
        });
    });

    describe("edge cases", () => {
        it("should handle self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const centrality = betweennessCentrality(graph);

            expect(centrality["a"]).toBe(0);
            expect(centrality["b"]).toBe(0);
        });

        it("should handle complex network", () => {
            const graph = new Graph();

            // Create a more complex network
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "d");
            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "f");
            graph.addEdge("e", "g");

            const centrality = betweennessCentrality(graph);

            // Node e should have high betweenness as it connects to multiple end branches
            expect(centrality["e"]).toBeGreaterThan(centrality["a"]);
            expect(centrality["e"]).toBeGreaterThan(centrality["f"]);
        });

        it("should handle large star graph efficiently", () => {
            const graph = new Graph();
            const nodeCount = 100;

            // Create a large star
            for (let i = 1; i < nodeCount; i++) {
                graph.addEdge("center", `node_${i}`);
            }

            const centrality = betweennessCentrality(graph);

            expect(centrality["center"]).toBe((nodeCount - 1) * (nodeCount - 2) / 2);
            expect(centrality["node_1"]).toBe(0);
        });

        it("should handle endpoints option correctly", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const centralityWithEndpoints = betweennessCentrality(graph, {endpoints: true});
            const centralityWithoutEndpoints = betweennessCentrality(graph, {endpoints: false});

            // Without endpoints, values should be different (typically smaller)
            expect(centralityWithEndpoints["b"]).toBeGreaterThanOrEqual(centralityWithoutEndpoints["b"]);
        });
    });
});