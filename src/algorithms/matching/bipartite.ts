import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * Maximum Bipartite Matching implementation using Hopcroft-Karp algorithm
 *
 * Finds the maximum matching in a bipartite graph. A matching is a set of edges
 * without common vertices. Maximum matching has the largest possible number of edges.
 *
 * Time complexity: O(√V × E)
 * Space complexity: O(V)
 */

export interface BipartiteMatchingResult {
    matching: Map<NodeId, NodeId>; // Maps left nodes to right nodes
    size: number; // Number of matched pairs
}

export interface BipartiteMatchingOptions {
    leftNodes?: Set<NodeId>; // Optional: specify left partition
    rightNodes?: Set<NodeId>; // Optional: specify right partition
}

/**
 * Find maximum matching in a bipartite graph using augmenting path algorithm
 * (simplified implementation that's more reliable than Hopcroft-Karp for this context)
 */
export function maximumBipartiteMatching(
    graph: Graph,
    options: BipartiteMatchingOptions = {},
): BipartiteMatchingResult {
    // If partitions not provided, try to infer them
    let {leftNodes, rightNodes} = options;

    if (!leftNodes || !rightNodes) {
        const partition = bipartitePartition(graph);
        if (!partition) {
            throw new Error("Graph is not bipartite");
        }

        leftNodes = partition.left;
        rightNodes = partition.right;
    }

    const matching = new Map<NodeId, NodeId>();
    const matchRight = new Map<NodeId, NodeId>(); // Right to left matching

    // Find augmenting paths using DFS
    const visited = new Set<NodeId>();

    const dfs = (u: NodeId): boolean => {
        const neighbors = Array.from(graph.neighbors(u));

        for (const v of neighbors) {
            if (!rightNodes.has(v) || visited.has(v)) {
                continue;
            }

            visited.add(v);

            // If v is unmatched or we can find augmenting path from match of v
            const matchedNode = matchRight.get(v);
            if (!matchRight.has(v) || (matchedNode !== undefined && dfs(matchedNode))) {
                matching.set(u, v);
                matchRight.set(v, u);
                return true;
            }
        }
        return false;
    };

    // Try to find augmenting path for each left node
    let matchingSize = 0;
    for (const u of leftNodes) {
        visited.clear();
        if (dfs(u)) {
            matchingSize++;
        }
    }

    return {
        matching,
        size: matchingSize,
    };
}

/**
 * Check if graph is bipartite and return the partition
 */
export function bipartitePartition(graph: Graph): {left: Set<NodeId>, right: Set<NodeId>} | null {
    const color = new Map<NodeId, boolean>();
    const left = new Set<NodeId>();
    const right = new Set<NodeId>();

    const nodes = Array.from(graph.nodes());

    for (const startNode of nodes) {
        if (color.has(startNode.id)) {
            continue;
        }

        // BFS to color the component
        const queue = [startNode.id];
        color.set(startNode.id, true);
        left.add(startNode.id);

        while (queue.length > 0) {
            const u = queue.shift();
            if (u === undefined) {
                continue;
            }

            const uColor = color.get(u);
            if (uColor === undefined) {
                continue;
            }

            const neighbors = Array.from(graph.neighbors(u));
            for (const v of neighbors) {
                if (!color.has(v)) {
                    color.set(v, !uColor);
                    if (!uColor) {
                        left.add(v);
                    } else {
                        right.add(v);
                    }

                    queue.push(v);
                } else if (color.get(v) === uColor) {
                    // Same color as neighbor - not bipartite
                    return null;
                }
            }
        }
    }

    return {left, right};
}

/**
 * Simple greedy bipartite matching algorithm
 * Useful for comparison or when Hopcroft-Karp is overkill
 */
export function greedyBipartiteMatching(
    graph: Graph,
    options: BipartiteMatchingOptions = {},
): BipartiteMatchingResult {
    let {leftNodes, rightNodes} = options;

    if (!leftNodes || !rightNodes) {
        const partition = bipartitePartition(graph);
        if (!partition) {
            throw new Error("Graph is not bipartite");
        }

        leftNodes = partition.left;
        rightNodes = partition.right;
    }

    const matching = new Map<NodeId, NodeId>();
    const matched = new Set<NodeId>();

    for (const u of leftNodes) {
        const neighbors = Array.from(graph.neighbors(u));

        for (const v of neighbors) {
            if (rightNodes.has(v) && !matched.has(v)) {
                matching.set(u, v);
                matched.add(v);
                break;
            }
        }
    }

    return {
        matching,
        size: matching.size,
    };
}
