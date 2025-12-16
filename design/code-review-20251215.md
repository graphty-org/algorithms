# Code Review Report - 12/15/2025

## Executive Summary

- **Files reviewed**: 45+ source files across production code, test files, and configuration
- **Critical issues**: 2
- **High priority issues**: 5
- **Medium priority issues**: 8
- **Low priority issues**: 6

Overall, the @graphty/algorithms codebase demonstrates solid engineering practices with comprehensive algorithm implementations. The code is well-typed, follows consistent patterns, and has good test coverage. However, there are several correctness issues and opportunities for improvement identified below.

---

## File Inventory

### Production Code (src/)
| Category | Files |
|----------|-------|
| Core | `core/graph.ts`, `types/index.ts`, `index.ts` |
| Algorithms | `algorithms/centrality/*.ts`, `algorithms/community/*.ts`, `algorithms/shortest-path/*.ts`, `algorithms/traversal/*.ts` |
| Data Structures | `data-structures/priority-queue.ts`, `data-structures/union-find.ts` |
| Optimized | `optimized/csr-graph.ts`, `optimized/direction-optimized-bfs.ts`, `optimized/graph-adapter.ts`, `optimized/bit-packed.ts` |
| Clustering | `clustering/spectral.ts` |
| Flow | `flow/ford-fulkerson.ts` |
| Research | `research/terahac.ts` |
| Utils | `utils/graph-converters.ts`, `utils/graph-utilities.ts`, `utils/math-utilities.ts` |

### Test Code (test/)
| Category | Files |
|----------|-------|
| Unit Tests | `test/unit/*.test.ts` (comprehensive coverage for all major algorithms) |
| Browser Tests | `test/browser/*.test.ts` |
| Performance | `test/helpers/run-performance-regression.ts`, `test/helpers/memory-profiler.ts` |

### Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Package configuration |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Test configuration |
| `eslint.config.js` | Linting rules |

---

## Critical Issues (Fix Immediately)

### 1. Potential Infinite Loop in TeraHAC Algorithm

- **Files**: `src/research/terahac.ts:115-160`
- **Description**: The main clustering loop `while (clusters.size > 1)` can run indefinitely if `findClosestPair` always returns the same cluster IDs due to stale candidates, or if the `numClusters` and `distanceThreshold` checks don't trigger. The merge candidates list could become empty before the stopping condition is met.
- **Example**: `src/research/terahac.ts:117`
```typescript
// findClosestPair throws if no candidates, but the algorithm may get stuck
// if clusters aren't being properly merged
const {cluster1Id, cluster2Id, distance} = findClosestPair(mergeCandidates);
```
- **Impact**: Algorithm may hang or throw unexpected errors on certain graph structures.
- **Fix**:
```typescript
while (clusters.size > 1 && mergeCandidates.length > 0) {
    // ... rest of loop

    // Add safety check
    if (!cluster1 || !cluster2) {
        // Log warning and break if clusters not found
        console.warn(`Cluster merge failed: cluster ${cluster1Id} or ${cluster2Id} not found`);
        break;
    }
}
```

### 2. Division by Zero in Personalized PageRank with Empty Personal Nodes

- **Files**: `src/algorithms/centrality/pagerank.ts`
- **Description**: When `personalizedPageRank` is called with an empty `personalNodes` array, the calculation of `personalValue = 1 / personalNodes.length` results in `Infinity`, which propagates through the algorithm producing `NaN` values.
- **Example**: Test in `test/unit/pagerank.test.ts:249-257` documents this:
```typescript
it("should handle empty personal nodes array", () => {
    // Empty array will cause division by zero when calculating personalValue
    const result = personalizedPageRank(graph, []);
    // Should handle gracefully, all values will be NaN or 0
    expect(result.converged).toBeDefined();
});
```
- **Impact**: Silent data corruption - users get `NaN` values instead of meaningful errors.
- **Fix**:
```typescript
export function personalizedPageRank(
    graph: Graph,
    personalNodes: NodeId[],
    options: PageRankOptions = {},
): PageRankResult {
    if (personalNodes.length === 0) {
        // Fall back to standard PageRank when no personal nodes specified
        return pageRank(graph, options);
    }
    // ... rest of implementation
}
```

