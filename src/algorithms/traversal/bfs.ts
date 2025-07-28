/**
 * Breadth-First Search (BFS) implementation
 *
 * Explores graph level by level from a starting node. Guarantees shortest path
 * in unweighted graphs and can be used for various graph analysis tasks.
 *
 * Automatically uses optimized implementations for large graphs (>10k nodes)
 * to provide the best performance without requiring manual configuration.
 */

// Re-export unified implementations that automatically optimize for large graphs
export {
    breadthFirstSearch,
    isBipartite,
    shortestPathBFS,
    singleSourceShortestPathBFS,
} from "./bfs-unified.js";

