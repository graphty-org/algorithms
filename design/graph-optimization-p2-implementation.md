# Graph Optimization Phase 2 Implementation Plan

## Overview

This document outlines the implementation plan for Phase 2 of the graph optimization project, focusing on Priority 2 algorithm-specific optimizations from the optimization report. These optimizations target 2-10x performance improvements on critical algorithms.

## Phase 2 Objectives

1. Implement Bidirectional Dijkstra (2-4x speedup)
2. Implement Delta-Based PageRank (5-10x speedup)
3. Optimize Louvain Algorithm with early pruning and threshold cycling
4. Create comprehensive benchmarks for all optimizations

## Implementation Steps

### Step 1: Bidirectional Dijkstra Implementation

#### 1.1 Create Bidirectional Search Infrastructure
- **File**: `src/shortest-path/bidirectional-dijkstra.ts`
- **Tasks**:
  - Create `BidirectionalDijkstra` class with forward and backward search states
  - Implement dual priority queue management
  - Add meeting point detection logic
  - Create path reconstruction from bidirectional search

**Detailed Implementation:**

```typescript
// src/shortest-path/bidirectional-dijkstra.ts
import { Graph, ReadonlyGraph } from '../graph/types';
import { MinHeap } from '../utils/min-heap';

interface SearchState<TNodeId> {
  distances: Map<TNodeId, number>;
  previous: Map<TNodeId, TNodeId | null>;
  visited: Set<TNodeId>;
  frontier: MinHeap<{ node: TNodeId; distance: number }>;
}

export class BidirectionalDijkstra<TNodeId> {
  private graph: ReadonlyGraph<TNodeId>;
  private forwardSearch: SearchState<TNodeId>;
  private backwardSearch: SearchState<TNodeId>;
  private meetingNode: TNodeId | null = null;
  private shortestDistance: number = Infinity;

  constructor(graph: ReadonlyGraph<TNodeId>) {
    this.graph = graph;
    this.forwardSearch = this.initSearchState();
    this.backwardSearch = this.initSearchState();
  }

  private initSearchState(): SearchState<TNodeId> {
    return {
      distances: new Map(),
      previous: new Map(),
      visited: new Set(),
      frontier: new MinHeap((a, b) => a.distance - b.distance)
    };
  }

  public findShortestPath(source: TNodeId, target: TNodeId): {
    distance: number;
    path: TNodeId[];
  } | null {
    // Initialize forward search from source
    this.forwardSearch.distances.set(source, 0);
    this.forwardSearch.previous.set(source, null);
    this.forwardSearch.frontier.push({ node: source, distance: 0 });

    // Initialize backward search from target
    this.backwardSearch.distances.set(target, 0);
    this.backwardSearch.previous.set(target, null);
    this.backwardSearch.frontier.push({ node: target, distance: 0 });

    // Main search loop
    while (!this.forwardSearch.frontier.isEmpty() && 
           !this.backwardSearch.frontier.isEmpty()) {
      
      // Alternate between forward and backward search
      // Choose the search with smaller frontier for better performance
      if (this.forwardSearch.frontier.size() <= this.backwardSearch.frontier.size()) {
        if (this.expandSearch(this.forwardSearch, this.backwardSearch, true)) {
          break;
        }
      } else {
        if (this.expandSearch(this.backwardSearch, this.forwardSearch, false)) {
          break;
        }
      }

      // Early termination check
      const minForward = this.forwardSearch.frontier.peek()?.distance ?? Infinity;
      const minBackward = this.backwardSearch.frontier.peek()?.distance ?? Infinity;
      
      if (minForward + minBackward >= this.shortestDistance) {
        break;
      }
    }

    if (this.meetingNode === null) {
      return null;
    }

    return {
      distance: this.shortestDistance,
      path: this.reconstructPath()
    };
  }

  private expandSearch(
    search: SearchState<TNodeId>,
    oppositeSearch: SearchState<TNodeId>,
    isForward: boolean
  ): boolean {
    const current = search.frontier.pop();
    if (!current) return false;

    const { node, distance } = current;
    
    if (search.visited.has(node)) {
      return false;
    }
    
    search.visited.add(node);

    // Check if we've met the opposite search
    if (oppositeSearch.distances.has(node)) {
      const totalDistance = distance + oppositeSearch.distances.get(node)!;
      if (totalDistance < this.shortestDistance) {
        this.shortestDistance = totalDistance;
        this.meetingNode = node;
      }
    }

    // Explore neighbors
    const edges = isForward 
      ? this.graph.outEdges(node) 
      : this.graph.inEdges(node);

    for (const edge of edges) {
      const neighbor = isForward ? edge.target : edge.source;
      const newDistance = distance + (edge.weight ?? 1);

      if (!search.visited.has(neighbor) &&
          (!search.distances.has(neighbor) || 
           newDistance < search.distances.get(neighbor)!)) {
        
        search.distances.set(neighbor, newDistance);
        search.previous.set(neighbor, node);
        search.frontier.push({ node: neighbor, distance: newDistance });
      }
    }

    return false;
  }

  private reconstructPath(): TNodeId[] {
    if (!this.meetingNode) return [];

    const path: TNodeId[] = [];
    
    // Reconstruct forward path
    let current: TNodeId | null = this.meetingNode;
    const forwardPath: TNodeId[] = [];
    
    while (current !== null) {
      forwardPath.push(current);
      current = this.forwardSearch.previous.get(current) ?? null;
    }
    
    // Add forward path in reverse order (except meeting node)
    for (let i = forwardPath.length - 1; i > 0; i--) {
      path.push(forwardPath[i]);
    }
    
    // Add meeting node
    path.push(this.meetingNode);
    
    // Reconstruct and add backward path
    current = this.backwardSearch.previous.get(this.meetingNode) ?? null;
    while (current !== null) {
      path.push(current);
      current = this.backwardSearch.previous.get(current) ?? null;
    }
    
    return path;
  }
}
```

**Key Optimizations:**
1. **Alternating expansion**: Choose the search direction with smaller frontier
2. **Early termination**: Stop when minimum frontier distances exceed best path
3. **Efficient meeting detection**: Check during expansion, not separately
4. **Memory sharing**: Could share visited sets between searches for some graphs

#### 1.2 Integrate with Existing Dijkstra
- **File**: `src/shortest-path/dijkstra.ts`
- **Tasks**:
  - Add `bidirectional` option to Dijkstra options interface
  - Create factory method to choose between standard and bidirectional
  - Ensure backward compatibility with existing API

**Integration Code:**

```typescript
// Update src/shortest-path/dijkstra.ts
import { BidirectionalDijkstra } from './bidirectional-dijkstra';

export interface DijkstraOptions {
  bidirectional?: boolean;
  // ... existing options
}

export function dijkstra<TNodeId = unknown>(
  graph: ReadonlyGraph<TNodeId>,
  source: TNodeId,
  options?: DijkstraOptions
): DijkstraResult<TNodeId> {
  // Single source shortest path - use standard dijkstra
  return standardDijkstra(graph, source, options);
}

export function dijkstraPath<TNodeId = unknown>(
  graph: ReadonlyGraph<TNodeId>,
  source: TNodeId,
  target: TNodeId,
  options?: DijkstraOptions
): { distance: number; path: TNodeId[] } | null {
  // Point-to-point query - can use bidirectional
  if (options?.bidirectional && graph.hasInEdges) {
    const biDijkstra = new BidirectionalDijkstra(graph);
    return biDijkstra.findShortestPath(source, target);
  }
  
  // Fallback to standard implementation
  const result = dijkstra(graph, source, options);
  if (!result.distances.has(target)) {
    return null;
  }
  
  return {
    distance: result.distances.get(target)!,
    path: reconstructPath(result.previous, source, target)
  };
}
```

#### 1.3 Add Optimized Data Structures
- **File**: `src/shortest-path/bidirectional-dijkstra.ts`
- **Tasks**:
  - Implement efficient frontier intersection checking
  - Add early termination when searches meet
  - Optimize memory usage with shared visited sets

**Performance Enhancements:**

