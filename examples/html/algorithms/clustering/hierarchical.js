import { hierarchicalClustering, cutDendrogram, cutDendrogramKClusters } from './algorithms.js';

// Create a graph with hierarchical structure
const graph = new Map([
    ['A', new Set(['B', 'C'])],
    ['B', new Set(['A', 'C'])],
    ['C', new Set(['A', 'B', 'D'])],
    ['D', new Set(['C', 'E'])],
    ['E', new Set(['D', 'F', 'G'])],
    ['F', new Set(['E', 'G'])],
    ['G', new Set(['E', 'F', 'H'])],
    ['H', new Set(['G'])]
]);

// Run Hierarchical Clustering with different linkage methods
export function runHierarchicalClustering() {
    console.log('=== Hierarchical Clustering Example ===\n');
    
    // Try different linkage methods
    const linkageMethods = ['single', 'complete', 'average'];
    
    linkageMethods.forEach(method => {
        console.log(`\nLinkage method: ${method}`);
        const result = hierarchicalClustering(graph, method);
        
        console.log('Root cluster:', result.root);
        console.log('Total dendrogram nodes:', result.dendrogram.length);
        console.log('Tree height:', result.root.height);
        
        // Cut dendrogram at different levels
        console.log('\nClusters at different heights:');
        for (let h = 0; h <= result.root.height; h++) {
            const clusters = result.clusters.get(h);
            if (clusters) {
                console.log(`  Height ${h}: ${clusters.length} clusters`);
                clusters.forEach((cluster, i) => {
                    console.log(`    Cluster ${i}: ${Array.from(cluster).join(', ')}`);
                });
            }
        }
        
        // Cut to get specific number of clusters
        console.log('\nCutting dendrogram to get 3 clusters:');
        const threeClusters = cutDendrogramKClusters(result.root, 3);
        threeClusters.forEach((cluster, i) => {
            console.log(`  Cluster ${i}: ${Array.from(cluster).join(', ')}`);
        });
    });
    
    return hierarchicalClustering(graph, 'average');
}