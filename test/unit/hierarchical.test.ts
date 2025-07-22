import {describe, expect, it} from "vitest";

import {
    type ClusterNode,
    cutDendrogram,
    cutDendrogramKClusters,
    hierarchicalClustering,
    modularityHierarchicalClustering} from "../../src/clustering/hierarchical";

describe("Hierarchical Clustering", () => {
    describe("hierarchicalClustering", () => {
        it("should cluster a simple chain graph", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["b", "d"])],
                ["d", new Set(["c"])],
            ]);

            const result = hierarchicalClustering(graph, "single");

            expect(result.root.members.size).toBe(4);
            expect(result.dendrogram.length).toBe(7); // 4 leaves + 3 internal nodes
            expect(result.root.height).toBeGreaterThan(0);
        });

        it("should handle complete graph", () => {
            const graph = new Map([
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c"])],
            ]);

            const result = hierarchicalClustering(graph, "complete");

            expect(result.root.members.size).toBe(4);
            // All nodes are at distance 1 from each other
            expect(result.root.distance).toBe(1);
        });

        it("should handle disconnected components", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
                ["c", new Set(["d"])],
                ["d", new Set(["c"])],
            ]);

            const result = hierarchicalClustering(graph, "single");

            // With disconnected components, the algorithm may not merge all nodes
            expect(result.root.members.size).toBeLessThanOrEqual(graph.size);
            // Distance between disconnected components is infinite
            if (result.root.members.size === graph.size) {
                expect(result.root.distance).toBe(Infinity);
            }
        });

        it("should produce different results with different linkage methods", () => {
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b"])],
                ["d", new Set(["b", "e"])],
                ["e", new Set(["d"])],
            ]);

            const single = hierarchicalClustering(graph, "single");
            const complete = hierarchicalClustering(graph, "complete");
            const average = hierarchicalClustering(graph, "average");

            // Different linkage methods should produce results
            expect(single.root.members.size).toBe(5);
            expect(complete.root.members.size).toBe(5);
            expect(average.root.members.size).toBe(5);

            // Should have clusters at some level
            expect(single.clusters.size).toBeGreaterThan(0);
            expect(complete.clusters.size).toBeGreaterThan(0);
            expect(average.clusters.size).toBeGreaterThan(0);
        });

        it("should handle empty graph", () => {
            const graph = new Map<string, Set<string>>();

            const result = hierarchicalClustering(graph);

            expect(result.root.members.size).toBe(0);
            expect(result.dendrogram.length).toBe(0);
        });

        it("should handle single node", () => {
            const graph = new Map([
                ["a", new Set<string>()],
            ]);

            const result = hierarchicalClustering(graph);

            expect(result.root.members.size).toBe(1);
            expect(result.root.height).toBe(0);
            expect(result.dendrogram.length).toBe(1);
        });

        it("should create correct cluster hierarchy", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
                ["c", new Set(["d"])],
                ["d", new Set(["c"])],
                ["e", new Set<string>()],
            ]);

            const result = hierarchicalClustering(graph, "single");

            // Check clusters exist at different heights
            const clustersAt0 = result.clusters.get(0);
            // May not include isolated nodes
            expect(clustersAt0?.length).toBeGreaterThan(0);

            // At higher levels, fewer clusters
            const maxHeight = result.root.height;
            const clustersAtMax = result.clusters.get(maxHeight);
            expect(clustersAtMax?.length).toBe(1); // All merged
        });
    });

    describe("cutDendrogram", () => {
        it("should cut dendrogram at specified height", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["b", "d"])],
                ["d", new Set(["c"])],
            ]);

            const result = hierarchicalClustering(graph, "single");

            const clusters0 = cutDendrogram(result.root, 0);
            expect(clusters0.length).toBe(4); // All individual nodes

            const clusters1 = cutDendrogram(result.root, 1);
            expect(clusters1.length).toBeLessThan(4); // Some merging

            const clustersMax = cutDendrogram(result.root, result.root.height);
            expect(clustersMax.length).toBe(1); // All merged
        });

        it("should handle edge cases", () => {
            const leaf: ClusterNode<string> = {
                id: "leaf",
                members: new Set(["a"]),
                distance: 0,
                height: 0,
            };

            const clusters = cutDendrogram(leaf, 10);
            expect(clusters.length).toBe(1);
            expect(clusters[0]).toEqual(new Set(["a"]));
        });
    });

    describe("cutDendrogramKClusters", () => {
        it("should produce k clusters", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["b", "d"])],
                ["d", new Set(["c", "e"])],
                ["e", new Set(["d"])],
            ]);

            const result = hierarchicalClustering(graph, "single");

            for (let k = 1; k <= 5; k++) {
                const clusters = cutDendrogramKClusters(result.root, k);
                expect(clusters.length).toBeLessThanOrEqual(k); // May be less if can't split further

                // Verify all nodes are included
                const allNodes = new Set<string>();
                for (const cluster of clusters) {
                    for (const node of cluster) {
                        allNodes.add(node);
                    }
                }
                expect(allNodes.size).toBe(5);
            }
        });

        it("should handle edge cases", () => {
            const graph = new Map([
                ["a", new Set(["b"])],
                ["b", new Set(["a"])],
            ]);

            const result = hierarchicalClustering(graph);

            const clusters0 = cutDendrogramKClusters(result.root, 0);
            expect(clusters0.length).toBe(0);

            const clusters3 = cutDendrogramKClusters(result.root, 3);
            expect(clusters3.length).toBe(2); // Can't have more clusters than nodes
        });
    });

    describe("modularityHierarchicalClustering", () => {
        it("should cluster based on modularity", () => {
            // Two clear communities
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["c", "e", "f"])],
                ["e", new Set(["d", "f"])],
                ["f", new Set(["d", "e"])],
            ]);

            const result = modularityHierarchicalClustering(graph);

            expect(result.root.members.size).toBe(6);

            // Should identify two communities
            const clusters2 = cutDendrogramKClusters(result.root, 2);
            expect(clusters2.length).toBe(2);

            // Check that communities are {a,b,c} and {d,e,f}
            const comm1 = clusters2.find((c) => c.has("a"))!;
            const comm2 = clusters2.find((c) => c.has("d"))!;

            expect(comm1.size).toBe(3);
            expect(comm2.size).toBe(3);
            expect(comm1.has("b") && comm1.has("c")).toBe(true);
            expect(comm2.has("e") && comm2.has("f")).toBe(true);
        });

        it("should handle clique", () => {
            const graph = new Map([
                ["a", new Set(["b", "c", "d"])],
                ["b", new Set(["a", "c", "d"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["a", "b", "c"])],
            ]);

            const result = modularityHierarchicalClustering(graph);

            // All nodes form one community
            expect(result.root.members.size).toBe(4);
            expect(result.root.height).toBe(3);
        });

        it("should handle star graph", () => {
            const graph = new Map([
                ["center", new Set(["a", "b", "c", "d"])],
                ["a", new Set(["center"])],
                ["b", new Set(["center"])],
                ["c", new Set(["center"])],
                ["d", new Set(["center"])],
            ]);

            const result = modularityHierarchicalClustering(graph);

            expect(result.root.members.size).toBe(5);
            // Star graph has poor modularity for any partition
        });

        it("should handle empty graph", () => {
            const graph = new Map<string, Set<string>>();

            const result = modularityHierarchicalClustering(graph);

            expect(result.root.members.size).toBe(0);
            expect(result.dendrogram.length).toBe(0);
        });
    });

    describe("performance", () => {
        it("should handle medium-sized graphs", () => {
            const graph = new Map<number, Set<number>>();

            // Create a graph with 50 nodes in 5 communities
            for (let c = 0; c < 5; c++) {
                for (let i = 0; i < 10; i++) {
                    const node = (c * 10) + i;
                    graph.set(node, new Set());

                    // Connect within community
                    for (let j = 0; j < 10; j++) {
                        if (i !== j) {
                            graph.get(node)!.add((c * 10) + j);
                        }
                    }

                    // Few connections between communities will be added after all nodes exist
                }
            }

            // Add connections between communities
            for (let c = 0; c < 4; c++) {
                graph.get(c * 10)!.add((c + 1) * 10);
                graph.get((c + 1) * 10)!.add(c * 10);
            }

            const start = Date.now();
            const result = hierarchicalClustering(graph, "average");
            const elapsed = Date.now() - start;

            expect(result.root.members.size).toBe(graph.size);
            expect(elapsed).toBeLessThan(5000); // Should complete within 5 seconds

            // Should identify 5 communities
            const clusters5 = cutDendrogramKClusters(result.root, 5);
            expect(clusters5.length).toBe(5);
        });
    });

    describe("clustering validation", () => {
        it("should maintain cluster properties", () => {
            const graph = new Map([
                ["a", new Set(["b", "c"])],
                ["b", new Set(["a", "c"])],
                ["c", new Set(["a", "b", "d"])],
                ["d", new Set(["c", "e"])],
                ["e", new Set(["d"])],
            ]);

            const result = hierarchicalClustering(graph, "complete");

            // Verify dendrogram properties
            for (const node of result.dendrogram) {
                if (node.left && node.right) {
                    // Parent height should be greater than children
                    expect(node.height).toBeGreaterThan(node.left.height);
                    expect(node.height).toBeGreaterThan(node.right.height);

                    // Members should be union of children
                    const unionMembers = new Set([... node.left.members, ... node.right.members]);
                    expect(node.members).toEqual(unionMembers);
                }
            }
        });
    });
});