```typescript
// Additional optimizations for bidirectional-dijkstra.ts

// Use typed arrays for better performance on large graphs
export class OptimizedBidirectionalDijkstra<TNodeId> {
  private nodeToIndex: Map<TNodeId, number>;
  private indexToNode: TNodeId[];
  private forwardDist: Float32Array;
  private backwardDist: Float32Array;
  private forwardPrev: Int32Array;
  private backwardPrev: Int32Array;
  
  constructor(graph: ReadonlyGraph<TNodeId>) {
    const nodeCount = graph.nodeCount();
    
    // Create node index mapping
    this.nodeToIndex = new Map();
    this.indexToNode = [];
    let index = 0;
    for (const node of graph.nodes()) {
      this.nodeToIndex.set(node, index);
      this.indexToNode[index] = node;
      index++;
    }
    
    // Initialize typed arrays
    this.forwardDist = new Float32Array(nodeCount).fill(Infinity);
    this.backwardDist = new Float32Array(nodeCount).fill(Infinity);
    this.forwardPrev = new Int32Array(nodeCount).fill(-1);
    this.backwardPrev = new Int32Array(nodeCount).fill(-1);
  }
  
  // Optimized frontier using binary heap with index array
  private createIndexedHeap(): IndexedMinHeap {
    return new IndexedMinHeap(this.nodeToIndex.size);
  }
}

// Indexed min heap for O(1) decrease-key operations
class IndexedMinHeap {
  private heap: number[];
  private indices: Int32Array; // node index -> heap position
  private values: Float32Array;
  private size: number = 0;
  
  constructor(capacity: number) {
    this.heap = new Array(capacity);
    this.indices = new Int32Array(capacity).fill(-1);
    this.values = new Float32Array(capacity).fill(Infinity);
  }
  
  push(nodeIndex: number, value: number): void {
    if (this.indices[nodeIndex] !== -1) {
      // Update existing value
      this.decreaseKey(nodeIndex, value);
    } else {
      // Insert new value
      this.heap[this.size] = nodeIndex;
      this.indices[nodeIndex] = this.size;
      this.values[nodeIndex] = value;
      this.bubbleUp(this.size);
      this.size++;
    }
  }
  
  decreaseKey(nodeIndex: number, newValue: number): void {
    const heapIndex = this.indices[nodeIndex];
    if (heapIndex === -1 || newValue >= this.values[nodeIndex]) return;
    
    this.values[nodeIndex] = newValue;
    this.bubbleUp(heapIndex);
  }
  
  // ... heap operations implementation
}
```

#### 1.4 Testing and Verification
- **File**: `test/shortest-path/bidirectional-dijkstra.spec.ts`
- **Tasks**:
  - Test correctness against standard Dijkstra
  - Verify path lengths match exactly
  - Test edge cases: disconnected graphs, single node paths
  - Benchmark speedup on various graph sizes

**Test Implementation:**

```typescript
// test/shortest-path/bidirectional-dijkstra.spec.ts
import { describe, it, expect } from 'vitest';
import { dijkstra, dijkstraPath } from '../../src/shortest-path/dijkstra';
import { createGraph } from '../../src/graph';

describe('Bidirectional Dijkstra', () => {
  it('should produce same results as standard dijkstra', () => {
    const graph = createGraph<string>();
    // Create test graph
    graph.addEdge('A', 'B', 1);
    graph.addEdge('B', 'C', 2);
    graph.addEdge('A', 'D', 4);
    graph.addEdge('D', 'C', 1);
    
    const standardResult = dijkstraPath(graph, 'A', 'C');
    const biResult = dijkstraPath(graph, 'A', 'C', { bidirectional: true });
    
    expect(biResult).toEqual(standardResult);
    expect(biResult?.distance).toBe(3);
    expect(biResult?.path).toEqual(['A', 'B', 'C']);
  });
  
  it('should handle disconnected graphs', () => {
    const graph = createGraph<string>();
    graph.addNode('A');
    graph.addNode('B');
    
    const result = dijkstraPath(graph, 'A', 'B', { bidirectional: true });
    expect(result).toBeNull();
  });
  
  it('should be faster on large sparse graphs', () => {
    const graph = createGraph<number>();
    const n = 10000;
    
    // Create a sparse graph with ~10 edges per node
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 10; j++) {
        const target = (i + j * 1000) % n;
        graph.addEdge(i, target, Math.random());
      }
    }
    
    const source = 0;
    const target = n - 1;
    
    // Benchmark standard dijkstra
    const standardStart = performance.now();
    const standardResult = dijkstraPath(graph, source, target);
    const standardTime = performance.now() - standardStart;
    
    // Benchmark bidirectional dijkstra
    const biStart = performance.now();
    const biResult = dijkstraPath(graph, source, target, { bidirectional: true });
    const biTime = performance.now() - biStart;
    
    expect(biResult?.distance).toBeCloseTo(standardResult?.distance ?? 0);
    expect(biTime).toBeLessThan(standardTime * 0.5); // At least 2x speedup
    
    console.log(`Standard: ${standardTime}ms, Bidirectional: ${biTime}ms`);
    console.log(`Speedup: ${(standardTime / biTime).toFixed(2)}x`);
  });
});
```

### Step 2: Delta-Based PageRank Implementation

#### 2.1 Create Delta PageRank Core
- **File**: `src/centrality/delta-pagerank.ts`
- **Tasks**:
  - Implement delta tracking data structure
  - Create adaptive convergence detection per vertex
  - Add incremental update mechanism
  - Implement priority queue for active vertices

**Detailed Implementation:**

```typescript
// src/centrality/delta-pagerank.ts
import { ReadonlyGraph } from '../graph/types';
import { MinHeap } from '../utils/min-heap';

interface DeltaPageRankOptions {
  damping?: number;
  tolerance?: number;
  maxIterations?: number;
  deltaThreshold?: number; // Minimum delta to keep vertex active
}

export class DeltaPageRank<TNodeId> {
  private graph: ReadonlyGraph<TNodeId>;
  private scores: Map<TNodeId, number>;
  private deltas: Map<TNodeId, number>;
  private activeNodes: Set<TNodeId>;
  private nodeToIndex: Map<TNodeId, number>;
  private outDegrees: Map<TNodeId, number>;
  
  constructor(graph: ReadonlyGraph<TNodeId>) {
    this.graph = graph;
    this.scores = new Map();
    this.deltas = new Map();
    this.activeNodes = new Set();
    this.nodeToIndex = new Map();
    this.outDegrees = new Map();
    
    // Initialize data structures
    let index = 0;
    for (const node of graph.nodes()) {
      this.nodeToIndex.set(node, index++);
      this.scores.set(node, 1.0 / graph.nodeCount());
      this.deltas.set(node, 1.0 / graph.nodeCount());
      this.activeNodes.add(node);
      
      // Precompute out-degrees
      const outDegree = Array.from(graph.outEdges(node)).length;
      this.outDegrees.set(node, outDegree);
    }
  }
  
  public compute(options: DeltaPageRankOptions = {}): Map<TNodeId, number> {
    const {
      damping = 0.85,
      tolerance = 1e-6,
      maxIterations = 100,
      deltaThreshold = tolerance / 10
    } = options;
    
    const n = this.graph.nodeCount();
    const randomJump = (1 - damping) / n;
    
    let iteration = 0;
    
    while (this.activeNodes.size > 0 && iteration < maxIterations) {
      iteration++;
      
      // Create next iteration's active set
      const nextActive = new Set<TNodeId>();
      const nextDeltas = new Map<TNodeId, number>();
      
      // Initialize all deltas to random jump contribution
      for (const node of this.graph.nodes()) {
        nextDeltas.set(node, randomJump);
      }
      
      // Process only active nodes
      for (const node of this.activeNodes) {
        const delta = this.deltas.get(node) ?? 0;
        
        // Skip if delta is too small
        if (Math.abs(delta) < deltaThreshold) {
          continue;
        }
        
        const outDegree = this.outDegrees.get(node) ?? 0;
        if (outDegree === 0) continue;
        
        const contribution = damping * delta / outDegree;
        
        // Distribute delta to neighbors
        for (const edge of this.graph.outEdges(node)) {
          const currentDelta = nextDeltas.get(edge.target) ?? 0;
          nextDeltas.set(edge.target, currentDelta + contribution);
          
          // Mark neighbor as active if delta is significant
          if (Math.abs(currentDelta + contribution) >= deltaThreshold) {
            nextActive.add(edge.target);
          }
        }
      }
      
      // Apply deltas and check convergence
      let maxDelta = 0;
      for (const [node, delta] of nextDeltas) {
        const currentScore = this.scores.get(node) ?? 0;
        this.scores.set(node, currentScore + delta);
        maxDelta = Math.max(maxDelta, Math.abs(delta));
      }
      
      // Update for next iteration
      this.deltas = nextDeltas;
      this.activeNodes = nextActive;
      
      // Global convergence check
      if (maxDelta < tolerance) {
        break;
      }
      
      // Log progress
      if (iteration % 10 === 0) {
        console.log(`Iteration ${iteration}: ${this.activeNodes.size} active nodes, max delta: ${maxDelta}`);
      }
    }
    
    return this.scores;
  }
}

// Priority queue based implementation for even better performance
export class PriorityDeltaPageRank<TNodeId> {
  private priorityQueue: MinHeap<{ node: TNodeId; priority: number }>;
  
  constructor(graph: ReadonlyGraph<TNodeId>) {
    // Priority queue ordered by delta magnitude
    this.priorityQueue = new MinHeap((a, b) => b.priority - a.priority);
    
    // Initialize with all nodes
    for (const node of graph.nodes()) {
      this.priorityQueue.push({
        node,
        priority: 1.0 / graph.nodeCount()
      });
    }
  }
  
  public computeWithPriority(options: DeltaPageRankOptions = {}): Map<TNodeId, number> {
    // Process nodes in order of their delta magnitude
    // This ensures we process the most impactful updates first
    // Implementation details...
  }
}
```

