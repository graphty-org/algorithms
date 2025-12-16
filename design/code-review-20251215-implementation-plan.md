# Implementation Plan for Code Review Remediation (12/15/2025)

## Overview

This implementation plan addresses 21 issues identified in the code review of `@graphty/algorithms`. The plan is organized into 5 phases, progressing from critical bug fixes through code quality improvements, with each phase delivering independently testable and verifiable functionality.

**Total Issues**: 2 Critical, 5 High, 8 Medium, 6 Low
**Estimated Duration**: 5 phases

---

## Phase Breakdown

### Phase 1: Critical Bug Fixes

**Objective**: Fix the two critical issues that can cause data corruption or infinite loops in production.

**Tests to Write First**:

- `test/unit/pagerank.test.ts`: Add test case for empty personal nodes array
  ```typescript
  it("should handle empty personal nodes array gracefully", () => {
      const graph = new Graph({directed: true});
      graph.addEdge("A", "B");
      graph.addEdge("B", "C");
      graph.addEdge("C", "A");

      // Should NOT produce NaN values
      const result = personalizedPageRank(graph, []);

      // Verify no NaN values in results
      const hasNaN = Object.values(result.ranks).some((v) => Number.isNaN(v));
      expect(hasNaN).toBe(false);

      // Sum should approximately equal 1
      const sum = Object.values(result.ranks).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
  });
  ```

- `test/unit/terahac.test.ts`: Add test case for algorithm termination
  ```typescript
  it("should terminate with valid result when merge candidates exhaust", () => {
      // Create graph where clusters can't always merge
      const graph = new Graph();
      for (let i = 0; i < 10; i++) {
          graph.addNode(`isolated_${i}`);
      }

      const config: TeraHACConfig = {distanceThreshold: 0.5};
      const result = teraHAC(graph, config);

      // Should complete without hanging
      expect(result.dendrogram).toBeDefined();
      expect(result.clusters.size).toBe(10);
  });

  it("should break out of loop when no valid clusters found", () => {
      const graph = new Graph();
      graph.addNode("A");
      graph.addNode("B");
      // No edges - disconnected

      const config: TeraHACConfig = {numClusters: 1};
      const result = teraHAC(graph, config);

      // Should complete and have dendrogram
      expect(result.dendrogram).toBeDefined();
  });
  ```

**Implementation**:

- `src/algorithms/centrality/pagerank.ts`: Fix division by zero in personalizedPageRank
  ```typescript
  export function personalizedPageRank(
      graph: Graph,
      personalNodes: NodeId[],
      options: Omit<PageRankOptions, "personalization"> = {},
  ): PageRankResult {
      // Handle empty personal nodes by falling back to standard PageRank
      if (personalNodes.length === 0) {
          return pageRank(graph, options);
      }
      // ... existing implementation
  }
  ```

- `src/research/terahac.ts`: Add safety check for infinite loop
  ```typescript
  // In main clustering loop
  while (clusters.size > 1 && mergeCandidates.length > 0) {
      // ... existing code

      const cluster1 = clusters.get(cluster1Id);
      const cluster2 = clusters.get(cluster2Id);

      // Safety check - break if clusters no longer exist (stale candidates)
      if (!cluster1 || !cluster2) {
          // Remove stale candidate and continue
          continue;
      }

      // ... rest of merge logic
  }
  ```

**Dependencies**:
- External: None
- Internal: None (first phase)

**Verification**:
1. Run: `npm run test:run -- test/unit/pagerank.test.ts`
2. Run: `npm run test:run -- test/unit/terahac.test.ts`
3. Expected output: All tests pass including new edge case tests

---

### Phase 2: High Priority API Corrections

**Objective**: Fix inconsistent APIs and missing exports that affect library consumers.

**Tests to Write First**:

- `test/unit/ford-fulkerson.test.ts`: Verify API consistency
  ```typescript
  describe("API consistency", () => {
      it("fordFulkerson should accept Graph type", () => {
          const graph = new Graph({directed: true});
          graph.addEdge("source", "a", 10);
          graph.addEdge("a", "sink", 10);

          const result = fordFulkerson(graph, "source", "sink");
          expect(result.maxFlow).toBe(10);
      });

      it("edmondsKarp should accept Graph type", () => {
          const graph = new Graph({directed: true});
          graph.addEdge("source", "a", 10);
          graph.addEdge("a", "sink", 10);

          const result = edmondsKarp(graph, "source", "sink");
          expect(result.maxFlow).toBe(10);
      });
  });
  ```

