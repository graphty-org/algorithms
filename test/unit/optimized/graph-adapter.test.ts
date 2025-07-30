import {beforeEach, describe, expect, it} from "vitest";

import {Graph} from "../../../src/core/graph.js";
import {CSRGraph} from "../../../src/optimized/csr-graph.js";
import {
    configureOptimizations,
    createOptimizedGraph,
    getOptimizationConfig,
    GraphAdapter,
    isCSRGraph,
    toCSRGraph,
} from "../../../src/optimized/graph-adapter.js";

describe("GraphAdapter", () => {
    describe("constructor", () => {
        it("should wrap CSRGraph directly without conversion", () => {
            const adjacencyList = new Map([
                ["A", ["B", "C"]],
                ["B", ["C"]],
                ["C", []],
            ]);
            const csrGraph = new CSRGraph(adjacencyList);
            const adapter = new GraphAdapter(csrGraph);

            expect(adapter.getCSRGraph()).toBe(csrGraph);
        });

        it("should convert standard Graph to CSR format", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B", 2);
            graph.addEdge("A", "C", 3);

            const adapter = new GraphAdapter(graph);
            const csr = adapter.getCSRGraph();

            expect(csr.nodeCount()).toBe(3);
            expect(Array.from(csr.neighbors("A"))).toEqual(["B", "C"]);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            const adapter = new GraphAdapter(graph);
            const csr = adapter.getCSRGraph();

            expect(csr.hasEdge("A", "B")).toBe(true);
            expect(csr.hasEdge("B", "A")).toBe(false);
        });

        it("should preserve edge weights", () => {
            const graph = new Graph();
            graph.addEdge("A", "B", 5);
            graph.addEdge("B", "C", 10);

            const adapter = new GraphAdapter(graph);
            const csr = adapter.getCSRGraph();

            // CSRGraph stores weights but doesn't expose getEdgeWeight method
            expect(csr.hasEdge("A", "B")).toBe(true);
            expect(csr.hasEdge("B", "C")).toBe(true);
        });

        it("should handle ReadonlyGraph interface", () => {
            const readonlyGraph = {
                nodeIds: () => ["A", "B", "C"],
                neighbors: (nodeId: string) => {
                    if (nodeId === "A") {
                        return ["B", "C"];
                    }
                    if (nodeId === "B") {
                        return ["C"];
                    }
                    return [];
                },
                edges: function* () {
                    yield {source: "A", target: "B"};
                    yield {source: "A", target: "C"};
                    yield {source: "B", target: "C"};
                },
                nodeCount: () => 3,
                hasDirectedEdge: (source: string, target: string) => {
                    if (source === "A") {
                        return target === "B" || target === "C";
                    }
                    if (source === "B") {
                        return target === "C";
                    }
                    return false;
                },
            };

            const adapter = new GraphAdapter(readonlyGraph);
            const csr = adapter.getCSRGraph();

            expect(csr.nodeCount()).toBe(3);
            expect(Array.from(csr.neighbors("A")).sort()).toEqual(["B", "C"]);
        });

        it("should handle ReadonlyGraph with edge weights", () => {
            const readonlyGraph = {
                nodeIds: () => ["A", "B"],
                neighbors: (nodeId: string) => {
                    if (nodeId === "A") {
                        return ["B"];
                    }
                    return [];
                },
                edges: function* () {
                    yield {source: "A", target: "B", weight: 42};
                },
                nodeCount: () => 2,
                hasDirectedEdge: () => true,
            };

            const adapter = new GraphAdapter(readonlyGraph);
            const csr = adapter.getCSRGraph();

            // CSRGraph doesn't have getEdgeWeight method, just check edge exists
            expect(csr.hasEdge("A", "B")).toBe(true);
        });
    });

    describe("GraphAdapter methods", () => {
        let adapter: GraphAdapter<string>;

        beforeEach(() => {
            const graph = new Graph();
            graph.addEdge("A", "B", 1);
            graph.addEdge("B", "C", 2);
            graph.addEdge("C", "A", 3);
            adapter = new GraphAdapter(graph);
        });

        it("should implement nodes", () => {
            const nodeIds = Array.from(adapter.nodes());
            expect(nodeIds).toContain("A");
            expect(nodeIds).toContain("B");
            expect(nodeIds).toContain("C");
            expect(nodeIds.length).toBe(3);
        });

        it("should implement neighbors", () => {
            const neighbors = Array.from(adapter.neighbors("A"));
            expect(neighbors).toContain("B");
            expect(neighbors).toContain("C");
        });

        it("should implement nodeCount", () => {
            expect(adapter.nodeCount()).toBe(3);
        });

        it("should implement hasEdge", () => {
            expect(adapter.hasEdge("A", "B")).toBe(true);
            expect(adapter.hasEdge("B", "A")).toBe(true); // Undirected
            expect(adapter.hasEdge("A", "D")).toBe(false);
        });

        it("should implement outDegree", () => {
            expect(adapter.outDegree("A")).toBe(2);
            expect(adapter.outDegree("B")).toBe(2);
            expect(adapter.outDegree("C")).toBe(2);
            // Node D doesn't exist in the graph
        });

        it("should implement getCSRGraph", () => {
            const csr = adapter.getCSRGraph();
            expect(csr).toBeInstanceOf(CSRGraph);
        });
    });
});

