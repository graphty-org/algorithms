// Import betweenness centrality from the bundled algorithms
import { Graph, betweennessCentrality } from './algorithms.js';

export function runBetweennessCentrality() {
    // Create a graph instance
    const graph = new Graph();
    
    // Define the same graph structure as in the HTML
    const edges = [
        ['A', 'B'],
        ['B', 'C'],
        ['A', 'D'],
        ['B', 'D'],
        ['C', 'E'],
        ['D', 'E'],
        ['E', 'F'],
        ['F', 'G'],
        ['D', 'H'],
        ['E', 'I'],
        ['F', 'J'],
        ['H', 'I'],
        ['I', 'J']
    ];
    
    // Add edges to the graph
    edges.forEach(([source, target]) => {
        graph.addEdge(source, target);
    });
    
    // Calculate betweenness centrality
    const centrality = betweennessCentrality(graph, { normalized: false });
    
    console.log('Graph structure:', {
        nodes: Array.from(graph.nodes()).map(n => n.id),
        edges: Array.from(graph.edges()).map(e => ({
            source: e.source,
            target: e.target
        }))
    });
    
    console.log('Betweenness Centrality Scores:', centrality);
    
    // Find nodes with highest betweenness
    const sortedNodes = Object.entries(centrality)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
    
    console.log('Top 3 nodes by betweenness centrality:');
    sortedNodes.forEach(([node, score], index) => {
        console.log(`${index + 1}. Node ${node}: ${score.toFixed(3)}`);
    });
    
    return centrality;
}