#### 2.2 Optimize PageRank Main Algorithm
- **File**: `src/centrality/pagerank.ts`
- **Tasks**:
  - Add `useDelta` option to PageRank options
  - Implement vertex activity tracking
  - Add early termination for converged vertices
  - Create hybrid mode that switches to delta after initial iterations

**Integration with Main Algorithm:**

```typescript
// Update src/centrality/pagerank.ts
import { DeltaPageRank } from './delta-pagerank';

export interface PageRankOptions {
  damping?: number;
  tolerance?: number;
  maxIterations?: number;
  useDelta?: boolean;
  hybridSwitchIteration?: number; // Switch to delta after N iterations
}

export function pagerank<TNodeId = unknown>(
  graph: ReadonlyGraph<TNodeId>,
  options: PageRankOptions = {}
): Map<TNodeId, number> {
  const {
    useDelta = false,
    hybridSwitchIteration = 5,
    ...deltaOptions
  } = options;
  
  if (useDelta) {
    // Use delta-based implementation from the start
    const deltaPageRank = new DeltaPageRank(graph);
    return deltaPageRank.compute(deltaOptions);
  }
  
  // Standard implementation with optional switch to delta
  return standardPageRankWithHybrid(graph, options);
}

function standardPageRankWithHybrid<TNodeId>(
  graph: ReadonlyGraph<TNodeId>,
  options: PageRankOptions
): Map<TNodeId, number> {
  const {
    damping = 0.85,
    tolerance = 1e-6,
    maxIterations = 100,
    hybridSwitchIteration = 5
  } = options;
  
  const n = graph.nodeCount();
  let scores = new Map<TNodeId, number>();
  let prevScores = new Map<TNodeId, number>();
  
  // Initialize scores
  for (const node of graph.nodes()) {
    scores.set(node, 1.0 / n);
    prevScores.set(node, 1.0 / n);
  }
  
  // Run standard iterations
  for (let iter = 0; iter < hybridSwitchIteration; iter++) {
    const newScores = computeStandardIteration(graph, scores, damping);
    
    // Check convergence
    if (hasConverged(scores, newScores, tolerance)) {
      return newScores;
    }
    
    prevScores = scores;
    scores = newScores;
  }
  
  // Switch to delta-based for remaining iterations
  console.log(`Switching to delta-based PageRank after ${hybridSwitchIteration} iterations`);
  
  // Convert current state to deltas
  const deltaPageRank = new DeltaPageRank(graph);
  deltaPageRank.initializeFromScores(scores, prevScores);
  
  return deltaPageRank.compute({
    ...options,
    maxIterations: maxIterations - hybridSwitchIteration
  });
}
```

#### 2.3 Memory-Efficient Delta Storage
- **File**: `src/centrality/delta-pagerank.ts`
- **Tasks**:
  - Use sparse representation for delta values
  - Implement threshold-based pruning
  - Add batch update mechanism
  - Optimize for cache-friendly access patterns

**Memory Optimization Implementation:**

```typescript
// Enhanced delta storage in delta-pagerank.ts

export class MemoryEfficientDeltaPageRank<TNodeId> {
  // Use typed arrays for better memory efficiency
  private scores: Float32Array;
  private deltas: Float32Array;
  private activeIndices: Uint32Array;
  private activeCount: number;
  
  // Sparse delta storage for very large graphs
  private sparseDeltas: Map<number, number>;
  private useSparse: boolean;
  
  constructor(graph: ReadonlyGraph<TNodeId>, useSparse = false) {
    const n = graph.nodeCount();
    this.scores = new Float32Array(n).fill(1.0 / n);
    this.deltas = new Float32Array(n).fill(1.0 / n);
    this.activeIndices = new Uint32Array(n);
    this.activeCount = n;
    
    // Initialize all nodes as active
    for (let i = 0; i < n; i++) {
      this.activeIndices[i] = i;
    }
    
    this.useSparse = useSparse;
    if (useSparse) {
      this.sparseDeltas = new Map();
    }
  }
  
  public computeOptimized(options: DeltaPageRankOptions = {}): Float32Array {
    const { deltaThreshold = 1e-7 } = options;
    
    while (this.activeCount > 0) {
      // Process in batches for better cache performance
      const batchSize = Math.min(1024, this.activeCount);
      
      for (let batch = 0; batch < this.activeCount; batch += batchSize) {
        const end = Math.min(batch + batchSize, this.activeCount);
        this.processBatch(batch, end, deltaThreshold);
      }
      
      // Prune inactive nodes
      this.pruneInactiveNodes(deltaThreshold);
    }
    
    return this.scores;
  }
  
  private processBatch(start: number, end: number, threshold: number): void {
    // Process a batch of active nodes
    // Prefetch data for better cache utilization
    const prefetchDistance = 8;
    
    for (let i = start; i < end; i++) {
      // Prefetch next nodes
      if (i + prefetchDistance < end) {
        // Simulated prefetch - in real implementation would use intrinsics
        const nextIdx = this.activeIndices[i + prefetchDistance];
        const _ = this.deltas[nextIdx]; // Touch memory
      }
      
      const nodeIdx = this.activeIndices[i];
      const delta = this.deltas[nodeIdx];
      
      if (Math.abs(delta) < threshold) {
        continue;
      }
      
      // Process node and update neighbors
      this.processNode(nodeIdx, delta);
    }
  }
  
  private pruneInactiveNodes(threshold: number): void {
    let newActiveCount = 0;
    
    // Compact active indices array
    for (let i = 0; i < this.activeCount; i++) {
      const idx = this.activeIndices[i];
      if (Math.abs(this.deltas[idx]) >= threshold) {
        this.activeIndices[newActiveCount++] = idx;
      }
    }
    
    this.activeCount = newActiveCount;
    
    // Clear small deltas to save memory
    if (this.useSparse) {
      for (const [idx, delta] of this.sparseDeltas) {
        if (Math.abs(delta) < threshold) {
          this.sparseDeltas.delete(idx);
        }
      }
    }
  }
}
```

#### 2.4 Testing and Benchmarking
- **File**: `test/centrality/delta-pagerank.spec.ts`
- **Tasks**:
  - Verify convergence matches standard PageRank
  - Test on power-law graphs (web-like structures)
  - Measure iteration reduction
  - Benchmark time savings on large graphs

**Comprehensive Tests:**

```typescript
// test/centrality/delta-pagerank.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { pagerank } from '../../src/centrality/pagerank';
import { createGraph } from '../../src/graph';
import { generatePowerLawGraph } from '../utils/graph-generators';

describe('Delta-Based PageRank', () => {
  let powerLawGraph: Graph<number>;
  
  beforeAll(() => {
    // Generate a power-law graph similar to web structure
    powerLawGraph = generatePowerLawGraph(10000, 2.1);
  });
  
  it('should converge to same values as standard PageRank', () => {
    const standardResult = pagerank(powerLawGraph);
    const deltaResult = pagerank(powerLawGraph, { useDelta: true });
    
    // Check that results match within tolerance
    for (const [node, standardScore] of standardResult) {
      const deltaScore = deltaResult.get(node) ?? 0;
      expect(Math.abs(standardScore - deltaScore)).toBeLessThan(1e-6);
    }
  });
  
  it('should reduce iterations significantly', () => {
    let standardIterations = 0;
    let deltaIterations = 0;
    
    // Standard PageRank with iteration counting
    pagerank(powerLawGraph, {
      onIteration: () => standardIterations++
    });
    
    // Delta PageRank with iteration counting
    pagerank(powerLawGraph, {
      useDelta: true,
      onIteration: () => deltaIterations++
    });
    
    console.log(`Standard: ${standardIterations}, Delta: ${deltaIterations}`);
    expect(deltaIterations).toBeLessThan(standardIterations * 0.5);
  });
  
  it('should handle graphs with dangling nodes', () => {
    const graph = createGraph<string>();
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addNode('D'); // Dangling node
    
    const result = pagerank(graph, { useDelta: true });
    
    // Verify all nodes have scores
    expect(result.size).toBe(4);
    
    // Dangling node should have minimum score
    const danglingScore = result.get('D') ?? 0;
    expect(danglingScore).toBeGreaterThan(0);
  });
  
  it('should be faster on large graphs', () => {
    const sizes = [1000, 5000, 10000, 50000];
    
    for (const size of sizes) {
      const graph = generatePowerLawGraph(size, 2.1);
      
      const standardStart = performance.now();
      pagerank(graph);
      const standardTime = performance.now() - standardStart;
      
      const deltaStart = performance.now();
      pagerank(graph, { useDelta: true });
      const deltaTime = performance.now() - deltaStart;
      
      const speedup = standardTime / deltaTime;
      console.log(`Size ${size}: Standard ${standardTime.toFixed(2)}ms, Delta ${deltaTime.toFixed(2)}ms, Speedup: ${speedup.toFixed(2)}x`);
      
      expect(deltaTime).toBeLessThan(standardTime);
    }
  });
});
```

### Step 3: Louvain Algorithm Optimizations

#### 3.1 Implement Early Pruning
- **File**: `src/community/louvain-optimized.ts`
- **Tasks**:
  - Add leaf vertex detection and skipping
  - Implement vertex importance ordering
  - Create pruning statistics tracking
  - Add configurable pruning threshold

