// Educational wrapper around @graphty/algorithms Degree Centrality implementation
// Import the Graph class and degree centrality functions from our package
import { Graph, degreeCentrality } from './algorithms.js';

/**
 * Educational wrapper that demonstrates degree centrality calculation
 * Uses the actual @graphty/algorithms implementation under the hood
 */
export async function runDegreeCentrality(graphData) {
    console.log('=== Degree Centrality Calculation ===');
    
    // Step 1: Create a new graph instance using our actual library
    console.log('Step 1: Creating graph...');
    const graph = new Graph({ directed: graphData.directed });
    console.log(`Graph type: ${graphData.directed ? 'Directed' : 'Undirected'}`);
    
    // Step 2: Add nodes to the graph
    console.log('Step 2: Adding nodes...');
    graphData.nodes.forEach(node => {
        graph.addNode(node.id);
    });
    console.log(`Added ${graphData.nodes.length} nodes:`, graphData.nodes.map(n => n.id));
    
    // Step 3: Add edges to the graph
    console.log('Step 3: Adding edges...');
    graphData.edges.forEach(edge => {
        graph.addEdge(edge.source, edge.target);
    });
    console.log(`Added ${graphData.edges.length} edges:`, 
        graphData.edges.map(e => `${e.source}${graphData.directed ? '→' : '↔'}${e.target}`));
    
    // Educational explanation: Manual degree counting for comparison
    console.log('Step 4: Manual degree counting (for educational purposes)...');
    const manualDegrees = {};
    const inDegree = {};
    const outDegree = {};
    
    // Initialize counts
    graphData.nodes.forEach(node => {
        manualDegrees[node.id] = 0;
        inDegree[node.id] = 0;
        outDegree[node.id] = 0;
    });
    
    // Count degrees manually
    graphData.edges.forEach(edge => {
        if (graphData.directed) {
            // For directed graphs: count in-degree and out-degree separately
            outDegree[edge.source]++;
            inDegree[edge.target]++;
            // Total degree = in-degree + out-degree
            manualDegrees[edge.source]++;
            manualDegrees[edge.target]++;
        } else {
            // For undirected graphs: each edge contributes to both nodes
            manualDegrees[edge.source]++;
            manualDegrees[edge.target]++;
        }
    });
    
    console.log('Manual degree calculation results:', manualDegrees);
    if (graphData.directed) {
        console.log('In-degrees (popularity):', inDegree);
        console.log('Out-degrees (influence):', outDegree);
    }
    
    // Step 5: Use our actual package function to get authoritative results
    console.log('Step 5: Using @graphty/algorithms degreeCentrality...');
    const packageResult = degreeCentrality(graph);
    
    console.log('Package result (authoritative):', packageResult);
    
    // Step 6: Find the most central node(s)
    const sortedNodes = Object.entries(packageResult)
        .sort(([,a], [,b]) => b - a);
    
    console.log('Node ranking by degree centrality:');
    sortedNodes.forEach(([nodeId, score], index) => {
        console.log(`  ${index + 1}. Node ${nodeId}: ${score.toFixed(4)}`);
    });
    
    // Step 7: Prepare educational result with explanations
    const result = {
        centrality: packageResult, // Use authoritative result
        nodeCount: graphData.nodes.length,
        edgeCount: graphData.edges.length,
        directed: graphData.directed,
        mostCentralNode: sortedNodes[0],
        explanation: {
            concept: graphData.directed 
                ? "In directed graphs, degree centrality measures total connections (in + out). High in-degree = popular, high out-degree = influential."
                : "In undirected graphs, degree centrality counts direct connections. More connections = more central/important.",
            calculation: graphData.directed
                ? "For directed graphs: degree(v) = in-degree(v) + out-degree(v), normalized by (n-1)"
                : "For undirected graphs: degree(v) = number of edges connected to v, normalized by (n-1)",
            normalization: `Scores are normalized by dividing by the maximum possible degree (${graphData.nodes.length - 1})`
        }
    };
    
    // Include degree breakdowns for directed graphs
    if (graphData.directed) {
        result.inDegree = inDegree;
        result.outDegree = outDegree;
        result.degreeBreakdown = sortedNodes.map(([nodeId, totalScore]) => ({
            nodeId,
            totalDegree: totalScore,
            inDegree: inDegree[nodeId] / (graphData.nodes.length - 1),
            outDegree: outDegree[nodeId] / (graphData.nodes.length - 1)
        }));
    }
    
    console.log('=== Final Results ===');
    console.log('Most central node:', result.mostCentralNode);
    console.log('Explanation:', result.explanation);
    
    return result;
}

