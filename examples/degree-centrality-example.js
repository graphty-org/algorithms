// Degree Centrality Example
import { Graph, degreeCentrality, inDegreeCentrality } from '../dist/algorithms.js';

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

// Create a directed citation network
const citationNetwork = new Graph({ directed: true });

// Add citations (directed edges: A cites B means A -> B)
citationNetwork.addEdge('Paper1', 'Paper2');
citationNetwork.addEdge('Paper1', 'Paper3');
citationNetwork.addEdge('Paper2', 'Paper3');
citationNetwork.addEdge('Paper2', 'Paper4');
citationNetwork.addEdge('Paper3', 'Paper4');
citationNetwork.addEdge('Paper4', 'Paper5');
citationNetwork.addEdge('Paper5', 'Paper3');
citationNetwork.addEdge('Paper6', 'Paper3');
citationNetwork.addEdge('Paper6', 'Paper4');

console.log('\n2. Citation Network (directed):');
console.log('Paper1 -> Paper2 -> Paper4 -> Paper5');
console.log('   |        |        ^        |');
console.log('   v        v        |        v');
console.log('Paper3 <----+--------+    Paper3');
console.log('   ^                     (cycle)');
console.log('   |');
console.log('Paper6');

// Calculate out-degree centrality (how many papers this paper cites)
console.log('\n3. Out-Degree Centrality (citation activity):');
const outDegreeCentrality = degreeCentrality(citationNetwork);
console.log('Out-degree centrality (citing papers):');
Object.entries(outDegreeCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([paper, centrality]) => {
        const outDegree = citationNetwork.outDegree(paper);
        console.log(`  ${paper}: ${centrality.toFixed(3)} (out-degree: ${outDegree})`);
    });

// Calculate in-degree centrality (how many papers cite this paper)
console.log('\n4. In-Degree Centrality (citation impact):');
const inDegreeCentrality = inDegreeCentrality(citationNetwork);
console.log('In-degree centrality (cited papers):');
Object.entries(inDegreeCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([paper, centrality]) => {
        const inDegree = citationNetwork.inDegree(paper);
        console.log(`  ${paper}: ${centrality.toFixed(3)} (in-degree: ${inDegree})`);
    });

// Normalized degree centrality
console.log('\n5. Normalized Degree Centrality:');
const normalizedCentrality = degreeCentrality(socialNetwork, { normalized: true });
console.log('Normalized centrality (max possible connections):');
Object.entries(normalizedCentrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([person, centrality]) => {
        console.log(`  ${person}: ${centrality.toFixed(3)}`);
    });

// Verify results
console.log('\n=== Verification ===');
const maxSocialCentrality = Math.max(...Object.values(socialCentrality));
const mostConnectedPerson = Object.entries(socialCentrality)
    .find(([, centrality]) => centrality === maxSocialCentrality)[0];
console.log('✓ Most connected person in social network:', mostConnectedPerson);
console.log('✓ Alice should have high centrality (4 connections):', 
    socialCentrality.Alice >= 0.6);
console.log('✓ Paper3 should have high in-degree (most cited):', 
    inDegreeCentrality.Paper3 > 0.3);
console.log('✓ Normalized centrality should be ≤ 1.0:', 
    Object.values(normalizedCentrality).every(c => c <= 1.0));