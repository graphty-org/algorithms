import {describe, expect, it} from "vitest";

import {findAllIsomorphisms, isGraphIsomorphic} from "../../src/algorithms/matching/isomorphism.js";
import {Graph} from "../../src/core/graph.js";

describe("Graph Isomorphism (VF2)", () => {
    describe("isGraphIsomorphic", () => {
        it("should detect isomorphic triangles", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("c", "a");

            const graph2 = new Graph();
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("z", "x");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
            expect(result.mapping).toBeDefined();
            expect(result.mapping!.size).toBe(3);
        });

        it("should detect non-isomorphic graphs with same node count", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("c", "d");

            const graph2 = new Graph();
            graph2.addEdge("w", "x");
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("z", "w");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(false);
        });

        it("should handle empty graphs", () => {
            const graph1 = new Graph();
            const graph2 = new Graph();

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
            expect(result.mapping).toBeDefined();
            expect(result.mapping!.size).toBe(0);
        });

        it("should handle single node graphs", () => {
            const graph1 = new Graph();
            graph1.addNode("a");

            const graph2 = new Graph();
            graph2.addNode("x");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
            expect(result.mapping!.get("a")).toBe("x");
        });

        it("should detect isomorphic star graphs", () => {
            const graph1 = new Graph();
            graph1.addEdge("center", "a");
            graph1.addEdge("center", "b");
            graph1.addEdge("center", "c");

            const graph2 = new Graph();
            graph2.addEdge("hub", "x");
            graph2.addEdge("hub", "y");
            graph2.addEdge("hub", "z");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
            expect(result.mapping).toBeDefined();
        });

        it("should handle directed graphs", () => {
            const graph1 = new Graph({directed: true});
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("c", "a");

            const graph2 = new Graph({directed: true});
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("z", "x");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
        });

        it("should detect non-isomorphic directed graphs", () => {
            const graph1 = new Graph({directed: true});
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("c", "a");

            const graph2 = new Graph({directed: true});
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("x", "z"); // Different edge direction

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(false);
        });

        it("should handle disconnected components", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("c", "d");

            const graph2 = new Graph();
            graph2.addEdge("w", "x");
            graph2.addEdge("y", "z");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
        });

        it("should use node match predicate", () => {
            const graph1 = new Graph();
            graph1.addNode("a", {type: "red"});
            graph1.addNode("b", {type: "blue"});
            graph1.addEdge("a", "b");

            const graph2 = new Graph();
            graph2.addNode("x", {type: "red"});
            graph2.addNode("y", {type: "blue"});
            graph2.addEdge("x", "y");

            const nodeMatch = (n1: string, n2: string, g1: Graph, g2: Graph) => {
                const data1 = g1.getNode(n1)?.data;
                const data2 = g2.getNode(n2)?.data;
                return data1?.type === data2?.type;
            };

            const result = isGraphIsomorphic(graph1, graph2, {nodeMatch});

            expect(result.isIsomorphic).toBe(true);
            expect(result.mapping!.get("a")).toBe("x");
            expect(result.mapping!.get("b")).toBe("y");
        });

        it("should use edge match predicate", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b", 1);
            graph1.addEdge("b", "c", 2);

            const graph2 = new Graph();
            graph2.addEdge("x", "y", 1);
            graph2.addEdge("y", "z", 2);

            const edgeMatch = (e1: [string, string], e2: [string, string], g1: Graph, g2: Graph) => {
                const weight1 = g1.getEdge(e1[0], e1[1])?.weight;
                const weight2 = g2.getEdge(e2[0], e2[1])?.weight;
                return weight1 === weight2;
            };

            const result = isGraphIsomorphic(graph1, graph2, {edgeMatch});

            expect(result.isIsomorphic).toBe(true);
        });

        it("should detect non-isomorphic graphs with different edge counts", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");

            const graph2 = new Graph();
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("z", "x");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(false);
        });

        it("should handle self-loops", () => {
            const graph1 = new Graph({allowSelfLoops: true});
            graph1.addEdge("a", "a");
            graph1.addEdge("a", "b");

            const graph2 = new Graph({allowSelfLoops: true});
            graph2.addEdge("x", "x");
            graph2.addEdge("x", "y");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
        });

        it("should detect non-isomorphic graphs with different degree sequences", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("a", "c");
            graph1.addEdge("a", "d");

            const graph2 = new Graph();
            graph2.addEdge("w", "x");
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(false);
        });

        it("should handle complete graphs", () => {
            const graph1 = new Graph();
            const nodes1 = ["a", "b", "c"];
            for (let i = 0; i < nodes1.length; i++) {
                for (let j = i + 1; j < nodes1.length; j++) {
                    graph1.addEdge(nodes1[i], nodes1[j]);
                }
            }

            const graph2 = new Graph();
            const nodes2 = ["x", "y", "z"];
            for (let i = 0; i < nodes2.length; i++) {
                for (let j = i + 1; j < nodes2.length; j++) {
                    graph2.addEdge(nodes2[i], nodes2[j]);
                }
            }

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
        });

        it("should handle graphs with different directedness", () => {
            const graph1 = new Graph({directed: true});
            graph1.addEdge("a", "b");

            const graph2 = new Graph({directed: false});
            graph2.addEdge("x", "y");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(false);
        });
    });

    describe("findAllIsomorphisms", () => {
        it("should find at least one isomorphism for symmetric graphs", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("c", "a");

            const graph2 = new Graph();
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("z", "x");

            const mappings = findAllIsomorphisms(graph1, graph2);

            expect(mappings.length).toBeGreaterThanOrEqual(1); // At least one isomorphism

            // Verify all mappings are valid
            for (const mapping of mappings) {
                expect(mapping.size).toBe(3);
                // Check that edges are preserved
                for (const [n1, n2] of mapping) {
                    for (const [m1, m2] of mapping) {
                        if (graph1.hasEdge(n1, m1)) {
                            expect(graph2.hasEdge(n2, m2)).toBe(true);
                        }
                    }
                }
            }
        });

        it("should find single isomorphism for asymmetric graphs", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("b", "d");

            const graph2 = new Graph();
            graph2.addEdge("w", "x");
            graph2.addEdge("x", "y");
            graph2.addEdge("x", "z");

            const mappings = findAllIsomorphisms(graph1, graph2);

            expect(mappings.length).toBeGreaterThan(0);

            // b must map to x (both have degree 3)
            for (const mapping of mappings) {
                expect(mapping.get("b")).toBe("x");
            }
        });

        it("should return empty array for non-isomorphic graphs", () => {
            const graph1 = new Graph();
            graph1.addEdge("a", "b");

            const graph2 = new Graph();
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");

            const mappings = findAllIsomorphisms(graph1, graph2);

            expect(mappings).toHaveLength(0);
        });

        it("should handle empty graphs", () => {
            const graph1 = new Graph();
            const graph2 = new Graph();

            const mappings = findAllIsomorphisms(graph1, graph2);

            expect(mappings).toHaveLength(1);
            expect(mappings[0].size).toBe(0);
        });
    });

    describe("performance", () => {
        it("should handle moderately sized graphs", () => {
            const graph1 = new Graph();
            const graph2 = new Graph();

            // Create two isomorphic graphs with 10 nodes
            for (let i = 0; i < 10; i++) {
                graph1.addNode(i.toString());
                graph2.addNode((i + 10).toString());
            }

            // Add same edge pattern to both
            for (let i = 0; i < 10; i++) {
                graph1.addEdge(i.toString(), ((i + 1) % 10).toString());
                graph2.addEdge((i + 10).toString(), (((i + 1) % 10) + 10).toString());
            }

            const start = Date.now();
            const result = isGraphIsomorphic(graph1, graph2);
            const duration = Date.now() - start;

            expect(result.isIsomorphic).toBe(true);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe("edge cases", () => {
        it("should handle graphs with isolated nodes", () => {
            const graph1 = new Graph();
            graph1.addNode("a");
            graph1.addNode("b");
            graph1.addEdge("c", "d");

            const graph2 = new Graph();
            graph2.addNode("w");
            graph2.addNode("x");
            graph2.addEdge("y", "z");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
        });

        it("should handle complex directed graphs", () => {
            const graph1 = new Graph({directed: true});
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");
            graph1.addEdge("c", "d");
            graph1.addEdge("d", "a");
            graph1.addEdge("a", "c");

            const graph2 = new Graph({directed: true});
            graph2.addEdge("w", "x");
            graph2.addEdge("x", "y");
            graph2.addEdge("y", "z");
            graph2.addEdge("z", "w");
            graph2.addEdge("w", "y");

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(true);
        });

        it("should detect non-isomorphic graphs with same structure but different edge directions", () => {
            const graph1 = new Graph({directed: true});
            graph1.addEdge("a", "b");
            graph1.addEdge("b", "c");

            const graph2 = new Graph({directed: true});
            graph2.addEdge("x", "y");
            graph2.addEdge("z", "y"); // Different direction

            const result = isGraphIsomorphic(graph1, graph2);

            expect(result.isIsomorphic).toBe(false);
        });
    });
});
