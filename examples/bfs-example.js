// BFS (Breadth-First Search) Example
import { Graph, breadthFirstSearch, shortestPathBFS } from '../dist/algorithms.js';

console.log('=== BFS Example ===');

// Create a simple graph
const graph = new Graph();

// Add nodes and edges to create a sample network
graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'D');
graph.addEdge('C', 'E');
graph.addEdge('D', 'F');
graph.addEdge('E', 'F');

console.log('Graph structure:');
console.log('A -- B -- D -- F');
console.log('|    |         |');
console.log('C -- E -------/');

// Perform BFS traversal starting from node 'A'
console.log('\n1. BFS Traversal from A:');
const bfsResult = breadthFirstSearch(graph, 'A');
console.log('Visited nodes:', bfsResult.visited);
console.log('Visit order:', bfsResult.order);

// Find path between two nodes using BFS
console.log('\n2. BFS Path from A to F:');
const path = shortestPathBFS(graph, 'A', 'F');
if (path) {
    console.log('Path found:', path.path);
    console.log('Distance:', path.distance);
} else {
    console.log('No path found');
}

// Test bipartite check
console.log('\n3. Check if graph is bipartite:');
const { isBipartite } = await import('../dist/algorithms.js');
const bipartiteResult = isBipartite(graph);
console.log('Is bipartite:', bipartiteResult);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ BFS should visit all reachable nodes:', bfsResult.visited.size === 6);
console.log('✓ A should be the first visited node:', bfsResult.order[0] === 'A');
console.log('✓ Path from A to F should exist:', path !== null);
console.log('✓ BFS found shortest path with correct distance:', path?.distance === 3);