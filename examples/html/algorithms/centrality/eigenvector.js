// Import the Graph class and eigenvectorCentrality function from @graphty/algorithms
import { Graph, eigenvectorCentrality } from './algorithms.js';

export function runEigenvectorCentrality() {
    // Create a graph instance
    const graph = new Graph();
    
    // Define the same graph structure as in the HTML
    const edges = [
        // Hub connections
        ['A', 'B'],
        ['A', 'C'],
        ['A', 'D'],
        ['A', 'E'],
        
        // Well-connected node connections
        ['B', 'C'],
        ['B', 'F'],
        ['B', 'J'],
        ['C', 'G'],
        ['C', 'K'],
        ['D', 'E'],
        ['D', 'H'],
        ['D', 'L'],
        ['E', 'I'],
        ['E', 'M'],
        
        // Additional connections
        ['F', 'H'],
        ['G', 'I'],
        ['J', 'K'],
        ['L', 'M']
    ];
    
    // Add edges to the graph
    edges.forEach(([source, target]) => {
        graph.addEdge(source, target);
    });
    
    // Calculate eigenvector centrality using the package function
    const centrality = eigenvectorCentrality(graph, {
        maxIterations: 100,
        tolerance: 1e-6,
        normalized: true
    });
    
    console.log('Graph structure:', {
        nodes: Array.from(graph.nodes()).map(n => n.id),
        edges: Array.from(graph.edges()).map(e => ({
            source: e.source,
            target: e.target
        }))
    });
    
    console.log('Eigenvector Centrality Scores:', centrality);
    
    // Find nodes with highest eigenvector centrality
    const sortedNodes = Object.entries(centrality)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    
    console.log('Top 5 nodes by eigenvector centrality (influence):');
    sortedNodes.forEach(([node, score], index) => {
        console.log(`${index + 1}. Node ${node}: ${score.toFixed(4)}`);
    });
    
    // Compare with degree centrality to show the difference
    const degrees = {};
    for (const node of graph.nodes()) {
        degrees[node.id] = Array.from(graph.neighbors(node.id)).length;
    }
    
    console.log('\nComparison with degree centrality:');
    console.log('Node A (hub) - Degree:', degrees['A'], 'Eigenvector:', centrality['A']?.toFixed(4));
    console.log('Node B - Degree:', degrees['B'], 'Eigenvector:', centrality['B']?.toFixed(4));
    console.log('Node F - Degree:', degrees['F'], 'Eigenvector:', centrality['F']?.toFixed(4));
    
    return centrality;
}