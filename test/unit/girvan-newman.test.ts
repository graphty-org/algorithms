import {describe, expect, it} from "vitest";

import {girvanNewman} from "../../src/algorithms/community/girvan-newman.js";
import {Graph} from "../../src/core/graph.js";

describe("Girvan-Newman Community Detection Algorithm", () => {
    describe("girvanNewman", () => {
        it("should detect communities in a simple bipartite graph", () => {
            const graph = new Graph({directed: false});

            // Create two triangles connected by a bridge
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A1");

            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B1");

            // Bridge edge (high betweenness)
            graph.addEdge("A1", "B1");

            const results = girvanNewman(graph);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Should form a dendrogram
            expect(results[0].communities).toBeDefined();
            expect(results[0].modularity).toBeDefined();

            // Final result should have separated the triangles
            const finalResult = results[results.length - 1];
            expect(finalResult.communities.length).toBeGreaterThanOrEqual(2);
        });

        it("should handle a single node graph", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");

            const results = girvanNewman(graph);

            expect(results).toHaveLength(1);
            expect(results[0].communities).toHaveLength(1);
            expect(results[0].communities[0]).toEqual(["A"]);
            expect(results[0].modularity).toBe(0);
        });

        it("should handle a graph with no edges", () => {
            const graph = new Graph({directed: false});
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");

            const results = girvanNewman(graph);

            expect(results).toHaveLength(1);
            expect(results[0].communities).toHaveLength(3);
            expect(results[0].modularity).toBe(0);
        });

        it("should produce a dendrogram showing hierarchical community structure", () => {
            const graph = new Graph({directed: false});

            // Create a graph with clear hierarchical structure
            // Two pairs connected to a central hub
            graph.addEdge("A1", "A2"); // First pair
            graph.addEdge("B1", "B2"); // Second pair
            graph.addEdge("hub", "A1");
            graph.addEdge("hub", "B1");

            const results = girvanNewman(graph);

            expect(results.length).toBeGreaterThan(1);

            // Should start with fewer communities and end with more
            expect(results[0].communities.length).toBeLessThanOrEqual(results[results.length - 1].communities.length);

            // Each step should have valid community structure
            for (const result of results) {
                expect(result.communities).toBeDefined();
                expect(result.modularity).toBeDefined();

                // All nodes should be accounted for
                const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
                expect(totalNodes).toBe(5);
            }
        });

        it("should handle disconnected components", () => {
            const graph = new Graph({directed: false});

            // Two disconnected triangles
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A1");

            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B1");

            const results = girvanNewman(graph);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Should immediately recognize disconnected components
            expect(results[0].communities.length).toBe(2);

            // Each community should contain nodes from the same component
            for (const result of results) {
                for (const community of result.communities) {
                    const hasA = community.some((node) => String(node).startsWith("A"));
                    const hasB = community.some((node) => String(node).startsWith("B"));
                    expect(hasA && hasB).toBe(false);
                }
            }
        });

        it("should respect maxCommunities parameter", () => {
            const graph = new Graph({directed: false});

            // Create a path graph that can be split into many communities
            const nodes = ["A", "B", "C", "D", "E", "F"];
            for (let i = 0; i < nodes.length - 1; i++) {
                graph.addEdge(nodes[i], nodes[i + 1]);
            }

            const results = girvanNewman(graph, {maxCommunities: 3});

            // Should stop when 3 communities are reached or when no more edges can be removed
            expect(results[results.length - 1].communities.length).toBeGreaterThanOrEqual(3);
        });

        it("should respect minCommunitySize parameter", () => {
            const graph = new Graph({directed: false});

            // Create a graph where small communities might form
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");

            const results = girvanNewman(graph, {minCommunitySize: 2});

            // All communities should have at least 2 nodes
            for (const result of results) {
                for (const community of result.communities) {
                    expect(community.length).toBeGreaterThanOrEqual(2);
                }
            }
        });

        it("should handle weighted edges", () => {
            const graph = new Graph({directed: false});

            // Create structure with different edge weights
            graph.addEdge("A1", "A2", 10); // Strong internal connections
            graph.addEdge("A2", "A3", 10);
            graph.addEdge("A3", "A1", 10);

            graph.addEdge("B1", "B2", 10);
            graph.addEdge("B2", "B3", 10);
            graph.addEdge("B3", "B1", 10);

            graph.addEdge("A1", "B1", 1); // Weak bridge (should be removed first)

            const results = girvanNewman(graph);

            expect(results.length).toBeGreaterThan(1);

            // Should eventually separate into two triangular communities
            const finalResult = results[results.length - 1];
            expect(finalResult.communities.length).toBeGreaterThanOrEqual(2);
        });

        it("should calculate modularity correctly at each step", () => {
            const graph = new Graph({directed: false});

            // Create a clear community structure
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A1");

            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B1");

            graph.addEdge("A1", "B1");

            const results = girvanNewman(graph);

            // Modularity should be defined for each step
            for (const result of results) {
                expect(result.modularity).toBeDefined();
                expect(typeof result.modularity).toBe("number");
                expect(isFinite(result.modularity)).toBe(true);
            }
        });

        it("should handle complete graphs", () => {
            const graph = new Graph({directed: false});

            // Create complete graph K4
            const nodes = ["A", "B", "C", "D"];
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const results = girvanNewman(graph);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Should eventually split the complete graph
            expect(results[results.length - 1].communities.length).toBeGreaterThan(1);
        });

        it("should handle star graphs", () => {
            const graph = new Graph({directed: false});

            // Create star graph with center node
            const center = "center";
            const leaves = ["A", "B", "C", "D"];

            for (const leaf of leaves) {
                graph.addEdge(center, leaf);
            }

            const results = girvanNewman(graph);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Should preserve all nodes
            for (const result of results) {
                const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
                expect(totalNodes).toBe(5);
            }
        });

        it("should handle path graphs", () => {
            const graph = new Graph({directed: false});

            // Create a path: A - B - C - D - E
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "D");
            graph.addEdge("D", "E");

            const results = girvanNewman(graph);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Should gradually break the path into smaller components
            expect(results[results.length - 1].communities.length).toBeGreaterThan(1);
        });

        it("should handle graphs with bridges", () => {
            const graph = new Graph({directed: false});

            // Create two clusters connected by a bridge
            // Cluster 1
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A4");
            graph.addEdge("A4", "A1");

            // Cluster 2
            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B4");
            graph.addEdge("B4", "B1");

            // Bridge (should have highest betweenness)
            graph.addEdge("A1", "B1");

            const results = girvanNewman(graph);

            expect(results.length).toBeGreaterThan(1);

            // Should separate the clusters by removing the bridge
            const finalResult = results.find((r) => r.communities.length >= 2);
            expect(finalResult).toBeDefined();
        });

        it("should handle self-loops gracefully", () => {
            const graph = new Graph({directed: false, allowSelfLoops: true});

            graph.addEdge("A", "A"); // Self-loop
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const results = girvanNewman(graph);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);

            // Should not crash and should preserve all nodes
            for (const result of results) {
                const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
                expect(totalNodes).toBe(3);
            }
        });

        it("should produce meaningful community evolution", () => {
            const graph = new Graph({directed: false});

            // Create a barbell graph (two cliques connected by a path)
            // First clique
            graph.addEdge("A1", "A2");
            graph.addEdge("A2", "A3");
            graph.addEdge("A3", "A1");

            // Bridge nodes
            graph.addEdge("A1", "bridge1");
            graph.addEdge("bridge1", "bridge2");
            graph.addEdge("bridge2", "B1");

            // Second clique
            graph.addEdge("B1", "B2");
            graph.addEdge("B2", "B3");
            graph.addEdge("B3", "B1");

            const results = girvanNewman(graph);

            expect(results.length).toBeGreaterThan(1);

            // Should start with one community and end with multiple
            expect(results[0].communities.length).toBeLessThan(results[results.length - 1].communities.length);

            // Should eventually separate the cliques
            const finalResult = results[results.length - 1];
            expect(finalResult.communities.length).toBeGreaterThanOrEqual(2);
        });

        it("should handle empty graphs", () => {
            const graph = new Graph({directed: false});

            const results = girvanNewman(graph);

            expect(results).toHaveLength(1);
            expect(results[0].communities).toHaveLength(0);
            expect(results[0].modularity).toBe(0);
        });

        it("should maintain numerical stability with small weights", () => {
            const graph = new Graph({directed: false});

            graph.addEdge("A", "B", 0.001);
            graph.addEdge("B", "C", 0.001);
            graph.addEdge("C", "D", 0.001);

            const results = girvanNewman(graph);

            expect(results).toBeDefined();

            // Should handle small weights without numerical issues
            for (const result of results) {
                expect(isFinite(result.modularity)).toBe(true);
                expect(result.communities).toBeDefined();
            }
        });

        it("should handle large edge weights", () => {
            const graph = new Graph({directed: false});

            graph.addEdge("A", "B", 1000);
            graph.addEdge("B", "C", 1000);
            graph.addEdge("C", "D", 1000);

            const results = girvanNewman(graph);

            expect(results).toBeDefined();

            // Should handle large weights without overflow
            for (const result of results) {
                expect(isFinite(result.modularity)).toBe(true);
                expect(result.communities).toBeDefined();
            }
        });
    });
});