**Detailed Implementation:**

```typescript
// src/community/louvain-optimized.ts
import { ReadonlyGraph } from '../graph/types';

interface OptimizedLouvainOptions {
  resolution?: number;
  randomSeed?: number;
  pruneLeaves?: boolean;
  importanceOrdering?: boolean;
  pruningThreshold?: number;
  thresholdCycling?: boolean;
}

export class OptimizedLouvain<TNodeId> {
  private graph: ReadonlyGraph<TNodeId>;
  private communities: Map<TNodeId, number>;
  private communityWeights: Map<number, number>;
  private nodeWeights: Map<TNodeId, number>;
  private totalWeight: number;
  private pruningStats = {
    leafNodesPruned: 0,
    lowDegreeNodesPruned: 0,
    stableNodesPruned: 0
  };
  
  constructor(graph: ReadonlyGraph<TNodeId>) {
    this.graph = graph;
    this.communities = new Map();
    this.communityWeights = new Map();
    this.nodeWeights = new Map();
    this.totalWeight = 0;
    
    this.initialize();
  }
  
  private initialize(): void {
    let communityId = 0;
    
    // Initialize each node in its own community
    for (const node of this.graph.nodes()) {
      this.communities.set(node, communityId);
      
      // Calculate node weight (sum of edge weights)
      let nodeWeight = 0;
      for (const edge of this.graph.outEdges(node)) {
        nodeWeight += edge.weight ?? 1;
      }
      
      this.nodeWeights.set(node, nodeWeight);
      this.communityWeights.set(communityId, nodeWeight);
      this.totalWeight += nodeWeight;
      
      communityId++;
    }
  }
  
  public optimize(options: OptimizedLouvainOptions = {}): Map<TNodeId, number> {
    const {
      pruneLeaves = true,
      importanceOrdering = true,
      pruningThreshold = 0.01,
      thresholdCycling = true
    } = options;
    
    let improvement = true;
    let level = 0;
    
    while (improvement) {
      console.log(`Level ${level}: ${this.graph.nodeCount()} nodes`);
      
      // Get nodes in importance order
      const orderedNodes = importanceOrdering 
        ? this.getNodesInImportanceOrder()
        : Array.from(this.graph.nodes());
      
      // Apply threshold cycling
      const threshold = thresholdCycling 
        ? this.getAdaptiveThreshold(level, pruningThreshold)
        : 0;
      
      improvement = this.performLocalMoving(orderedNodes, {
        pruneLeaves,
        threshold
      });
      
      if (improvement) {
        // Aggregate graph for next level
        this.graph = this.aggregateGraph();
        this.initialize();
        level++;
      }
    }
    
    console.log('Pruning statistics:', this.pruningStats);
    return this.communities;
  }
  
  private getNodesInImportanceOrder(): TNodeId[] {
    // Order nodes by degree and weight
    const nodeImportance = new Map<TNodeId, number>();
    
    for (const node of this.graph.nodes()) {
      const degree = Array.from(this.graph.outEdges(node)).length;
      const weight = this.nodeWeights.get(node) ?? 0;
      
      // Importance score: combination of degree and weight
      const importance = degree * Math.log(1 + weight);
      nodeImportance.set(node, importance);
    }
    
    // Sort by importance (descending)
    return Array.from(nodeImportance.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([node]) => node);
  }
  
  private performLocalMoving(
    nodes: TNodeId[], 
    options: { pruneLeaves: boolean; threshold: number }
  ): boolean {
    let improvement = false;
    let hasChanged = true;
    
    while (hasChanged) {
      hasChanged = false;
      
      for (const node of nodes) {
        // Early pruning checks
        if (options.pruneLeaves && this.isLeafNode(node)) {
          this.pruningStats.leafNodesPruned++;
          continue;
        }
        
        const currentCommunity = this.communities.get(node)!;
        const neighborCommunities = this.getNeighborCommunities(node);
        
        // Skip if node has no external connections
        if (neighborCommunities.size === 0) {
          continue;
        }
        
        // Find best community
        let bestCommunity = currentCommunity;
        let bestGain = 0;
        
        for (const [community, weight] of neighborCommunities) {
          if (community === currentCommunity) continue;
          
          const gain = this.calculateModularityGain(node, community);
          
          // Apply threshold
          if (gain > bestGain + options.threshold) {
            bestGain = gain;
            bestCommunity = community;
          }
        }
        
        // Move node if beneficial
        if (bestCommunity !== currentCommunity) {
          this.moveNode(node, currentCommunity, bestCommunity);
          hasChanged = true;
          improvement = true;
        }
      }
    }
    
    return improvement;
  }
  
  private isLeafNode(node: TNodeId): boolean {
    // A leaf node has degree 1
    let degree = 0;
    for (const _ of this.graph.outEdges(node)) {
      degree++;
      if (degree > 1) return false;
    }
    return degree === 1;
  }
  
  private getAdaptiveThreshold(level: number, baseThreshold: number): number {
    // Exponentially decay threshold with level
    return baseThreshold * Math.pow(0.5, level);
  }
  
  private calculateModularityGain(node: TNodeId, targetCommunity: number): number {
    const nodeWeight = this.nodeWeights.get(node) ?? 0;
    const currentCommunity = this.communities.get(node)!;
    
    // Sum of weights from node to target community
    let weightToTarget = 0;
    for (const edge of this.graph.outEdges(node)) {
      if (this.communities.get(edge.target) === targetCommunity) {
        weightToTarget += edge.weight ?? 1;
      }
    }
    
    // Sum of weights in target community
    const targetWeight = this.communityWeights.get(targetCommunity) ?? 0;
    
    // Modularity gain calculation
    const gain = (weightToTarget - nodeWeight * targetWeight / this.totalWeight) / this.totalWeight;
    
    return gain;
  }
  
  private moveNode(node: TNodeId, from: number, to: number): void {
    const nodeWeight = this.nodeWeights.get(node) ?? 0;
    
    // Update community weights
    this.communityWeights.set(from, (this.communityWeights.get(from) ?? 0) - nodeWeight);
    this.communityWeights.set(to, (this.communityWeights.get(to) ?? 0) + nodeWeight);
    
    // Update node's community
    this.communities.set(node, to);
  }
  
  private getNeighborCommunities(node: TNodeId): Map<number, number> {
    const neighbors = new Map<number, number>();
    
    for (const edge of this.graph.outEdges(node)) {
      const targetCommunity = this.communities.get(edge.target)!;
      const weight = edge.weight ?? 1;
      
      neighbors.set(
        targetCommunity,
        (neighbors.get(targetCommunity) ?? 0) + weight
      );
    }
    
    return neighbors;
  }
  
  private aggregateGraph(): ReadonlyGraph<number> {
    // Create super-graph where each node is a community
    // Implementation would create a new graph with communities as nodes
    // and edges representing inter-community connections
    throw new Error('Aggregation implementation needed');
  }
}
```

#### 3.2 Add Threshold Cycling
- **File**: `src/community/louvain-optimized.ts`
- **Tasks**:
  - Implement adaptive threshold schedule
  - Add quality vs speed trade-off parameter
  - Create threshold decay function
  - Track modularity changes per cycle

**Threshold Cycling Implementation:**

```typescript
// Enhanced threshold cycling in louvain-optimized.ts

interface ThresholdSchedule {
  initial: number;
  decay: number;
  minimum: number;
  qualityVsSpeed: number; // 0 = quality, 1 = speed
}

class AdaptiveThresholdManager {
  private schedule: ThresholdSchedule;
  private modularityHistory: number[] = [];
  
  constructor(schedule: ThresholdSchedule) {
    this.schedule = schedule;
  }
  
  getThreshold(level: number, currentModularity: number): number {
    // Basic exponential decay
    let threshold = this.schedule.initial * Math.pow(this.schedule.decay, level);
    
    // Adjust based on modularity improvement rate
    if (this.modularityHistory.length > 0) {
      const lastModularity = this.modularityHistory[this.modularityHistory.length - 1];
      const improvement = currentModularity - lastModularity;
      
      // If improvement is small, increase threshold for speed
      if (improvement < 0.001) {
        threshold *= (1 + this.schedule.qualityVsSpeed);
      }
    }
    
    this.modularityHistory.push(currentModularity);
    
    return Math.max(threshold, this.schedule.minimum);
  }
  
  // Adaptive cycling based on convergence rate
  shouldCycleThreshold(iterationsWithoutImprovement: number): boolean {
    // Cycle threshold if stuck
    return iterationsWithoutImprovement > 3;
  }
}

// Integration into main algorithm
export class ThresholdCyclingLouvain<TNodeId> extends OptimizedLouvain<TNodeId> {
  private thresholdManager: AdaptiveThresholdManager;
  
  constructor(graph: ReadonlyGraph<TNodeId>) {
    super(graph);
    this.thresholdManager = new AdaptiveThresholdManager({
      initial: 0.01,
      decay: 0.5,
      minimum: 1e-6,
      qualityVsSpeed: 0.3
    });
  }
  
  protected performLocalMovingWithCycling(nodes: TNodeId[]): boolean {
    let improvement = false;
    let cycleCount = 0;
    const maxCycles = 5;
    
    while (cycleCount < maxCycles) {
      const threshold = this.thresholdManager.getThreshold(
        cycleCount, 
        this.calculateModularity()
      );
      
      console.log(`Cycle ${cycleCount}, threshold: ${threshold}`);
      
      const cycleImprovement = super.performLocalMoving(nodes, {
        pruneLeaves: true,
        threshold
      });
      
      if (cycleImprovement) {
        improvement = true;
      }
      
      // Stop if no improvement with minimum threshold
      if (!cycleImprovement && threshold <= this.thresholdManager.schedule.minimum) {
        break;
      }
      
      cycleCount++;
    }
    
    return improvement;
  }
}
```

