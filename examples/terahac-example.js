// TeraHAC (Hierarchical Agglomerative Clustering) Algorithm Example
import { Graph, teraHAC } from '../dist/algorithms.js';

console.log('=== TeraHAC Hierarchical Agglomerative Clustering Example ===');

// Create a network with clear hierarchical structure
const hierarchicalGraph = new Graph();

// Group 1: Core Team (tightly connected)
hierarchicalGraph.addEdge('Core_A', 'Core_B', 1);
hierarchicalGraph.addEdge('Core_A', 'Core_C', 1);
hierarchicalGraph.addEdge('Core_B', 'Core_C', 1);
hierarchicalGraph.addEdge('Core_B', 'Core_D', 1);
hierarchicalGraph.addEdge('Core_C', 'Core_D', 1);

// Group 2: Support Team (connected to core)
hierarchicalGraph.addEdge('Supp_E', 'Supp_F', 1);
hierarchicalGraph.addEdge('Supp_E', 'Supp_G', 1);
hierarchicalGraph.addEdge('Supp_F', 'Supp_G', 1);

// Group 3: External Partners (loosely connected)
hierarchicalGraph.addEdge('Ext_H', 'Ext_I', 1);
hierarchicalGraph.addEdge('Ext_I', 'Ext_J', 1);

// Hierarchical connections
hierarchicalGraph.addEdge('Core_A', 'Supp_E', 1);  // Core to Support
hierarchicalGraph.addEdge('Core_D', 'Supp_F', 1);  // Core to Support
hierarchicalGraph.addEdge('Supp_G', 'Ext_H', 1);   // Support to External

console.log('Hierarchical Graph Structure:');
console.log('Core Team: Core_A, Core_B, Core_C, Core_D (fully connected)');
console.log('Support Team: Supp_E, Supp_F, Supp_G (connected + bridge to core)');
console.log('External Partners: Ext_H, Ext_I, Ext_J (chain + bridge to support)');

// Run basic TeraHAC clustering
console.log('\n1. Basic TeraHAC Clustering:');
const result = teraHAC(hierarchicalGraph);

console.log(`Number of final clusters: ${result.numClusters}`);
console.log(`Merge distances: [${result.distances.map(d => d.toFixed(2)).join(', ')}]`);

console.log('\nFinal cluster assignments:');
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

// Run with different linkage criteria
console.log('\n2. TeraHAC with Single Linkage:');
const singleResult = teraHAC(hierarchicalGraph, { linkage: 'single', numClusters: 3 });
console.log(`Single linkage clusters: ${singleResult.numClusters}`);

console.log('\n3. TeraHAC with Complete Linkage:');
const completeResult = teraHAC(hierarchicalGraph, { linkage: 'complete', numClusters: 3 });
console.log(`Complete linkage clusters: ${completeResult.numClusters}`);

console.log('\n4. TeraHAC with Ward Linkage:');
const wardResult = teraHAC(hierarchicalGraph, { linkage: 'ward', numClusters: 3 });
console.log(`Ward linkage clusters: ${wardResult.numClusters}`);

// Run with distance threshold
console.log('\n5. TeraHAC with Distance Threshold:');
const thresholdResult = teraHAC(hierarchicalGraph, { distanceThreshold: 1.5 });
console.log(`Clusters with threshold 1.5: ${thresholdResult.numClusters}`);
console.log(`Max merge distance: ${Math.max(...thresholdResult.distances).toFixed(2)}`);

// Test without graph distance (edge-based only)
console.log('\n6. TeraHAC without Graph Distance:');
const noGraphDistResult = teraHAC(hierarchicalGraph, { 
    useGraphDistance: false, 
    numClusters: 3 
});
console.log(`Edge-based clustering: ${noGraphDistResult.numClusters} clusters`);

// Test on a star graph
console.log('\n7. Star Graph Test:');
const starGraph = new Graph();
const center = 'Center';
for (let i = 1; i <= 8; i++) {
    starGraph.addEdge(center, `Spoke${i}`, 1);
}

const starResult = teraHAC(starGraph, { numClusters: 3 });
console.log(`Star graph clustering: ${starResult.numClusters} clusters`);

