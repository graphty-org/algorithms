import {graphNode} from "../utils/graphNode.js";
import {MinPriorityQueue} from "../utils/priorityQueue.js";
import {pathfindingUtils} from "./utils.js";

/**
 * A* pathfinding algorithm
 * Finds the shortest path from start to goal using a heuristic function
 *
 * @param graph - The graph represented as an adjacency list
 * @param start - The starting node
 * @param goal - The goal node
 * @param heuristic - Heuristic function that estimates distance from node to goal
 * @returns Object containing the shortest path and its cost, or null if no path exists
 *
 * Time Complexity: O(E) with good heuristic, O(b^d) worst case
 * Space Complexity: O(V)
 */
export function astar<T>(
    graph: Map<T, Map<T, number>>,
    start: T,
    goal: T,
    heuristic: (node: T, goal: T) => number,
): {path: T[], cost: number} | null {
    if (!graph.has(start) || !graph.has(goal)) {
        return null;
    }

    // Priority queue ordered by f(n) = g(n) + h(n)
    const openSet = new MinPriorityQueue<graphNode<T>>();
    const gScore = new Map<T, number>(); // Cost from start to node
    const fScore = new Map<T, number>(); // Estimated total cost
    const cameFrom = new Map<T, T>();
    const closedSet = new Set<T>();

    // Initialize start node
    gScore.set(start, 0);
    fScore.set(start, heuristic(start, goal));
    const startFScore = fScore.get(start);
    if (startFScore === undefined) {
        return null;
    }

    openSet.insert({node: start, distance: startFScore});

    while (!openSet.isEmpty()) {
        const current = openSet.extractMin();
        if (!current) {
            break;
        }

        const currentNode = current.node;

        if (currentNode === goal) {
            // Reconstruct path
            const path = pathfindingUtils.reconstructPath(cameFrom, goal);
            const goalCost = gScore.get(goal);
            if (goalCost === undefined) {
                return null;
            }

            return {path, cost: goalCost};
        }

        closedSet.add(currentNode);

        const neighbors = graph.get(currentNode);
        if (!neighbors) {
            continue;
        }

        for (const [neighbor, weight] of neighbors) {
            if (closedSet.has(neighbor)) {
                continue;
            }

            const currentNodeGScore = gScore.get(currentNode);
            if (currentNodeGScore === undefined) {
                continue;
            }

            const tentativeGScore = currentNodeGScore + weight;
            const currentGScore = gScore.get(neighbor) ?? Infinity;

            if (tentativeGScore < currentGScore) {
                // This path to neighbor is better
                cameFrom.set(neighbor, currentNode);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal));

                // Add to open set if not already there
                const neighborFScore = fScore.get(neighbor);
                if (neighborFScore !== undefined) {
                    openSet.insert({node: neighbor, distance: neighborFScore});
                }
            }
        }
    }

    return null; // No path found
}

/**
 * A* pathfinding with path reconstruction details
 * Returns detailed information about the search process
 */
export function astarWithDetails<T>(
    graph: Map<T, Map<T, number>>,
    start: T,
    goal: T,
    heuristic: (node: T, goal: T) => number,
): {
        path: T[] | null;
        cost: number;
        visited: Set<T>;
        gScores: Map<T, number>;
        fScores: Map<T, number>;
    } {
    const openSet = new MinPriorityQueue<graphNode<T>>();
    const gScore = new Map<T, number>();
    const fScore = new Map<T, number>();
    const cameFrom = new Map<T, T>();
    const closedSet = new Set<T>();

    gScore.set(start, 0);
    fScore.set(start, heuristic(start, goal));
    const startFScore = fScore.get(start);
    if (startFScore === undefined) {
        return {
            path: null,
            cost: Infinity,
            visited: new Set(),
            gScores: new Map(),
            fScores: new Map(),
        };
    }

    openSet.insert({node: start, distance: startFScore});

    while (!openSet.isEmpty()) {
        const current = openSet.extractMin();
        if (!current) {
            break;
        }

        const currentNode = current.node;

        if (currentNode === goal) {
            const path = pathfindingUtils.reconstructPath(cameFrom, goal);
            return {
                path,
                cost: gScore.get(goal) ?? Infinity,
                visited: closedSet,
                gScores: gScore,
                fScores: fScore,
            };
        }

        closedSet.add(currentNode);

        const neighbors = graph.get(currentNode);
        if (!neighbors) {
            continue;
        }

        for (const [neighbor, weight] of neighbors) {
            if (closedSet.has(neighbor)) {
                continue;
            }

            const currentNodeGScore = gScore.get(currentNode);
            if (currentNodeGScore === undefined) {
                continue;
            }

            const tentativeGScore = currentNodeGScore + weight;
            const currentGScore = gScore.get(neighbor) ?? Infinity;

            if (tentativeGScore < currentGScore) {
                cameFrom.set(neighbor, currentNode);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal));
                const neighborFScore = fScore.get(neighbor);
                if (neighborFScore !== undefined) {
                    openSet.insert({node: neighbor, distance: neighborFScore});
                }
            }
        }
    }

    return {
        path: null,
        cost: Infinity,
        visited: closedSet,
        gScores: gScore,
        fScores: fScore,
    };
}

/**
 * Common heuristic functions for A*
 */
export const heuristics = {
    /**
   * Manhattan distance heuristic for grid-based graphs
   */
    manhattan: (a: [number, number], b: [number, number]): number => {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    },

    /**
   * Euclidean distance heuristic
   */
    euclidean: (a: [number, number], b: [number, number]): number => {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    },

    /**
   * Chebyshev distance heuristic (diagonal movement allowed)
   */
    chebyshev: (a: [number, number], b: [number, number]): number => {
        return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
    },

    /**
   * Zero heuristic (makes A* behave like Dijkstra)
   */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    zero: <T>(_a: T, _b: T): number => 0,
};
