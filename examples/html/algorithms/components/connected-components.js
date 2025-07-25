// Educational wrapper around @graphty/algorithms Connected Components implementation
// Import the actual Graph class and connectedComponents function from our package
import { Graph, connectedComponents } from './algorithms.js';

/**
 * Educational wrapper that runs Connected Components with step-by-step tracking
 * Uses the actual @graphty/algorithms implementation under the hood
 */
export function runConnectedComponentsAlgorithm() {
    // Create an undirected Graph using our actual library
    const graph = new Graph({ directed: false });
    
    // Add nodes
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    nodes.forEach(node => graph.addNode(node));
    
    // Add edges to create a disconnected graph with 3 components
    const edges = [
        // Component 1: A-B-C triangle
        ['A', 'B'], ['B', 'C'], ['C', 'A'],
        
        // Component 2: D-E-F-G cycle
        ['D', 'E'], ['E', 'F'], ['F', 'G'], ['G', 'D'],
        
        // Component 3: H-I pair
        ['H', 'I']
    ];
    
    edges.forEach(([from, to]) => {
        graph.addEdge(from, to);
    });
    
    console.log('Graph nodes:', Array.from(graph.nodes()).map(n => n.id));
    console.log('Graph edges:', Array.from(graph.edges()).map(e => `${e.source}↔${e.target}`));
    
    // Now we'll manually run Connected Components with step tracking for educational purposes
    // This recreates the algorithm logic while using our Graph structure
    const visited = new Set();
    const steps = []; // For animation
    let componentId = 0;
    
    // Manual BFS implementation for educational step tracking
    const manualComponents = [];
    
    for (const nodeObj of graph.nodes()) {
        const startNode = nodeObj.id;
        if (!visited.has(startNode)) {
            // Start a new component
            const currentComponent = [];
            const queue = [startNode];
            
            // BFS to find all nodes in this component
            while (queue.length > 0) {
                const currentNode = queue.shift();
                
                if (!visited.has(currentNode)) {
                    visited.add(currentNode);
                    currentComponent.push(currentNode);
                    
                    // Add step for animation
                    steps.push({
                        type: 'visit',
                        node: currentNode,
                        componentId: componentId
                    });
                    
                    // Add unvisited neighbors to queue using our Graph's neighbors method
                    for (const neighbor of graph.neighbors(currentNode)) {
                        if (!visited.has(neighbor)) {
                            queue.push(neighbor);
                        }
                    }
                }
            }
            
            // Sort component nodes for consistent display
            currentComponent.sort();
            manualComponents.push(currentComponent);
            componentId++;
        }
    }
    
    // Use our actual package function to get the authoritative result
    const packageComponents = connectedComponents(graph);
    
    console.log('Manual components (for animation):', manualComponents);
    console.log('Package components (authoritative):', packageComponents);
    
    // Convert package result to match expected format
    const sortedPackageComponents = packageComponents.map(component => [...component].sort());
    
    return {
        components: sortedPackageComponents,
        steps: steps,
        graph: {
            nodes: nodes,
            edges: edges,
            adjacencyList: nodes.reduce((adj, node) => {
                adj[node] = Array.from(graph.neighbors(node));
                return adj;
            }, {})
        }
    };
}

// Example of how the algorithm works:
// 1. Start with an unvisited node and begin BFS
// 2. Visit all nodes reachable from the starting node
// 3. All visited nodes form one connected component
// 4. Repeat with the next unvisited node until all nodes are processed
// 5. Each separate BFS traversal finds one connected component