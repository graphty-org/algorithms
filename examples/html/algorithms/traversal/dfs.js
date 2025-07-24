// Import the Graph class and depthFirstSearch function from @graphty/algorithms
import { Graph, depthFirstSearch } from './algorithms.js';

// This function demonstrates how to use the DFS algorithm from @graphty/algorithms
export function runDFSAlgorithm() {
    // Step 1: Create a new graph instance
    const graph = new Graph({ directed: false });
    
    // Step 2: Add nodes to the graph
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    nodes.forEach(node => {
        graph.addNode(node);
    });
    
    // Step 3: Add edges to create a tree structure
    const edges = [
        ['A', 'B'],
        ['A', 'C'],
        ['B', 'D'],
        ['B', 'E'],
        ['C', 'F'],
        ['C', 'G'],
        ['E', 'H']
    ];
    
    edges.forEach(([from, to]) => {
        graph.addEdge(from, to);
    });
    
    // Step 4: Run the DFS algorithm starting from node 'A'
    const result = depthFirstSearch(graph, 'A');
    
    // Step 5: Return the traversal result
    // The result object contains:
    // - visited: array of nodes in the order they were visited
    // - parent: map of each node to its parent in the DFS tree
    return result;
}