// Import Louvain community detection from the bundled algorithms
import { Graph, louvain } from './algorithms.js';

export function runLouvainDetection(nodes, edges, resolution = 1.0) {
    // Create a graph instance using our package
    const graph = new Graph();
    
    // Add nodes to the graph
    nodes.forEach(node => {
        graph.addNode(node.id);
    });
    
    // Add edges to the graph
    edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target);
    });
    
    console.log('Graph created:', {
        nodes: Array.from(graph.nodes()).map(n => n.id),
        edges: Array.from(graph.edges()).length
    });
    
    // Run the actual Louvain algorithm from the package
    const result = louvain(graph, {
        resolution: resolution,
        maxIterations: 100,
        tolerance: 1e-6
    });
    
    console.log('Louvain algorithm result:', result);
    console.log('Modularity:', result.modularity);
    console.log('Iterations:', result.iterations);
    console.log('Communities:', result.communities);
    
    // Convert the result format for visualization
    // result.communities is an array of arrays (each sub-array is a community)
    const communityMap = {};
    const communityGroups = {};
    
    result.communities.forEach((community, communityIndex) => {
        communityGroups[communityIndex] = [];
        community.forEach(nodeId => {
            communityMap[nodeId] = communityIndex;
            communityGroups[communityIndex].push(nodeId);
        });
    });
    
    console.log('Community map:', communityMap);
    console.log('Community groups:', communityGroups);
    
    return {
        communities: communityMap,
        communityGroups: communityGroups,
        modularity: result.modularity,
        iterations: result.iterations
    };
}