---

## High Priority Issues (Fix Soon)

### 1. Inconsistent Graph Type Handling in Flow Algorithms

- **Files**: `src/flow/ford-fulkerson.ts:383-391`
- **Description**: The `edmondsKarp` function accepts both `Graph` and `Map` types via union type, but `fordFulkerson` only accepts `Graph`. This inconsistency creates a confusing API.
- **Example**:
```typescript
// edmondsKarp accepts both types
export function edmondsKarp(
    graph: Graph | Map<string, Map<string, number>>,
    source: string,
    sink: string,
): MaxFlowResult

// fordFulkerson only accepts Graph
export function fordFulkerson(
    graph: Graph,
    source: string,
    sink: string,
): MaxFlowResult
```
- **Fix**: Either make both functions accept the union type, or document why they differ. Recommend making both consistent:
```typescript
export function fordFulkerson(
    graph: Graph,  // Keep as Graph-only for simplicity
    source: string,
    sink: string,
): MaxFlowResult
```

### 2. Missing Options Exports for Algorithm Configuration

- **Files**: `src/index.ts`, `src/algorithms/index.ts`
- **Description**: Several algorithm options types are defined but not exported from the main package entry point, making it difficult for consumers to use TypeScript properly.
- **Missing Exports**:
  - `ClosenessCentralityOptions` from `src/algorithms/centrality/closeness.ts`
  - `SpectralClusteringOptions` from `src/clustering/spectral.ts`
  - `TeraHACConfig` from `src/research/terahac.ts`
  - `LeidenOptions` from `src/algorithms/community/leiden.ts`
- **Fix**: Add exports to `src/index.ts`:
```typescript
export type {
    ClosenessCentralityOptions,
    SpectralClusteringOptions,
    TeraHACConfig,
    LeidenOptions,
} from "./algorithms/index.js";
```

### 3. Spectral Clustering Uses Approximate Eigenvalue Methods

- **Files**: `src/clustering/spectral.ts:269-394`
- **Description**: The eigenvector computation uses power iteration with hard-coded approximate eigenvalues (e.g., `eigenvalues.push(0.1)`, `eigenvalues.push(0.2)`). This can lead to incorrect clustering results for certain graph structures.
- **Example**: `src/clustering/spectral.ts:610`
```typescript
eigenvectors.push(vector);
eigenvalues.push(0.1); // Approximate - not actual eigenvalue!
```
- **Impact**: Clustering quality may be poor for graphs where the actual eigenvalues differ significantly from approximations.
- **Recommendation**: Document the limitation clearly in JSDoc, or consider using a proper linear algebra library for production use cases:
```typescript
/**
 * @warning This implementation uses simplified power iteration for eigenvector
 * computation. For production use with critical clustering requirements, consider
 * using a proper linear algebra library like ml-matrix.
 */
```

### 4. CSR Graph Weight Handling Ignored in BFS Variants

- **Files**: `src/algorithms/traversal/bfs-variants.ts:475-477`
- **Description**: The CSR-optimized `bfsWeightedDistancesCSR` function ignores edge weights and always uses weight=1, defeating the purpose of weighted distance calculation.
- **Example**: `src/algorithms/traversal/bfs-variants.ts:475-477`
```typescript
for (const neighbor of graph.neighbors(current)) {
    if (!visited.has(neighbor)) {
        // CSRGraph doesn't have edge weights in the interface, default to 1
        const weight = 1;  // BUG: Ignores actual edge weights!
```
- **Fix**: Use `graph.getEdgeWeight()` method that exists on CSRGraph:
```typescript
const weight = graph.getEdgeWeight(current, neighbor) ?? 1;
```

### 5. console.warn Used in Production Code

- **Files**: `src/research/terahac.ts:82-83`
- **Description**: Uses `console.warn` directly which may not be appropriate for library code.
- **Example**:
```typescript
if (nodeCount > maxNodes) {
    console.warn(`Graph has ${String(nodeCount)} nodes, which exceeds maxNodes...`);
}
```
- **Fix**: Either throw an error, return early with a partial result, or allow users to provide a custom logger via options.

---

## Medium Priority Issues (Technical Debt)

### 1. Redundant Code in degreeCentrality - Identical Ternary Branches

