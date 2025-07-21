// Betweenness Centrality Example
import { Graph, betweennessCentrality, nodeBetweennessCentrality, edgeBetweennessCentrality } from '../dist/algorithms.js';

console.log('=== Betweenness Centrality Example ===');

// Create a graph that demonstrates betweenness centrality
const graph = new Graph();

// Add edges to create a network with a clear bridge node
graph.addEdge('A', 'B');
graph.addEdge('B', 'C');
graph.addEdge('C', 'D');
graph.addEdge('D', 'E');
graph.addEdge('E', 'F');
graph.addEdge('F', 'G');

// Add a bridge connecting two components
graph.addEdge('C', 'H');
graph.addEdge('H', 'I');
graph.addEdge('I', 'J');
graph.addEdge('J', 'K');

console.log('Graph structure:');
console.log('A -- B -- C -- D -- E -- F -- G');
console.log('          |');
console.log('          H');
console.log('          |');
console.log('          I -- J -- K');

// Calculate betweenness centrality for all nodes
console.log('\n1. Betweenness Centrality for all nodes:');
const centrality = betweennessCentrality(graph);
console.log('Node centrality scores:');
Object.entries(centrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(3)}`);
    });

// Calculate normalized betweenness centrality
console.log('\n2. Normalized Betweenness Centrality:');
const normalizedCentrality = betweennessCentrality(graph, { normalized: true });
console.log('Normalized centrality scores:');
Object.entries(normalizedCentrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(3)}`);
    });

// Get centrality for a specific node
console.log('\n3. Centrality for specific node (C):');
const nodeC = nodeBetweennessCentrality(graph, 'C');
console.log(`Node C centrality: ${nodeC.toFixed(3)}`);

// Calculate edge betweenness centrality
console.log('\n4. Edge Betweenness Centrality:');
const edgeCentrality = edgeBetweennessCentrality(graph);
console.log('Top edge centrality scores:');
Array.from(edgeCentrality.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([edge, score]) => {
        console.log(`  ${edge}: ${score.toFixed(3)}`);
    });

// Test with endpoints option
console.log('\n5. Betweenness with endpoints included:');
const endpointsCentrality = betweennessCentrality(graph, { endpoints: true });
console.log('Top nodes with endpoints:');
Object.entries(endpointsCentrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(3)}`);
    });

// Verify results
console.log('\n=== Verification ===');
const mostCentral = Object.entries(centrality).reduce((a, b) => a[1] > b[1] ? a : b);
console.log('✓ Most central node:', mostCentral[0]);
console.log('✓ C should have high centrality (bridge node):', centrality.C > 10);
console.log('✓ H should have high centrality (bridge node):', centrality.H > 5);
console.log('✓ End nodes (A, G, K) should have low centrality:', 
    centrality.A === 0 && centrality.G === 0 && centrality.K === 0);
console.log('✓ All centrality scores should be non-negative:', 
    Object.values(centrality).every(score => score >= 0));