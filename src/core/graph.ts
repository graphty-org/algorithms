// Common graph interface for performance testing
export interface Graph {
  vertices: number
  edges: Array<[number, number, number?]> // [from, to, weight?]
  directed: boolean
  weighted: boolean
}

export interface AdjacencyList {
  [vertex: number]: Array<{ to: number; weight?: number }>
}

export interface GraphMetadata {
  generationAlgorithm: string
  parameters?: Record<string, any>
}

export class GraphImpl implements Graph {
  vertices: number
  edges: Array<[number, number, number?]> = []
  adjacencyList: AdjacencyList = {}
  directed: boolean
  weighted: boolean
  metadata?: GraphMetadata

  constructor(vertices: number, directed = false, weighted = false, metadata?: GraphMetadata) {
    this.vertices = vertices
    this.directed = directed
    this.weighted = weighted
    this.metadata = metadata
    
    // Initialize adjacency list
    for (let i = 0; i < vertices; i++) {
      this.adjacencyList[i] = []
    }
  }

  addEdge(from: number, to: number, weight?: number) {
    this.edges.push([from, to, weight])
    this.adjacencyList[from].push({ to, weight })
    
    if (!this.directed) {
      this.adjacencyList[to].push({ to: from, weight })
    }
  }

  getNeighbors(vertex: number): Array<{ to: number; weight?: number }> {
    return this.adjacencyList[vertex] || []
  }

  hasVertex(vertex: number): boolean {
    return vertex >= 0 && vertex < this.vertices
  }

  getEdgeCount(): number {
    return this.directed ? this.edges.length : this.edges.length * 2
  }
}