# Benchmark Summary

## Overview

We successfully developed benchmarks for the remaining algorithms in the @graphty/algorithms package, bringing the total coverage from 6 algorithms (19.4%) to 17 algorithms tested.

## Algorithms Benchmarked

### Previously Benchmarked (6)
1. BFS (Breadth-First Search)
2. DFS (Depth-First Search)
3. Dijkstra's Algorithm
4. PageRank
5. Connected Components
6. HITS

### Newly Added Benchmarks (11)
1. **Degree Centrality** - O(V) complexity
2. **Betweenness Centrality** - O(V*E) complexity
3. **Closeness Centrality** - O(V²) complexity
4. **Eigenvector Centrality** - O(V*E*iterations) complexity
5. **Katz Centrality** - O(V*E*iterations) complexity
6. **Floyd-Warshall** - O(V³) complexity
7. **Bellman-Ford** - O(V*E) complexity
8. **Kruskal's MST** - O(E log E) complexity
9. **K-Core Decomposition** - O(V+E) complexity
10. **Common Neighbors** - O(V²*avg_degree) complexity
11. **Maximum Bipartite Matching** - O(√V × E) complexity

## Key Features

### Quick and Comprehensive Modes
- **Quick mode**: Smaller graphs, fewer iterations for rapid testing
- **Comprehensive mode**: Larger graphs, more iterations for thorough analysis

### Graph Types Tested
- Sparse graphs (Erdős–Rényi)
- Dense/Complete graphs
- RMAT graphs (power-law distribution)
- Small-world graphs
- Bipartite graphs
- Grid graphs

### Performance Metrics Captured
- Execution time (milliseconds)
- Operations per second
- Memory usage (MB)
- TEPS (Traversed Edges Per Second)
- Statistical measures (margin of error, standard deviation)

## Benchmark Results Summary

### Fastest Algorithms (Average Execution Time)
1. **Degree Centrality**: 0.28ms
2. **Bellman-Ford**: 0.57ms
3. **K-Core**: 1.06ms
4. **Maximum Bipartite Matching**: 1.14ms
5. **Kruskal's MST**: 1.47ms

### Most Memory Efficient (Average Memory Usage)
1. **Floyd-Warshall**: 6.53MB
2. **Maximum Bipartite Matching**: 6.67MB
3. **Common Neighbors**: 11.29MB
4. **Bellman-Ford**: 11.38MB
5. **Eigenvector Centrality**: 12.27MB

## Implementation Challenges Addressed

1. **Scope Issues with Benchmark.js**: Fixed by making functions globally available
2. **Import Naming Mismatches**: Corrected function names (e.g., `kCore` → `kCoreDecomposition`)
3. **Data Structure Conversions**: Added adapters for algorithms expecting different graph formats
4. **Return Type Validation**: Updated tests to match actual return structures (e.g., Maps vs Objects)

## Algorithms Not Yet Benchmarked

Several algorithms still need benchmarks:
- Louvain Community Detection
- Label Propagation
- Ford-Fulkerson (Max Flow)
- A* Pathfinding
- Spectral Clustering
- Graph Isomorphism (VF2)
- MCL (Markov Clustering)
- Hierarchical Clustering
- And others...

## Usage

Run benchmarks with:
```bash
# Quick benchmark for a specific algorithm
npm run benchmark:degree-centrality

# Comprehensive benchmark
npm run benchmark:degree-centrality -- --comprehensive

# Generate HTML report
npm run benchmark:report
```

## Next Steps

1. Fix remaining algorithm benchmarks (Louvain, Label Propagation, etc.)
2. Address the graph isomorphism test generation issue
3. Set up automated benchmark runs in CI/CD
4. Publish benchmark results to GitHub Pages
5. Add performance regression detection