// Degree Centrality Example
import { Graph, degreeCentrality } from '../dist/algorithms.js';

console.log('=== Degree Centrality Example ===');

// Create an undirected social network graph
const socialNetwork = new Graph();

// Add friendships (undirected edges)
socialNetwork.addEdge('Alice', 'Bob');
socialNetwork.addEdge('Alice', 'Charlie');
socialNetwork.addEdge('Alice', 'David');
socialNetwork.addEdge('Alice', 'Eve');
socialNetwork.addEdge('Bob', 'Charlie');
socialNetwork.addEdge('Bob', 'Frank');
socialNetwork.addEdge('Charlie', 'David');
socialNetwork.addEdge('David', 'Eve');
socialNetwork.addEdge('Eve', 'Frank');

console.log('Social Network (undirected):');
console.log('    Alice');
console.log('   / | | \\');
console.log('  /  | |  \\');
console.log('Bob  | |  Eve');
console.log(' |   | |   |');
console.log('Frank| |  David');
console.log('  \\  | |  /');
console.log('   Charlie');

// Calculate degree centrality for undirected graph
console.log('\n1. Degree Centrality (undirected network):');
const socialCentrality = degreeCentrality(socialNetwork);
console.log('Degree centrality scores:');
Object.entries(socialCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const degree = socialNetwork.degree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (degree: ${degree})`);
    });

// Create a directed graph (Twitter-like follow network)
console.log('\n\n=== Directed Network (Twitter follows) ===');
const twitterNetwork = new Graph({ directed: true });

// Add directed edges (A follows B)
twitterNetwork.addEdge('Alice', 'Bob');      // Alice follows Bob
twitterNetwork.addEdge('Alice', 'Charlie');
twitterNetwork.addEdge('Bob', 'Alice');      // Bob follows Alice (mutual)
twitterNetwork.addEdge('Charlie', 'Alice');
twitterNetwork.addEdge('David', 'Alice');
twitterNetwork.addEdge('Eve', 'Alice');
twitterNetwork.addEdge('Bob', 'Charlie');
twitterNetwork.addEdge('Charlie', 'David');
twitterNetwork.addEdge('David', 'Eve');
twitterNetwork.addEdge('Frank', 'Bob');
twitterNetwork.addEdge('Frank', 'Eve');

console.log('Twitter Follow Network:');
console.log('→ means "follows"');
console.log('Alice ⟷ Bob → Charlie');
console.log('  ↑      ↑       ↓');
console.log('  |      |       ↓');
console.log('Charlie  Frank   David');
console.log('  ↑              ↓');
console.log('  |              ↓');
console.log('David ← Eve ← ─ ┘');

// Calculate different types of degree centrality
console.log('\n2. In-Degree Centrality (followers):');
const inCentrality = degreeCentrality(twitterNetwork, { mode: 'in' });
console.log('Who has the most followers:');
Object.entries(inCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const inDegree = twitterNetwork.inDegree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (${inDegree} followers)`);
    });

console.log('\n3. Out-Degree Centrality (following):');
const outCentrality = degreeCentrality(twitterNetwork, { mode: 'out' });
console.log('Who follows the most people:');
Object.entries(outCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const outDegree = twitterNetwork.outDegree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (follows ${outDegree} people)`);
    });

console.log('\n4. Total Degree Centrality:');
const totalCentrality = degreeCentrality(twitterNetwork, { mode: 'total' });
console.log('Most active users (followers + following):');
Object.entries(totalCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const totalDegree = twitterNetwork.degree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (total connections: ${totalDegree})`);
    });

// Weighted network example
console.log('\n\n=== Weighted Network (Collaboration strength) ===');
const collaborationNetwork = new Graph({ weighted: true });

// Add weighted edges representing collaboration frequency
collaborationNetwork.addEdge('Researcher A', 'Researcher B', 5);
collaborationNetwork.addEdge('Researcher A', 'Researcher C', 3);
collaborationNetwork.addEdge('Researcher B', 'Researcher C', 2);
collaborationNetwork.addEdge('Researcher B', 'Researcher D', 4);
collaborationNetwork.addEdge('Researcher C', 'Researcher D', 1);
collaborationNetwork.addEdge('Researcher D', 'Researcher E', 6);

console.log('Collaboration Network (edge weights = number of papers):');
console.log('A --5-- B');
console.log('|\\      |');
console.log('| 3     4');
console.log('|  \\    |');
console.log('|   C--D');
console.log('|  /  / |');
console.log('| 2  1  6');
console.log('|/  /   |');
console.log('B--´    E');

// Calculate weighted degree centrality
console.log('\n5. Weighted Degree Centrality:');
const weightedCentrality = degreeCentrality(collaborationNetwork, { weighted: true });
console.log('Collaboration strength (sum of edge weights):');
Object.entries(weightedCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([researcher, centrality]) => {
        console.log(`  ${researcher}: ${centrality.toFixed(3)}`);
    });

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Alice should have highest degree in social network:', 
    Object.entries(socialCentrality).sort((a, b) => b[1] - a[1])[0][0] === 'Alice');
console.log('✓ Degree centrality values should be normalized (0-1):', 
    Object.values(socialCentrality).every(c => c >= 0 && c <= 1));
console.log('✓ In directed graph, in-degree + out-degree = total degree:', 
    Math.abs((inCentrality['Alice'] + outCentrality['Alice']) - totalCentrality['Alice']) < 0.001);
console.log('✓ Weighted centrality should reflect edge weights:', 
    weightedCentrality['Researcher D'] > weightedCentrality['Researcher C']);