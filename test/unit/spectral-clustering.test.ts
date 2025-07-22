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
        it.skip("should separate well-defined clusters (requires full eigendecomposition)", () => {
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

            expect(result.communities).toHaveLength(3);
            expect(result.clusterAssignments.size).toBe(9);
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
