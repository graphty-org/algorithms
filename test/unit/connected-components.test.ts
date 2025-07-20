import {describe, expect, it} from "vitest";

import {
    condensationGraph,
    connectedComponents,
    connectedComponentsDFS,
    getConnectedComponent,
    isConnected,
    isStronglyConnected,
    isWeaklyConnected,
    largestConnectedComponent,
    numberOfConnectedComponents,
    stronglyConnectedComponents,
    weaklyConnectedComponents,
} from "../../src/algorithms/components/connected.js";
import {Graph} from "../../src/core/graph.js";

describe("Connected Components", () => {
    describe("connectedComponents", () => {
        it("should find single component in connected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const components = connectedComponents(graph);

            expect(components).toHaveLength(1);
            expect(components[0]).toHaveLength(4);
            expect(components[0].sort()).toEqual(["a", "b", "c", "d"]);
        });

        it("should find multiple components in disconnected graph", () => {
            const graph = new Graph();

            // Two disconnected components
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");
            graph.addNode("isolated");

            const components = connectedComponents(graph);

            expect(components).toHaveLength(3);
            
            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([1, 2, 2]);
        });

        it("should handle empty graph", () => {
            const graph = new Graph();

            const components = connectedComponents(graph);

            expect(components).toEqual([]);
        });

        it("should handle single node", () => {
            const graph = new Graph();

            graph.addNode("only");

            const components = connectedComponents(graph);

            expect(components).toHaveLength(1);
            expect(components[0]).toEqual(["only"]);
        });

        it("should throw error for directed graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");

            expect(() => connectedComponents(graph)).toThrow("Connected components algorithm requires an undirected graph");
        });

        it("should handle complex graph", () => {
            const graph = new Graph();

            // Component 1: triangle
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            // Component 2: path
            graph.addEdge("d", "e");
            graph.addEdge("e", "f");

            // Component 3: isolated nodes
            graph.addNode("g");
            graph.addNode("h");

            const components = connectedComponents(graph);

            expect(components).toHaveLength(4);
            
            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([1, 1, 3, 3]);
        });

        it("should work with numeric node IDs", () => {
            const graph = new Graph();

            graph.addEdge(1, 2);
            graph.addEdge(3, 4);

            const components = connectedComponents(graph);

            expect(components).toHaveLength(2);
            expect(components[0]).toHaveLength(2);
            expect(components[1]).toHaveLength(2);
        });
    });

    describe("connectedComponentsDFS", () => {
        it("should produce same results as Union-Find method", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("c", "d");
            graph.addNode("isolated");

            const componentsUF = connectedComponents(graph);
            const componentsDFS = connectedComponentsDFS(graph);

            expect(componentsDFS).toHaveLength(componentsUF.length);
            
            // Sort for comparison
            const sortedUF = componentsUF.map((comp) => comp.sort()).sort();
            const sortedDFS = componentsDFS.map((comp) => comp.sort()).sort();
            
            expect(sortedDFS).toEqual(sortedUF);
        });

        it("should throw error for directed graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");

            expect(() => connectedComponentsDFS(graph)).toThrow("Connected components algorithm requires an undirected graph");
        });
    });

    describe("numberOfConnectedComponents", () => {
        it("should count components correctly", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("c", "d");
            graph.addNode("isolated");

            expect(numberOfConnectedComponents(graph)).toBe(3);
        });

        it("should return 0 for empty graph", () => {
            const graph = new Graph();

            expect(numberOfConnectedComponents(graph)).toBe(0);
        });
    });

    describe("isConnected", () => {
        it("should return true for connected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            expect(isConnected(graph)).toBe(true);
        });

        it("should return false for disconnected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            expect(isConnected(graph)).toBe(false);
        });

        it("should return true for empty graph", () => {
            const graph = new Graph();

            expect(isConnected(graph)).toBe(true);
        });

        it("should return true for single node", () => {
            const graph = new Graph();

            graph.addNode("only");

            expect(isConnected(graph)).toBe(true);
        });
    });

    describe("largestConnectedComponent", () => {
        it("should find largest component", () => {
            const graph = new Graph();

            // Small component
            graph.addEdge("a", "b");

            // Large component
            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "f");

            const largest = largestConnectedComponent(graph);

            expect(largest).toHaveLength(4);
            expect(largest.sort()).toEqual(["c", "d", "e", "f"]);
        });

        it("should return empty array for empty graph", () => {
            const graph = new Graph();

            const largest = largestConnectedComponent(graph);

            expect(largest).toEqual([]);
        });
    });

    describe("getConnectedComponent", () => {
        it("should get component containing specific node", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("d", "e");

            const component = getConnectedComponent(graph, "b");

            expect(component).toHaveLength(3);
            expect(component.sort()).toEqual(["a", "b", "c"]);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph();

            graph.addNode("a");

            expect(() => getConnectedComponent(graph, "nonexistent")).toThrow("Node nonexistent not found");
        });

        it("should throw error for directed graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");

            expect(() => getConnectedComponent(graph, "a")).toThrow("Connected components algorithm requires an undirected graph");
        });
    });

    describe("stronglyConnectedComponents", () => {
        it("should find SCCs in directed graph", () => {
            const graph = new Graph({directed: true});

            // Create two SCCs
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a"); // SCC 1: {a, b, c}

            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "d"); // SCC 2: {d, e}

            const components = stronglyConnectedComponents(graph);

            expect(components).toHaveLength(2);
            
            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([2, 3]);
        });

        it("should handle single node components", () => {
            const graph = new Graph({directed: true});

            // Create a DAG (each node is its own SCC)
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const components = stronglyConnectedComponents(graph);

            expect(components).toHaveLength(3);
            expect(components.every((comp) => comp.length === 1)).toBe(true);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({directed: true, allowSelfLoops: true});

            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const components = stronglyConnectedComponents(graph);

            expect(components).toHaveLength(2);
            expect(components.some((comp) => comp.includes("a") && comp.length === 1)).toBe(true);
            expect(components.some((comp) => comp.includes("b") && comp.length === 1)).toBe(true);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(() => stronglyConnectedComponents(graph)).toThrow("Strongly connected components require a directed graph");
        });

        it("should handle empty graph", () => {
            const graph = new Graph({directed: true});

            const components = stronglyConnectedComponents(graph);

            expect(components).toEqual([]);
        });

        it("should handle complex SCC structure", () => {
            const graph = new Graph({directed: true});

            // Complex graph with multiple SCCs
            graph.addEdge("a", "b");
            graph.addEdge("b", "a"); // SCC 1: {a, b}

            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "c"); // SCC 2: {c, d, e}

            graph.addEdge("b", "c"); // Connection between SCCs
            graph.addEdge("e", "f"); // f is isolated

            const components = stronglyConnectedComponents(graph);

            expect(components).toHaveLength(3);
            
            const sizes = components.map((comp) => comp.length).sort();
            expect(sizes).toEqual([1, 2, 3]);
        });
    });

    describe("isStronglyConnected", () => {
        it("should return true for strongly connected graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            expect(isStronglyConnected(graph)).toBe(true);
        });

        it("should return false for weakly connected graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            expect(isStronglyConnected(graph)).toBe(false);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(() => isStronglyConnected(graph)).toThrow("Strong connectivity check requires a directed graph");
        });
    });

    describe("weaklyConnectedComponents", () => {
        it("should find weakly connected components", () => {
            const graph = new Graph({directed: true});

            // Two weakly connected components
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const components = weaklyConnectedComponents(graph);

            expect(components).toHaveLength(2);
            expect(components[0]).toHaveLength(2);
            expect(components[1]).toHaveLength(2);
        });

        it("should treat directed edges as undirected", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "b"); // b is reachable from both a and c

            const components = weaklyConnectedComponents(graph);

            expect(components).toHaveLength(1);
            expect(components[0]).toHaveLength(3);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(() => weaklyConnectedComponents(graph)).toThrow("Weakly connected components are for directed graphs");
        });
    });

    describe("isWeaklyConnected", () => {
        it("should return true for weakly connected graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "b");

            expect(isWeaklyConnected(graph)).toBe(true);
        });

        it("should return false for disconnected graph", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            expect(isWeaklyConnected(graph)).toBe(false);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(() => isWeaklyConnected(graph)).toThrow("Weak connectivity check requires a directed graph");
        });
    });

    describe("condensationGraph", () => {
        it("should create condensation graph", () => {
            const graph = new Graph({directed: true});

            // Two SCCs with connection
            graph.addEdge("a", "b");
            graph.addEdge("b", "a"); // SCC 0: {a, b}

            graph.addEdge("c", "d");
            graph.addEdge("d", "c"); // SCC 1: {c, d}

            graph.addEdge("b", "c"); // Edge between SCCs

            const result = condensationGraph(graph);

            expect(result.components).toHaveLength(2);
            expect(result.condensedGraph.nodeCount).toBe(2);
            expect(result.condensedGraph.totalEdgeCount).toBe(1);

            // Check component mapping
            expect(result.componentMap.get("a")).toBeDefined();
            expect(result.componentMap.get("b")).toBeDefined();
            expect(result.componentMap.get("c")).toBeDefined();
            expect(result.componentMap.get("d")).toBeDefined();
        });

        it("should handle single SCC", () => {
            const graph = new Graph({directed: true});

            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = condensationGraph(graph);

            expect(result.components).toHaveLength(1);
            expect(result.condensedGraph.nodeCount).toBe(1);
            expect(result.condensedGraph.totalEdgeCount).toBe(0);
        });

        it("should throw error for undirected graph", () => {
            const graph = new Graph();

            graph.addEdge("a", "b");

            expect(() => condensationGraph(graph)).toThrow("Condensation graph requires a directed graph");
        });
    });

    describe("edge cases", () => {
        it("should handle graphs with self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});

            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const components = connectedComponents(graph);

            expect(components).toHaveLength(1);
            expect(components[0].sort()).toEqual(["a", "b"]);
        });

        it("should handle large graphs efficiently", () => {
            const graph = new Graph();
            const nodeCount = 1000;

            // Create a path graph
            for (let i = 0; i < nodeCount - 1; i++) {
                graph.addEdge(i, i + 1);
            }

            const components = connectedComponents(graph);

            expect(components).toHaveLength(1);
            expect(components[0]).toHaveLength(nodeCount);
        });

        it("should handle mixed node ID types", () => {
            const graph = new Graph();

            graph.addEdge("string", 123);
            graph.addEdge(123, "another");

            const components = connectedComponents(graph);

            expect(components).toHaveLength(1);
            expect(components[0]).toHaveLength(3);
        });
    });
});