import { labelPropagation } from './algorithms.js';

// Create a graph with community structure
const graph = new Map([
    // Community 1
    ['A', new Map([['B', 1], ['C', 1], ['D', 1]])],
    ['B', new Map([['A', 1], ['C', 1], ['D', 1]])],
    ['C', new Map([['A', 1], ['B', 1], ['D', 1]])],
    ['D', new Map([['A', 1], ['B', 1], ['C', 1], ['E', 1], ['J', 1]])],
    
    // Bridge node
    ['E', new Map([['D', 1], ['F', 1], ['N', 1]])],
    
    // Community 2
    ['F', new Map([['E', 1], ['G', 1], ['H', 1], ['I', 1]])],
    ['G', new Map([['F', 1], ['H', 1], ['I', 1]])],
    ['H', new Map([['F', 1], ['G', 1], ['I', 1]])],
    ['I', new Map([['F', 1], ['G', 1], ['H', 1]])],
    
    // Community 3
    ['J', new Map([['D', 1], ['K', 1], ['L', 1]])],
    ['K', new Map([['J', 1], ['L', 1], ['M', 1]])],
    ['L', new Map([['J', 1], ['K', 1], ['M', 1]])],
    ['M', new Map([['K', 1], ['L', 1], ['N', 1]])],
    
    // Community 4
    ['N', new Map([['E', 1], ['M', 1], ['O', 1], ['P', 1], ['Q', 1]])],
    ['O', new Map([['N', 1], ['P', 1]])],
    ['P', new Map([['N', 1], ['O', 1], ['Q', 1]])],
    ['Q', new Map([['N', 1], ['P', 1]])]
]);

// Run Label Propagation
export function runLabelPropagation() {
    const result = labelPropagation(graph, {
        maxIterations: 20,
        randomSeed: 42
    });
    
    console.log('Label Propagation Results:');
    console.log('Communities:', result.communities);
    console.log('Number of communities:', new Set(result.communities.values()).size);
    console.log('Iterations:', result.iterations);
    console.log('Converged:', result.converged);
    
    // Group nodes by community
    const communitiesGrouped = new Map();
    result.communities.forEach((community, node) => {
        if (!communitiesGrouped.has(community)) {
            communitiesGrouped.set(community, []);
        }
        communitiesGrouped.get(community).push(node);
    });
    
    console.log('\nCommunity membership:');
    communitiesGrouped.forEach((nodes, community) => {
        console.log(`Community ${community}: ${nodes.join(', ')}`);
    });
    
    return result;
}