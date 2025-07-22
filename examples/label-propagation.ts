/**
 * Label Propagation Community Detection Example
 * 
 * This example demonstrates the Label Propagation algorithm for community detection,
 * which is a fast, near-linear time algorithm that finds communities by propagating
 * labels through the network.
 * 
 * Applications include:
 * - Large-scale social network analysis
 * - Real-time community detection
 * - Semi-supervised learning
 * - Streaming graph analysis
 */

import { 
    labelPropagation, 
    labelPropagationAsync,
    labelPropagationSemiSupervised 
} from '../src/algorithms/community/label-propagation';

console.log('=== Label Propagation Community Detection Examples ===\n');

// Example 1: Real-time Social Network Analysis
console.log('Example 1: Real-time Friend Group Detection');
console.log('Fast community detection for social media platforms\n');

// Create a social network with overlapping communities
const socialGraph = new Map<string, Set<string>>([
    // Sports enthusiasts group
    ['Alex', new Set(['Ben', 'Carlos', 'Diana', 'Emma'])],
    ['Ben', new Set(['Alex', 'Carlos', 'Felix'])],
    ['Carlos', new Set(['Alex', 'Ben', 'Diana'])],
    ['Diana', new Set(['Alex', 'Carlos', 'Emma', 'Grace'])], // Bridge member
    
    // Book club group
    ['Emma', new Set(['Alex', 'Diana', 'Felix', 'Grace', 'Henry'])],
    ['Felix', new Set(['Ben', 'Emma', 'Grace', 'Henry'])],
    ['Grace', new Set(['Diana', 'Emma', 'Felix', 'Henry', 'Iris'])],
    ['Henry', new Set(['Emma', 'Felix', 'Grace', 'Iris'])],
    
    // Gaming community
    ['Iris', new Set(['Grace', 'Henry', 'Jack', 'Kate', 'Leo'])],
    ['Jack', new Set(['Iris', 'Kate', 'Leo', 'Mike'])],
    ['Kate', new Set(['Iris', 'Jack', 'Leo', 'Mike'])],
    ['Leo', new Set(['Iris', 'Jack', 'Kate', 'Mike'])],
    ['Mike', new Set(['Jack', 'Kate', 'Leo'])]
]);

// Run synchronous label propagation
console.log('Synchronous Label Propagation:');
const syncResult = labelPropagation(socialGraph, { maxIterations: 20 });

// Convert Map to community arrays
const syncCommunities = new Map<number, string[]>();
for (const [node, communityId] of syncResult.communities) {
    if (!syncCommunities.has(communityId)) {
        syncCommunities.set(communityId, []);
    }
    syncCommunities.get(communityId)!.push(node);
}
const syncCommArray = Array.from(syncCommunities.values());

console.log(`Found ${syncCommArray.length} communities in ${syncResult.iterations} iterations`);
syncCommArray.forEach((community, index) => {
    console.log(`  Community ${index + 1}: ${community.join(', ')}`);
});

// Run asynchronous label propagation (usually converges faster)
console.log('\nAsynchronous Label Propagation:');
const asyncResult = labelPropagationAsync(socialGraph, { maxIterations: 20 });

// Convert Map to community arrays
const asyncCommunities = new Map<number, string[]>();
for (const [node, communityId] of asyncResult.communities) {
    if (!asyncCommunities.has(communityId)) {
        asyncCommunities.set(communityId, []);
    }
    asyncCommunities.get(communityId)!.push(node);
}
const asyncCommArray = Array.from(asyncCommunities.values());

console.log(`Found ${asyncCommArray.length} communities in ${asyncResult.iterations} iterations`);
console.log('(Note: Results may vary due to randomized update order)\n');

// Example 2: Document Clustering
console.log('\nExample 2: Document Similarity Network');
console.log('Clustering documents based on shared topics\n');

