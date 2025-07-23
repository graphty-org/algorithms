// Spectral Clustering Example
import { Graph, spectralClustering } from '../dist/algorithms.js';

console.log('=== Spectral Clustering Example ===');

// Create a graph with clear community structure
const socialNetwork = new Graph();

// Community 1: Close friends group
const community1 = ['Alice', 'Bob', 'Charlie', 'David'];
// Add dense connections within community 1
for (let i = 0; i < community1.length; i++) {
    for (let j = i + 1; j < community1.length; j++) {
        socialNetwork.addEdge(community1[i], community1[j]);
    }
}

// Community 2: Work colleagues
const community2 = ['Eve', 'Frank', 'Grace', 'Henry'];
// Add dense connections within community 2
for (let i = 0; i < community2.length; i++) {
    for (let j = i + 1; j < community2.length; j++) {
        socialNetwork.addEdge(community2[i], community2[j]);
    }
}

// Community 3: Sports team
const community3 = ['Ivan', 'Julia', 'Kevin', 'Laura'];
// Add dense connections within community 3
for (let i = 0; i < community3.length; i++) {
    for (let j = i + 1; j < community3.length; j++) {
        socialNetwork.addEdge(community3[i], community3[j]);
    }
}

// Add sparse connections between communities
socialNetwork.addEdge('Alice', 'Eve');    // Bridge between communities 1 and 2
socialNetwork.addEdge('Charlie', 'Ivan');  // Bridge between communities 1 and 3
socialNetwork.addEdge('Frank', 'Julia');   // Bridge between communities 2 and 3

console.log('Social Network with 3 Communities:');
console.log('Community 1 (Friends): Alice, Bob, Charlie, David');
console.log('Community 2 (Work): Eve, Frank, Grace, Henry');
console.log('Community 3 (Sports): Ivan, Julia, Kevin, Laura');
console.log('\nBridge connections:');
console.log('  Alice ↔ Eve (Friends-Work)');
console.log('  Charlie ↔ Ivan (Friends-Sports)');
console.log('  Frank ↔ Julia (Work-Sports)');

// Perform spectral clustering
console.log('\n1. Spectral Clustering with k=3:');
const clustering3 = spectralClustering(socialNetwork, { k: 3 });

console.log('\nClusters found:');
if (clustering3 && clustering3.communities) {
    clustering3.communities.forEach((cluster, idx) => {
        console.log(`  Cluster ${idx + 1}: ${cluster.join(', ')}`);
    });
} else {
    console.log('  No clusters returned');
}

console.log(`\nNumber of communities: ${clustering3?.communities?.length || 0}`);

// Try different values of k
console.log('\n\n2. Testing Different k Values:');
const kValues = [2, 3, 4, 5];

console.log('k | Communities | Description');
console.log('--|-------------|------------');
kValues.forEach(k => {
    const result = spectralClustering(socialNetwork, { k });
    console.log(`${k} | ${(result?.communities?.length || 0).toString().padEnd(11)} | ${k} clusters requested`);
});

// Create a graph with weighted edges
console.log('\n\n3. Weighted Graph Clustering (Research Collaboration):');
const researchNetwork = new Graph();

// Research groups with collaboration strength
// Group 1: AI researchers
researchNetwork.addEdge('AI_Prof1', 'AI_Prof2', 10);
researchNetwork.addEdge('AI_Prof1', 'AI_PhD1', 8);
researchNetwork.addEdge('AI_Prof2', 'AI_PhD1', 7);
researchNetwork.addEdge('AI_Prof2', 'AI_PhD2', 9);
researchNetwork.addEdge('AI_PhD1', 'AI_PhD2', 6);

// Group 2: Biology researchers
researchNetwork.addEdge('Bio_Prof1', 'Bio_Prof2', 12);
researchNetwork.addEdge('Bio_Prof1', 'Bio_PhD1', 9);
researchNetwork.addEdge('Bio_Prof2', 'Bio_PhD2', 8);
researchNetwork.addEdge('Bio_PhD1', 'Bio_PhD2', 7);

// Group 3: Interdisciplinary (AI + Biology)
researchNetwork.addEdge('Inter_Prof', 'AI_Prof1', 3);
researchNetwork.addEdge('Inter_Prof', 'Bio_Prof1', 2);
researchNetwork.addEdge('Inter_Prof', 'Inter_PhD', 11);
researchNetwork.addEdge('Inter_PhD', 'AI_PhD1', 1);
researchNetwork.addEdge('Inter_PhD', 'Bio_PhD1', 1);

console.log('Research Collaboration Network:');
console.log('Edge weights represent number of joint papers');
console.log('- AI Group: Strong internal collaboration (6-10 papers)');
console.log('- Biology Group: Strong internal collaboration (7-12 papers)');
console.log('- Interdisciplinary: Weaker cross-field links (1-3 papers)');

