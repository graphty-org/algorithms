// Common Neighbors Link Prediction Example
import { Graph, commonNeighborsScore, commonNeighborsPrediction, commonNeighborsForPairs } from '../dist/algorithms.js';

console.log('=== Common Neighbors Link Prediction Example ===');

// Create a social network
const socialNetwork = new Graph();

// Add existing friendships
const friendships = [
    ['Alice', 'Bob'],
    ['Alice', 'Charlie'],
    ['Alice', 'David'],
    ['Bob', 'Charlie'],
    ['Bob', 'Eve'],
    ['Charlie', 'David'],
    ['Charlie', 'Frank'],
    ['David', 'Frank'],
    ['David', 'Grace'],
    ['Eve', 'Frank'],
    ['Frank', 'Grace'],
    ['Grace', 'Henry'],
    ['Henry', 'Ivan'],
    ['Ivan', 'Julia']
];

friendships.forEach(([person1, person2]) => {
    socialNetwork.addEdge(person1, person2);
});

console.log('Social Network Structure:');
console.log('    Alice---Bob---Eve');
console.log('     | \\    |     |');
console.log('     |  \\   |     |');
console.log('  David--Charlie--Frank');
console.log('     |              |');
console.log('     |              |');
console.log('   Grace-----------+');
console.log('     |');
console.log('   Henry---Ivan---Julia');

// Test specific pairs
console.log('\n1. Common Neighbors for Specific Pairs:');

const testPairs = [
    ['Alice', 'Eve'],      // Should connect through Bob
    ['Alice', 'Frank'],    // Should connect through Charlie and David
    ['Eve', 'Grace'],      // Should connect through Frank
    ['Henry', 'Julia'],    // Should connect through Ivan
    ['Alice', 'Julia']     // No common neighbors
];

testPairs.forEach(([person1, person2]) => {
    const score = commonNeighborsScore(socialNetwork, person1, person2);
    console.log(`\n${person1} - ${person2}:`);
    console.log(`  Score: ${score}`);
    
    // To find the actual common neighbors, we need to compute them manually
    const neighbors1 = new Set(socialNetwork.neighbors(person1));
    const neighbors2 = new Set(socialNetwork.neighbors(person2));
    const common = Array.from(neighbors1).filter(n => neighbors2.has(n));
    console.log(`  Common neighbors: ${common.length > 0 ? common.join(', ') : 'None'}`);
});

// Find all potential connections
console.log('\n\n2. Top Link Predictions for Entire Network:');
const allPredictions = commonNeighborsPrediction(socialNetwork);