const documentNetwork = new Map<string, Set<string>>([
    // Machine Learning papers
    ['ML_Paper1', new Set(['ML_Paper2', 'ML_Paper3', 'ML_Paper4', 'DL_Paper1'])],
    ['ML_Paper2', new Set(['ML_Paper1', 'ML_Paper3', 'ML_Paper5'])],
    ['ML_Paper3', new Set(['ML_Paper1', 'ML_Paper2', 'ML_Paper4', 'ML_Paper5'])],
    ['ML_Paper4', new Set(['ML_Paper1', 'ML_Paper3', 'DL_Paper1'])],
    ['ML_Paper5', new Set(['ML_Paper2', 'ML_Paper3', 'Stats_Paper1'])], // Interdisciplinary
    
    // Deep Learning papers
    ['DL_Paper1', new Set(['ML_Paper1', 'ML_Paper4', 'DL_Paper2', 'DL_Paper3', 'DL_Paper4'])],
    ['DL_Paper2', new Set(['DL_Paper1', 'DL_Paper3', 'DL_Paper4', 'DL_Paper5'])],
    ['DL_Paper3', new Set(['DL_Paper1', 'DL_Paper2', 'DL_Paper4', 'CV_Paper1'])], // Links to Computer Vision
    ['DL_Paper4', new Set(['DL_Paper1', 'DL_Paper2', 'DL_Paper3', 'DL_Paper5'])],
    ['DL_Paper5', new Set(['DL_Paper2', 'DL_Paper4', 'CV_Paper2'])],
    
    // Computer Vision papers
    ['CV_Paper1', new Set(['DL_Paper3', 'CV_Paper2', 'CV_Paper3', 'CV_Paper4'])],
    ['CV_Paper2', new Set(['DL_Paper5', 'CV_Paper1', 'CV_Paper3', 'CV_Paper4'])],
    ['CV_Paper3', new Set(['CV_Paper1', 'CV_Paper2', 'CV_Paper4'])],
    ['CV_Paper4', new Set(['CV_Paper1', 'CV_Paper2', 'CV_Paper3'])],
    
    // Statistics papers
    ['Stats_Paper1', new Set(['ML_Paper5', 'Stats_Paper2', 'Stats_Paper3'])],
    ['Stats_Paper2', new Set(['Stats_Paper1', 'Stats_Paper3', 'Stats_Paper4'])],
    ['Stats_Paper3', new Set(['Stats_Paper1', 'Stats_Paper2', 'Stats_Paper4'])],
    ['Stats_Paper4', new Set(['Stats_Paper2', 'Stats_Paper3'])]
]);

const docResult = labelPropagation(documentNetwork, { 
    maxIterations: 30,
    // Seed for reproducible results
});

// Convert Map to community arrays
const docCommunities = new Map<number, string[]>();
for (const [node, communityId] of docResult.communities) {
    if (!docCommunities.has(communityId)) {
        docCommunities.set(communityId, []);
    }
    docCommunities.get(communityId)!.push(node);
}
const docCommArray = Array.from(docCommunities.values());

console.log(`Found ${docCommArray.length} document clusters:`);
docCommArray.forEach((community, index) => {
    console.log(`\nCluster ${index + 1}:`);
    console.log(`  Documents: ${community.join(', ')}`);
    
    // Identify cluster topic
    const topics = new Set<string>();
    community.forEach(doc => {
        if (doc.startsWith('ML_')) topics.add('Machine Learning');
        if (doc.startsWith('DL_')) topics.add('Deep Learning');
        if (doc.startsWith('CV_')) topics.add('Computer Vision');
        if (doc.startsWith('Stats_')) topics.add('Statistics');
    });
    console.log(`  Topics: ${Array.from(topics).join(', ')}`);
});

// Example 3: Semi-supervised Community Detection
console.log('\n\nExample 3: Semi-supervised Label Propagation');
console.log('Using known labels to guide community detection\n');

// Customer network with some known segments
const customerNetwork = new Map<string, Set<string>>([
    // Premium customers (some labeled)
    ['Cust_P1', new Set(['Cust_P2', 'Cust_P3', 'Cust_P4'])],
    ['Cust_P2', new Set(['Cust_P1', 'Cust_P3', 'Cust_P5'])],
    ['Cust_P3', new Set(['Cust_P1', 'Cust_P2', 'Cust_P4', 'Cust_P5'])],
    ['Cust_P4', new Set(['Cust_P1', 'Cust_P3', 'Cust_P5'])],
    ['Cust_P5', new Set(['Cust_P2', 'Cust_P3', 'Cust_P4', 'Cust_U1'])], // Connected to unknown
    
    // Regular customers (some labeled)
    ['Cust_R1', new Set(['Cust_R2', 'Cust_R3', 'Cust_R4'])],
    ['Cust_R2', new Set(['Cust_R1', 'Cust_R3', 'Cust_R5'])],
    ['Cust_R3', new Set(['Cust_R1', 'Cust_R2', 'Cust_R4', 'Cust_R5'])],
    ['Cust_R4', new Set(['Cust_R1', 'Cust_R3', 'Cust_U2'])],
    ['Cust_R5', new Set(['Cust_R2', 'Cust_R3', 'Cust_U3'])],
    
    // Unknown customers to classify
    ['Cust_U1', new Set(['Cust_P5', 'Cust_U2', 'Cust_U3'])],
    ['Cust_U2', new Set(['Cust_R4', 'Cust_U1', 'Cust_U3', 'Cust_U4'])],
    ['Cust_U3', new Set(['Cust_R5', 'Cust_U1', 'Cust_U2', 'Cust_U4'])],
    ['Cust_U4', new Set(['Cust_U2', 'Cust_U3', 'Cust_U5', 'Cust_U6'])],
    ['Cust_U5', new Set(['Cust_U4', 'Cust_U6'])],
    ['Cust_U6', new Set(['Cust_U4', 'Cust_U5'])]
]);

// Known labels for some customers
const knownLabels = new Map<string, number>([
    // Premium segment (label 0)
    ['Cust_P1', 0],
    ['Cust_P2', 0],
    
    // Regular segment (label 1)
    ['Cust_R1', 1],
    ['Cust_R2', 1]
]);

