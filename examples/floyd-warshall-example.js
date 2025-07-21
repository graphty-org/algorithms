// Floyd-Warshall All-Pairs Shortest Path Algorithm Example
import { Graph, floydWarshall, floydWarshallPath, transitiveClosure } from '../dist/algorithms.js';

console.log('=== Floyd-Warshall Example ===');

// Create a weighted directed graph
const graph = new Graph({ directed: true });

// Add weighted edges
graph.addEdge('A', 'B', 3);
graph.addEdge('A', 'C', 8);
graph.addEdge('A', 'E', -4);
graph.addEdge('B', 'D', 1);
graph.addEdge('B', 'E', 7);
graph.addEdge('C', 'B', 4);
graph.addEdge('D', 'A', 2);
graph.addEdge('D', 'C', -5);
graph.addEdge('E', 'D', 6);

console.log('Directed Graph structure:');
console.log('   A --3--> B --1--> D');
console.log('   |        ^        |');
console.log('  -4        4       -5');
console.log('   |        |        |');
console.log('   v        |        v');
console.log('   E --6----+        C');
console.log('   ^                 |');
console.log('   7                 4');
console.log('   |                 |');
console.log('   +---------8-------+');

// Find all-pairs shortest paths
console.log('\n1. All-pairs shortest paths:');
const result = floydWarshall(graph);
console.log('Has negative cycle:', result.hasNegativeCycle);

console.log('\nShortest distances between all pairs:');
const nodes = Array.from(graph.nodes()).map(n => n.id);
console.log('     ', nodes.join('  '));
for (const source of nodes) {
    const row = nodes.map(target => {
        const dist = result.distances.get(source)?.get(target);
        return dist === Infinity ? '∞' : dist?.toString().padStart(2) || '?';
    });
    console.log(`${source}:   ${row.join('  ')}`);
}

// Find specific path between two nodes
console.log('\n2. Path from A to C:');
const pathResult = floydWarshallPath(graph, 'A', 'C');
if (pathResult) {
    console.log('Path:', pathResult.path);
    console.log('Distance:', pathResult.distance);
} else {
    console.log('No path found');
}

// Calculate transitive closure
console.log('\n3. Transitive Closure (reachability):');
const closure = transitiveClosure(graph);
console.log('Reachable nodes from each node:');
for (const [source, reachable] of closure) {
    console.log(`${source}: {${Array.from(reachable).sort().join(', ')}}`);
}

// Example with negative cycle detection
console.log('\n4. Testing negative cycle detection:');
const negGraph = new Graph({ directed: true });
negGraph.addEdge('X', 'Y', 1);
negGraph.addEdge('Y', 'Z', -3);
negGraph.addEdge('Z', 'X', 1);

const negResult = floydWarshall(negGraph);
console.log('Negative cycle graph has negative cycle:', negResult.hasNegativeCycle);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Original graph should have no negative cycle:', result.hasNegativeCycle === false);
console.log('✓ Negative cycle graph should detect cycle:', negResult.hasNegativeCycle === true);
console.log('✓ Distance from A to A should be 0:', result.distances.get('A')?.get('A') === 0);
console.log('✓ Every node should be reachable from itself:', 
    Array.from(closure.keys()).every(node => closure.get(node)?.has(node)));