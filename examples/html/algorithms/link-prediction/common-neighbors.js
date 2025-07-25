import { Graph, commonNeighborsScore, commonNeighborsPrediction, evaluateCommonNeighbors } from './algorithms.js';

// Create a realistic social network graph for demonstration
const graph = new Graph();

// Add people (nodes)
const people = [
    'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 
    'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo'
];

people.forEach(person => graph.addNode(person));

// Add existing friendships (edges) - creating natural clusters
const friendships = [
    // Core friend group 1: Alice, Bob, Carol, Dave
    ['Alice', 'Bob'], ['Alice', 'Carol'], ['Alice', 'Dave'],
    ['Bob', 'Carol'], ['Bob', 'Dave'], ['Carol', 'Dave'],
    
    // Core friend group 2: Eve, Frank, Grace, Henry
    ['Eve', 'Frank'], ['Eve', 'Grace'], ['Frank', 'Grace'],
    ['Grace', 'Henry'], ['Frank', 'Henry'],
    
    // Bridging connections
    ['Dave', 'Eve'],     // Bridge between groups
    ['Grace', 'Ivy'],    // Bridge to isolated nodes
    
    // Isolated connections
    ['Ivy', 'Jack'], ['Jack', 'Kate'], ['Kate', 'Leo']
];

friendships.forEach(([person1, person2]) => {
    graph.addEdge(person1, person2);
});

// Run Common Neighbors Link Prediction with comprehensive analysis
export function runCommonNeighbors() {
    console.log('=== Common Neighbors Link Prediction Example ===\n');
    
    // 1. Get all predictions (excluding existing links)
    console.log('1. All Link Predictions (excluding existing friendships):');
    const allPredictions = commonNeighborsPrediction(graph, {
        includeExisting: false,
        topK: 10
    });
    
    console.log(`Found ${allPredictions.length} potential new friendships:`);
    allPredictions.forEach((pred, index) => {
        console.log(`  ${index + 1}. ${pred.source} ↔ ${pred.target}: ${pred.score} mutual friends`);
    });
    
    // 2. Analyze specific high-potential pairs
    console.log('\n2. Detailed Analysis of Top Predictions:');
    allPredictions.slice(0, 3).forEach(pred => {
        console.log(`\n--- ${pred.source} and ${pred.target} ---`);
        
        // Find their mutual friends
        const neighbors1 = new Set(graph.neighbors(pred.source));
        const neighbors2 = new Set(graph.neighbors(pred.target));
        const mutualFriends = [...neighbors1].filter(friend => neighbors2.has(friend));
        
        console.log(`  Mutual friends: [${mutualFriends.join(', ')}]`);
        console.log(`  ${pred.source}'s friends: [${[...neighbors1].join(', ')}]`);
        console.log(`  ${pred.target}'s friends: [${[...neighbors2].join(', ')}]`);
        console.log(`  Prediction strength: ${pred.score}/10`);
        
        // Real-world interpretation
        if (pred.score >= 3) {
            console.log(`  💡 High likelihood: Many mutual connections suggest strong social overlap`);
        } else if (pred.score >= 2) {
            console.log(`  💡 Moderate likelihood: Some shared social context`);
        } else {
            console.log(`  💡 Low likelihood: Limited shared connections`);
        }
    });
    
    // 3. Compare different scenarios
    console.log('\n3. Algorithm Behavior Analysis:');
    
    // Test pairs with different common neighbor counts
    const testPairs = [
        ['Carol', 'Frank'],  // Should have high score (via Dave-Eve bridge)
        ['Alice', 'Henry'],  // Lower score (more distant)
        ['Ivy', 'Leo'],      // Very low score (via Jack-Kate)
        ['Bob', 'Grace']     // Moderate score
    ];
    
    testPairs.forEach(([person1, person2]) => {
        const score = commonNeighborsScore(graph, person1, person2);
        const neighbors1 = [...graph.neighbors(person1)];
        const neighbors2 = [...graph.neighbors(person2)];
        const mutual = neighbors1.filter(n => neighbors2.includes(n));
        
        console.log(`${person1} ↔ ${person2}: Score=${score}, Mutual=[${mutual.join(', ') || 'none'}]`);
    });
    
    // 4. Include existing connections for comparison
    console.log('\n4. Existing vs. Predicted Connections:');
    const allConnections = commonNeighborsPrediction(graph, {
        includeExisting: true,
        topK: 15
    });
    
    const existing = allConnections.filter(pred => graph.hasEdge(pred.source, pred.target));
    const predicted = allConnections.filter(pred => !graph.hasEdge(pred.source, pred.target));
    
    console.log(`Existing friendships with common neighbors: ${existing.length}`);
    console.log(`Potential new friendships: ${predicted.length}`);
    
    console.log('\nTop existing friendships by common neighbor count:');
    existing.slice(0, 3).forEach(pred => {
        console.log(`  ${pred.source} ↔ ${pred.target}: ${pred.score} mutual friends (already connected)`);
    });
    
    return allPredictions;
}

