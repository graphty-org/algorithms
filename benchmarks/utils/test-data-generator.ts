import { GraphImpl, GraphMetadata } from '../../src/core/graph'
import { generateRMATBenchmark } from '../datasets/generators/rmat-generator'
import { generateSmallWorldBenchmark } from '../datasets/generators/small-world'

// Erdős–Rényi random graph generator with fixed number of edges
function generateRandomGraphFixed(vertices: number, edges: number): GraphImpl {
  const adjacencyList: Map<number, Set<number>> = new Map()
  
  // Initialize vertices
  for (let i = 0; i < vertices; i++) {
    adjacencyList.set(i, new Set())
  }
  
  // Generate random edges
  let edgeCount = 0
  const maxAttempts = edges * 10
  let attempts = 0
  
  while (edgeCount < edges && attempts < maxAttempts) {
    const from = Math.floor(Math.random() * vertices)
    const to = Math.floor(Math.random() * vertices)
    
    if (from !== to && !adjacencyList.get(from)!.has(to)) {
      adjacencyList.get(from)!.add(to)
      adjacencyList.get(to)!.add(from)
      edgeCount++
    }
    attempts++
  }
  
  // Convert to edge list format
  const edgeList: Array<[number, number]> = []
  const visited = new Set<string>()
  
  for (const [from, neighbors] of adjacencyList) {
    for (const to of neighbors) {
      const edgeKey = from < to ? `${from}-${to}` : `${to}-${from}`
      if (!visited.has(edgeKey)) {
        edgeList.push([from, to])
        visited.add(edgeKey)
      }
    }
  }
  
  const metadata: GraphMetadata = {
    generationAlgorithm: 'Erdős–Rényi Random Graph (Fixed Edges)',
    parameters: {
      vertices,
      edges: edgeList.length,
      targetEdges: edges,
      actualEdges: edgeList.length
    }
  }
  
  return {
    vertices: Array.from({ length: vertices }, (_, i) => i),
    edges: edgeList,
    adjacencyList,
    metadata,
    directed: false,
    weighted: false
  }
}

export const generateTestGraphs = {
  // Sparse graph: ~4-8 edges per vertex
  sparse(vertices: number): GraphImpl {
    const avgDegree = 6
    const edges = Math.floor(vertices * avgDegree / 2)
    const graph = generateRandomGraphFixed(vertices, edges)
    // Add additional metadata about the sparseness
    if (graph.metadata) {
      graph.metadata.parameters = {
        ...graph.metadata.parameters,
        type: 'sparse',
        averageDegree: avgDegree
      }
    }
    return graph
  },
  
  // Dense graph: ~20-40% of all possible edges
  dense(vertices: number): GraphImpl {
    const maxEdges = (vertices * (vertices - 1)) / 2
    const edges = Math.floor(maxEdges * 0.3) // 30% density
    const graph = generateRandomGraphFixed(vertices, edges)
    if (graph.metadata) {
      graph.metadata.parameters = {
        ...graph.metadata.parameters,
        type: 'dense',
        density: edges / maxEdges
      }
    }
    return graph
  },
  
  // Grid graph: vertices arranged in a square grid
  grid(size: number): GraphImpl {
    const vertices = size * size
    const adjacencyList: Map<number, Set<number>> = new Map()
    const edges: Array<[number, number]> = []
    
    // Initialize vertices
    for (let i = 0; i < vertices; i++) {
      adjacencyList.set(i, new Set())
    }
    
    // Create grid connections
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const current = row * size + col
        
        // Connect to right neighbor
        if (col < size - 1) {
          const right = current + 1
          adjacencyList.get(current)!.add(right)
          adjacencyList.get(right)!.add(current)
          edges.push([current, right])
        }
        
        // Connect to bottom neighbor
        if (row < size - 1) {
          const bottom = current + size
          adjacencyList.get(current)!.add(bottom)
          adjacencyList.get(bottom)!.add(current)
          edges.push([current, bottom])
        }
      }
    }
    
    const metadata: GraphMetadata = {
      generationAlgorithm: 'Grid Graph',
      parameters: {
        gridSize: size,
        vertices,
        edges: edges.length
      }
    }
    
    return {
      vertices: Array.from({ length: vertices }, (_, i) => i),
      edges,
      adjacencyList,
      metadata,
      directed: false,
      weighted: false
    }
  },
  
  // RMAT graph: Power-law degree distribution (scale-free)
  rmat(vertices: number): GraphImpl {
    return generateRMATBenchmark(vertices)
  },
  
  // Small-world graph: High clustering + short paths
  smallWorld(vertices: number): GraphImpl {
    return generateSmallWorldBenchmark(vertices)
  },
  
  // Complete graph: All vertices connected (for small tests)
  complete(vertices: number): GraphImpl {
    if (vertices > 1000) {
      throw new Error('Complete graphs limited to 1000 vertices for memory reasons')
    }
    
    const adjacencyList: Map<number, Set<number>> = new Map()
    const edges: Array<[number, number]> = []
    
    // Initialize vertices
    for (let i = 0; i < vertices; i++) {
      adjacencyList.set(i, new Set())
    }
    
    // Connect all pairs
    for (let i = 0; i < vertices; i++) {
      for (let j = i + 1; j < vertices; j++) {
        adjacencyList.get(i)!.add(j)
        adjacencyList.get(j)!.add(i)
        edges.push([i, j])
      }
    }
    
    const metadata: GraphMetadata = {
      generationAlgorithm: 'Complete Graph (K_n)',
      parameters: {
        vertices,
        edges: edges.length,
        description: `K_${vertices} - all vertices connected`
      }
    }
    
    return {
      vertices: Array.from({ length: vertices }, (_, i) => i),
      edges,
      adjacencyList,
      metadata,
      directed: false,
      weighted: false
    }
  }
}