// MCL (Markov Clustering) Example
import { Graph, markovClustering } from '../dist/algorithms.js';

console.log('=== MCL (Markov Clustering) Example ===');

// Create a protein interaction network
const proteinNetwork = new Graph();

// Protein complex 1: DNA repair
const complex1 = ['BRCA1', 'BRCA2', 'RAD51', 'PALB2'];
complex1.forEach((p1, i) => {
    complex1.slice(i + 1).forEach(p2 => {
        proteinNetwork.addEdge(p1, p2, 0.9); // High interaction probability
    });
});

// Protein complex 2: Cell cycle regulation
const complex2 = ['CDK1', 'CCNB1', 'CDC25', 'WEE1'];
complex2.forEach((p1, i) => {
    complex2.slice(i + 1).forEach(p2 => {
        proteinNetwork.addEdge(p1, p2, 0.85);
    });
});

// Protein complex 3: Apoptosis
const complex3 = ['CASP3', 'CASP9', 'APAF1', 'CYTC'];
complex3.forEach((p1, i) => {
    complex3.slice(i + 1).forEach(p2 => {
        proteinNetwork.addEdge(p1, p2, 0.8);
    });
});

// Add weak inter-complex interactions
proteinNetwork.addEdge('BRCA1', 'CDK1', 0.2);  // DNA repair - Cell cycle
proteinNetwork.addEdge('CCNB1', 'CASP3', 0.15); // Cell cycle - Apoptosis
proteinNetwork.addEdge('RAD51', 'APAF1', 0.1);  // DNA repair - Apoptosis

console.log('Protein Interaction Network:');
console.log('Complex 1 (DNA Repair): BRCA1, BRCA2, RAD51, PALB2');
console.log('Complex 2 (Cell Cycle): CDK1, CCNB1, CDC25, WEE1');
console.log('Complex 3 (Apoptosis): CASP3, CASP9, APAF1, CYTC');
console.log('\nInter-complex interactions are weak (0.1-0.2)');
console.log('Intra-complex interactions are strong (0.8-0.9)');

// Run MCL with default parameters
console.log('\n1. MCL Clustering with Default Parameters:');
const mclDefault = markovClustering(proteinNetwork);

console.log('\nProtein complexes found:');
mclDefault.communities.forEach((cluster, idx) => {
    console.log(`  Complex ${idx + 1}: ${cluster.join(', ')}`);
});

console.log(`\nConverged: ${mclDefault.converged}`);
console.log(`Iterations: ${mclDefault.iterations}`);

// Test different inflation parameters
console.log('\n\n2. Effect of Inflation Parameter:');
const inflationValues = [1.5, 2.0, 3.0, 5.0];

console.log('Inflation | Clusters | Converged | Description');
console.log('----------|----------|-----------|------------');
inflationValues.forEach(inflation => {
    const result = markovClustering(proteinNetwork, { inflation });
    const desc = inflation < 2 ? 'Coarse' : inflation > 3 ? 'Fine' : 'Balanced';
    console.log(`${inflation.toFixed(1).padEnd(9)} | ${result.communities.length.toString().padEnd(8)} | ${result.converged.toString().padEnd(9)} | ${desc} clustering`);
});

// Create a social network with overlapping communities
console.log('\n\n3. Social Network with Overlapping Communities:');
const socialGraph = new Graph();

// Academic department
const academics = ['Prof_Smith', 'Prof_Jones', 'PostDoc_A', 'PhD_Student1', 'PhD_Student2'];
academics.forEach((p1, i) => {
    academics.slice(i + 1).forEach(p2 => {
        if (!p1.includes('Student') || !p2.includes('Student')) {
            socialGraph.addEdge(p1, p2);
        }
    });
});

// Sports club
const sports = ['Coach', 'Player1', 'Player2', 'Player3', 'Prof_Jones'];
sports.forEach((p1, i) => {
    sports.slice(i + 1).forEach(p2 => {
        socialGraph.addEdge(p1, p2);
    });
});

// Neighborhood group
const neighbors = ['Resident1', 'Resident2', 'Resident3', 'Prof_Smith', 'Player1'];
neighbors.forEach((p1, i) => {
    neighbors.slice(i + 1).forEach(p2 => {
        socialGraph.addEdge(p1, p2);
    });
});

console.log('Overlapping Social Communities:');
console.log('- Academic: Prof_Smith, Prof_Jones, PostDoc_A, PhD_Students');
console.log('- Sports: Coach, Players, Prof_Jones');
console.log('- Neighbors: Residents, Prof_Smith, Player1');
console.log('\nNote: Prof_Jones is in Academic & Sports');
console.log('      Prof_Smith is in Academic & Neighbors');
console.log('      Player1 is in Sports & Neighbors');

// Run MCL on social network
console.log('\n4. MCL on Overlapping Communities:');
const socialMCL = markovClustering(socialGraph, { inflation: 2.0 });

console.log('\nCommunities detected:');
socialMCL.communities.forEach((cluster, idx) => {
    console.log(`  Community ${idx + 1}: ${cluster.join(', ')}`);
});

// Create a graph with different edge densities
console.log('\n\n5. Network with Varying Edge Densities:');
const densityGraph = new Graph();

// Dense core
const core = ['Core1', 'Core2', 'Core3', 'Core4'];
core.forEach((n1, i) => {
    core.slice(i + 1).forEach(n2 => {
        densityGraph.addEdge(n1, n2, 1.0);
    });
});

