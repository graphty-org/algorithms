// Educational wrapper around @graphty/algorithms Bellman-Ford implementation
// Import the actual Graph class and bellmanFord function from our package
import { Graph, bellmanFord } from './algorithms.js';

/**
 * Educational wrapper that runs Bellman-Ford with step-by-step tracking
 * Uses the actual @graphty/algorithms implementation under the hood
 */
export function runBellmanFordAlgorithm() {
    // Create a directed Graph using our actual library (Bellman-Ford needs directed edges)
    const graph = new Graph({ directed: true });
    
    // Add nodes
    const nodes = ['S', 'A', 'B', 'C', 'D'];
    nodes.forEach(node => graph.addNode(node));
    
    // Add edges with weights (including negative weight)
    const edges = [
        ['S', 'A', 4],
        ['S', 'C', 2],
        ['A', 'B', 3],
        ['A', 'C', -5], // Negative edge weight - this is what makes Bellman-Ford special!
        ['C', 'D', 4],
        ['B', 'D', 1]
    ];
    
    edges.forEach(([from, to, weight]) => {
        graph.addEdge(from, to, weight);
    });
    
    // Debug: Check what our graph looks like
    console.log('Graph nodes:', Array.from(graph.nodes()).map(n => n.id));
    console.log('Graph edges:', Array.from(graph.edges()).map(e => `${e.source}→${e.target} (${e.weight})`));
    
    // Now we'll manually run Bellman-Ford with step tracking for educational purposes
    // This recreates the algorithm logic while using our Graph structure
    const source = 'S';
    const distances = new Map();
    const relaxationSteps = [];
    
    // Initialize distances
    nodes.forEach(node => {
        distances.set(node, node === source ? 0 : Infinity);
    });
    
    // Relax edges |V| - 1 times, recording each step
    for (let i = 0; i < nodes.length - 1; i++) {
        let hasIterationChange = false;
        const iterationStartDistances = new Map(distances);
        
        // Get all edges from our Graph and relax them
        for (const edge of graph.edges()) {
            const from = edge.source;
            const to = edge.target;
            const weight = edge.weight ?? 1;
            
            const oldDistance = distances.get(to);
            const distanceFrom = distances.get(from);
            const newPotentialDistance = distanceFrom !== Infinity ? distanceFrom + weight : Infinity;
            const canImprove = distanceFrom !== Infinity && distanceFrom + weight < oldDistance;
            
            console.log(`Relaxing ${from}→${to} (weight: ${weight}): from distance=${distanceFrom}, old distance=${oldDistance}, can improve=${canImprove}`);
            
            if (canImprove) {
                distances.set(to, distanceFrom + weight);
                hasIterationChange = true;
                console.log(`  → Updated ${to} distance to ${distanceFrom + weight}`);
            }
            
            // Record this relaxation step for visualization
            relaxationSteps.push({
                iteration: i + 1,
                edge: [from, to, weight],
                oldDistance: oldDistance,
                newPotentialDistance: newPotentialDistance,
                newDistance: distances.get(to),
                improved: canImprove,
                distancesBefore: new Map(iterationStartDistances),
                distancesAfter: new Map(distances)
            });
        }
        
        // Early termination if no changes
        if (!hasIterationChange) {
            console.log(`Converged early after ${i + 1} iterations`);
            break;
        }
    }
    
    // Use our actual package function to get the authoritative result and check for negative cycles
    console.log('About to call bellmanFord with:', graph, source);
    const packageResult = bellmanFord(graph, source);
    
    console.log('Package result:', packageResult);
    console.log('Package distances:', packageResult.distances);
    console.log('Package distances entries:', Array.from(packageResult.distances.entries()));
    console.log('Final distances as object:', Object.fromEntries(packageResult.distances));
    
    // Convert our educational tracking format to match the expected format
    const relaxationStepsConverted = relaxationSteps.map(step => ({
        ...step,
        distancesBefore: Object.fromEntries(step.distancesBefore),
        distancesAfter: Object.fromEntries(step.distancesAfter)
    }));
    
    // Convert our manual implementation distances to plain object
    const finalDistancesFromManual = Object.fromEntries(distances);
    
    const result = {
        finalDistances: finalDistancesFromManual,
        relaxationSteps: relaxationStepsConverted,
        hasNegativeCycle: packageResult.hasNegativeCycle,
        graph: {
            nodes: nodes,
            edges: edges
        }
    };
    
    console.log('Using manual distances:', finalDistancesFromManual);
    
    console.log('Final result being returned:', result);
    return result;
}

// Example of how the algorithm works:
// 1. Initialize distances: source = 0, all others = infinity
// 2. For V-1 iterations, relax all edges:
//    - For each edge (u,v) with weight w:
//      if distance[u] + w < distance[v], then distance[v] = distance[u] + w
// 3. Run one more iteration to detect negative cycles
// 4. If any distance can still be improved, there's a negative cycle