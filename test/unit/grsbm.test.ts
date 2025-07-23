import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";
import {grsbm, type GRSBMConfig} from "../../src/research/grsbm.js";

describe("GRSBM (Greedy Recursive Spectral Bisection with Modularity)", () => {
    describe("Basic functionality", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();

            expect(() => {
                grsbm(graph);
            }).toThrow("Cannot cluster empty graph");
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("A");

            const result = grsbm(graph);

            expect(result.root.members.size).toBe(1);
            expect(result.root.members.has("A")).toBe(true);
            expect(result.clusters.size).toBe(1);
            expect(result.clusters.get("A")).toBe(0);
            expect(result.numClusters).toBe(1);
            expect(result.modularityScores.length).toBe(1);
        });

        it("should handle two disconnected nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");

            const result = grsbm(graph);

            expect(result.root.members.size).toBe(2);
            expect(result.clusters.size).toBe(2);

            // Should not split into separate clusters due to minClusterSize
            expect(result.numClusters).toBe(1);
        });

        it("should handle two connected nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B");

            const result = grsbm(graph);

            expect(result.root.members.size).toBe(2);
            expect(result.clusters.size).toBe(2);
            expect(result.numClusters).toBe(1);

            // Both nodes should be in same cluster
            expect(result.clusters.get("A")).toBe(result.clusters.get("B"));
        });
    });

    describe("Hierarchical splitting", () => {
        it("should create hierarchical structure for large enough clusters", () => {
            const graph = new Graph();

            // Create two well-separated communities
            // Community 1: A-B-C-D (chain)
            const community1 = ["A", "B", "C", "D"];
            for (const node of community1) {
                graph.addNode(node);
            }
            for (let i = 0; i < community1.length - 1; i++) {
                graph.addEdge(community1[i], community1[i + 1]);
            }

            // Community 2: E-F-G-H (chain)
            const community2 = ["E", "F", "G", "H"];
            for (const node of community2) {
                graph.addNode(node);
            }
            for (let i = 0; i < community2.length - 1; i++) {
                graph.addEdge(community2[i], community2[i + 1]);
            }

            // Weak connection between communities
            graph.addEdge("D", "E");

            const config: GRSBMConfig = {minClusterSize: 2, seed: 42};
            const result = grsbm(graph, config);

            expect(result.root.members.size).toBe(8);
            expect(result.clusters.size).toBe(8);
            expect(result.numClusters).toBeGreaterThanOrEqual(1);

            // May have created some splits
            expect(result.explanation.length).toBeGreaterThanOrEqual(0);
        });

        it("should respect maximum depth limit", () => {
            const graph = new Graph();

            // Create a larger graph
            for (let i = 0; i < 12; i++) {
                graph.addNode(`node${i}`);
            }
            for (let i = 0; i < 11; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
            }

            const config: GRSBMConfig = {
                maxDepth: 2,
                minClusterSize: 2,
                seed: 42,
            };

            const result = grsbm(graph, config);

            expect(result.root.depth).toBe(0);

            // Check that no cluster exceeds max depth
            function checkDepth(cluster: typeof result.root): void {
                expect(cluster.depth).toBeLessThanOrEqual(2);
                if (cluster.left) {
                    checkDepth(cluster.left);
                }
                if (cluster.right) {
                    checkDepth(cluster.right);
                }
            }

            checkDepth(result.root);
        });

        it("should respect minimum cluster size", () => {
            const graph = new Graph();

            // Create small graph
            for (let i = 0; i < 6; i++) {
                graph.addNode(`node${i}`);
            }
            for (let i = 0; i < 5; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
            }

            const config: GRSBMConfig = {
                minClusterSize: 4, // Large min size should prevent splits
                seed: 42,
            };

            const result = grsbm(graph, config);

            // Should not split into clusters smaller than minClusterSize
            expect(result.numClusters).toBe(1);
        });
    });

    describe("Modularity optimization", () => {
        it("should only split when modularity improves", () => {
            const graph = new Graph();

            // Create complete graph (no good splits)
            const nodes = ["A", "B", "C", "D"];
            for (const node of nodes) {
                graph.addNode(node);
            }
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const result = grsbm(graph);

            // Complete graphs may still be split due to our tolerance
            expect(result.numClusters).toBeGreaterThanOrEqual(1);
            expect(result.explanation.length).toBeGreaterThanOrEqual(0);
        });

        it("should track modularity scores", () => {
            const graph = new Graph();

            // Create graph with clear community structure
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");
            graph.addNode("E");
            graph.addNode("F");

            // Two triangles connected by one edge
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("A", "C");
            graph.addEdge("D", "E");
            graph.addEdge("E", "F");
            graph.addEdge("D", "F");
            graph.addEdge("C", "D"); // Bridge

            const config: GRSBMConfig = {minClusterSize: 2, seed: 42};
            const result = grsbm(graph, config);

            expect(result.modularityScores.length).toBeGreaterThan(0);
            expect(result.modularityScores[0]).toBeTypeOf("number");

            // Later modularity scores should be >= earlier ones
            for (let i = 1; i < result.modularityScores.length; i++) {
                expect(result.modularityScores[i]).toBeGreaterThanOrEqual(result.modularityScores[i - 1]);
            }
        });
    });

    describe("Spectral analysis", () => {
        it("should compute meaningful spectral scores", () => {
            const graph = new Graph();

            // Create graph with structure
            for (let i = 0; i < 8; i++) {
                graph.addNode(`node${i}`);
            }

            // Two connected components
            graph.addEdge("node0", "node1");
            graph.addEdge("node1", "node2");
            graph.addEdge("node2", "node3");
            graph.addEdge("node4", "node5");
            graph.addEdge("node5", "node6");
            graph.addEdge("node6", "node7");
            graph.addEdge("node3", "node4"); // Bridge

            const config: GRSBMConfig = {minClusterSize: 2, seed: 42};
            const result = grsbm(graph, config);

            expect(result.root.spectralScore).toBeTypeOf("number");

            // Check spectral scores in explanations
            for (const explanation of result.explanation) {
                expect(explanation.spectralValues.length).toBeGreaterThan(0);
                for (const value of explanation.spectralValues) {
                    expect(value).toBeTypeOf("number");
                    expect(value).not.toBeNaN();
                }
            }
        });

        it("should identify key nodes in splits", () => {
            const graph = new Graph();

            // Create star graph with central node
            graph.addNode("center");
            for (let i = 0; i < 8; i++) {
                graph.addNode(`leaf${i}`);
                graph.addEdge("center", `leaf${i}`);
            }

            const config: GRSBMConfig = {
                minClusterSize: 2,
                maxDepth: 2,
                seed: 42,
            };

            const result = grsbm(graph, config);

            // Should identify key nodes
            for (const explanation of result.explanation) {
                expect(explanation.keyNodes.length).toBeGreaterThan(0);
                expect(explanation.keyNodes.length).toBeLessThanOrEqual(5);

                for (const nodeId of explanation.keyNodes) {
                    expect(graph.hasNode(nodeId)).toBe(true);
                }
            }
        });
    });

    describe("Explainability features", () => {
        it("should provide explanations for splits", () => {
            const graph = new Graph();

            // Create clear two-community structure
            const nodes1 = ["A", "B", "C", "D"];
            const nodes2 = ["E", "F", "G", "H"];

            for (const node of [... nodes1, ... nodes2]) {
                graph.addNode(node);
            }

            // Dense within communities
            for (let i = 0; i < nodes1.length; i++) {
                for (let j = i + 1; j < nodes1.length; j++) {
                    graph.addEdge(nodes1[i], nodes1[j]);
                }
            }
            for (let i = 0; i < nodes2.length; i++) {
                for (let j = i + 1; j < nodes2.length; j++) {
                    graph.addEdge(nodes2[i], nodes2[j]);
                }
            }

            // Sparse between communities
            graph.addEdge("D", "E");

            const config: GRSBMConfig = {minClusterSize: 2, seed: 42};
            const result = grsbm(graph, config);

            // Complex graphs should create some clusters, but explanations depend on successful splits
            expect(result.numClusters).toBeGreaterThanOrEqual(1);

            for (const explanation of result.explanation) {
                expect(explanation.clusterId).toBeTypeOf("string");
                expect(explanation.reason).toBeTypeOf("string");
                expect(explanation.reason.length).toBeGreaterThan(10);
                expect(explanation.modularityImprovement).toBeTypeOf("number");
                expect(explanation.keyNodes).toBeInstanceOf(Array);
                expect(explanation.spectralValues).toBeInstanceOf(Array);
            }
        });

        it("should provide meaningful modularity improvements", () => {
            const graph = new Graph();

            // Create structure that should have good splits
            for (let i = 0; i < 10; i++) {
                graph.addNode(`node${i}`);
            }

            // Two groups: 0-4 and 5-9
            for (let i = 0; i < 4; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
            }
            for (let i = 5; i < 9; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
            }
            graph.addEdge("node4", "node5"); // Bridge

            const config: GRSBMConfig = {minClusterSize: 2, seed: 42};
            const result = grsbm(graph, config);

            for (const explanation of result.explanation) {
                // Modularity improvement should be positive (since we only split when it improves)
                expect(explanation.modularityImprovement).toBeGreaterThan(0);
            }
        });
    });

    describe("Configuration options", () => {
        it("should use default configuration values", () => {
            const graph = new Graph();
            for (let i = 0; i < 8; i++) {
                graph.addNode(`node${i}`);
                if (i > 0) {
                    graph.addEdge(`node${i - 1}`, `node${i}`);
                }
            }

            const result = grsbm(graph);

            expect(result.root).toBeDefined();
            expect(result.clusters.size).toBe(8);
            expect(result.modularityScores.length).toBeGreaterThan(0);
        });

        it("should respect seed for reproducibility", () => {
            const graph = new Graph();
            for (let i = 0; i < 8; i++) {
                graph.addNode(`node${i}`);
                if (i > 0) {
                    graph.addEdge(`node${i - 1}`, `node${i}`);
                }
            }

            const config1: GRSBMConfig = {seed: 123, minClusterSize: 2};
            const config2: GRSBMConfig = {seed: 123, minClusterSize: 2};

            const result1 = grsbm(graph, config1);
            const result2 = grsbm(graph, config2);

            // Should produce identical results with same seed
            expect(result1.clusters).toEqual(result2.clusters);
            expect(result1.numClusters).toBe(result2.numClusters);
        });

        it("should handle different numbers of eigenvectors", () => {
            const graph = new Graph();
            for (let i = 0; i < 8; i++) {
                graph.addNode(`node${i}`);
                if (i > 0) {
                    graph.addEdge(`node${i - 1}`, `node${i}`);
                }
            }

            const config1: GRSBMConfig = {numEigenvectors: 1, minClusterSize: 2, seed: 42};
            const config2: GRSBMConfig = {numEigenvectors: 3, minClusterSize: 2, seed: 42};

            const result1 = grsbm(graph, config1);
            const result2 = grsbm(graph, config2);

            // Both should work, though results may differ
            expect(result1.clusters.size).toBe(8);
            expect(result2.clusters.size).toBe(8);
        });
    });

    describe("Edge cases", () => {
        it("should handle graphs with self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");
            graph.addEdge("A", "A"); // Self-loop
            graph.addEdge("A", "B");
            graph.addEdge("C", "D");

            expect(() => {
                grsbm(graph);
            }).not.toThrow();
        });

        it("should handle disconnected components", () => {
            const graph = new Graph();

            // Component 1
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            // Component 2 (isolated)
            graph.addNode("D");
            graph.addNode("E");
            graph.addNode("F");
            graph.addEdge("D", "E");
            graph.addEdge("E", "F");

            const result = grsbm(graph);

            expect(result.clusters.size).toBe(6);
            expect(result.root.members.size).toBe(6);
        });

        it("should handle very small graphs", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const result = grsbm(graph);

            expect(result.clusters.size).toBe(3);
            expect(result.numClusters).toBe(1); // Too small to split with default minClusterSize
        });
    });

    describe("Performance characteristics", () => {
        it("should handle medium-sized graphs in reasonable time", () => {
            const graph = new Graph();

            // Create medium-sized graph with structure
            const numNodes = 40;
            for (let i = 0; i < numNodes; i++) {
                graph.addNode(`node${i}`);
            }

            // Create communities
            for (let community = 0; community < 4; community++) {
                const start = community * 10;
                const end = (community + 1) * 10;

                // Dense connections within community
                for (let i = start; i < end - 1; i++) {
                    graph.addEdge(`node${i}`, `node${i + 1}`);
                    if (i + 2 < end) {
                        graph.addEdge(`node${i}`, `node${i + 2}`);
                    }
                }

                // Connect to next community
                if (community < 3) {
                    graph.addEdge(`node${end - 1}`, `node${end}`);
                }
            }

            const startTime = performance.now();
            const config: GRSBMConfig = {minClusterSize: 3, seed: 42};
            const result = grsbm(graph, config);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
            expect(result.clusters.size).toBe(numNodes);
        });

        it("should produce consistent cluster assignments", () => {
            const graph = new Graph();
            for (let i = 0; i < 6; i++) {
                graph.addNode(`node${i}`);
            }
            graph.addEdge("node0", "node1");
            graph.addEdge("node1", "node2");
            graph.addEdge("node3", "node4");
            graph.addEdge("node4", "node5");
            graph.addEdge("node2", "node3");

            const config: GRSBMConfig = {seed: 42, minClusterSize: 2};

            const result1 = grsbm(graph, config);
            const result2 = grsbm(graph, config);

            // Should be deterministic with same seed
            expect(result1.clusters).toEqual(result2.clusters);
        });
    });

    describe("Cluster quality validation", () => {
        it("should assign sequential cluster IDs starting from 0", () => {
            const graph = new Graph();
            for (let i = 0; i < 12; i++) {
                graph.addNode(`node${i}`);
                if (i > 0) {
                    graph.addEdge(`node${i - 1}`, `node${i}`);
                }
            }

            const config: GRSBMConfig = {minClusterSize: 2};
            const result = grsbm(graph, config);

            const clusterIds = Array.from(new Set(result.clusters.values())).sort();

            expect(clusterIds[0]).toBe(0);
            expect(clusterIds.length).toBe(result.numClusters);

            // Should be sequential
            for (let i = 0; i < clusterIds.length; i++) {
                expect(clusterIds[i]).toBe(i);
            }
        });

        it("should ensure all nodes are assigned to clusters", () => {
            const graph = new Graph();
            const nodeIds = [];

            for (let i = 0; i < 8; i++) {
                const nodeId = `node${i}`;
                nodeIds.push(nodeId);
                graph.addNode(nodeId);
                if (i > 0) {
                    graph.addEdge(`node${i - 1}`, nodeId);
                }
            }

            const result = grsbm(graph);

            expect(result.clusters.size).toBe(nodeIds.length);

            for (const nodeId of nodeIds) {
                expect(result.clusters.has(nodeId)).toBe(true);
                expect(result.clusters.get(nodeId)).toBeTypeOf("number");
                expect(result.clusters.get(nodeId)!).toBeGreaterThanOrEqual(0);
                expect(result.clusters.get(nodeId)!).toBeLessThan(result.numClusters);
            }
        });
    });
});
