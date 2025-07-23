import {describe, expect, it} from "vitest";

import {Graph} from "../../src/core/graph.js";
import {syncClustering, type SynCConfig} from "../../src/research/sync.js";

describe("SynC (Synergistic Deep Graph Clustering)", () => {
    describe("Basic functionality", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();
            const config: SynCConfig = {numClusters: 1};

            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(0);
            expect(result.embeddings.size).toBe(0);
            expect(result.converged).toBe(true);
            expect(result.loss).toBe(0);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("A");
            const config: SynCConfig = {numClusters: 1};

            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(1);
            expect(result.clusters.get("A")).toBe(0);
            expect(result.embeddings.size).toBe(1);
            expect(result.converged).toBe(true);
        });

        it("should validate number of clusters", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");

            // Invalid: 0 clusters
            expect(() => {
                syncClustering(graph, {numClusters: 0});
            }).toThrow("Invalid number of clusters");

            // Invalid: more clusters than nodes
            expect(() => {
                syncClustering(graph, {numClusters: 3});
            }).toThrow("Invalid number of clusters");
        });
    });

    describe("Clustering quality", () => {
        it("should cluster simple disconnected components", () => {
            const graph = new Graph();

            // Component 1: A-B-C
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            // Component 2: D-E-F
            graph.addNode("D");
            graph.addNode("E");
            graph.addNode("F");
            graph.addEdge("D", "E");
            graph.addEdge("E", "F");

            const config: SynCConfig = {numClusters: 2, seed: 42};
            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(6);

            // Check that we have 2 clusters
            const clusterA = result.clusters.get("A");
            const clusterB = result.clusters.get("B");
            const clusterC = result.clusters.get("C");
            const clusterD = result.clusters.get("D");
            const clusterE = result.clusters.get("E");
            const clusterF = result.clusters.get("F");

            // Should have created 2 clusters
            const uniqueClusters = new Set([clusterA, clusterB, clusterC, clusterD, clusterE, clusterF]);
            expect(uniqueClusters.size).toBe(2);
        });

        it("should produce different embeddings for different nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");

            const config: SynCConfig = {numClusters: 2, seed: 42};
            const result = syncClustering(graph, config);

            const embeddingA = result.embeddings.get("A")!;
            const embeddingB = result.embeddings.get("B")!;
            const embeddingC = result.embeddings.get("C")!;

            expect(embeddingA).not.toEqual(embeddingB);
            expect(embeddingB).not.toEqual(embeddingC);
            expect(embeddingA).not.toEqual(embeddingC);
        });

        it("should respect seed for reproducibility", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addNode("D");
            graph.addEdge("A", "B");
            graph.addEdge("C", "D");

            const config1: SynCConfig = {numClusters: 2, seed: 123};
            const config2: SynCConfig = {numClusters: 2, seed: 123};

            const result1 = syncClustering(graph, config1);
            const result2 = syncClustering(graph, config2);

            // Should produce identical results with same seed
            expect(result1.clusters).toEqual(result2.clusters);
            expect(result1.loss).toBeCloseTo(result2.loss, 5);
        });
    });

    describe("Configuration options", () => {
        it("should use default configuration values", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");

            const result = syncClustering(graph, {numClusters: 2});

            expect(result.iterations).toBeGreaterThan(0);
            expect(result.iterations).toBeLessThanOrEqual(100); // default maxIterations
            expect(result.loss).toBeTypeOf("number");
        });

        it("should respect maxIterations limit", () => {
            const graph = new Graph();
            for (let i = 0; i < 10; i++) {
                graph.addNode(`node${i}`);
                if (i > 0) {
                    graph.addEdge(`node${i - 1}`, `node${i}`);
                }
            }

            const config: SynCConfig = {
                numClusters: 3,
                maxIterations: 5,
                tolerance: 0, // Prevent early convergence
            };

            const result = syncClustering(graph, config);

            expect(result.iterations).toBeLessThanOrEqual(6); // Allow one extra iteration
        });

        it("should converge with high tolerance", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");

            const config: SynCConfig = {
                numClusters: 2,
                tolerance: 1e-1, // High tolerance for quick convergence
                seed: 42,
            };

            const result = syncClustering(graph, config);

            expect(result.converged).toBe(true);
            expect(result.iterations).toBeGreaterThan(0);
        });

        it("should handle different learning rates", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            const config1: SynCConfig = {numClusters: 2, learningRate: 0.001, seed: 42};
            const config2: SynCConfig = {numClusters: 2, learningRate: 0.1, seed: 42};

            const result1 = syncClustering(graph, config1);
            const result2 = syncClustering(graph, config2);

            // Different learning rates may affect convergence (but not guaranteed)
            expect(result1.iterations).toBeGreaterThan(0);
            expect(result2.iterations).toBeGreaterThan(0);
        });
    });

    describe("Complex graph structures", () => {
        it("should handle star graph", () => {
            const graph = new Graph();
            graph.addNode("center");

            for (let i = 0; i < 6; i++) {
                const leafNode = `leaf${i}`;
                graph.addNode(leafNode);
                graph.addEdge("center", leafNode);
            }

            const config: SynCConfig = {numClusters: 2, seed: 42};
            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(7);
            expect(result.embeddings.size).toBe(7);

            // Center node should have different embedding from leaf nodes
            const centerEmbedding = result.embeddings.get("center")!;
            const leaf0Embedding = result.embeddings.get("leaf0")!;

            expect(centerEmbedding).not.toEqual(leaf0Embedding);
        });

        it("should handle complete graph", () => {
            const graph = new Graph();
            const nodes = ["A", "B", "C", "D"];

            // Add all nodes
            for (const node of nodes) {
                graph.addNode(node);
            }

            // Add all possible edges
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const config: SynCConfig = {numClusters: 2, seed: 42};
            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(4);
            expect(result.embeddings.size).toBe(4);
            expect(result.loss).toBeTypeOf("number");
        });

        it("should handle weighted edges", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            graph.addEdge("A", "B", 1.0);
            graph.addEdge("B", "C", 0.1); // Weak connection

            const config: SynCConfig = {numClusters: 2, seed: 42};
            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(3);

            // A and B should be more likely to cluster together than B and C
            const clusterA = result.clusters.get("A");
            const clusterB = result.clusters.get("B");
            const clusterC = result.clusters.get("C");

            expect(clusterA).toBeTypeOf("number");
            expect(clusterB).toBeTypeOf("number");
            expect(clusterC).toBeTypeOf("number");
        });
    });

    describe("Edge cases", () => {
        it("should handle graph with self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "A"); // Self-loop
            graph.addEdge("A", "B");

            const config: SynCConfig = {numClusters: 2};

            expect(() => {
                syncClustering(graph, config);
            }).not.toThrow();
        });

        it("should handle disconnected single nodes", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addNode("C");
            // No edges - all nodes disconnected

            const config: SynCConfig = {numClusters: 3, seed: 42};
            const result = syncClustering(graph, config);

            expect(result.clusters.size).toBe(3);
            expect(new Set(result.clusters.values()).size).toBe(3); // All in different clusters
        });

        it("should handle very small regularization parameter", () => {
            const graph = new Graph();
            graph.addNode("A");
            graph.addNode("B");
            graph.addEdge("A", "B");

            const config: SynCConfig = {
                numClusters: 2,
                lambda: 1e-10,
                seed: 42,
            };

            expect(() => {
                syncClustering(graph, config);
            }).not.toThrow();
        });
    });

    describe("Performance characteristics", () => {
        it("should complete in reasonable time for medium graphs", () => {
            const graph = new Graph();

            // Create a medium-sized graph (50 nodes)
            for (let i = 0; i < 50; i++) {
                graph.addNode(`node${i}`);
            }

            // Add edges in a pattern that creates some structure
            for (let i = 0; i < 45; i++) {
                graph.addEdge(`node${i}`, `node${i + 1}`);
                if (i % 5 === 0) {
                    graph.addEdge(`node${i}`, `node${i + 5}`);
                }
            }

            const startTime = performance.now();
            const config: SynCConfig = {numClusters: 5, seed: 42};
            const result = syncClustering(graph, config);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(result.clusters.size).toBe(50);
            expect(result.embeddings.size).toBe(50);
        });
    });
});
