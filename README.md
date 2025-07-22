# @graphty/algorithms

[![Build Status](https://github.com/graphty-org/algorithms/workflows/CI/badge.svg)](https://github.com/graphty-org/algorithms/actions)
[![Coverage Status](https://codecov.io/gh/graphty-org/algorithms/branch/main/graph/badge.svg)](https://codecov.io/gh/graphty-org/algorithms)
[![npm version](https://img.shields.io/npm/v/@graphty/algorithms.svg)](https://www.npmjs.com/package/@graphty/algorithms)

A comprehensive TypeScript graph algorithms library with 65+ algorithms optimized for browser environments and visualization applications.

## Features

- **TypeScript-first**: Full type safety with comprehensive type definitions
- **Browser-optimized**: Designed to run efficiently in web browsers
- **Modular**: Import only the algorithms you need
- **Comprehensive**: 65+ graph algorithms including traversal, shortest paths, centrality, clustering, flow, and more
- **Well-tested**: Extensive test suite with high coverage
- **Standards-compliant**: Follows conventional commits and semantic versioning

## Installation

```bash
npm install @graphty/algorithms
```

## Quick Start

```typescript
import { Graph, breadthFirstSearch, dijkstra } from '@graphty/algorithms';

// Create a new graph
const graph = new Graph();

// Add nodes and edges
graph.addNode('A');
graph.addNode('B');
graph.addNode('C');
graph.addEdge('A', 'B', 1); // source, target, weight
graph.addEdge('B', 'C', 2);

// Basic graph operations
console.log(graph.nodeCount); // 3
console.log(graph.totalEdgeCount); // 2
console.log(graph.hasEdge('A', 'B')); // true

// Run algorithms
const traversal = breadthFirstSearch(graph, 'A');
console.log(traversal.order); // ['A', 'B', 'C']

const shortestPaths = dijkstra(graph, 'A');
console.log(shortestPaths.distances); // Map { 'A' => 0, 'B' => 1, 'C' => 3 }
```

## API Reference

### Graph Class

The core data structure for representing graphs.

```typescript
class Graph {
  constructor(config?: Partial<GraphConfig>)
}
```

#### Configuration Options

```typescript
interface GraphConfig {
  directed: boolean;         // Default: false
  allowSelfLoops: boolean;   // Default: false
  allowParallelEdges: boolean; // Default: false
}
```

#### Node Operations

```typescript
// Add a node with optional data
graph.addNode(id: NodeId, data?: Record<string, unknown>): void

// Remove a node and all its edges
graph.removeNode(id: NodeId): boolean

// Check if a node exists
graph.hasNode(id: NodeId): boolean

// Get node details
graph.getNode(id: NodeId): Node | undefined

// Get all nodes
graph.nodes(): IterableIterator<Node>
```

#### Edge Operations

```typescript
// Add an edge with optional weight and data
graph.addEdge(
  source: NodeId, 
  target: NodeId, 
  weight?: number, 
  data?: Record<string, unknown>
): void

// Remove an edge
graph.removeEdge(source: NodeId, target: NodeId): boolean

// Check if an edge exists
graph.hasEdge(source: NodeId, target: NodeId): boolean

// Get edge details
graph.getEdge(source: NodeId, target: NodeId): Edge | undefined

// Get all edges
graph.edges(): IterableIterator<Edge>
```

#### Graph Properties

```typescript
// Number of nodes
graph.nodeCount: number

// Total number of edges (counts both directions for undirected)
graph.totalEdgeCount: number

// Number of unique edges
graph.uniqueEdgeCount: number

// Check if graph is directed
graph.isDirected: boolean
```

#### Degree Operations

```typescript
// Total degree (in + out for directed)
graph.degree(nodeId: NodeId): number

// In-degree (directed graphs only)
graph.inDegree(nodeId: NodeId): number

// Out-degree
graph.outDegree(nodeId: NodeId): number
```

#### Neighbor Operations

```typescript
// Get neighboring nodes
graph.neighbors(nodeId: NodeId): IterableIterator<NodeId>

// Get incoming neighbors (directed graphs)
graph.inNeighbors(nodeId: NodeId): IterableIterator<NodeId>

// Get outgoing neighbors
graph.outNeighbors(nodeId: NodeId): IterableIterator<NodeId>
```

#### Utility Methods

```typescript
// Create a deep copy
graph.clone(): Graph

// Clear all nodes and edges
graph.clear(): void
```

### Traversal Algorithms

#### Breadth-First Search (BFS)

```typescript
import { breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS } from '@graphty/algorithms';

// Basic BFS traversal
const result = breadthFirstSearch(graph, startNode, {
  maxDepth?: number,     // Optional: limit traversal depth
  visitCallback?: (node: NodeId, depth: number) => void
});
// Returns: TraversalResult { visited: Set<NodeId>, order: NodeId[], tree?: Map<NodeId, NodeId> }

// Find shortest path between two nodes (unweighted)
const path = shortestPathBFS(graph, source, target);
// Returns: NodeId[] | null

// Find all shortest paths from a source
const paths = singleSourceShortestPathBFS(graph, source);
// Returns: Map<NodeId, NodeId[]>

// Check if graph is bipartite
const bipartite = isBipartite(graph);
// Returns: { isBipartite: boolean, coloring?: Map<NodeId, number> }
```

#### Depth-First Search (DFS)

```typescript
import { depthFirstSearch, topologicalSort, hasCycleDFS } from '@graphty/algorithms';

// Basic DFS traversal
const result = depthFirstSearch(graph, startNode, {
  previsitCallback?: (node: NodeId) => void,
  postvisitCallback?: (node: NodeId) => void
});
// Returns: TraversalResult

// Topological sort (for DAGs)
const sorted = topologicalSort(graph);
// Returns: NodeId[] | null (null if cycle detected)

// Cycle detection
const hasCycle = hasCycleDFS(graph);
// Returns: boolean
```

### Shortest Path Algorithms

#### Dijkstra's Algorithm

```typescript
import { dijkstra, dijkstraPath, singleSourceShortestPath, allPairsShortestPath } from '@graphty/algorithms';

// Single-source shortest paths
const result = dijkstra(graph, source, {
  target?: NodeId        // Optional: stop when target is reached
});
// Returns: Map<NodeId, { path: NodeId[], distance: number, predecessor: NodeId | null }>

// Get specific path
const path = dijkstraPath(graph, source, target);
// Returns: { path: NodeId[], distance: number } | null

// All shortest paths from source
const paths = singleSourceShortestPath(graph, source);
// Returns: Map<NodeId, { path: NodeId[], distance: number }>

// All pairs shortest paths
const allPairs = allPairsShortestPath(graph);
// Returns: Map<NodeId, Map<NodeId, { path: NodeId[], distance: number }>>
```

#### Bellman-Ford Algorithm

```typescript
import { bellmanFord, bellmanFordPath, hasNegativeCycle } from '@graphty/algorithms';

// Single-source shortest paths (handles negative weights)
const result = bellmanFord(graph, source);
// Returns: BellmanFordResult { 
//   distances: Map<NodeId, number>, 
//   predecessors: Map<NodeId, NodeId | null>,
//   hasNegativeCycle: boolean,
//   negativeCycleNodes?: Set<NodeId>
// }

// Get specific path
const path = bellmanFordPath(graph, source, target);
// Returns: { path: NodeId[], distance: number } | null

// Check for negative cycles
const result = hasNegativeCycle(graph);
// Returns: BellmanFordResult with hasNegativeCycle boolean
```

#### Floyd-Warshall Algorithm

```typescript
import { floydWarshall, floydWarshallPath, transitiveClosure } from '@graphty/algorithms';

// All pairs shortest paths
const result = floydWarshall(graph);
// Returns: { distances: Map<NodeId, Map<NodeId, number>>, next: Map<NodeId, Map<NodeId, NodeId | null>> }

// Get specific path between any pair
const path = floydWarshallPath(result, source, target);
// Returns: NodeId[] | null

// Compute transitive closure
const closure = transitiveClosure(graph);
// Returns: Map<NodeId, Set<NodeId>>
```

### Centrality Algorithms

#### Degree Centrality

```typescript
import { degreeCentrality, nodeDegreeCentrality } from '@graphty/algorithms';

// Calculate for all nodes
const centralities = degreeCentrality(graph, {
  normalized?: boolean,   // Default: false
  weight?: string        // Optional: edge property for weighted degree
});
// Returns: CentralityResult (Map<NodeId, number>)

// Calculate for single node
const centrality = nodeDegreeCentrality(graph, nodeId, { normalized?: boolean });
// Returns: number
```

#### Betweenness Centrality

```typescript
import { betweennessCentrality, nodeBetweennessCentrality, edgeBetweennessCentrality } from '@graphty/algorithms';

// Node betweenness for all nodes
const centralities = betweennessCentrality(graph, {
  normalized?: boolean,   // Default: false
  weight?: string,       // Optional: use weighted shortest paths
  endpoints?: boolean    // Default: false, include endpoints in paths
});
// Returns: CentralityResult

// Single node betweenness
const centrality = nodeBetweennessCentrality(graph, nodeId, options);
// Returns: number

// Edge betweenness
const edgeCentralities = edgeBetweennessCentrality(graph, options);
// Returns: Map<string, number> (edge ID to centrality)
```

#### Closeness Centrality

```typescript
import { closenessCentrality, nodeClosenessCentrality, weightedClosenessCentrality } from '@graphty/algorithms';

// Closeness for all nodes
const centralities = closenessCentrality(graph, {
  normalized?: boolean    // Default: false
});
// Returns: CentralityResult

// Single node closeness
const centrality = nodeClosenessCentrality(graph, nodeId, { normalized?: boolean });
// Returns: number

// Weighted closeness
const centralities = weightedClosenessCentrality(graph, {
  normalized?: boolean,
  weight?: string        // Edge property for weights
});
// Returns: CentralityResult
```

#### PageRank

```typescript
import { pageRank, personalizedPageRank, topPageRankNodes } from '@graphty/algorithms';

// Standard PageRank
const result = pageRank(graph, {
  dampingFactor?: number,    // Default: 0.85
  maxIterations?: number,    // Default: 100
  tolerance?: number,        // Default: 1e-6
  initialRanks?: Record<string, number>,
  personalization?: Record<string, number>
});
// Returns: { ranks: Record<string, number>, iterations: number, converged: boolean }

// Personalized PageRank (with bias)
const ranks = personalizedPageRank(graph, personalization, options);
// personalization: Map<NodeId, number> - restart probabilities
// Returns: CentralityResult

// Get top N nodes by PageRank
const topNodes = topPageRankNodes(graph, n, options);
// Returns: Array<{ node: NodeId, rank: number }>
```

### Connected Components

#### Basic Component Operations

```typescript
import { 
  connectedComponents, 
  isConnected, 
  numberOfConnectedComponents,
  largestConnectedComponent,
  getConnectedComponent 
} from '@graphty/algorithms';

// Find all components
const components = connectedComponents(graph);
// Returns: NodeId[][] (array of component arrays)

// Check if graph is connected
const connected = isConnected(graph);
// Returns: boolean

// Count components
const count = numberOfConnectedComponents(graph);
// Returns: number

// Get largest component
const largest = largestConnectedComponent(graph);
// Returns: NodeId[]

// Get component containing a specific node
const component = getConnectedComponent(graph, nodeId);
// Returns: Set<NodeId>
```

#### Strongly Connected Components

```typescript
import { 
  stronglyConnectedComponents,
  findStronglyConnectedComponents,
  isStronglyConnected,
  condensationGraph 
} from '@graphty/algorithms';

// Find SCCs using Tarjan's algorithm
const sccs = stronglyConnectedComponents(graph);
// Returns: ComponentResult

// Alternative: using DFS
const sccs = findStronglyConnectedComponents(graph);
// Returns: NodeId[][]

// Check if directed graph is strongly connected
const stronglyConnected = isStronglyConnected(graph);
// Returns: boolean

// Create condensation graph (DAG of SCCs)
const condensation = condensationGraph(graph);
// Returns: { graph: Graph, componentMap: Map<NodeId, number> }
```

#### Weakly Connected Components

```typescript
import { weaklyConnectedComponents, isWeaklyConnected } from '@graphty/algorithms';

// Find WCCs (ignoring edge direction)
const wccs = weaklyConnectedComponents(graph);
// Returns: ComponentResult

// Check if directed graph is weakly connected
const weaklyConnected = isWeaklyConnected(graph);
// Returns: boolean
```

### Data Structures

#### Priority Queue

Min-heap implementation used internally by algorithms.

```typescript
import { PriorityQueue } from '@graphty/algorithms';

const pq = new PriorityQueue<T>((a, b) => a.priority - b.priority);

pq.enqueue(item);
pq.dequeue();
pq.peek();
pq.isEmpty();
pq.size;
pq.clear();
```

#### Union-Find (Disjoint Set)

Efficient data structure for tracking connected components.

```typescript
import { UnionFind } from '@graphty/algorithms';

const uf = new UnionFind<T>();

uf.makeSet(item);
uf.find(item);
uf.union(item1, item2);
uf.connected(item1, item2);
uf.getSetSize(item);
uf.numberOfSets;
```

### Minimum Spanning Tree Algorithms

#### Kruskal's Algorithm

```typescript
import { kruskalMST, minimumSpanningTree } from '@graphty/algorithms';

// Find MST using Kruskal's algorithm
const mst = kruskalMST(graph);
// Returns: { edges: Edge[], weight: number }

// Alternative alias
const mst = minimumSpanningTree(graph);
```

#### Prim's Algorithm

```typescript
import { primMST } from '@graphty/algorithms';

// Find MST using Prim's algorithm
const mst = primMST(graph, startNode?);
// Returns: { edges: Edge[], weight: number }
```

### Community Detection Algorithms

#### Louvain Method

```typescript
import { louvain } from '@graphty/algorithms';

// Detect communities using Louvain method
const communities = louvain(graph, {
  resolution?: number,      // Default: 1.0
  randomSeed?: number
});
// Returns: { communities: Map<NodeId, number>, modularity: number }
```

#### Leiden Algorithm

```typescript
import { leiden } from '@graphty/algorithms';

// Improved community detection
const communities = leiden(graph, {
  resolution?: number,      // Default: 1.0
  iterations?: number,      // Default: 10
  randomSeed?: number
});
// Returns: { communities: Map<NodeId, number>, modularity: number }
```

#### Label Propagation

```typescript
import { labelPropagation, labelPropagationAsync, labelPropagationSemiSupervised } from '@graphty/algorithms';

// Basic label propagation
const labels = labelPropagation(graph, {
  maxIterations?: number    // Default: 100
});
// Returns: Map<NodeId, number>

// Asynchronous version
const labels = labelPropagationAsync(graph, options);

// Semi-supervised with seed communities
const labels = labelPropagationSemiSupervised(graph, seedLabels, options);
```

#### Girvan-Newman Algorithm

```typescript
import { girvanNewman } from '@graphty/algorithms';

// Edge betweenness based community detection
const dendrogram = girvanNewman(graph, {
  targetCommunities?: number  // Stop at this many communities
});
// Returns: { levels: Array<{ modularity: number, communities: NodeId[][] }> }
```

### Pathfinding Algorithms

#### A* Algorithm

```typescript
import { astar, astarWithDetails, heuristics } from '@graphty/algorithms';

// A* pathfinding with heuristic
const path = astar(graph, start, goal, {
  heuristic: heuristics.euclidean,  // or manhattan, chebyshev, zero
  weight?: (edge: Edge) => number
});
// Returns: { path: NodeId[], cost: number } | null

// A* with search details
const result = astarWithDetails(graph, start, goal, options);
// Returns: { path: NodeId[], cost: number, explored: Set<NodeId>, parent: Map<NodeId, NodeId> } | null
```

### Flow Algorithms

#### Maximum Flow

```typescript
import { fordFulkerson, edmondsKarp } from '@graphty/algorithms';

// Ford-Fulkerson using DFS
const flow = fordFulkerson(graph, source, sink, {
  capacityKey?: string      // Edge property for capacity
});
// Returns: { maxFlow: number, flowGraph: Map<NodeId, Map<NodeId, number>> }

// Edmonds-Karp using BFS (better complexity)
const flow = edmondsKarp(graph, source, sink, options);
```

#### Minimum Cut

```typescript
import { minSTCut, stoerWagner, kargerMinCut } from '@graphty/algorithms';

// Min s-t cut using max flow
const cut = minSTCut(graph, source, sink);
// Returns: { cutValue: number, sourcePartition: Set<NodeId>, sinkPartition: Set<NodeId> }

// Global minimum cut (Stoer-Wagner)
const cut = stoerWagner(graph);
// Returns: { cutValue: number, partition1: Set<NodeId>, partition2: Set<NodeId> }

// Randomized min cut (Karger)
const cut = kargerMinCut(graph, iterations?);
// Returns: { cutValue: number, partition1: Set<NodeId>, partition2: Set<NodeId> }
```

### Clustering Algorithms

#### Hierarchical Clustering

```typescript
import { hierarchicalClustering, cutDendrogram, cutDendrogramKClusters } from '@graphty/algorithms';

// Agglomerative clustering
const dendrogram = hierarchicalClustering(graph, {
  linkage: 'single' | 'complete' | 'average',  // Default: 'average'
  distanceMetric?: (a: NodeId, b: NodeId) => number
});
// Returns: Dendrogram structure

// Cut at specific height
const clusters = cutDendrogram(dendrogram, height);
// Returns: NodeId[][]

// Get exactly k clusters
const clusters = cutDendrogramKClusters(dendrogram, k);
// Returns: NodeId[][]
```

#### K-Core Decomposition

```typescript
import { kCoreDecomposition, getKCore, kTruss } from '@graphty/algorithms';

// Find all k-cores
const cores = kCoreDecomposition(graph);
// Returns: Map<NodeId, number> (node to core number)

// Extract specific k-core subgraph
const kCore = getKCore(graph, k);
// Returns: Set<NodeId>

// Find k-truss (triangular cores)
const truss = kTruss(graph, k);
// Returns: Graph
```

## Examples

The library includes comprehensive examples demonstrating each algorithm. Find them in the [examples directory](https://github.com/graphty-org/algorithms/tree/main/examples):

### Basic Algorithms
- [BFS Traversal](https://github.com/graphty-org/algorithms/blob/main/examples/bfs-example.js) - Breadth-first search and shortest paths
- [DFS Traversal](https://github.com/graphty-org/algorithms/blob/main/examples/dfs-example.js) - Depth-first search and applications
- [Dijkstra's Algorithm](https://github.com/graphty-org/algorithms/blob/main/examples/dijkstra-example.js) - Weighted shortest paths
- [Bellman-Ford](https://github.com/graphty-org/algorithms/blob/main/examples/bellman-ford-example.js) - Shortest paths with negative weights
- [Floyd-Warshall](https://github.com/graphty-org/algorithms/blob/main/examples/floyd-warshall-example.js) - All pairs shortest paths

### Centrality Measures
- [Degree Centrality](https://github.com/graphty-org/algorithms/blob/main/examples/degree-centrality-example.js) - Node importance by connections
- [Betweenness Centrality](https://github.com/graphty-org/algorithms/blob/main/examples/betweenness-centrality-example.js) - Bridge nodes
- [Closeness Centrality](https://github.com/graphty-org/algorithms/blob/main/examples/closeness-centrality-example.js) - Central nodes
- [PageRank](https://github.com/graphty-org/algorithms/blob/main/examples/pagerank-example.js) - Node ranking algorithm

### Graph Structure
- [Connected Components](https://github.com/graphty-org/algorithms/blob/main/examples/connected-components-example.js) - Find graph components
- [Kruskal's MST](https://github.com/graphty-org/algorithms/blob/main/examples/kruskal-example.js) - Minimum spanning tree
- [Prim's MST](https://github.com/graphty-org/algorithms/blob/main/examples/prim-example.js) - Alternative MST algorithm

### Community Detection
- [Louvain Method](https://github.com/graphty-org/algorithms/blob/main/examples/louvain-example.js) - Modularity-based communities
- [Leiden Algorithm](https://github.com/graphty-org/algorithms/blob/main/examples/leiden-community.ts) - Improved Louvain
- [Label Propagation](https://github.com/graphty-org/algorithms/blob/main/examples/label-propagation.ts) - Fast community detection
- [Girvan-Newman](https://github.com/graphty-org/algorithms/blob/main/examples/girvan-newman-example.js) - Hierarchical communities

### Advanced Algorithms
- [A* Pathfinding](https://github.com/graphty-org/algorithms/blob/main/examples/astar-pathfinding.ts) - Heuristic pathfinding
- [Flow Algorithms](https://github.com/graphty-org/algorithms/blob/main/examples/flow-algorithms.ts) - Maximum flow and applications
- [Ford-Fulkerson Flow](https://github.com/graphty-org/algorithms/blob/main/examples/ford-fulkerson-flow.ts) - Maximum flow implementation
- [Minimum Cut](https://github.com/graphty-org/algorithms/blob/main/examples/min-cut.ts) - Graph partitioning
- [Hierarchical Clustering](https://github.com/graphty-org/algorithms/blob/main/examples/hierarchical-clustering.ts) - Graph clustering
- [K-Core Decomposition](https://github.com/graphty-org/algorithms/blob/main/examples/k-core-decomposition.ts) - Core analysis

## Advanced Usage Examples

### Working with Weighted Graphs

```typescript
const graph = new Graph();

// Add weighted edges
graph.addEdge('A', 'B', 5);
graph.addEdge('B', 'C', 3);
graph.addEdge('A', 'C', 10);

// Find shortest path considering weights
const result = dijkstra(graph, 'A');
const pathToC = dijkstraPath(graph, 'A', 'C');
console.log(pathToC); // { path: ['A', 'B', 'C'], distance: 8 }
```

### Directed Graphs

```typescript
const directedGraph = new Graph({ directed: true });

directedGraph.addEdge('A', 'B');
directedGraph.addEdge('B', 'C');
directedGraph.addEdge('C', 'A');

// Check for cycles
console.log(hasCycleDFS(directedGraph)); // true

// Find strongly connected components
const sccs = stronglyConnectedComponents(directedGraph);
console.log(sccs.components); // [['A', 'B', 'C']]
```

### Network Analysis

```typescript
// Identify important nodes
const graph = createSocialNetwork(); // Your graph

// Find influencers (high PageRank)
const influencers = topPageRankNodes(graph, 10);

// Find bridges (high betweenness)
const bridgers = Array.from(betweennessCentrality(graph).entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

// Find communities (connected components)
const communities = connectedComponents(graph);
console.log(`Found ${communities.components.length} communities`);
```

### Custom Edge Properties

```typescript
const graph = new Graph();

// Add edges with custom data
graph.addEdge('A', 'B', 1, { 
  type: 'road', 
  distance: 100, 
  traffic: 'heavy' 
});

// Use custom weight in algorithms
const result = dijkstra(graph, 'A', { 
  weightKey: 'distance' // Use 'distance' property as weight
});
```

### Graph Visualization Preparation

```typescript
// Prepare data for visualization
const graph = loadGraph();

// Calculate layout metrics
const centralities = degreeCentrality(graph, { normalized: true });
const ranks = pageRank(graph);

// Export for visualization
const nodes = Array.from(graph.nodes()).map(node => ({
  id: node.id,
  data: node.data,
  size: centralities.get(node.id) || 0,
  importance: ranks.get(node.id) || 0
}));

const edges = Array.from(graph.edges()).map(edge => ({
  source: edge.source,
  target: edge.target,
  weight: edge.weight || 1,
  data: edge.data
}));
```

## Type Definitions

### Core Types

```typescript
type NodeId = string | number;

interface Node {
  id: NodeId;
  data?: Record<string, unknown>;
}

interface Edge {
  source: NodeId;
  target: NodeId;
  weight?: number;
  id?: string;
  data?: Record<string, unknown>;
}
```

### Algorithm Result Types

```typescript
interface TraversalResult {
  visited: Set<NodeId>;
  order: NodeId[];
  tree?: Map<NodeId, NodeId>;
}

interface ShortestPathResult {
  path: NodeId[];
  distance: number;
  predecessor: NodeId | null;
}

interface BellmanFordResult {
  distances: Map<NodeId, number>;
  predecessors: Map<NodeId, NodeId | null>;
  hasNegativeCycle: boolean;
  negativeCycleNodes?: Set<NodeId>;
}

type CentralityResult = Record<string, number>;

interface PageRankResult {
  ranks: Record<string, number>;
  iterations: number;
  converged: boolean;
}

interface CommunityResult {
  communities: Map<NodeId, number>;
  modularity: number;
}
```

## Performance Considerations

- **Graph Representation**: Uses adjacency lists for O(1) neighbor access
- **Algorithm Complexity**:
  - BFS/DFS: O(V + E)
  - Dijkstra: O((V + E) log V) with binary heap
  - Bellman-Ford: O(VE)
  - Floyd-Warshall: O(V³)
  - PageRank: O(k(V + E)) where k is iterations
  - Connected Components: O(V + E)
  - Kruskal's MST: O(E log E)
  - Prim's MST: O((V + E) log V)
  - A*: O((V + E) log V) - depends on heuristic quality
  - Ford-Fulkerson: O(E * f) where f is max flow
  - Edmonds-Karp: O(VE²)
  - Louvain/Leiden: O(n log n) average case
  - Hierarchical Clustering: O(n² log n)
- **Memory Usage**: O(V + E) for graph storage
- **Browser Optimization**: Algorithms use iterative approaches where possible to avoid stack overflow

## Development

### Prerequisites

- Node.js 18+ 
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/graphty-org/algorithms.git
cd algorithms

# Install dependencies
npm install

# Set up git hooks
npm run prepare
```

### Scripts

```bash
# Development
npm run dev          # Watch mode compilation
npm run build        # Build the library
npm run typecheck    # Type checking

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
npm run test:browser # Run browser tests

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run lint:pkg     # Check for unused dependencies

# Git
npm run commit       # Conventional commit helper
```

### Project Structure

```
src/
├── core/              # Core graph data structures
├── algorithms/        # Algorithm implementations
│   ├── traversal/     # BFS, DFS
│   ├── shortest-path/ # Dijkstra, Bellman-Ford
│   ├── centrality/    # Degree, Betweenness, PageRank
│   └── components/    # Connected components
├── data-structures/   # Supporting data structures
├── types/            # TypeScript type definitions
└── utils/            # Utility functions

test/
├── unit/             # Unit tests
├── browser/          # Browser-specific tests
└── helpers/          # Test utilities
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new algorithm
fix(scope): resolve edge case in traversal
docs(scope): update API documentation
test(scope): add coverage for centrality measures
```

## License

MIT © Adam Powers

## Related Projects

- [@graphty/layout](https://github.com/graphty-org/layout) - Graph layout algorithms
- [@graphty/graphty-element](https://github.com/graphty-org/graphty-element) - 3D graph visualization web component