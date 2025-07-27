# Code Duplication and Refactoring Report
## @graphty/algorithms Library
### Date: 2025-07-26

## Executive Summary

A comprehensive code review of ALL 32+ algorithms in the @graphty/algorithms library reveals extensive code duplication and missed opportunities for code reuse. Most notably, **no algorithms currently use the existing BFS/DFS implementations** from `src/algorithms/traversal/`. Instead, nearly every algorithm has implemented its own custom traversal logic. Additionally, common utilities like random number generators, shuffle functions, matrix operations, and path reconstruction are duplicated across multiple files. This report identifies specific duplication patterns and provides actionable recommendations for refactoring.

## Key Findings

### 1. Widespread Custom BFS/DFS Implementations

The following algorithms contain their own BFS implementations instead of using the existing traversal algorithms:

| Algorithm | Location | Custom Implementation | Lines |
|-----------|----------|----------------------|-------|
| Betweenness Centrality | `centrality/betweenness.ts` | 2 custom BFS implementations | 61-97, 227-260 |
| Closeness Centrality | `centrality/closeness.ts` | Custom BFS for distances | 111-154 |
| Girvan-Newman | `community/girvan-newman.ts` | BFS with path counting | 195-266 |
| Bipartite Matching | `matching/bipartite.ts` | BFS for graph coloring | 102-134 |
| Ford-Fulkerson | `flow/ford-fulkerson.ts` | BFS for augmenting paths | 305-352, 357-406 |
| Hierarchical Clustering | `clustering/hierarchical.ts` | BFS for graph distances | 31-65 |
| Leiden | `community/leiden.ts` | BFS for connected components | 458-491 |
| TeraHAC | `research/terahac.ts` | BFS for shortest paths | 282-308 |

### 2. Graph Representation Inconsistency

There are **three different graph representations** used across the codebase:

1. **`Graph` class** (`core/graph.ts`) - Used by traversal and shortest path algorithms
2. **`Map<string, Map<string, number>>`** - Used by community detection and flow algorithms
3. **`Map<T, Set<T>>`** - Used by clustering algorithms

This inconsistency prevents algorithm reuse and creates maintenance burden.

### 3. Duplicated Utility Functions

The following utility functions are duplicated across multiple files:

| Function | Duplicated In | Purpose |
|----------|--------------|---------|
| Path reconstruction | `bfs.ts`, `dijkstra.ts`, `bellman-ford.ts`, `ford-fulkerson.ts` | Reconstruct path from predecessor map |
| Fisher-Yates shuffle | `leiden.ts`, `label-propagation.ts`, `girvan-newman.ts` | Random shuffling of arrays |
| Random number generator | `leiden.ts`, `label-propagation.ts`, `louvain.ts`, `girvan-newman.ts`, `grsbm.ts`, `sync.ts` | Seeded RNG |
| Graph cloning | `girvan-newman.ts` | Duplicates `Graph.clone()` |
| Edge key generation | `girvan-newman.ts`, `kruskal.ts`, multiple files | Create consistent edge identifiers |
| Distance matrix init | `closeness.ts`, `hierarchical.ts` | Initialize all-pairs distances |
| Euclidean distance | `spectral.ts` (554-561), `sync.ts` (442-453) | Calculate Euclidean distance |
| Node degree calculation | `girvan-newman.ts`, `isomorphism.ts`, `k-core.ts`, `spectral.ts`, `mcl.ts` | Get degree of node |
| Common neighbor finding | `adamic-adar.ts`, `common-neighbors.ts` | Find neighbors shared by two nodes |
| Matrix operations | `mcl.ts`, `spectral.ts`, `grsbm.ts` | Matrix multiply, power, normalization |
| Normalization functions | `eigenvector.ts`, `katz.ts`, `degree.ts`, `hits.ts`, `pagerank.ts`, `mcl.ts`, `spectral.ts` | Various normalization strategies |
| Community renumbering | `girvan-newman.ts`, `label-propagation.ts` | Renumber communities consecutively |
| Graph to undirected | `k-core.ts` (429-460), `min-cut.ts` (275-305) | Convert directed to undirected |

### 4. Algorithm-Specific Findings

#### Betweenness Centrality
- Contains 80% code duplication between node and edge betweenness functions
- Custom BFS could be replaced with extended version of existing BFS
- Normalization logic is duplicated and could be extracted

