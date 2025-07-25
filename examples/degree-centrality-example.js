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
console.log('    Alice (degree: 4)');
console.log('   /  |  |  \\');
console.log('  /   |  |   \\');
console.log('Bob   |  |   Eve');
console.log(' |    |  |    |');
console.log(' |    |  |    |');
console.log('Frank |  | David');
console.log('  \\   |  |  /');
console.log('   \\  |  | /');
console.log('   Charlie');

// Calculate degree centrality for undirected graph
console.log('\n1. Degree Centrality (undirected network):');
console.log('In an undirected network, degree centrality measures how many direct connections a node has.');
console.log('Formula: Centrality = degree / (n-1), where n = number of nodes');

const socialCentrality = degreeCentrality(socialNetwork);
console.log('\nDegree centrality scores (normalized 0-1):');
Object.entries(socialCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const degree = socialNetwork.degree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (degree: ${degree}/${socialNetwork.nodes().length - 1})`);
    });

console.log('\nManual calculation example for Alice:');
const aliceDegree = socialNetwork.degree('Alice');
const nodeCount = socialNetwork.nodes().length;
const manualCentrality = aliceDegree / (nodeCount - 1);
console.log(`Alice's degree: ${aliceDegree}, Node count: ${nodeCount}`);
console.log(`Manual calculation: ${aliceDegree}/(${nodeCount}-1) = ${manualCentrality.toFixed(3)}`);
console.log(`Library result: ${socialCentrality['Alice'].toFixed(3)}`);
console.log(`✓ Manual and library results match: ${Math.abs(manualCentrality - socialCentrality['Alice']) < 0.001}`);

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

console.log('Twitter Follow Network (directed):');
console.log('→ means "follows"');
console.log('');
console.log('    Alice (3 followers, follows 2)');
console.log('   ↗  ↑  ↖');
console.log('  /   |   \\');
console.log('Bob ⟷ |    Charlie');
console.log(' ↑    |      ↓');
console.log(' |    |      |');
console.log('Frank |     David');
console.log('  \\   |      ↓');
console.log('   \\  |      |');
console.log('    → Eve ←──┘');

// Calculate different types of degree centrality
console.log('\n2. In-Degree Centrality (followers):');
console.log('In directed networks, in-degree centrality measures incoming connections.');
console.log('This represents influence or popularity (who follows you).');
const inCentrality = degreeCentrality(twitterNetwork, { mode: 'in' });
console.log('\nWho has the most followers:');
Object.entries(inCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const inDegree = twitterNetwork.inDegree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (${inDegree} followers)`);
    });

console.log('\n3. Out-Degree Centrality (following):');
console.log('Out-degree centrality measures outgoing connections.');
console.log('This represents activity or engagement (who you follow).');
const outCentrality = degreeCentrality(twitterNetwork, { mode: 'out' });
console.log('\nWho follows the most people:');
Object.entries(outCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const outDegree = twitterNetwork.outDegree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (follows ${outDegree} people)`);
    });

console.log('\n4. Total Degree Centrality:');
console.log('Total degree centrality combines in-degree and out-degree.');
console.log('This measures overall connectivity and network participation.');
const totalCentrality = degreeCentrality(twitterNetwork, { mode: 'total' });
console.log('\nMost active users (followers + following):');
Object.entries(totalCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, centrality]) => {
        const totalDegree = twitterNetwork.degree(person);
        console.log(`  ${person}: ${centrality.toFixed(3)} (total connections: ${totalDegree})`);
    });

// Weighted network example
console.log('\n\n=== Weighted Network (Collaboration strength) ===');
console.log('In weighted networks, edge weights represent connection strength.');
console.log('Weighted degree centrality sums the weights of connected edges.');
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
console.log('Instead of counting connections, we sum the weights of all edges.');
console.log('This shows not just how many collaborators, but collaboration intensity.');
const weightedCentrality = degreeCentrality(collaborationNetwork, { weighted: true });
console.log('\nCollaboration strength (sum of edge weights):');
Object.entries(weightedCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([researcher, centrality]) => {
        console.log(`  ${researcher}: ${centrality.toFixed(3)}`);
    });

// Verify results
console.log('\n=== Verification ===');
console.log('Mathematical properties of degree centrality:');

// Check normalization
const allNormalized = Object.values(socialCentrality).every(c => c >= 0 && c <= 1);
console.log('✓ All centrality values are normalized (0-1):', allNormalized);

// Check highest degree node
const topNode = Object.entries(socialCentrality).sort((a, b) => b[1] - a[1])[0][0];
console.log(`✓ Alice has highest degree in social network: ${topNode === 'Alice'} (top: ${topNode})`);

// Verify directed graph relationship
const aliceInOut = Math.abs((inCentrality['Alice'] + outCentrality['Alice']) - totalCentrality['Alice']);
console.log('✓ In directed graph: in-degree + out-degree = total degree:', aliceInOut < 0.001);

// Check weighted vs unweighted
const resAWeighted = weightedCentrality['Researcher A'];
const resCWeighted = weightedCentrality['Researcher C'];
console.log(`✓ Weighted centrality reflects edge weights: ${resAWeighted > resCWeighted} (A: ${resAWeighted.toFixed(3)}, C: ${resCWeighted.toFixed(3)})`);

// Verify sum of probabilities in normalized case
const socialSum = Object.values(socialCentrality).reduce((sum, val) => sum + val, 0);
console.log(`✓ Centrality values sum correctly: ${socialSum.toFixed(3)} (expected: varies by normalization)`);

console.log('\nDegree centrality is a fundamental measure of node importance in networks!');
console.log('Higher values indicate more connected (and potentially more important) nodes.');