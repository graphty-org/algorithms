/**
 * Reconstructs a path from source to target using a predecessor map
 * @param target - The target node
 * @param predecessor - Map of node to its predecessor in the path
 * @returns Array of nodes from source to target, or empty array if no path exists
 */
export function reconstructPath<T>(
    target: T,
    predecessor: Map<T, T | null>,
): T[] {
    const path: T[] = [];
    let current: T | null = target;

    // Build path backwards from target to source
    while (current !== null) {
        path.unshift(current);
        const pred = predecessor.get(current);
        if (pred === undefined) {
            // No path exists
            return [];
        }

        current = pred;
    }

    return path;
}