// Cluster with weighted edges
console.log('\n4. Weighted Spectral Clustering:');
const weightedClustering = spectralClustering(researchNetwork, { 
    k: 3,
    weighted: true 
});

console.log('\nResearch clusters:');
weightedClustering.communities.forEach((cluster, idx) => {
    console.log(`  Cluster ${idx + 1}: ${cluster.join(', ')}`);
});

// Create a graph with different connectivity patterns
console.log('\n\n5. Different Graph Structures:');

// Ring of cliques
const ringGraph = new Graph();

// Create 4 cliques
const cliques = [
    ['A1', 'A2', 'A3'],
    ['B1', 'B2', 'B3'],
    ['C1', 'C2', 'C3'],
    ['D1', 'D2', 'D3']
];

// Add edges within each clique
cliques.forEach(clique => {
    for (let i = 0; i < clique.length; i++) {
        for (let j = i + 1; j < clique.length; j++) {
            ringGraph.addEdge(clique[i], clique[j]);
        }
    }
});

// Connect cliques in a ring
ringGraph.addEdge('A1', 'B1');
ringGraph.addEdge('B2', 'C1');
ringGraph.addEdge('C2', 'D1');
ringGraph.addEdge('D2', 'A2');

console.log('Ring of Cliques Structure:');
console.log('  A1-A2-A3');
console.log('  |       |');
console.log('  B1-B2-B3');
console.log('  |       |');
console.log('  C1-C2-C3');
console.log('  |       |');
console.log('  D1-D2-D3');
console.log('  |_______|');

const ringClustering = spectralClustering(ringGraph, { k: 4 });
console.log('\nClusters in ring structure:');
ringClustering.communities.forEach((cluster, idx) => {
    console.log(`  Cluster ${idx + 1}: ${cluster.join(', ')}`);
});

// Test normalized vs unnormalized Laplacian
console.log('\n\n6. Normalized vs Unnormalized Laplacian:');

const testGraph = socialNetwork;

console.log('Normalized Laplacian (default):');
const normalizedResult = spectralClustering(testGraph, { 
    k: 3,
    normalized: true 
});
console.log(`  Communities found: ${normalizedResult?.communities?.length || 0}`);

console.log('\nUnnormalized Laplacian:');
const unnormalizedResult = spectralClustering(testGraph, { 
    k: 3,
    normalized: false 
});
console.log(`  Communities found: ${unnormalizedResult?.communities?.length || 0}`);

// Large-scale test
console.log('\n\n7. Performance on Larger Graphs:');

// Create a larger graph with clear structure
const largeGraph = new Graph();
const communitySizes = [15, 20, 25];
let nodeId = 0;

communitySizes.forEach((size, commIdx) => {
    const communityNodes = [];
    
    // Create nodes for this community
    for (let i = 0; i < size; i++) {
        communityNodes.push(`N${nodeId++}`);
    }
    
    // Add edges within community (with probability)
    for (let i = 0; i < communityNodes.length; i++) {
        for (let j = i + 1; j < communityNodes.length; j++) {
            if (Math.random() < 0.7) { // 70% connection probability within community
                largeGraph.addEdge(communityNodes[i], communityNodes[j]);
            }
        }
    }
    
    // Add a few inter-community edges
    if (commIdx > 0) {
        const prevCommStart = nodeId - size - communitySizes[commIdx - 1];
        const bridgeNode1 = communityNodes[0];
        const bridgeNode2 = `N${prevCommStart + Math.floor(Math.random() * communitySizes[commIdx - 1])}`;
        largeGraph.addEdge(bridgeNode1, bridgeNode2);
    }
});

console.log(`Graph with ${largeGraph.nodeCount} nodes and ${largeGraph.edgeCount} edges`);
console.log('3 communities of sizes: 15, 20, 25 nodes');

const start = Date.now();
const largeClustering = spectralClustering(largeGraph, { k: 3 });
const time = Date.now() - start;

console.log(`\nClustering completed in ${time}ms`);
console.log('Cluster sizes:', largeClustering?.communities?.map(c => c.length).join(', ') || 'N/A');

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Found 3 clusters in social network:', 
    clustering3?.communities?.length === 3);
console.log('✓ All nodes assigned to clusters:', 
    clustering3?.communities?.flat().length === socialNetwork.nodeCount);
console.log('✓ Communities array exists:', 
    Array.isArray(clustering3?.communities));
console.log('✓ Ring of cliques correctly identified:', 
    ringClustering?.communities?.length === 4);
console.log('✓ Weighted clustering preserves groups:', 
    weightedClustering?.communities?.some(cluster => 
        cluster.includes('AI_Prof1') && cluster.includes('AI_PhD1')));