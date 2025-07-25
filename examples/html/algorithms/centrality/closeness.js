// Import closeness centrality from the bundled algorithms
import { Graph, closenessCentrality } from './algorithms.js';

export function runClosenessCentrality() {
    // Create a graph instance
    const graph = new Graph();
    
    // Define the same graph structure as in the HTML
    const edges = [
        ['A', 'F'],
        ['B', 'F'],
        ['B', 'C'],
        ['C', 'E'],
        ['D', 'E'],
        ['E', 'F'],
        ['E', 'G'],
        ['E', 'H'],
        ['F', 'G'],
        ['H', 'G'],
        ['C', 'I'],
        ['D', 'J'],
        ['H', 'J']
    ];
    
    // Add edges to the graph
    edges.forEach(([source, target]) => {
        graph.addEdge(source, target);
    });
    
    // Calculate closeness centrality
    const centrality = closenessCentrality(graph, { normalized: false });
    
    console.log('Graph structure:', {
        nodes: Array.from(graph.nodes()).map(n => n.id),
        edges: Array.from(graph.edges()).map(e => ({
            source: e.source,
            target: e.target
        }))
    });
    
    console.log('Closeness Centrality Scores:', centrality);
    
    // Find nodes with highest closeness
    const sortedNodes = Object.entries(centrality)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
    
    console.log('Top 3 nodes by closeness centrality:');
    sortedNodes.forEach(([node, score], index) => {
        console.log(`${index + 1}. Node ${node}: ${score.toFixed(4)}`);
    });
    
    // Calculate average path lengths for context
    const nodeCount = Object.keys(centrality).length;
    console.log(`\nNetwork has ${nodeCount} nodes`);
    console.log('Higher closeness means shorter average distance to all other nodes');
    
    return centrality;
}