#### 3.3 Optimize Data Structures
- **File**: `src/community/louvain-optimized.ts`
- **Tasks**:
  - Replace object-based community storage with typed arrays
  - Implement efficient community size tracking
  - Add fast modularity delta calculation
  - Optimize neighbor community enumeration

**Optimized Data Structure Implementation:**

```typescript
// Memory-efficient data structures for Louvain

export class TypedArrayLouvain<TNodeId> {
  private nodeToIndex: Map<TNodeId, number>;
  private indexToNode: TNodeId[];
  private communities: Uint32Array;
  private communityWeights: Float32Array;
  private nodeWeights: Float32Array;
  private communityCount: number;
  
  // Efficient neighbor enumeration
  private edgeList: Uint32Array; // Flattened edge list
  private edgeWeights: Float32Array;
  private nodeOffsets: Uint32Array; // CSR format offsets
  
  constructor(graph: ReadonlyGraph<TNodeId>) {
    const n = graph.nodeCount();
    const m = graph.edgeCount();
    
    // Initialize node mapping
    this.nodeToIndex = new Map();
    this.indexToNode = new Array(n);
    let idx = 0;
    for (const node of graph.nodes()) {
      this.nodeToIndex.set(node, idx);
      this.indexToNode[idx] = node;
      idx++;
    }
    
    // Initialize typed arrays
    this.communities = new Uint32Array(n);
    this.communityWeights = new Float32Array(n);
    this.nodeWeights = new Float32Array(n);
    this.communityCount = n;
    
    // Build CSR representation
    this.buildCSR(graph);
    
    // Initialize communities
    for (let i = 0; i < n; i++) {
      this.communities[i] = i;
      this.communityWeights[i] = this.nodeWeights[i];
    }
  }
  
  private buildCSR(graph: ReadonlyGraph<TNodeId>): void {
    const n = graph.nodeCount();
    const edges: Array<{source: number, target: number, weight: number}> = [];
    
    // Collect all edges
    for (const node of graph.nodes()) {
      const sourceIdx = this.nodeToIndex.get(node)!;
      let nodeWeight = 0;
      
      for (const edge of graph.outEdges(node)) {
        const targetIdx = this.nodeToIndex.get(edge.target)!;
        const weight = edge.weight ?? 1;
        edges.push({ source: sourceIdx, target: targetIdx, weight });
        nodeWeight += weight;
      }
      
      this.nodeWeights[sourceIdx] = nodeWeight;
    }
    
    // Sort edges by source
    edges.sort((a, b) => a.source - b.source);
    
    // Build CSR arrays
    this.edgeList = new Uint32Array(edges.length);
    this.edgeWeights = new Float32Array(edges.length);
    this.nodeOffsets = new Uint32Array(n + 1);
    
    let currentNode = 0;
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      
      // Fill offsets
      while (currentNode <= edge.source) {
        this.nodeOffsets[currentNode] = i;
        currentNode++;
      }
      
      this.edgeList[i] = edge.target;
      this.edgeWeights[i] = edge.weight;
    }
    
    // Fill remaining offsets
    while (currentNode <= n) {
      this.nodeOffsets[currentNode] = edges.length;
      currentNode++;
    }
  }
  
  // Fast neighbor community enumeration
  getNeighborCommunitiesTyped(nodeIdx: number): Map<number, number> {
    const communities = new Map<number, number>();
    
    const start = this.nodeOffsets[nodeIdx];
    const end = this.nodeOffsets[nodeIdx + 1];
    
    // Efficient iteration over neighbors
    for (let i = start; i < end; i++) {
      const targetIdx = this.edgeList[i];
      const weight = this.edgeWeights[i];
      const targetCommunity = this.communities[targetIdx];
      
      communities.set(
        targetCommunity,
        (communities.get(targetCommunity) ?? 0) + weight
      );
    }
    
    return communities;
  }
  
  // Fast modularity delta calculation
  calculateModularityDelta(
    nodeIdx: number, 
    targetCommunity: number,
    totalWeight: number
  ): number {
    const nodeWeight = this.nodeWeights[nodeIdx];
    const currentCommunity = this.communities[nodeIdx];
    
    if (currentCommunity === targetCommunity) return 0;
    
    // Sum of edges to target community
    let edgesToTarget = 0;
    let edgesToCurrent = 0;
    
    const start = this.nodeOffsets[nodeIdx];
    const end = this.nodeOffsets[nodeIdx + 1];
    
    for (let i = start; i < end; i++) {
      const targetIdx = this.edgeList[i];
      const weight = this.edgeWeights[i];
      const neighborCommunity = this.communities[targetIdx];
      
      if (neighborCommunity === targetCommunity) {
        edgesToTarget += weight;
      } else if (neighborCommunity === currentCommunity) {
        edgesToCurrent += weight;
      }
    }
    
    const currentCommunityWeight = this.communityWeights[currentCommunity];
    const targetCommunityWeight = this.communityWeights[targetCommunity];
    
    // Modularity delta formula
    const removeFromCurrent = -edgesToCurrent / totalWeight + 
      nodeWeight * (currentCommunityWeight - nodeWeight) / (totalWeight * totalWeight);
    
    const addToTarget = edgesToTarget / totalWeight - 
      nodeWeight * targetCommunityWeight / (totalWeight * totalWeight);
    
    return removeFromCurrent + addToTarget;
  }
}
```

#### 3.4 Parallel Processing Preparation
- **File**: `src/community/louvain-optimized.ts`
- **Tasks**:
  - Identify parallelizable sections
  - Add vertex partitioning logic
  - Prepare for future worker thread implementation
  - Document thread-safety requirements

**Parallel-Ready Implementation:**

```typescript
// Parallel processing preparation

interface PartitionInfo {
  startIdx: number;
  endIdx: number;
  nodes: number[];
}

export class ParallelReadyLouvain<TNodeId> {
  // Color-based partitioning for conflict-free parallel execution
  private nodeColors: Uint8Array;
  private colorPartitions: Map<number, PartitionInfo>;
  
  private partitionGraph(): void {
    const n = this.graph.nodeCount();
    this.nodeColors = new Uint8Array(n);
    this.colorPartitions = new Map();
    
    // Greedy graph coloring
    const maxColors = this.greedyColoring();
    
    // Create partitions by color
    for (let color = 0; color < maxColors; color++) {
      const partition: PartitionInfo = {
        startIdx: 0,
        endIdx: 0,
        nodes: []
      };
      
      for (let i = 0; i < n; i++) {
        if (this.nodeColors[i] === color) {
          partition.nodes.push(i);
        }
      }
      
      this.colorPartitions.set(color, partition);
    }
    
    console.log(`Graph partitioned into ${maxColors} colors for parallel execution`);
  }
  
  private greedyColoring(): number {
    const n = this.nodeColors.length;
    let maxColor = 0;
    
    for (let nodeIdx = 0; nodeIdx < n; nodeIdx++) {
      const neighborColors = new Set<number>();
      
      // Check colors of neighbors
      const start = this.nodeOffsets[nodeIdx];
      const end = this.nodeOffsets[nodeIdx + 1];
      
      for (let i = start; i < end; i++) {
        const neighborIdx = this.edgeList[i];
        if (this.nodeColors[neighborIdx] !== 0) {
          neighborColors.add(this.nodeColors[neighborIdx]);
        }
      }
      
      // Find minimum available color
      let color = 1;
      while (neighborColors.has(color)) {
        color++;
      }
      
      this.nodeColors[nodeIdx] = color;
      maxColor = Math.max(maxColor, color);
    }
    
    return maxColor;
  }
  
  // Thread-safe local moving for a partition
  performLocalMovingPartition(partition: PartitionInfo): number {
    let movesCount = 0;
    
    // Process nodes in partition (no conflicts with other partitions)
    for (const nodeIdx of partition.nodes) {
      const bestMove = this.findBestMove(nodeIdx);
      
      if (bestMove.gain > 0) {
        // Safe to move - no other thread touches these communities
        this.moveNodeAtomic(nodeIdx, bestMove.community);
        movesCount++;
      }
    }
    
    return movesCount;
  }
  
  // Atomic move operation (preparation for parallel execution)
  private moveNodeAtomic(nodeIdx: number, newCommunity: number): void {
    const oldCommunity = this.communities[nodeIdx];
    const nodeWeight = this.nodeWeights[nodeIdx];
    
    // In parallel version, these would be atomic operations
    // Atomics.sub(this.communityWeights, oldCommunity, nodeWeight);
    // Atomics.add(this.communityWeights, newCommunity, nodeWeight);
    
    this.communities[nodeIdx] = newCommunity;
  }
}

// Documentation for thread safety
/**
 * Thread Safety Requirements:
 * 
 * 1. Node Partitioning:
 *    - Use graph coloring to ensure no two adjacent nodes are in same partition
 *    - Each thread processes one color partition
 * 
 * 2. Shared Data Structures:
 *    - communities array: Use atomic operations for updates
 *    - communityWeights: Use atomic add/subtract
 *    - nodeWeights: Read-only after initialization
 * 
 * 3. Synchronization:
 *    - Barrier synchronization between iterations
 *    - Reduction operation for convergence check
 * 
 * 4. Memory Model:
 *    - Use SharedArrayBuffer for shared data
 *    - Ensure proper memory ordering with Atomics
 */
```

