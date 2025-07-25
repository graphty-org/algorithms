import { Graph, markovClustering } from './algorithms.js';

// Create a graph with distinct cluster structure for MCL
const graph = new Graph();

// Add nodes
const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
nodes.forEach(node => graph.addNode(node));

// Add edges to create clusters with different densities
const edges = [
    // Dense cluster 1: A-B-C triangle (tightly connected)
    ['A', 'B'], ['B', 'C'], ['C', 'A'],
    
    // Dense cluster 2: D-E-F triangle (tightly connected) 
    ['D', 'E'], ['E', 'F'], ['F', 'D'],
    
    // Sparse cluster 3: G-H pair (loosely connected)
    ['G', 'H'],
    
    // Weak inter-cluster connections (these will be broken by MCL)
    ['C', 'D'], ['F', 'G']
];

edges.forEach(([source, target]) => graph.addEdge(source, target));

// Run MCL with different parameter configurations
export function runMarkovClustering() {
    console.log('=== MCL (Markov Clustering) Example ===\n');
    
    // Test different inflation parameters
    const inflationValues = [1.5, 2.0, 2.5, 3.0];
    const expansionValues = [2, 3];
    
    expansionValues.forEach(expansion => {
        console.log(`\n--- Expansion Parameter: ${expansion} ---`);
        
        inflationValues.forEach(inflation => {
            console.log(`\nInflation=${inflation}, Expansion=${expansion}:`);
            
            const result = markovClustering(graph, {
                expansion: expansion,
                inflation: inflation,
                maxIterations: 20
            });
            
            console.log(`Found ${result.communities.length} communities:`);
            result.communities.forEach((community, index) => {
                console.log(`  Cluster ${index + 1}: [${community.join(', ')}]`);
            });
            
            console.log(`Attractors: {${Array.from(result.attractors).join(', ')}}`);
            console.log(`Converged: ${result.converged} (${result.iterations} iterations)`);
            
            // Calculate cluster quality metrics
            const clusterSizes = result.communities.map(c => c.length);
            console.log(`Cluster sizes: [${clusterSizes.join(', ')}]`);
            
            // Show flow concentration (attractors per cluster)
            const attractorRatio = result.attractors.size / result.communities.length;
            console.log(`Attractor ratio: ${attractorRatio.toFixed(2)} (${result.attractors.size}/${result.communities.length})`);
        });
    });
    
    // Detailed analysis for recommended parameters
    console.log('\n=== Detailed Analysis (Expansion=2, Inflation=2.0) ===');
    const detailedResult = markovClustering(graph, {
        expansion: 2,
        inflation: 2.0,
        maxIterations: 20
    });
    
    console.log('Final clustering result:');
    detailedResult.communities.forEach((community, index) => {
        console.log(`  Cluster ${index + 1}: ${community.join(' → ')}`);
        
        // Analyze intra-cluster connections
        let intraConnections = 0;
        let totalPossible = community.length * (community.length - 1) / 2;
        
        for (let i = 0; i < community.length; i++) {
            for (let j = i + 1; j < community.length; j++) {
                if (graph.hasEdge(community[i], community[j])) {
                    intraConnections++;
                }
            }
        }
        
        const density = totalPossible > 0 ? (intraConnections / totalPossible) * 100 : 0;
        console.log(`    Density: ${density.toFixed(1)}% (${intraConnections}/${totalPossible} connections)`);
        
        // Show which nodes are attractors in this cluster
        const clusterAttractors = community.filter(node => detailedResult.attractors.has(node));
        if (clusterAttractors.length > 0) {
            console.log(`    Attractors: [${clusterAttractors.join(', ')}]`);
        }
    });
    
    // Analyze inter-cluster connections (should be minimal after MCL)
    let interConnections = 0;
    for (let i = 0; i < detailedResult.communities.length; i++) {
        for (let j = i + 1; j < detailedResult.communities.length; j++) {
            const cluster1 = detailedResult.communities[i];
            const cluster2 = detailedResult.communities[j];
            
            for (const node1 of cluster1) {
                for (const node2 of cluster2) {
                    if (graph.hasEdge(node1, node2)) {
                        interConnections++;
                        console.log(`    Inter-cluster edge: ${node1} ↔ ${node2}`);
                    }
                }
            }
        }
    }
    
    console.log(`Total inter-cluster connections: ${interConnections}`);
    
    // MCL-specific metrics
    console.log('\n=== MCL Flow Analysis ===');
    console.log(`Flow attractors found: ${detailedResult.attractors.size}`);
    console.log(`Iteration convergence: ${detailedResult.iterations}/${20}`);
    console.log(`Algorithm status: ${detailedResult.converged ? 'Converged' : 'Max iterations reached'}`);
    
    // Show the flow interpretation
    console.log('\n=== Flow Interpretation ===');
    console.log('MCL simulates random walks in the graph:');
    console.log('- Dense regions (triangles A-B-C and D-E-F) trap flow → clusters');
    console.log('- Sparse connections (G-H pair) have weaker flow → smaller cluster');
    console.log('- Inter-cluster edges (C-D, F-G) lose flow → natural boundaries');
    console.log('- Attractor nodes concentrate the most flow in each cluster');
    
    return detailedResult;
}

// Demonstrate the effect of different parameters
export function demonstrateParameterEffects() {
    console.log('\n=== Parameter Effects Demonstration ===');
    
    console.log('\n1. Effect of Inflation Parameter:');
    console.log('   - Low inflation (1.5): More, larger clusters (gentle flow concentration)');
    console.log('   - High inflation (3.0): Fewer, smaller clusters (aggressive flow concentration)');
    
    [1.5, 2.0, 3.0].forEach(inflation => {
        const result = markovClustering(graph, { expansion: 2, inflation });
        console.log(`   Inflation ${inflation}: ${result.communities.length} clusters, ${result.attractors.size} attractors`);
    });
    
    console.log('\n2. Effect of Expansion Parameter:');
    console.log('   - Low expansion (2): Flow spreads through 2-step paths');
    console.log('   - High expansion (3): Flow spreads through 3-step paths (more global view)');
    
    [2, 3].forEach(expansion => {
        const result = markovClustering(graph, { expansion, inflation: 2.0 });
        console.log(`   Expansion ${expansion}: ${result.communities.length} clusters, ${result.attractors.size} attractors`);
    });
}