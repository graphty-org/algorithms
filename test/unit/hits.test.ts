import {describe, expect, it} from "vitest";

import {hits, nodeHITS} from "../../src/algorithms/centrality/hits.js";
import {Graph} from "../../src/core/graph.js";

describe("HITS Algorithm", () => {
    describe("hits", () => {
        it("should calculate hub and authority scores for directed graph", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const result = hits(graph);

            expect(Object.keys(result.hubs)).toHaveLength(4);
            expect(Object.keys(result.authorities)).toHaveLength(4);

            // Node 'a' points to multiple nodes, should have high hub score
            expect(result.hubs.a).toBeGreaterThan(result.hubs.d);

            // Node 'c' is pointed to by multiple nodes, should have high authority score
            expect(result.authorities.c).toBeGreaterThan(result.authorities.a);
        });

        it("should handle simple hub-authority structure", () => {
            const graph = new Graph({directed: true});
            // Create a hub pointing to multiple authorities
            graph.addEdge("hub", "auth1");
            graph.addEdge("hub", "auth2");
            graph.addEdge("hub", "auth3");

            const result = hits(graph);

            // Hub should have highest hub score
            expect(result.hubs.hub).toBeGreaterThan(result.hubs.auth1);
            expect(result.hubs.hub).toBeGreaterThan(result.hubs.auth2);
            expect(result.hubs.hub).toBeGreaterThan(result.hubs.auth3);

            // Authorities should have higher authority scores than hub
            expect(result.authorities.auth1).toBeGreaterThan(result.authorities.hub);
            expect(result.authorities.auth2).toBeGreaterThan(result.authorities.hub);
            expect(result.authorities.auth3).toBeGreaterThan(result.authorities.hub);

            // Authorities should have similar scores
            expect(result.authorities.auth1).toBeCloseTo(result.authorities.auth2, 3);
            expect(result.authorities.auth2).toBeCloseTo(result.authorities.auth3, 3);
        });

        it("should handle chain structure", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "d");

            const result = hits(graph);

            // Middle nodes should have both hub and authority scores
            expect(result.hubs.b).toBeGreaterThan(0);
            expect(result.authorities.b).toBeGreaterThan(0);
            expect(result.hubs.c).toBeGreaterThan(0);
            expect(result.authorities.c).toBeGreaterThan(0);

            // End nodes should be specialized
            expect(result.hubs.a).toBeGreaterThan(result.authorities.a);
            expect(result.authorities.d).toBeGreaterThan(result.hubs.d);
        });

        it("should handle cycle structure", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            const result = hits(graph);

            // In a cycle, all nodes should have similar hub and authority scores
            expect(result.hubs.a).toBeCloseTo(result.hubs.b, 2);
            expect(result.hubs.b).toBeCloseTo(result.hubs.c, 2);
            expect(result.authorities.a).toBeCloseTo(result.authorities.b, 2);
            expect(result.authorities.b).toBeCloseTo(result.authorities.c, 2);
        });

        it("should respect maxIterations parameter", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = hits(graph, {maxIterations: 5});

            expect(Object.keys(result.hubs)).toHaveLength(3);
            expect(Object.keys(result.authorities)).toHaveLength(3);
        });

        it("should respect tolerance parameter", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const looseTolerance = hits(graph, {tolerance: 1e-2});
            const strictTolerance = hits(graph, {tolerance: 1e-8});

            // Both should converge to valid results
            expect(Object.keys(looseTolerance.hubs)).toHaveLength(3);
            expect(Object.keys(strictTolerance.hubs)).toHaveLength(3);
        });

        it("should handle normalization", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");

            const normalized = hits(graph, {normalized: true});
            const unnormalized = hits(graph, {normalized: false});

            // Normalized values should be in [0, 1] range
            const normalizedHubValues = Object.values(normalized.hubs);
            const normalizedAuthValues = Object.values(normalized.authorities);

            expect(Math.max(... normalizedHubValues)).toBeLessThanOrEqual(1.01); // Small tolerance for floating point
            expect(Math.max(... normalizedAuthValues)).toBeLessThanOrEqual(1.01);
            expect(Math.min(... normalizedHubValues)).toBeGreaterThanOrEqual(0);
            expect(Math.min(... normalizedAuthValues)).toBeGreaterThanOrEqual(0);

            // Relative ordering should be preserved
            expect((normalized.hubs.a > normalized.hubs.b) ===
                   (unnormalized.hubs.a > unnormalized.hubs.b)).toBe(true);
        });

        it("should handle undirected graphs by treating them as bidirectional", () => {
            const graph = new Graph({directed: false});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const result = hits(graph);

            // For undirected graphs, hub and authority scores should be similar
            expect(Object.keys(result.hubs)).toHaveLength(3);
            expect(Object.keys(result.authorities)).toHaveLength(3);
        });
    });

    describe("edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Graph({directed: true});
            const result = hits(graph);

            expect(result.hubs).toEqual({});
            expect(result.authorities).toEqual({});
        });

        it("should handle single node", () => {
            const graph = new Graph({directed: true});
            graph.addNode("a");

            const result = hits(graph);

            expect(result.hubs.a).toBe(0);
            expect(result.authorities.a).toBe(0);
        });

        it("should handle disconnected components", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("c", "d");

            const result = hits(graph);

            expect(Object.keys(result.hubs)).toHaveLength(4);
            expect(Object.keys(result.authorities)).toHaveLength(4);

            // Similar structures should have similar scores
            expect(result.hubs.a).toBeCloseTo(result.hubs.c, 2);
            expect(result.authorities.b).toBeCloseTo(result.authorities.d, 2);
        });

        it("should handle isolated nodes", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addNode("isolated");

            const result = hits(graph);

            expect(result.hubs.isolated).toBe(0);
            expect(result.authorities.isolated).toBe(0);
            expect(result.hubs.a).toBeGreaterThan(0);
            expect(result.authorities.b).toBeGreaterThan(0);
        });

        it("should handle self-loops", () => {
            const graph = new Graph({directed: true, allowSelfLoops: true});
            graph.addEdge("a", "a");
            graph.addEdge("a", "b");

            const result = hits(graph);

            expect(result.hubs.a).toBeGreaterThan(0);
            expect(result.authorities.a).toBeGreaterThan(0);
        });

        it("should handle graph with no edges", () => {
            const graph = new Graph({directed: true});
            graph.addNode("a");
            graph.addNode("b");
            graph.addNode("c");

            const result = hits(graph);

            expect(result.hubs.a).toBe(0);
            expect(result.hubs.b).toBe(0);
            expect(result.hubs.c).toBe(0);
            expect(result.authorities.a).toBe(0);
            expect(result.authorities.b).toBe(0);
            expect(result.authorities.c).toBe(0);
        });
    });

    describe("nodeHITS", () => {
        it("should calculate hub and authority scores for specific node", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "c");

            const nodeResult = nodeHITS(graph, "a");

            expect(nodeResult.hub).toBeGreaterThan(0);
            expect(nodeResult.authority).toBeGreaterThanOrEqual(0);
        });

        it("should throw error for non-existent node", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");

            expect(() => {
                nodeHITS(graph, "nonexistent");
            }).toThrow("Node nonexistent not found in graph");
        });

        it("should match full HITS calculation", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");

            const fullResult = hits(graph);
            const nodeResult = nodeHITS(graph, "b");

            expect(nodeResult.hub).toBeCloseTo(fullResult.hubs.b, 5);
            expect(nodeResult.authority).toBeCloseTo(fullResult.authorities.b, 5);
        });
    });

    describe("mathematical properties", () => {
        it("should maintain score normalization", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "b");
            graph.addEdge("a", "c");
            graph.addEdge("b", "c");

            const result = hits(graph);

            // Hub scores should be normalized (sum of squares = 1)
            const hubValues = Object.values(result.hubs);
            const hubNormSquared = hubValues.reduce((sum, val) => sum + (val * val), 0);
            expect(hubNormSquared).toBeCloseTo(1, 3);

            // Authority scores should be normalized (sum of squares = 1)
            const authValues = Object.values(result.authorities);
            const authNormSquared = authValues.reduce((sum, val) => sum + (val * val), 0);
            expect(authNormSquared).toBeCloseTo(1, 3);
        });

        it("should satisfy mutual reinforcement property", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("hub1", "auth1");
            graph.addEdge("hub1", "auth2");
            graph.addEdge("hub2", "auth1");
            graph.addEdge("hub2", "auth2");

            const result = hits(graph);

            // Hubs pointing to good authorities should have high hub scores
            expect(result.hubs.hub1).toBeGreaterThan(0);
            expect(result.hubs.hub2).toBeGreaterThan(0);

            // Authorities pointed to by good hubs should have high authority scores
            expect(result.authorities.auth1).toBeGreaterThan(0);
            expect(result.authorities.auth2).toBeGreaterThan(0);
        });
    });

    describe("performance", () => {
        it("should handle moderately large graphs", () => {
            const graph = new Graph({directed: true});

            // Create a directed graph with 100 nodes
            for (let i = 0; i < 100; i++) {
                for (let j = i + 1; j < Math.min(i + 5, 100); j++) {
                    graph.addEdge(i.toString(), j.toString());
                }
            }

            const start = Date.now();
            const result = hits(graph, {maxIterations: 50});
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            expect(Object.keys(result.hubs)).toHaveLength(100);
            expect(Object.keys(result.authorities)).toHaveLength(100);
        });
    });
});
