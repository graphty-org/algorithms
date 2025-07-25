import { GraphImpl } from '../../benchmark-graph'

/**
 * Generate Small-World Networks using the Watts-Strogatz model
 * 
 * Creates graphs with high clustering and short average path lengths,
 * characteristic of many real-world networks like social networks.
 * 
 * @param vertices - Number of vertices
 * @param k - Initial nearest neighbors (must be even)
 * @param p - Rewiring probability (0 = regular lattice, 1 = random graph)
 */
export function generateSmallWorld(
  vertices: number, 
  k: number, // Initial nearest neighbors (must be even)
  p: number  // Rewiring probability
): GraphImpl {
  if (k % 2 !== 0) {
    throw new Error('k must be even')
  }
  if (k >= vertices) {
    throw new Error(`k (${k}) must be less than vertices (${vertices})`)
  }
  if (p < 0 || p > 1) {
    throw new Error(`Rewiring probability must be between 0 and 1, got ${p}`)
  }
  
  const metadata = {
    generationAlgorithm: 'Watts-Strogatz Small-World',
    parameters: {
      vertices,
      k,
      p,
      edges: vertices * k / 2, // Initial edge count
      description: `Small-world network with k=${k}, p=${p}`
    }
  }
  
  const edges: Array<[number, number]> = []
  const adjacencyList: Record<number, number[]> = {}
  
  // Initialize adjacency list
  for (let i = 0; i < vertices; i++) {
    adjacencyList[i] = []
  }
  
  // Create initial ring lattice
  // Each vertex connects to k/2 neighbors on each side
  for (let i = 0; i < vertices; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = (i + j) % vertices
      // Only add edge once (from smaller to larger index)
      if (i < neighbor || (neighbor < i && neighbor < k/2)) {
        edges.push([i, neighbor])
        adjacencyList[i].push(neighbor)
        adjacencyList[neighbor].push(i)
      }
    }
  }
  
  // Rewire edges with probability p
  const rewiredEdges: Array<[number, number]> = []
  const edgeSet = new Set<string>()
  
  // Build initial edge set
  edges.forEach(([from, to]) => {
    const key = from < to ? `${from}-${to}` : `${to}-${from}`
    edgeSet.add(key)
  })
  
  // Process each edge for potential rewiring
  for (const [from, to] of edges) {
    if (Math.random() < p) {
      // Rewire this edge
      // Find a new target that's not already connected to 'from'
      let newTarget: number
      let attempts = 0
      const maxAttempts = vertices
      
      do {
        newTarget = Math.floor(Math.random() * vertices)
        attempts++
      } while (
        (newTarget === from || 
         adjacencyList[from].includes(newTarget) ||
         newTarget === to) &&
        attempts < maxAttempts
      )
      
      if (attempts < maxAttempts) {
        // Remove old edge from adjacency list
        adjacencyList[from] = adjacencyList[from].filter(v => v !== to)
        adjacencyList[to] = adjacencyList[to].filter(v => v !== from)
        
        // Add new edge
        adjacencyList[from].push(newTarget)
        adjacencyList[newTarget].push(from)
        
        // Add to rewired edges list
        rewiredEdges.push([from, newTarget])
        
        // Update edge set
        const oldKey = from < to ? `${from}-${to}` : `${to}-${from}`
        const newKey = from < newTarget ? `${from}-${newTarget}` : `${newTarget}-${from}`
        edgeSet.delete(oldKey)
        edgeSet.add(newKey)
      } else {
        // Keep original edge if we couldn't find a valid rewiring
        rewiredEdges.push([from, to])
      }
    } else {
      // Keep original edge
      rewiredEdges.push([from, to])
    }
  }
  
  // Update metadata with actual edge count
  metadata.parameters.edges = rewiredEdges.length
  metadata.parameters.rewiredCount = edges.length - edges.filter(e => rewiredEdges.includes(e)).length
  
  return {
    vertices: Array.from({ length: vertices }, (_, i) => i),
    edges: rewiredEdges,
    adjacencyList,
    metadata,
    directed: false,
    weighted: false
  }
}

/**
 * Generate Small-World graph suitable for benchmarking
 * Uses parameters that create good small-world properties
 */
export function generateSmallWorldBenchmark(vertices: number): GraphImpl {
  // Choose k based on graph size
  // For smaller graphs, use smaller k to avoid overly dense graphs
  let k: number
  if (vertices < 100) {
    k = Math.min(4, Math.floor(vertices / 10) * 2) // Ensure even
  } else if (vertices < 1000) {
    k = 6
  } else if (vertices < 10000) {
    k = 10
  } else {
    k = 20
  }
  
  // Ensure k is even and reasonable
  k = Math.max(2, Math.min(k, Math.floor(vertices / 10)))
  if (k % 2 !== 0) k--
  
  // Use rewiring probability of 0.1 (good small-world properties)
  const p = 0.1
  
  return generateSmallWorld(vertices, k, p)
}

/**
 * Generate Newman-Watts Small-World variant
 * Instead of rewiring, adds shortcuts (preserves connectivity)
 */
export function generateNewmanWatts(
  vertices: number,
  k: number,
  p: number
): GraphImpl {
  if (k % 2 !== 0) {
    throw new Error('k must be even')
  }
  
  const metadata = {
    generationAlgorithm: 'Newman-Watts Small-World',
    parameters: {
      vertices,
      k,
      p,
      edges: 0, // Will be updated
      description: `Newman-Watts variant with k=${k}, p=${p}`
    }
  }
  
  const edges: Array<[number, number]> = []
  const adjacencyList: Record<number, number[]> = {}
  const edgeSet = new Set<string>()
  
  // Initialize adjacency list
  for (let i = 0; i < vertices; i++) {
    adjacencyList[i] = []
  }
  
  // Create initial ring lattice
  for (let i = 0; i < vertices; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = (i + j) % vertices
      const key = i < neighbor ? `${i}-${neighbor}` : `${neighbor}-${i}`
      
      if (!edgeSet.has(key)) {
        edgeSet.add(key)
        edges.push([i, neighbor])
        adjacencyList[i].push(neighbor)
        adjacencyList[neighbor].push(i)
      }
    }
  }
  
  // Add shortcuts with probability p for each edge
  const shortcuts: Array<[number, number]> = []
  
  for (let i = 0; i < vertices; i++) {
    for (let j = i + 1; j < vertices; j++) {
      if (Math.random() < p) {
        // Check if edge already exists
        const key = `${i}-${j}`
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          shortcuts.push([i, j])
          adjacencyList[i].push(j)
          adjacencyList[j].push(i)
        }
      }
    }
  }
  
  // Combine all edges
  const allEdges = [...edges, ...shortcuts]
  
  metadata.parameters.edges = allEdges.length
  metadata.parameters.shortcuts = shortcuts.length
  
  return {
    vertices: Array.from({ length: vertices }, (_, i) => i),
    edges: allEdges,
    adjacencyList,
    metadata,
    directed: false,
    weighted: false
  }
}