/**
 * Optimized graph algorithm implementations
 *
 * High-performance implementations using:
 * - Direction-Optimized BFS
 * - Compressed Sparse Row (CSR) format
 * - Bit-packed data structures
 */

// Configuration and optimization control
export {
    configureOptimizations,
    getOptimizationConfig,
    type GraphAlgorithmConfig,
} from "./graph-adapter.js";

// Note: The main BFS functions in algorithms/traversal/bfs.ts automatically
// use these optimizations for large graphs (>10k nodes) when optimizations are enabled.
// No manual configuration needed - just use breadthFirstSearch, shortestPathBFS, etc.
//
// The previously exported bfsOptimized, shortestPathBFSOptimized, and
// singleSourceShortestPathBFSOptimized functions have been removed since they
// are no longer needed. All optimization happens automatically.

// BFS optimization functions have been removed. The main BFS functions
// (breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS)
// in algorithms/traversal/bfs.ts now automatically use optimizations
// for large graphs without requiring manual configuration.

// Export data structures for advanced users
export {CompactDistanceArray, GraphBitSet, VisitedBitArray} from "./bit-packed.js";
export {CSRGraph} from "./csr-graph.js";
export {DirectionOptimizedBFS} from "./direction-optimized-bfs.js";

// Export utilities
export {createOptimizedGraph, isCSRGraph, toCSRGraph} from "./graph-adapter.js";
