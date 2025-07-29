# @graphty/algorithms

[![Build Status](https://github.com/graphty-org/algorithms/actions/workflows/test.yml/badge.svg)](https://github.com/graphty-org/algorithms/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/graphty-org/algorithms/badge.svg)](https://coveralls.io/github/graphty-org/algorithms)
[![npm version](https://img.shields.io/npm/v/@graphty/algorithms.svg)](https://www.npmjs.com/package/@graphty/algorithms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Examples](https://img.shields.io/badge/demo-github%20pages-blue)](https://graphty-org.github.io/algorithms/)

A comprehensive TypeScript graph algorithms library with 98 algorithms optimized for browser environments and visualization applications.

## Features

- **TypeScript-first**: Full type safety with comprehensive type definitions
- **Browser-optimized**: Designed to run efficiently in web browsers
- **Modular**: Import only the algorithms you need
- **Comprehensive**: 98 graph algorithms including traversal, shortest paths, centrality, clustering, flow, matching, link prediction, and more
- **Interactive Examples**: [Live demos](https://graphty-org.github.io/algorithms/) with visualizations for all algorithms
- **Performance Analysis**: [Detailed benchmarks](https://graphty-org.github.io/algorithms/benchmarks/) comparing algorithm performance
- **Well-tested**: Extensive test suite with high coverage
- **Standards-compliant**: Follows conventional commits and semantic versioning

## Performance Optimizations

The library automatically optimizes performance for large graphs (≥10,000 nodes) using:

- **Direction-Optimized BFS**: Dynamically switches between top-down and bottom-up search strategies, providing up to 42x speedup on large graphs
- **CSR Graph Format**: Compressed Sparse Row format for cache-efficient memory access
- **Bit-Packed Data Structures**: 8x memory reduction using bit arrays for boolean data

These optimizations are applied automatically - no configuration needed! Just use the standard API:

```typescript
// Automatically uses optimized implementation for large graphs
const result = breadthFirstSearch(largeGraph, startNode);
```

All BFS-based algorithms benefit from these optimizations:
- `breadthFirstSearch`, `shortestPathBFS`, `singleSourceShortestPathBFS`
- `betweennessCentrality`, `closenessCentrality`
- Connected component algorithms

### Performance Benchmarks

| Graph Size | Standard BFS | Optimized BFS | Speedup |
|------------|--------------|---------------|---------|
| 10K nodes  | 4.40ms      | 6.34ms        | 0.69x   |
| 50K nodes  | 158.64ms    | 44.27ms       | 3.58x   |
| 100K nodes | 5,370ms     | 126ms         | 42.58x  |

*Note: Optimizations activate automatically for graphs ≥10K nodes to avoid conversion overhead on smaller graphs.*

### Learn More

- 📖 [Performance Guide](docs/PERFORMANCE_GUIDE.md) - Detailed optimization explanations
- 🔄 [Migration Guide](docs/MIGRATION_GUIDE.md) - Upgrading from older versions
- 💾 [Memory vs Speed Tradeoffs](docs/PERFORMANCE_GUIDE.md#memory-vs-speed-tradeoffs) - Making the right choices

## Installation

```bash
npm install @graphty/algorithms
```

## Quick Start

```typescript
import { Graph, breadthFirstSearch, dijkstra } from '@graphty/algorithms'

// Create a new graph
const graph = new Graph()

// Add nodes and edges
graph.addNode('A')
graph.addNode('B')
graph.addNode('C')
graph.addEdge('A', 'B', 1) // source, target, weight
graph.addEdge('B', 'C', 2)

// Basic graph operations
console.log(graph.nodeCount) // 3
console.log(graph.totalEdgeCount) // 2
console.log(graph.hasEdge('A', 'B')) // true

// Run algorithms
const traversal = breadthFirstSearch(graph, 'A')
console.log(traversal.order) // ['A', 'B', 'C']

const shortestPaths = dijkstra(graph, 'A')
// Get distance to C
const pathToC = shortestPaths.get('C')
console.log(pathToC?.distance) // 3
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
  directed: boolean // Default: false
  allowSelfLoops: boolean // Default: false
  allowParallelEdges: boolean // Default: false
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

// Get a copy of the graph configuration
graph.getConfig(): GraphConfig
```

### Traversal Algorithms

#### Breadth-First Search (BFS)

```typescript
import { breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS, isBipartite } from '@graphty/algorithms';

// Basic BFS traversal
const result = breadthFirstSearch(graph, startNode, {
  targetNode?: NodeId,     // Optional: stop when target is reached
  visitCallback?: (node: NodeId, level: number) => void
});
// Returns: TraversalResult { visited: Set<NodeId>, order: NodeId[], tree?: Map<NodeId, NodeId | null> }

// Note: For graphs with ≥10K nodes, BFS automatically uses:
// - Direction-Optimized BFS (switches between top-down/bottom-up)
// - CSR graph format for cache efficiency
// - Bit-packed data structures for memory efficiency

// Find shortest path between two nodes (unweighted)
const path = shortestPathBFS(graph, source, target);
// Returns: ShortestPathResult | null
// ShortestPathResult = { distance: number, path: NodeId[], predecessor: Map<NodeId, NodeId | null> }

// Find all shortest paths from a source
const paths = singleSourceShortestPathBFS(graph, source);
// Returns: Map<NodeId, ShortestPathResult>

// Check if graph is bipartite
const bipartite = isBipartite(graph);
// Returns: { isBipartite: boolean, coloring?: Map<NodeId, number> }
```

#### Depth-First Search (DFS)

```typescript
import { depthFirstSearch, topologicalSort, hasCycleDFS, findStronglyConnectedComponents } from '@graphty/algorithms';

// Basic DFS traversal
const result = depthFirstSearch(graph, startNode, {
  targetNode?: NodeId,      // Optional: stop when target is reached
  visitCallback?: (node: NodeId, level: number) => void,
  recursive?: boolean,      // Use recursive implementation (default: false)
  preOrder?: boolean        // Visit nodes in pre-order (default: true)
});
// Returns: TraversalResult

// Topological sort (for DAGs)
const sorted = topologicalSort(graph);
// Returns: NodeId[] | null (null if cycle detected)

// Cycle detection
const hasCycle = hasCycleDFS(graph);
// Returns: boolean

// Find strongly connected components using DFS
const sccs = findStronglyConnectedComponents(graph);
// Returns: NodeId[][]
```

### Shortest Path Algorithms

#### Dijkstra's Algorithm

```typescript
import {
  dijkstra,
  dijkstraPath,
  singleSourceShortestPath,
  allPairsShortestPath
} from '@graphty/algorithms'

// Single-source shortest paths
const result = dijkstra(graph, source, {
  target?: NodeId // Optional: stop when target is reached
})
// Returns: Map<NodeId, ShortestPathResult>
// ShortestPathResult = { distance: number, path: NodeId[], predecessor: Map<NodeId, NodeId | null> }

// Get specific path
const path = dijkstraPath(graph, source, target)
// Returns: ShortestPathResult | null

// All shortest paths from source
const paths = singleSourceShortestPath(graph, source)
// Returns: Map<NodeId, ShortestPathResult>

// All pairs shortest paths
const allPairs = allPairsShortestPath(graph)
// Returns: Map<NodeId, Map<NodeId, ShortestPathResult>>
```

#### Bellman-Ford Algorithm

```typescript
import {
  bellmanFord,
  bellmanFordPath,
  hasNegativeCycle
} from '@graphty/algorithms'

// Single-source shortest paths (handles negative weights)
const result = bellmanFord(graph, source)
// Returns: BellmanFordResult {
//   distances: Map<NodeId, number>,
//   predecessors: Map<NodeId, NodeId | null>,
//   hasNegativeCycle: boolean,
//   negativeCycleNodes?: Set<NodeId>
// }

// Get specific path
const path = bellmanFordPath(graph, source, target)
// Returns: ShortestPathResult | null

// Check for negative cycles
const result = hasNegativeCycle(graph)
// Returns: BellmanFordResult with hasNegativeCycle boolean
```

#### Floyd-Warshall Algorithm

```typescript
import {
  floydWarshall,
  floydWarshallPath,
  transitiveClosure
} from '@graphty/algorithms'

// All pairs shortest paths
const result = floydWarshall(graph)
// Returns: { distances: Map<NodeId, Map<NodeId, number>>, next: Map<NodeId, Map<NodeId, NodeId | null>> }

// Get specific path between any pair
const path = floydWarshallPath(result, source, target)
// Returns: NodeId[] | null

// Compute transitive closure
const closure = transitiveClosure(graph)
// Returns: Map<NodeId, Set<NodeId>>
```

### Centrality Algorithms

#### Degree Centrality

```typescript
import { degreeCentrality, nodeDegreeCentrality } from '@graphty/algorithms'

// Calculate for all nodes
const centralities = degreeCentrality(graph, {
  normalized: boolean, // Default: false
  weight: string // Optional: edge property for weighted degree
})
// Returns: CentralityResult (Record<string, number>)

// Calculate for single node
const centrality = nodeDegreeCentrality(graph, nodeId, { normalized: boolean })
// Returns: number
```

#### Betweenness Centrality

```typescript
import {
  betweennessCentrality,
  nodeBetweennessCentrality,
  edgeBetweennessCentrality
} from '@graphty/algorithms'

// Node betweenness for all nodes
const centralities = betweennessCentrality(graph, {
  normalized: boolean, // Default: false
  weight: string, // Optional: use weighted shortest paths
  endpoints: boolean // Default: false, include endpoints in paths
})
// Returns: CentralityResult (Record<string, number>)

// Single node betweenness
const centrality = nodeBetweennessCentrality(graph, nodeId, options)
// Returns: number

// Edge betweenness
const edgeCentralities = edgeBetweennessCentrality(graph, options)
// Returns: Map<string, number> (edge ID to centrality)
```

#### Closeness Centrality

```typescript
import {
  closenessCentrality,
  nodeClosenessCentrality,
  weightedClosenessCentrality
} from '@graphty/algorithms'

// Closeness for all nodes
const centralities = closenessCentrality(graph, {
  normalized: boolean // Default: false
})
// Returns: CentralityResult (Record<string, number>)

// Single node closeness
const centrality = nodeClosenessCentrality(graph, nodeId, {
  normalized: boolean
})
// Returns: number

// Weighted closeness
const centralities = weightedClosenessCentrality(graph, {
  normalized: boolean,
  weight: string // Edge property for weights
})
// Returns: CentralityResult (Record<string, number>)

// Single node weighted closeness
const centrality = nodeWeightedClosenessCentrality(graph, nodeId, {
  normalized: boolean,
  weight: string // Edge property for weights
})
// Returns: number
```

#### PageRank

```typescript
import {
  pageRank,
  personalizedPageRank,
  topPageRankNodes
} from '@graphty/algorithms'

// Standard PageRank
const result = pageRank(graph, {
  dampingFactor: number, // Default: 0.85
  maxIterations: number, // Default: 100
  tolerance: number, // Default: 1e-6
  initialRanks: Record<string, number>,
  personalization: Record<string, number>
})
// Returns: { ranks: Record<string, number>, iterations: number, converged: boolean }

// Personalized PageRank (with bias)
const ranks = personalizedPageRank(graph, personalization, options)
// personalization: Map<NodeId, number> - restart probabilities
// Returns: CentralityResult (Record<string, number>)

// Get top N nodes by PageRank
const topNodes = topPageRankNodes(graph, n, options)
// Returns: Array<{ node: NodeId, rank: number }>

// Alternative PageRank that returns CentralityResult format
const centralities = pageRankCentrality(graph, options)
// Returns: CentralityResult (Record<string, number>)
```

#### Eigenvector Centrality

```typescript
import {
  eigenvectorCentrality,
  nodeEigenvectorCentrality
} from '@graphty/algorithms'

// Calculate eigenvector centrality for all nodes
const centralities = eigenvectorCentrality(graph, {
  maxIterations: number, // Default: 100
  tolerance: number // Default: 1e-6
})
// Returns: CentralityResult (Record<string, number>)

// Single node eigenvector centrality
const centrality = nodeEigenvectorCentrality(graph, nodeId, options)
// Returns: number
```

#### Katz Centrality

```typescript
import { katzCentrality, nodeKatzCentrality } from '@graphty/algorithms'

// Calculate Katz centrality for all nodes
const centralities = katzCentrality(graph, {
  alpha: number, // Attenuation factor (default: 0.1)
  beta: number, // Weight for direct connections (default: 1.0)
  maxIterations: number, // Default: 100
  tolerance: number, // Default: 1e-6
  normalized: boolean // Default: true
})
// Returns: CentralityResult (Record<string, number>)

// Single node Katz centrality
const centrality = nodeKatzCentrality(graph, nodeId, options)
// Returns: number
```

#### HITS Algorithm

```typescript
import { hits, nodeHITS } from '@graphty/algorithms'

// Calculate hub and authority scores
const result = hits(graph, {
  maxIterations: number, // Default: 100
  tolerance: number // Default: 1e-6
})
// Returns: HITSResult { hubs: CentralityResult, authorities: CentralityResult }

// Single node HITS scores
const scores = nodeHITS(graph, nodeId, options)
// Returns: { hub: number, authority: number }
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
} from '@graphty/algorithms'

// Find all components
const components = connectedComponents(graph)
// Returns: NodeId[][] (array of component arrays)

// Check if graph is connected
const connected = isConnected(graph)
// Returns: boolean

// Count components
const count = numberOfConnectedComponents(graph)
// Returns: number

// Get largest component
const largest = largestConnectedComponent(graph)
// Returns: NodeId[]

// Get component containing a specific node
const component = getConnectedComponent(graph, nodeId)
// Returns: Set<NodeId>
```

#### Strongly Connected Components

```typescript
import {
  stronglyConnectedComponents,
  findStronglyConnectedComponents,
  isStronglyConnected,
  condensationGraph
} from '@graphty/algorithms'

// Find SCCs using Tarjan's algorithm
const sccs = stronglyConnectedComponents(graph)
// Returns: ComponentResult

// Alternative: using DFS
const sccs = findStronglyConnectedComponents(graph)
// Returns: NodeId[][]

// Check if directed graph is strongly connected
const stronglyConnected = isStronglyConnected(graph)
// Returns: boolean

// Create condensation graph (DAG of SCCs)
const condensation = condensationGraph(graph)
// Returns: { graph: Graph, componentMap: Map<NodeId, number> }

// Alternative DFS-based connected components
const components = connectedComponentsDFS(graph)
// Returns: ComponentResult
```

#### Weakly Connected Components

```typescript
import {
  weaklyConnectedComponents,
  isWeaklyConnected
} from '@graphty/algorithms'

// Find WCCs (ignoring edge direction)
const wccs = weaklyConnectedComponents(graph)
// Returns: ComponentResult

// Check if directed graph is weakly connected
const weaklyConnected = isWeaklyConnected(graph)
// Returns: boolean
```

### Data Structures

#### Priority Queue

Min-heap implementation used internally by algorithms.

```typescript
import { PriorityQueue } from '@graphty/algorithms'

const pq = new PriorityQueue<T>((a, b) => a.priority - b.priority)

pq.enqueue(item)
pq.dequeue()
pq.peek()
pq.isEmpty()
pq.size
pq.clear()
```

#### Union-Find (Disjoint Set)

Efficient data structure for tracking connected components.

```typescript
import { UnionFind } from '@graphty/algorithms'

const uf = new UnionFind<T>()

uf.makeSet(item)
uf.find(item)
uf.union(item1, item2)
uf.connected(item1, item2)
uf.getSetSize(item)
uf.numberOfSets
```

### Minimum Spanning Tree Algorithms

#### Kruskal's Algorithm

```typescript
import { kruskalMST, minimumSpanningTree } from '@graphty/algorithms'

// Find MST using Kruskal's algorithm
const mst = kruskalMST(graph)
// Returns: { edges: Edge[], weight: number }

// Alternative alias
const mst = minimumSpanningTree(graph)
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
import { louvain } from '@graphty/algorithms'

// Detect communities using Louvain method
const communities = louvain(graph, {
  resolution: number, // Default: 1.0
  randomSeed: number
})
// Returns: { communities: Map<NodeId, number>, modularity: number }
```

#### Leiden Algorithm

```typescript
import { leiden } from '@graphty/algorithms'

// Improved community detection
const communities = leiden(graph, {
  resolution: number, // Default: 1.0
  iterations: number, // Default: 10
  randomSeed: number
})
// Returns: { communities: Map<NodeId, number>, modularity: number }
```

#### Label Propagation

```typescript
import {
  labelPropagation,
  labelPropagationAsync,
  labelPropagationSemiSupervised
} from '@graphty/algorithms'

// Basic label propagation
const labels = labelPropagation(graph, {
  maxIterations: number // Default: 100
})
// Returns: Map<NodeId, number>

// Asynchronous version
const labels = labelPropagationAsync(graph, options)

// Semi-supervised with seed communities
const labels = labelPropagationSemiSupervised(graph, seedLabels, options)
```

#### Girvan-Newman Algorithm

```typescript
import { girvanNewman } from '@graphty/algorithms'

// Edge betweenness based community detection
const dendrogram = girvanNewman(graph, {
  targetCommunities: number // Stop at this many communities
})
// Returns: { levels: Array<{ modularity: number, communities: NodeId[][] }> }
```

### Pathfinding Algorithms

#### A\* Algorithm

```typescript
import { astar } from '@graphty/algorithms'

// A* pathfinding with heuristic
const path = astar(
  graph, // Map<T, Map<T, number>> adjacency list
  start,
  goal,
  heuristic // (node: T, goal: T) => number
)
// Returns: { path: T[], cost: number } | null
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

// Create bipartite flow network
const flowNetwork = createBipartiteFlowNetwork(leftNodes, rightNodes, edges, capacities?);
// Returns: FlowNetwork
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
import {
  hierarchicalClustering,
  cutDendrogram,
  cutDendrogramKClusters
} from '@graphty/algorithms'

// Agglomerative clustering
const result = hierarchicalClustering(graph, linkage)
// graph: Map<NodeId, Set<NodeId>>
// linkage: 'single' | 'complete' | 'average' | 'ward' (default: 'single')
// Returns: HierarchicalClusteringResult { root: ClusterNode, dendrogram: ClusterNode[], clusters: Map<number, Set<NodeId>[]> }

// Cut at specific height
const clusters = cutDendrogram(result.root, height)
// Returns: Set<NodeId>[]

// Get exactly k clusters
const clusters = cutDendrogramKClusters(result.root, k)
// Returns: Set<NodeId>[]
```

#### K-Core Decomposition

```typescript
import {
  kCoreDecomposition,
  getKCore,
  kTruss,
  degeneracyOrdering
} from '@graphty/algorithms'

// Find all k-cores
const result = kCoreDecomposition(graph)
// graph: Map<NodeId, Set<NodeId>>
// Returns: KCoreResult { cores: Map<number, Set<NodeId>>, coreness: Map<NodeId, number>, maxCore: number }

// Extract specific k-core subgraph
const kCore = getKCore(graph, k)
// Returns: Set<NodeId>

// Find k-truss (triangular cores)
const truss = kTruss(graph, k)
// Returns: Set<string> (edge strings)

// Degeneracy ordering
const ordering = degeneracyOrdering(graph)
// Returns: NodeId[]
```

#### Spectral Clustering

```typescript
import { spectralClustering } from '@graphty/algorithms'

// Spectral clustering using graph Laplacian
const result = spectralClustering(graph, {
  k: number, // Number of clusters
  laplacianType: 'unnormalized' | 'normalized' | 'randomWalk', // Default: 'normalized'
  maxIterations: number, // Default: 100
  tolerance: number // Default: 1e-4
})
// Returns: SpectralClusteringResult { communities: NodeId[][], clusterAssignments: Map<NodeId, number> }
```

#### Markov Clustering (MCL)

```typescript
import { markovClustering, calculateMCLModularity } from '@graphty/algorithms'

// MCL algorithm for network clustering
const result = markovClustering(graph, {
  expansion: number, // Expansion parameter (default: 2)
  inflation: number, // Inflation parameter (default: 2)
  maxIterations: number, // Default: 100
  tolerance: number // Default: 1e-6
})
// Returns: MCLResult { communities: NodeId[][], attractors: Set<NodeId>, iterations: number, converged: boolean }

// Calculate modularity of MCL clustering result
const modularity = calculateMCLModularity(graph, result.communities)
// Returns: number
```

### Matching Algorithms

#### Bipartite Matching

```typescript
import {
  maximumBipartiteMatching,
  greedyBipartiteMatching,
  bipartitePartition
} from '@graphty/algorithms'

// Maximum bipartite matching (Hungarian algorithm)
const matching = maximumBipartiteMatching(graph, {
  leftNodes: Set<NodeId>, // Optional: specify left partition
  rightNodes: Set<NodeId> // Optional: specify right partition
})
// Returns: BipartiteMatchingResult { matching: Map<NodeId, NodeId>, size: number }

// Greedy bipartite matching (faster, approximate)
const matching = greedyBipartiteMatching(graph, options)

// Partition graph into bipartite sets
const partition = bipartitePartition(graph)
// Returns: { left: Set<NodeId>, right: Set<NodeId> } | null
```

#### Graph Isomorphism

```typescript
import { isGraphIsomorphic, findAllIsomorphisms } from '@graphty/algorithms'

// Check if two graphs are isomorphic
const result = isGraphIsomorphic(graph1, graph2, {
  nodeMatch: (node1: NodeId, node2: NodeId, g1: Graph, g2: Graph) => boolean,
  edgeMatch: (
    edge1: [NodeId, NodeId],
    edge2: [NodeId, NodeId],
    g1: Graph,
    g2: Graph
  ) => boolean,
  findAllMappings: boolean // Find all possible isomorphisms
})
// Returns: IsomorphismResult { isIsomorphic: boolean, mapping?: Map<NodeId, NodeId> }

// Find all isomorphism mappings
const mappings = findAllIsomorphisms(graph1, graph2, options)
// Returns: Array<Map<NodeId, NodeId>>
```

### Link Prediction Algorithms

#### Common Neighbors

```typescript
import {
  commonNeighborsScore,
  commonNeighborsPrediction,
  commonNeighborsForPairs
} from '@graphty/algorithms'

// Score for a specific pair
const score = commonNeighborsScore(graph, node1, node2)
// Returns: number

// Predict links for all non-connected pairs
const predictions = commonNeighborsPrediction(graph, {
  directed: boolean, // Consider direction
  includeExisting: boolean, // Include existing edges
  topK: number // Return only top K predictions
})
// Returns: LinkPredictionScore[]

// Score multiple specific pairs
const scores = commonNeighborsForPairs(graph, pairs, options)
// Returns: LinkPredictionScore[]

// Evaluate prediction performance
const evaluation = evaluateCommonNeighbors(graph, testEdges)
// Returns: { precision, recall, f1Score }

// Get top candidates for a node
const candidates = getTopCandidatesForNode(graph, nodeId, { topK: number })
// Returns: LinkPredictionScore[]
```

#### Adamic-Adar Index

```typescript
import {
  adamicAdarScore,
  adamicAdarPrediction,
  adamicAdarForPairs
} from '@graphty/algorithms'

// Adamic-Adar score for a pair (weighted by neighbor degrees)
const score = adamicAdarScore(graph, node1, node2)
// Returns: number

// Predict links using Adamic-Adar
const predictions = adamicAdarPrediction(graph, {
  directed: boolean,
  includeExisting: boolean,
  topK: number
})
// Returns: LinkPredictionScore[]

// Score multiple pairs
const scores = adamicAdarForPairs(graph, pairs, options)
// Returns: LinkPredictionScore[]

// Compare Adamic-Adar with Common Neighbors
const comparison = compareAdamicAdarWithCommonNeighbors(graph, pairs)
// Returns: Array<{ source, target, adamicAdar, commonNeighbors }>

// Evaluate prediction performance
const evaluation = evaluateAdamicAdar(graph, testEdges)
// Returns: { precision, recall, f1Score }

// Get top candidates for a node
const candidates = getTopAdamicAdarCandidatesForNode(graph, nodeId, {
  topK: number
})
// Returns: LinkPredictionScore[]
```

### Research Algorithms (2023-2025)

Cutting-edge graph algorithms based on recent research.

#### SynC - Synergistic Deep Graph Clustering

```typescript
import { syncClustering } from '@graphty/algorithms'

// Deep learning based clustering
const result = syncClustering(graph, {
  k: number, // Number of clusters
  maxIterations: number, // Default: 100
  learningRate: number, // Default: 0.01
  hiddenDim: number, // Default: 64
  randomSeed: number
})
// Returns: SynCResult {
//   communities: NodeId[][],
//   clusterAssignments: Map<NodeId, number>,
//   embeddings: Map<NodeId, number[]>,
//   iterations: number,
//   converged: boolean
// }
```

#### TeraHAC - Scalable Hierarchical Agglomerative Clustering

```typescript
import { teraHAC } from '@graphty/algorithms'

// Scalable hierarchical clustering
const result = teraHAC(graph, {
  linkage: 'single' | 'complete' | 'average', // Default: 'average'
  k: number, // Target number of clusters
  threshold: number, // Distance threshold for merging
  sampleSize: number, // Default: 1000
  randomSeed: number
})
// Returns: TeraHACResult {
//   root: TeraHACClusterNode,
//   dendrogram: TeraHACClusterNode[],
//   clusters: NodeId[][],
//   mergeDistances: number[]
// }
```

#### GRSBM - Greedy Recursive Spectral Bisection with Modularity

```typescript
import { grsbm } from '@graphty/algorithms'

// Explainable community detection
const result = grsbm(graph, {
  minClusterSize: number, // Default: 5
  maxDepth: number, // Default: 10
  modularityThreshold: number, // Default: 0.1
  explainClusters: boolean // Default: true
})
// Returns: GRSBMResult {
//   clusters: GRSBMCluster[],   // Each cluster has id, nodes, modularity, explanation
//   hierarchy: Map<number, number[]>,
//   totalModularity: number
// }
```

## Algorithm Categories Summary

### Available Algorithms by Category:

- **Traversal**: BFS, DFS, Topological Sort, Cycle Detection, Bipartite Check
- **Shortest Path**: Dijkstra, Bellman-Ford, Floyd-Warshall, A\*
- **Centrality**: Degree, Betweenness, Closeness, PageRank, Eigenvector, Katz, HITS
- **Components**: Connected, Strongly Connected, Weakly Connected, Condensation Graph
- **Community Detection**: Louvain, Leiden, Label Propagation, Girvan-Newman
- **Clustering**: Hierarchical, K-Core, Spectral, Markov (MCL)
- **Minimum Spanning Tree**: Kruskal, Prim
- **Network Flow**: Ford-Fulkerson, Edmonds-Karp, Min-Cut (Stoer-Wagner, Karger)
- **Matching**: Bipartite Matching, Graph Isomorphism
- **Link Prediction**: Common Neighbors, Adamic-Adar
- **Research Algorithms**: SynC, TeraHAC, GRSBM

## Interactive Examples

Try out all algorithms with interactive visualizations: **[Live Demo →](https://graphty-org.github.io/algorithms/)**

The library includes comprehensive examples demonstrating each algorithm. You can:

- **[Browse Interactive HTML Examples](https://graphty-org.github.io/algorithms/examples/)** - Visual demonstrations with step-by-step execution
- **[View Performance Benchmarks](https://graphty-org.github.io/algorithms/benchmarks/)** - Comparative analysis of algorithm performance
- **[Explore Code Examples](https://github.com/graphty-org/algorithms/tree/main/examples)** - Implementation examples for each algorithm

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
- [Eigenvector Centrality](https://github.com/graphty-org/algorithms/blob/main/examples/eigenvector-centrality-example.js) - Influence from important nodes
- [Katz Centrality](https://github.com/graphty-org/algorithms/blob/main/examples/katz-centrality-example.js) - Weighted path counting
- [HITS Algorithm](https://github.com/graphty-org/algorithms/blob/main/examples/hits-algorithm-example.js) - Hub and authority scores

### Graph Structure

- [Connected Components](https://github.com/graphty-org/algorithms/blob/main/examples/connected-components-example.js) - Find graph components
- [Kruskal's MST](https://github.com/graphty-org/algorithms/blob/main/examples/kruskal-example.js) - Minimum spanning tree
- [Prim's MST](https://github.com/graphty-org/algorithms/blob/main/examples/prim-example.js) - Alternative MST algorithm

### Community Detection

- [Louvain Method](https://github.com/graphty-org/algorithms/blob/main/examples/louvain-example.js) - Modularity-based communities
- [Leiden Algorithm](https://github.com/graphty-org/algorithms/blob/main/examples/leiden-community.ts) - Improved Louvain
- [Label Propagation](https://github.com/graphty-org/algorithms/blob/main/examples/label-propagation.ts) - Fast community detection
- [Girvan-Newman](https://github.com/graphty-org/algorithms/blob/main/examples/girvan-newman-example.js) - Hierarchical communities

### Clustering

- [Hierarchical Clustering](https://github.com/graphty-org/algorithms/blob/main/examples/hierarchical-clustering.ts) - Graph clustering
- [K-Core Decomposition](https://github.com/graphty-org/algorithms/blob/main/examples/k-core-decomposition.ts) - Core analysis
- [Spectral Clustering](https://github.com/graphty-org/algorithms/blob/main/examples/spectral-clustering-example.js) - Eigenvalue-based clustering
- [MCL Clustering](https://github.com/graphty-org/algorithms/blob/main/examples/mcl-clustering-example.js) - Markov clustering

### Matching

- [Bipartite Matching](https://github.com/graphty-org/algorithms/blob/main/examples/bipartite-matching-example.js) - Job assignment, dating apps
- [Graph Isomorphism](https://github.com/graphty-org/algorithms/blob/main/examples/graph-isomorphism-example.js) - Structural equivalence

### Link Prediction

- [Common Neighbors](https://github.com/graphty-org/algorithms/blob/main/examples/common-neighbors-example.js) - Friend suggestions
- [Adamic-Adar](https://github.com/graphty-org/algorithms/blob/main/examples/adamic-adar-example.js) - Weighted predictions

### Advanced Algorithms

- [A\* Pathfinding](https://github.com/graphty-org/algorithms/blob/main/examples/astar-pathfinding.ts) - Heuristic pathfinding
- [Flow Algorithms](https://github.com/graphty-org/algorithms/blob/main/examples/flow-algorithms.ts) - Maximum flow and applications
- [Ford-Fulkerson Flow](https://github.com/graphty-org/algorithms/blob/main/examples/ford-fulkerson-flow.ts) - Maximum flow implementation
- [Minimum Cut](https://github.com/graphty-org/algorithms/blob/main/examples/min-cut.ts) - Graph partitioning

### Research Algorithms

- [SynC Clustering](https://github.com/graphty-org/algorithms/blob/main/examples/sync-example.js) - Deep learning based clustering
- [TeraHAC](https://github.com/graphty-org/algorithms/blob/main/examples/terahac-example.js) - Scalable hierarchical clustering
- [GRSBM](https://github.com/graphty-org/algorithms/blob/main/examples/grsbm-example.js) - Explainable community detection

## Advanced Usage Examples

### Working with Weighted Graphs

```typescript
const graph = new Graph()

// Add weighted edges
graph.addEdge('A', 'B', 5)
graph.addEdge('B', 'C', 3)
graph.addEdge('A', 'C', 10)

// Find shortest path considering weights
const result = dijkstra(graph, 'A')
const pathToC = dijkstraPath(graph, 'A', 'C')
console.log(pathToC) // { path: ['A', 'B', 'C'], distance: 8 }
```

### Directed Graphs

```typescript
const directedGraph = new Graph({ directed: true })

directedGraph.addEdge('A', 'B')
directedGraph.addEdge('B', 'C')
directedGraph.addEdge('C', 'A')

// Check for cycles
console.log(hasCycleDFS(directedGraph)) // true

// Find strongly connected components
const sccs = stronglyConnectedComponents(directedGraph)
console.log(sccs.components) // [['A', 'B', 'C']]
```

### Network Analysis

```typescript
// Identify important nodes
const graph = createSocialNetwork() // Your graph

// Find influencers (high PageRank)
const influencers = topPageRankNodes(graph, 10)

// Find bridges (high betweenness)
const bridgers = Array.from(betweennessCentrality(graph).entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)

// Find communities (connected components)
const communities = connectedComponents(graph)
console.log(`Found ${communities.components.length} communities`)
```

### Custom Edge Properties

```typescript
const graph = new Graph()

// Add edges with custom data
graph.addEdge('A', 'B', 1, {
  type: 'road',
  distance: 100,
  traffic: 'heavy'
})

// Use custom weight in algorithms
const result = dijkstra(graph, 'A', {
  weightKey: 'distance' // Use 'distance' property as weight
})
```

### Graph Visualization Preparation

```typescript
// Prepare data for visualization
const graph = loadGraph()

// Calculate layout metrics
const centralities = degreeCentrality(graph, { normalized: true })
const ranks = pageRank(graph)

// Export for visualization
const nodes = Array.from(graph.nodes()).map(node => ({
  id: node.id,
  data: node.data,
  size: centralities.get(node.id) || 0,
  importance: ranks.get(node.id) || 0
}))

const edges = Array.from(graph.edges()).map(edge => ({
  source: edge.source,
  target: edge.target,
  weight: edge.weight || 1,
  data: edge.data
}))
```

## Type Definitions

### Core Types

```typescript
type NodeId = string | number

interface Node {
  id: NodeId
  data?: Record<string, unknown>
}

interface Edge {
  source: NodeId
  target: NodeId
  weight?: number
  id?: string
  data?: Record<string, unknown>
}
```

### Algorithm Result Types

```typescript
interface TraversalResult {
  visited: Set<NodeId>
  order: NodeId[]
  tree?: Map<NodeId, NodeId | null>
}

interface ShortestPathResult {
  distance: number
  path: NodeId[]
  predecessor: Map<NodeId, NodeId | null>
}

interface BellmanFordResult {
  distances: Map<NodeId, number>
  previous: Map<NodeId, NodeId | null>
  hasNegativeCycle: boolean
  negativeCycleNodes?: NodeId[]
}

type CentralityResult = Record<string, number>

interface PageRankResult {
  ranks: Record<string, number>
  iterations: number
  converged: boolean
}

interface CommunityResult {
  communities: Map<NodeId, number>
  modularity: number
}

interface ComponentResult {
  components: NodeId[][]
  componentMap: Map<NodeId, number>
}

interface HITSResult {
  hubs: CentralityResult
  authorities: CentralityResult
}

interface SpectralClusteringResult {
  communities: NodeId[][]
  clusterAssignments: Map<NodeId, number>
}

interface MCLResult {
  communities: NodeId[][]
  attractors: Set<NodeId>
  iterations: number
  converged: boolean
}

interface BipartiteMatchingResult {
  matching: Map<NodeId, NodeId>
  size: number
}

interface LinkPredictionScore {
  source: NodeId
  target: NodeId
  score: number
}

interface HierarchicalClusteringResult<T> {
  root: ClusterNode<T>
  dendrogram: ClusterNode<T>[]
  clusters: Map<number, Set<T>[]>
}

interface KCoreResult<T> {
  cores: Map<number, Set<T>>
  coreness: Map<T, number>
  maxCore: number
}

interface IsomorphismResult {
  isIsomorphic: boolean
  mapping?: Map<NodeId, NodeId>
}

interface SynCResult {
  communities: NodeId[][]
  clusterAssignments: Map<NodeId, number>
  embeddings: Map<NodeId, number[]>
  iterations: number
  converged: boolean
}

interface TeraHACResult {
  root: TeraHACClusterNode
  dendrogram: TeraHACClusterNode[]
  clusters: NodeId[][]
  mergeDistances: number[]
}

interface GRSBMResult {
  clusters: GRSBMCluster[]
  hierarchy: Map<number, number[]>
  totalModularity: number
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
  - A\*: O((V + E) log V) - depends on heuristic quality
  - Ford-Fulkerson: O(E \* f) where f is max flow
  - Edmonds-Karp: O(VE²)
  - Louvain/Leiden: O(n log n) average case
  - Hierarchical Clustering: O(n² log n)
  - SynC: O(kni) where k is clusters, n is nodes, i is iterations
  - TeraHAC: O(n log n) with sampling
  - GRSBM: O(m log n) where m is edges
- **Memory Usage**: O(V + E) for graph storage
- **Browser Optimization**: Algorithms use iterative approaches where possible to avoid stack overflow
- **Performance Benchmarks**: View detailed performance comparisons at [https://graphty-org.github.io/algorithms/benchmarks/](https://graphty-org.github.io/algorithms/benchmarks/)

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

# Benchmarking
npm run benchmark    # Run full benchmark suite
npm run benchmark:quick # Run quick benchmark
npm run benchmark:report # Generate performance report

# HTML Examples & Documentation
npm run examples:html # Run interactive HTML examples locally
npm run build:gh-pages # Build for GitHub Pages deployment
npm run examples:run # Run all code examples

# Git
npm run commit       # Conventional commit helper
```

### Development Server

The project includes interactive HTML examples demonstrating each algorithm. To run them locally:

1. **Copy the environment configuration:**

   ```bash
   cp .env.example .env
   ```

2. **Configure the server (optional):**
   Edit `.env` to set your preferred host and port:

   ```bash
   # Server host (defaults to true for network exposure)
   HOST=localhost       # For local-only access
   # HOST=0.0.0.0       # For network access
   # HOST=my.server.com # Custom domain

   # Server port (defaults to 9000)
   PORT=9000           # Must be between 9000-9099
   ```

3. **Start the development server:**

   ```bash
   npm run examples:html
   ```

4. **Open your browser** to `http://localhost:9000` (or your configured host/port)

The HTML examples provide:

- Interactive visualizations for each algorithm
- Step-by-step execution with play/pause controls
- Multiple graph types for testing
- Real-time parameter adjustment
- Educational information about complexity and use cases
- Mobile debugging console (Eruda) for testing on mobile devices

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

examples/
├── html/             # Interactive HTML examples
│   ├── shared/       # Shared utilities and styles
│   └── algorithms/   # Algorithm-specific examples

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