#### Closeness Centrality
- Implements custom Dijkstra's algorithm instead of using existing implementation
- Uses inefficient array-based priority queue instead of existing `PriorityQueue`
- Distance calculation patterns are duplicated between weighted/unweighted versions

#### Girvan-Newman
- Reimplements edge betweenness calculation that already exists
- Custom graph cloning function duplicates `Graph.clone()`
- BFS with path counting is very similar to betweenness centrality's implementation

#### Ford-Fulkerson
- `fordFulkerson` and `edmondsKarp` functions share 90% of their code
- Path reconstruction logic is duplicated 3 times within the file
- Custom BFS/DFS instead of using existing implementations

#### Bipartite Matching
- `bipartitePartition()` duplicates the logic of `isBipartite()` from `bfs.ts`
- Could extend existing function to return partition sets

#### Link Prediction Algorithms (Adamic-Adar & Common Neighbors)
- **90% code duplication** between `adamic-adar.ts` and `common-neighbors.ts`
- Identical evaluation functions (precision, recall, AUC calculation)
- Identical candidate generation patterns
- Only difference is the scoring function used

#### Centrality Algorithms (Degree, Eigenvector, HITS, Katz, PageRank)
- Duplicated normalization patterns (min-max, L2 norm, sum-to-1)
- Repeated convergence checking logic across iterative algorithms
- Single node calculation pattern duplicated in all algorithms
- Degree calculation switch statements duplicated in `degree.ts`

#### MST Algorithms (Kruskal & Prim)
- Edge sorting patterns could be extracted
- Already properly use shared `UnionFind` and `PriorityQueue` data structures

#### Shortest Path Algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall)
- `reconstructPath` function duplicated in Dijkstra and Bellman-Ford
- Distance initialization patterns repeated
- `singleSourceShortestPath` in Dijkstra duplicates main `dijkstra` function logic

#### Clustering Algorithms (K-Core, MCL, Spectral)
- Matrix operations (multiply, power, normalization) duplicated between MCL and Spectral
- K-means clustering implementation in Spectral could be extracted
- Node-to-index mapping pattern repeated in all three

#### Community Detection (Label Propagation, Louvain)
- Modularity calculation implemented differently in multiple places
- Community renumbering logic duplicated

#### Research Algorithms (GRSBM, Sync)
- `seedRandom` function duplicated identically in both files
- Matrix operations specific to each algorithm

#### Flow Algorithms (Min-Cut)
- Graph conversion utilities (makeUndirected) could be extracted
- Node contraction operations have similar patterns

## Recommended Refactoring Actions

### Priority 1: Create Common Utilities Modules

#### 1.1 Graph Utilities (`src/utils/graph-utilities.ts`)
```typescript
// Path reconstruction from predecessor map
export function reconstructPath<T>(
  target: T, 
  predecessor: Map<T, T | null>
): T[]

// Edge key generation for undirected graphs  
export function getEdgeKey(
  source: NodeId, 
  target: NodeId, 
  isDirected: boolean
): string

// Graph metrics
export function getTotalEdgeWeight(graph: Graph): number
export function getNodeDegree(graph: Graph, nodeId: NodeId, mode?: "in" | "out" | "total"): number

// Graph conversions
export function makeUndirected(graph: Graph): Graph
export function toUndirected<T>(adjacency: Map<T, Set<T>>): Map<T, Set<T>>

// Node operations
export function contractNodes(graph: Graph, node1: NodeId, node2: NodeId): void

// Common neighbor operations
export function getCommonNeighbors(
  graph: Graph, 
  source: NodeId, 
  target: NodeId, 
  directed?: boolean
): Set<NodeId>

// Community operations
export function renumberCommunities(communities: number[]): number[]
```

#### 1.2 Mathematical Utilities (`src/utils/math-utilities.ts`)
```typescript
// Random number generation
export class SeededRandom {
  constructor(seed: number)
  next(): number
}

// Fisher-Yates shuffle
export function shuffle<T>(array: T[], rng?: () => number): T[]

// Distance functions
export function euclideanDistance(a: number[], b: number[]): number

// Normalization functions
export const normalize = {
  minMax(values: Record<string, number>): void
  byMax(values: Record<string, number>): void
  l2Norm(values: Map<string, number>): void
  sumToOne(values: Map<string, number>): void
  columnNormalize(matrix: number[][]): void
  rowNormalize(matrix: number[][]): void
}

// Convergence checking
export function checkConvergence(
  current: Map<string, number>,
  previous: Map<string, number>,
  tolerance: number
): boolean
```

