# Priority 1 Graph Algorithms Implementation Plan

## Overview

This document provides a detailed implementation plan for Priority 1 graph algorithms in TypeScript for browser environments. The plan includes core data structures, implementation details, and references to existing implementations that can serve as starting points.

---

## Project Structure

```
src/
├── core/
│   ├── graph.ts           # Core graph data structure
│   ├── types.ts           # TypeScript interfaces and types
│   └── utils.ts           # Shared utilities
├── algorithms/
│   ├── traversal/
│   │   ├── bfs.ts
│   │   └── dfs.ts
│   ├── shortest-path/
│   │   ├── dijkstra.ts
│   │   └── bellman-ford.ts
│   ├── centrality/
│   │   ├── degree.ts
│   │   ├── betweenness.ts
│   │   ├── closeness.ts
│   │   └── pagerank.ts
│   ├── community/
│   │   ├── louvain.ts
│   │   └── girvan-newman.ts
│   └── components/
│       ├── connected-components.ts
│       └── strongly-connected.ts
├── data-structures/
│   ├── priority-queue.ts
│   ├── union-find.ts
│   └── heap.ts
└── index.ts               # Public API exports
```

---

## Phase 1: Core Data Structures and Types

### 1.1 TypeScript Interfaces and Types

**File**: `src/core/types.ts`

```typescript
// Node identifier type
export type NodeId = string | number;

// Edge representation
export interface Edge {
  source: NodeId;
  target: NodeId;
  weight?: number;
  id?: string;
  data?: any;
}

// Node representation
export interface Node {
  id: NodeId;
  data?: any;
}

// Graph configuration
export interface GraphConfig {
  directed: boolean;
  allowSelfLoops: boolean;
  allowParallelEdges: boolean;
}

// Algorithm result interfaces
export interface ShortestPathResult {
  distance: number;
  path: NodeId[];
  predecessor: Map<NodeId, NodeId | null>;
}

export interface CentralityResult {
  [nodeId: string]: number;
}

export interface TraversalResult {
  visited: Set<NodeId>;
  order: NodeId[];
  tree?: Map<NodeId, NodeId | null>;
}

export interface CommunityResult {
  communities: NodeId[][];
  modularity: number;
  iterations?: number;
}

export interface ComponentResult {
  components: NodeId[][];
  componentMap: Map<NodeId, number>;
}
```