- `test/unit/bfs-variants.test.ts`: Add test for CSR weighted distances
  ```typescript
  describe("bfsWeightedDistancesCSR", () => {
      it("should use actual edge weights from CSR graph", () => {
          const graph = new Graph({directed: false});
          graph.addEdge("A", "B", 1);
          graph.addEdge("B", "C", 5);
          graph.addEdge("A", "C", 10);

          // Direct route A->C: weight 10
          // Via B route A->B->C: weight 1+5=6

          const distances = bfsWeightedDistances(graph, "A", undefined, {optimized: true});

          // Should find weighted shortest path
          expect(distances.get("C")).toBe(6); // Via B, not 10 direct
      });
  });
  ```

- `test/unit/exports.test.ts`: Create new test file to verify type exports
  ```typescript
  import {describe, it, expect} from "vitest";
  import type {
      ClosenessCentralityOptions,
      SpectralClusteringOptions,
      SpectralClusteringResult,
      TeraHACConfig,
      TeraHACResult,
      LeidenOptions,
      LeidenResult,
      MaxFlowResult,
  } from "../../src/index.js";

  describe("Type exports", () => {
      it("should export all algorithm option types", () => {
          // These tests verify TypeScript compilation succeeds
          const closeOptions: ClosenessCentralityOptions = {normalized: true};
          const spectralOptions: SpectralClusteringOptions = {k: 3};
          const terahacConfig: TeraHACConfig = {numClusters: 5};
          const leidenOptions: LeidenOptions = {resolution: 1.0};

          expect(closeOptions).toBeDefined();
          expect(spectralOptions).toBeDefined();
          expect(terahacConfig).toBeDefined();
          expect(leidenOptions).toBeDefined();
      });

      it("should export all result types", () => {
          // Type assertion tests
          const spectralResult = {} as SpectralClusteringResult;
          const terahacResult = {} as TeraHACResult;
          const leidenResult = {} as LeidenResult;
          const flowResult = {} as MaxFlowResult;

          expect(spectralResult).toBeDefined();
          expect(terahacResult).toBeDefined();
          expect(leidenResult).toBeDefined();
          expect(flowResult).toBeDefined();
      });
  });
  ```

**Implementation**:

- `src/index.ts`: Add missing type exports
  ```typescript
  // Add to type exports section
  export type {
      ClosenessCentralityOptions,
  } from "./algorithms/centrality/closeness.js";

  export type {
      SpectralClusteringOptions,
      SpectralClusteringResult,
  } from "./clustering/spectral.js";

  export type {
      TeraHACConfig,
      TeraHACResult,
      ClusterNode,
  } from "./research/terahac.js";

  export type {
      LeidenOptions,
      LeidenResult,
  } from "./algorithms/community/leiden.js";

  export type {
      MaxFlowResult,
      FlowEdge,
      FlowNetwork,
  } from "./flow/ford-fulkerson.js";
  ```

- `src/algorithms/centrality/closeness.ts`: Add and export options interface (if not already defined)
  ```typescript
  export interface ClosenessCentralityOptions {
      normalized?: boolean;
      wf_improved?: boolean; // Wasserman-Faust improved formula
  }
  ```

- `src/algorithms/traversal/bfs-variants.ts`: Fix CSR weighted BFS to use actual weights
  ```typescript
  // In bfsWeightedDistancesCSR function, replace:
  // const weight = 1;
  // With:
  const weight = graph.getEdgeWeight(current, neighbor) ?? 1;
  ```

- `src/research/terahac.ts`: Replace console.warn with configurable warning handling
  ```typescript
  export interface TeraHACConfig {
      // ... existing options
      /** Custom warning handler (default: console.warn) */
      onWarning?: (message: string) => void;
  }

  // In teraHAC function:
  const warn = config.onWarning ?? console.warn;
  if (nodeCount > maxNodes) {
      warn(`Graph has ${String(nodeCount)} nodes, exceeds maxNodes (${String(maxNodes)})`);
  }
  ```

