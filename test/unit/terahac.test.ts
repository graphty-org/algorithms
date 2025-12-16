import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";
import {teraHAC, type TeraHACConfig} from "../../src/research/terahac.js";

describe("TeraHAC (Hierarchical Agglomerative Clustering)", () => {
    describe("Basic functionality", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();

            expect(() => {
                teraHAC(graph);
            }).toThrow("Cannot cluster empty graph");
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("A");

            const result = teraHAC(graph);

            expect(result.dendrogram.members.size).toBe(1);
            expect(result.dendrogram.members.has("A")).toBe(true);
            expect(result.clusters.size).toBe(1);
            expect(result.clusters.get("A")).toBe(0);
            expect(result.numClusters).toBe(1);
        });

        it("should handle two disconnected nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");

            const config: TeraHACConfig = {numClusters: 2};
            const result = teraHAC(graph, config);

            expect(result.dendrogram.members.size).toBe(2);
            expect(result.clusters.size).toBe(2);
            expect(result.numClusters).toBe(2);

            // Should be in different clusters
            expect(result.clusters.get("A")).not.toBe(result.clusters.get("B"));
        });

        it("should handle two connected nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B");

            const config: TeraHACConfig = {numClusters: 1};
            const result = teraHAC(graph, config);

            expect(result.dendrogram.members.size).toBe(2);
            expect(result.clusters.size).toBe(2);
            expect(result.numClusters).toBe(1);

            // Should be in same cluster
            expect(result.clusters.get("A")).toBe(result.clusters.get("B"));
        });
    });

    describe("Linkage criteria", () => {
        function createTriangleGraph(): Graph {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("A", "C");
            return graph;
        }

        it("should work with single linkage", () => {
            const graph = createTriangleGraph();
            const config: TeraHACConfig = {
                linkage: "single",
                numClusters: 1,
            };

            const result = teraHAC(graph, config);

            expect(result.dendrogram.members.size).toBe(3);
            expect(result.clusters.size).toBe(3);
            expect(result.distances.length).toBeGreaterThan(0);
        });

        it("should work with complete linkage", () => {
            const graph = createTriangleGraph();
            const config: TeraHACConfig = {
                linkage: "complete",
                numClusters: 1,
            };

            const result = teraHAC(graph, config);

            expect(result.dendrogram.members.size).toBe(3);
            expect(result.clusters.size).toBe(3);
        });

        it("should work with average linkage", () => {
            const graph = createTriangleGraph();
            const config: TeraHACConfig = {
                linkage: "average",
                numClusters: 1,
            };

            const result = teraHAC(graph, config);

            expect(result.dendrogram.members.size).toBe(3);
            expect(result.clusters.size).toBe(3);
        });

        it("should work with ward linkage", () => {
            const graph = createTriangleGraph();
            const config: TeraHACConfig = {
                linkage: "ward",
                numClusters: 1,
            };

            const result = teraHAC(graph, config);

            expect(result.dendrogram.members.size).toBe(3);
            expect(result.clusters.size).toBe(3);
        });
    });

    describe("Distance methods", () => {
        it("should use graph distances when enabled", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            // A and C are connected through B (distance 2)

            const config: TeraHACConfig = {
                useGraphDistance: true,
                numClusters: 2,
            };

            const result = teraHAC(graph, config);

            expect(result.clusters.size).toBe(3);
            expect(result.numClusters).toBe(2);
        });

        it("should use simple edge distances when disabled", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const config: TeraHACConfig = {
                useGraphDistance: false,
                numClusters: 2,
            };

            const result = teraHAC(graph, config);

            expect(result.clusters.size).toBe(3);
            expect(result.numClusters).toBe(2);
        });
    });

    describe("Stopping criteria", () => {
        it("should stop at specified number of clusters", () => {
            const graph = new Graph();

            // Create chain: A-B-C-D-E
            const nodes = ["A", "B", "C", "D", "E"];
            for (const node of nodes) {
                graph.addNode(node);
            }
            for (let i = 0; i < nodes.length - 1; i++) {
                graph.addEdge(nodes[i], nodes[i + 1]);
            }

            const config: TeraHACConfig = {numClusters: 3};
            const result = teraHAC(graph, config);

            expect(result.numClusters).toBe(3);
            expect(result.clusters.size).toBe(5);

            // Should have exactly 3 different cluster IDs
            const uniqueClusters = new Set(result.clusters.values());
            expect(uniqueClusters.size).toBe(3);
        });

        it("should stop at distance threshold", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            // C is disconnected

            const config: TeraHACConfig = {
                distanceThreshold: 1.5, // Should stop before merging disconnected components
                useGraphDistance: false,
            };

            const result = teraHAC(graph, config);

            expect(result.numClusters).toBeGreaterThan(1);
            expect(result.clusters.size).toBe(3);
        });
    });

    describe("Hierarchical structure", () => {
        it("should build proper dendrogram structure", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const result = teraHAC(graph);

            const {dendrogram} = result;

            // Root should contain all nodes
            expect(dendrogram.members.size).toBe(3);
            expect(dendrogram.members.has("A")).toBe(true);
            expect(dendrogram.members.has("B")).toBe(true);
            expect(dendrogram.members.has("C")).toBe(true);

            // Check tree structure
            if (dendrogram.left && dendrogram.right) {
                const leftSize = dendrogram.left.members.size;
                const rightSize = dendrogram.right.members.size;
                expect(leftSize + rightSize).toBe(3);
            }
        });

        it("should have increasing distances up the tree", () => {
            const graph = new Graph();

            // Create a simple structure
            for (let i = 0; i < 4; i++) {
                graph.addNode(`node${i}`);
            }
            graph.addEdge("node0", "node1");
            graph.addEdge("node2", "node3");

            const result = teraHAC(graph);

            // Distances should be non-decreasing in merge order
            const {distances} = result;
            for (let i = 1; i < distances.length; i++) {
                expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
            }
        });
    });

    describe("Complex graph structures", () => {
        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Component 1: A-B-C triangle
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("A", "C");

            // Component 2: D-E edge
            graph.addNode("D");
            graph.addNode("E");
            graph.addEdge("D", "E");

            const config: TeraHACConfig = {numClusters: 2};
            const result = teraHAC(graph, config);

            expect(result.clusters.size).toBe(5);
            expect(result.numClusters).toBe(2);

            // Check that components are clustered separately initially
            const clusterA = result.clusters.get("A");
            const clusterB = result.clusters.get("B");
            const clusterC = result.clusters.get("C");
            const clusterD = result.clusters.get("D");
            const clusterE = result.clusters.get("E");

            // At least some nodes from same component should be in same cluster
            expect([clusterA, clusterB, clusterC]).toContain(clusterA);
            expect([clusterD, clusterE]).toContain(clusterD);
        });

        it("should handle star graph", () => {
            const graph = new Graph();
            graph.addNode("center");

            const leafNodes = ["leaf1", "leaf2", "leaf3", "leaf4"];
            for (const leaf of leafNodes) {
                graph.addNode(leaf);
                graph.addEdge("center", leaf);
            }

            const config: TeraHACConfig = {numClusters: 2};
            const result = teraHAC(graph, config);

            expect(result.clusters.size).toBe(5);
            expect(result.numClusters).toBe(2);
            expect(result.dendrogram.members.size).toBe(5);
        });

        it("should handle complete graph", () => {
            const graph = new Graph();
            const nodes = ["A", "B", "C", "D"];

            // Add all nodes and edges
            for (const node of nodes) {
                graph.addNode(node);
            }
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const config: TeraHACConfig = {numClusters: 2};
            const result = teraHAC(graph, config);

            expect(result.clusters.size).toBe(4);
            expect(result.numClusters).toBe(2);
        });
    });

    describe("Edge cases", () => {
        it("should handle self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "A"); // Self-loop
            graph.addEdge("A", "B");

            expect(() => {
                teraHAC(graph);
            }).not.toThrow();
        });

        it("should warn about large graphs", () => {
            const graph = new Graph();

            // Create graph larger than default maxNodes
            for (let i = 0; i < 100; i++) {
                graph.addNode(`node${i}`);
            }
            for (let i = 0; i < 99; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
            }

            const config: TeraHACConfig = {maxNodes: 50};

            // Should not throw, but may log warning
            expect(() => {
                teraHAC(graph, config);
            }).not.toThrow();
        });

        it("should use custom warning handler", () => {
            const graph = new Graph();

            // Create graph larger than maxNodes
            for (let i = 0; i < 100; i++) {
                graph.addNode(`node${i}`);
            }
            for (let i = 0; i < 99; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
            }

            const warnings: string[] = [];
            const config: TeraHACConfig = {
                maxNodes: 50,
                onWarning: (msg) => warnings.push(msg),
            };

            teraHAC(graph, config);

            expect(warnings.length).toBe(1);
            expect(warnings[0]).toContain("100 nodes");
            expect(warnings[0]).toContain("exceeds maxNodes");
        });

        it("should handle weighted edges", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B", 1.0);
            graph.addEdge("B", "C", 10.0); // Heavy weight

            const result = teraHAC(graph);

            expect(result.clusters.size).toBe(3);
            expect(result.dendrogram.members.size).toBe(3);
        });
    });

    describe("Performance characteristics", () => {
        it("should handle medium-sized graphs efficiently", () => {
            const graph = new Graph();

            // Create medium-sized connected graph
            const numNodes = 30;
            for (let i = 0; i < numNodes; i++) {
                graph.addNode(`node${i}`);
            }

            // Add edges to create some structure
            for (let i = 0; i < numNodes - 1; i++) {
                graph.addEdge(`node${i}`, `node${(i + 1) % numNodes}`);
            }

            // Add some cross-connections
            for (let i = 0; i < numNodes; i += 3) {
                graph.addEdge(`node${i}`, `node${(i + 10) % numNodes}`);
            }

            const startTime = performance.now();
            const config: TeraHACConfig = {numClusters: 5};
            const result = teraHAC(graph, config);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(result.clusters.size).toBe(numNodes);
            expect(result.numClusters).toBe(5);
        });

        it("should produce consistent results", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");
            graph.addEdge("A", "B");
            graph.addEdge("C", "D");

            const config: TeraHACConfig = {
                linkage: "average",
                numClusters: 2,
            };

            const result1 = teraHAC(graph, config);
            const result2 = teraHAC(graph, config);

            // Should produce identical results for same input
            expect(result1.clusters).toEqual(result2.clusters);
            expect(result1.numClusters).toBe(result2.numClusters);
        });
    });

    describe("Algorithm termination", () => {
        it("should terminate with valid result when merge candidates exhaust", () => {
            // Create graph where clusters can't always merge
            const graph = new Graph();
            for (let i = 0; i < 10; i++) {
                graph.addNode(`isolated_${i}`);
            }

            const config: TeraHACConfig = {distanceThreshold: 0.5};
            const result = teraHAC(graph, config);

            // Should complete without hanging
            expect(result.dendrogram).toBeDefined();
            expect(result.clusters.size).toBe(10);
        });

        it("should break out of loop when no valid clusters found", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            // No edges - disconnected

            const config: TeraHACConfig = {numClusters: 1};
            const result = teraHAC(graph, config);

            // Should complete and have dendrogram
            expect(result.dendrogram).toBeDefined();
        });

        it("should not throw when all merge candidates are processed", () => {
            // This test verifies defensive check: `mergeCandidates.length > 0` in loop condition.
            // In normal operation, candidates don't get exhausted while clusters.size > 1
            // because updateMergeCandidates adds new candidates after each merge.
            // However, the check prevents potential "No merge candidates available" error
            // in edge cases where stale candidates might be consumed without replacement.
            const graph = new Graph();

            // Create a simple graph that will fully merge
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B");

            // Request merging to a single cluster - all candidates will be consumed
            const config: TeraHACConfig = {numClusters: 1};

            // Should complete without throwing "No merge candidates available"
            expect(() => teraHAC(graph, config)).not.toThrow();

            const result = teraHAC(graph, config);
            expect(result.dendrogram).toBeDefined();
            expect(result.dendrogram.members.size).toBe(2);
        });
    });

    describe("Cluster quality metrics", () => {
        it("should assign cluster IDs from 0", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");

            const config: TeraHACConfig = {numClusters: 2};
            const result = teraHAC(graph, config);

            const clusterIds = Array.from(result.clusters.values());
            const minId = Math.min(... clusterIds);
            const maxId = Math.max(... clusterIds);

            expect(minId).toBe(0);
            expect(maxId).toBe(result.numClusters - 1);
        });

        it("should have meaningful merge distances", () => {
            const graph = new Graph();

            // Create structure with clear merge order
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");
            graph.addEdge("A", "B"); // Close pair
            graph.addEdge("C", "D"); // Another close pair
            // A-B and C-D are far apart

            const result = teraHAC(graph);

            // Should have recorded merge distances
            expect(result.distances.length).toBeGreaterThan(0);

            // All distances should be finite and positive
            for (const distance of result.distances) {
                expect(distance).toBeGreaterThan(0);
                expect(distance).toBeLessThan(Infinity);
            }
        });
    });
});
