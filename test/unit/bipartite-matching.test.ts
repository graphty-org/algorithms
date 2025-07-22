import {describe, expect, it} from "vitest";

import {
    bipartitePartition,
    greedyBipartiteMatching,
    maximumBipartiteMatching,
} from "../../src/algorithms/matching/bipartite.js";
import {Graph} from "../../src/core/graph.js";

describe("Bipartite Matching", () => {
    describe("bipartitePartition", () => {
        it("should identify bipartite graph and return partition", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("a", "2");
            graph.addEdge("b", "1");
            graph.addEdge("c", "2");

            const partition = bipartitePartition(graph);

            expect(partition).toBeTruthy();
            expect(partition!.left.size + partition!.right.size).toBe(5);

            // Check that no edges exist within partitions
            for (const node of partition!.left) {
                const neighbors = graph.neighbors(node);
                for (const neighbor of neighbors) {
                    expect(partition!.left.has(neighbor)).toBe(false);
                }
            }
        });

        it("should detect non-bipartite graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a"); // Creates odd cycle

            const partition = bipartitePartition(graph);

            expect(partition).toBeNull();
        });

        it("should handle disconnected bipartite components", () => {
            const graph = new Graph();
            // First component
            graph.addEdge("a", "1");
            graph.addEdge("b", "1");
            // Second component
            graph.addEdge("c", "2");
            graph.addEdge("d", "2");

            const partition = bipartitePartition(graph);

            expect(partition).toBeTruthy();
            expect(partition!.left.size + partition!.right.size).toBe(6);
        });

        it("should handle isolated nodes", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addNode("isolated");

            const partition = bipartitePartition(graph);

            expect(partition).toBeTruthy();
            expect(partition!.left.size + partition!.right.size).toBe(3);
        });

        it("should handle empty graph", () => {
            const graph = new Graph();

            const partition = bipartitePartition(graph);

            expect(partition).toBeTruthy();
            expect(partition!.left.size).toBe(0);
            expect(partition!.right.size).toBe(0);
        });

        it("should handle single node", () => {
            const graph = new Graph();
            graph.addNode("a");

            const partition = bipartitePartition(graph);

            expect(partition).toBeTruthy();
            expect(partition!.left.size + partition!.right.size).toBe(1);
        });
    });

    describe("maximumBipartiteMatching", () => {
        it("should find maximum matching in simple bipartite graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("a", "2");
            graph.addEdge("b", "1");
            graph.addEdge("c", "2");

            const result = maximumBipartiteMatching(graph);

            expect(result.size).toBe(2);
            expect(result.matching.size).toBe(2);

            // Verify matching is valid
            const usedLeft = new Set();
            const usedRight = new Set();
            for (const [left, right] of result.matching) {
                expect(usedLeft.has(left)).toBe(false);
                expect(usedRight.has(right)).toBe(false);
                expect(graph.hasEdge(left, right)).toBe(true);
                usedLeft.add(left);
                usedRight.add(right);
            }
        });

        it("should handle complete bipartite graph", () => {
            const graph = new Graph();
            const leftNodes = ["a", "b", "c"];
            const rightNodes = ["1", "2", "3"];

            for (const left of leftNodes) {
                for (const right of rightNodes) {
                    graph.addEdge(left, right);
                }
            }

            const result = maximumBipartiteMatching(graph);

            expect(result.size).toBe(3);
            expect(result.matching.size).toBe(3);
        });

        it("should handle bottleneck case", () => {
            const graph = new Graph();
            // Many nodes on left, few on right
            graph.addEdge("a", "1");
            graph.addEdge("b", "1");
            graph.addEdge("c", "1");
            graph.addEdge("d", "2");
            graph.addEdge("e", "2");

            const result = maximumBipartiteMatching(graph);

            expect(result.size).toBe(2); // Limited by right side
        });

        it("should work with provided partitions", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("b", "2");

            const leftNodes = new Set(["a", "b"]);
            const rightNodes = new Set(["1", "2"]);

            const result = maximumBipartiteMatching(graph, {leftNodes, rightNodes});

            expect(result.size).toBe(2);
        });

        it("should handle no matching possible", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("1");
            // No edges

            const result = maximumBipartiteMatching(graph);

            expect(result.size).toBe(0);
            expect(result.matching.size).toBe(0);
        });

        it("should throw error for non-bipartite graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            expect(() => {
                maximumBipartiteMatching(graph);
            }).toThrow("Graph is not bipartite");
        });

        it("should handle augmenting path scenarios", () => {
            const graph = new Graph();
            // Create a graph where augmenting paths are needed
            graph.addEdge("a", "1");
            graph.addEdge("a", "2");
            graph.addEdge("b", "1");
            graph.addEdge("b", "3");
            graph.addEdge("c", "2");
            graph.addEdge("c", "3");

            const result = maximumBipartiteMatching(graph);

            expect(result.size).toBe(3);
        });
    });

    describe("greedyBipartiteMatching", () => {
        it("should find a valid matching", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("a", "2");
            graph.addEdge("b", "1");
            graph.addEdge("c", "2");

            const result = greedyBipartiteMatching(graph);

            expect(result.size).toBeGreaterThan(0);
            expect(result.matching.size).toBe(result.size);

            // Verify matching is valid
            const usedRight = new Set();
            for (const [left, right] of result.matching) {
                expect(usedRight.has(right)).toBe(false);
                expect(graph.hasEdge(left, right)).toBe(true);
                usedRight.add(right);
            }
        });

        it("should handle simple cases", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("b", "2");

            const result = greedyBipartiteMatching(graph);

            expect(result.size).toBe(2);
        });

        it("should work with provided partitions", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("b", "2");

            const leftNodes = new Set(["a", "b"]);
            const rightNodes = new Set(["1", "2"]);

            const result = greedyBipartiteMatching(graph, {leftNodes, rightNodes});

            expect(result.size).toBe(2);
        });

        it("should handle no edges", () => {
            const graph = new Graph();
            graph.addNode("a");
            graph.addNode("1");

            const result = greedyBipartiteMatching(graph);

            expect(result.size).toBe(0);
        });

        it("should throw error for non-bipartite graph", () => {
            const graph = new Graph();
            graph.addEdge("a", "b");
            graph.addEdge("b", "c");
            graph.addEdge("c", "a");

            expect(() => {
                greedyBipartiteMatching(graph);
            }).toThrow("Graph is not bipartite");
        });

        it("should be suboptimal compared to maximum matching", () => {
            const graph = new Graph();
            // Create a case where greedy might not find optimal
            graph.addEdge("a", "1");
            graph.addEdge("a", "2");
            graph.addEdge("b", "1");
            graph.addEdge("c", "2");

            const greedyResult = greedyBipartiteMatching(graph);
            const maxResult = maximumBipartiteMatching(graph);

            expect(greedyResult.size).toBeLessThanOrEqual(maxResult.size);
        });
    });

    describe("edge cases", () => {
        it("should handle directed graphs", () => {
            const graph = new Graph({directed: true});
            graph.addEdge("a", "1");
            graph.addEdge("b", "2");

            const result = maximumBipartiteMatching(graph);

            expect(result.size).toBe(2);
        });

        it("should handle self-loops in bipartite check", () => {
            const graph = new Graph({allowSelfLoops: true});
            graph.addEdge("a", "a");

            const partition = bipartitePartition(graph);

            // Self-loop creates odd cycle, so not bipartite
            expect(partition).toBeNull();
        });

        it("should handle large bipartite graphs", () => {
            const graph = new Graph();

            // Create larger bipartite graph
            for (let i = 0; i < 20; i++) {
                for (let j = 0; j < 10; j++) {
                    if (Math.random() > 0.5) {
                        graph.addEdge(`L${i}`, `R${j}`);
                    }
                }
            }

            const start = Date.now();
            const result = maximumBipartiteMatching(graph);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(5000); // Should complete reasonably quickly
            expect(result.size).toBeGreaterThanOrEqual(0);
            expect(result.size).toBeLessThanOrEqual(10); // Limited by right side
        });
    });

    describe("comparison between algorithms", () => {
        it("should show maximum matching is at least as good as greedy", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("a", "2");
            graph.addEdge("b", "1");
            graph.addEdge("b", "3");
            graph.addEdge("c", "2");
            graph.addEdge("c", "3");

            const greedyResult = greedyBipartiteMatching(graph);
            const maxResult = maximumBipartiteMatching(graph);

            expect(maxResult.size).toBeGreaterThanOrEqual(greedyResult.size);
        });

        it("should handle identical results for simple cases", () => {
            const graph = new Graph();
            graph.addEdge("a", "1");
            graph.addEdge("b", "2");
            graph.addEdge("c", "3");

            const greedyResult = greedyBipartiteMatching(graph);
            const maxResult = maximumBipartiteMatching(graph);

            expect(maxResult.size).toBe(greedyResult.size);
            expect(maxResult.size).toBe(3);
        });
    });
});