#### 1.3 Matrix Utilities (`src/utils/matrix-utilities.ts`)
```typescript
// Matrix operations
export function matrixMultiply(a: number[][], b: number[][]): number[][]
export function matrixPower(matrix: number[][], power: number): number[][]
export function buildAdjacencyMatrix(graph: Graph): number[][]
export function buildTransitionMatrix(graph: Graph): number[][]

// Matrix initialization
export function initializeDistanceMatrix<T>(
  nodes: T[], 
  defaultValue: number = Infinity
): Map<T, Map<T, number>>

// Node-to-index mapping
export function createNodeIndexMap<T>(nodes: T[]): Map<T, number>
```

#### 1.4 Algorithm Utilities (`src/utils/algorithm-utilities.ts`)
```typescript
// Edge operations
export function sortEdgesByWeight(edges: Edge[]): Edge[]
export function deduplicateEdges(edges: Edge[]): Edge[]

// Clustering utilities
export function kMeansClustering(
  points: number[][],
  k: number,
  maxIterations?: number
): { labels: number[], centroids: number[][] }

// Modularity calculation
export function calculateModularity(
  graph: Graph,
  communities: Map<NodeId, number>
): number

// Link prediction evaluation
export function evaluateLinkPrediction(
  predictions: Array<[NodeId, NodeId, number]>,
  testEdges: Array<[NodeId, NodeId]>
): {
  precision: number[]
  recall: number[]
  f1: number[]
  auc: number
}
```

### Priority 2: Create Graph Conversion Utilities

Create `src/utils/graph-converters.ts` with:

```typescript
// Convert Graph class to Map representation
export function graphToMap(graph: Graph): Map<string, Map<string, number>>

// Convert Map representation to Graph class
export function mapToGraph(map: Map<string, Map<string, number>>): Graph

// Create adapter for using Graph algorithms with Map representation
export class GraphAdapter {
  constructor(map: Map<string, Map<string, number>>)
  // Implements Graph interface methods
}
```

### Priority 3: Create Specialized BFS Variants

Create `src/algorithms/traversal/bfs-variants.ts` with:

```typescript
// BFS that tracks shortest path counts (for betweenness centrality)
export function bfsWithPathCounting(
  graph: Graph, 
  source: NodeId
): {
  distances: Map<NodeId, number>
  predecessors: Map<NodeId, NodeId[]>
  sigma: Map<NodeId, number>
  stack: NodeId[]
}

// BFS that only returns distances (for closeness centrality)
export function bfsDistancesOnly(
  graph: Graph, 
  source: NodeId,
  cutoff?: number
): Map<NodeId, number>

// BFS for bipartite checking with partition sets
export function bfsColoringWithPartitions(
  graph: Graph
): {
  isBipartite: boolean
  partitions?: [Set<NodeId>, Set<NodeId>]
}

// BFS for finding augmenting paths (for flow algorithms)
export function bfsAugmentingPath(
  residualGraph: Map<string, Map<string, number>>,
  source: string,
  sink: string
): {
  path: string[]
  pathCapacity: number
} | null
```

### Priority 4: Refactor Algorithms to Use Common Code

#### Phase 1: Low-Risk Refactoring (No API Changes)
1. **Extract utility functions** to common modules
2. **Replace custom `cloneGraph`** with `Graph.clone()`
3. **Use existing `PriorityQueue`** in closeness centrality
4. **Consolidate path reconstruction** logic

#### Phase 2: Algorithm Optimization (Internal Changes)
1. **Betweenness Centrality**
   - Merge node and edge betweenness implementations
   - Use `bfsWithPathCounting` from variants module
   - Extract normalization logic

2. **Closeness Centrality**
   - Replace custom Dijkstra with existing implementation
   - Use `bfsDistancesOnly` for unweighted graphs
   - Extract centrality calculation logic

3. **Ford-Fulkerson**
   - Merge common code between variants
   - Use `bfsAugmentingPath` from variants module
   - Extract residual graph operations

4. **Bipartite Matching**
   - Use `bfsColoringWithPartitions` from variants module
   - Remove duplicate bipartite checking logic

#### Phase 3: Graph Representation Standardization
1. **Add adapter support** to community detection algorithms
2. **Migrate flow algorithms** to use Graph class with capacity as edge data
3. **Update clustering algorithms** to accept Graph instances