#### 3.5 Testing and Validation
- **File**: `test/community/louvain-optimized.spec.ts`
- **Tasks**:
  - Verify modularity scores match standard Louvain
  - Test community stability
  - Benchmark on real-world networks
  - Measure pruning effectiveness

**Comprehensive Test Suite:**

```typescript
// test/community/louvain-optimized.spec.ts
import { describe, it, expect } from 'vitest';
import { louvain } from '../../src/community/louvain';
import { OptimizedLouvain } from '../../src/community/louvain-optimized';
import { createGraph } from '../../src/graph';
import { loadKarateClub, loadEmailNetwork } from '../fixtures/real-networks';

describe('Optimized Louvain Algorithm', () => {
  it('should produce same modularity as standard implementation', () => {
    const graph = loadKarateClub();
    
    // Standard implementation
    const standardCommunities = louvain(graph);
    const standardModularity = calculateModularity(graph, standardCommunities);
    
    // Optimized implementation
    const optimized = new OptimizedLouvain(graph);
    const optimizedCommunities = optimized.optimize();
    const optimizedModularity = calculateModularity(graph, optimizedCommunities);
    
    // Allow small difference due to optimization trade-offs
    expect(Math.abs(standardModularity - optimizedModularity)).toBeLessThan(0.01);
  });
  
  it('should show significant speedup with pruning', () => {
    const graph = loadEmailNetwork(); // ~1000 nodes
    
    // Without pruning
    const noPruneStart = performance.now();
    const noPrune = new OptimizedLouvain(graph);
    noPrune.optimize({ pruneLeaves: false, thresholdCycling: false });
    const noPruneTime = performance.now() - noPruneStart;
    
    // With pruning
    const pruneStart = performance.now();
    const withPrune = new OptimizedLouvain(graph);
    const result = withPrune.optimize({ 
      pruneLeaves: true, 
      thresholdCycling: true 
    });
    const pruneTime = performance.now() - pruneStart;
    
    console.log(`No pruning: ${noPruneTime}ms, With pruning: ${pruneTime}ms`);
    console.log(`Speedup: ${(noPruneTime / pruneTime).toFixed(2)}x`);
    
    expect(pruneTime).toBeLessThan(noPruneTime * 0.7); // At least 30% faster
  });
  
  it('should handle different graph types', () => {
    const testCases = [
      { name: 'Complete graph', graph: createCompleteGraph(50) },
      { name: 'Star graph', graph: createStarGraph(100) },
      { name: 'Grid graph', graph: createGridGraph(20, 20) },
      { name: 'Random graph', graph: createRandomGraph(200, 0.1) }
    ];
    
    for (const { name, graph } of testCases) {
      const optimized = new OptimizedLouvain(graph);
      const communities = optimized.optimize();
      
      // Verify all nodes assigned to communities
      expect(communities.size).toBe(graph.nodeCount());
      
      // Verify modularity is positive
      const modularity = calculateModularity(graph, communities);
      expect(modularity).toBeGreaterThan(0);
      
      console.log(`${name}: ${new Set(communities.values()).size} communities, Q=${modularity.toFixed(3)}`);
    }
  });
  
  it('should measure pruning effectiveness', () => {
    const graph = createRandomGraph(1000, 0.01); // Sparse graph with many leaves
    
    const optimized = new OptimizedLouvain(graph);
    optimized.optimize({ pruneLeaves: true });
    
    const stats = optimized.getPruningStats();
    console.log('Pruning statistics:', stats);
    
    // Verify pruning happened
    expect(stats.leafNodesPruned).toBeGreaterThan(0);
    
    // Calculate pruning rate
    const totalNodes = graph.nodeCount();
    const pruningRate = stats.leafNodesPruned / totalNodes;
    console.log(`Pruning rate: ${(pruningRate * 100).toFixed(1)}%`);
  });
  
  it('should benchmark on various graph sizes', () => {
    const sizes = [100, 500, 1000, 5000];
    const results = [];
    
    for (const size of sizes) {
      const graph = createRandomGraph(size, 10 / size); // Keep avg degree ~10
      
      const start = performance.now();
      const optimized = new OptimizedLouvain(graph);
      const communities = optimized.optimize();
      const time = performance.now() - start;
      
      results.push({
        size,
        time,
        communities: new Set(communities.values()).size,
        timePerNode: time / size
      });
    }
    
    console.table(results);
    
    // Verify sub-linear scaling
    const lastResult = results[results.length - 1];
    const firstResult = results[0];
    const scalingFactor = lastResult.timePerNode / firstResult.timePerNode;
    
    expect(scalingFactor).toBeLessThan(2); // Should scale better than O(n)
  });
});
```

### Step 4: Integration and Benchmarking Suite

#### 4.1 Create Unified Benchmark Framework
- **File**: `benchmark/phase2-optimizations.ts`
- **Tasks**:
  - Set up consistent graph generation for benchmarks
  - Create performance comparison framework
  - Add memory usage tracking
  - Implement result visualization

**Benchmark Framework Implementation:**

