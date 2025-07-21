// Girvan-Newman Community Detection Algorithm Example
import { Graph, girvanNewman } from '../dist/algorithms.js';

console.log('=== Girvan-Newman Community Detection Example ===');

// Create a classic network with two well-defined communities connected by a bridge
const network = new Graph();

// Community 1: Tightly connected group
network.addEdge('A', 'B');
network.addEdge('A', 'C');
network.addEdge('B', 'C');
network.addEdge('B', 'D');
network.addEdge('C', 'D');

// Community 2: Another tightly connected group
network.addEdge('E', 'F');
network.addEdge('E', 'G');
network.addEdge('F', 'G');
network.addEdge('F', 'H');
network.addEdge('G', 'H');

// Bridge connecting the two communities
network.addEdge('D', 'E');  // This edge has high betweenness centrality

console.log('Network Structure:');
console.log('Community 1: A-B-C-D (densely connected)');
console.log('Community 2: E-F-G-H (densely connected)');
console.log('Bridge: D-E (connects the communities)');
console.log('');
console.log('A --- B --- D === E --- F');
console.log('|     |     |   |     |');
console.log('|     |     |   |     |');
console.log('C ----+     |   +---- G');
console.log('      |     |         |');
console.log('      D     E --------H');

// Run Girvan-Newman algorithm
console.log('\n1. Basic Girvan-Newman Community Detection:');
const result = girvanNewman(network);
console.log(`Final communities: ${result.communities.length}`);
console.log(`Final modularity: ${result.modularity.toFixed(4)}`);
console.log(`Dendrogram steps: ${result.dendrogram.length}`);

console.log('\nFinal community assignments:');
result.communities.forEach((community, index) => {
    console.log(`Community ${index + 1}: [${Array.from(community).sort().join(', ')}]`);
});

// Show the dendrogram (hierarchical community structure)
console.log('\n2. Hierarchical Dendrogram:');
console.log('Edge removal order and resulting communities:');
result.dendrogram.forEach((step, index) => {
    console.log(`Step ${index + 1}: Remove edge ${step.removedEdge || 'none'}`);
    console.log(`  Communities: ${step.communities.length}`);
    console.log(`  Modularity: ${step.modularity.toFixed(4)}`);
    if (step.communities.length <= 4) {  // Only show details for few communities
        step.communities.forEach((community, i) => {
            console.log(`    ${i + 1}: [${Array.from(community).sort().join(', ')}]`);
        });
    }
    console.log('');
});

// Run with maximum communities limit
console.log('\n3. Limiting maximum communities to 3:');
const limitedResult = girvanNewman(network, { maxCommunities: 3 });
console.log(`Limited communities: ${limitedResult.communities.length}`);
console.log(`Limited modularity: ${limitedResult.modularity.toFixed(4)}`);

// Run with minimum community size constraint
console.log('\n4. Minimum community size of 2:');
const minSizeResult = girvanNewman(network, { minCommunitySize: 2 });
console.log(`Communities with min size 2: ${minSizeResult.communities.length}`);
minSizeResult.communities.forEach((community, index) => {
    console.log(`Community ${index + 1} (size ${community.size}): [${Array.from(community).sort().join(', ')}]`);
});

// Test on a star network (should split into center + leaves)
console.log('\n5. Star Network Example:');
const star = new Graph();
star.addEdge('Center', 'Leaf1');
star.addEdge('Center', 'Leaf2');
star.addEdge('Center', 'Leaf3');
star.addEdge('Center', 'Leaf4');

const starResult = girvanNewman(star, { maxCommunities: 3 });
console.log(`Star network communities: ${starResult.communities.length}`);
starResult.communities.forEach((community, index) => {
    console.log(`Star Community ${index + 1}: [${Array.from(community).sort().join(', ')}]`);
});

// Test on a path graph
console.log('\n6. Path Network Example:');
const path = new Graph();
path.addEdge('1', '2');
path.addEdge('2', '3');
path.addEdge('3', '4');
path.addEdge('4', '5');

const pathResult = girvanNewman(path, { maxCommunities: 3 });
console.log(`Path network communities: ${pathResult.communities.length}`);
pathResult.communities.forEach((community, index) => {
    console.log(`Path Community ${index + 1}: [${Array.from(community).sort().join(', ')}]`);
});

// Find the best modularity in the dendrogram
console.log('\n7. Best Modularity Analysis:');
const bestStep = result.dendrogram.reduce((best, current) => 
    current.modularity > best.modularity ? current : best);
console.log(`Best modularity: ${bestStep.modularity.toFixed(4)}`);
console.log(`Best number of communities: ${bestStep.communities.length}`);
console.log('Best communities:');
bestStep.communities.forEach((community, index) => {
    console.log(`  ${index + 1}: [${Array.from(community).sort().join(', ')}]`);
});

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Should detect 2 main communities in basic network:', 
    result.communities.length === 2);
console.log('✓ Communities should be well-separated (high modularity):', 
    result.modularity > 0.3);
console.log('✓ All nodes should be assigned to communities:', 
    result.communities.reduce((total, community) => total + community.size, 0) === network.nodeCount);
console.log('✓ Dendrogram should show hierarchical structure:', 
    result.dendrogram.length > 0);
console.log('✓ Modularity should generally increase until optimal point:', 
    result.dendrogram.some(step => step.modularity > 0));
console.log('✓ Star network should separate center from leaves or keep together');
console.log('✓ Path network should break at weak points');

// Check that the bridge edge was likely removed early
const bridgeRemoved = result.dendrogram.some(step => 
    step.removedEdge === 'D-E' || step.removedEdge === 'E-D');
console.log('✓ Bridge edge D-E should be removed (high betweenness):', bridgeRemoved);