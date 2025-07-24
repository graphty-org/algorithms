// Import the Graph class and degree centrality functions from @graphty/algorithms
import { Graph, degreeCentrality } from './algorithms.js';

// This function demonstrates how to use degree centrality from @graphty/algorithms
export async function runDegreeCentrality(graphData) {
    // Step 1: Create a new graph instance
    const graph = new Graph({ directed: graphData.directed });
    
    // Step 2: Add nodes to the graph
    graphData.nodes.forEach(node => {
        graph.addNode(node.id);
    });
    
    // Step 3: Add edges to the graph
    graphData.edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target);
    });
    
    // Step 4: Calculate degree centrality
    const centralityResult = degreeCentrality(graph);
    
    // Step 5: Prepare the result
    const result = {
        centrality: centralityResult,
        nodeCount: graphData.nodes.length,
        edgeCount: graphData.edges.length,
        directed: graphData.directed
    };
    
    // For directed graphs, calculate in-degree and out-degree separately
    if (graphData.directed) {
        const inDegree = {};
        const outDegree = {};
        
        // Initialize counts
        graphData.nodes.forEach(node => {
            inDegree[node.id] = 0;
            outDegree[node.id] = 0;
        });
        
        // Count degrees
        graphData.edges.forEach(edge => {
            outDegree[edge.source]++;
            inDegree[edge.target]++;
        });
        
        result.inDegree = inDegree;
        result.outDegree = outDegree;
    }
    
    // Log results for educational purposes
    console.log('Degree Centrality Results:', result);
    console.log('Most central node:', Object.entries(centralityResult)
        .sort(([,a], [,b]) => b - a)[0]);
    
    return result;
}

// Example of using degree centrality for node ranking
export function rankNodesByDegree(graph) {
    const centrality = degreeCentrality(graph);
    
    // Sort nodes by centrality score
    const rankedNodes = Object.entries(centrality)
        .sort(([,a], [,b]) => b - a)
        .map(([nodeId, score], index) => ({
            rank: index + 1,
            nodeId,
            centralityScore: score
        }));
    
    return rankedNodes;
}