// Demonstrate different use cases and applications
export function demonstrateApplications() {
    console.log('\n=== Real-World Applications ===');
    
    console.log('\n1. Social Media Friend Suggestions:');
    console.log('   - Recommend friends based on mutual connections');
    console.log('   - Higher scores = stronger recommendations');
    
    // Get recommendations for a specific user
    const aliceRecommendations = commonNeighborsPrediction(graph, {
        includeExisting: false
    }).filter(pred => pred.source === 'Alice' || pred.target === 'Alice');
    
    console.log('\n   Friend recommendations for Alice:');
    aliceRecommendations.forEach(pred => {
        const friend = pred.source === 'Alice' ? pred.target : pred.source;
        console.log(`     - ${friend}: ${pred.score} mutual friends`);
    });
    
    console.log('\n2. Professional Network Connections:');
    console.log('   - Suggest professional contacts based on shared connections');
    console.log('   - Common neighbors = shared professional circles');
    
    console.log('\n3. Research Collaboration Prediction:');
    console.log('   - Predict future collaborations between researchers');
    console.log('   - Common neighbors = shared research communities');
    
    console.log('\n4. Dating App Mutual Friends:');
    console.log('   - Show potential matches with mutual friends');
    console.log('   - Higher common neighbor count = better conversation starters');
}

// Analyze algorithm performance characteristics  
export function analyzePerformance() {
    console.log('\n=== Algorithm Performance Analysis ===');
    
    // Test with different graph structures
    const graphs = {
        'Dense Network': createDenseGraph(6),
        'Sparse Network': createSparseGraph(8),
        'Clustered Network': graph  // Our existing clustered graph
    };
    
    Object.entries(graphs).forEach(([name, testGraph]) => {
        console.log(`\n${name}:`);
        
        const predictions = commonNeighborsPrediction(testGraph, {
            includeExisting: false
        });
        
        const scores = predictions.map(p => p.score);
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
        const maxScore = Math.max(...scores, 0);
        
        console.log(`  Nodes: ${testGraph.nodeCount}`);
        console.log(`  Edges: ${testGraph.edgeCount}`);
        console.log(`  Predictions: ${predictions.length}`);
        console.log(`  Avg score: ${avgScore}`);
        console.log(`  Max score: ${maxScore}`);
        console.log(`  Density: ${(testGraph.edgeCount / (testGraph.nodeCount * (testGraph.nodeCount - 1) / 2) * 100).toFixed(1)}%`);
    });
    
    console.log('\n=== Key Insights ===');
    console.log('✓ Dense networks: Higher average scores, more predictions');
    console.log('✓ Sparse networks: Lower scores, fewer high-confidence predictions'); 
    console.log('✓ Clustered networks: Balanced mix, good for real-world scenarios');
    console.log('✓ Algorithm complexity: O(k²) where k = average degree');
    console.log('✓ Best for: Social networks, collaboration networks, recommendation systems');
}

// Helper function to create a dense test graph
function createDenseGraph(nodeCount) {
    const denseGraph = new Graph();
    
    // Add nodes
    for (let i = 0; i < nodeCount; i++) {
        denseGraph.addNode(`N${i}`);
    }
    
    // Add many edges (80% connectivity)
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            if (Math.random() < 0.8) {
                denseGraph.addEdge(`N${i}`, `N${j}`);
            }
        }
    }
    
    return denseGraph;
}

// Helper function to create a sparse test graph
function createSparseGraph(nodeCount) {
    const sparseGraph = new Graph();
    
    // Add nodes
    for (let i = 0; i < nodeCount; i++) {
        sparseGraph.addNode(`S${i}`);
    }
    
    // Add few edges (20% connectivity)
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            if (Math.random() < 0.2) {
                sparseGraph.addEdge(`S${i}`, `S${j}`);
            }
        }
    }
    
    return sparseGraph;
}

// Comprehensive evaluation (if test data were available)
export function evaluateAlgorithm() {
    console.log('\n=== Algorithm Evaluation Framework ===');
    console.log('In real applications, you would evaluate using:');
    console.log('');
    console.log('1. Precision: What % of predicted links actually form?');
    console.log('2. Recall: What % of actual new links were predicted?');
    console.log('3. AUC: Area under ROC curve for ranking quality');
    console.log('4. F1-Score: Harmonic mean of precision and recall');
    console.log('');
    console.log('Example evaluation code:');
    console.log('```javascript');
    console.log('const evaluation = evaluateCommonNeighbors(');
    console.log('    trainingGraph,  // Graph with known links');
    console.log('    testEdges,      // New links that formed');
    console.log('    nonEdges,       // Links that did not form');
    console.log('    { topK: 10 }');
    console.log(');');
    console.log('console.log("Precision:", evaluation.precision);');
    console.log('console.log("Recall:", evaluation.recall);');
    console.log('console.log("AUC:", evaluation.auc);');
    console.log('```');
}