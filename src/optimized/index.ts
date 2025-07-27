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
// use these optimizations when enabled via configureOptimizations()

// Export optimized implementations for direct use if needed
export {
    bfsOptimized,
    type OptimizedBFSOptions,
    shortestPathBFSOptimized,
    singleSourceShortestPathBFSOptimized} from "./bfs-optimized.js";

// Export data structures for advanced users
export {CompactDistanceArray, GraphBitSet, VisitedBitArray} from "./bit-packed.js";
export {CSRGraph} from "./csr-graph.js";
export {DirectionOptimizedBFS} from "./direction-optimized-bfs.js";

// Export utilities
export {createOptimizedGraph, isCSRGraph, toCSRGraph} from "./graph-adapter.js";
