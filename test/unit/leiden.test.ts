import {describe, expect, it} from "vitest";

import {leiden} from "../../src/algorithms/community/leiden";
import {createGraphFromMap} from "../helpers/graph-test-utils";

describe("Leiden Algorithm", () => {
    it("should detect communities in a simple graph", () => {
        const graphMap = new Map([
            ["a", new Map([["b", 1], ["c", 1]])],
            ["b", new Map([["a", 1], ["c", 1]])],
            ["c", new Map([["a", 1], ["b", 1]])],
            ["d", new Map([["e", 1], ["f", 1]])],
            ["e", new Map([["d", 1], ["f", 1]])],
            ["f", new Map([["d", 1], ["e", 1]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph);

        expect(result.communities.size).toBe(6);
        expect(result.modularity).toBeGreaterThan(0);
        expect(result.iterations).toBeGreaterThan(0);

        // Should detect two communities
        const communityIds = new Set(result.communities.values());
        expect(communityIds.size).toBeLessThanOrEqual(2);
    });

    it("should handle empty graph", () => {
        const graphMap = new Map<string, Map<string, number>>();
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph);

        expect(result.communities.size).toBe(0);
        expect(result.modularity).toBe(0);
        expect(result.iterations).toBe(0);
    });

    it("should handle single node graph", () => {
        const graphMap = new Map([
            ["a", new Map<string, number>()],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph);

        expect(result.communities.size).toBe(1);
        expect(result.communities.get("a")).toBeDefined();
        expect(result.modularity).toBe(0);
    });

    it("should handle complete graph", () => {
        const graphMap = new Map([
            ["a", new Map([["b", 1], ["c", 1], ["d", 1]])],
            ["b", new Map([["a", 1], ["c", 1], ["d", 1]])],
            ["c", new Map([["a", 1], ["b", 1], ["d", 1]])],
            ["d", new Map([["a", 1], ["b", 1], ["c", 1]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph);

        expect(result.communities.size).toBe(4);
        // Complete graph should likely be one community
        const communityIds = new Set(result.communities.values());
        expect(communityIds.size).toBe(1);
    });

    it("should handle star graph", () => {
        const graphMap = new Map([
            ["center", new Map([["a", 1], ["b", 1], ["c", 1], ["d", 1]])],
            ["a", new Map([["center", 1]])],
            ["b", new Map([["center", 1]])],
            ["c", new Map([["center", 1]])],
            ["d", new Map([["center", 1]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph);

        expect(result.communities.size).toBe(5);
        // Star graph is typically one community
        const communityIds = new Set(result.communities.values());
        expect(communityIds.size).toBe(1);
    });

    it("should respect resolution parameter", () => {
        const graphMap = new Map([
            ["a", new Map([["b", 1], ["c", 1]])],
            ["b", new Map([["a", 1], ["c", 1], ["d", 0.1]])],
            ["c", new Map([["a", 1], ["b", 1]])],
            ["d", new Map([["b", 0.1], ["e", 1], ["f", 1]])],
            ["e", new Map([["d", 1], ["f", 1]])],
            ["f", new Map([["d", 1], ["e", 1]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        // Lower resolution should merge communities
        const lowRes = leiden(graph, {resolution: 0.5});
        const lowResCommunities = new Set(lowRes.communities.values()).size;

        // Higher resolution should split communities
        const highRes = leiden(graph, {resolution: 2.0});
        const highResCommunities = new Set(highRes.communities.values()).size;

        expect(highResCommunities).toBeGreaterThanOrEqual(lowResCommunities);
    });

    it("should converge within max iterations", () => {
        const graphMap = new Map([
            ["a", new Map([["b", 1], ["c", 1]])],
            ["b", new Map([["a", 1], ["c", 1]])],
            ["c", new Map([["a", 1], ["b", 1]])],
            ["d", new Map([["e", 1], ["f", 1]])],
            ["e", new Map([["d", 1], ["f", 1]])],
            ["f", new Map([["d", 1], ["e", 1]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph, {maxIterations: 5});

        expect(result.iterations).toBeLessThanOrEqual(5);
    });

    it("should handle weighted edges correctly", () => {
        const graphMap = new Map([
            ["a", new Map([["b", 10], ["c", 10], ["d", 0.1]])],
            ["b", new Map([["a", 10], ["c", 10], ["e", 0.1]])],
            ["c", new Map([["a", 10], ["b", 10], ["f", 0.1]])],
            ["d", new Map([["a", 0.1], ["e", 10], ["f", 10]])],
            ["e", new Map([["b", 0.1], ["d", 10], ["f", 10]])],
            ["f", new Map([["c", 0.1], ["d", 10], ["e", 10]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result = leiden(graph);

        // Should detect two communities based on strong weights
        const communities = new Map<number, string[]>();
        for (const [node, commId] of result.communities) {
            if (!communities.has(commId)) {
                communities.set(commId, []);
            }
            communities.get(commId)!.push(node);
        }

        expect(communities.size).toBe(2);

        // Check that strongly connected nodes are in same community
        const commA = result.communities.get("a");
        const commB = result.communities.get("b");
        const commC = result.communities.get("c");
        expect(commA).toBe(commB);
        expect(commB).toBe(commC);

        const commD = result.communities.get("d");
        const commE = result.communities.get("e");
        const commF = result.communities.get("f");
        expect(commD).toBe(commE);
        expect(commE).toBe(commF);

        expect(commA).not.toBe(commD);
    });

    describe("graph parameter handling", () => {
        it("should not modify the original graph", () => {
            const graphMap = new Map([
                ["a", new Map([["b", 1], ["c", 1]])],
                ["b", new Map([["a", 1], ["c", 1]])],
                ["c", new Map([["a", 1], ["b", 1]])],
            ]);
            const graph = createGraphFromMap(graphMap);

            const originalNodeCount = graph.nodeCount;
            const originalEdgeCount = graph.totalEdgeCount;

            leiden(graph, {maxIterations: 10});

            // Original graph should be unchanged
            expect(graph.nodeCount).toBe(originalNodeCount);
            expect(graph.totalEdgeCount).toBe(originalEdgeCount);
        });
    });

    it("should produce deterministic results with same seed", () => {
        const graphMap = new Map([
            ["a", new Map([["b", 1], ["c", 1]])],
            ["b", new Map([["a", 1], ["c", 1], ["d", 1]])],
            ["c", new Map([["a", 1], ["b", 1], ["d", 1]])],
            ["d", new Map([["b", 1], ["c", 1], ["e", 1]])],
            ["e", new Map([["d", 1], ["f", 1]])],
            ["f", new Map([["e", 1]])],
        ]);
        const graph = createGraphFromMap(graphMap);

        const result1 = leiden(graph, {randomSeed: 42});
        const result2 = leiden(graph, {randomSeed: 42});

        // Should produce same communities
        for (const [node, comm1] of result1.communities) {
            const comm2 = result2.communities.get(node);
            expect(comm1).toBe(comm2);
        }

        expect(result1.modularity).toBe(result2.modularity);
    });
});
