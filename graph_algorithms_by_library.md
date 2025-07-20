# Graph Algorithms by Library

## 1. NetworkX
NetworkX offers one of the most comprehensive collections of graph algorithms:

### Community Detection
- Bipartitions
- Divisive Communities
- K-Clique
- Modularity-based communities
- Tree Partitioning
- Label Propagation
- Louvain
- Leiden
- Fluid Communities
- Local Community Detection

### Centrality Measures
- Degree Centrality
- Eigenvector Centrality
- Closeness Centrality
- Current Flow Closeness Centrality
- Betweenness Centrality
- Current Flow Betweenness Centrality
- Communicability Betweenness Centrality
- Group Centrality
- Load Centrality
- Subgraph Centrality
- Harmonic Centrality
- Dispersion
- Reaching Centrality
- Percolation Centrality
- Second Order Centrality
- Trophic Centrality
- VoteRank
- Laplacian Centrality

### Path Finding Algorithms
- Shortest Paths (single source, all pairs)
- Dijkstra's Algorithm
- Bellman-Ford Algorithm
- All Shortest Paths
- Simple Paths
- Depth First Search (DFS)
- Breadth First Search (BFS)

### Clustering Algorithms
- Clustering Coefficient
- Transitivity
- Triangles
- Squares
- Generalized Degree

### Connectivity Algorithms
- Flow-based Connectivity
- Disjoint Paths
- Connected Components
- Strongly Connected Components
- Weakly Connected Components
- Biconnected Components
- Articulation Points
- Bridges

### Matching Algorithms
- Maximum Matching
- Maximum Weight Matching
- Maximal Matching

### Flow Algorithms
- Maximum Flow
- Minimum Cost Flow
- Network Simplex

### Approximation Algorithms
- Vertex Cover
- Dominating Set
- Clique
- Max Cut
- Traveling Salesman Problem
- Steiner Tree
- Treewidth

### Other Algorithms
- Graph Coloring
- Planarity Testing
- Isomorphism Testing
- Cycle Detection
- Link Prediction
- Similarity Measures
- Tree Recognition
- Tournament Analysis
- Vitality Measures

## 2. Cytoscape.js
Cytoscape.js provides essential graph algorithms with a focus on web-based visualization:

### Core Algorithms
- Breadth-First Search (BFS)
- Dijkstra's Shortest Path
- PageRank
- Degree Centrality
- Neighborhood Traversal

### Clustering Algorithms (v3.3.0+)
- Markov Clustering
- K-means
- K-medoids
- Fuzzy C-means
- Hierarchical Clustering
- Affinity Propagation

### Layout Algorithms
- CoSE (Compound Spring Embedder)
- COSE-Bilkent (enhanced version)
- fCoSE (fast Compound Spring Embedder)

## 3. igraph
igraph offers comprehensive network analysis tools across multiple programming languages:

### Community Detection
- Leiden Algorithm
- Louvain Algorithm
- Edge Betweenness (Girvan-Newman)
- Leading Eigenvector
- Walktrap
- Fast Greedy
- Spinglass
- Optimal Modularity
- Fluid Communities
- Label Propagation
- Infomap

### Centrality Measures
- Betweenness Centrality
- Degree Centrality
- Closeness Centrality
- Eigenvector Centrality

### Path Finding
- Shortest Paths
- All Pairs Shortest Paths

### Clustering
- Clustering Coefficient
- Transitivity

### Other Algorithms
- Connected Components
- Graph Generation
- Random Walks
- Spanning Trees

## 4. Gephi
Gephi focuses on essential network metrics for visual analysis:

### Centrality Measures
- Degree Centrality
- Betweenness Centrality
- Closeness Centrality

### Network Metrics
- Network Density
- Path Length
- Network Diameter
- HITS Algorithm
- Modularity
- Clustering Coefficient

## 5. Boost Graph Library (BGL)
BGL provides fundamental graph algorithms with C++ performance:

### Path Finding
- Dijkstra's Shortest Paths
- Bellman-Ford Shortest Paths
- Johnson's All-Pairs Shortest Paths

### Graph Traversal
- Breadth First Search
- Depth First Search
- Uniform Cost Search

### Minimum Spanning Tree
- Kruskal's Algorithm
- Prim's Algorithm

### Connectivity
- Connected Components
- Strongly Connected Components
- Dynamic Connected Components (Disjoint Sets)

### Other Algorithms
- Topological Sort
- Transpose
- Reverse Cuthill McKee Ordering
- Smallest Last Vertex Ordering
- Sequential Vertex Coloring

## 6. TigerGraph
TigerGraph offers extensive graph algorithms optimized for large-scale graph databases:

### Centrality Algorithms
- Approximate Closeness Centrality
- ArticleRank
- Betweenness Centrality
- Closeness Centrality
- Degree Centrality
- Eigenvector Centrality
- Harmonic Centrality
- Influence Maximization
- PageRank
- Personalized PageRank
- Weighted Degree Centrality
- Weighted PageRank

### Community Detection
- Weakly Connected Components
- k-Core Decomposition
- k-Means Clustering
- Label Propagation
- Speaker-Listener Label Propagation
- Local Clustering Coefficient
- Louvain
- Strongly Connected Components
- Triangle Counting

### Path Finding
- A* Algorithm
- All-Pairs Shortest Path
- All Paths (Single-Pair)
- Breadth-First Search
- Cycle Detection
- Cycle Component
- Estimated Diameter
- Maximum Flow
- Minimum Spanning Forest/Tree
- Single-source Shortest Path (weighted/unweighted)

### Classification
- Greedy Graph Coloring
- k-Nearest Neighbors (single, batch, cross-validation)
- Maximal Independent Set
- Weisfeiler-Lehman Isomorphism

### Similarity Algorithms
- Cosine Similarity of Neighborhoods
- Jaccard Similarity of Neighborhoods

### Link Prediction
- Adamic Adar
- Common Neighbors
- Preferential Attachment
- Resource Allocation
- Same Community
- Total Neighbors

### Node Embedding
- Fast Random Projection
- NodePiece Models