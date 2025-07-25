import { Graph, kruskalMST } from './algorithms.js';

// Export function for the HTML to use
export function runKruskalAlgorithm() {
    // Create graph with the same structure as the visualization
    const graph = new Graph(false);
    
    // Add nodes
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    nodes.forEach(node => {
        graph.addNode(node);
    });
    
    // Add edges with weights
    const edges = [
        {source: 'A', target: 'B', weight: 4},
        {source: 'A', target: 'E', weight: 8},
        {source: 'B', target: 'C', weight: 8},
        {source: 'B', target: 'E', weight: 11},
        {source: 'B', target: 'F', weight: 7},
        {source: 'C', target: 'D', weight: 7},
        {source: 'C', target: 'G', weight: 4},
        {source: 'C', target: 'F', weight: 2},
        {source: 'D', target: 'G', weight: 9},
        {source: 'D', target: 'H', weight: 14},
        {source: 'E', target: 'F', weight: 1},
        {source: 'F', target: 'G', weight: 6},
        {source: 'G', target: 'H', weight: 10},
        {source: 'H', target: 'F', weight: 2}
    ];
    
    edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target, { weight: edge.weight });
    });
    
    // Run Kruskal's algorithm
    const result = kruskalMST(graph);
    
    // Return result for visualization
    return result;
}