**Dependencies**:
- External: None
- Internal: Phase 1 completed

**Verification**:
1. Run: `npm run test:run -- test/unit/exports.test.ts`
2. Run: `npm run test:run -- test/unit/ford-fulkerson.test.ts`
3. Run: `npm run test:run -- test/unit/bfs-variants.test.ts`
4. Run: `npm run typecheck` (verify no TypeScript errors with new exports)
5. Expected output: All tests pass, TypeScript compilation succeeds

---

### Phase 3: Code Correctness and Documentation

**Objective**: Fix medium priority issues that affect code correctness and add necessary documentation.

**Tests to Write First**:

- `test/unit/degree-centrality.test.ts`: Add test verifying normalization is correct
  ```typescript
  describe("normalization", () => {
      it("should normalize correctly for directed and undirected graphs", () => {
          const undirectedGraph = new Graph({directed: false});
          undirectedGraph.addEdge("A", "B");
          undirectedGraph.addEdge("B", "C");
          undirectedGraph.addEdge("C", "A");

          const directedGraph = new Graph({directed: true});
          directedGraph.addEdge("A", "B");
          directedGraph.addEdge("B", "C");
          directedGraph.addEdge("C", "A");

          const undirResult = degreeCentrality(undirectedGraph, {normalized: true});
          const dirResult = degreeCentrality(directedGraph, {normalized: true});

          // Both should have same normalization factor (nodeCount - 1)
          expect(undirResult.A).toBeCloseTo(1, 5); // degree 2 / (3-1) = 1
          expect(dirResult.A).toBeCloseTo(0.5, 5); // degree 1 / (3-1) = 0.5
      });
  });
  ```

- `test/unit/spectral-clustering.test.ts`: Add test documenting eigenvalue limitation
  ```typescript
  describe("eigenvalue computation", () => {
      it("should use approximate eigenvalues (known limitation)", () => {
          const graph = new Graph();
          // Create a simple graph
          graph.addEdge("A", "B");
          graph.addEdge("B", "C");
          graph.addEdge("C", "A");

          const result = spectralClustering(graph, {k: 2});

          // Eigenvalues are approximate - document this behavior
          if (result.eigenvalues) {
              // First eigenvalue for normalized Laplacian should be 0
              expect(result.eigenvalues[0]).toBeCloseTo(0, 1);
              // Second eigenvalue is approximate
              expect(result.eigenvalues[1]).toBeDefined();
          }

          // Despite approximate eigenvalues, clustering should still work
          expect(result.communities.length).toBeGreaterThan(0);
      });
  });
  ```

- `test/unit/leiden.test.ts`: Add test for parameter reassignment issue
  ```typescript
  describe("graph parameter handling", () => {
      it("should not modify the original graph", () => {
          const graph = new Graph({directed: false});
          graph.addEdge("A", "B");
          graph.addEdge("B", "C");
          graph.addEdge("C", "A");

          const originalNodeCount = graph.nodeCount;
          const originalEdgeCount = graph.edgeCount;

          leiden(graph, {maxIterations: 10});

          // Original graph should be unchanged
          expect(graph.nodeCount).toBe(originalNodeCount);
          expect(graph.edgeCount).toBe(originalEdgeCount);
      });
  });
  ```

**Implementation**:

- `src/algorithms/centrality/degree.ts`: Remove redundant ternary
  ```typescript
  // Replace:
  // const maxPossibleDegree = graph.isDirected ? nodeCount - 1 : nodeCount - 1;
  // With:
  const maxPossibleDegree = nodeCount - 1;
  ```

- `src/clustering/spectral.ts`: Add JSDoc warning about eigenvalue approximation and remove/implement tolerance
  ```typescript
  /**
   * Perform spectral clustering on a graph
   *
   * @warning This implementation uses simplified power iteration for eigenvector
   * computation with approximate eigenvalues. For production use cases requiring
   * precise clustering, consider using a proper linear algebra library like ml-matrix.
   *
   * The approximate eigenvalues (0.1, 0.2 for second and third eigenvectors) work
   * well for most graph structures but may produce suboptimal results for graphs
   * with unusual spectral properties.
   */
  export function spectralClustering(...)

  // Option 1: Remove unused tolerance parameter
  export interface SpectralClusteringOptions {
      k: number;
      laplacianType?: "unnormalized" | "normalized" | "randomWalk";
      maxIterations?: number;
      // Removed: tolerance - not currently used in k-means implementation
  }

  // Option 2 (preferred): Implement tolerance in k-means
  // In kMeansClustering function, add convergence check using tolerance
  ```

