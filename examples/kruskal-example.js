// Kruskal's Minimum Spanning Tree Algorithm Example
import { Graph, kruskalMST, minimumSpanningTree } from '../dist/algorithms.js';

console.log('=== Kruskal MST Example ===');

// Create a weighted undirected graph representing a network infrastructure
const graph = new Graph();

// Add weighted edges representing cable costs between locations
graph.addEdge('A', 'B', 4);
graph.addEdge('A', 'H', 8);
graph.addEdge('B', 'C', 8);
graph.addEdge('B', 'H', 11);
graph.addEdge('C', 'D', 7);
graph.addEdge('C', 'F', 4);
graph.addEdge('C', 'I', 2);
graph.addEdge('D', 'E', 9);
graph.addEdge('D', 'F', 14);
graph.addEdge('E', 'F', 10);
graph.addEdge('F', 'G', 2);
graph.addEdge('G', 'H', 1);
graph.addEdge('G', 'I', 6);
graph.addEdge('H', 'I', 7);

console.log('Network Infrastructure Graph:');
console.log('    A ----8---- H');
console.log('    |           |\\');
console.log('    4          11 1');
console.log('    |           | \\');
console.log('    B ----8---- C   G----2----F');
console.log('    |           |   |\\        |\\');
console.log('   11           2   6 \\      10 14');
console.log('    |           |   |  \\     |  \\');
console.log('    H ----7---- I   |   2    E   D');
console.log('                    |        |   |');
console.log('                    4        9   7');
console.log('                    |        |   |');
console.log('                    F-------/    |');
console.log('                             \\   |');
console.log('                              \\  |');
console.log('                               \\ |');
console.log('                                \\|');
console.log('                                 C');

// Find the Minimum Spanning Tree using Kruskal's algorithm
console.log('\n1. Minimum Spanning Tree (Kruskal):');
const mst = kruskalMST(graph);
console.log('MST Edges:');
let totalWeight = 0;
const mstEdges = Array.from(mst.edges);
mstEdges
    .sort((a, b) => (a.weight || 0) - (b.weight || 0))
    .forEach(edge => {
        const weight = edge.weight || 0;
        totalWeight += weight;
        console.log(`  ${edge.source} -- ${edge.target}: ${weight}`);
    });

console.log(`\nTotal MST weight: ${totalWeight}`);
console.log(`Number of MST edges: ${mstEdges.length}`);
console.log(`Number of nodes: ${graph.nodeCount}`);

// Alternative function name (alias)
console.log('\n2. Using minimumSpanningTree alias:');
const mst2 = minimumSpanningTree(graph);
console.log('Same result with alias:');
console.log(`MST edges: ${mst2.edges.length}, Total weight: ${Array.from(mst2.edges).reduce((sum, e) => sum + (e.weight || 0), 0)}`);

// Example with a smaller graph to verify step-by-step
console.log('\n3. Small example for verification:');
const smallGraph = new Graph();
smallGraph.addEdge('X', 'Y', 1);
smallGraph.addEdge('Y', 'Z', 2);
smallGraph.addEdge('X', 'Z', 3);

console.log('Small graph edges: X-Y(1), Y-Z(2), X-Z(3)');
const smallMST = kruskalMST(smallGraph);
console.log('Small MST edges:');
Array.from(smallMST.edges).forEach(edge => {
    console.log(`  ${edge.source} -- ${edge.target}: ${edge.weight}`);
});

// Example with equal weights
console.log('\n4. Graph with equal weights:');
const equalGraph = new Graph();
equalGraph.addEdge('P', 'Q', 5);
equalGraph.addEdge('Q', 'R', 5);
equalGraph.addEdge('R', 'S', 5);
equalGraph.addEdge('P', 'S', 5);

const equalMST = kruskalMST(equalGraph);
console.log('Equal weights MST:');
Array.from(equalMST.edges).forEach(edge => {
    console.log(`  ${edge.source} -- ${edge.target}: ${edge.weight}`);
});

// Test efficiency claim
console.log('\n5. Efficiency verification:');
const originalEdges = graph.edgeCount;
const mstEdges2 = mst.edges.length;
const savedEdges = originalEdges - mstEdges2;
console.log(`Original edges: ${originalEdges}`);
console.log(`MST edges: ${mstEdges2}`);
console.log(`Edges saved: ${savedEdges}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ MST should have n-1 edges for n nodes:', 
    mstEdges.length === graph.nodeCount - 1);
console.log('✓ MST should be connected (spanning):', 
    mst.nodeCount === graph.nodeCount);
console.log('✓ Small graph MST should have 2 edges:', 
    smallMST.edges.length === 2);
console.log('✓ Small graph MST weight should be 3 (1+2):', 
    Array.from(smallMST.edges).reduce((sum, e) => sum + (e.weight || 0), 0) === 3);
console.log('✓ Equal weights MST should have 3 edges:', 
    equalMST.edges.length === 3);
console.log('✓ MST and alias should produce same result:', 
    mst.edges.length === mst2.edges.length);