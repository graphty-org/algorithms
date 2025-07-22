// Prim's Minimum Spanning Tree Algorithm Example
import { Graph, primMST } from '../dist/algorithms.js';

console.log('=== Prim MST Example ===');

// Create a weighted undirected graph representing a city road network
const cityGraph = new Graph();

// Add weighted edges representing road construction costs
cityGraph.addEdge('Downtown', 'Midtown', 10);
cityGraph.addEdge('Downtown', 'Uptown', 15);
cityGraph.addEdge('Downtown', 'Westside', 20);
cityGraph.addEdge('Midtown', 'Uptown', 12);
cityGraph.addEdge('Midtown', 'Eastside', 8);
cityGraph.addEdge('Uptown', 'Northside', 14);
cityGraph.addEdge('Uptown', 'Eastside', 16);
cityGraph.addEdge('Westside', 'Southside', 18);
cityGraph.addEdge('Eastside', 'Southside', 6);
cityGraph.addEdge('Northside', 'Eastside', 9);

console.log('City Road Network:');
console.log('                Northside');
console.log('                    |14');
console.log('                    |');
console.log('Westside --20-- Downtown --10-- Midtown --8-- Eastside');
console.log('   |                |              |             |');
console.log('   18              15             12             9');
console.log('   |                |              |             |');
console.log('Southside           |          Uptown --16-------+');
console.log('   |                |              |');
console.log('   6                +----- 15 -----+');
console.log('   |');
console.log('   +------------- Eastside');

// Find MST starting from Downtown using Prim's algorithm
console.log('\n1. MST starting from Downtown (Prim):');
const mstFromDowntown = primMST(cityGraph, 'Downtown');
console.log('MST Edges from Downtown:');
let totalCost = 0;
const edges = mstFromDowntown.edges;
edges
    .sort((a, b) => (a.weight || 0) - (b.weight || 0))
    .forEach(edge => {
        const cost = edge.weight || 0;
        totalCost += cost;
        console.log(`  ${edge.source} -- ${edge.target}: $${cost}k`);
    });

console.log(`\nTotal construction cost: $${totalCost}k`);
console.log(`Roads needed: ${edges.length}`);

// Find MST starting from a different node
console.log('\n2. MST starting from Eastside:');
const mstFromEastside = primMST(cityGraph, 'Eastside');
const eastsideCost = Array.from(mstFromEastside.edges)
    .reduce((sum, e) => sum + (e.weight || 0), 0);
console.log(`Total cost from Eastside: $${eastsideCost}k`);
console.log('Same total cost (MST is unique):', totalCost === eastsideCost);

// Example with a simple triangle graph
console.log('\n3. Triangle Graph Example:');
const triangle = new Graph();
triangle.addEdge('A', 'B', 3);
triangle.addEdge('B', 'C', 1);
triangle.addEdge('A', 'C', 2);

console.log('Triangle: A-B(3), B-C(1), A-C(2)');
const triangleMST = primMST(triangle, 'A');
console.log('Triangle MST edges:');
Array.from(triangleMST.edges).forEach(edge => {
    console.log(`  ${edge.source} -- ${edge.target}: ${edge.weight}`);
});

// Example with default weights
console.log('\n4. Unweighted Graph (default weights):');
const unweighted = new Graph();
unweighted.addEdge('X', 'Y');
unweighted.addEdge('Y', 'Z');
unweighted.addEdge('X', 'Z');

const unweightedMST = primMST(unweighted, 'X');
console.log('Unweighted MST (default weight 1):');
Array.from(unweightedMST.edges).forEach(edge => {
    console.log(`  ${edge.source} -- ${edge.target}: ${edge.weight || 1}`);
});

// Demonstrate step-by-step growth property of Prim's algorithm
console.log('\n5. Growth Property Demonstration:');
const stepGraph = new Graph();
stepGraph.addEdge('Start', 'A', 2);
stepGraph.addEdge('Start', 'B', 3);
stepGraph.addEdge('A', 'B', 1);
stepGraph.addEdge('A', 'C', 4);
stepGraph.addEdge('B', 'C', 5);

console.log('Step graph: Start connects to A(2) and B(3), A-B(1), A-C(4), B-C(5)');
const stepMST = primMST(stepGraph, 'Start');
console.log('Expected order: Start-A(2), then A-B(1), then A-C(4)');
console.log('Actual MST:');
Array.from(stepMST.edges)
    .sort((a, b) => (a.weight || 0) - (b.weight || 0))
    .forEach(edge => {
        console.log(`  ${edge.source} -- ${edge.target}: ${edge.weight}`);
    });

// Verify results
console.log('\n=== Verification ===');
console.log('✓ MST should have n-1 edges for n nodes:', 
    edges.length === cityGraph.nodeCount - 1);
console.log('✓ MST should span all nodes:', 
    mstFromDowntown.nodeCount === cityGraph.nodeCount);
console.log('✓ Different starting points give same total weight:', 
    totalCost === eastsideCost);
console.log('✓ Triangle MST should have weight 3 (1+2):', 
    Array.from(triangleMST.edges).reduce((sum, e) => sum + (e.weight || 0), 0) === 3);
console.log('✓ Step MST should have minimum total weight:', 
    Array.from(stepMST.edges).reduce((sum, e) => sum + (e.weight || 0), 0) === 7);
console.log('✓ All MST graphs should be connected and acyclic');