```typescript
// benchmark/phase2-optimizations.ts
import { performance } from 'perf_hooks';
import { dijkstra, dijkstraPath } from '../src/shortest-path/dijkstra';
import { pagerank } from '../src/centrality/pagerank';
import { louvain } from '../src/community/louvain';
import { OptimizedLouvain } from '../src/community/louvain-optimized';
import { createGraph } from '../src/graph';

interface BenchmarkResult {
  algorithm: string;
  variant: string;
  graphSize: number;
  graphType: string;
  executionTime: number;
  memoryUsed: number;
  speedup?: number;
  accuracy?: number;
}

export class Phase2BenchmarkSuite {
  private results: BenchmarkResult[] = [];
  
  async runAllBenchmarks(): Promise<void> {
    const graphSizes = [1000, 5000, 10000, 50000, 100000];
    const graphTypes = ['sparse', 'dense', 'powerLaw', 'smallWorld'];
    
    for (const size of graphSizes) {
      for (const type of graphTypes) {
        const graph = this.generateGraph(size, type);
        
        // Benchmark each optimization
        await this.benchmarkBidirectionalDijkstra(graph, size, type);
        await this.benchmarkDeltaPageRank(graph, size, type);
        await this.benchmarkOptimizedLouvain(graph, size, type);
      }
    }
    
    this.generateReport();
  }
  
  private generateGraph(size: number, type: string) {
    switch (type) {
      case 'sparse':
        return this.generateSparseGraph(size, 10); // avg degree 10
      case 'dense':
        return this.generateDenseGraph(size, size * 0.1); // 10% connectivity
      case 'powerLaw':
        return this.generatePowerLawGraph(size, 2.1);
      case 'smallWorld':
        return this.generateSmallWorldGraph(size, 10, 0.1);
      default:
        throw new Error(`Unknown graph type: ${type}`);
    }
  }
  
  private async benchmarkBidirectionalDijkstra(
    graph: Graph<number>, 
    size: number, 
    type: string
  ): Promise<void> {
    // Select random source and target
    const nodes = Array.from(graph.nodes());
    const source = nodes[0];
    const target = nodes[Math.floor(nodes.length * 0.9)];
    
    // Warm up
    dijkstraPath(graph, source, target);
    
    // Standard Dijkstra
    const memBefore = process.memoryUsage().heapUsed;
    const standardStart = performance.now();
    const standardResult = dijkstraPath(graph, source, target);
    const standardTime = performance.now() - standardStart;
    const standardMem = process.memoryUsage().heapUsed - memBefore;
    
    // Bidirectional Dijkstra
    const biMemBefore = process.memoryUsage().heapUsed;
    const biStart = performance.now();
    const biResult = dijkstraPath(graph, source, target, { bidirectional: true });
    const biTime = performance.now() - biStart;
    const biMem = process.memoryUsage().heapUsed - biMemBefore;
    
    // Record results
    this.results.push({
      algorithm: 'dijkstra',
      variant: 'standard',
      graphSize: size,
      graphType: type,
      executionTime: standardTime,
      memoryUsed: standardMem
    });
    
    this.results.push({
      algorithm: 'dijkstra',
      variant: 'bidirectional',
      graphSize: size,
      graphType: type,
      executionTime: biTime,
      memoryUsed: biMem,
      speedup: standardTime / biTime,
      accuracy: biResult?.distance === standardResult?.distance ? 1.0 : 0.0
    });
  }
  
  private async benchmarkDeltaPageRank(
    graph: Graph<number>,
    size: number,
    type: string
  ): Promise<void> {
    // Track iterations for both versions
    let standardIterations = 0;
    let deltaIterations = 0;
    
    // Standard PageRank
    const standardStart = performance.now();
    const standardResult = pagerank(graph, {
      onIteration: () => standardIterations++
    });
    const standardTime = performance.now() - standardStart;
    
    // Delta PageRank
    const deltaStart = performance.now();
    const deltaResult = pagerank(graph, {
      useDelta: true,
      onIteration: () => deltaIterations++
    });
    const deltaTime = performance.now() - deltaStart;
    
    // Calculate accuracy (cosine similarity of score vectors)
    const accuracy = this.calculatePageRankAccuracy(standardResult, deltaResult);
    
    this.results.push({
      algorithm: 'pagerank',
      variant: 'standard',
      graphSize: size,
      graphType: type,
      executionTime: standardTime,
      memoryUsed: 0 // TODO: measure memory
    });
    
    this.results.push({
      algorithm: 'pagerank',
      variant: 'delta',
      graphSize: size,
      graphType: type,
      executionTime: deltaTime,
      memoryUsed: 0,
      speedup: standardTime / deltaTime,
      accuracy
    });
    
    console.log(`PageRank iterations - Standard: ${standardIterations}, Delta: ${deltaIterations}`);
  }
  
  private generateReport(): void {
    // Group results by algorithm
    const byAlgorithm = this.groupBy(this.results, 'algorithm');
    
    console.log('\n=== Phase 2 Optimization Benchmark Results ===\n');
    
    for (const [algorithm, results] of Object.entries(byAlgorithm)) {
      console.log(`\n${algorithm.toUpperCase()} Results:`);
      
      // Create summary table
      const summary = results.map(r => ({
        'Graph Type': r.graphType,
        'Size': r.graphSize,
        'Variant': r.variant,
        'Time (ms)': r.executionTime.toFixed(2),
        'Speedup': r.speedup?.toFixed(2) || '-',
        'Accuracy': r.accuracy?.toFixed(3) || '-'
      }));
      
      console.table(summary);
      
      // Calculate average speedups
      const optimizedResults = results.filter(r => r.speedup);
      if (optimizedResults.length > 0) {
        const avgSpeedup = optimizedResults.reduce((sum, r) => sum + (r.speedup || 0), 0) / optimizedResults.length;
        console.log(`Average speedup: ${avgSpeedup.toFixed(2)}x`);
      }
    }
    
    // Generate visualization data
    this.exportVisualizationData();
  }
  
  private exportVisualizationData(): void {
    // Export data in format suitable for plotting
    const visualizationData = {
      dijkstra: this.prepareSpeedupData('dijkstra'),
      pagerank: this.prepareSpeedupData('pagerank'),
      louvain: this.prepareSpeedupData('louvain')
    };
    
    console.log('\nVisualization data exported to benchmark-results.json');
    // In real implementation, write to file
  }
}

// Helper functions for graph generation
function generateSparseGraph(n: number, avgDegree: number): Graph<number> {
  const graph = createGraph<number>();
  
  // Add nodes
  for (let i = 0; i < n; i++) {
    graph.addNode(i);
  }
  
  // Add edges to achieve target average degree
  const totalEdges = (n * avgDegree) / 2;
  for (let i = 0; i < totalEdges; i++) {
    const source = Math.floor(Math.random() * n);
    const target = Math.floor(Math.random() * n);
    if (source !== target) {
      graph.addEdge(source, target, Math.random());
    }
  }
  
  return graph;
}
```

#### 4.2 Add Real-World Graph Testing
- **File**: `benchmark/real-world-graphs.ts`
- **Tasks**:
  - Add SNAP dataset loader
  - Implement graph sampling for large datasets
  - Create performance profiles for different graph types
  - Generate optimization recommendation matrix

**Real-World Graph Testing:**

```typescript
// benchmark/real-world-graphs.ts
import { readFileSync } from 'fs';
import { createGraph, Graph } from '../src/graph';

export class RealWorldGraphLoader {
  // Common real-world graph datasets
  static readonly DATASETS = {
    EMAIL_ENRON: 'email-Enron.txt',
    FACEBOOK: 'facebook_combined.txt',
    WIKI_VOTE: 'wiki-Vote.txt',
    ROAD_CA: 'roadNet-CA.txt',
    WEB_GOOGLE: 'web-Google.txt'
  };
  
  static loadSNAPGraph(filename: string): Graph<number> {
    const graph = createGraph<number>();
    const content = readFileSync(`datasets/${filename}`, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('#')) continue; // Skip comments
      
      const [source, target] = line.split(/\s+/).map(Number);
      if (!isNaN(source) && !isNaN(target)) {
        graph.addEdge(source, target);
      }
    }
    
    return graph;
  }
  
  static sampleGraph(graph: Graph<number>, sampleSize: number): Graph<number> {
    // Random walk sampling for large graphs
    const sampled = createGraph<number>();
    const visited = new Set<number>();
    const nodes = Array.from(graph.nodes());
    
    // Start from random nodes
    const startNodes = [];
    for (let i = 0; i < 10; i++) {
      startNodes.push(nodes[Math.floor(Math.random() * nodes.length)]);
    }
    
    // Perform random walks
    for (const start of startNodes) {
      this.randomWalk(graph, start, sampleSize / 10, visited, sampled);
    }
    
    return sampled;
  }
  
  private static randomWalk(
    graph: Graph<number>,
    start: number,
    steps: number,
    visited: Set<number>,
    sampled: Graph<number>
  ): void {
    let current = start;
    
    for (let i = 0; i < steps && visited.size < steps * 10; i++) {
      visited.add(current);
      sampled.addNode(current);
      
      const neighbors = Array.from(graph.outEdges(current));
      if (neighbors.length === 0) break;
      
      // Add edges to sampled graph
      for (const edge of neighbors) {
        if (visited.has(edge.target)) {
          sampled.addEdge(current, edge.target, edge.weight);
        }
      }
      
      // Move to random neighbor
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      current = next.target;
    }
  }
}

// Performance profile generator
export class PerformanceProfiler {
  static generateProfiles(): void {
    const datasets = [
      { name: 'Email Network', file: RealWorldGraphLoader.DATASETS.EMAIL_ENRON, type: 'social' },
      { name: 'Road Network', file: RealWorldGraphLoader.DATASETS.ROAD_CA, type: 'road' },
      { name: 'Web Graph', file: RealWorldGraphLoader.DATASETS.WEB_GOOGLE, type: 'web' }
    ];
    
    const recommendations = new Map<string, string[]>();
    
    for (const dataset of datasets) {
      const graph = RealWorldGraphLoader.loadSNAPGraph(dataset.file);
      const profile = this.profileGraph(graph);
      
      // Generate recommendations based on profile
      const recs = [];
      
      if (profile.avgDegree < 20 && profile.diameter > 10) {
        recs.push('Use bidirectional Dijkstra for shortest paths');
      }
      
      if (profile.degreeVariance > 100) {
        recs.push('Use delta-based PageRank for faster convergence');
      }
      
      if (profile.clustering > 0.1) {
        recs.push('Enable early pruning in Louvain');
      }
      
      recommendations.set(dataset.name, recs);
    }
    
    console.log('\n=== Optimization Recommendations ===');
    for (const [name, recs] of recommendations) {
      console.log(`\n${name}:`);
      recs.forEach(rec => console.log(`  - ${rec}`));
    }
  }
  
  private static profileGraph(graph: Graph<number>): GraphProfile {
    // Calculate graph statistics
    const degrees = Array.from(graph.nodes()).map(
      node => Array.from(graph.outEdges(node)).length
    );
    
    const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    const degreeVariance = degrees.reduce((sum, d) => sum + Math.pow(d - avgDegree, 2), 0) / degrees.length;
    
    return {
      nodeCount: graph.nodeCount(),
      edgeCount: graph.edgeCount(),
      avgDegree,
      degreeVariance,
      diameter: 0, // Would need BFS to calculate
      clustering: 0 // Would need triangle counting
    };
  }
}
```

#### 4.3 Performance Regression Testing
- **File**: `test/performance/regression.spec.ts`
- **Tasks**:
  - Set baseline performance metrics
  - Create automated performance regression detection
  - Add CI integration for performance tests
  - Generate performance trend reports

**Performance Regression Tests:**

