// Graph Isomorphism Example
import { Graph, isGraphIsomorphic, findAllIsomorphisms } from '../dist/algorithms.js';

console.log('=== Graph Isomorphism Example ===');

// Create two isomorphic graphs with different node labels
console.log('1. Testing Isomorphic Graphs (Same Structure, Different Labels):');

// Graph 1: Square with diagonal
const graph1 = new Graph();
graph1.addEdge('A', 'B');
graph1.addEdge('B', 'C');
graph1.addEdge('C', 'D');
graph1.addEdge('D', 'A');
graph1.addEdge('A', 'C'); // Diagonal

// Graph 2: Same structure but different labels
const graph2 = new Graph();
graph2.addEdge('X', 'Y');
graph2.addEdge('Y', 'Z');
graph2.addEdge('Z', 'W');
graph2.addEdge('W', 'X');
graph2.addEdge('X', 'Z'); // Diagonal

console.log('\nGraph 1:');
console.log('A---B');
console.log('|\\  |');
console.log('| \\ |');
console.log('|  \\|');
console.log('D---C');

console.log('\nGraph 2:');
console.log('X---Y');
console.log('|\\  |');
console.log('| \\ |');
console.log('|  \\|');
console.log('W---Z');

// Check isomorphism
const result1 = isGraphIsomorphic(graph1, graph2);
console.log(`\nAre graphs isomorphic? ${result1}`);

if (result1) {
    const mappings = findAllIsomorphisms(graph1, graph2);
    console.log('\nNode mapping (first found):');
    if (mappings && mappings.length > 0) {
        mappings[0].forEach((v, k) => {
            console.log(`  ${k} → ${v}`);
        });
    }
}

// Create two non-isomorphic graphs
console.log('\n\n2. Testing Non-Isomorphic Graphs:');

// Graph 3: Triangle
const graph3 = new Graph();
graph3.addEdge('P', 'Q');
graph3.addEdge('Q', 'R');
graph3.addEdge('R', 'P');

// Graph 4: Path
const graph4 = new Graph();
graph4.addEdge('S', 'T');
graph4.addEdge('T', 'U');
graph4.addEdge('U', 'V');

console.log('\nGraph 3 (Triangle):');
console.log('  P');
console.log(' / \\');
console.log('Q---R');

console.log('\nGraph 4 (Path):');
console.log('S---T---U---V');

const result2 = isGraphIsomorphic(graph3, graph4);
console.log(`\nAre graphs isomorphic? ${result2}`);

// Test with directed graphs
console.log('\n\n3. Testing Directed Graph Isomorphism:');

// Directed graph 1
const directed1 = new Graph({ directed: true });
directed1.addEdge('A', 'B');
directed1.addEdge('B', 'C');
directed1.addEdge('C', 'A');
directed1.addEdge('A', 'D');
directed1.addEdge('D', 'C');

// Directed graph 2 (isomorphic)
const directed2 = new Graph({ directed: true });
directed2.addEdge('1', '2');
directed2.addEdge('2', '3');
directed2.addEdge('3', '1');
directed2.addEdge('1', '4');
directed2.addEdge('4', '3');

console.log('\nDirected Graph 1:');
console.log('A → B');
console.log('↓ ↘ ↓');
console.log('D → C');
console.log('↑___↙');

console.log('\nDirected Graph 2:');
console.log('1 → 2');
console.log('↓ ↘ ↓');
console.log('4 → 3');
console.log('↑___↙');

const result3 = isGraphIsomorphic(directed1, directed2);
console.log(`\nAre directed graphs isomorphic? ${result3}`);

if (result3) {
    const mappings = findAllIsomorphisms(directed1, directed2);
    console.log('\nNode mapping:');
    if (mappings && mappings.length > 0) {
        mappings[0].forEach((v, k) => {
            console.log(`  ${k} → ${v}`);
        });
    }
}

// Test with weighted graphs
console.log('\n\n4. Testing Weighted Graph Isomorphism:');

// Weighted graph 1
const weighted1 = new Graph();
weighted1.addEdge('A', 'B', 1);
weighted1.addEdge('B', 'C', 2);
weighted1.addEdge('C', 'D', 3);
weighted1.addEdge('D', 'A', 4);

// Weighted graph 2 (isomorphic with same weights)
const weighted2 = new Graph();
weighted2.addEdge('W', 'X', 1);
weighted2.addEdge('X', 'Y', 2);
weighted2.addEdge('Y', 'Z', 3);
weighted2.addEdge('Z', 'W', 4);

