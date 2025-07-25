import { Graph } from '../../src/core/graph'
import { GraphImpl } from '../../src/core/graph'

/**
 * Converts our benchmark GraphImpl to the library's Graph format
 */
export function convertToLibraryGraph(benchmarkGraph: GraphImpl): Graph {
  const graph = new Graph({ directed: benchmarkGraph.directed })
  
  // Add all vertices
  for (let i = 0; i < benchmarkGraph.vertices; i++) {
    graph.addNode(i)
  }
  
  // Add all edges
  for (const [from, to, weight] of benchmarkGraph.edges) {
    graph.addEdge(from, to, weight)
  }
  
  return graph
}