- `src/algorithms/community/leiden.ts`: Fix parameter reassignment
  ```typescript
  // Replace:
  // const {graph: newGraph} = aggregated;
  // graph = newGraph;

  // With:
  let currentGraph = graph instanceof Map ? graph : graphToMap(graph);
  // ... later in loop:
  const {graph: aggregatedGraph} = aggregated;
  currentGraph = aggregatedGraph;
  ```

- `src/core/graph.ts`: Remove unnecessary Array.from in iteration
  ```typescript
  // Replace:
  // for (const [source, edges] of Array.from(this.adjacencyList)) {
  // With:
  for (const [source, edges] of this.adjacencyList) {
  ```

- `src/algorithms/community/louvain.ts`: Same Array.from optimization
  ```typescript
  // Apply same pattern to louvain.ts iteration loops
  ```

**Dependencies**:
- External: None
- Internal: Phase 2 completed

**Verification**:
1. Run: `npm run test:run -- test/unit/degree-centrality.test.ts`
2. Run: `npm run test:run -- test/unit/spectral-clustering.test.ts`
3. Run: `npm run test:run -- test/unit/leiden.test.ts`
4. Run: `npm run lint` (verify no lint errors)
5. Run: `npm run build` (verify build succeeds)
6. Expected output: All tests pass, no lint errors

---

### Phase 4: Code Quality and Refactoring

**Objective**: Extract shared utilities and improve code maintainability.

**Tests to Write First**:

- `test/unit/modularity-utils.test.ts`: Create new test file for shared utilities
  ```typescript
  import {describe, expect, it} from "vitest";
  import {
      calculateModularity,
      getNeighborCommunities,
      getTotalEdgeWeight,
      getNodeDegree,
  } from "../../src/algorithms/community/modularity-utils.js";
  import {Graph} from "../../src/core/graph.js";

  describe("Modularity utilities", () => {
      describe("calculateModularity", () => {
          it("should calculate modularity for simple partition", () => {
              const graph = new Graph({directed: false});
              graph.addEdge("A", "B");
              graph.addEdge("C", "D");

              const communities = new Map([
                  ["A", 0], ["B", 0],
                  ["C", 1], ["D", 1],
              ]);

              const modularity = calculateModularity(graph, communities, 1.0);

              // Perfect partition should have high modularity
              expect(modularity).toBeGreaterThan(0.4);
          });
      });

      describe("getTotalEdgeWeight", () => {
          it("should sum all edge weights", () => {
              const graph = new Graph({directed: false});
              graph.addEdge("A", "B", 2);
              graph.addEdge("B", "C", 3);

              const total = getTotalEdgeWeight(graph);
              expect(total).toBe(5);
          });
      });

      describe("getNodeDegree", () => {
          it("should calculate weighted degree", () => {
              const graph = new Graph({directed: false});
              graph.addEdge("A", "B", 2);
              graph.addEdge("A", "C", 3);

              const degree = getNodeDegree(graph, "A");
              expect(degree).toBe(5);
          });
      });
  });
  ```

- `test/unit/input-validation.test.ts`: Create tests for input validation
  ```typescript
  import {describe, expect, it} from "vitest";
  import {spectralClustering} from "../../src/clustering/spectral.js";
  import {teraHAC} from "../../src/research/terahac.js";
  import {Graph} from "../../src/core/graph.js";

  describe("Input validation", () => {
      describe("spectralClustering", () => {
          it("should throw for negative k", () => {
              const graph = new Graph();
              graph.addEdge("A", "B");

              expect(() => {
                  spectralClustering(graph, {k: -1});
              }).toThrow("k must be a positive integer");
          });

          it("should throw for k = 0", () => {
              const graph = new Graph();
              graph.addEdge("A", "B");

              expect(() => {
                  spectralClustering(graph, {k: 0});
              }).toThrow("k must be a positive integer");
          });
      });

      describe("teraHAC", () => {
          it("should throw for negative numClusters", () => {
              const graph = new Graph();
              graph.addEdge("A", "B");

              expect(() => {
                  teraHAC(graph, {numClusters: -1});
              }).toThrow("numClusters must be a positive integer");
          });
      });
  });
  ```