- **Files**: `src/algorithms/centrality/degree.ts:22`
- **Description**: The ternary operator has identical values for both branches.
- **Example**:
```typescript
const maxPossibleDegree = graph.isDirected ? nodeCount - 1 : nodeCount - 1;
```
- **Fix**:
```typescript
const maxPossibleDegree = nodeCount - 1;
```

### 2. Duplicate Logic Pattern in Louvain and Leiden

- **Files**: `src/algorithms/community/louvain.ts`, `src/algorithms/community/leiden.ts`
- **Description**: Both files implement similar modularity calculation functions that could be shared.
- **Shared Logic**:
  - `calculateModularity`
  - `getNeighborCommunities`
  - Community extraction patterns
- **Fix**: Extract shared utilities to a common module like `src/algorithms/community/modularity-utils.ts`.

### 3. Inefficient Graph Iteration Patterns

- **Files**: `src/core/graph.ts:224-235`, `src/algorithms/community/louvain.ts:233-266`
- **Description**: Several places use `Array.from(map)` to iterate over Maps, which creates unnecessary intermediate arrays.
- **Example**: `src/core/graph.ts:225`
```typescript
for (const [source, edges] of Array.from(this.adjacencyList)) {
```
- **Fix**: Iterate directly over the Map:
```typescript
for (const [source, edges] of this.adjacencyList) {
```

### 4. Excessive Null Checks Due to TypeScript strictNullChecks

- **Files**: `src/clustering/spectral.ts` (throughout)
- **Description**: The code has many verbose null checks on array indices that make the code harder to read while being necessary for type safety.
- **Example**: `src/clustering/spectral.ts:328-336`
```typescript
const matrixVal = matrixRow?.[j];
if (matrixVal !== undefined && vecVal !== undefined) {
    const nvVal = newVector[i];
    if (nvVal !== undefined) {
        newVector[i] = nvVal + (matrixVal * vecVal);
    }
}
```
- **Recommendation**: Consider using assertion helpers or validated array access wrappers for cleaner code while maintaining type safety.

### 5. Unused Tolerance Parameter in Spectral Clustering

- **Files**: `src/clustering/spectral.ts:19`
- **Description**: The `tolerance` option is defined but never used in the implementation.
- **Example**:
```typescript
export interface SpectralClusteringOptions {
    // ...
    tolerance?: number; // Convergence tolerance (default: 1e-4) - UNUSED
}
```
- **Fix**: Either implement tolerance-based convergence checking in k-means or remove the option.

### 6. Magic Numbers in Optimized BFS

- **Files**: `src/algorithms/traversal/bfs-variants.ts:30`, `src/optimized/graph-adapter.ts`
- **Description**: Hard-coded threshold of 10000 nodes for switching to optimized implementations.
- **Example**:
```typescript
if (useOptimized && graph.nodeCount > 10000) {
    const csrGraph = toCSRGraph(graph);
```
- **Fix**: Make threshold configurable or document the reasoning:
```typescript
const LARGE_GRAPH_THRESHOLD = 10000; // Based on benchmarks showing CSR benefits at this scale
```

### 7. Leiden Algorithm Reassigns graph Parameter

- **Files**: `src/algorithms/community/leiden.ts:160-167`
- **Description**: The function parameter `graph` is reassigned, which can be confusing.
- **Example**:
```typescript
const {graph: newGraph} = aggregated;
graph = newGraph;  // Reassigns parameter
```
- **Fix**: Use a different variable name:
```typescript
let currentGraph = graph;
// ... later ...
currentGraph = newGraph;
```

### 8. Missing Type Exports for Result Interfaces

- **Files**: `src/index.ts`
- **Description**: Several result type interfaces are not exported.
- **Missing**: `SpectralClusteringResult`, `TeraHACResult`, `LeidenResult`, `MaxFlowResult`
- **Fix**: Add to exports for better TypeScript consumer experience.

---

## Low Priority Issues (Nice to Have)

### 1. Inconsistent JSDoc Documentation Style
- Some functions have comprehensive JSDoc (e.g., `dijkstra`), while others have minimal or no documentation (e.g., some utility functions).

