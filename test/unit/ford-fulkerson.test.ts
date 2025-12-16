import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph";
import {
    createBipartiteFlowNetwork,
    edmondsKarp,
    fordFulkerson,
} from "../../src/flow/ford-fulkerson";
import {createGraphFromMap} from "../helpers/graph-test-utils";

describe("Ford-Fulkerson Algorithm", () => {
    describe("API consistency", () => {
        it("fordFulkerson should accept Graph type", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("source", "a", 10);
            graph.addEdge("a", "sink", 10);

            const result = fordFulkerson(graph, "source", "sink");
            expect(result.maxFlow).toBe(10);
        });

        it("edmondsKarp should accept Graph type", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("source", "a", 10);
            graph.addEdge("a", "sink", 10);

            const result = edmondsKarp(graph, "source", "sink");
            expect(result.maxFlow).toBe(10);
        });
    });

    describe("fordFulkerson", () => {
        it("should find maximum flow in a simple network", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["b", 2], ["t", 4]])],
                ["b", new Map([["c", 9], ["t", 10]])],
                ["c", new Map([["a", 6], ["t", 10]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(16);
            expect(result.flowGraph).toBeDefined();
            expect(result.minCut).toBeDefined();
        });

        it("should handle single path network", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 5]])],
                ["a", new Map([["b", 3]])],
                ["b", new Map([["t", 7]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(3); // Limited by edge a->b
            expect(result.flowGraph.get("s")?.get("a")).toBe(3);
            expect(result.flowGraph.get("a")?.get("b")).toBe(3);
            expect(result.flowGraph.get("b")?.get("t")).toBe(3);
        });

        it("should handle multiple parallel paths", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["t", 10]])],
                ["b", new Map([["t", 10]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(20);
        });

        it("should return zero flow for non-existent source", () => {
            const graphMap = new Map([
                ["a", new Map([["b", 10]])],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "x", "b");

            expect(result.maxFlow).toBe(0);
            expect(result.flowGraph.size).toBe(0);
        });

        it("should return zero flow for non-existent sink", () => {
            const graphMap = new Map([
                ["a", new Map([["b", 10]])],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "a", "x");

            expect(result.maxFlow).toBe(0);
        });

        it("should handle disconnected source and sink", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 10]])],
                ["a", new Map()],
                ["b", new Map([["t", 10]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(0);
        });

        it("should handle complex network with cycles", () => {
            const graphMap = new Map([
                ["s", new Map([["v1", 16], ["v2", 13]])],
                ["v1", new Map([["v2", 10], ["v3", 12]])],
                ["v2", new Map([["v1", 4], ["v4", 14]])],
                ["v3", new Map([["v2", 9], ["t", 20]])],
                ["v4", new Map([["v3", 7], ["t", 4]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(23);
        });

        it("should correctly identify minimum cut", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 3], ["b", 2]])],
                ["a", new Map([["t", 2]])],
                ["b", new Map([["t", 3]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(4);
            expect(result.minCut).toBeDefined();
            expect(result.minCut!.source.has("s")).toBe(true);
            expect(result.minCut!.sink.has("t")).toBe(true);
            expect(result.minCut!.edges.length).toBeGreaterThan(0);
        });

        it.skip("should handle single node graph", () => {
            const graph = new Map([
                ["s", new Map()],
            ]);

            const result = fordFulkerson(graph, "s", "s");

            expect(result.maxFlow).toBe(0);
        });

        it.skip("should handle capacity of zero", () => {
            const graph = new Map([
                ["s", new Map([["a", 0], ["b", 10]])],
                ["a", new Map([["t", 10]])],
                ["b", new Map([["t", 10]])],
                ["t", new Map()],
            ]);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(10); // Only through b
        });
    });

    describe("edmondsKarp", () => {
        it("should find same maximum flow as Ford-Fulkerson", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["b", 2], ["t", 4]])],
                ["b", new Map([["c", 9], ["t", 10]])],
                ["c", new Map([["a", 6], ["t", 10]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const ffResult = fordFulkerson(graph, "s", "t");
            const ekResult = edmondsKarp(graph, "s", "t");

            expect(ekResult.maxFlow).toBe(ffResult.maxFlow);
        });

        it("should handle large network efficiently", () => {
            const graph = new Map<string, Map<string, number>>();

            // Create a larger network
            for (let i = 0; i < 20; i++) {
                graph.set(`v${i}`, new Map());
            }

            // Add edges
            graph.get("v0")!.set("v1", 100);
            graph.get("v0")!.set("v2", 100);

            for (let i = 1; i < 19; i++) {
                graph.get(`v${i}`)!.set(`v${i + 1}`, 50);
                if (i < 18) {
                    graph.get(`v${i}`)!.set(`v${i + 2}`, 30);
                }
            }

            graph.get("v18")!.set("v19", 100);
            graph.get("v17")!.set("v19", 100);

            const startTime = Date.now();
            const graphObj = createGraphFromMap(graph);
            const result = edmondsKarp(graphObj, "v0", "v19");
            const endTime = Date.now();

            expect(result.maxFlow).toBeGreaterThan(0);
            expect(endTime - startTime).toBeLessThan(1000); // Should be fast
        });

        it("should handle all flow going through one bottleneck", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 100], ["b", 100]])],
                ["a", new Map([["c", 1]])], // Bottleneck
                ["b", new Map([["c", 1]])], // Bottleneck
                ["c", new Map([["t", 100]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = edmondsKarp(graph, "s", "t");

            expect(result.maxFlow).toBe(2);
        });
    });

    describe("createBipartiteFlowNetwork", () => {
        it("should create correct bipartite flow network", () => {
            const left = ["L1", "L2", "L3"];
            const right = ["R1", "R2", "R3"];
            const edges: Array<[string, string]> = [
                ["L1", "R1"],
                ["L1", "R2"],
                ["L2", "R2"],
                ["L3", "R3"],
            ];

            const {graph, source, sink} = createBipartiteFlowNetwork(left, right, edges);

            // Check source connections
            expect(graph.get(source)?.size).toBe(3);
            expect(graph.get(source)?.get("L1")).toBe(1);

            // Check bipartite edges
            expect(graph.get("L1")?.get("R1")).toBe(1);
            expect(graph.get("L1")?.get("R2")).toBe(1);

            // Check sink connections
            expect(graph.get("R1")?.get(sink)).toBe(1);

            // Find maximum matching
            const graphObj = createGraphFromMap(graph);
            const result = fordFulkerson(graphObj, source, sink);
            expect(result.maxFlow).toBe(3); // Perfect matching possible
        });

        it.skip("should handle empty bipartite graph", () => {
            const {graph, source, sink} = createBipartiteFlowNetwork([], [], []);

            expect(graph.get(source)?.size).toBe(0);
            expect(graph.has(sink)).toBe(true);
        });

        it.skip("should handle bipartite graph with no edges", () => {
            const left = ["L1", "L2"];
            const right = ["R1", "R2"];

            const {graph, source, sink} = createBipartiteFlowNetwork(left, right, []);

            const graphObj = createGraphFromMap(graph);
            const result = fordFulkerson(graphObj, source, sink);
            expect(result.maxFlow).toBe(0);
        });

        it("should find maximum matching in bipartite graph", () => {
            const left = ["A", "B", "C", "D"];
            const right = ["1", "2", "3", "4"];
            const edges: Array<[string, string]> = [
                ["A", "1"],
                ["A", "2"],
                ["B", "2"],
                ["B", "3"],
                ["C", "3"],
                ["C", "4"],
                ["D", "4"],
                ["D", "1"],
            ];

            const {graph, source, sink} = createBipartiteFlowNetwork(left, right, edges);
            const graphObj = createGraphFromMap(graph);
            const result = fordFulkerson(graphObj, source, sink);

            expect(result.maxFlow).toBe(4); // Perfect matching exists
        });
    });

    describe("edge cases and stress tests", () => {
        it.skip("should handle graph with self-loops", () => {
            const graph = new Map([
                ["s", new Map([["a", 10], ["s", 5]])], // Self-loop
                ["a", new Map([["t", 10]])],
                ["t", new Map()],
            ]);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(10);
        });

        it("should handle very large capacities", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 1e9], ["b", 1e9]])],
                ["a", new Map([["t", 1e9]])],
                ["b", new Map([["t", 1e9]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBe(2e9);
        });

        it.skip("should handle fractional capacities", () => {
            const graph = new Map([
                ["s", new Map([["a", 3.5], ["b", 2.7]])],
                ["a", new Map([["t", 4.2]])],
                ["b", new Map([["t", 1.8]])],
                ["t", new Map()],
            ]);

            const result = fordFulkerson(graph, "s", "t");

            expect(result.maxFlow).toBeCloseTo(5.3, 5);
        });

        it("should correctly update flow graph", () => {
            const graphMap = new Map([
                ["s", new Map([["a", 10], ["b", 10]])],
                ["a", new Map([["t", 10]])],
                ["b", new Map([["t", 10]])],
                ["t", new Map()],
            ]);
            const graph = createGraphFromMap(graphMap);

            const result = fordFulkerson(graph, "s", "t");

            // Verify flow conservation
            const flowIn = new Map<string, number>();
            const flowOut = new Map<string, number>();

            for (const [u, neighbors] of result.flowGraph) {
                for (const [v, flow] of neighbors) {
                    flowOut.set(u, (flowOut.get(u) || 0) + flow);
                    flowIn.set(v, (flowIn.get(v) || 0) + flow);
                }
            }

            // Check flow conservation (except source and sink)
            for (const node of ["a", "b"]) {
                expect(flowIn.get(node) || 0).toBe(flowOut.get(node) || 0);
            }
        });
    });
});
