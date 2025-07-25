import { Graph, spectralClustering } from './algorithms.js';

// Create a graph with distinct cluster structure
const graph = new Graph();

// Add nodes
const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
nodes.forEach(node => graph.addNode(node));

// Add edges to create three clusters with different structures
const edges = [
    // Cluster 1: Dense triangle (A, B, C)
    ['A', 'B'], ['B', 'C'], ['C', 'A'],
    
    // Cluster 2: Loose triangle (D, E, F)
    ['D', 'E'], ['E', 'F'], ['F', 'D'],
    
    // Cluster 3: Chain-like structure (G, H, I)
    ['G', 'H'], ['H', 'I'], ['I', 'G'],
    
    // Weak inter-cluster connections
    ['C', 'D'], ['F', 'G']
];

edges.forEach(([source, target]) => graph.addEdge(source, target));

// Run Spectral Clustering with different configurations
export function runSpectralClustering() {
    console.log('=== Spectral Clustering Example ===\n');
    
    // Test different numbers of clusters
    const kValues = [2, 3, 4];
    const laplacianTypes = ['normalized', 'unnormalized', 'randomWalk'];
    
    laplacianTypes.forEach(laplacianType => {
        console.log(`\n--- Laplacian Type: ${laplacianType} ---`);
        
        kValues.forEach(k => {
            console.log(`\nClustering with k=${k}:`);
            
            const result = spectralClustering(graph, {
                k: k,
                laplacianType: laplacianType
            });
            
            console.log(`Found ${result.communities.length} communities:`);
            result.communities.forEach((community, index) => {
                console.log(`  Cluster ${index}: [${community.join(', ')}]`);
            });
            
            // Show cluster assignments
            const assignments = new Map(result.clusterAssignments);
            console.log('Node assignments:', Object.fromEntries(assignments));
            
            // Calculate cluster sizes
            const clusterSizes = result.communities.map(c => c.length);
            console.log(`Cluster sizes: [${clusterSizes.join(', ')}]`);
            
            // Show eigenvalue information if available
            if (result.eigenvalues) {
                console.log(`First ${Math.min(3, result.eigenvalues.length)} eigenvalues:`, 
                    result.eigenvalues.slice(0, 3).map(v => v.toFixed(4)));
            }
        });
    });
    
    // Detailed analysis for k=3 with normalized Laplacian
    console.log('\n=== Detailed Analysis (k=3, normalized) ===');
    const detailedResult = spectralClustering(graph, {
        k: 3,
        laplacianType: 'normalized'
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
    });
    
    // Analyze inter-cluster connections
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
    
    return detailedResult;
}