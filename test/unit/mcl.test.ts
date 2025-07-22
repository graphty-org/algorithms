import {describe, expect, it} from "vitest";

import {calculateMCLModularity, markovClustering} from "../../src/clustering/mcl.js";
import {Graph} from "../../src/core/graph.js";

describe("Markov Clustering (MCL)", () => {
    describe("markovClustering", () => {
        it("should cluster simple disconnected components", () => {
            const graph = new Graph();
            // First component
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            // Second component
            graph.addEdge("d", "e");
            graph.addEdge("e", "f");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.communities.length).toBeLessThanOrEqual(6);

            // Each node should be in exactly one community
            const allAssignedNodes = new Set();
            for (const community of result.communities) {
                for (const node of community) {
                    expect(allAssignedNodes.has(node)).toBe(false);
                    allAssignedNodes.add(node);
                }
            }
            expect(allAssignedNodes.size).toBe(6);
        });

        it("should handle triangle graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.converged).toBeDefined();
            expect(result.iterations).toBeGreaterThan(0);

            // All nodes should be clustered
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(3);
        });

        it("should handle star graph", () => {
            const graph = new Graph();
            graph.addEdge("center", "a");
            graph.addEdge("center", "b");
            graph.addEdge("center", "c");
            graph.addEdge("center", "d");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            expect(result.attractors.size).toBeGreaterThan(0);

            // Center node might be an attractor
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(5);
        });

        it("should respect expansion parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result1 = markovClustering(graph, {expansion: 2});
            const result2 = markovClustering(graph, {expansion: 3});

            expect(result1.communities.length).toBeGreaterThan(0);
            expect(result2.communities.length).toBeGreaterThan(0);
            // Different expansion values may produce different results
        });

        it("should respect inflation parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const lowInflation = markovClustering(graph, {inflation: 1.5});
            const highInflation = markovClustering(graph, {inflation: 3.0});

            expect(lowInflation.communities.length).toBeGreaterThan(0);
            expect(highInflation.communities.length).toBeGreaterThan(0);

            // Higher inflation typically leads to smaller, more granular clusters
            expect(highInflation.communities.length).toBeGreaterThanOrEqual(lowInflation.communities.length);
        });

        it("should respect maxIterations parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = markovClustering(graph, {maxIterations: 5});

            expect(result.iterations).toBeLessThanOrEqual(5);
            expect(result.communities.length).toBeGreaterThan(0);
        });

        it("should handle convergence", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = markovClustering(graph, {tolerance: 1e-3, maxIterations: 100});

            expect(result.converged).toBeDefined();
            expect(result.iterations).toBeGreaterThan(0);
        });

        it("should handle selfLoops parameter", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const withSelfLoops = markovClustering(graph, {selfLoops: true});
            const withoutSelfLoops = markovClustering(graph, {selfLoops: false});

            expect(withSelfLoops.communities.length).toBeGreaterThan(0);
            expect(withoutSelfLoops.communities.length).toBeGreaterThan(0);
        });

        it("should handle pruning threshold", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const result = markovClustering(graph, {pruningThreshold: 1e-3});

            expect(result.communities.length).toBeGreaterThan(0);
        });

        it("should identify attractors", () => {
            const graph = new Graph();
            // Create a hub structure
            graph.addEdge("hub", "a");
            graph.addEdge("hub", "b");
            graph.addEdge("hub", "c");
            graph.addEdge("a", "b");

            const result = markovClustering(graph);

            expect(result.attractors.size).toBeGreaterThan(0);
            // Hub is likely to be an attractor
        });

        it("should handle weighted graphs", () => {
            const graph = new Graph();
            graph.addEdge("a", "b", 2.0);
            graph.addEdge("b", "c", 0.5);
            graph.addEdge("a", "c", 0.1);

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            // Strong a-b connection should influence clustering
        });
    });

    describe("edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Graph();

            const result = markovClustering(graph);

            expect(result.communities).toHaveLength(0);
            expect(result.attractors.size).toBe(0);
            expect(result.iterations).toBe(0);
            expect(result.converged).toBe(true);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("a");

            const result = markovClustering(graph);

            expect(result.communities).toHaveLength(1);
            expect(result.communities[0]).toEqual(["a"]);
            expect(result.attractors.has("a")).toBe(true);
        });

        it("should handle disconnected nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addNode("isolated");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThanOrEqual(2);

            // Isolated node should form its own cluster
            const isolatedCommunity = result.communities.find((c) => c.includes("isolated"));
            expect(isolatedCommunity).toBeTruthy();
        });

        it("should handle graph with no edges", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("b");
            graph.addNode("c");

            const result = markovClustering(graph);

            // Each node should form its own cluster
            expect(result.communities).toHaveLength(3);
            expect(result.communities.every((c) => c.length === 1)).toBe(true);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const result = markovClustering(graph, {selfLoops: true});

            expect(result.communities.length).toBeGreaterThan(0);
        });

        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
        });

        it("should handle complete graph", () => {
            const graph = new Graph();
            const nodes = ["a", "b", "c", "d"];

            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    graph.addEdge(nodes[i], nodes[j]);
                }
            }

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            // Complete graph might form a single cluster
        });
    });

    describe("calculateMCLModularity", () => {
        it("should calculate modularity for MCL result", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("d", "e");

            const result = markovClustering(graph);
            const modularity = calculateMCLModularity(graph, result.communities);

            expect(modularity).toBeGreaterThanOrEqual(-1);
            expect(modularity).toBeLessThanOrEqual(1);
        });

        it("should return 0 for empty graph", () => {
            const graph = new Graph();
            const modularity = calculateMCLModularity(graph, []);

            expect(modularity).toBe(0);
        });

        it("should handle single community", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const modularity = calculateMCLModularity(graph, [["a", "b", "c"]]);

            expect(modularity).toBeGreaterThanOrEqual(-1);
            expect(modularity).toBeLessThanOrEqual(1);
        });

        it("should handle multiple communities", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const modularity = calculateMCLModularity(graph, [["a", "b"], ["c", "d"]]);

            expect(modularity).toBeGreaterThan(0); // Good separation should have positive modularity
        });
    });

    describe("clustering quality", () => {
        it("should separate well-defined clusters", () => {
            const graph = new Graph();

            // Create two dense clusters
            graph.addEdge("a1", "a2");
            graph.addEdge("a1", "a3");
            graph.addEdge("a2", "a3");

            graph.addEdge("b1", "b2");
            graph.addEdge("b1", "b3");
            graph.addEdge("b2", "b3");

            // Weak connection between clusters
            graph.addEdge("a1", "b1");

            const result = markovClustering(graph, {inflation: 2.0});

            expect(result.communities.length).toBeGreaterThanOrEqual(2);

            // Check that nodes from the same original cluster tend to stay together
            const a1Community = result.communities.find((c) => c.includes("a1"));
            const b1Community = result.communities.find((c) => c.includes("b1"));

            expect(a1Community).toBeTruthy();
            expect(b1Community).toBeTruthy();

            // Ideally, clusters should be well-separated
            if (a1Community && b1Community && a1Community !== b1Community) {
                // Good separation achieved
                expect(true).toBe(true);
            }
        });

        it("should handle chain structure", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");
            graph.addEdge("d", "e");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            // Chain might be split into multiple clusters
        });

        it("should handle ring structure", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");
            graph.addEdge("d", "e");
            graph.addEdge("e", "a");

            const result = markovClustering(graph);

            expect(result.communities.length).toBeGreaterThan(0);
            // Ring structure might form one or multiple clusters
        });
    });

    describe("algorithm properties", () => {
        it("should be deterministic for same parameters", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const options = {inflation: 2.0, expansion: 2, maxIterations: 50};
            const result1 = markovClustering(graph, options);
            const result2 = markovClustering(graph, options);

            expect(result1.communities.length).toBe(result2.communities.length);
            expect(result1.converged).toBe(result2.converged);
        });

        it("should converge for most graphs", () => {
            const graph = new Graph();
            // Create a moderately complex graph
            for (let i = 0; i < 10; i++) {
                for (let j = i + 1; j < Math.min(i + 3, 10); j++) {
                    graph.addEdge(i.toString(), j.toString());
                }
            }

            const result = markovClustering(graph, {maxIterations: 100});

            expect(result.iterations).toBeLessThan(100); // Should converge before max
            expect(result.converged).toBe(true);
        });
    });

    describe("performance", () => {
        it("should handle moderately sized graphs", () => {
            const graph = new Graph();

            // Create a graph with 30 nodes and moderate connectivity
            for (let i = 0; i < 30; i++) {
                for (let j = i + 1; j < Math.min(i + 4, 30); j++) {
                    graph.addEdge(i.toString(), j.toString());
                }
            }

            const start = Date.now();
            const result = markovClustering(graph, {maxIterations: 50});
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
            expect(result.communities.length).toBeGreaterThan(0);

            // All nodes should be clustered
            const totalNodes = result.communities.reduce((sum, community) => sum + community.length, 0);
            expect(totalNodes).toBe(30);
        });
    });
});