// Test on a path graph
console.log('\n8. Path Graph Test:');
const pathGraph = new Graph();
for (let i = 1; i < 8; i++) {
    pathGraph.addEdge(`Node${i}`, `Node${i+1}`, 1);
}

const pathResult = teraHAC(pathGraph, { numClusters: 3 });
console.log(`Path graph clustering: ${pathResult.numClusters} clusters`);

// Test with very small clusters
console.log('\n9. Small Graph Test:');
const smallGraph = new Graph();
smallGraph.addEdge('A', 'B', 1);
smallGraph.addEdge('B', 'C', 1);

const smallResult = teraHAC(smallGraph);
console.log(`Small graph clusters: ${smallResult.numClusters}`);

// Large graph warning test
console.log('\n10. Performance Warning Test:');
const mediumGraph = new Graph();
// Create a graph just under the warning threshold
for (let i = 1; i <= 50; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, 50); j++) {
        mediumGraph.addEdge(`N${i}`, `N${j}`, 1);
    }
}

const mediumResult = teraHAC(mediumGraph, { numClusters: 5 });
console.log(`Medium graph (${mediumGraph.nodeCount} nodes): ${mediumResult.numClusters} clusters`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Should find multiple clusters:', result.numClusters > 1);
console.log('✓ All nodes should be assigned:', 
    result.clusters.size === hierarchicalGraph.nodeCount);
console.log('✓ Cluster IDs should be valid:', 
    Array.from(result.clusters.values()).every(id => id >= 0 && id < result.numClusters));
console.log('✓ Merge distances should be non-decreasing:', 
    result.distances.every((dist, i) => i === 0 || dist >= result.distances[i - 1]));
console.log('✓ Different linkages should produce different results:', 
    JSON.stringify(Array.from(singleResult.clusters.entries()).sort()) !== 
    JSON.stringify(Array.from(completeResult.clusters.entries()).sort()));
console.log('✓ Distance threshold should limit merges:', 
    thresholdResult.distances.every(d => d <= 1.5));
console.log('✓ Star graph should cluster spokes together:', 
    starResult.numClusters <= 3);

// Analyze dendrogram structure
function analyzeDendrogram(node, depth = 0) {
    const info = {
        depth,
        size: node.size,
        distance: node.distance,
        isLeaf: !node.left && !node.right
    };
    
    if (depth === 0) {
        console.log('\nDendrogram Analysis:');
    }
    
    const indent = '  '.repeat(depth);
    if (info.isLeaf) {
        console.log(`${indent}Leaf: ${node.members.size} node(s) - [${Array.from(node.members).join(', ')}]`);
    } else {
        console.log(`${indent}Split at distance ${info.distance.toFixed(2)}: ${info.size} total nodes`);
        if (node.left) analyzeDendrogram(node.left, depth + 1);
        if (node.right) analyzeDendrogram(node.right, depth + 1);
    }
    
    return info;
}

analyzeDendrogram(result.dendrogram);

// Quality assessment
console.log('\nClustering Quality Assessment:');
let totalIntraDistance = 0;
let totalInterDistance = 0;
let intraPairs = 0;
let interPairs = 0;

for (const [clusterId1, members1] of clusterMembers) {
    for (const [clusterId2, members2] of clusterMembers) {
        for (const node1 of members1) {
            for (const node2 of members2) {
                if (node1 !== node2) {
                    const hasEdge = hierarchicalGraph.hasEdge(node1, node2);
                    const distance = hasEdge ? 1 : 2;
                    
                    if (clusterId1 === clusterId2) {
                        totalIntraDistance += distance;
                        intraPairs++;
                    } else if (clusterId1 < clusterId2) {
                        totalInterDistance += distance;
                        interPairs++;
                    }
                }
            }
        }
    }
}

const avgIntraDistance = intraPairs > 0 ? totalIntraDistance / intraPairs : 0;
const avgInterDistance = interPairs > 0 ? totalInterDistance / interPairs : 0;

console.log(`Average intra-cluster distance: ${avgIntraDistance.toFixed(3)}`);
console.log(`Average inter-cluster distance: ${avgInterDistance.toFixed(3)}`);
console.log('✓ Good clustering should have smaller intra-cluster distances:', 
    avgIntraDistance < avgInterDistance);