const semiSupervisedResult = labelPropagationSemiSupervised(
    customerNetwork, 
    knownLabels,
    { maxIterations: 10 }
);

console.log('Customer Segmentation Results:');
console.log(`Converged in ${semiSupervisedResult.iterations} iterations\n`);

// Group by segment
const segments = new Map<number, string[]>();
semiSupervisedResult.communities.forEach((label, customer) => {
    if (!segments.has(label)) {
        segments.set(label, []);
    }
    segments.get(label)?.push(customer);
});

segments.forEach((customers, label) => {
    const segmentName = label === 0 ? 'Premium' : label === 1 ? 'Regular' : `Segment ${label}`;
    console.log(`${segmentName} Customers:`);
    
    const known = customers.filter(c => knownLabels.has(c));
    const unknown = customers.filter(c => !knownLabels.has(c));
    
    if (known.length > 0) {
        console.log(`  Known: ${known.join(', ')}`);
    }
    if (unknown.length > 0) {
        console.log(`  Newly classified: ${unknown.join(', ')}`);
    }
    console.log();
});

// Example 4: Large-scale Network Analysis
console.log('\nExample 4: Performance Comparison on Larger Network');
console.log('Comparing synchronous vs asynchronous on a larger graph\n');

// Create a larger network with clear community structure
const largeNetwork = new Map<string, Set<string>>();

// Create 4 communities of 25 nodes each
const communities = 4;
const nodesPerCommunity = 25;
const interCommunityEdges = 3; // Sparse connections between communities

// Generate communities
for (let c = 0; c < communities; c++) {
    for (let i = 0; i < nodesPerCommunity; i++) {
        const nodeId = `C${c}_N${i}`;
        const neighbors = new Set<string>();
        
        // Connect to other nodes in same community (dense)
        for (let j = 0; j < nodesPerCommunity; j++) {
            if (i !== j && Math.random() < 0.3) { // 30% connection probability
                neighbors.add(`C${c}_N${j}`);
            }
        }
        
        // Add few inter-community edges
        if (i < interCommunityEdges) {
            const targetCommunity = (c + 1) % communities;
            neighbors.add(`C${targetCommunity}_N${i}`);
        }
        
        largeNetwork.set(nodeId, neighbors);
    }
}

// Ensure graph is symmetric
largeNetwork.forEach((neighbors, node) => {
    neighbors.forEach(neighbor => {
        const neighborSet = largeNetwork.get(neighbor);
        if (neighborSet) {
            neighborSet.add(node);
        }
    });
});

console.log(`Network size: ${largeNetwork.size} nodes`);

// Compare performance
console.time('Synchronous LP');
const largeSyncResult = labelPropagation(largeNetwork, { maxIterations: 50 });
console.timeEnd('Synchronous LP');

console.time('Asynchronous LP');
const largeAsyncResult = labelPropagationAsync(largeNetwork, { maxIterations: 50 });
console.timeEnd('Asynchronous LP');

// Convert results to community arrays
const largeSyncCommunities = new Map<number, string[]>();
for (const [node, communityId] of largeSyncResult.communities) {
    if (!largeSyncCommunities.has(communityId)) {
        largeSyncCommunities.set(communityId, []);
    }
    largeSyncCommunities.get(communityId)!.push(node);
}
const largeSyncCommArray = Array.from(largeSyncCommunities.values());

const largeAsyncCommunities = new Map<number, string[]>();
for (const [node, communityId] of largeAsyncResult.communities) {
    if (!largeAsyncCommunities.has(communityId)) {
        largeAsyncCommunities.set(communityId, []);
    }
    largeAsyncCommunities.get(communityId)!.push(node);
}
const largeAsyncCommArray = Array.from(largeAsyncCommunities.values());

console.log(`\nSynchronous: ${largeSyncCommArray.length} communities in ${largeSyncResult.iterations} iterations`);
console.log(`Asynchronous: ${largeAsyncCommArray.length} communities in ${largeAsyncResult.iterations} iterations`);

// Show community sizes
console.log('\nCommunity sizes (Asynchronous):');
largeAsyncCommArray
    .sort((a, b) => b.length - a.length)
    .forEach((community, index) => {
        console.log(`  Community ${index + 1}: ${community.length} nodes`);
    });

// Analysis
console.log('\n=== Analysis ===');
console.log('Label Propagation advantages:');
console.log('1. Near-linear time complexity O(m) where m is number of edges');
console.log('2. No need to specify number of communities');
console.log('3. Naturally handles weighted graphs');
console.log('4. Can incorporate prior knowledge (semi-supervised)');
console.log('\nConsiderations:');
console.log('- Results can vary between runs due to random tie-breaking');
console.log('- Asynchronous version usually converges faster');
console.log('- May find different numbers of communities on different runs');
console.log('- Best suited for large-scale, real-time applications');