// Medium density periphery
const periphery = ['Peri1', 'Peri2', 'Peri3', 'Peri4', 'Peri5'];
for (let i = 0; i < periphery.length; i++) {
    densityGraph.addEdge(periphery[i], periphery[(i + 1) % periphery.length], 0.7);
    densityGraph.addEdge(periphery[i], periphery[(i + 2) % periphery.length], 0.5);
}

// Sparse satellites
const satellites = ['Sat1', 'Sat2', 'Sat3'];
densityGraph.addEdge('Sat1', 'Sat2', 0.3);
densityGraph.addEdge('Sat2', 'Sat3', 0.3);

// Connect regions
densityGraph.addEdge('Core1', 'Peri1', 0.4);
densityGraph.addEdge('Core3', 'Peri3', 0.4);
densityGraph.addEdge('Peri5', 'Sat1', 0.2);

console.log('Network Structure:');
console.log('- Dense Core: Fully connected (weight 1.0)');
console.log('- Medium Periphery: Ring with shortcuts (weight 0.5-0.7)');
console.log('- Sparse Satellites: Chain (weight 0.3)');
console.log('- Weak bridges connect regions (weight 0.2-0.4)');

// Test with different parameters
console.log('\n6. Clustering with Different Parameters:');

const configs = [
    { inflation: 1.5, expansion: 2, name: 'Low inflation' },
    { inflation: 2.0, expansion: 2, name: 'Default' },
    { inflation: 3.0, expansion: 2, name: 'High inflation' },
    { inflation: 2.0, expansion: 3, name: 'High expansion' }
];

configs.forEach(config => {
    const result = markovClustering(densityGraph, config);
    console.log(`\n${config.name}:`);
    console.log(`  Clusters: ${result.communities.length}`);
    console.log(`  Largest cluster: ${Math.max(...result.communities.map(c => c.length))} nodes`);
    console.log(`  Converged: ${result.converged}`);
});

// Test convergence
console.log('\n\n7. Convergence Analysis:');
const testGraph = proteinNetwork;

console.log('Testing convergence speed with different parameters:');
const convergenceTests = [
    { maxIterations: 50, tolerance: 1e-4 },
    { maxIterations: 100, tolerance: 1e-6 },
    { maxIterations: 200, tolerance: 1e-8 }
];

convergenceTests.forEach(params => {
    const start = Date.now();
    const result = markovClustering(testGraph, params);
    const time = Date.now() - start;
    
    console.log(`\nTolerance ${params.tolerance}:`);
    console.log(`  Iterations: ${result.iterations}`);
    console.log(`  Time: ${time}ms`);
    console.log(`  Converged: ${result.iterations < params.maxIterations}`);
});

// Large-scale test
console.log('\n\n8. Performance on Larger Networks:');

// Create a network with multiple communities
const largeGraph = new Graph();
const communityCount = 5;
const nodesPerCommunity = 20;

for (let c = 0; c < communityCount; c++) {
    const communityNodes = [];
    
    // Create nodes for this community
    for (let i = 0; i < nodesPerCommunity; i++) {
        communityNodes.push(`C${c}_N${i}`);
    }
    
    // Add intra-community edges
    for (let i = 0; i < communityNodes.length; i++) {
        for (let j = i + 1; j < communityNodes.length; j++) {
            if (Math.random() < 0.3) { // 30% edge probability
                largeGraph.addEdge(communityNodes[i], communityNodes[j]);
            }
        }
    }
    
    // Add inter-community edges (sparse)
    if (c > 0) {
        const prevCommunity = `C${c-1}_N0`;
        const currentCommunity = communityNodes[0];
        largeGraph.addEdge(prevCommunity, currentCommunity, 0.1);
    }
}

console.log(`Network: ${largeGraph.nodeCount} nodes, ${largeGraph.edgeCount} edges`);
console.log(`Structure: ${communityCount} communities of ${nodesPerCommunity} nodes each`);

const largeStart = Date.now();
const largeMCL = markovClustering(largeGraph, { inflation: 2.0 });
const largeTime = Date.now() - largeStart;

console.log(`\nMCL Results:`);
console.log(`  Clusters found: ${largeMCL.communities.length}`);
console.log(`  Time taken: ${largeTime}ms`);
console.log(`  Converged: ${largeMCL.converged}`);
console.log(`  Iterations: ${largeMCL.iterations}`);

// Show cluster size distribution
const clusterSizes = largeMCL.communities.map(c => c.length).sort((a, b) => b - a);
console.log(`  Cluster sizes: ${clusterSizes.slice(0, 5).join(', ')}${clusterSizes.length > 5 ? '...' : ''}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Found 3 main protein complexes:', 
    mclDefault.communities.length >= 3);
console.log('✓ All nodes assigned to clusters:', 
    mclDefault.communities.flat().length === proteinNetwork.nodeCount);
console.log('✓ Higher inflation creates more clusters:', 
    markovClustering(proteinNetwork, { inflation: 5.0 }).communities.length > 
    markovClustering(proteinNetwork, { inflation: 1.5 }).communities.length);
console.log('✓ Algorithm converged:', 
    mclDefault.converged);
console.log('✓ Algorithm converges:', 
    mclDefault.iterations < 100);