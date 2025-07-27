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
  type GraphAlgorithmConfig 
} from "./graph-adapter.js";

// Note: The main BFS functions in algorithms/traversal/bfs.ts automatically
// use these optimizations when enabled via configureOptimizations()

// Export optimized implementations for direct use if needed
export {
  bfsOptimized,
  shortestPathBFSOptimized,
  singleSourceShortestPathBFSOptimized,
  type OptimizedBFSOptions
} from "./bfs-optimized.js";

// Export data structures for advanced users
export { CSRGraph } from "./csr-graph.js";
export { GraphBitSet, VisitedBitArray, CompactDistanceArray } from "./bit-packed.js";
export { DirectionOptimizedBFS } from "./direction-optimized-bfs.js";

// Export utilities
export { toCSRGraph, isCSRGraph, createOptimizedGraph } from "./graph-adapter.js";