```typescript
// test/performance/regression.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { performance } from 'perf_hooks';
import * as fs from 'fs';

interface PerformanceBaseline {
  algorithm: string;
  graphSize: number;
  baselineTime: number;
  tolerance: number; // Acceptable regression percentage
}

describe('Performance Regression Tests', () => {
  let baselines: PerformanceBaseline[];
  
  beforeAll(() => {
    // Load baseline performance data
    if (fs.existsSync('performance-baselines.json')) {
      baselines = JSON.parse(fs.readFileSync('performance-baselines.json', 'utf-8'));
    } else {
      // Generate initial baselines
      baselines = generateBaselines();
      fs.writeFileSync('performance-baselines.json', JSON.stringify(baselines, null, 2));
    }
  });
  
  it('should not regress on bidirectional dijkstra performance', () => {
    const baseline = baselines.find(b => b.algorithm === 'bidirectional-dijkstra');
    if (!baseline) throw new Error('No baseline found');
    
    const graph = generateTestGraph(baseline.graphSize);
    
    // Run performance test
    const times = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      runBidirectionalDijkstra(graph);
      times.push(performance.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const regression = (avgTime - baseline.baselineTime) / baseline.baselineTime;
    
    console.log(`Bidirectional Dijkstra - Baseline: ${baseline.baselineTime}ms, Current: ${avgTime}ms, Change: ${(regression * 100).toFixed(1)}%`);
    
    expect(regression).toBeLessThan(baseline.tolerance);
  });
  
  it('should track performance trends over time', () => {
    const trendsFile = 'performance-trends.json';
    const trends = fs.existsSync(trendsFile) 
      ? JSON.parse(fs.readFileSync(trendsFile, 'utf-8'))
      : { runs: [] };
    
    const currentRun = {
      timestamp: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'local',
      results: {}
    };
    
    // Run all benchmarks
    for (const baseline of baselines) {
      const time = measureAlgorithmPerformance(baseline.algorithm, baseline.graphSize);
      currentRun.results[baseline.algorithm] = time;
    }
    
    trends.runs.push(currentRun);
    
    // Keep only last 100 runs
    if (trends.runs.length > 100) {
      trends.runs = trends.runs.slice(-100);
    }
    
    fs.writeFileSync(trendsFile, JSON.stringify(trends, null, 2));
    
    // Generate trend report
    generateTrendReport(trends);
  });
});

function generateTrendReport(trends: any): void {
  console.log('\n=== Performance Trend Report ===\n');
  
  const algorithms = Object.keys(trends.runs[0]?.results || {});
  
  for (const algorithm of algorithms) {
    const values = trends.runs.map(run => run.results[algorithm]);
    const recent = values.slice(-10);
    
    const avg = recent.reduce((a, b) => a + b) / recent.length;
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    const trend = calculateTrend(recent);
    
    console.log(`${algorithm}:`);
    console.log(`  Average (last 10): ${avg.toFixed(2)}ms`);
    console.log(`  Range: ${min.toFixed(2)}ms - ${max.toFixed(2)}ms`);
    console.log(`  Trend: ${trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} ${Math.abs(trend).toFixed(1)}%`);
  }
}

function calculateTrend(values: number[]): number {
  // Simple linear regression to determine trend
  const n = values.length;
  const sumX = n * (n - 1) / 2;
  const sumY = values.reduce((a, b) => a + b);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgY = sumY / n;
  
  return (slope / avgY) * 100; // Percentage change per measurement
}
```

### Step 5: Documentation and Examples

#### 5.1 Update API Documentation
- **Files**: Various source files
- **Tasks**:
  - Add JSDoc for all new options
  - Document performance characteristics
  - Add complexity analysis comments
  - Include usage examples in comments

**API Documentation Examples:**

```typescript
// Example JSDoc for optimized functions

/**
 * Computes single-source shortest paths using Dijkstra's algorithm.
 * 
 * @param graph - The input graph
 * @param source - The source node
 * @param options - Algorithm options
 * @param options.bidirectional - Use bidirectional search for point-to-point queries (2-4x speedup)
 * 
 * @complexity 
 * - Standard: O((V + E) log V) with binary heap
 * - Bidirectional: O(2 * sqrt(V + E) log V) expected for random graphs
 * 
 * @example
 * ```typescript
 * // Standard Dijkstra
 * const result = dijkstra(graph, 'A');
 * 
 * // Bidirectional search (faster for specific target)
 * const path = dijkstraPath(graph, 'A', 'Z', { bidirectional: true });
 * ```
 */

/**
 * Computes PageRank scores for all nodes in the graph.
 * 
 * @param graph - The input graph
 * @param options - Algorithm options
 * @param options.useDelta - Use delta-based computation (5-10x fewer iterations)
 * @param options.hybridSwitchIteration - Switch to delta after N iterations
 * 
 * @performance
 * - Standard: ~100 iterations for web graphs
 * - Delta-based: ~20-30 iterations for same convergence
 * - Memory: O(V) for both variants
 * 
 * @example
 * ```typescript
 * // Fast PageRank for large graphs
 * const scores = pagerank(graph, { 
 *   useDelta: true,
 *   tolerance: 1e-6 
 * });
 * ```
 */
```

#### 5.2 Create Optimization Guide
- **File**: `docs/optimization-guide.md`
- **Tasks**:
  - Write when to use each optimization
  - Document trade-offs and limitations
  - Add performance comparison tables
  - Include decision flowchart

#### 5.3 Add Interactive Examples
- **File**: `examples/phase2-optimizations.html`
- **Tasks**:
  - Create visual comparison of optimized vs standard algorithms
  - Add real-time performance metrics
  - Include graph size scaling demonstrations
  - Show optimization impact on different graph types

**Interactive Example Structure:**

```html
<!-- examples/phase2-optimizations.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Graph Algorithm Optimizations Demo</title>
  <script src="../dist/graphty-algorithms.js"></script>
  <style>
    .benchmark-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .performance-chart {
      height: 300px;
    }
  </style>
</head>
<body>
  <h1>Phase 2 Optimizations Interactive Demo</h1>
  
  <div class="controls">
    <label>Graph Size: <input type="range" id="graphSize" min="100" max="10000" value="1000"></label>
    <label>Graph Type: 
      <select id="graphType">
        <option value="sparse">Sparse</option>
        <option value="dense">Dense</option>
        <option value="powerLaw">Power Law</option>
      </select>
    </label>
  </div>
  
  <div class="benchmark-container">
    <div class="algorithm-test">
      <h2>Dijkstra's Algorithm</h2>
      <button onclick="runDijkstraBenchmark()">Run Benchmark</button>
      <div id="dijkstraResults"></div>
      <canvas id="dijkstraChart" class="performance-chart"></canvas>
    </div>
    
    <div class="algorithm-test">
      <h2>PageRank</h2>
      <button onclick="runPageRankBenchmark()">Run Benchmark</button>
      <div id="pagerankResults"></div>
      <canvas id="pagerankChart" class="performance-chart"></canvas>
    </div>
  </div>
  
  <script>
    async function runDijkstraBenchmark() {
      const size = document.getElementById('graphSize').value;
      const type = document.getElementById('graphType').value;
      
      // Generate graph
      const graph = generateGraph(size, type);
      
      // Run standard version
      const standardTime = await measureTime(() => {
        graphty.dijkstraPath(graph, 0, size - 1);
      });
      
      // Run optimized version
      const optimizedTime = await measureTime(() => {
        graphty.dijkstraPath(graph, 0, size - 1, { bidirectional: true });
      });
      
      // Display results
      displayResults('dijkstra', {
        standard: standardTime,
        optimized: optimizedTime,
        speedup: standardTime / optimizedTime
      });
      
      // Update chart
      updateChart('dijkstra', size, standardTime, optimizedTime);
    }
    
    // Similar implementations for other algorithms...
  </script>
</body>
</html>
```

## Implementation Order and Dependencies

1. **Week 1**: Bidirectional Dijkstra (Steps 1.1-1.4)
   - Independent implementation
   - Can be tested immediately

2. **Week 2**: Delta-Based PageRank (Steps 2.1-2.4)
   - Independent implementation
   - High impact optimization

3. **Week 3**: Louvain Optimizations (Steps 3.1-3.5)
   - More complex, builds on existing implementation
   - Requires careful testing

4. **Week 4**: Integration and Benchmarking (Steps 4.1-4.3, 5.1-5.3)
   - Depends on all previous implementations
   - Critical for validation

## Success Metrics

1. **Bidirectional Dijkstra**: 2-4x speedup on sparse graphs with long paths
2. **Delta PageRank**: 5-10x reduction in iterations to convergence
3. **Louvain Optimizations**: 30-50% runtime reduction with <1% quality loss
4. **Overall**: All optimizations maintain exact or near-exact result quality

## Risk Mitigation

1. **Backward Compatibility**: All optimizations are opt-in via options
2. **Memory Usage**: Monitor and document memory overhead
3. **Numerical Stability**: Extensive testing for floating-point algorithms
4. **Platform Differences**: Test on multiple JavaScript engines

## Future Considerations

- Phase 3 will focus on SIMD and WebAssembly optimizations
- Phase 4 will explore GPU acceleration via WebGPU
- Incremental/dynamic graph support can build on these optimizations