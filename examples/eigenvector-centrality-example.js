// Eigenvector Centrality Example
import { Graph, eigenvectorCentrality } from '../dist/algorithms.js';

console.log('=== Eigenvector Centrality Example ===');

// Create a social influence network
const influenceNetwork = new Graph();

// Add edges representing influence relationships
// Core influencers connected to each other
influenceNetwork.addEdge('Celebrity', 'Politician');
influenceNetwork.addEdge('Celebrity', 'CEO');
influenceNetwork.addEdge('Politician', 'CEO');

// Celebrity has many followers
influenceNetwork.addEdge('Celebrity', 'Fan1');
influenceNetwork.addEdge('Celebrity', 'Fan2');
influenceNetwork.addEdge('Celebrity', 'Fan3');
influenceNetwork.addEdge('Celebrity', 'Journalist');

// Politician has institutional connections
influenceNetwork.addEdge('Politician', 'Advisor');
influenceNetwork.addEdge('Politician', 'Journalist');
influenceNetwork.addEdge('Advisor', 'Analyst');

// CEO has business connections
influenceNetwork.addEdge('CEO', 'Manager');
influenceNetwork.addEdge('Manager', 'Employee1');
influenceNetwork.addEdge('Manager', 'Employee2');

// Journalist is a bridge node
influenceNetwork.addEdge('Journalist', 'Editor');
influenceNetwork.addEdge('Editor', 'Reporter');

console.log('Social Influence Network:');
console.log('                Celebrity');
console.log('              /    |    \\');
console.log('            /      |      \\');
console.log('      Politician---+---CEO');
console.log('        /  \\       |     \\');
console.log('   Advisor  \\      |      Manager');
console.log('      |      \\     |        / \\');
console.log('   Analyst  Journalist    /   \\');
console.log('              |          /     \\');
console.log('            Editor   Employee1  Employee2');
console.log('              |');
console.log('           Reporter');
console.log('');
console.log('Fans: Fan1, Fan2, Fan3 (connected to Celebrity)');

// Calculate eigenvector centrality
console.log('\n1. Eigenvector Centrality (influence based on influential connections):');
const eigCentrality = eigenvectorCentrality(influenceNetwork);

console.log('\nEigenvector centrality scores:');
Object.entries(eigCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const degree = influenceNetwork.degree(person);
        console.log(`  ${person}: ${centrality.toFixed(4)} (degree: ${degree})`);
    });

// Compare with degree centrality
console.log('\n2. Comparison with Degree Centrality:');
const { degreeCentrality } = await import('../dist/algorithms.js');
const degCentrality = degreeCentrality(influenceNetwork);

console.log('\nNode Rankings Comparison:');
console.log('Rank | Eigenvector Centrality | Degree Centrality');
console.log('-----|----------------------|------------------');

const eigRanking = Object.entries(eigCentrality)
    .sort((a, b) => b[1] - a[1])
    .map(([node]) => node);

const degRanking = Object.entries(degCentrality)
    .sort((a, b) => b[1] - a[1])
    .map(([node]) => node);

for (let i = 0; i < Math.min(5, eigRanking.length); i++) {
    console.log(`  ${i + 1}  | ${eigRanking[i].padEnd(20)} | ${degRanking[i]}`);
}

// Create a directed network (citation network)
console.log('\n\n=== Directed Network (Academic Citations) ===');
const citationNetwork = new Graph({ directed: true });

// Foundational papers
citationNetwork.addEdge('Paper2', 'Paper1');  // Paper2 cites Paper1
citationNetwork.addEdge('Paper3', 'Paper1');
citationNetwork.addEdge('Paper4', 'Paper1');
citationNetwork.addEdge('Paper5', 'Paper2');
citationNetwork.addEdge('Paper6', 'Paper2');
citationNetwork.addEdge('Paper7', 'Paper3');
citationNetwork.addEdge('Paper8', 'Paper3');
citationNetwork.addEdge('Paper9', 'Paper4');
citationNetwork.addEdge('Paper10', 'Paper5');
citationNetwork.addEdge('Paper10', 'Paper6');

console.log('Citation Network (arrows point to cited papers):');
console.log('         Paper1');
console.log('       /   |   \\');
console.log('      /    |    \\');
console.log('  Paper2 Paper3 Paper4');
console.log('   / \\    / \\     |');
console.log('  /   \\  /   \\    |');
console.log('Paper5 Paper6 Paper7 Paper8 Paper9');
console.log('  \\   /');
console.log('   \\ /');
console.log(' Paper10');

// Calculate eigenvector centrality for directed graph
console.log('\n3. Eigenvector Centrality (citation influence):');
const citationEigCentrality = eigenvectorCentrality(citationNetwork);

console.log('\nMost influential papers (by eigenvector centrality):');
Object.entries(citationEigCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([paper, centrality]) => {
        const citations = citationNetwork.inDegree(paper);
        console.log(`  ${paper}: ${centrality.toFixed(4)} (${citations} citations)`);
    });

// Test convergence with different parameters
console.log('\n\n=== Testing Convergence Parameters ===');
const testGraph = new Graph();

// Create a small test network
['A', 'B', 'C', 'D', 'E'].forEach(node => {
    testGraph.addNode(node);
});
testGraph.addEdge('A', 'B');
testGraph.addEdge('B', 'C');
testGraph.addEdge('C', 'D');
testGraph.addEdge('D', 'E');
testGraph.addEdge('E', 'A');
testGraph.addEdge('C', 'A');

console.log('\n4. Testing with different iteration limits:');
const iterations = [10, 50, 100, 500];
for (const maxIter of iterations) {
    const result = eigenvectorCentrality(testGraph, { maxIterations: maxIter });
    console.log(`\nMax iterations: ${maxIter}`);
    console.log(`  Node A centrality: ${result['A'].toFixed(6)}`);
}

// Verify properties
console.log('\n=== Verification ===');
console.log('✓ Celebrity should have high eigenvector centrality:', 
    eigRanking.slice(0, 3).includes('Celebrity'));
console.log('✓ Paper1 should have highest centrality in citation network:', 
    Object.entries(citationEigCentrality).sort((a, b) => b[1] - a[1])[0][0] === 'Paper1');
console.log('✓ All centrality values should be between 0 and 1:', 
    Object.values(eigCentrality).every(c => c >= 0 && c <= 1));
console.log('✓ Sum of squared centralities should be approximately 1:', 
    Math.abs(Object.values(eigCentrality).reduce((sum, c) => sum + c * c, 0) - 1) < 0.01);