**Reference Implementation**: Based on [Graphology types](https://graphology.github.io/docs/graph#graph-types)

### 1.2 Core Graph Data Structure

**File**: `src/core/graph.ts`

```typescript
export class Graph {
  private nodes: Map<NodeId, Node>;
  private adjacencyList: Map<NodeId, Map<NodeId, Edge>>;
  private incomingEdges: Map<NodeId, Map<NodeId, Edge>>; // For directed graphs
  private config: GraphConfig;

  constructor(config: Partial<GraphConfig> = {}) {
    this.config = {
      directed: false,
      allowSelfLoops: true,
      allowParallelEdges: false,
      ...config
    };
    this.nodes = new Map();
    this.adjacencyList = new Map();
    this.incomingEdges = new Map();
  }

  // Core graph operations
  addNode(id: NodeId, data?: any): void
  removeNode(id: NodeId): boolean
  addEdge(source: NodeId, target: NodeId, weight?: number, data?: any): void
  removeEdge(source: NodeId, target: NodeId): boolean
  
  // Query methods
  hasNode(id: NodeId): boolean
  hasEdge(source: NodeId, target: NodeId): boolean
  getNode(id: NodeId): Node | undefined
  getEdge(source: NodeId, target: NodeId): Edge | undefined
  
  // Graph properties
  get nodeCount(): number
  get edgeCount(): number
  get isDirected(): boolean
  
  // Iteration methods
  nodes(): IterableIterator<Node>
  edges(): IterableIterator<Edge>
  neighbors(nodeId: NodeId): IterableIterator<NodeId>
  inNeighbors(nodeId: NodeId): IterableIterator<NodeId> // Directed graphs
  outNeighbors(nodeId: NodeId): IterableIterator<NodeId> // Directed graphs
  
  // Utility methods
  degree(nodeId: NodeId): number
  inDegree(nodeId: NodeId): number
  outDegree(nodeId: NodeId): number
  clone(): Graph
}
```

**Reference Implementation**: [Graphology Graph class](https://github.com/graphology/graphology)

### 1.3 Supporting Data Structures

**File**: `src/data-structures/priority-queue.ts`

```typescript
export class PriorityQueue<T> {
  private heap: Array<{ item: T; priority: number }>;
  
  constructor(private compareFn?: (a: number, b: number) => number) {
    this.heap = [];
    this.compareFn = compareFn || ((a, b) => a - b); // Min-heap by default
  }
  
  enqueue(item: T, priority: number): void
  dequeue(): T | undefined
  peek(): T | undefined
  isEmpty(): boolean
  size(): number
}
```

**Reference Implementation**: [trekhleb/javascript-algorithms Priority Queue](https://github.com/trekhleb/javascript-algorithms/tree/master/src/data-structures/priority-queue)

**File**: `src/data-structures/union-find.ts`

```typescript
export class UnionFind {
  private parent: Map<NodeId, NodeId>;
  private rank: Map<NodeId, number>;
  
  constructor(elements: NodeId[]) {
    this.parent = new Map();
    this.rank = new Map();
    elements.forEach(element => {
      this.parent.set(element, element);
      this.rank.set(element, 0);
    });
  }
  
  find(element: NodeId): NodeId
  union(elementA: NodeId, elementB: NodeId): void
  connected(elementA: NodeId, elementB: NodeId): boolean
}
```

**Reference Implementation**: [trekhleb/javascript-algorithms Disjoint Set](https://github.com/trekhleb/javascript-algorithms/tree/master/src/data-structures/disjoint-set)

---

## Phase 2: Graph Traversal Algorithms

### 2.1 Breadth-First Search (BFS)

**File**: `src/algorithms/traversal/bfs.ts`

**Implementation Strategy**:
```typescript
export function breadthFirstSearch(
  graph: Graph, 
  startNode: NodeId,
  options: { 
    targetNode?: NodeId;
    visitCallback?: (node: NodeId, level: number) => void;
  } = {}
): TraversalResult {
  const visited = new Set<NodeId>();
  const queue: Array<{ node: NodeId; level: number }> = [];
  const order: NodeId[] = [];
  const tree = new Map<NodeId, NodeId | null>();
  
  // Algorithm implementation
  // 1. Initialize queue with start node
  // 2. Mark start node as visited
  // 3. While queue not empty:
  //    a. Dequeue node
  //    b. Process node (add to order, call callback)
  //    c. For each unvisited neighbor:
  //       - Mark as visited
  //       - Set parent in tree
  //       - Enqueue neighbor
  // 4. Return results
}

export function shortestPathBFS(
  graph: Graph,
  source: NodeId,
  target: NodeId
): ShortestPathResult | null {
  // Use BFS to find shortest path in unweighted graph
  // Return path reconstruction
}
```

**Key Features**:
- Level-by-level traversal
- Shortest path in unweighted graphs
- Tree construction for path reconstruction
- Optional early termination when target found
- Visitor pattern for custom processing

**Complexity**: O(V + E)

**Reference Implementation**: [Graphology BFS traversal](https://github.com/graphology/graphology-traversal)

### 2.2 Depth-First Search (DFS)

**File**: `src/algorithms/traversal/dfs.ts`

**Implementation Strategy**:
```typescript
export function depthFirstSearch(
  graph: Graph,
  startNode: NodeId,
  options: {
    recursive?: boolean;
    preOrder?: boolean;
    visitCallback?: (node: NodeId, depth: number) => void;
  } = {}
): TraversalResult {
  // Iterative implementation to avoid stack overflow
  const visited = new Set<NodeId>();
  const stack: Array<{ node: NodeId; depth: number }> = [];
  const order: NodeId[] = [];
  const tree = new Map<NodeId, NodeId | null>();
  
  // Algorithm implementation
  // 1. Initialize stack with start node
  // 2. While stack not empty:
  //    a. Pop node
  //    b. If not visited:
  //       - Mark as visited
  //       - Process node
  //       - Push all unvisited neighbors to stack
}

export function hasCycleDFS(graph: Graph): boolean {
  // Use DFS with color coding to detect cycles
  // White (0): unvisited, Gray (1): processing, Black (2): finished
}

export function topologicalSort(graph: Graph): NodeId[] | null {
  // DFS-based topological sorting for DAGs
  // Returns null if graph has cycles
}
```

**Key Features**:
- Iterative implementation (browser-safe)
- Cycle detection
- Topological sorting
- Pre/post-order traversal options

**Complexity**: O(V + E)

**Reference Implementation**: [trekhleb/javascript-algorithms DFS](https://github.com/trekhleb/javascript-algorithms/tree/master/src/algorithms/graph/depth-first-search)

---

## Phase 3: Shortest Path Algorithms

### 3.1 Dijkstra's Algorithm

**File**: `src/algorithms/shortest-path/dijkstra.ts`

**Implementation Strategy**:
```typescript
export function dijkstra(
  graph: Graph,
  source: NodeId,
  target?: NodeId
): Map<NodeId, ShortestPathResult> {
  const distances = new Map<NodeId, number>();
  const previous = new Map<NodeId, NodeId | null>();
  const visited = new Set<NodeId>();
  const pq = new PriorityQueue<NodeId>();
  
  // Algorithm implementation
  // 1. Initialize distances (source = 0, others = Infinity)
  // 2. Add all nodes to priority queue
  // 3. While priority queue not empty:
  //    a. Extract minimum distance node
  //    b. If target reached, can terminate early
  //    c. For each neighbor:
  //       - Calculate tentative distance
  //       - If shorter, update distance and previous
  //       - Update priority queue
  // 4. Reconstruct paths from previous map
}

export function dijkstraPath(
  graph: Graph,
  source: NodeId,
  target: NodeId
): ShortestPathResult | null {
  // Single source-target path finding
}

function reconstructPath(
  target: NodeId,
  previous: Map<NodeId, NodeId | null>
): NodeId[] {
  // Helper to reconstruct path from previous map
}
```

**Key Features**:
- Single-source shortest paths
- Early termination for single target
- Path reconstruction
- Support for weighted edges
- Handles disconnected components

**Complexity**: O((V + E) log V) with binary heap

**Reference Implementation**: [Cytoscape.js Dijkstra](https://github.com/cytoscape/cytoscape.js/blob/master/src/algorithms/dijkstra.js)

### 3.2 Bellman-Ford Algorithm

**File**: `src/algorithms/shortest-path/bellman-ford.ts`

**Implementation Strategy**:
```typescript
export interface BellmanFordResult {
  distances: Map<NodeId, number>;
  previous: Map<NodeId, NodeId | null>;
  hasNegativeCycle: boolean;
  negativeCycleNodes?: NodeId[];
}

export function bellmanFord(
  graph: Graph,
  source: NodeId
): BellmanFordResult {
  const distances = new Map<NodeId, number>();
  const previous = new Map<NodeId, NodeId | null>();
  
  // Algorithm implementation
  // 1. Initialize distances (source = 0, others = Infinity)
  // 2. Relax all edges V-1 times:
  //    For each edge (u,v) with weight w:
  //      if distance[u] + w < distance[v]:
  //        distance[v] = distance[u] + w
  //        previous[v] = u
  // 3. Check for negative cycles (one more iteration)
  // 4. If negative cycle found, identify affected nodes
}

function detectNegativeCycle(
  graph: Graph,
  distances: Map<NodeId, number>
): NodeId[] {
  // Find nodes affected by negative cycle
}
```

**Key Features**:
- Handles negative edge weights
- Detects negative cycles
- Single-source shortest paths
- Returns affected nodes in negative cycles

**Complexity**: O(VE)

**Reference Implementation**: [AndrewGaspar/bellmanford](https://github.com/AndrewGaspar/bellmanford)

---

## Phase 4: Centrality Measures

### 4.1 Degree Centrality

**File**: `src/algorithms/centrality/degree.ts`

**Implementation Strategy**:
```typescript
export function degreeCentrality(
  graph: Graph,
  options: {
    normalized?: boolean;
    mode?: 'in' | 'out' | 'total'; // For directed graphs
  } = {}
): CentralityResult {
  const centrality: CentralityResult = {};
  const nodeCount = graph.nodeCount;
  
  for (const node of graph.nodes()) {
    let degree: number;
    if (graph.isDirected && options.mode) {
      degree = options.mode === 'in' ? graph.inDegree(node.id) :
               options.mode === 'out' ? graph.outDegree(node.id) :
               graph.degree(node.id);
    } else {
      degree = graph.degree(node.id);
    }
    
    centrality[node.id.toString()] = options.normalized ? 
      degree / (nodeCount - 1) : degree;
  }
  
  return centrality;
}
```

**Complexity**: O(V)

**Reference Implementation**: [ngraph.centrality degree](https://github.com/anvaka/ngraph.centrality)

### 4.2 Betweenness Centrality

**File**: `src/algorithms/centrality/betweenness.ts`

**Implementation Strategy**:
```typescript
export function betweennessCentrality(
  graph: Graph,
  options: {
    normalized?: boolean;
    endpoints?: boolean;
  } = {}
): CentralityResult {
  const centrality: CentralityResult = {};
  
  // Initialize centrality scores
  for (const node of graph.nodes()) {
    centrality[node.id.toString()] = 0;
  }
  
  // For each node as source
  for (const source of graph.nodes()) {
    // Use modified Dijkstra/BFS to find all shortest paths
    const { distances, paths, sigma } = findAllShortestPaths(graph, source.id);
    
    // Calculate dependency and accumulate centrality scores
    const dependency = calculateDependency(paths, sigma);
    accumulateCentrality(centrality, dependency, source.id, options.endpoints);
  }
  
  // Normalize if requested
  if (options.normalized) {
    normalizeBetweenness(centrality, graph.nodeCount, graph.isDirected);
  }
  
  return centrality;
}

function findAllShortestPaths(graph: Graph, source: NodeId) {
  // Brandes algorithm implementation
  // Returns distances, shortest paths, and path counts
}
```

**Key Features**:
- Brandes algorithm for efficiency
- Handles directed and undirected graphs
- Optional normalization
- Optional endpoint inclusion

**Complexity**: O(VE) for unweighted, O(VE + V² log V) for weighted

**Reference Implementation**: [NetworkX betweenness centrality](https://github.com/networkx/networkx/blob/main/networkx/algorithms/centrality/betweenness.py)

### 4.3 Closeness Centrality

**File**: `src/algorithms/centrality/closeness.ts`

**Implementation Strategy**:
```typescript
export function closenessCentrality(
  graph: Graph,
  options: {
    normalized?: boolean;
    disconnected?: 'ignore' | 'zero' | 'reciprocal';
  } = {}
): CentralityResult {
  const centrality: CentralityResult = {};
  
  for (const node of graph.nodes()) {
    const distances = singleSourceShortestPath(graph, node.id);
    const reachableNodes = Array.from(distances.keys()).filter(
      target => target !== node.id && distances.get(target)! < Infinity
    );
    
    if (reachableNodes.length === 0) {
      centrality[node.id.toString()] = handleDisconnected(options.disconnected);
      continue;
    }
    
    const totalDistance = reachableNodes.reduce(
      (sum, target) => sum + distances.get(target)!, 0
    );
    
    let closeness = reachableNodes.length / totalDistance;
    
    if (options.normalized && graph.nodeCount > 1) {
      closeness *= (reachableNodes.length / (graph.nodeCount - 1));
    }
    
    centrality[node.id.toString()] = closeness;
  }
  
  return centrality;
}
```

**Complexity**: O(V²) using BFS, O(V³) using Floyd-Warshall

**Reference Implementation**: [Graphology metrics](https://github.com/graphology/graphology-metrics)

### 4.4 PageRank

**File**: `src/algorithms/centrality/pagerank.ts`

**Implementation Strategy**:
```typescript
export function pageRank(
  graph: Graph,
  options: {
    alpha?: number;        // Damping factor (default: 0.85)
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number;     // Convergence tolerance (default: 1e-6)
    personalization?: Map<NodeId, number>; // Personalized PageRank
  } = {}
): CentralityResult {
  const alpha = options.alpha ?? 0.85;
  const maxIter = options.maxIterations ?? 100;
  const tolerance = options.tolerance ?? 1e-6;
  
  const nodeCount = graph.nodeCount;
  const nodes = Array.from(graph.nodes()).map(n => n.id);
  
  // Initialize PageRank values
  let pagerank = new Map<NodeId, number>();
  let newPagerank = new Map<NodeId, number>();
  
  nodes.forEach(node => {
    pagerank.set(node, 1.0 / nodeCount);
    newPagerank.set(node, 0);
  });
  
  // Power iteration
  for (let iteration = 0; iteration < maxIter; iteration++) {
    // Calculate new PageRank values
    for (const node of nodes) {
      let rank = (1 - alpha) / nodeCount;
      
      // Add personalization if provided
      if (options.personalization) {
        rank = (1 - alpha) * (options.personalization.get(node) ?? 1.0 / nodeCount);
      }
      
      // Sum contributions from incoming links
      for (const neighbor of graph.inNeighbors(node)) {
        const neighborOutDegree = graph.outDegree(neighbor);
        if (neighborOutDegree > 0) {
          rank += alpha * pagerank.get(neighbor)! / neighborOutDegree;
        }
      }
      
      newPagerank.set(node, rank);
    }
    
    // Check convergence
    const diff = calculateDifference(pagerank, newPagerank);
    if (diff < tolerance) break;
    
    // Swap maps
    [pagerank, newPagerank] = [newPagerank, pagerank];
    newPagerank.forEach((_, key) => newPagerank.set(key, 0));
  }
  
  // Convert to result format
  const result: CentralityResult = {};
  pagerank.forEach((value, key) => {
    result[key.toString()] = value;
  });
  
  return result;
}
```

**Key Features**:
- Power iteration method
- Convergence checking
- Personalized PageRank support
- Handles directed graphs

**Complexity**: O(V + E) per iteration

**Reference Implementation**: [Cytoscape.js PageRank](https://github.com/cytoscape/cytoscape.js/blob/master/src/algorithms/page-rank.js)

---

## Phase 5: Community Detection

### 5.1 Louvain Algorithm

**File**: `src/algorithms/community/louvain.ts`

**Implementation Strategy**:
```typescript
export function louvain(
  graph: Graph,
  options: {
    resolution?: number;    // Resolution parameter (default: 1.0)
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number;     // Improvement tolerance (default: 1e-6)
  } = {}
): CommunityResult {
  const resolution = options.resolution ?? 1.0;
  const maxIter = options.maxIterations ?? 100;
  const tolerance = options.tolerance ?? 1e-6;
  
  let communities = initializeCommunities(graph);
  let modularity = calculateModularity(graph, communities, resolution);
  let iteration = 0;
  
  while (iteration < maxIter) {
    const improved = louvainPhase1(graph, communities, resolution);
    const newModularity = calculateModularity(graph, communities, resolution);
    
    if (!improved || (newModularity - modularity) < tolerance) {
      break;
    }
    
    // Phase 2: Build new graph with communities as nodes
    const communityGraph = buildCommunityGraph(graph, communities);
    communities = mergeCommunities(communities);
    modularity = newModularity;
    iteration++;
  }
  
  return {
    communities: extractCommunities(communities),
    modularity,
    iterations: iteration
  };
}

function louvainPhase1(
  graph: Graph,
  communities: Map<NodeId, number>,
  resolution: number
): boolean {
  // Phase 1: Local optimization
  // For each node, try moving to neighboring communities
  // Keep move if it improves modularity
}

function calculateModularity(
  graph: Graph,
  communities: Map<NodeId, number>,
  resolution: number
): number {
  // Calculate modularity Q = 1/(2m) * Σ[A_ij - (k_i * k_j)/(2m)] * δ(c_i, c_j)
}
```

**Key Features**:
- Two-phase optimization
- Modularity-based community detection
- Hierarchical community structure
- Resolution parameter for community size control

**Complexity**: O(n log n)

**Reference Implementation**: [jLouvain](https://github.com/upphiminn/jLouvain)

### 5.2 Girvan-Newman Algorithm

**File**: `src/algorithms/community/girvan-newman.ts`

**Implementation Strategy**:
```typescript
export function girvanNewman(
  graph: Graph,
  options: {
    maxCommunities?: number; // Stop when this many communities reached
    minCommunitySize?: number; // Minimum size for valid community
  } = {}
): CommunityResult[] {
  const dendrogram: CommunityResult[] = [];
  const workingGraph = graph.clone();
  
  while (workingGraph.edgeCount > 0) {
    // Calculate edge betweenness centrality
    const edgeBetweenness = calculateEdgeBetweenness(workingGraph);
    
    // Find edges with maximum betweenness
    const maxBetweenness = Math.max(...edgeBetweenness.values());
    const edgesToRemove = Array.from(edgeBetweenness.entries())
      .filter(([edge, centrality]) => centrality === maxBetweenness)
      .map(([edge]) => edge);
    
    // Remove edges with highest betweenness
    edgesToRemove.forEach(edge => {
      const [source, target] = edge.split('-');
      workingGraph.removeEdge(source, target);
    });
    
    // Find connected components (communities)
    const components = findConnectedComponents(workingGraph);
    
    // Calculate modularity
    const modularity = calculateModularity(graph, components, 1.0);
    
    dendrogram.push({
      communities: components.components,
      modularity
    });
    
    // Stop if desired number of communities reached
    if (options.maxCommunities && 
        components.components.length >= options.maxCommunities) {
      break;
    }
  }
  
  return dendrogram;
}

function calculateEdgeBetweenness(graph: Graph): Map<string, number> {
  // Calculate betweenness centrality for all edges
  // Using Brandes algorithm adapted for edges
}
```

**Key Features**:
- Hierarchical divisive clustering
- Edge betweenness-based removal
- Produces dendrogram of community structure
- Computationally expensive but interpretable

**Complexity**: O(m²n) where m = edges, n = nodes

**Reference Implementation**: [NetworkX Girvan-Newman](https://github.com/networkx/networkx/blob/main/networkx/algorithms/community/centrality.py)

---

## Phase 6: Connected Components

### 6.1 Connected Components (Union-Find)

**File**: `src/algorithms/components/connected-components.ts`

**Implementation Strategy**:
```typescript
export function connectedComponents(graph: Graph): ComponentResult {
  const nodes = Array.from(graph.nodes()).map(n => n.id);
  const unionFind = new UnionFind(nodes);
  
  // Union connected nodes
  for (const edge of graph.edges()) {
    unionFind.union(edge.source, edge.target);
  }
  
  // Group nodes by component
  const componentMap = new Map<NodeId, number>();
  const componentLeaders = new Map<NodeId, number>();
  let componentIndex = 0;
  
  for (const node of nodes) {
    const leader = unionFind.find(node);
    
    if (!componentLeaders.has(leader)) {
      componentLeaders.set(leader, componentIndex++);
    }
    
    componentMap.set(node, componentLeaders.get(leader)!);
  }
  
  // Create component arrays
  const components: NodeId[][] = Array(componentIndex).fill(null).map(() => []);
  componentMap.forEach((componentId, nodeId) => {
    components[componentId].push(nodeId);
  });
  
  return { components, componentMap };
}

export function isConnected(graph: Graph): boolean {
  const result = connectedComponents(graph);
  return result.components.length === 1;
}

export function largestComponent(graph: Graph): NodeId[] {
  const result = connectedComponents(graph);
  return result.components.reduce((largest, current) => 
    current.length > largest.length ? current : largest, []);
}
```

**Complexity**: O(α(n)) per edge with path compression

### 6.2 Strongly Connected Components (Tarjan's Algorithm)

**File**: `src/algorithms/components/strongly-connected.ts`

**Implementation Strategy**:
```typescript
export function stronglyConnectedComponents(graph: Graph): ComponentResult {
  if (!graph.isDirected) {
    throw new Error('Strongly connected components require directed graph');
  }
  
  const indices = new Map<NodeId, number>();
  const lowLinks = new Map<NodeId, number>();
  const onStack = new Set<NodeId>();
  const stack: NodeId[] = [];
  const components: NodeId[][] = [];
  let index = 0;
  
  function strongConnect(node: NodeId): void {
    // Set the depth index for node to the smallest unused index
    indices.set(node, index);
    lowLinks.set(node, index);
    index++;
    stack.push(node);
    onStack.add(node);
    
    // Consider successors of node
    for (const neighbor of graph.outNeighbors(node)) {
      if (!indices.has(neighbor)) {
        // Successor has not yet been visited; recurse on it
        strongConnect(neighbor);
        lowLinks.set(node, Math.min(lowLinks.get(node)!, lowLinks.get(neighbor)!));
      } else if (onStack.has(neighbor)) {
        // Successor is in stack and hence in the current SCC
        lowLinks.set(node, Math.min(lowLinks.get(node)!, indices.get(neighbor)!));
      }
    }
    
    // If node is a root node, pop the stack and print an SCC
    if (lowLinks.get(node) === indices.get(node)) {
      const component: NodeId[] = [];
      let w: NodeId;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== node);
      components.push(component);
    }
  }
  
  // Run algorithm on each unvisited node
  for (const node of graph.nodes()) {
    if (!indices.has(node.id)) {
      strongConnect(node.id);
    }
  }
  
  // Create component map
  const componentMap = new Map<NodeId, number>();
  components.forEach((component, index) => {
    component.forEach(node => componentMap.set(node, index));
  });
  
  return { components, componentMap };
}
```

**Key Features**:
- Single-pass algorithm
- Linear time complexity
- Produces components in reverse topological order
- Works only on directed graphs

**Complexity**: O(V + E)

**Reference Implementation**: [Boost SCC](https://www.boost.org/doc/libs/1_88_0/libs/graph/doc/strong_components.html)

---

## Phase 7: Testing and Validation

### 7.1 Test Data Structures

```typescript
// Test graph generators
export function createCompleteGraph(n: number): Graph
export function createPathGraph(n: number): Graph  
export function createCycleGraph(n: number): Graph
export function createStarGraph(n: number): Graph
export function createRandomGraph(n: number, p: number): Graph // Erdős–Rényi
export function createBarabasiAlbertGraph(n: number, m: number): Graph
```

### 7.2 Benchmark Datasets

- **Small graphs** (< 100 nodes): Karate club, Les Misérables
- **Medium graphs** (100-10k nodes): Social networks, collaboration networks  
- **Large graphs** (> 10k nodes): Road networks, web graphs

**Reference Datasets**: [Stanford Large Network Dataset Collection](https://snap.stanford.edu/data/)

### 7.3 Performance Testing

```typescript
export function benchmarkAlgorithm(
  algorithm: Function,
  graphs: Graph[],
  runs: number = 10
): BenchmarkResult {
  // Time algorithm execution across different graph sizes
  // Measure memory usage
  // Validate correctness against known results
}
```

---

## Implementation Timeline

### Week 1-2: Foundation
- Core graph data structure
- Basic types and interfaces
- Supporting data structures (priority queue, union-find)
- Basic graph operations and utilities

### Week 3-4: Traversal Algorithms  
- BFS implementation with path reconstruction
- DFS implementation with cycle detection
- Comprehensive testing with various graph types

### Week 5-6: Shortest Path Algorithms
- Dijkstra's algorithm with priority queue optimization
- Bellman-Ford with negative cycle detection
- Performance optimization and edge case handling

### Week 7-8: Centrality Measures
- Degree centrality (simple implementation)
- Betweenness centrality (Brandes algorithm)
- Closeness centrality with disconnected graph handling
- PageRank with convergence optimization

### Week 9-10: Community Detection
- Louvain algorithm with modularity optimization
- Girvan-Newman algorithm (computationally intensive)
- Performance testing on realistic datasets

### Week 11-12: Connected Components
- Union-Find based connected components
- Tarjan's algorithm for strongly connected components
- Integration testing and documentation

---

## Performance Considerations

### Browser Optimization
1. **Web Workers**: Move computationally intensive algorithms to background threads
2. **Streaming**: Process large graphs in chunks to avoid blocking UI
3. **Memory Management**: Use typed arrays for numeric computations
4. **Iterative Implementation**: Avoid recursion to prevent stack overflow

### Algorithm-Specific Optimizations
1. **BFS/DFS**: Use efficient queue/stack implementations
2. **Dijkstra**: Binary heap for priority queue, early termination
3. **PageRank**: Sparse matrix representation, convergence acceleration  
4. **Louvain**: Community size balancing, resolution parameter tuning
5. **Centrality**: Sampling for approximate results on large graphs

---

## API Design Principles

### Functional API Style
```typescript
// Cytoscape.js style
const result = graph.dijkstra({ root: 'node1', goal: 'node2' });

// Functional style  
const result = dijkstra(graph, 'node1', 'node2');
```

### Progressive Enhancement
```typescript
// Basic usage
const centrality = degreeCentrality(graph);

// Advanced usage with options
const centrality = degreeCentrality(graph, {
  normalized: true,
  mode: 'in'
});
```

### TypeScript Integration
- Full type safety with generics
- Comprehensive JSDoc documentation
- Export both individual algorithms and unified API

---

## References and Starting Points

### Primary References
1. **Graphology**: Most comprehensive TypeScript graph library
   - Repository: https://graphology.github.io/
   - Use for: Core graph structure, API design patterns

2. **trekhleb/javascript-algorithms**: Educational implementations
   - Repository: https://github.com/trekhleb/javascript-algorithms
   - Use for: Algorithm implementation details, test cases

3. **Cytoscape.js**: Production-ready JavaScript graph library
   - Repository: https://github.com/cytoscape/cytoscape.js
   - Use for: Performance optimization patterns, API design

4. **jLouvain**: Clean Louvain implementation
   - Repository: https://github.com/upphiminn/jLouvain
   - Use for: Community detection algorithm

5. **ngraph.centrality**: High-performance centrality calculations
   - Repository: https://github.com/anvaka/ngraph.centrality
   - Use for: Optimization techniques

### Academic References
- **Algorithms in C++**: Robert Sedgewick (implementation patterns)
- **Introduction to Algorithms**: CLRS (algorithm analysis)
- **Networks, Crowds, and Markets**: Easley & Kleinberg (graph theory applications)
- **Network Science**: Albert-László Barabási (modern network analysis)

### Performance Benchmarks
- [Graph Algorithm Benchmarks](https://github.com/stanford-futuredata/graph-benchmark)
- [Network Analysis Performance Study](https://dl.acm.org/doi/10.1145/2898361)

This implementation plan provides a comprehensive roadmap for building Priority 1 graph algorithms in TypeScript, with sufficient detail for Claude Code to implement each component systematically.