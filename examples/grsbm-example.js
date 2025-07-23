// GRSBM (Greedy Recursive Spectral Bisection with Modularity) Example
import { Graph, grsbm } from '../dist/algorithms.js';

console.log('=== GRSBM Hierarchical Community Detection Example ===');

// Create a network with hierarchical community structure
const hierarchicalNetwork = new Graph();

// Top-level Community A
// Sub-community A1: Academic Research
hierarchicalNetwork.addEdge('Prof_Smith', 'Dr_Jones', 5);
hierarchicalNetwork.addEdge('Prof_Smith', 'Dr_Brown', 4);
hierarchicalNetwork.addEdge('Dr_Jones', 'Dr_Brown', 4);
hierarchicalNetwork.addEdge('Dr_Jones', 'PhD_Alice', 3);
hierarchicalNetwork.addEdge('Dr_Brown', 'PhD_Bob', 3);

// Sub-community A2: Lab Technicians
hierarchicalNetwork.addEdge('Tech_Carol', 'Tech_David', 5);
hierarchicalNetwork.addEdge('Tech_Carol', 'Tech_Eve', 4);
hierarchicalNetwork.addEdge('Tech_David', 'Tech_Eve', 4);

// Bridge within Community A
hierarchicalNetwork.addEdge('Dr_Brown', 'Tech_Carol', 2);
hierarchicalNetwork.addEdge('PhD_Alice', 'Tech_David', 2);

// Top-level Community B
// Sub-community B1: Engineering Team
hierarchicalNetwork.addEdge('Eng_Frank', 'Eng_Grace', 5);
hierarchicalNetwork.addEdge('Eng_Frank', 'Eng_Henry', 4);
hierarchicalNetwork.addEdge('Eng_Grace', 'Eng_Henry', 4);

// Sub-community B2: Design Team
hierarchicalNetwork.addEdge('Des_Ivy', 'Des_Jack', 5);
hierarchicalNetwork.addEdge('Des_Ivy', 'Des_Kate', 4);
hierarchicalNetwork.addEdge('Des_Jack', 'Des_Kate', 4);

// Bridge within Community B
hierarchicalNetwork.addEdge('Eng_Henry', 'Des_Ivy', 2);

// Weak bridge between top-level communities
hierarchicalNetwork.addEdge('PhD_Bob', 'Eng_Frank', 1);

console.log('Hierarchical Network Structure:');
console.log('Community A:');
console.log('  - Sub-community A1: Academic Research (Prof_Smith, Dr_Jones, Dr_Brown, PhD_Alice, PhD_Bob)');
console.log('  - Sub-community A2: Lab Technicians (Tech_Carol, Tech_David, Tech_Eve)');
console.log('Community B:');
console.log('  - Sub-community B1: Engineering Team (Eng_Frank, Eng_Grace, Eng_Henry)');
console.log('  - Sub-community B2: Design Team (Des_Ivy, Des_Jack, Des_Kate)');

// Run GRSBM hierarchical clustering
console.log('\n1. Basic GRSBM Hierarchical Clustering:');
const result = grsbm(hierarchicalNetwork);

console.log(`Number of final clusters: ${result.numClusters}`);
console.log(`Modularity scores at each level: [${result.modularityScores.map(s => s.toFixed(3)).join(', ')}]`);

console.log('\nCluster assignments:');
const clusterMembers = new Map();
for (const [nodeId, clusterId] of result.clusters) {
    if (!clusterMembers.has(clusterId)) {
        clusterMembers.set(clusterId, []);
    }
    clusterMembers.get(clusterId).push(nodeId);
}

for (const [clusterId, members] of clusterMembers) {
    console.log(`Cluster ${clusterId}: [${members.sort().join(', ')}]`);
}

console.log('\nCluster explanations:');
result.explanation.forEach((exp, index) => {
    console.log(`\nSplit ${index + 1}:`);
    console.log(`  Cluster: ${exp.clusterId}`);
    console.log(`  Reason: ${exp.reason}`);
    console.log(`  Modularity improvement: ${exp.modularityImprovement.toFixed(4)}`);
    console.log(`  Key nodes: [${exp.keyNodes.slice(0, 3).join(', ')}]`);
});

// Run with different parameters
console.log('\n2. GRSBM with limited depth:');
const shallowResult = grsbm(hierarchicalNetwork, { maxDepth: 2 });
console.log(`Clusters with maxDepth=2: ${shallowResult.numClusters}`);

console.log('\n3. GRSBM with larger minimum cluster size:');
const largeMinResult = grsbm(hierarchicalNetwork, { minClusterSize: 4 });
console.log(`Clusters with minClusterSize=4: ${largeMinResult.numClusters}`);

// Test on a star graph (should not split much)
console.log('\n4. Star Graph Test:');
const starGraph = new Graph();
const center = 'Center';
for (let i = 1; i <= 10; i++) {
    starGraph.addEdge(center, `Node${i}`, 1);
}

const starResult = grsbm(starGraph);
console.log(`Star graph clusters: ${starResult.numClusters}`);
console.log(`Star graph final modularity: ${starResult.modularityScores[starResult.modularityScores.length - 1].toFixed(3)}`);

// Test with custom spectral parameters
console.log('\n5. Custom spectral parameters:');
const customResult = grsbm(hierarchicalNetwork, {
    numEigenvectors: 3,
    tolerance: 1e-8,
    maxIterations: 200,
    seed: 123
});
console.log(`Custom parameters iterations: ${customResult.explanation.length}`);
console.log(`Final modularity: ${customResult.modularityScores[customResult.modularityScores.length - 1].toFixed(4)}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Should find multiple clusters:', result.numClusters > 1);
console.log('✓ Modularity should improve with splits:', 
    result.modularityScores.length > 1 && 
    result.modularityScores[result.modularityScores.length - 1] >= result.modularityScores[0]);
console.log('✓ All nodes should be assigned:', 
    result.clusters.size === hierarchicalNetwork.nodeCount);
console.log('✓ Explanations should be provided:', 
    result.explanation.length > 0);
console.log('✓ Limited depth should produce fewer clusters:', 
    shallowResult.numClusters <= result.numClusters);
console.log('✓ Larger minimum size should produce fewer clusters:', 
    largeMinResult.numClusters <= result.numClusters);

// Analyze hierarchical structure
function printHierarchy(cluster, indent = '') {
    console.log(`${indent}Cluster ${cluster.id}: ${cluster.members.size} nodes`);
    if (cluster.left) {
        printHierarchy(cluster.left, indent + '  ');
    }
    if (cluster.right) {
        printHierarchy(cluster.right, indent + '  ');
    }
}

console.log('\nHierarchical structure:');
printHierarchy(result.root);