// Louvain Community Detection Algorithm Example
import { Graph, louvain } from '../dist/algorithms.js';

console.log('=== Louvain Community Detection Example ===');

// Create a social network with distinct communities
const socialNetwork = new Graph();

// Community 1: Research Group
socialNetwork.addEdge('Alice', 'Bob', 3);
socialNetwork.addEdge('Alice', 'Charlie', 4);
socialNetwork.addEdge('Bob', 'Charlie', 5);
socialNetwork.addEdge('Bob', 'David', 2);
socialNetwork.addEdge('Charlie', 'David', 3);

// Community 2: Sports Team
socialNetwork.addEdge('Eve', 'Frank', 4);
socialNetwork.addEdge('Eve', 'Grace', 3);
socialNetwork.addEdge('Frank', 'Grace', 5);
socialNetwork.addEdge('Frank', 'Henry', 2);
socialNetwork.addEdge('Grace', 'Henry', 4);

// Community 3: Music Band
socialNetwork.addEdge('Ivy', 'Jack', 3);
socialNetwork.addEdge('Ivy', 'Kate', 4);
socialNetwork.addEdge('Jack', 'Kate', 5);

// Inter-community connections (weaker)
socialNetwork.addEdge('David', 'Eve', 1);    // Research to Sports
socialNetwork.addEdge('Henry', 'Ivy', 1);    // Sports to Music
socialNetwork.addEdge('Alice', 'Ivy', 1);    // Research to Music

console.log('Social Network Structure:');
console.log('Research Group: Alice-Bob-Charlie-David (strong connections)');
console.log('Sports Team: Eve-Frank-Grace-Henry (strong connections)');
console.log('Music Band: Ivy-Jack-Kate (strong connections)');
console.log('Weak bridges: David-Eve, Henry-Ivy, Alice-Ivy');

// Run Louvain community detection
console.log('\n1. Basic Louvain Community Detection:');
const result = louvain(socialNetwork);
console.log(`Found ${result.communities.length} communities`);
console.log(`Modularity: ${result.modularity.toFixed(4)}`);
console.log(`Iterations: ${result.iterations}`);

console.log('\nCommunity assignments:');
result.communities.forEach((community, index) => {
    console.log(`Community ${index + 1}: [${Array.from(community).sort().join(', ')}]`);
});

// Run with different resolution parameter
console.log('\n2. Louvain with higher resolution (more communities):');
const highResResult = louvain(socialNetwork, { resolution: 1.5 });
console.log(`Communities with high resolution: ${highResResult.communities.length}`);
console.log(`Modularity: ${highResResult.modularity.toFixed(4)}`);

console.log('\nHigh resolution communities:');
highResResult.communities.forEach((community, index) => {
    console.log(`Community ${index + 1}: [${Array.from(community).sort().join(', ')}]`);
});

// Run with lower resolution parameter
console.log('\n3. Louvain with lower resolution (fewer communities):');
const lowResResult = louvain(socialNetwork, { resolution: 0.5 });
console.log(`Communities with low resolution: ${lowResResult.communities.length}`);
console.log(`Modularity: ${lowResResult.modularity.toFixed(4)}`);

// Test on a simple bipartite-like graph
console.log('\n4. Bipartite-like Network:');
const bipartite = new Graph();
bipartite.addEdge('A1', 'B1', 2);
bipartite.addEdge('A1', 'B2', 2);
bipartite.addEdge('A2', 'B1', 2);
bipartite.addEdge('A2', 'B2', 2);
bipartite.addEdge('A3', 'B3', 2);
bipartite.addEdge('A3', 'B4', 2);
bipartite.addEdge('A4', 'B3', 2);
bipartite.addEdge('A4', 'B4', 2);
// Weak connection between groups
bipartite.addEdge('B2', 'B3', 0.5);

const bipartiteResult = louvain(bipartite);
console.log(`Bipartite communities: ${bipartiteResult.communities.length}`);
console.log(`Bipartite modularity: ${bipartiteResult.modularity.toFixed(4)}`);

// Test convergence with strict tolerance
console.log('\n5. Convergence with strict tolerance:');
const strictResult = louvain(socialNetwork, { tolerance: 0.001 });
console.log(`Strict tolerance iterations: ${strictResult.iterations}`);
console.log(`Final modularity: ${strictResult.modularity.toFixed(6)}`);

// Test maximum iterations limit
console.log('\n6. Limited iterations:');
const limitedResult = louvain(socialNetwork, { maxIterations: 2 });
console.log(`Limited to 2 iterations: ${limitedResult.iterations}`);
console.log(`Modularity after 2 iterations: ${limitedResult.modularity.toFixed(4)}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Basic result should find 3 communities:', 
    result.communities.length === 3);
console.log('✓ Modularity should be positive for good community structure:', 
    result.modularity > 0);
console.log('✓ All nodes should be assigned to exactly one community:', 
    result.communities.reduce((total, community) => total + community.length, 0) === socialNetwork.nodeCount);
console.log('✓ Higher resolution should find more communities:', 
    highResResult.communities.length >= result.communities.length);
console.log('✓ Lower resolution should find fewer communities:', 
    lowResResult.communities.length <= result.communities.length);
console.log('✓ Communities should be non-empty:', 
    result.communities.every(community => community.length > 0));

// Check community quality by examining within vs between community edges
let withinCommunityEdges = 0;
let betweenCommunityEdges = 0;

for (const edge of socialNetwork.edges()) {
    const sourceCommunity = result.communities.findIndex(c => c.includes(edge.source));
    const targetCommunity = result.communities.findIndex(c => c.includes(edge.target));
    
    if (sourceCommunity === targetCommunity) {
        withinCommunityEdges++;
    } else {
        betweenCommunityEdges++;
    }
}

console.log(`✓ Within-community edges: ${withinCommunityEdges}`);
console.log(`✓ Between-community edges: ${betweenCommunityEdges}`);
console.log('✓ Good communities should have more within than between edges:', 
    withinCommunityEdges > betweenCommunityEdges);