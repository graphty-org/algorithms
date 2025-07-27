# Refactoring Implementation Plan
## @graphty/algorithms Library
### Date: 2025-07-26

## Overview

This document provides a detailed, step-by-step implementation plan for refactoring the @graphty/algorithms library based on the findings in `refactoring-report-20250726.md`. Each step is designed to be small, testable, and reversible, ensuring we can validate success at each stage.

## Phase 0: Foundation Setup (Steps 1-3)

### Step 1: Create Utility Module Structure
**Objective**: Set up the foundation for shared utilities without breaking any existing code.

**Actions**:
1. Create directory structure:
   ```
   src/utils/
   ├── graph-utilities.ts
   ├── math-utilities.ts
   ├── matrix-utilities.ts
   ├── algorithm-utilities.ts
   └── index.ts
   ```

2. Create empty modules with basic exports:
   ```typescript
   // src/utils/graph-utilities.ts
   // Graph utility functions will be added here
   export {}
   
   // src/utils/math-utilities.ts
   // Math utility functions will be added here
   export {}
   
   // src/utils/matrix-utilities.ts
   // Matrix utility functions will be added here
   export {}
   
   // src/utils/algorithm-utilities.ts
   // Algorithm utility functions will be added here
   export {}
   
   // src/utils/index.ts
   export * from './graph-utilities.js'
   export * from './math-utilities.js'
   export * from './matrix-utilities.js'
   export * from './algorithm-utilities.js'
   ```

**Validation**:
- Run `npm run build` - should succeed
- Run `npm test` - all tests should still pass
- No algorithms should be modified yet

### Step 2: Extract and Test SeededRandom
**Objective**: Extract the first duplicated utility (SeededRandom) and create comprehensive tests.

**Actions**:
1. Copy the `seedRandom` function from `src/research/sync.ts` (lines 458-469) to `src/utils/math-utilities.ts`
2. Create a proper class-based implementation:
   ```typescript
   // src/utils/math-utilities.ts
   export class SeededRandom {
     private seed: number;
     private readonly m = 0x80000000; // 2**31
     private readonly a = 1103515245;
     private readonly c = 12345;
     
     constructor(seed: number) {
       this.seed = seed % this.m;
     }
     
     next(): number {
       this.seed = ((this.a * this.seed) + this.c) % this.m;
       return this.seed / (this.m - 1);
     }
     
     // For backward compatibility
     static createGenerator(seed: number): () => number {
       const rng = new SeededRandom(seed);
       return () => rng.next();
     }
   }
   ```

3. Create comprehensive tests in `src/utils/math-utilities.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { SeededRandom } from './math-utilities.js'
   
   describe('SeededRandom', () => {
     it('should produce deterministic values', () => {
       const rng1 = new SeededRandom(42)
       const rng2 = new SeededRandom(42)
       
       for (let i = 0; i < 100; i++) {
         expect(rng1.next()).toBe(rng2.next())
       }
     })
     
     it('should produce values between 0 and 1', () => {
       const rng = new SeededRandom(12345)
       for (let i = 0; i < 1000; i++) {
         const value = rng.next()
         expect(value).toBeGreaterThanOrEqual(0)
         expect(value).toBeLessThanOrEqual(1)
       }
     })
     
     it('should match legacy implementation', () => {
       // Test against known values from existing implementation
       const generator = SeededRandom.createGenerator(42)
       expect(generator()).toBeCloseTo(0.0007545491, 5)
       expect(generator()).toBeCloseTo(0.8325912058, 5)
     })
   })
   ```

