/**
 * Algorithm complexity configuration for adaptive benchmark sizing
 */

export enum ComplexityClass {
  LINEAR = 'LINEAR',           // O(V) or O(E)
  LINEARITHMIC = 'LINEARITHMIC', // O(V log V) or O(E log E)
  QUADRATIC = 'QUADRATIC',     // O(V²) or O(VE)
  CUBIC = 'CUBIC',             // O(V³) or O(V²E)
  EXPONENTIAL = 'EXPONENTIAL'  // O(2^V) or worse
}

export interface AlgorithmConfig {
  name: string;
  complexity: ComplexityClass;
  quickSizes: number[];        // Graph sizes for quick mode
  comprehensiveSizes: number[]; // Graph sizes for comprehensive mode
  edgeDensity?: number;        // Edge density factor (0.1 = sparse, 0.5 = medium, 0.9 = dense)
  maxIterations?: number;      // Max iterations for iterative algorithms
}

// Algorithm configurations with appropriate test sizes
export const algorithmConfigs: Record<string, AlgorithmConfig> = {
  // Linear complexity - can handle large graphs
  'BFS': {
    name: 'BFS',
    complexity: ComplexityClass.LINEAR,
    quickSizes: [100, 250, 500],
    comprehensiveSizes: [100, 500, 1000, 5000, 10000],
    edgeDensity: 0.1
  },
  'DFS': {
    name: 'DFS', 
    complexity: ComplexityClass.LINEAR,
    quickSizes: [100, 250, 500],
    comprehensiveSizes: [100, 500, 1000, 5000, 10000],
    edgeDensity: 0.1
  },
  'Connected Components': {
    name: 'Connected Components',
    complexity: ComplexityClass.LINEAR,
    quickSizes: [100, 250, 500],
    comprehensiveSizes: [100, 500, 1000, 5000, 10000],
    edgeDensity: 0.1
  },
  'Degree Centrality': {
    name: 'Degree Centrality',
    complexity: ComplexityClass.LINEAR,
    quickSizes: [100, 250, 500],
    comprehensiveSizes: [100, 500, 1000, 5000, 10000],
    edgeDensity: 0.2
  },

  // Linearithmic complexity - moderate sizes
  'Dijkstra': {
    name: 'Dijkstra',
    complexity: ComplexityClass.LINEARITHMIC,
    quickSizes: [50, 100, 200],
    comprehensiveSizes: [50, 100, 500, 1000, 5000],
    edgeDensity: 0.2
  },
  'Kruskal MST': {
    name: 'Kruskal MST',
    complexity: ComplexityClass.LINEARITHMIC,
    quickSizes: [50, 100, 200],
    comprehensiveSizes: [50, 100, 500, 1000, 5000],
    edgeDensity: 0.3
  },
  'Bellman-Ford': {
    name: 'Bellman-Ford',
    complexity: ComplexityClass.LINEARITHMIC,
    quickSizes: [50, 100, 150],
    comprehensiveSizes: [50, 100, 200, 500, 1000],
    edgeDensity: 0.2
  },

  // Quadratic complexity - smaller graphs
  'PageRank': {
    name: 'PageRank',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 50, 100],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2,
    maxIterations: 10
  },
  'HITS': {
    name: 'HITS',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 50, 80],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2,
    maxIterations: 10
  },
  'Closeness Centrality': {
    name: 'Closeness Centrality',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 40, 60],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2
  },
  'Betweenness Centrality': {
    name: 'Betweenness Centrality',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [10, 20, 50],
    comprehensiveSizes: [10, 20, 50, 100, 200],
    edgeDensity: 0.2
  },
  'Eigenvector Centrality': {
    name: 'Eigenvector Centrality',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 50, 80],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2,
    maxIterations: 10
  },
  'Katz Centrality': {
    name: 'Katz Centrality',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 50, 80],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2,
    maxIterations: 10
  },
  'K-Core': {
    name: 'K-Core',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [50, 100, 150],
    comprehensiveSizes: [50, 100, 200, 500, 1000],
    edgeDensity: 0.3
  },
  'Leiden': {
    name: 'Leiden',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 40, 60],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2,
    maxIterations: 5
  },
  'Bipartite Matching': {
    name: 'Bipartite Matching',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 40, 60],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2
  },
  'Common Neighbors': {
    name: 'Common Neighbors',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 40, 60],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2
  },
  'Adamic-Adar': {
    name: 'Adamic-Adar',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [20, 40, 60],
    comprehensiveSizes: [20, 50, 100, 200, 500],
    edgeDensity: 0.2
  },
  'Min-Cut': {
    name: 'Min-Cut',
    complexity: ComplexityClass.QUADRATIC,
    quickSizes: [10, 20, 30],
    comprehensiveSizes: [10, 20, 50, 100, 200],
    edgeDensity: 0.3
  },

  // Cubic complexity - very small graphs
  'Floyd-Warshall': {
    name: 'Floyd-Warshall',
    complexity: ComplexityClass.CUBIC,
    quickSizes: [5, 10, 12],
    comprehensiveSizes: [5, 10, 15, 20, 30],
    edgeDensity: 0.3
  },
  'MCL': {
    name: 'MCL',
    complexity: ComplexityClass.CUBIC,
    quickSizes: [10, 12, 15],
    comprehensiveSizes: [10, 15, 20, 30, 40],
    edgeDensity: 0.3,
    maxIterations: 3
  },
  'Hierarchical Clustering': {
    name: 'Hierarchical Clustering',
    complexity: ComplexityClass.CUBIC,
    quickSizes: [5, 8, 10],
    comprehensiveSizes: [5, 10, 15, 20, 30],
    edgeDensity: 0.4
  },
  'Girvan-Newman': {
    name: 'Girvan-Newman',
    complexity: ComplexityClass.CUBIC,
    quickSizes: [5, 8, 10],
    comprehensiveSizes: [5, 10, 15, 20, 25],
    edgeDensity: 0.3
  }
};

// Helper function to get config for an algorithm
export function getAlgorithmConfig(algorithmName: string, isQuick: boolean): AlgorithmConfig | undefined {
  const config = algorithmConfigs[algorithmName];
  if (!config) {
    // Default config for unknown algorithms
    return {
      name: algorithmName,
      complexity: ComplexityClass.QUADRATIC,
      quickSizes: [20, 50, 100],
      comprehensiveSizes: [20, 50, 100, 200, 500],
      edgeDensity: 0.2
    };
  }
  return config;
}

// Get appropriate graph sizes for an algorithm
export function getGraphSizes(algorithmName: string, isQuick: boolean): number[] {
  const config = getAlgorithmConfig(algorithmName, isQuick);
  return isQuick ? config!.quickSizes : config!.comprehensiveSizes;
}

// Get edge density for an algorithm
export function getEdgeDensity(algorithmName: string): number {
  const config = algorithmConfigs[algorithmName];
  return config?.edgeDensity || 0.2;
}

// Get max iterations for iterative algorithms
export function getMaxIterations(algorithmName: string): number | undefined {
  const config = algorithmConfigs[algorithmName];
  return config?.maxIterations;
}