**Implementation**:

- `src/algorithms/community/modularity-utils.ts`: Create new shared utilities file
  ```typescript
  /**
   * Shared modularity calculation utilities for community detection algorithms
   *
   * Used by: Louvain, Leiden, Girvan-Newman
   */
  import type {Graph} from "../../core/graph.js";
  import type {NodeId} from "../../types/index.js";

  /**
   * Calculate total edge weight in the graph
   */
  export function getTotalEdgeWeight(graph: Graph): number {
      let totalWeight = 0;
      for (const edge of graph.edges()) {
          totalWeight += edge.weight ?? 1;
      }
      return totalWeight;
  }

  /**
   * Get the total degree (sum of edge weights) for a node
   */
  export function getNodeDegree(graph: Graph, nodeId: NodeId): number {
      let degree = 0;
      for (const neighbor of graph.neighbors(nodeId)) {
          const edge = graph.getEdge(nodeId, neighbor);
          degree += edge?.weight ?? 1;
      }
      return degree;
  }

  /**
   * Get communities of neighboring nodes
   */
  export function getNeighborCommunities(
      graph: Graph,
      nodeId: NodeId,
      communities: Map<NodeId, number>,
  ): Set<number> {
      const neighborCommunities = new Set<number>();
      for (const neighbor of graph.neighbors(nodeId)) {
          const community = communities.get(neighbor);
          if (community !== undefined) {
              neighborCommunities.add(community);
          }
      }
      return neighborCommunities;
  }

  /**
   * Calculate modularity of a partition
   */
  export function calculateModularity(
      graph: Graph,
      communities: Map<NodeId, number>,
      resolution: number = 1.0,
  ): number {
      // Implementation extracted from louvain.ts
      // ...
  }
  ```

- `src/algorithms/community/louvain.ts`: Refactor to use shared utilities
  ```typescript
  // Import shared utilities
  import {
      getTotalEdgeWeight,
      getNodeDegree,
      getNeighborCommunities,
      calculateModularity,
  } from "./modularity-utils.js";

  // Remove duplicate local implementations
  ```

- `src/algorithms/community/leiden.ts`: Remove stale comment, use shared utilities where applicable
  ```typescript
  // Remove: // Louvain import removed - not used in this implementation
  ```

- `src/clustering/spectral.ts` and `src/research/terahac.ts`: Add input validation
  ```typescript
  // In spectralClustering:
  if (k < 1 || !Number.isInteger(k)) {
      throw new Error("k must be a positive integer");
  }

  // In teraHAC:
  if (numClusters !== undefined && (numClusters < 1 || !Number.isInteger(numClusters))) {
      throw new Error("numClusters must be a positive integer");
  }
  ```

- `src/algorithms/traversal/bfs-variants.ts`: Add constant for optimization threshold
  ```typescript
  /**
   * Threshold for switching to CSR-optimized implementations.
   * Based on benchmarks showing CSR benefits at this scale due to
   * improved cache locality and reduced memory allocation overhead.
   */
  const LARGE_GRAPH_THRESHOLD = 10000;

  // Replace magic number usage:
  // if (useOptimized && graph.nodeCount > 10000) {
  // With:
  if (useOptimized && graph.nodeCount > LARGE_GRAPH_THRESHOLD) {
  ```

**Dependencies**:
- External: None
- Internal: Phase 3 completed

**Verification**:
1. Run: `npm run test:run -- test/unit/modularity-utils.test.ts`
2. Run: `npm run test:run -- test/unit/input-validation.test.ts`
3. Run: `npm run test:run -- test/unit/louvain.test.ts`
4. Run: `npm run test:run -- test/unit/leiden.test.ts`
5. Run: `npm run lint`
6. Run: `npm run build`
7. Expected output: All tests pass, no regressions in community detection

---

### Phase 5: Documentation and Low Priority Cleanup

