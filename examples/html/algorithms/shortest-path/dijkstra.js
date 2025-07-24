// Import the Graph class and dijkstra function from @graphty/algorithms
import { Graph, dijkstra } from './algorithms.js';

// This function demonstrates how to use Dijkstra's algorithm from @graphty/algorithms
export function runDijkstraAlgorithm() {
    // Step 1: Create a new graph instance
    const graph = new Graph({ directed: false });
    
    // Step 2: Add nodes to the graph
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F'];
    nodes.forEach(node => {
        graph.addNode(node);
    });
    
    // Step 3: Add weighted edges to the graph
    // Each edge has a weight representing the distance/cost
    const edges = [
        { from: 'A', to: 'B', weight: 4 },
        { from: 'A', to: 'C', weight: 2 },
        { from: 'B', to: 'D', weight: 5 },
        { from: 'C', to: 'B', weight: 1 },
        { from: 'C', to: 'E', weight: 8 },
        { from: 'D', to: 'F', weight: 3 },
        { from: 'E', to: 'D', weight: 2 },
        { from: 'E', to: 'F', weight: 1 }
    ];
    
    edges.forEach(({ from, to, weight }) => {
        graph.addEdge(from, to, weight);
    });
    
    // Step 4: Run Dijkstra's algorithm starting from node 'A'
    const resultMap = dijkstra(graph, 'A');
    
    // Step 5: Convert the Map result to the format expected by the visualization
    // dijkstra returns a Map<NodeId, ShortestPathResult>
    // We need to create a single object with distance and previous properties
    const distance = {};
    const previous = {};
    
    // Extract distances and predecessors from the result map
    for (const [nodeId, result] of resultMap) {
        distance[nodeId] = result.distance;
        // Extract the predecessor for this node
        previous[nodeId] = result.predecessor.get(nodeId) || null;
    }
    
    // Return an object matching the expected format
    return { distance, previous };
}

// Helper function to reconstruct the shortest path from start to a target node
export function getShortestPath(result, target) {
    const path = [];
    let current = target;
    
    // Check if the target is reachable
    if (!result.previous || result.previous[target] === undefined) {
        return []; // Return empty path if target is unreachable
    }
    
    // Backtrack from target to start using the previous map
    while (current !== null && current !== undefined) {
        path.unshift(current);
        current = result.previous[current];
    }
    
    return path;
}