// Sort by score and show top predictions
const topPredictions = allPredictions
    .filter(pred => pred.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

console.log('\nTop 10 predicted connections:');
console.log('Rank | Pair                  | Common Neighbors | Score');
console.log('-----|----------------------|------------------|------');
topPredictions.forEach((pred, idx) => {
    const neighbors1 = new Set(socialNetwork.neighbors(pred.source));
    const neighbors2 = new Set(socialNetwork.neighbors(pred.target));
    const common = Array.from(neighbors1).filter(n => neighbors2.has(n));
    const pair = `${pred.source}-${pred.target}`;
    console.log(`${(idx + 1).toString().padEnd(4)} | ${pair.padEnd(20)} | ${common.join(', ').padEnd(16)} | ${pred.score}`);
});

// Create a research collaboration network
console.log('\n\n3. Research Collaboration Network:');
const researchNetwork = new Graph();

// Research groups
const aiGroup = ['AI_Prof', 'AI_PostDoc', 'AI_PhD1', 'AI_PhD2'];
const bioGroup = ['Bio_Prof', 'Bio_PostDoc', 'Bio_PhD1', 'Bio_PhD2'];
const csGroup = ['CS_Prof', 'CS_PostDoc', 'CS_PhD1'];

// Add collaborations within groups
aiGroup.forEach((person1, i) => {
    aiGroup.slice(i + 1).forEach(person2 => {
        if (!person1.includes('PhD') || !person2.includes('PhD')) {
            researchNetwork.addEdge(person1, person2);
        }
    });
});

bioGroup.forEach((person1, i) => {
    bioGroup.slice(i + 1).forEach(person2 => {
        if (!person1.includes('PhD') || !person2.includes('PhD')) {
            researchNetwork.addEdge(person1, person2);
        }
    });
});

csGroup.forEach((person1, i) => {
    csGroup.slice(i + 1).forEach(person2 => {
        researchNetwork.addEdge(person1, person2);
    });
});

// Add some cross-group collaborations
researchNetwork.addEdge('AI_Prof', 'CS_Prof');
researchNetwork.addEdge('AI_PostDoc', 'Bio_PostDoc');
researchNetwork.addEdge('CS_Prof', 'Bio_Prof');

console.log('Research Groups:');
console.log('- AI Group: Professor, PostDoc, 2 PhD students');
console.log('- Bio Group: Professor, PostDoc, 2 PhD students');
console.log('- CS Group: Professor, PostDoc, 1 PhD student');
console.log('\nExisting cross-group collaborations:');
console.log('- AI_Prof ↔ CS_Prof');
console.log('- AI_PostDoc ↔ Bio_PostDoc');
console.log('- CS_Prof ↔ Bio_Prof');

// Predict future collaborations
console.log('\n4. Predicted Research Collaborations:');
const researchPredictions = commonNeighborsPrediction(researchNetwork);

const topResearch = researchPredictions
    .filter(pred => pred.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

console.log('\nTop 5 predicted collaborations:');
topResearch.forEach((pred) => {
    const neighbors1 = new Set(researchNetwork.neighbors(pred.source));
    const neighbors2 = new Set(researchNetwork.neighbors(pred.target));
    const common = Array.from(neighbors1).filter(n => neighbors2.has(n));
    console.log(`\n${pred.source} ↔ ${pred.target}:`);
    console.log(`  Common collaborators: ${common.join(', ')}`);
    console.log(`  Likelihood score: ${pred.score}`);
});

// Test on a dating app scenario
console.log('\n\n5. Dating App Friend-of-Friend Suggestions:');
const datingNetwork = new Graph();

// Create user connections (mutual friends)
const users = {
    'Alex': ['Blake', 'Casey', 'Drew'],
    'Blake': ['Alex', 'Casey', 'Emery', 'Finley'],
    'Casey': ['Alex', 'Blake', 'Drew', 'Emery'],
    'Drew': ['Alex', 'Casey', 'Finley'],
    'Emery': ['Blake', 'Casey', 'Finley', 'Gray'],
    'Finley': ['Blake', 'Drew', 'Emery', 'Gray'],
    'Gray': ['Emery', 'Finley', 'Harper'],
    'Harper': ['Gray', 'Indigo'],
    'Indigo': ['Harper']
};

// Add edges
Object.entries(users).forEach(([user, friends]) => {
    friends.forEach(friend => {
        if (!datingNetwork.hasEdge(user, friend)) {
            datingNetwork.addEdge(user, friend);
        }
    });
});

// Find matches for Alex
console.log('Finding potential matches for Alex based on mutual friends:');
const alexPredictions = new Map();

datingNetwork.nodes().forEach(node => {
    const nodeId = node.id;
    if (nodeId !== 'Alex' && !datingNetwork.hasEdge('Alex', nodeId)) {
        const score = commonNeighborsScore(datingNetwork, 'Alex', nodeId);
        if (score > 0) {
            alexPredictions.set(nodeId, score);
        }
    }
});

console.log('\nPotential matches for Alex:');
Array.from(alexPredictions.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([match, score]) => {
        const neighbors1 = new Set(datingNetwork.neighbors('Alex'));
        const neighbors2 = new Set(datingNetwork.neighbors(match));
        const mutualFriends = Array.from(neighbors1).filter(n => neighbors2.has(n));
        console.log(`  ${match}: ${score} mutual friends (${mutualFriends.join(', ')})`);
    });

// Analyze prediction accuracy
console.log('\n\n6. Prediction Accuracy Analysis:');

// Remove some edges to simulate incomplete data
const testGraph = new Graph();
const removedEdges = [];

// Copy graph but remove 20% of edges
let edgeCount = 0;
socialNetwork.edges().forEach(edge => {
    if (Math.random() < 0.8) {
        testGraph.addEdge(edge.source, edge.target);
    } else {
        removedEdges.push([edge.source, edge.target]);
    }
    edgeCount++;
});

console.log(`Removed ${removedEdges.length} edges from original network`);
console.log('Testing if common neighbors can predict these missing links...');

// Get predictions on test graph
const predictions = commonNeighborsPrediction(testGraph);

// Check how many removed edges were predicted
let correctPredictions = 0;
removedEdges.forEach(([u, v]) => {
    const predicted = predictions.some(pred => 
        (pred.source === u && pred.target === v) || 
        (pred.source === v && pred.target === u)
    );
    if (predicted) correctPredictions++;
});

console.log(`\nPredicted ${correctPredictions} out of ${removedEdges.length} removed edges`);
console.log(`Accuracy: ${((correctPredictions / removedEdges.length) * 100).toFixed(1)}%`);

// Compare with random baseline
const nonEdges = [];
testGraph.nodes().forEach(node1 => {
    testGraph.nodes().forEach(node2 => {
        if (node1.id < node2.id && !testGraph.hasEdge(node1.id, node2.id)) {
            nonEdges.push([node1.id, node2.id]);
        }
    });
});

const randomCorrect = removedEdges.length / nonEdges.length;
console.log(`Random baseline accuracy: ${(randomCorrect * 100).toFixed(1)}%`);
console.log(`Improvement over random: ${(((correctPredictions / removedEdges.length) / randomCorrect - 1) * 100).toFixed(1)}%`);

// Test threshold analysis
console.log('\n\n7. Score Threshold Analysis:');

const allScores = predictions.map(pred => pred.score).filter(s => s > 0);
const thresholds = [1, 2, 3, 4];

console.log('Threshold | Predictions | % of Total Pairs');
console.log('----------|-------------|----------------');
thresholds.forEach(threshold => {
    const count = allScores.filter(s => s >= threshold).length;
    const percentage = (count / nonEdges.length * 100).toFixed(1);
    console.log(`    ${threshold}     | ${count.toString().padEnd(11)} | ${percentage}%`);
});

// Verify results
console.log('\n=== Verification ===');
const aliceNeighbors = new Set(socialNetwork.neighbors('Alice'));
const eveNeighbors = new Set(socialNetwork.neighbors('Eve'));
const aliceEveCommon = Array.from(aliceNeighbors).filter(n => eveNeighbors.has(n));
console.log('✓ Common neighbors correctly identified for Alice-Eve:', 
    aliceEveCommon.includes('Bob'));
console.log('✓ Score equals number of common neighbors:', 
    commonNeighborsScore(socialNetwork, 'Alice', 'Frank') === 2);
console.log('✓ No common neighbors returns score 0:', 
    commonNeighborsScore(socialNetwork, 'Alice', 'Julia') === 0);
console.log('✓ All predictions have non-negative scores:', 
    allPredictions.every(pred => pred.score >= 0));
console.log('✓ Method outperforms random baseline:', 
    correctPredictions / removedEdges.length > randomCorrect);