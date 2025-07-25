// Educational wrapper around @graphty/algorithms Floyd-Warshall implementation
// Import the actual Graph class and floydWarshall function from our package
import { Graph, floydWarshall } from './algorithms.js';

/**
 * Educational wrapper that runs Floyd-Warshall with step-by-step tracking
 * Uses the actual @graphty/algorithms implementation under the hood
 */
export function runFloydWarshallAlgorithm() {
    // Create a directed Graph for better Floyd-Warshall demonstration
    const graph = new Graph({ directed: true });
    
    // Add nodes (5 nodes for clearer demonstration)
    const nodes = ['A', 'B', 'C', 'D', 'E'];
    nodes.forEach(node => graph.addNode(node));
    
    // Add directed edges with weights - designed for clear Floyd-Warshall demonstration
    const edges = [
        // Direct connections forming a network
        ['A', 'B', 3],   // A → B
        ['A', 'E', 8],   // A → E (longer path, will be improved)
        ['B', 'C', 2],   // B → C  
        ['B', 'E', 5],   // B → E
        ['C', 'D', 1],   // C → D
        ['D', 'E', 2],   // D → E
        ['E', 'C', 6],   // E → C (longer path, will be improved)
    ];
    
    edges.forEach(([from, to, weight]) => {
        graph.addEdge(from, to, weight);
    });
    
    console.log('Graph nodes:', Array.from(graph.nodes()).map(n => n.id));
    console.log('Graph edges:', Array.from(graph.edges()).map(e => `${e.source}↔${e.target} (${e.weight})`));
    
    // Initialize distance matrix for educational purposes
    const distance = {};
    nodes.forEach(from => {
        distance[from] = {};
        nodes.forEach(to => {
            if (from === to) {
                distance[from][to] = 0;
            } else {
                distance[from][to] = Infinity;
            }
        });
    });
    
    // Set direct edge weights (directed graph)
    for (const edge of graph.edges()) {
        const weight = edge.weight ?? 1;
        distance[edge.source][edge.target] = weight;
        // Don't set reverse direction for directed graph
    }
    
    // Store initial matrix
    const initialMatrix = {};
    nodes.forEach(from => {
        initialMatrix[from] = { ...distance[from] };
    });
    
    // Manual Floyd-Warshall implementation for detailed educational step tracking
    const detailedSteps = [];
    
    for (const k of nodes) {
        console.log(`\n=== Iteration ${k}: Using ${k} as intermediate vertex ===`);
        
        // For each pair of nodes (i,j), check if path through k is shorter
        for (const i of nodes) {
            for (const j of nodes) {
                if (i !== j) {
                    const directDistance = distance[i][j];
                    const distanceToK = distance[i][k];
                    const distanceFromK = distance[k][j];
                    const viaKDistance = distanceToK + distanceFromK;
                    
                    // Create detailed step for each comparison
                    const step = {
                        type: 'compare',
                        intermediate: k,
                        from: i,
                        to: j,
                        directDistance: directDistance,
                        distanceToIntermediate: distanceToK,
                        distanceFromIntermediate: distanceFromK,
                        pathViaIntermediate: viaKDistance,
                        improved: viaKDistance < directDistance,
                        friendlyFormula: `Path ${i}→${j}: Direct route (${directDistance === Infinity ? 'no path' : directDistance}) vs. Going through ${k} (${distanceToK === Infinity ? 'no path' : distanceToK} + ${distanceFromK === Infinity ? 'no path' : distanceFromK} = ${viaKDistance === Infinity ? 'no path' : viaKDistance})`
                    };
                    
                    // If path through k is shorter, update the distance
                    if (viaKDistance < directDistance) {
                        distance[i][j] = viaKDistance;
                        step.newDistance = viaKDistance;
                        console.log(`  ${i} → ${j}: Improved from ${directDistance === Infinity ? '∞' : directDistance} to ${viaKDistance} via ${k}`);
                    } else {
                        step.newDistance = directDistance;
                        console.log(`  ${i} → ${j}: No improvement (${directDistance === Infinity ? '∞' : directDistance} ≤ ${viaKDistance === Infinity ? '∞' : viaKDistance})`);
                    }
                    
                    detailedSteps.push(step);
                }
            }
        }
        
        // Store matrix state after this iteration
        const afterMatrix = {};
        nodes.forEach(from => {
            afterMatrix[from] = { ...distance[from] };
        });
        
        detailedSteps.push({
            type: 'iteration_complete',
            k: k,
            matrix: afterMatrix
        });
    }
    
    // Use our actual package function to get the authoritative result
    const packageResult = floydWarshall(graph);
    
    console.log('Manual result (for animation):', distance);
    console.log('Package result (authoritative):', packageResult);
    
    // Convert package result to match expected format
    const finalMatrix = {};
    nodes.forEach(from => {
        finalMatrix[from] = {};
        const sourceDistances = packageResult.distances.get(from);
        nodes.forEach(to => {
            finalMatrix[from][to] = sourceDistances?.get(to) ?? Infinity;
        });
    });
    
    return {
        initialMatrix: initialMatrix,
        finalMatrix: finalMatrix, // Use authoritative result
        detailedSteps: detailedSteps, // New detailed step-by-step data
        graph: {
            nodes: nodes,
            edges: edges
        }
    };
}

// Example of how the algorithm works:
// 1. Initialize distance matrix with edge weights (infinity for non-adjacent)
// 2. For each vertex k as intermediate point:
//    - For each pair of vertices (i,j):
//      - Check if distance[i][k] + distance[k][j] < distance[i][j]
//      - If yes, update distance[i][j] = distance[i][k] + distance[k][j]
// 3. After processing all vertices, matrix contains shortest distances between all pairs
// 4. Time complexity: O(V³) where V is the number of vertices