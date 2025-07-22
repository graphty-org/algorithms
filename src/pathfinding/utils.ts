/**
 * Utility functions for pathfinding algorithms
 */

export const pathfindingUtils = {
    /**
   * Reconstructs a path from start to goal using the cameFrom map
   */
    reconstructPath<T>(cameFrom: Map<T, T>, goal: T): T[] {
        const path: T[] = [goal];
        let current = goal;

        while (cameFrom.has(current)) {
            const next = cameFrom.get(current);
            if (next === undefined) {
                break;
            }

            current = next;
            path.unshift(current);
        }

        return path;
    },

    /**
   * Creates a grid graph for testing pathfinding algorithms
   */
    createGridGraph(
        width: number,
        height: number,
        obstacles = new Set<string>(),
    ): Map<string, Map<string, number>> {
        const graph = new Map<string, Map<string, number>>();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const node = `${String(x)},${String(y)}`;
                if (obstacles.has(node)) {
                    continue;
                }

                const neighbors = new Map<string, number>();

                // Add 4-directional neighbors
                const directions = [
                    [0, 1], [1, 0], [0, -1], [-1, 0],
                ];

                for (const dir of directions) {
                    const dx = dir[0];
                    const dy = dir[1];
                    if (dx === undefined || dy === undefined) {
                        continue;
                    }

                    const nx = x + dx;
                    const ny = y + dy;
                    const neighbor = `${String(nx)},${String(ny)}`;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && !obstacles.has(neighbor)) {
                        neighbors.set(neighbor, 1); // Unit cost for grid movement
                    }
                }

                graph.set(node, neighbors);
            }
        }

        return graph;
    },

    /**
   * Parses a grid coordinate string
   */
    parseGridCoordinate(coord: string): [number, number] {
        const parts = coord.split(",").map(Number);
        const x = parts[0];
        const y = parts[1];
        if (x === undefined || y === undefined) {
            throw new Error(`Invalid coordinate: ${coord}`);
        }

        return [x, y];
    },
};