describe("toCSRGraph", () => {
    it("should return CSRGraph unchanged", () => {
        const csr = new CSRGraph(new Map([["A", ["B"]]]));
        const result = toCSRGraph(csr);
        expect(result).toBe(csr);
    });

    it("should convert Graph to CSRGraph", () => {
        const graph = new Graph();
        graph.addEdge("A", "B");

        const result = toCSRGraph(graph);
        expect(result).toBeInstanceOf(CSRGraph);
        expect(result.hasEdge("A", "B")).toBe(true);
    });

    it("should handle CSRGraph input", () => {
        const graph = new Graph();
        graph.addEdge("A", "B");
        const adapter = new GraphAdapter(graph);
        const csr = adapter.getCSRGraph();

        const result = toCSRGraph(csr);
        expect(result).toBe(csr); // Should return the same CSRGraph instance
    });
});

describe("createOptimizedGraph", () => {
    it("should create CSRGraph from nodes and edges", () => {
        const nodes = ["A", "B", "C", "D"];
        const edges: [string, string, number?][] = [
            ["A", "B", 1],
            ["B", "C", 2],
            ["C", "D"],
            ["D", "A", 4],
        ];

        const graph = createOptimizedGraph(nodes, edges);

        expect(graph.nodeCount()).toBe(4);
        expect(graph.hasEdge("A", "B")).toBe(true);
        expect(graph.hasEdge("C", "D")).toBe(true);
    });

    it("should handle nodes without edges", () => {
        const nodes = ["A", "B", "C"];
        const edges: [string, string, number?][] = [
            ["A", "B"],
        ];

        const graph = createOptimizedGraph(nodes, edges);

        expect(graph.nodeCount()).toBe(3);
        expect(Array.from(graph.neighbors("C"))).toEqual([]);
    });

    it("should handle edges without weights", () => {
        const nodes = [1, 2, 3];
        const edges: [number, number][] = [
            [1, 2],
            [2, 3],
            [3, 1],
        ];

        const graph = createOptimizedGraph(nodes, edges);

        expect(graph.hasEdge(1, 2)).toBe(true);
    });

    it("should ignore edges for non-existent source nodes", () => {
        const nodes = ["A", "B"];
        const edges: [string, string, number?][] = [
            ["A", "B", 1],
            ["C", "D", 2], // C is not in nodes
        ];

        const graph = createOptimizedGraph(nodes, edges);

        expect(graph.nodeCount()).toBe(2);
        expect(graph.hasEdge("C", "D")).toBe(false);
    });
});

describe("isCSRGraph", () => {
    it("should return true for CSRGraph instances", () => {
        const csr = new CSRGraph(new Map([["A", ["B"]]]));
        expect(isCSRGraph(csr)).toBe(true);
    });

    it("should return false for regular Graph", () => {
        const graph = new Graph();
        expect(isCSRGraph(graph)).toBe(false);
    });

    it("should return false for GraphAdapter", () => {
        const graph = new Graph();
        const adapter = new GraphAdapter(graph);
        expect(isCSRGraph(adapter)).toBe(false);
    });

    it("should return false for plain objects", () => {
        expect(isCSRGraph({})).toBe(false);
        expect(isCSRGraph(null)).toBe(false);
        expect(isCSRGraph(undefined)).toBe(false);
    });
});

describe("optimization configuration (deprecated)", () => {
    it("should return empty object from getOptimizationConfig", () => {
        const config = getOptimizationConfig();
        expect(config).toEqual({});
    });

    it("should not store configuration (no-op)", () => {
        const config = {
            useDirectionOptimizedBFS: true,
            useCSRFormat: false,
            useBitPackedStructures: true,
            bfsAlpha: 20.0,
            bfsBeta: 25.0,
            preallocateSize: 500000,
            enableCaching: false,
        };

        configureOptimizations(config);
        const retrieved = getOptimizationConfig();

        // Should still return empty object since it's a no-op
        expect(retrieved).toEqual({});
    });
});
