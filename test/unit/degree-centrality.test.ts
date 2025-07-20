import {describe, expect, it} from "vitest";

import {degreeCentrality, nodeDegreeCentrality} from "../../src/algorithms/centrality/degree.js";
import {Graph} from "../../src/core/graph.js";

describe("Degree Centrality", () => {
    describe("degreeCentrality", () => {
        it("should calculate degree centrality for undirected graph", () => {
            const graph = new Graph();

            // Create a star graph: center connected to 3 others
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");

            const centrality = degreeCentrality(graph);

            expect(centrality.center).toBe(3);
            expect(centrality.a).toBe(1);
            expect(centrality.b).toBe(1);
            expect(centrality.c).toBe(1);
        });

        it("should calculate normalized degree centrality", () => {
            const graph = new Graph();

            // 4 nodes: max possible degree is 3
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");

            const centrality = degreeCentrality(graph, {normalized: true});

            expect(centrality.center).toBeCloseTo(1.0); // 3/3 = 1.0
            expect(centrality.a).toBeCloseTo(0.333, 2); // 1/3 ≈ 0.333
            expect(centrality.b).toBeCloseTo(0.333, 2);
            expect(centrality.c).toBeCloseTo(0.333, 2);
        });

        it("should handle directed graph with total degree mode", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "b");
            graph.addEdge("b", "d");

            const centrality = degreeCentrality(graph, {mode: "total"});

            expect(centrality.a).toBe(1); // out-degree: 1
            expect(centrality.b).toBe(3); // in-degree: 2, out-degree: 1
            expect(centrality.c).toBe(1); // out-degree: 1
            expect(centrality.d).toBe(1); // in-degree: 1
        });

        it("should handle directed graph with in-degree mode", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "b");
            graph.addEdge("b", "d");

            const centrality = degreeCentrality(graph, {mode: "in"});

            expect(centrality.a).toBe(0);
            expect(centrality.b).toBe(2); // Receives edges from a and c
            expect(centrality.c).toBe(0);
            expect(centrality.d).toBe(1); // Receives edge from b
        });

        it("should handle directed graph with out-degree mode", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "b");
            graph.addEdge("b", "d");

            const centrality = degreeCentrality(graph, {mode: "out"});

            expect(centrality.a).toBe(1); // Sends edge to b
            expect(centrality.b).toBe(1); // Sends edge to d
            expect(centrality.c).toBe(1); // Sends edge to b
            expect(centrality.d).toBe(0);
        });

        it("should handle single node graph", () => {
            const graph = new Graph();

            graph.addNode("only");

            const centrality = degreeCentrality(graph);

            expect(centrality.only).toBe(0);
        });

        it("should handle empty graph", () => {
            const graph = new Graph();

            const centrality = degreeCentrality(graph);

            expect(Object.keys(centrality)).toHaveLength(0);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Two disconnected pairs
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");
            graph.addNode("isolated");

            const centrality = degreeCentrality(graph);

            expect(centrality.a).toBe(1);
            expect(centrality.b).toBe(1);
            expect(centrality.c).toBe(1);
            expect(centrality.d).toBe(1);
            expect(centrality.isolated).toBe(0);
        });

        it("should handle self-loops correctly", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a"); // Self-loop
            graph.addEdge("a", "b");

            const centrality = degreeCentrality(graph);

            // Self-loop should count as degree 1 in undirected graph
            expect(centrality.a).toBe(2); // Self-loop + edge to b
            expect(centrality.b).toBe(1);
        });

        it("should convert node IDs to strings in result", () => {
            const graph = new Graph();

            graph.addEdge(1, 2);
            graph.addEdge(2, 3);

            const centrality = degreeCentrality(graph);

            expect(centrality["1"]).toBe(1);
            expect(centrality["2"]).toBe(2);
            expect(centrality["3"]).toBe(1);
        });

        it("should handle normalized centrality with single node", () => {
            const graph = new Graph();

            graph.addNode("only");

            const centrality = degreeCentrality(graph, {normalized: true});

            expect(centrality.only).toBe(0); // 0/0 should be handled gracefully
        });

        it("should handle normalized centrality with two nodes", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            const centrality = degreeCentrality(graph, {normalized: true});

            expect(centrality.a).toBe(1); // 1/1 = 1.0
            expect(centrality.b).toBe(1); // 1/1 = 1.0
        });
    });

    describe("nodeDegreeCentrality", () => {
        it("should calculate centrality for specific node", () => {
            const graph = new Graph();

            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("a", "b");

            const centralityA = nodeDegreeCentrality(graph, "a");
            const centralityCenter = nodeDegreeCentrality(graph, "center");

            expect(centralityA).toBe(2);
            expect(centralityCenter).toBe(2);
        });

        it("should calculate normalized centrality for specific node", () => {
            const graph = new Graph();

            // 3 nodes: max possible degree is 2
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            const centrality = nodeDegreeCentrality(graph, "a", {normalized: true});

            expect(centrality).toBe(1.0); // 2/2 = 1.0
        });

        it("should handle directed graph modes for specific node", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "b");
            graph.addEdge("b", "d");

            expect(nodeDegreeCentrality(graph, "b", {mode: "in"})).toBe(2);
            expect(nodeDegreeCentrality(graph, "b", {mode: "out"})).toBe(1);
            expect(nodeDegreeCentrality(graph, "b", {mode: "total"})).toBe(3);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => nodeDegreeCentrality(graph, "nonexistent")).toThrow("Node nonexistent not found");
        });

        it("should handle numeric node ID", () => {
            const graph = new Graph();

            graph.addEdge(1, 2);
            graph.addEdge(1, 3);

            const centrality = nodeDegreeCentrality(graph, 1);

            expect(centrality).toBe(2);
        });

        it("should handle normalized centrality for single node graph", () => {
            const graph = new Graph();

            graph.addNode("only");

            const centrality = nodeDegreeCentrality(graph, "only", {normalized: true});

            expect(centrality).toBe(0);
        });

        it("should handle self-loops for specific node", () => {
            const graph = new Graph({allowSelfLoops: true, directed: true});

            graph.addEdge("a", "a"); // Self-loop
            graph.addEdge("a", "b");
            graph.addEdge("c", "a");

            expect(nodeDegreeCentrality(graph, "a", {mode: "in"})).toBe(2); // Self-loop + from c
            expect(nodeDegreeCentrality(graph, "a", {mode: "out"})).toBe(2); // Self-loop + to b
            expect(nodeDegreeCentrality(graph, "a", {mode: "total"})).toBe(4);
        });
    });

    describe("edge cases", () => {
        it("should handle graph with only self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a");
            graph.addEdge("b", "b");

            const centrality = degreeCentrality(graph);

            expect(centrality.a).toBe(1);
            expect(centrality.b).toBe(1);
        });

        it("should handle complete graph", () => {
            const graph = new Graph();

            // Complete graph with 4 nodes
            const nodes = ["a", "b", "c", "d"];
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeI = nodes[i];
                    const nodeJ = nodes[j];
                    if (nodeI && nodeJ) {
                        graph.addEdge(nodeI, nodeJ);
                    }
                }
            }

            const centrality = degreeCentrality(graph, {normalized: true});

            // Each node connected to all others
            for (const node of nodes) {
                expect(centrality[node]).toBe(1.0);
            }
        });

        it("should handle large graphs efficiently", () => {
            const graph = new Graph();
            const nodeCount = 1000;

            // Create a star graph
            for (let i = 1; i < nodeCount; i++) {
                graph.addEdge(0, i);
            }

            const centrality = degreeCentrality(graph);

            expect(centrality["0"]).toBe(nodeCount - 1);
            for (let i = 1; i < nodeCount; i++) {
                expect(centrality[i.toString()]).toBe(1);
            }
        });

        it("should handle mixed node ID types", () => {
            const graph = new Graph();

            graph.addEdge("string", 123);
            graph.addEdge(123, "another");

            const centrality = degreeCentrality(graph);

            expect(centrality.string).toBe(1);
            expect(centrality["123"]).toBe(2);
            expect(centrality.another).toBe(1);
        });

        it("should handle normalized centrality edge case with division by zero", () => {
            const graph = new Graph();

            graph.addNode("only");

            const centrality = degreeCentrality(graph, {normalized: true});

            // Should handle division by zero gracefully
            expect(centrality.only).toBe(0);
        });

        it("should maintain consistency between undirected and directed default behavior", () => {
            const undirectedGraph = new Graph({directed: false});
            const directedGraph = new Graph({directed: true});

            // Same edges added to both
            undirectedGraph.addEdge("a", "b");
            directedGraph.addEdge("a", "b");

            const undirectedCentrality = degreeCentrality(undirectedGraph);
            const directedCentrality = degreeCentrality(directedGraph);

            // In undirected graph, both nodes have degree 1
            expect(undirectedCentrality.a).toBe(1);
            expect(undirectedCentrality.b).toBe(1);

            // In directed graph, total degree by default
            expect(directedCentrality.a).toBe(1); // out-degree: 1
            expect(directedCentrality.b).toBe(1); // in-degree: 1
        });

        it("should handle very high degree nodes", () => {
            const graph = new Graph();

            // Create a node with very high degree
            const centerNode = "center";
            for (let i = 0; i < 10000; i++) {
                graph.addEdge(centerNode, `node_${i}`);
            }

            const centrality = nodeDegreeCentrality(graph, centerNode);

            expect(centrality).toBe(10000);
        });
    });
});
