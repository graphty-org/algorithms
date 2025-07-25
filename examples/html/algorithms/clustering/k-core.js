// Import k-core decomposition from @graphty/algorithms
import { kCoreDecomposition } from './algorithms.js';

export function runKCoreDecomposition(edges) {
    // Convert edges to adjacency list format expected by the algorithm
    const graph = new Map();
    
    // Build adjacency list from edges
    edges.forEach(edge => {
        // Initialize sets if not exists
        if (!graph.has(edge.source)) {
            graph.set(edge.source, new Set());
        }
        if (!graph.has(edge.target)) {
            graph.set(edge.target, new Set());
        }
        
        // Add undirected edges
        graph.get(edge.source).add(edge.target);
        graph.get(edge.target).add(edge.source);
    });
    
    console.log('Graph created:', {
        nodes: Array.from(graph.keys()),
        edges: edges.length
    });
    
    // Run the actual k-core decomposition from the package
    const result = kCoreDecomposition(graph);
    
    console.log('K-Core Decomposition Result:', {
        maxCore: result.maxCore,
        coreness: Array.from(result.coreness.entries()),
        cores: Array.from(result.cores.entries()).map(([k, nodes]) => ({
            core: k,
            nodes: Array.from(nodes)
        }))
    });
    
    // Display detailed results
    console.log('\nNodes by coreness:');
    const coreGroups = {};
    result.coreness.forEach((coreness, nodeId) => {
        if (!coreGroups[coreness]) {
            coreGroups[coreness] = [];
        }
        coreGroups[coreness].push(nodeId);
    });
    
    Object.entries(coreGroups)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .forEach(([coreness, nodes]) => {
            console.log(`${coreness}-core: ${nodes.join(', ')}`);
        });
    
    // Calculate degeneracy (maximum core number)
    console.log(`\nGraph degeneracy: ${result.maxCore}`);
    
    // Find the most cohesive core
    const maxCoreNodes = result.cores.get(result.maxCore);
    if (maxCoreNodes) {
        console.log(`Most cohesive core (${result.maxCore}-core): ${Array.from(maxCoreNodes).join(', ')}`);
    }
    
    return result;
}