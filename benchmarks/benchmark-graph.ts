/**
 * Graph interface specifically for benchmarking
 * Simplified structure for performance testing
 */

export interface GraphMetadata {
  generationAlgorithm: string
  parameters: Record<string, any>
}

export interface GraphImpl {
  vertices: number[]
  edges: Array<[number, number, number?]> // [from, to, weight?]
  adjacencyList: Record<number, number[]>
  metadata: GraphMetadata
  directed: boolean
  weighted: boolean
}