### 2. Test File Uses Non-Null Assertions
- Test files like `dijkstra.test.ts` use `results.get("a")!.distance` which is acceptable for tests but could use safer alternatives.

### 3. Mixed String/Number Comparison in CSR Graph Sort
- `src/optimized/csr-graph.ts:69-76` uses string locale comparison as fallback, which may produce unexpected orderings for certain node ID types.

### 4. Benchmark Scripts Not in devDependencies Scripts
- Some benchmark utilities are TypeScript files run via tsx rather than proper npm scripts.

### 5. No Input Validation for Negative numClusters
- `src/clustering/spectral.ts` and `src/research/terahac.ts` don't validate that `numClusters`/`k` is positive.

### 6. Comment Says "Louvain import removed" Still Present
- `src/algorithms/community/leiden.ts:11` has a stale comment about removed imports.

---

## Positive Findings

### 1. Excellent Type Safety
The codebase demonstrates strong TypeScript usage with generics (`Graph<TNodeId>`), proper interface definitions, and comprehensive type exports. The `strictNullChecks` compliance ensures robust null handling.

### 2. Consistent Algorithm Pattern
All algorithms follow a consistent pattern:
```typescript
export function algorithmName(
    graph: Graph,
    options?: AlgorithmOptions
): AlgorithmResult {
    // Implementation
}
```
This makes the API predictable and easy to learn.

### 3. Comprehensive Test Coverage
Tests cover edge cases thoroughly:
- Empty graphs
- Single node graphs
- Disconnected components
- Directed vs undirected
- Self-loops
- Parallel edges
- Negative weights (where applicable)

### 4. Performance Optimizations
The optimized module demonstrates sophisticated performance engineering:
- CSR graph format for cache efficiency
- Direction-optimized BFS
- Bit-packed data structures
- Automatic optimization selection based on graph size

### 5. Good Separation of Concerns
The codebase cleanly separates:
- Core graph data structure
- Algorithm implementations
- Optimized variants
- Utility functions
- Type definitions

### 6. Proper Error Messages
Most error messages are descriptive and actionable:
```typescript
throw new Error(`Node ${String(node)} not found in graph`);
throw new Error("Dijkstra's algorithm does not support negative edge weights");
```

---

## Recommendations

### Priority 1 (This Sprint)
1. Fix division by zero in personalized PageRank
2. Add safety check for infinite loop in TeraHAC
3. Export missing options types from package entry point

### Priority 2 (Next Sprint)
4. Fix CSR weighted BFS to use actual edge weights
5. Remove redundant ternary in degree centrality
6. Document spectral clustering eigenvalue approximation limitations

### Priority 3 (Backlog)
7. Extract shared modularity utilities from Louvain/Leiden
8. Replace `Array.from()` with direct iteration patterns
9. Add configurable thresholds for optimization switching
10. Improve JSDoc coverage for utility functions

---

## Appendix: Files Reviewed

```
src/
├── index.ts
├── core/graph.ts
├── types/index.ts
├── algorithms/
│   ├── index.ts
│   ├── centrality/
│   │   ├── index.ts
│   │   ├── betweenness.ts
│   │   ├── closeness.ts
│   │   ├── degree.ts
│   │   └── pagerank.ts
│   ├── community/
│   │   ├── leiden.ts
│   │   └── louvain.ts
│   ├── shortest-path/
│   │   ├── index.ts
│   │   └── dijkstra.ts
│   └── traversal/
│       ├── bfs.ts
│       └── bfs-variants.ts
├── clustering/
│   └── spectral.ts
├── data-structures/
│   ├── priority-queue.ts
│   └── union-find.ts
├── flow/
│   └── ford-fulkerson.ts
├── optimized/
│   ├── index.ts
│   ├── csr-graph.ts
│   ├── direction-optimized-bfs.ts
│   ├── graph-adapter.ts
│   └── bit-packed.ts
├── research/
│   └── terahac.ts
└── utils/
    ├── graph-converters.ts
    ├── graph-utilities.ts
    └── math-utilities.ts

test/
├── unit/
│   ├── dijkstra.test.ts
│   ├── pagerank.test.ts
│   └── [other test files]
└── browser/
    └── basic.test.ts

Configuration:
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── eslint.config.js
```

---

*Report generated: December 15, 2025*
