import { Graph, katzCentrality } from './algorithms.js';

// Create a graph with interesting structure
const graph = new Graph();

// Add nodes
const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
nodes.forEach(node => graph.addNode(node));

// Add edges to create a network with hubs
const edges = [
    ['A', 'B'], ['A', 'C'], ['A', 'E'],  // A is a hub
    ['B', 'D'], ['C', 'D'], ['C', 'E'],  // C connects hubs
    ['E', 'F'], ['D', 'G'], ['D', 'H'],  // Spread to periphery
    ['G', 'H']  // Peripheral connection
];

edges.forEach(([source, target]) => graph.addEdge(source, target));

// Run Katz Centrality with different parameters
export function runKatzCentrality() {
    console.log('=== Katz Centrality Example ===\n');
    
    // Test different alpha values
    const alphaValues = [0.05, 0.1, 0.2];
    const beta = 1.0;
    
    alphaValues.forEach(alpha => {
        console.log(`\nTesting with alpha = ${alpha}, beta = ${beta}:`);
        
        const result = katzCentrality(graph, {
            alpha: alpha,
            beta: beta,
            maxIterations: 100,
            tolerance: 1e-6,
            normalized: true
        });
        
        // Sort nodes by centrality
        const sortedNodes = Object.entries(result)
            .sort(([,a], [,b]) => b - a)
            .map(([node, score]) => ({ node, score }));
        
        console.log('Centrality ranking:');
        sortedNodes.forEach(({node, score}, index) => {
            console.log(`  ${index + 1}. Node ${node}: ${score.toFixed(4)}`);
        });
        
        // Show interpretation
        const topNode = sortedNodes[0];
        const bottomNode = sortedNodes[sortedNodes.length - 1];
        console.log(`\nInterpretation:`);
        console.log(`  Most central: ${topNode.node} (score: ${topNode.score.toFixed(4)})`);
        console.log(`  Least central: ${bottomNode.node} (score: ${bottomNode.score.toFixed(4)})`);
        console.log(`  Score difference: ${(topNode.score - bottomNode.score).toFixed(4)}`);
    });
    
    // Compare with different beta values
    console.log('\n=== Effect of Beta Parameter ===');
    const betaValues = [0.5, 1.0, 2.0];
    const alpha = 0.1;
    
    betaValues.forEach(beta => {
        console.log(`\nWith beta = ${beta}:`);
        const result = katzCentrality(graph, { alpha, beta, normalized: false });
        
        const avg = Object.values(result).reduce((a, b) => a + b, 0) / Object.keys(result).length;
        const min = Math.min(...Object.values(result));
        const max = Math.max(...Object.values(result));
        
        console.log(`  Average score: ${avg.toFixed(3)}`);
        console.log(`  Range: ${min.toFixed(3)} - ${max.toFixed(3)}`);
        console.log(`  Spread: ${(max - min).toFixed(3)}`);
    });
    
    return katzCentrality(graph, { alpha: 0.1, beta: 1.0 });
}