**Validation**:
- New tests pass
- Existing algorithms still work (haven't been modified yet)

### Step 3: Extract reconstructPath Function
**Objective**: Extract the path reconstruction utility that's duplicated in 4 files.

**Actions**:
1. Copy the `reconstructPath` function from `src/algorithms/shortestPath/dijkstra.ts` to `src/utils/graph-utilities.ts`
2. Make it generic and well-documented:
   ```typescript
   // src/utils/graph-utilities.ts
   import type { NodeId } from '../types/index.js'
   
   /**
    * Reconstructs a path from source to target using a predecessor map
    * @param target - The target node
    * @param predecessor - Map of node to its predecessor in the path
    * @returns Array of nodes from source to target, or empty array if no path exists
    */
   export function reconstructPath<T>(
     target: T,
     predecessor: Map<T, T | null>
   ): T[] {
     const path: T[] = []
     let current: T | null = target
     
     // Build path backwards from target to source
     while (current !== null) {
       path.unshift(current)
       const pred = predecessor.get(current)
       if (pred === undefined) {
         // No path exists
         return []
       }
       current = pred
     }
     
     return path
   }
   ```

3. Create tests in `src/utils/graph-utilities.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { reconstructPath } from './graph-utilities.js'
   
   describe('reconstructPath', () => {
     it('should reconstruct simple path', () => {
       const predecessor = new Map([
         ['D', 'C'],
         ['C', 'B'],
         ['B', 'A'],
         ['A', null]
       ])
       
       expect(reconstructPath('D', predecessor)).toEqual(['A', 'B', 'C', 'D'])
     })
     
     it('should return empty array for unreachable target', () => {
       const predecessor = new Map([
         ['A', null],
         ['B', 'A']
       ])
       
       expect(reconstructPath('C', predecessor)).toEqual([])
     })
     
     it('should handle single node path', () => {
       const predecessor = new Map([['A', null]])
       expect(reconstructPath('A', predecessor)).toEqual(['A'])
     })
   })
   ```

**Validation**:
- New tests pass
- Function works with both string and numeric node IDs

## Phase 1: Replace Duplicated Utilities (Steps 4-15)

### Step 4: Update GRSBM to Use SeededRandom
**Objective**: Replace the first instance of duplicated seedRandom with our new utility.

**Actions**:
1. Import SeededRandom in `src/research/grsbm.ts`:
   ```typescript
   import { SeededRandom } from '../utils/math-utilities.js'
   ```

2. Replace lines 575-589 (the seedRandom function) with usage of SeededRandom:
   ```typescript
   // DELETE lines 575-589
   
   // UPDATE line 98 from:
   Math.random = seedRandom(seed);
   
   // TO:
   const rng = SeededRandom.createGenerator(seed);
   const originalRandom = Math.random;
   Math.random = rng;
   ```

3. Ensure cleanup still works (line 172 remains unchanged)

**Validation**:
- Run `npm test -- grsbm` - all GRSBM tests should pass
- The algorithm should produce identical results as before

### Step 5: Update Sync to Use SeededRandom
**Objective**: Replace the second instance of duplicated seedRandom.

**Actions**:
1. Import SeededRandom in `src/research/sync.ts`:
   ```typescript
   import { SeededRandom } from '../utils/math-utilities.js'
   ```

2. Delete lines 456-469 (the seedRandom function)

3. Update line 63:
   ```typescript
   // FROM:
   Math.random = seedRandom(seed);
   
   // TO:
   const rng = SeededRandom.createGenerator(seed);
   Math.random = rng;
   ```

**Validation**:
- Run `npm test -- sync` - all Sync tests should pass
- Both GRSBM and Sync now use the same RNG implementation

### Step 6: Extract Fisher-Yates Shuffle
**Objective**: Create a reusable shuffle function to replace 3 duplicated implementations.

**Actions**:
1. Add shuffle function to `src/utils/math-utilities.ts`:
   ```typescript
   /**
    * Fisher-Yates shuffle algorithm
    * @param array - Array to shuffle (will be modified in place)
    * @param rng - Optional random number generator (defaults to Math.random)
    * @returns The shuffled array (same reference as input)
    */
   export function shuffle<T>(array: T[], rng: () => number = Math.random): T[] {
     for (let i = array.length - 1; i > 0; i--) {
       const j = Math.floor(rng() * (i + 1))
       const temp = array[i]
       const tempJ = array[j]
       if (temp !== undefined && tempJ !== undefined) {
         array[i] = tempJ
         array[j] = temp
       }
     }
     return array
   }
   ```

2. Add tests:
   ```typescript
   describe('shuffle', () => {
     it('should shuffle array in place', () => {
       const arr = [1, 2, 3, 4, 5]
       const original = [...arr]
       const shuffled = shuffle(arr)
       
       expect(shuffled).toBe(arr) // Same reference
       expect(shuffled.sort()).toEqual(original.sort()) // Same elements
     })
     
     it('should be deterministic with seeded RNG', () => {
       const arr1 = [1, 2, 3, 4, 5]
       const arr2 = [1, 2, 3, 4, 5]
       
       const rng1 = SeededRandom.createGenerator(42)
       const rng2 = SeededRandom.createGenerator(42)
       
       shuffle(arr1, rng1)
       shuffle(arr2, rng2)
       
       expect(arr1).toEqual(arr2)
     })
   })
   ```

**Validation**:
- Tests pass
- Shuffle works correctly with both default and custom RNG

### Step 7: Replace Shuffle in Leiden Algorithm
**Objective**: Replace custom shuffle implementation in leiden.ts.

**Actions**:
1. Import shuffle in `src/community/leiden.ts`:
   ```typescript
   import { shuffle } from '../utils/math-utilities.js'
   ```

2. Find the shuffle implementation (search for "Fisher-Yates" or array swapping in a loop)
3. Replace with:
   ```typescript
   shuffle(nodeArray, rng)  // where rng is their random function
   ```

**Validation**:
- Run `npm test -- leiden`
- Algorithm produces same results with same seed

### Step 8: Extract Euclidean Distance
**Objective**: Create shared distance function used in multiple algorithms.

**Actions**:
1. Add to `src/utils/math-utilities.ts`:
   ```typescript
   /**
    * Calculate Euclidean distance between two vectors
    * @param a - First vector
    * @param b - Second vector
    * @returns Euclidean distance
    * @throws Error if vectors have different lengths
    */
   export function euclideanDistance(a: number[], b: number[]): number {
     if (a.length !== b.length) {
       throw new Error('Vectors must have same length')
     }
     
     let sum = 0
     for (let i = 0; i < a.length; i++) {
       const aVal = a[i]
       const bVal = b[i]
       if (aVal !== undefined && bVal !== undefined) {
         const diff = aVal - bVal
         sum += diff * diff
       }
     }
     return Math.sqrt(sum)
   }
   ```

2. Add comprehensive tests

**Validation**:
- Tests pass including edge cases (empty vectors, single dimension)

### Step 9: Replace Euclidean Distance in Sync
**Objective**: Use shared euclidean distance function.

**Actions**:
1. Import in `src/research/sync.ts`:
   ```typescript
   import { euclideanDistance } from '../utils/math-utilities.js'
   ```

2. Delete lines 442-453 (euclideanDistance function)

3. Ensure all calls still work (the signature should be identical)

**Validation**:
- Run `npm test -- sync`
- No behavior changes

### Step 10: Update Dijkstra to Use reconstructPath
**Objective**: Replace first instance of duplicated path reconstruction.

**Actions**:
1. Import in `src/algorithms/shortestPath/dijkstra.ts`:
   ```typescript
   import { reconstructPath } from '../../utils/graph-utilities.js'
   ```

2. Delete the local reconstructPath function
3. Update any calls to ensure they work with the shared version

**Validation**:
- Run `npm test -- dijkstra`
- Path reconstruction still works correctly

### Step 11: Update Bellman-Ford to Use reconstructPath
**Objective**: Replace second instance of path reconstruction.

**Actions**:
1. Similar to Step 10 but for `src/algorithms/shortestPath/bellman-ford.ts`

**Validation**:
- Run `npm test -- bellman-ford`

### Step 12: Create Normalization Utilities
**Objective**: Extract common normalization patterns used across 7 algorithms.

**Actions**:
1. Add to `src/utils/math-utilities.ts`:
   ```typescript
   export const normalize = {
     /**
      * Min-max normalization to [0, 1] range
      */
     minMax(values: Map<string, number>): void {
       const vals = Array.from(values.values())
       const min = Math.min(...vals)
       const max = Math.max(...vals)
       const range = max - min
       
       if (range === 0) return
       
       for (const [key, value] of values) {
         values.set(key, (value - min) / range)
       }
     },
     
     /**
      * Normalize by maximum value
      */
     byMax(values: Map<string, number>): void {
       const max = Math.max(...values.values())
       if (max === 0) return
       
       for (const [key, value] of values) {
         values.set(key, value / max)
       }
     },
     
     /**
      * L2 (Euclidean) normalization
      */
     l2Norm(values: Map<string, number>): void {
       const sumSquares = Array.from(values.values())
         .reduce((sum, val) => sum + val * val, 0)
       const norm = Math.sqrt(sumSquares)
       
       if (norm === 0) return
       
       for (const [key, value] of values) {
         values.set(key, value / norm)
       }
     },
     
     /**
      * Normalize to sum to 1
      */
     sumToOne(values: Map<string, number>): void {
       const sum = Array.from(values.values())
         .reduce((acc, val) => acc + val, 0)
       
       if (sum === 0) return
       
       for (const [key, value] of values) {
         values.set(key, value / sum)
       }
     }
   }
   ```

2. Create comprehensive tests for each normalization method

**Validation**:
- All normalization tests pass
- Handle edge cases (empty maps, all zeros, negative values)

### Step 13: Extract getCommonNeighbors Function
**Objective**: Create shared function for finding common neighbors.

**Actions**:
1. Add to `src/utils/graph-utilities.ts`:
   ```typescript
   /**
    * Find common neighbors between two nodes
    * @param graph - The graph
    * @param source - First node
    * @param target - Second node  
    * @param directed - Whether to consider edge direction
    * @returns Set of common neighbor node IDs
    */
   export function getCommonNeighbors(
     graph: Graph,
     source: NodeId,
     target: NodeId,
     directed: boolean = false
   ): Set<NodeId> {
     const sourceNeighbors = new Set(
       directed ? graph.outNeighbors(source) : graph.neighbors(source)
     )
     const targetNeighbors = new Set(
       directed ? graph.outNeighbors(target) : graph.neighbors(target)
     )
     
     const common = new Set<NodeId>()
     for (const neighbor of sourceNeighbors) {
       if (targetNeighbors.has(neighbor)) {
         common.add(neighbor)
       }
     }
     
     return common
   }
   ```

2. Create tests with directed and undirected graphs

**Validation**:
- Tests pass for both directed and undirected cases

### Step 14: Update Common Neighbors Algorithm
**Objective**: Use shared getCommonNeighbors function.

**Actions**:
1. Import in `src/algorithms/linkPrediction/common-neighbors.ts`
2. Replace local implementation with shared function
3. Ensure scoring logic remains unchanged

**Validation**:
- Run `npm test -- common-neighbors`
- Results unchanged

### Step 15: Update Adamic-Adar Algorithm
**Objective**: Use shared getCommonNeighbors function.

**Actions**:
1. Similar to Step 14 but for `src/algorithms/linkPrediction/adamic-adar.ts`

**Validation**:
- Run `npm test -- adamic-adar`

## Phase 2: Extract Complex Utilities (Steps 16-25)

### Step 16: Create Link Prediction Base Framework
**Objective**: Extract common code from link prediction algorithms (90% duplication).

**Actions**:
1. Create `src/utils/algorithm-utilities.ts` with:
   ```typescript
   export interface LinkPredictionResult {
     predictions: Array<[NodeId, NodeId, number]>
     evaluation?: {
       precision: number[]
       recall: number[]
       f1: number[]
       auc: number
     }
   }
   
   export interface LinkPredictionConfig {
     scoreFunction: (graph: Graph, source: NodeId, target: NodeId) => number
     candidateSelection?: 'all' | 'nonEdges' | 'sampling'
     maxCandidates?: number
     testEdges?: Array<[NodeId, NodeId]>
   }
   
   export function linkPredictionFramework(
     graph: Graph,
     config: LinkPredictionConfig
   ): LinkPredictionResult {
     // Extract common implementation from adamic-adar.ts
     // Including candidate generation, scoring, evaluation
   }
   ```

**Validation**:
- Framework handles all existing link prediction patterns

### Step 17: Create Matrix Operation Utilities
**Objective**: Extract matrix operations used in MCL, Spectral, and GRSBM.

**Actions**:
1. Add to `src/utils/matrix-utilities.ts`:
   ```typescript
   export function matrixMultiply(a: number[][], b: number[][]): number[][] {
     // Implementation from existing algorithms
   }
   
   export function matrixPower(matrix: number[][], power: number): number[][] {
     // Efficient implementation using repeated squaring
   }
   
   export function normalizeColumns(matrix: number[][]): void {
     // Column normalization for stochastic matrices
   }
   ```

**Validation**:
- Matrix tests pass
- Results match existing implementations

### Step 18: Create BFS Variants Module
**Objective**: Create specialized BFS implementations for different use cases.

**Actions**:
1. Create `src/algorithms/traversal/bfs-variants.ts`
2. Implement each variant based on existing custom implementations:
   - `bfsWithPathCounting` - from betweenness centrality
   - `bfsDistancesOnly` - from closeness centrality  
   - `bfsColoringWithPartitions` - from bipartite matching
   - `bfsAugmentingPath` - from Ford-Fulkerson

**Validation**:
- Each variant has comprehensive tests
- Behavior matches original implementations

### Step 19: Create Graph Adapter
**Objective**: Allow algorithms using Map representation to work with Graph class.

**Actions**:
1. Create `src/utils/graph-converters.ts`:
   ```typescript
   export class GraphAdapter {
     constructor(private map: Map<string, Map<string, number>>) {}
     
     nodes(): Iterable<{id: string}> {
       return Array.from(this.map.keys()).map(id => ({id}))
     }
     
     neighbors(node: string): Iterable<string> {
       return this.map.get(node)?.keys() ?? []
     }
     
     hasEdge(source: string, target: string): boolean {
       return this.map.get(source)?.has(target) ?? false
     }
     
     // Implement remaining Graph interface methods
   }
   ```

**Validation**:
- Adapter works with existing Map-based algorithms

### Step 20: Extract Modularity Calculation
**Objective**: Create shared modularity calculation used in multiple community detection algorithms.

**Actions**:
1. Add to `src/utils/algorithm-utilities.ts`:
   ```typescript
   export function calculateModularity(
     graph: Graph,
     communities: Map<NodeId, number>
   ): number {
     // Extract best implementation from existing algorithms
     // Handle both directed and undirected graphs
   }
   ```

**Validation**:
- Modularity calculation matches existing implementations

## Phase 3: Refactor Individual Algorithms (Steps 21-40)

### Step 21: Refactor Bipartite Matching
**Objective**: Simplest refactoring - use bfsColoringWithPartitions.

**Actions**:
1. Import `bfsColoringWithPartitions` from bfs-variants
2. Replace `bipartitePartition` function with call to shared variant
3. Keep the matching algorithm logic unchanged

**Before** (simplified):
```typescript
function bipartitePartition(graph: Graph): [Set<NodeId>, Set<NodeId>] | null {
  // 30+ lines of custom BFS coloring
}
```

**After**:
```typescript
function bipartitePartition(graph: Graph): [Set<NodeId>, Set<NodeId>] | null {
  const result = bfsColoringWithPartitions(graph)
  return result.isBipartite ? result.partitions : null
}
```

**Validation**:
- Run `npm test -- bipartite`
- All tests pass with no behavior changes

### Step 22: Refactor Closeness Centrality
**Objective**: Replace custom Dijkstra with existing implementation.

**Actions**:
1. Import `dijkstra` from shortestPath algorithms
2. Import `bfsDistancesOnly` from bfs-variants
3. Replace custom implementations:
   ```typescript
   // For unweighted graphs
   const distances = bfsDistancesOnly(graph, node, cutoff)
   
   // For weighted graphs  
   const result = dijkstra(graph, node)
   const distances = result.distances
   ```

**Validation**:
- Tests pass
- Performance improves due to optimized PriorityQueue

### Step 23: Extract Edge Betweenness Logic
**Objective**: Prepare for merging node and edge betweenness in betweenness centrality.

**Actions**:
1. Create shared betweenness calculation core
2. Extract normalization logic
3. Parameterize for node vs edge calculation

**Validation**:
- Both node and edge betweenness still work
- ~40% code reduction in the file

### Step 24: Merge Ford-Fulkerson Variants
**Objective**: Eliminate 90% duplication between fordFulkerson and edmondsKarp.

**Actions**:
1. Create base implementation with strategy parameter
2. Use `bfsAugmentingPath` for Edmonds-Karp
3. Keep DFS version for Ford-Fulkerson

**Validation**:
- Both algorithms produce same results
- ~60% code reduction

### Steps 25-40: Continue Algorithm Refactoring
**Pattern**: For each remaining algorithm:
1. Identify which utilities it should use
2. Import required utilities
3. Replace duplicated code
4. Validate with existing tests
5. Measure code reduction

**Priority Order**:
1. Link prediction algorithms (biggest wins)
2. Centrality algorithms (normalization patterns)
3. Community detection (modularity, RNG)
4. Clustering algorithms (matrix operations)
5. Others

## Phase 4: Integration and Optimization (Steps 41-50)

### Step 41: Add CSR Graph Support to BFS Variants
**Objective**: Enable performance optimizations for large graphs.

**Actions**:
1. Update bfs-variants to check graph size
2. Auto-convert to CSR for graphs > 10,000 nodes
3. Add configuration option to force/disable optimization

**Validation**:
- Performance benchmarks show improvement
- Small graphs unaffected

### Step 42: Create Performance Benchmarks
**Objective**: Measure impact of refactoring.

**Actions**:
1. Create benchmark suite for key algorithms
2. Compare before/after refactoring:
   - Execution time
   - Memory usage
   - Code size

**Validation**:
- Document performance improvements
- No regressions

### Step 43: Update Documentation
**Objective**: Document new utilities and patterns.

**Actions**:
1. Add JSDoc comments to all utilities
2. Create usage examples
3. Update algorithm documentation to mention shared utilities

### Step 44: Add Deprecation Notices
**Objective**: Guide users away from internal implementations.

**Actions**:
1. Mark internal utility functions as @internal
2. Add deprecation notices where appropriate
3. Point to shared utilities

### Step 45-50: Final Integration Tasks
- Comprehensive integration tests
- Performance validation
- Code coverage analysis
- Bundle size comparison
- Migration guide for external users

## Validation Criteria

### After Each Step:
1. **Build passes**: `npm run build`
2. **Tests pass**: `npm test`
3. **No behavioral changes**: Algorithms produce same results
4. **Type safety**: No new TypeScript errors

### After Each Phase:
1. **Code reduction**: Measure LOC saved
2. **Performance**: Run benchmarks
3. **Test coverage**: Maintain or improve
4. **Documentation**: Update as needed

### Final Validation:
1. **All 32 algorithms refactored**
2. **~2,900 lines eliminated**
3. **35-45% total code reduction**
4. **3-40x performance improvement on large graphs**
5. **100% backward compatibility**

## Risk Mitigation

### Rollback Strategy:
- Each step is atomic and can be reverted
- Git commits after each successful step
- Keep original implementations until fully validated

### Testing Strategy:
- Run full test suite after each step
- Add new tests for utilities before using them
- Benchmark performance to catch regressions

### Gradual Migration:
- Start with lowest-risk refactoring (utilities)
- Move to simple algorithms (bipartite)
- Tackle complex algorithms last
- Keep both implementations during transition if needed

## Success Metrics

1. **Code Quality**:
   - Eliminated duplication
   - Improved maintainability
   - Better type safety

2. **Performance**:
   - Faster execution on large graphs
   - Reduced memory usage
   - Smaller bundle size

3. **Developer Experience**:
   - Easier to add new algorithms
   - Consistent patterns
   - Better documentation

4. **Reliability**:
   - All tests passing
   - No behavioral changes
   - Performance improvements

This plan provides a clear, step-by-step path to successfully refactor the @graphty/algorithms library while minimizing risk and maximizing benefits.