import { Graph, hits } from './algorithms.js';

// Create a directed graph representing a web-like structure
const graph = new Graph({ directed: true });

// Add nodes
const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
nodes.forEach(node => graph.addNode(node));

// Add directed edges to create hub and authority structure
const edges = [
    // A is a hub pointing to several authorities
    ['A', 'B'], ['A', 'C'], ['A', 'D'],
    
    // E is another hub
    ['E', 'D'], ['E', 'F'], ['E', 'G'],
    
    // Some cross-links creating mixed hub/authority nodes
    ['B', 'H'], ['C', 'H'],
    ['H', 'F'], ['H', 'G']
];

edges.forEach(([source, target]) => graph.addEdge(source, target));

// Run HITS algorithm with analysis
export function runHITS() {
    console.log('=== HITS Algorithm Example ===\n');
    
    const result = hits(graph, {
        maxIterations: 100,
        tolerance: 1e-6
    });
    
    console.log('Hub Scores:');
    const hubEntries = Object.entries(result.hubs)
        .sort(([,a], [,b]) => b - a);
    hubEntries.forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(4)}`);
    });
    
    console.log('\nAuthority Scores:');
    const authEntries = Object.entries(result.authorities)
        .sort(([,a], [,b]) => b - a);
    authEntries.forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(4)}`);
    });
    
    // Analysis
    const topHub = hubEntries[0];
    const topAuth = authEntries[0];
    
    console.log('\n=== Analysis ===');
    console.log(`Top Hub: ${topHub[0]} (score: ${topHub[1].toFixed(4)})`);
    console.log(`Top Authority: ${topAuth[0]} (score: ${topAuth[1].toFixed(4)})`);
    
    // Find nodes that are both good hubs and authorities
    const combined = nodes.map(node => ({
        node,
        hub: result.hubs[node] || 0,
        auth: result.authorities[node] || 0,
        combined: (result.hubs[node] || 0) + (result.authorities[node] || 0)
    })).sort((a, b) => b.combined - a.combined);
    
    console.log('\nNodes ranked by combined hub + authority scores:');
    combined.forEach(({node, hub, auth, combined}, index) => {
        console.log(`  ${index + 1}. ${node}: Hub=${hub.toFixed(3)}, Auth=${auth.toFixed(3)}, Total=${combined.toFixed(3)}`);
    });
    
    // Show graph structure analysis
    console.log('\n=== Graph Structure ===');
    nodes.forEach(node => {
        const outDegree = Array.from(graph.outNeighbors(node)).length;
        const inDegree = Array.from(graph.inNeighbors(node)).length;
        const hubScore = result.hubs[node] || 0;
        const authScore = result.authorities[node] || 0;
        
        console.log(`${node}: out=${outDegree}, in=${inDegree}, hub=${hubScore.toFixed(3)}, auth=${authScore.toFixed(3)}`);
    });
    
    return result;
}