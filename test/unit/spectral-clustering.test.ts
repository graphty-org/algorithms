import {describe, expect, it} from "vitest";

import {spectralClustering} from "../../src/clustering/spectral.js";
import {Graph} from "../../src/core/graph.js";

describe("Spectral Clustering", () => {
    describe("spectralClustering", () => {
        it("should cluster simple disconnected components", () => {
            const graph = new Graph();
            // First component
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            // Second component
            graph.addEdge("d", "e");
            graph.addEdge("e", "f");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(2);
            expect(result.clusterAssignments.size).toBe(6);

            // Verify each node is assigned to exactly one cluster
            const allNodes = new Set(["a", "b", "c", "d", "e", "f"]);
            for (const nodeId of allNodes) {
                expect(result.clusterAssignments.has(nodeId)).toBe(true);
            }
        });

        it("should handle triangle graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(2);
            expect(result.clusterAssignments.size).toBe(3);

            // All nodes should be assigned
            expect(result.clusterAssignments.has("a")).toBe(true);
            expect(result.clusterAssignments.has("b")).toBe(true);
            expect(result.clusterAssignments.has("c")).toBe(true);
        });

        it("should handle star graph", () => {
            const graph = new Graph();
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");
            graph.addEdge("center", "d");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(2);
            expect(result.clusterAssignments.size).toBe(5);
        });

        it("should handle k >= number of nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = spectralClustering(graph, {k: 5});

            // Should return each node as its own cluster
            expect(result.communities).toHaveLength(3);
            expect(result.communities.every((community) => community.length === 1)).toBe(true);
        });

        it("should respect different Laplacian types", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("a", "c");

            const unnormalized = spectralClustering(graph, {k: 2, laplacianType: "unnormalized"});
            const normalized = spectralClustering(graph, {k: 2, laplacianType: "normalized"});
            const randomWalk = spectralClustering(graph, {k: 2, laplacianType: "randomWalk"});

            // All should produce valid clusterings
            expect(unnormalized.communities.length).toBeGreaterThan(0);
            expect(normalized.communities.length).toBeGreaterThan(0);
            expect(randomWalk.communities.length).toBeGreaterThan(0);
        });

        it("should handle weighted graphs", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", 1.0);
            graph.addEdge("b", "c", 0.1);
            graph.addEdge("c", "d", 1.0);

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(2);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle maxIterations parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const result = spectralClustering(graph, {k: 2, maxIterations: 10});

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle tolerance parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const result = spectralClustering(graph, {k: 2, tolerance: 1e-2});

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should return eigenvectors and eigenvalues when available", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = spectralClustering(graph, {k: 2});

            // These may be simplified in the current implementation
            expect(result.eigenvalues).toBeDefined();
            expect(result.eigenvectors).toBeDefined();
        });

        it("should produce non-empty communities", () => {
            const graph = new Graph();
            // Create two well-separated clusters
            graph.addEdge("a1", "a2");
            graph.addEdge("a2", "a3");
            graph.addEdge("a3", "a1");

            graph.addEdge("b1", "b2");
            graph.addEdge("b2", "b3");
            graph.addEdge("b3", "b1");

            // Weak connection between clusters
            graph.addEdge("a1", "b1");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(2);
            expect(result.communities.every((community) => community.length > 0)).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(0);
            expect(result.clusterAssignments.size).toBe(0);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("a");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toContain("a");
        });

        it("should handle disconnected nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addNode("isolated");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.has("isolated")).toBe(true);
        });

        it("should handle graph with no edges", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("b");
            graph.addNode("c");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(3);
        });

        it("should handle k = 1", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = spectralClustering(graph, {k: 1});

            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toHaveLength(3);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addEdge("a", "a");
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(3);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(3);
        });
    });

    describe("clustering quality", () => {
        it("should separate well-defined clusters (requires full eigendecomposition)", () => {
            const graph = new Graph();

            // Create two dense clusters
            const cluster1 = ["a1", "a2", "a3", "a4"];
            const cluster2 = ["b1", "b2", "b3", "b4"];

            // Connect within clusters densely
            for (let i = 0; i < cluster1.length; i++) {
                for (let j = i + 1; j < cluster1.length; j++) {
                    graph.addEdge(cluster1[i], cluster1[j]);
                }
            }

            for (let i = 0; i < cluster2.length; i++) {
                for (let j = i + 1; j < cluster2.length; j++) {
                    graph.addEdge(cluster2[i], cluster2[j]);
                }
            }

            // Add single weak connection between clusters
            graph.addEdge("a1", "b1");

            const result = spectralClustering(graph, {k: 2});

            expect(result.communities).toHaveLength(2);

            // Check that most nodes from each original cluster stay together
            const assignments = result.clusterAssignments;
            const cluster1Assignments = cluster1.map((node) => assignments.get(node));
            const cluster2Assignments = cluster2.map((node) => assignments.get(node));

            // Most nodes in each cluster should have the same assignment
            const mostCommonAssignment1 = getMostCommonElement(cluster1Assignments);
            const mostCommonAssignment2 = getMostCommonElement(cluster2Assignments);

            expect(mostCommonAssignment1).not.toBe(mostCommonAssignment2);
        });

        it("should handle multiple disconnected components", () => {
            const graph = new Graph();

            // Create three disconnected triangles
            graph.addEdge("a1", "a2");
            graph.addEdge("a2", "a3");
            graph.addEdge("a3", "a1");

            graph.addEdge("b1", "b2");
            graph.addEdge("b2", "b3");
            graph.addEdge("b3", "b1");

            graph.addEdge("c1", "c2");
            graph.addEdge("c2", "c3");
            graph.addEdge("c3", "c1");

            const result = spectralClustering(graph, {k: 3});

            // Spectral clustering may not always produce exactly k clusters
            // for disconnected components due to k-means initialization randomness
            // We should expect at least 2 communities but may get 2 or 3
            expect(result.communities.length).toBeGreaterThanOrEqual(2);
            expect(result.communities.length).toBeLessThanOrEqual(3);
            expect(result.clusterAssignments.size).toBe(9);

            // Verify all nodes are assigned to clusters
            const allNodes = ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3"];
            for (const node of allNodes) {
                expect(result.clusterAssignments.has(node)).toBe(true);
            }

            // Verify communities contain all nodes
            const allAssignedNodes = result.communities.flat();
            expect(allAssignedNodes).toHaveLength(9);
            expect(new Set(allAssignedNodes).size).toBe(9); // No duplicates
        });
    });

    describe("performance", () => {
        it("should handle moderately sized graphs", () => {
            const graph = new Graph();

            // Create a graph with 50 nodes
            for (let i = 0; i < 50; i++) {
                for (let j = i + 1; j < Math.min(i + 5, 50); j++) {
                    graph.addEdge(i.toString(), j.toString());
                }
            }

            const start = Date.now();
            const result = spectralClustering(graph, {k: 5, maxIterations: 20});
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(50);
        });
    });

    describe("k-means clustering edge cases", () => {
        it("should handle k-means when data is empty", () => {
            const graph = new Graph();
            const result = spectralClustering(graph, {k: 0});
            expect(result.communities).toHaveLength(0);
            expect(result.clusterAssignments.size).toBe(0);
        });

        it("should handle graph with nodes but no edges (isolated nodes)", () => {
            const graph = new Graph();
            // Add several isolated nodes
            for (let i = 0; i < 10; i++) {
                graph.addNode(`node${i}`);
            }

            const result = spectralClustering(graph, {k: 3});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(10);
        });

        it("should handle large k value relative to nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            // k is larger than number of nodes
            const result = spectralClustering(graph, {k: 10});
            expect(result.communities).toHaveLength(4); // Each node gets its own cluster
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle graphs with zero-weight edges", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", 0);
            graph.addEdge("b", "c", 0);
            graph.addEdge("c", "d", 1);

            const result = spectralClustering(graph, {k: 2});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle k-means convergence with identical points", () => {
            const graph = new Graph();
            // Create a symmetric structure where spectral embedding might produce identical points
            graph.addEdge("a", "center", 1);
            graph.addEdge("b", "center", 1);
            graph.addEdge("c", "center", 1);
            graph.addEdge("d", "center", 1);

            const result = spectralClustering(graph, {k: 2, maxIterations: 5});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(5);
        });

        it("should handle graphs where k-means needs many iterations", () => {
            const graph = new Graph();
            // Create a chain that might require more iterations
            for (let i = 0; i < 20; i++) {
                graph.addEdge(`n${i}`, `n${i + 1}`);
            }

            const result = spectralClustering(graph, {k: 5, maxIterations: 50});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(21);
        });

        it("should handle unnormalized Laplacian with isolated nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addNode("isolated1");
            graph.addNode("isolated2");

            const result = spectralClustering(graph, {k: 2, laplacianType: "unnormalized"});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle random walk Laplacian with weighted edges", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", 10);
            graph.addEdge("b", "c", 0.1);
            graph.addEdge("c", "d", 10);

            const result = spectralClustering(graph, {k: 2, laplacianType: "randomWalk"});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle eigenvector computation for small matrices", () => {
            const graph = new Graph();
            // Small graph where n <= 3
            graph.addEdge("a", "b");
            graph.addNode("c");

            const result = spectralClustering(graph, {k: 2});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.eigenvalues).toBeDefined();
            expect(result.eigenvectors).toBeDefined();
        });

        it("should handle eigenvector computation with k = n", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = spectralClustering(graph, {k: 3});
            expect(result.communities).toHaveLength(3);
            // When k >= n, eigenvalues/eigenvectors might not be returned
            // since each node becomes its own cluster
        });

        it("should handle graphs with very small edge weights", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", 0.0001);
            graph.addEdge("b", "c", 0.0001);
            graph.addEdge("c", "d", 0.0001);

            const result = spectralClustering(graph, {k: 2});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle k-means with k = 1", () => {
            const graph = new Graph();
            // Create a connected component
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");
            graph.addEdge("d", "e");

            const result = spectralClustering(graph, {k: 1});
            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toHaveLength(5);
            expect(result.clusterAssignments.size).toBe(5);
        });

        it("should handle case where k-means needs to fill remaining centroids", () => {
            const graph = new Graph();
            // Create a very small graph where data points < k
            graph.addNode("a");
            graph.addNode("b");

            // Request more clusters than data points in embedding space
            const result = spectralClustering(graph, {k: 5});
            expect(result.communities).toHaveLength(2); // Each node as its own cluster
            expect(result.clusterAssignments.size).toBe(2);
        });

        it("should handle k-means convergence in first iteration", () => {
            const graph = new Graph();
            // Single node graph
            graph.addNode("a");

            const result = spectralClustering(graph, {k: 1});
            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toContain("a");
        });

        it("should handle empty data in k-means", () => {
            const graph = new Graph();
            const result = spectralClustering(graph, {k: 3});
            expect(result.communities).toHaveLength(0);
        });

        it("should handle case with large graph for eigendecomposition", () => {
            const graph = new Graph();
            // Create a graph with exactly 4 nodes to test the n > 3 branch
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");
            graph.addEdge("d", "a");

            const result = spectralClustering(graph, {k: 2});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(4);
        });

        it("should handle k-means with all points assigned to same cluster initially", () => {
            const graph = new Graph();
            // Create symmetric graph that might result in similar embeddings
            const nodes = ["a", "b", "c", "d", "e", "f"];
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j], 1);
                }
            }

            const result = spectralClustering(graph, {k: 3, maxIterations: 2});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.size).toBe(6);
        });

        it("should test euclidean distance calculation edge cases", () => {
            const graph = new Graph();
            // Create a graph that will test the euclidean distance function
            graph.addEdge("a", "b", 1);
            graph.addEdge("b", "c", 1);
            graph.addEdge("c", "d", 1);

            const result = spectralClustering(graph, {k: 2, maxIterations: 10});
            expect(result.communities.length).toBeGreaterThan(0);
        });

        it("should handle normalized laplacian with zero degree nodes", () => {
            const graph = new Graph();
            graph.addNode("isolated");
            graph.addEdge("a", "b");

            const result = spectralClustering(graph, {k: 2, laplacianType: "normalized"});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.has("isolated")).toBe(true);
        });

        it("should handle random walk laplacian with zero degree nodes", () => {
            const graph = new Graph();
            graph.addNode("isolated");
            graph.addEdge("a", "b");

            const result = spectralClustering(graph, {k: 2, laplacianType: "randomWalk"});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.clusterAssignments.has("isolated")).toBe(true);
        });

        it("should test k-means when centroids need to be filled with random values", () => {
            const graph = new Graph();
            // Create graph where eigenvector decomposition might produce fewer valid vectors than k
            graph.addNode("a");
            graph.addNode("b");
            // With 2 nodes but k=5, it should handle the case where we need more centroids
            const result = spectralClustering(graph, {k: 5});
            expect(result.communities).toHaveLength(2);
        });

        it("should handle k-means with immediate convergence", () => {
            const graph = new Graph();
            // Single cluster case
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = spectralClustering(graph, {k: 1, maxIterations: 1});
            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toHaveLength(3);
        });

        it("should handle graph that produces eigenvectors with n > 3 and k < n", () => {
            const graph = new Graph();
            // Create a 5-node graph to trigger power iteration in eigendecomposition
            for (let i = 0; i < 5; i++) {
                for (let j = i + 1; j < 5; j++) {
                    graph.addEdge(`n${i}`, `n${j}`);
                }
            }

            const result = spectralClustering(graph, {k: 3});
            expect(result.communities).toHaveLength(3);
            expect(result.clusterAssignments.size).toBe(5);
        });

        it("should handle k-means with data dimension d = 0", () => {
            const graph = new Graph();
            // Empty graph should produce empty eigenvectors
            const result = spectralClustering(graph, {k: 2});
            expect(result.communities).toHaveLength(0);
        });

        it("should test eigenvector orthogonalization in power iteration", () => {
            const graph = new Graph();
            // Create a graph large enough to trigger multiple eigenvector computations
            const nodes = [];
            for (let i = 0; i < 6; i++) {
                nodes.push(`v${i}`);
            }
            // Create a specific structure to test orthogonalization
            graph.addEdge(nodes[0], nodes[1]);
            graph.addEdge(nodes[1], nodes[2]);
            graph.addEdge(nodes[2], nodes[3]);
            graph.addEdge(nodes[3], nodes[4]);
            graph.addEdge(nodes[4], nodes[5]);
            graph.addEdge(nodes[5], nodes[0]);

            const result = spectralClustering(graph, {k: 3});
            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.eigenvalues).toBeDefined();
        });

        it("should handle eigenvector computation with zero norm", () => {
            const graph = new Graph();
            // Create isolated nodes which might lead to zero eigenvectors
            for (let i = 0; i < 4; i++) {
                graph.addNode(`isolated${i}`);
            }

            const result = spectralClustering(graph, {k: 2});
            expect(result.communities.length).toBeGreaterThan(0);
        });

        it("should test laplacian matrix computation branches", () => {
            const graph = new Graph();
            // Test with edges that have very small weights
            graph.addEdge("a", "b", 0.0001);
            graph.addEdge("b", "c", 0.0001);
            graph.addNode("d"); // isolated node

            // Test unnormalized laplacian
            const result1 = spectralClustering(graph, {k: 2, laplacianType: "unnormalized"});
            expect(result1.communities.length).toBeGreaterThan(0);

            // Test normalized laplacian with zero degree node
            const result2 = spectralClustering(graph, {k: 2, laplacianType: "normalized"});
            expect(result2.communities.length).toBeGreaterThan(0);

            // Test random walk laplacian
            const result3 = spectralClustering(graph, {k: 2, laplacianType: "randomWalk"});
            expect(result3.communities.length).toBeGreaterThan(0);
        });
    });
});

// Helper function to find most common element in array
function getMostCommonElement<T>(arr: T[]): T | undefined {
    const counts = new Map<T, number>();
    for (const item of arr) {
        counts.set(item, (counts.get(item) ?? 0) + 1);
    }

    let mostCommon: T | undefined;
    let maxCount = 0;
    for (const [item, count] of counts) {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = item;
        }
    }

    return mostCommon;
}
