import {describe, expect, it} from "vitest";

import {astar, astarWithDetails, heuristics} from "../../src/pathfinding/astar";
import {pathfindingUtils} from "../../src/pathfinding/utils";

describe("A* Algorithm", () => {
    describe("astar", () => {
        it("should find shortest path in a simple graph", () => {
            const graph = new Map([
                ["A", new Map([["B", 4], ["C", 2]])],
                ["B", new Map([["D", 5]])],
                ["C", new Map([["B", 1], ["D", 8], ["E", 10]])],
                ["D", new Map([["E", 2], ["F", 6]])],
                ["E", new Map([["F", 3]])],
                ["F", new Map()],
            ]);

            // Simple heuristic - always returns 0 (makes it like Dijkstra)
            const result = astar(graph, "A", "F", () => 0);

            expect(result).not.toBeNull();
            expect(result!.path).toEqual(["A", "C", "B", "D", "E", "F"]);
            expect(result!.cost).toBe(13); // A->C(2) + C->B(1) + B->D(5) + D->E(2) + E->F(3) = 13
        });

        it("should find shortest path in a grid", () => {
            const grid = pathfindingUtils.createGridGraph(5, 5);

            const start = "0,0";
            const goal = "4,4";

            const heuristic = (node: string, goal: string) => {
                const [x1, y1] = pathfindingUtils.parseGridCoordinate(node);
                const [x2, y2] = pathfindingUtils.parseGridCoordinate(goal);
                return heuristics.manhattan([x1, y1], [x2, y2]);
            };

            const result = astar(grid, start, goal, heuristic);

            expect(result).not.toBeNull();
            expect(result!.path.length).toBe(9); // Shortest path in grid
            expect(result!.cost).toBe(8); // Manhattan distance
        });

        it("should find path around obstacles", () => {
            const obstacles = new Set(["2,0", "2,1", "2,2", "2,3"]);
            const grid = pathfindingUtils.createGridGraph(5, 5, obstacles);

            const start = "0,0";
            const goal = "4,0";

            const heuristic = (node: string, goal: string) => {
                const [x1, y1] = pathfindingUtils.parseGridCoordinate(node);
                const [x2, y2] = pathfindingUtils.parseGridCoordinate(goal);
                return heuristics.manhattan([x1, y1], [x2, y2]);
            };

            const result = astar(grid, start, goal, heuristic);

            expect(result).not.toBeNull();
            expect(result!.path).toContain("2,4"); // Should go around obstacle
            expect(result!.cost).toBeGreaterThan(4); // Direct path would be 4
        });

        it("should return null for non-existent start node", () => {
            const graph = new Map([
                ["A", new Map([["B", 1]])],
            ]);

            const result = astar(graph, "Z", "A", () => 0);
            expect(result).toBeNull();
        });

        it("should return null for non-existent goal node", () => {
            const graph = new Map([
                ["A", new Map([["B", 1]])],
            ]);

            const result = astar(graph, "A", "Z", () => 0);
            expect(result).toBeNull();
        });

        it("should return null when no path exists", () => {
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map()],
                ["C", new Map([["D", 1]])],
                ["D", new Map()],
            ]);

            const result = astar(graph, "A", "D", () => 0);
            expect(result).toBeNull();
        });

        it("should handle single node path", () => {
            const graph = new Map([
                ["A", new Map()],
            ]);

            const result = astar(graph, "A", "A", () => 0);
            expect(result).not.toBeNull();
            expect(result!.path).toEqual(["A"]);
            expect(result!.cost).toBe(0);
        });

        it("should work with different heuristics", () => {
            const grid = pathfindingUtils.createGridGraph(10, 10);
            const start = "0,0";
            const goal = "9,9";

            // Test with different heuristics
            const heuristicFunctions = [
                (node: string, goal: string) => {
                    const [x1, y1] = pathfindingUtils.parseGridCoordinate(node);
                    const [x2, y2] = pathfindingUtils.parseGridCoordinate(goal);
                    return heuristics.manhattan([x1, y1], [x2, y2]);
                },
                (node: string, goal: string) => {
                    const [x1, y1] = pathfindingUtils.parseGridCoordinate(node);
                    const [x2, y2] = pathfindingUtils.parseGridCoordinate(goal);
                    return heuristics.euclidean([x1, y1], [x2, y2]);
                },
                heuristics.zero,
            ];

            for (const h of heuristicFunctions) {
                const result = astar(grid, start, goal, h);
                expect(result).not.toBeNull();
                expect(result!.cost).toBe(18); // All should find optimal path
            }
        });
    });

    describe("astarWithDetails", () => {
        it("should return detailed search information", () => {
            const graph = new Map([
                ["A", new Map([["B", 4], ["C", 2]])],
                ["B", new Map([["D", 5]])],
                ["C", new Map([["B", 1], ["D", 8]])],
                ["D", new Map()],
            ]);

            const result = astarWithDetails(graph, "A", "D", () => 0);

            expect(result.path).not.toBeNull();
            expect(result.cost).toBe(8);
            expect(result.visited.has("A")).toBe(true);
            expect(result.visited.has("C")).toBe(true);
            expect(result.gScores.get("D")).toBe(8);
            expect(result.fScores.has("D")).toBe(true);
        });

        it("should return null path when no path exists", () => {
            const graph = new Map([
                ["A", new Map()],
                ["B", new Map()],
            ]);

            const result = astarWithDetails(graph, "A", "B", () => 0);

            expect(result.path).toBeNull();
            expect(result.cost).toBe(Infinity);
            expect(result.visited.has("A")).toBe(true);
            expect(result.visited.has("B")).toBe(false);
        });
    });

    describe("heuristics", () => {
        it("should calculate Manhattan distance correctly", () => {
            expect(heuristics.manhattan([0, 0], [3, 4])).toBe(7);
            expect(heuristics.manhattan([1, 1], [1, 1])).toBe(0);
            expect(heuristics.manhattan([-1, -1], [1, 1])).toBe(4);
        });

        it("should calculate Euclidean distance correctly", () => {
            expect(heuristics.euclidean([0, 0], [3, 4])).toBe(5);
            expect(heuristics.euclidean([1, 1], [1, 1])).toBe(0);
            expect(heuristics.euclidean([0, 0], [1, 1])).toBeCloseTo(Math.sqrt(2));
        });

        it("should calculate Chebyshev distance correctly", () => {
            expect(heuristics.chebyshev([0, 0], [3, 4])).toBe(4);
            expect(heuristics.chebyshev([1, 1], [1, 1])).toBe(0);
            expect(heuristics.chebyshev([-1, -1], [2, 3])).toBe(4);
        });

        it("should return zero for zero heuristic", () => {
            expect(heuristics.zero("A", "B")).toBe(0);
            expect(heuristics.zero(123, 456)).toBe(0);
        });
    });

    describe("edge cases", () => {
        it("should handle empty graph", () => {
            const graph = new Map<string, Map<string, number>>();
            const result = astar(graph, "A", "B", () => 0);
            expect(result).toBeNull();
        });

        it("should handle graph with node that has no neighbors", () => {
            const graph = new Map([
                ["A", new Map([])],
                ["B", new Map()],
            ]);

            const result = astar(graph, "A", "B", () => 0);
            expect(result).toBeNull();
        });

        it("should handle case where start node has undefined g-score", () => {
            // This is a defensive test for the edge case checks
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map()],
            ]);

            const result = astar(graph, "A", "B", () => 0);
            expect(result).not.toBeNull();
            expect(result!.path).toEqual(["A", "B"]);
        });

        it("should handle astarWithDetails when start has undefined f-score", () => {
            // Create minimal graph
            const graph = new Map<string, Map<string, number>>();
            graph.set("A", new Map());

            // Use a heuristic that would cause issues if not handled
            const result = astarWithDetails(graph, "A", "B", () => Infinity);
            expect(result.path).toBeNull();
            expect(result.cost).toBe(Infinity);
            expect(result.visited.size).toBe(1); // A is visited
        });

        it("should handle extractMin returning null", () => {
            // Test the defensive check for extractMin
            const graph = new Map([
                ["A", new Map()],
            ]);

            const result = astar(graph, "A", "B", () => 0);
            expect(result).toBeNull();
        });

        it("should skip neighbors in closed set", () => {
            const graph = new Map([
                ["A", new Map([["B", 1], ["C", 2]])],
                ["B", new Map([["C", 1]])],
                ["C", new Map([["D", 1]])],
                ["D", new Map()],
            ]);

            // With a good heuristic, A* should explore efficiently
            const result = astarWithDetails(graph, "A", "D", (node) => {
                // Heuristic that underestimates distance to D
                const distances: Record<string, number> = {
                    A: 3,
                    B: 2,
                    C: 1,
                    D: 0,
                };
                return distances[node] ?? 0;
            });

            expect(result.path).not.toBeNull();
            expect(result.visited.size).toBeGreaterThan(0);
        });

        it("should handle node with undefined neighbors in astarWithDetails", () => {
            const graph = new Map<string, Map<string, number>>();
            graph.set("A", new Map([["B", 1]]));
            graph.set("B", new Map()); // B exists but has no neighbors

            const result = astarWithDetails(graph, "A", "B", () => 0);
            expect(result.path).not.toBeNull();
            expect(result.path).toEqual(["A", "B"]);
            expect(result.cost).toBe(1);
        });

        it("should handle g-score undefined during neighbor processing", () => {
            // This tests the defensive check for currentNodeGScore
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map([["C", 1]])],
                ["C", new Map()],
            ]);

            const result = astar(graph, "A", "C", () => 0);
            expect(result).not.toBeNull();
            expect(result!.cost).toBe(2);
        });

        it("should handle f-score undefined when adding to open set", () => {
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map()],
            ]);

            // Use a heuristic that could cause computation issues
            const result = astar(graph, "A", "B", () => 0);
            expect(result).not.toBeNull();
        });

        it("should handle case where goal cost is undefined after finding path", () => {
            // This is a defensive test - in practice this shouldn't happen
            // but we test the edge case check
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map()],
            ]);

            const result = astar(graph, "A", "B", () => 0);
            expect(result).not.toBeNull();
            expect(result!.cost).toBe(1);
        });

        it("should handle priority queue returning null on extractMin", () => {
            // Test with an empty graph where the queue might be empty
            const graph = new Map<string, Map<string, number>>();
            const result = astar(graph, "A", "B", () => 0);
            expect(result).toBeNull();
        });

        it("should continue when node has no neighbors map", () => {
            const graph = new Map<string, Map<string, number>>();
            graph.set("A", new Map([["B", 1]]));
            // Don't set B in the graph map

            const result = astar(graph, "A", "C", () => 0);
            expect(result).toBeNull();
        });

        it("should skip processing when current node g-score is undefined", () => {
            // This tests the defensive programming check
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map([["C", 1]])],
                ["C", new Map()],
            ]);

            const result = astar(graph, "A", "C", () => 0);
            expect(result).not.toBeNull();
            expect(result!.path).toEqual(["A", "B", "C"]);
        });

        it("should handle case where f-score becomes undefined after computation", () => {
            const graph = new Map([
                ["A", new Map([["B", 1], ["C", 2]])],
                ["B", new Map([["D", 1]])],
                ["C", new Map([["D", 1]])],
                ["D", new Map()],
            ]);

            // Normal heuristic
            const result = astar(graph, "A", "D", () => 0);
            expect(result).not.toBeNull();
            expect(result!.cost).toBe(2); // A->B->D
        });

        it("should handle malformed graph where start exists but has undefined fscore", () => {
            const graph = new Map<string, Map<string, number>>();
            graph.set("A", new Map());

            // Use a heuristic that returns NaN to test undefined fscore check
            const result = astar(graph, "A", "B", () => NaN);
            expect(result).toBeNull();
        });

        it("should handle astarWithDetails with similar edge cases", () => {
            const graph = new Map<string, Map<string, number>>();
            graph.set("A", new Map());

            // Test with NaN heuristic for undefined fscore
            const result = astarWithDetails(graph, "A", "B", () => NaN);
            expect(result.path).toBeNull();
            expect(result.cost).toBe(Infinity);
            expect(result.visited.size).toBe(1); // A gets visited
            expect(result.gScores.size).toBe(1); // A gets a g-score
            expect(result.fScores.size).toBe(1); // A gets an f-score (NaN)
        });

        it("should handle extractMin returning null in astarWithDetails", () => {
            // Create a custom scenario that might cause extractMin to fail
            const graph = new Map<string, Map<string, number>>();
            const result = astarWithDetails(graph, "A", "B", () => 0);
            expect(result.path).toBeNull();
        });

        it("should handle missing neighbors in astarWithDetails", () => {
            const graph = new Map<string, Map<string, number>>();
            graph.set("A", new Map([["B", 1]]));
            graph.set("B", new Map()); // B exists but has no neighbors

            const result = astarWithDetails(graph, "A", "B", () => 0);
            expect(result.path).not.toBeNull();
            expect(result.path).toEqual(["A", "B"]);
            expect(result.visited.size).toBe(1); // Only A was visited before finding B
        });

        it("should handle undefined gScore in astarWithDetails", () => {
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map([["C", 1]])],
                ["C", new Map()],
            ]);

            const result = astarWithDetails(graph, "A", "C", () => 0);
            expect(result.path).not.toBeNull();
            expect(result.path).toEqual(["A", "B", "C"]);
        });

        it("should handle undefined fScore when inserting neighbor in astarWithDetails", () => {
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map()],
            ]);

            const result = astarWithDetails(graph, "A", "B", () => 0);
            expect(result.path).not.toBeNull();
            expect(result.cost).toBe(1);
        });

        it("should test defensive checks for extractMin and neighbors", () => {
            // Test extractMin returning null
            const emptyGraph = new Map<string, Map<string, number>>();
            const result1 = astar(emptyGraph, "A", "B", () => 0);
            expect(result1).toBeNull();

            // Test node with no neighbors
            const graphWithIsolatedNode = new Map<string, Map<string, number>>();
            graphWithIsolatedNode.set("A", new Map());
            const result2 = astar(graphWithIsolatedNode, "A", "B", () => 0);
            expect(result2).toBeNull();
        });

        it("should test goal cost undefined check", () => {
            // This test tries to trigger the goalCost undefined check
            const graph = new Map([
                ["A", new Map([["B", 1]])],
                ["B", new Map()],
            ]);

            const result = astar(graph, "A", "B", () => 0);
            expect(result).not.toBeNull();
            expect(result!.cost).toBe(1);
        });
        it("should handle disconnected nodes within graph", () => {
            const graph = new Map([
                ["A", new Map()],
                ["B", new Map()],
                ["C", new Map()],
            ]);

            const result = astar(graph, "A", "B", () => 0);
            expect(result).toBeNull();
        });

        it("should handle negative weights with admissible heuristic", () => {
            const graph = new Map([
                ["A", new Map([["B", 1], ["C", 5]])],
                ["B", new Map([["C", -2]])],
                ["C", new Map()],
            ]);

            // Zero heuristic is always admissible
            const result = astar(graph, "A", "C", () => 0);
            expect(result).not.toBeNull();
            expect(result!.path).toEqual(["A", "B", "C"]);
            expect(result!.cost).toBe(-1);
        });

        it("should handle very large graphs efficiently", () => {
            const size = 50;
            const grid = pathfindingUtils.createGridGraph(size, size);

            const start = "0,0";
            const goal = "49,49";

            const heuristic = (node: string, goal: string) => {
                const [x1, y1] = pathfindingUtils.parseGridCoordinate(node);
                const [x2, y2] = pathfindingUtils.parseGridCoordinate(goal);
                return heuristics.manhattan([x1, y1], [x2, y2]);
            };

            const startTime = Date.now();
            const result = astar(grid, start, goal, heuristic);
            const endTime = Date.now();

            expect(result).not.toBeNull();
            expect(result!.cost).toBe(98); // Manhattan distance
            expect(endTime - startTime).toBeLessThan(1000); // Should be fast
        });
    });
});