// Weighted graph 3 (same structure, different weights)
const weighted3 = new Graph();
weighted3.addEdge('P', 'Q', 2);
weighted3.addEdge('Q', 'R', 3);
weighted3.addEdge('R', 'S', 4);
weighted3.addEdge('S', 'P', 1);

console.log('\nWeighted Graph 1:');
console.log('A-1-B');
console.log('|   |');
console.log('4   2');
console.log('|   |');
console.log('D-3-C');

console.log('\nWeighted Graph 2 (same weights):');
console.log('W-1-X');
console.log('|   |');
console.log('4   2');
console.log('|   |');
console.log('Z-3-Y');

console.log('\nWeighted Graph 3 (different weights):');
console.log('P-2-Q');
console.log('|   |');
console.log('1   3');
console.log('|   |');
console.log('S-4-R');

const result4 = isGraphIsomorphic(weighted1, weighted2, { considerWeights: true });
const result5 = isGraphIsomorphic(weighted1, weighted3, { considerWeights: true });
const result6 = isGraphIsomorphic(weighted1, weighted3, { considerWeights: false });

console.log(`\nWeighted1 ≅ Weighted2 (with weights)? ${result4}`);
console.log(`Weighted1 ≅ Weighted3 (with weights)? ${result5}`);
console.log(`Weighted1 ≅ Weighted3 (ignoring weights)? ${result6}`);

// Real-world example: Chemical structures
console.log('\n\n5. Chemical Structure Isomorphism:');

// Benzene ring (different representations)
const benzene1 = new Graph();
['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].forEach((carbon, i) => {
    const next = i === 5 ? 'C1' : `C${i + 2}`;
    benzene1.addEdge(carbon, next);
});

const benzene2 = new Graph();
['A', 'B', 'C', 'D', 'E', 'F'].forEach((carbon, i) => {
    const next = i === 5 ? 'A' : String.fromCharCode(65 + i + 1);
    benzene2.addEdge(carbon, next);
});

console.log('\nBenzene Ring 1:');
console.log('  C1---C2');
console.log(' /       \\');
console.log('C6       C3');
console.log(' \\       /');
console.log('  C5---C4');

console.log('\nBenzene Ring 2:');
console.log('  A---B');
console.log(' /     \\');
console.log('F       C');
console.log(' \\     /');
console.log('  E---D');

const benzeneResult = isGraphIsomorphic(benzene1, benzene2);
console.log(`\nAre benzene representations isomorphic? ${benzeneResult}`);

// Test subgraph isomorphism
console.log('\n\n6. Subgraph Isomorphism:');

// Large graph
const largeGraph = new Graph();
largeGraph.addEdge('A', 'B');
largeGraph.addEdge('B', 'C');
largeGraph.addEdge('C', 'D');
largeGraph.addEdge('D', 'A');
largeGraph.addEdge('A', 'E');
largeGraph.addEdge('E', 'F');
largeGraph.addEdge('F', 'B');

// Pattern to find (triangle)
const pattern = new Graph();
pattern.addEdge('X', 'Y');
pattern.addEdge('Y', 'Z');
pattern.addEdge('Z', 'X');

console.log('\nLarge Graph:');
console.log('E---F');
console.log('|   |');
console.log('A---B');
console.log('|   |');
console.log('D---C');

console.log('\nPattern (Triangle):');
console.log('  X');
console.log(' / \\');
console.log('Y---Z');

// Note: This would require a subgraph isomorphism function
console.log('\n(Subgraph isomorphism would find triangles A-E-F and A-B-F in the large graph)');

// Performance test with larger graphs
console.log('\n\n7. Performance Test:');

// Create two larger isomorphic graphs
const perf1 = new Graph();
const perf2 = new Graph();

const n = 10; // Number of nodes
console.log(`\nTesting with ${n}-node graphs...`);

// Create a specific structure
for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
        if ((i + j) % 3 === 0) { // Deterministic edge creation
            perf1.addEdge(`N${i}`, `N${j}`);
            perf2.addEdge(`M${i}`, `M${j}`);
        }
    }
}

const start = Date.now();
const perfResult = isGraphIsomorphic(perf1, perf2);
const time = Date.now() - start;

console.log(`Graphs with ${perf1.nodeCount} nodes and ${perf1.edgeCount} edges`);
console.log(`Isomorphic? ${perfResult}`);
console.log(`Time taken: ${time}ms`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Square graphs are isomorphic:', result1);
console.log('✓ Triangle and path are not isomorphic:', !result2);
console.log('✓ Directed cycle graphs are isomorphic:', result3);
console.log('✓ Same weighted graphs are isomorphic:', result4);
console.log('✓ Different weighted graphs not isomorphic (with weights):', !result5);
console.log('✓ Different weighted graphs are isomorphic (ignoring weights):', result6);