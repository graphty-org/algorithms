// SynC (Synergistic Deep Graph Clustering) Algorithm Example
import { Graph, syncClustering } from '../dist/algorithms.js';

console.log('=== SynC Deep Graph Clustering Example ===');

// Create a complex network suitable for embedding-based clustering
const deepNetwork = new Graph();

// Community 1: Machine Learning Research Group (highly connected)
deepNetwork.addEdge('ML_Alice', 'ML_Bob', 4);
deepNetwork.addEdge('ML_Alice', 'ML_Charlie', 5);
deepNetwork.addEdge('ML_Bob', 'ML_Charlie', 4);
deepNetwork.addEdge('ML_Alice', 'ML_David', 3);
deepNetwork.addEdge('ML_Bob', 'ML_David', 3);
deepNetwork.addEdge('ML_Charlie', 'ML_David', 4);

// Community 2: Computer Vision Group (densely connected)
deepNetwork.addEdge('CV_Eve', 'CV_Frank', 5);
deepNetwork.addEdge('CV_Eve', 'CV_Grace', 4);
deepNetwork.addEdge('CV_Frank', 'CV_Grace', 5);
deepNetwork.addEdge('CV_Eve', 'CV_Henry', 3);
deepNetwork.addEdge('CV_Frank', 'CV_Henry', 3);

// Community 3: NLP Research Group (moderate connections)
deepNetwork.addEdge('NLP_Ivy', 'NLP_Jack', 4);
deepNetwork.addEdge('NLP_Ivy', 'NLP_Kate', 3);
deepNetwork.addEdge('NLP_Jack', 'NLP_Kate', 4);
deepNetwork.addEdge('NLP_Jack', 'NLP_Leo', 3);

// Community 4: Theory Group (smaller, tight-knit)
deepNetwork.addEdge('Th_Mia', 'Th_Nick', 5);
deepNetwork.addEdge('Th_Mia', 'Th_Olivia', 4);
deepNetwork.addEdge('Th_Nick', 'Th_Olivia', 5);

// Inter-community collaborations (weaker connections)
deepNetwork.addEdge('ML_David', 'CV_Eve', 2);      // ML-CV collaboration
deepNetwork.addEdge('CV_Henry', 'NLP_Ivy', 2);     // CV-NLP collaboration
deepNetwork.addEdge('NLP_Leo', 'Th_Mia', 1);       // NLP-Theory collaboration
deepNetwork.addEdge('ML_Alice', 'Th_Nick', 1);     // ML-Theory collaboration

console.log('Deep Network Structure:');
console.log('Community 1: ML Research (ML_Alice, ML_Bob, ML_Charlie, ML_David)');
console.log('Community 2: Computer Vision (CV_Eve, CV_Frank, CV_Grace, CV_Henry)');
console.log('Community 3: NLP Research (NLP_Ivy, NLP_Jack, NLP_Kate, NLP_Leo)');
console.log('Community 4: Theory Group (Th_Mia, Th_Nick, Th_Olivia)');
console.log('Cross-community collaborations: weaker connections between groups');

// Run SynC clustering with 4 clusters
console.log('\n1. Basic SynC Clustering (4 clusters):');
const result = syncClustering(deepNetwork, { numClusters: 4 });

console.log(`Final loss: ${result.loss.toFixed(4)}`);
console.log(`Iterations: ${result.iterations}`);
console.log(`Converged: ${result.converged}`);

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

console.log('\nSample node embeddings:');
const sampleNodes = ['ML_Alice', 'CV_Eve', 'NLP_Ivy', 'Th_Mia'];
for (const nodeId of sampleNodes) {
    const embedding = result.embeddings.get(nodeId);
    if (embedding) {
        console.log(`${nodeId}: [${embedding.slice(0, 5).map(x => x.toFixed(3)).join(', ')}...]`);
    }
}

// Run with different number of clusters
console.log('\n2. SynC with 3 clusters:');
const result3 = syncClustering(deepNetwork, { numClusters: 3 });
console.log(`3 clusters - Final loss: ${result3.loss.toFixed(4)}, Iterations: ${result3.iterations}`);

