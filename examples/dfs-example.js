// DFS (Depth-First Search) Example
import { Graph, depthFirstSearch, topologicalSort, hasCycleDFS, findStronglyConnectedComponents } from '../dist/algorithms.js';

console.log('=== DFS Example ===');

// Create a directed graph for demonstration
const graph = new Graph({ directed: true });

// Add nodes and edges to create a sample DAG (Directed Acyclic Graph)
graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'D');
graph.addEdge('C', 'D');
graph.addEdge('D', 'E');
graph.addEdge('B', 'E');

console.log('Directed Graph structure:');
console.log('A -> B -> D -> E');
console.log('|    |    ^    ^');
console.log('---> C ---+    |');
console.log('     |         |');
console.log('     ----------+');

// Perform DFS traversal starting from node 'A'
console.log('\n1. DFS Traversal from A:');
const dfsResult = depthFirstSearch(graph, 'A');
console.log('Visited nodes:', dfsResult.visited);
console.log('Visit order:', dfsResult.order);

// Check for cycles
console.log('\n2. Cycle Detection:');
const hasCycle = hasCycleDFS(graph);
console.log('Has cycle:', hasCycle);

// Topological sort (works on DAGs)
console.log('\n3. Topological Sort:');
const topoSort = topologicalSort(graph);
console.log('Topological order:', topoSort);

// Find strongly connected components
console.log('\n4. Strongly Connected Components:');
const sccComponents = findStronglyConnectedComponents(graph);
console.log('SCC Components:');
sccComponents.forEach((component, index) => {
    console.log(`  Component ${index + 1}: [${component.join(', ')}]`);
});

// Verify results
console.log('\n=== Verification ===');
console.log('✓ DFS should visit all reachable nodes:', dfsResult.visited.size === 5);
console.log('✓ A should be the first visited node:', dfsResult.order[0] === 'A');
console.log('✓ Should detect cycle in this graph:', hasCycle === true);
console.log('✓ Topological sort should be null (due to cycle):', topoSort === null);
console.log('✓ Should find strongly connected components:', sccComponents.length > 0);