### Priority 5: Performance Optimization

After refactoring, integrate the optimized BFS implementations:

1. **Update BFS variants** to use `CSRGraph` for large graphs
2. **Add configuration options** for enabling optimizations
3. **Benchmark improvements** on real-world datasets

## Implementation Timeline

### Week 1: Common Utilities
- Create utilities module with shared functions
- Add comprehensive unit tests
- Update existing algorithms to use utilities

### Week 2: Graph Converters and BFS Variants
- Implement graph conversion utilities
- Create specialized BFS variants
- Test with existing algorithms

### Week 3-4: Algorithm Refactoring
- Refactor algorithms in priority order:
  1. Bipartite (simplest)
  2. Closeness centrality
  3. Betweenness centrality
  4. Ford-Fulkerson
  5. Girvan-Newman

### Week 5: Testing and Optimization
- Comprehensive testing of refactored algorithms
- Performance benchmarking
- Integration of optimized BFS where beneficial

## Expected Benefits

1. **Code Reduction**: ~35-45% reduction in total lines of code
   - Link prediction algorithms alone can be reduced by 80%
   - Centrality algorithms can be reduced by 30-40%
   - Matrix operations and utilities can save 1000+ lines

2. **Performance**: 3-40x speedup on large graphs using optimized BFS
   - Algorithms that run BFS from every node will see the most benefit
   - Matrix operations can be optimized once and benefit multiple algorithms

3. **Maintainability**: Single source of truth for common operations
   - Bug fixes in utilities automatically benefit all algorithms
   - Easier to add new algorithms using existing building blocks

4. **Consistency**: Uniform graph representation and algorithm patterns
   - Standardized interfaces make algorithms composable
   - Consistent error handling and validation

5. **Testability**: Shared utilities can be thoroughly tested once
   - Higher confidence in correctness
   - Reduced test duplication

6. **Memory Efficiency**: Reduced memory footprint
   - Shared data structures and utilities
   - Optimized matrix operations

## Detailed Impact Analysis

### High-Impact Refactoring (>50% code reduction)
- **Link Prediction**: 80-90% reduction by extracting common framework
- **Ford-Fulkerson variants**: 60% reduction by merging common code
- **Centrality normalization**: 50% reduction across 7 algorithms

### Medium-Impact Refactoring (20-50% code reduction)
- **BFS/DFS implementations**: 30-40% reduction across 8+ algorithms
- **Matrix operations**: 30% reduction in clustering algorithms
- **Path reconstruction**: 25% reduction in shortest path algorithms

### Low-Impact but High-Value Refactoring
- **Random number generation**: Small code reduction but ensures consistency
- **Graph utilities**: Improves readability and reduces bugs
- **Type standardization**: Better TypeScript support and IDE experience

## Risk Mitigation

1. **Maintain backward compatibility**: All public APIs remain unchanged
2. **Incremental refactoring**: Phase approach allows rollback if issues arise
3. **Comprehensive testing**: Each change validated with existing test suite
4. **Performance monitoring**: Ensure refactoring doesn't degrade performance

## Duplication Summary

After reviewing all 32+ algorithms, here's the quantified duplication:

| Category | Files Affected | Estimated LOC Duplicated |
|----------|----------------|-------------------------|
| Custom BFS implementations | 8 files | ~800 lines |
| Custom DFS implementations | 4 files | ~200 lines |
| Random number generators | 6 files | ~72 lines |
| Fisher-Yates shuffle | 3 files | ~33 lines |
| Path reconstruction | 4 files | ~44 lines |
| Matrix operations | 3 files | ~450 lines |
| Normalization functions | 7 files | ~280 lines |
| Common neighbor finding | 2 files | ~100 lines |
| Link prediction framework | 2 files | ~600 lines |
| Edge/Graph utilities | 8+ files | ~300 lines |
| **Total** | **32+ files** | **~2,879 lines** |

## Conclusion

The @graphty/algorithms library has significant opportunities for code reuse and optimization. By systematically addressing the identified duplications and inconsistencies, we can:

1. **Eliminate ~2,900 lines of duplicated code**
2. **Improve performance by 3-40x** on large graphs
3. **Reduce the overall codebase by 35-45%**
4. **Create a more maintainable and extensible architecture**

The refactoring plan provides a clear path forward with prioritized actions, expected benefits, and risk mitigation strategies. Implementation should proceed in phases to ensure stability while maximizing the benefits of code reuse.