// Educational wrapper specifically for HTML visualization
export async function runDegreeCentralityEducational(graphData) {
    console.log('=== Educational Degree Centrality Calculation ===');
    
    // Step 1: Create a new graph instance using our actual library
    console.log('Step 1: Creating social network graph...');
    const graph = new Graph({ directed: graphData.directed });
    console.log(`Graph type: ${graphData.directed ? 'Directed' : 'Undirected'}`);
    console.log('Context: Social network showing friendships between people');
    
    // Step 2: Add nodes to the graph
    console.log('Step 2: Adding people to the network...');
    graphData.nodes.forEach(node => {
        graph.addNode(node.id);
    });
    console.log(`Added ${graphData.nodes.length} people:`, graphData.nodes.map(n => n.id));
    
    // Step 3: Add edges to the graph
    console.log('Step 3: Adding friendships...');
    graphData.edges.forEach(edge => {
        graph.addEdge(edge.from, edge.to);
    });
    console.log(`Added ${graphData.edges.length} friendships:`, 
        graphData.edges.map(e => `${e.from} ↔ ${e.to}`));
    
    // Educational explanation: Manual degree counting
    console.log('Step 4: Counting connections for each person...');
    const manualDegrees = {};
    
    // Initialize counts
    graphData.nodes.forEach(node => {
        manualDegrees[node.id] = 0;
    });
    
    // Count degrees manually
    graphData.edges.forEach(edge => {
        manualDegrees[edge.from]++;
        manualDegrees[edge.to]++;
    });
    
    console.log('Manual degree count (number of friends):');
    Object.entries(manualDegrees).forEach(([person, degree]) => {
        console.log(`  ${person}: ${degree} friends`);
    });
    
    // Step 5: Use our actual package function to get normalized results
    console.log('Step 5: Normalizing scores using @graphty/algorithms...');
    const packageResult = degreeCentrality(graph);
    
    console.log('Normalized centrality scores (0-1 scale):');
    Object.entries(packageResult).forEach(([person, score]) => {
        console.log(`  ${person}: ${score.toFixed(3)}`);
    });
    
    // Step 6: Educational interpretation
    const sortedNodes = Object.entries(packageResult)
        .sort(([,a], [,b]) => b - a);
    
    console.log('Social network analysis:');
    sortedNodes.forEach(([person, score], index) => {
        const friendCount = manualDegrees[person];
        let interpretation = '';
        if (friendCount >= 4) {
            interpretation = 'Very popular (social hub)';
        } else if (friendCount >= 2) {
            interpretation = 'Well connected';
        } else {
            interpretation = 'Few connections';
        }
        console.log(`  ${index + 1}. ${person}: ${score.toFixed(3)} - ${interpretation}`);
    });
    
    return {
        centrality: packageResult,
        rawDegrees: manualDegrees,
        nodeCount: graphData.nodes.length,
        edgeCount: graphData.edges.length,
        directed: graphData.directed,
        mostPopularPerson: sortedNodes[0],
        explanation: {
            concept: "Degree centrality measures popularity in social networks - how many direct friends someone has.",
            calculation: `Each person's degree (friend count) divided by maximum possible friends (${graphData.nodes.length - 1})`,
            insight: `${sortedNodes[0][0]} is the most popular with ${manualDegrees[sortedNodes[0][0]]} friends`
        }
    };
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