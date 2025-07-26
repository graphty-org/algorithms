import { Graph } from '../../src/core/graph.js'
import { getGraphSizes, getEdgeDensity, getMaxIterations } from '../algorithm-complexity.js'
import { generateRandomGraph, generateCompleteGraph, generateGridGraph } from './test-data-generator.js'

export interface AdaptiveBenchmarkConfig {
  algorithmName: string;
  isQuick: boolean;
  testType: 'quick' | 'comprehensive';
  platform: 'node' | 'browser';
}

export interface AdaptiveTestGraph {
  graph: Graph;
  size: number;
  edgeCount: number;
  density: number;
}

/**
 * Generate test graphs with sizes appropriate for algorithm complexity
 */
export function createAdaptiveTestGraphs(config: AdaptiveBenchmarkConfig): Map<number, AdaptiveTestGraph> {
  const sizes = getGraphSizes(config.algorithmName, config.isQuick);
  const density = getEdgeDensity(config.algorithmName);
  const testGraphs = new Map<number, AdaptiveTestGraph>();

  sizes.forEach(size => {
    // For very small graphs (< 20 nodes), use complete or near-complete graphs
    if (size < 20) {
      const graph = generateCompleteGraph(size);
      testGraphs.set(size, {
        graph,
        size,
        edgeCount: graph.uniqueEdgeCount,
        density: 1.0
      });
    } 
    // For small graphs (< 50 nodes), use grid-like structures
    else if (size < 50) {
      const graph = generateGridGraph(Math.floor(Math.sqrt(size)), Math.ceil(size / Math.floor(Math.sqrt(size))));
      testGraphs.set(size, {
        graph,
        size: graph.nodeCount,
        edgeCount: graph.uniqueEdgeCount,
        density: graph.uniqueEdgeCount / (graph.nodeCount * (graph.nodeCount - 1) / 2)
      });
    }
    // For larger graphs, use random generation with specified density
    else {
      const maxEdges = Math.floor((size * (size - 1)) / 2 * density);
      const graph = generateRandomGraph(size, maxEdges);
      testGraphs.set(size, {
        graph,
        size,
        edgeCount: graph.uniqueEdgeCount,
        density
      });
    }
  });

  return testGraphs;
}

/**
 * Get benchmark configuration for an algorithm
 */
export function getAdaptiveBenchmarkConfig(
  algorithmName: string, 
  isQuick: boolean
): {
  sizes: number[];
  maxIterations?: number;
  iterations: number; // benchmark iterations
} {
  const sizes = getGraphSizes(algorithmName, isQuick);
  const maxIterations = getMaxIterations(algorithmName);
  
  // Reduce benchmark iterations for slow algorithms
  let iterations = isQuick ? 2 : 5;
  
  // Very fast algorithms can have more iterations
  if (algorithmName === 'BFS' || algorithmName === 'DFS' || 
      algorithmName === 'Degree Centrality' || algorithmName === 'K-Core') {
    iterations = isQuick ? 3 : 10;
  }
  // Slow O(V²) algorithms  
  else if (algorithmName === 'Closeness Centrality' || 
           algorithmName === 'HITS' || 
           algorithmName === 'Katz Centrality' ||
           algorithmName === 'Eigenvector Centrality' ||
           algorithmName === 'Leiden') {
    iterations = isQuick ? 1 : 3;
  }
  // Very slow O(V³) algorithms
  else if (algorithmName === 'Floyd-Warshall' || 
           algorithmName === 'Girvan-Newman' ||
           algorithmName === 'Hierarchical Clustering' ||
           algorithmName === 'MCL') {
    iterations = 1; // Always just 1 iteration
  }

  return { sizes, maxIterations, iterations };
}

/**
 * Helper to create a simple test graph for single benchmark runs
 */
export function createSimpleTestGraph(nodes: number, edgeProbability: number = 0.3): Graph {
  const graph = new Graph({ directed: false });
  
  // Add nodes
  for (let i = 0; i < nodes; i++) {
    graph.addNode(i.toString());
  }
  
  // Add edges randomly
  for (let i = 0; i < nodes; i++) {
    for (let j = i + 1; j < nodes; j++) {
      if (Math.random() < edgeProbability) {
        graph.addEdge(i.toString(), j.toString(), Math.random() * 10 + 1);
      }
    }
  }
  
  return graph;
}