// Dijkstra's Shortest Path Algorithm Example
import { Graph, dijkstra, dijkstraPath } from '../dist/algorithms.js';

console.log('=== Dijkstra Example ===');

// Create a weighted graph
const graph = new Graph();

// Add weighted edges to create a sample network
graph.addEdge('A', 'B', 4);
graph.addEdge('A', 'C', 2);
graph.addEdge('B', 'C', 1);
graph.addEdge('B', 'D', 5);
graph.addEdge('C', 'D', 8);
graph.addEdge('C', 'E', 10);
graph.addEdge('D', 'E', 2);

console.log('Weighted Graph structure:');
console.log('    A');
console.log('   / \\');
console.log('  4   2');
console.log(' /     \\');
console.log('B   1   C');
console.log('|  ---  |');
console.log('5       8,10');
console.log('|       | |');
console.log('D   2   E');
console.log(' \\     /');
console.log('  -----');

// Find shortest paths from node 'A' to all other nodes
console.log('\n1. Shortest paths from A to all nodes:');
const result = dijkstra(graph, 'A');
console.log('Distances from A:');
for (const [node, pathResult] of result) {
    console.log(`  A -> ${node}: ${pathResult.distance}`);
}

// Find specific path from A to E
console.log('\n2. Shortest path from A to E:');
const pathResult = dijkstraPath(graph, 'A', 'E');
if (pathResult) {
    console.log('Path:', pathResult.path);
    console.log('Total distance:', pathResult.distance);
} else {
    console.log('No path found');
}

// Find path from A to D
console.log('\n3. Shortest path from A to D:');
const pathToD = dijkstraPath(graph, 'A', 'D');
if (pathToD) {
    console.log('Path:', pathToD.path);
    console.log('Total distance:', pathToD.distance);
}

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Distance A to B should be 4:', result.get('B')?.distance === 4);
console.log('✓ Distance A to C should be 2:', result.get('C')?.distance === 2);
console.log('✓ Distance A to D should be 8 (A->B->D):', result.get('D')?.distance === 8);
console.log('✓ Distance A to E should be 10 (A->B->D->E):', result.get('E')?.distance === 10);
console.log('✓ Path to E should go through B and D:', 
    pathResult && pathResult.path.includes('B') && pathResult.path.includes('D'));