**Objective**: Improve documentation consistency and clean up remaining low priority issues.

**Tests to Write First**:

- No new tests needed - this phase focuses on documentation and comments

**Implementation**:

- `src/algorithms/centrality/closeness.ts`: Add comprehensive JSDoc
  ```typescript
  /**
   * Calculate closeness centrality for all nodes in the graph
   *
   * Closeness centrality measures how close a node is to all other nodes
   * in the graph. It is the reciprocal of the sum of the shortest path
   * distances to all other reachable nodes.
   *
   * @param graph - The input graph
   * @param options - Algorithm options
   * @returns Centrality scores for each node
   *
   * @example
   * ```typescript
   * const graph = new Graph();
   * graph.addEdge("A", "B");
   * graph.addEdge("B", "C");
   *
   * const centrality = closenessCentrality(graph);
   * // { A: 0.5, B: 1.0, C: 0.5 }
   * ```
   *
   * Time Complexity: O(V * (V + E)) for unweighted graphs
   * Space Complexity: O(V)
   */
  ```

- Add JSDoc to utility functions across:
  - `src/utils/graph-utilities.ts`
  - `src/utils/math-utilities.ts`
  - `src/utils/graph-converters.ts`

- `src/optimized/csr-graph.ts`: Fix string locale comparison comment
  ```typescript
  // Add comment explaining sort behavior:
  // Sort nodes for consistent ordering. Numeric IDs sort numerically,
  // string IDs sort lexicographically for predictable iteration order.
  const nodes = Array.from(allNodes).sort((a, b) => {
      if (typeof a === "number" && typeof b === "number") {
          return a - b;
      }
      return String(a).localeCompare(String(b));
  });
  ```

- Update test files to use safer patterns where beneficial:
  - Document that `!` assertions are intentional in test code for readability
  - Add `// eslint-disable-next-line @typescript-eslint/no-non-null-assertion` where used

- `package.json`: Add benchmark scripts if missing
  ```json
  "scripts": {
      "benchmark:betweenness": "tsx benchmarks/betweenness.ts",
      "benchmark:community": "tsx benchmarks/community.ts"
  }
  ```

**Dependencies**:
- External: None
- Internal: Phase 4 completed

**Verification**:
1. Run: `npm run build`
2. Run: `npm run lint`
3. Run: `npm run test:all`
4. Verify JSDoc appears in IDE tooltips for documented functions
5. Expected output: Clean build, all tests pass

---

## Common Utilities Needed

| Utility | Purpose | Used By |
|---------|---------|---------|
| `modularity-utils.ts` | Shared modularity calculations | Louvain, Leiden, Girvan-Newman |
| `LARGE_GRAPH_THRESHOLD` | Configurable optimization switching | BFS variants, CSR conversion |
| Input validation helpers | Consistent parameter validation | Spectral, TeraHAC, K-means |

---

## External Libraries Assessment

| Task | Recommendation | Rationale |
|------|---------------|-----------|
| Eigenvalue computation | Consider `ml-matrix` | Current power iteration uses approximate eigenvalues; ml-matrix provides proper eigendecomposition but adds ~100KB bundle size |
| Linear algebra | Keep current | Power iteration is sufficient for most use cases; document limitations instead |

**Decision**: Document eigenvalue limitations clearly rather than adding external dependency. Users with critical clustering requirements can use their own linear algebra library with the raw Laplacian matrix.

---

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Refactoring Louvain/Leiden breaks existing behavior | Comprehensive test coverage exists; run full test suite after each change |
| New exports break API compatibility | Adding exports is backwards compatible; verify with `npm pack` and test import in sample project |
| Performance regression from Array.from removal | Benchmark before/after; iteration patterns should be faster, not slower |
| TeraHAC infinite loop fix changes clustering results | Add test comparing results before/after fix for deterministic inputs |

---

## Summary by Priority

| Phase | Issues Addressed | Priority Level |
|-------|-----------------|----------------|
| Phase 1 | 2 | Critical |
| Phase 2 | 5 | High |
| Phase 3 | 4 | Medium |
| Phase 4 | 4 | Medium |
| Phase 5 | 6 | Low |

---

*Implementation Plan created: December 15, 2025*