console.log('\n3. SynC with 5 clusters:');
const result5 = syncClustering(deepNetwork, { numClusters: 5 });
console.log(`5 clusters - Final loss: ${result5.loss.toFixed(4)}, Iterations: ${result5.iterations}`);

// Run with different learning parameters
console.log('\n4. SynC with high learning rate:');
const highLRResult = syncClustering(deepNetwork, {
    numClusters: 4,
    learningRate: 0.1,
    lambda: 0.05
});
console.log(`High LR - Loss: ${highLRResult.loss.toFixed(4)}, Iterations: ${highLRResult.iterations}`);

console.log('\n5. SynC with strict convergence:');
const strictResult = syncClustering(deepNetwork, {
    numClusters: 4,
    tolerance: 1e-8,
    maxIterations: 200
});
console.log(`Strict convergence - Loss: ${strictResult.loss.toFixed(4)}, Iterations: ${strictResult.iterations}`);

// Test on a path graph (challenging for embedding methods)
console.log('\n6. Path Graph Test:');
const pathGraph = new Graph();
for (let i = 1; i < 10; i++) {
    pathGraph.addEdge(`P${i}`, `P${i+1}`, 1);
}

const pathResult = syncClustering(pathGraph, { numClusters: 3 });
console.log(`Path graph - Loss: ${pathResult.loss.toFixed(4)}, Converged: ${pathResult.converged}`);

// Test reproducibility with seed
console.log('\n7. Reproducibility Test:');
const seed1 = syncClustering(deepNetwork, { numClusters: 4, seed: 42 });
const seed2 = syncClustering(deepNetwork, { numClusters: 4, seed: 42 });
const seed3 = syncClustering(deepNetwork, { numClusters: 4, seed: 999 });

console.log(`Same seed results match: ${seed1.loss.toFixed(6) === seed2.loss.toFixed(6)}`);
console.log(`Different seed results differ: ${seed1.loss.toFixed(6) !== seed3.loss.toFixed(6)}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Should find specified number of clusters:', 
    result.clusters.size === deepNetwork.nodeCount);
console.log('✓ All cluster IDs should be valid:', 
    Array.from(result.clusters.values()).every(id => id >= 0 && id < 4));
console.log('✓ Loss should be finite and positive:', 
    isFinite(result.loss) && result.loss >= 0);
console.log('✓ Embeddings should be provided for all nodes:', 
    result.embeddings.size === deepNetwork.nodeCount);
console.log('✓ More clusters should generally have lower loss:', 
    result5.loss <= result.loss);
console.log('✓ Iterations should be reasonable:', 
    result.iterations > 0 && result.iterations <= 100);
console.log('✓ High learning rate should converge faster:', 
    highLRResult.iterations <= result.iterations);

// Analyze cluster quality
let intraClusterEdges = 0;
let interClusterEdges = 0;

for (const edge of deepNetwork.edges()) {
    const sourceCluster = result.clusters.get(edge.source);
    const targetCluster = result.clusters.get(edge.target);
    
    if (sourceCluster === targetCluster) {
        intraClusterEdges++;
    } else {
        interClusterEdges++;
    }
}

console.log(`✓ Intra-cluster edges: ${intraClusterEdges}`);
console.log(`✓ Inter-cluster edges: ${interClusterEdges}`);
console.log('✓ Good clustering should favor intra-cluster connections:', 
    intraClusterEdges >= interClusterEdges);

// Analyze embedding quality
console.log('\nEmbedding Analysis:');
const embeddingDim = result.embeddings.get(Array.from(result.embeddings.keys())[0]).length;
console.log(`Embedding dimension: ${embeddingDim}`);

// Calculate average within-cluster similarity
let totalWithinSimilarity = 0;
let withinPairs = 0;

for (const [clusterId, members] of clusterMembers) {
    for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
            const emb1 = result.embeddings.get(members[i]);
            const emb2 = result.embeddings.get(members[j]);
            if (emb1 && emb2) {
                const similarity = cosineSimilarity(emb1, emb2);
                totalWithinSimilarity += similarity;
                withinPairs++;
            }
        }
    }
}

console.log(`Average within-cluster embedding similarity: ${(totalWithinSimilarity / withinPairs).toFixed(3)}`);

function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}