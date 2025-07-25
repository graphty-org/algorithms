// Educational wrapper around @graphty/algorithms PageRank implementation
// Import the actual Graph class and pageRank function from our package
import { Graph, pageRank } from './algorithms.js';

/**
 * Educational wrapper that runs PageRank with step-by-step tracking
 * Uses the actual @graphty/algorithms implementation under the hood
 */
export function runPageRankAlgorithm(dampingFactor = 0.85) {
    // Create a directed Graph using our actual library (PageRank needs directed edges)
    const graph = new Graph({ directed: true });
    
    // Add nodes
    const nodes = ['A', 'B', 'C', 'D', 'E', 'F'];
    nodes.forEach(node => graph.addNode(node));
    
    // Add directed edges (who links to whom)
    const edges = [
        ['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'A'],
        ['D', 'C'], ['B', 'D'], ['D', 'E'], ['E', 'F'],
        ['F', 'E'], ['F', 'D']
    ];
    
    edges.forEach(([from, to]) => {
        graph.addEdge(from, to);
    });
    
    console.log('Graph nodes:', Array.from(graph.nodes()).map(n => n.id));
    console.log('Graph edges:', Array.from(graph.edges()).map(e => `${e.source}→${e.target}`));
    
    // Build adjacency lists for educational step tracking
    const outgoingLinks = {};
    const incomingLinks = {};
    
    // Initialize
    nodes.forEach(node => {
        outgoingLinks[node] = [];
        incomingLinks[node] = [];
    });
    
    // Build the link structure using our Graph
    for (const edge of graph.edges()) {
        outgoingLinks[edge.source].push(edge.target);
        incomingLinks[edge.target].push(edge.source);
    }
    
    // Manual PageRank implementation for educational step tracking
    const n = nodes.length;
    let pageRankValues = {};
    nodes.forEach(node => {
        pageRankValues[node] = 1 / n; // Everyone starts with equal rank
    });
    
    const maxIterations = 30;
    const tolerance = 0.0001;
    const iterations = [];
    
    for (let iter = 0; iter < maxIterations; iter++) {
        const newPageRank = {};
        let totalChange = 0;
        
        // Calculate new PageRank for each node
        nodes.forEach(node => {
            // Random jump component
            let rank = (1 - dampingFactor) / n;
            
            // Contribution from incoming links
            incomingLinks[node].forEach(incomingNode => {
                const outDegree = outgoingLinks[incomingNode].length;
                if (outDegree > 0) {
                    rank += dampingFactor * (pageRankValues[incomingNode] / outDegree);
                }
            });
            
            newPageRank[node] = rank;
            totalChange += Math.abs(rank - pageRankValues[node]);
        });
        
        // Store this iteration's results
        iterations.push({
            iteration: iter + 1,
            scores: {...newPageRank},
            change: totalChange
        });
        
        // Update PageRank values
        pageRankValues = newPageRank;
        
        // Check for convergence
        if (totalChange < tolerance) {
            console.log(`Manual implementation converged after ${iter + 1} iterations`);
            break;
        }
    }
    
    // Use our actual package function to get the authoritative result
    const packageResult = pageRank(graph, { 
        dampingFactor: dampingFactor,
        tolerance: tolerance,
        maxIterations: maxIterations
    });
    
    console.log('Manual result (for animation):', pageRankValues);
    console.log('Package result (authoritative):', packageResult);
    
    return {
        finalScores: packageResult.ranks, // Use authoritative result
        iterations: iterations,
        converged: packageResult.converged,
        iterationsUsed: packageResult.iterations,
        graph: {
            nodes: nodes,
            edges: edges
        }
    };
}

// Example of how the algorithm works:
// 1. Each node starts with equal PageRank (1/n)
// 2. In each iteration:
//    - Each node distributes its PageRank equally among its outgoing links
//    - Each node collects PageRank from its incoming links
//    - A damping factor simulates random jumps to any page
// 3. The algorithm continues until the values stabilize