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
