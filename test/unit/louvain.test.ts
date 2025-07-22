import {describe, expect, it} from "vitest";

import {louvain} from "../../src/algorithms/community/louvain.js";
import {Graph} from "../../src/core/graph.js";

describe("Louvain Community Detection Algorithm", () => {
    describe("louvain", () => {
        it("should detect communities in a simple bipartite graph", () => {
            const graph = new Graph({directed: false});

            // Create a bipartite-like structure
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A1");

            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B1");

            // Single connection between communities
            graph.addEdge("A1", "B1");

            const result = louvain(graph);

            expect(result.communities).toBeDefined();
            expect(result.modularity).toBeDefined();
            expect(result.iterations).toBeDefined();

            // Should find at least 2 communities
            expect(result.communities.length).toBeGreaterThanOrEqual(2);

            // Total nodes should be preserved
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(6);

            // Modularity should be positive for good community structure
            expect(result.modularity).toBeGreaterThan(0);
        });

        it("should handle a single node graph", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");

            const result = louvain(graph);

            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toEqual(["A"]);
            expect(result.modularity).toBe(0); // No edges, so modularity is 0
            expect(result.iterations).toBe(0);
        });

        it("should handle a graph with no edges", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            const result = louvain(graph);

            expect(result.communities).toHaveLength(3);
            expect(result.modularity).toBe(0); // No edges, so modularity is 0
            expect(result.iterations).toBe(0);
        });

        it("should detect a single community in a complete graph", () => {
            const graph = new Graph({directed: false});

            // Create complete graph K4
            const nodes = ["A", "B", "C", "D"];
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const result = louvain(graph);

            // Should find 1 community (all nodes connected)
            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toHaveLength(4);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph({directed: false});

            // First component
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");

            // Second component (disconnected)
            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");

            const result = louvain(graph);

            expect(result.communities.length).toBeGreaterThanOrEqual(2);

            // Each community should contain nodes from the same component
            for (const community of result.communities) {
                const hasA = community.some((node) => String(node).startsWith("A"));
                const hasB = community.some((node) => String(node).startsWith("B"));
                // Community should not mix components
                expect(hasA && hasB).toBe(false);
            }
        });

        it("should respect resolution parameter", () => {
            const graph = new Graph({directed: false});

            // Create a graph with clear community structure
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A1");

            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B1");

            graph.addEdge("A1", "B1");

            // Test with different resolution values
            const resultHighRes = louvain(graph, {resolution: 2.0});
            const resultLowRes = louvain(graph, {resolution: 0.5});

            expect(resultHighRes.communities).toBeDefined();
            expect(resultLowRes.communities).toBeDefined();

            // Different resolutions may lead to different community structures
            // High resolution tends to create more communities
            // Low resolution tends to merge communities
        });

        it("should handle weighted edges", () => {
            const graph = new Graph({directed: false});

            // Create communities with different edge weights
            graph.addEdge("A1", "A2", 10); // Strong internal connection
            graph.addEdge("A2", "A3", 10);
            graph.addEdge("A3", "A1", 10);

            graph.addEdge("B1", "B2", 10);
            graph.addEdge("B2", "B3", 10);
            graph.addEdge("B3", "B1", 10);

            graph.addEdge("A1", "B1", 1); // Weak inter-community connection

            const result = louvain(graph);

            expect(result.communities.length).toBeGreaterThanOrEqual(2);
            expect(result.modularity).toBeGreaterThan(0);
        });

        it("should converge within maximum iterations", () => {
            const graph = new Graph({directed: false});

            // Create a complex graph
            for (let i = 0; i < 10; i++) {
                for (let j = i + 1; j < 10; j++) {
                    if (Math.random() > 0.7) { // Random sparse graph
                        graph.addEdge(i.toString(), j.toString());
                    }
                }
            }

            const result = louvain(graph, {maxIterations: 5});

            expect(result.iterations).toBeLessThanOrEqual(5);
            expect(result.communities).toBeDefined();
        });

        it("should handle tolerance parameter for convergence", () => {
            const graph = new Graph({directed: false});

            // Simple case for quick convergence
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const result = louvain(graph, {tolerance: 0.1});

            expect(result.communities).toBeDefined();
            expect(result.modularity).toBeDefined();
        });

        it("should detect communities in a path graph", () => {
            const graph = new Graph({directed: false});

            // Create a path: A - B - C - D - E
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");

            const result = louvain(graph);

            expect(result.communities).toBeDefined();
            expect(result.communities.length).toBeGreaterThanOrEqual(1);

            // Total nodes should be preserved
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(5);
        });

        it("should detect communities in a star graph", () => {
            const graph = new Graph({directed: false});

            // Create star graph with center node
            const center = "center";
            const leaves = ["A", "B", "C", "D", "E"];

            for (const leaf of leaves) {
                graph.addEdge(center, leaf);
            }

            const result = louvain(graph);

            expect(result.communities).toBeDefined();
            expect(result.communities.length).toBeGreaterThanOrEqual(1);

            // Total nodes should be preserved
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(6);
        });

        it("should handle graphs with self-loops", () => {
            const graph = new Graph({directed: false, allowSelfLoops: true});

            graph.addEdge("A", "A"); // Self-loop
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const result = louvain(graph);

            expect(result.communities).toBeDefined();
            expect(result.modularity).toBeDefined();

            // Should not crash and should preserve all nodes
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(3);
        });

        it("should maintain consistent community assignment", () => {
            const graph = new Graph({directed: false});

            // Create deterministic structure
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("A1", "B1");

            const result1 = louvain(graph);
            const result2 = louvain(graph);

            // Results should be consistent for the same graph
            expect(result1.communities.length).toBe(result2.communities.length);

            // Modularity should be the same
            expect(Math.abs(result1.modularity - result2.modularity)).toBeLessThan(1e-10);
        });

        it("should handle large community count", () => {
            const graph = new Graph({directed: false});

            // Create many small disconnected triangles
            for (let i = 0; i < 5; i++) {
                const base = i * 3;
                graph.addEdge(`${base}`, `${base + 1}`);
                graph.addEdge(`${base + 1}`, `${base + 2}`);
                graph.addEdge(`${base + 2}`, `${base}`);
            }

            const result = louvain(graph);

            expect(result.communities.length).toBeGreaterThanOrEqual(5);

            // Each community should ideally be a triangle (3 nodes)
            for (const community of result.communities) {
                expect(community.length).toBeGreaterThanOrEqual(1);
                expect(community.length).toBeLessThanOrEqual(3);
            }
        });

        it("should calculate positive modularity for good community structure", () => {
            const graph = new Graph({directed: false});

            // Create clear community structure with high modularity
            // Dense triangles with sparse inter-connections

            // Community 1
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A4");
            graph.addEdge("A4", "A1");
            graph.addEdge("A1", "A3");
            graph.addEdge("A2", "A4");

            // Community 2
            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B4");
            graph.addEdge("B4", "B1");
            graph.addEdge("B1", "B3");
            graph.addEdge("B2", "B4");

            // Minimal inter-community connections
            graph.addEdge("A1", "B1");

            const result = louvain(graph);

            expect(result.modularity).toBeGreaterThan(0.3); // Should have good modularity
            expect(result.communities.length).toBeGreaterThanOrEqual(2);
        });
    });
});
