// Bellman-Ford Algorithm Example (handles negative weights)
import { Graph, bellmanFord, bellmanFordPath, hasNegativeCycle } from '../dist/algorithms.js';

console.log('=== Bellman-Ford Example ===');

// Create a directed graph with negative weights
const graph = new Graph({ directed: true });

// Add weighted edges including negative weights
graph.addEdge('A', 'B', 1);
graph.addEdge('A', 'C', 4);
graph.addEdge('B', 'C', -3);
graph.addEdge('B', 'D', 2);
graph.addEdge('C', 'D', 3);
graph.addEdge('D', 'B', -5);

console.log('Directed Graph with negative weights:');
console.log('A --1--> B --2--> D');
console.log('|        |        |');
console.log('4       -3       -5');
console.log('|        |        |');
console.log('v        v        v');
console.log('C <-----3------- /');

// Check for negative cycles first
console.log('\n1. Checking for negative cycles:');
const hasNegCycle = hasNegativeCycle(graph);
console.log('Has negative cycle:', hasNegCycle);

// Find shortest paths from node 'A'
console.log('\n2. Shortest paths from A (with negative weights):');
try {
    const result = bellmanFord(graph, 'A');
    console.log('Distances from A:');
    for (const [node, distance] of result.distances) {
        console.log(`  A -> ${node}: ${distance}`);
    }
    console.log('Has negative cycle:', result.hasNegativeCycle);
} catch (error) {
    console.log('Error:', error.message);
}

// Find specific path from A to D
console.log('\n3. Shortest path from A to D:');
try {
    const pathResult = bellmanFordPath(graph, 'A', 'D');
    if (pathResult) {
        console.log('Path:', pathResult.path);
        console.log('Total distance:', pathResult.distance);
    } else {
        console.log('No path found');
    }
} catch (error) {
    console.log('Error:', error.message);
}

// Example with a graph that has no negative cycles
console.log('\n4. Example without negative cycles:');
const safeGraph = new Graph({ directed: true });
safeGraph.addEdge('X', 'Y', -1);
safeGraph.addEdge('Y', 'Z', 2);
safeGraph.addEdge('X', 'Z', 5);

const safeResult = bellmanFord(safeGraph, 'X');
console.log('Safe graph distances from X:');
for (const [node, distance] of safeResult.distances) {
    console.log(`  X -> ${node}: ${distance}`);
}

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Should detect negative cycle in first graph:', hasNegCycle === true);
console.log('✓ Safe graph should have no negative cycle:', safeResult.hasNegativeCycle === false);
console.log('✓ Distance X to Z in safe graph should be 1 (X->Y->Z):', 
    safeResult.distances.get('Z') === 1);