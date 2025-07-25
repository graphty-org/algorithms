import { Graph, adamicAdarScore, adamicAdarPrediction, commonNeighborsScore } from './algorithms.js';

// Create a network demonstrating the advantage of Adamic-Adar over Common Neighbors
const graph = new Graph();

// Add people with different social connectivity patterns
const people = [
    'Alice',    // Social hub (high degree)
    'Bob',      // Well connected
    'Carol',    // Selective connector (low degree, high value)
    'Dave',     // Medium connectivity
    'Eve',      // Rare specialist (very low degree)
    'Frank',    // Medium connectivity
    'Grace',    // Bridge person
    'Henry',    // Exclusive connections (very low degree)
    'Ivy',      // Another hub
    'Jack'      // Low degree specialist
];

people.forEach(person => graph.addNode(person));

// Add connections with varying degrees to show Adamic-Adar's advantage
const connections = [
    // Alice: Social hub (degree = 5) - lower individual weight per connection
    ['Alice', 'Bob'], ['Alice', 'Carol'], ['Alice', 'Dave'], 
    ['Alice', 'Eve'], ['Alice', 'Frank'],
    
    // Bob: Well connected (degree = 4)
    ['Bob', 'Grace'], ['Bob', 'Henry'], ['Bob', 'Ivy'],
    
    // Carol: Selective but valuable connections (degree = 2) - high weight
    ['Carol', 'Jack'],
    
    // Dave: Medium connectivity (degree = 3)
    ['Dave', 'Frank'], ['Dave', 'Grace'],
    
    // Eve: Rare specialist (degree = 2) - high weight when common
    ['Eve', 'Jack'],
    
    // Frank: Medium connectivity (degree = 4)
    ['Frank', 'Ivy'],
    
    // Grace: Bridge person (degree = 4) 
    ['Grace', 'Henry'],
    
    // Henry: Exclusive connections (degree = 2) - high weight
    ['Henry', 'Jack'],
    
    // Ivy: Another hub (degree = 4)
    ['Ivy', 'Jack']
];

connections.forEach(([person1, person2]) => {
    graph.addEdge(person1, person2);
});

// Comprehensive Adamic-Adar analysis
export function runAdamicAdar() {
    console.log('=== Adamic-Adar Index Link Prediction Example ===\n');
    
    // 1. Compare Adamic-Adar vs Common Neighbors
    console.log('1. Adamic-Adar vs Common Neighbors Comparison:');
    const predictions = adamicAdarPrediction(graph, {
        includeExisting: false,
        topK: 8
    });
    
    console.log('Top predictions by Adamic-Adar:');
    predictions.forEach((pred, index) => {
        // Calculate Common Neighbors score for comparison
        const cnScore = commonNeighborsScore(graph, pred.source, pred.target);
        console.log(`  ${index + 1}. ${pred.source} ↔ ${pred.target}:`);
        console.log(`     Adamic-Adar: ${pred.score.toFixed(3)}`);
        console.log(`     Common Neighbors: ${cnScore}`);
        console.log(`     AA/CN ratio: ${cnScore > 0 ? (pred.score / cnScore).toFixed(2) : 'N/A'}`);
    });
    
    // 2. Detailed weight analysis for top predictions
    console.log('\n2. Weight Contribution Analysis:');
    predictions.slice(0, 3).forEach(pred => {
        console.log(`\n--- ${pred.source} and ${pred.target} ---`);
        
        // Find common neighbors and their degrees
        const neighbors1 = new Set(graph.neighbors(pred.source));
        const neighbors2 = new Set(graph.neighbors(pred.target));
        const commonNeighbors = [...neighbors1].filter(n => neighbors2.has(n));
        
        console.log(`  Common neighbors: [${commonNeighbors.join(', ')}]`);
        
        let totalWeight = 0;
        commonNeighbors.forEach(neighbor => {
            const degree = graph.degree(neighbor);
            const weight = degree > 1 ? 1 / Math.log(degree) : 1;
            totalWeight += weight;
            console.log(`    ${neighbor}: degree=${degree}, weight=${weight.toFixed(3)}`);
        });
        
        console.log(`  Total Adamic-Adar score: ${totalWeight.toFixed(3)}`);
        console.log(`  Average weight per neighbor: ${commonNeighbors.length > 0 ? (totalWeight / commonNeighbors.length).toFixed(3) : 0}`);
        
        // Insight about rarity
        const rareNeighbors = commonNeighbors.filter(n => graph.degree(n) <= 3);
        if (rareNeighbors.length > 0) {
            console.log(`  💡 Rare connectors (degree ≤ 3): [${rareNeighbors.join(', ')}] boost the score!`);
        }
    });
    
    // 3. Demonstrate the "rare connector" effect
    console.log('\n3. Rare Connector Effect Demonstration:');
    
    // Find nodes with different degrees
    const nodesByDegree = people.map(person => ({
        name: person,
        degree: graph.degree(person),
        weight: graph.degree(person) > 1 ? (1 / Math.log(graph.degree(person))).toFixed(3) : '1.000'
    })).sort((a, b) => a.degree - b.degree);
    
    console.log('Node rarity analysis (sorted by degree):');
    nodesByDegree.forEach(node => {
        let category;
        if (node.degree <= 2) category = '🔥 High value (rare)';
        else if (node.degree <= 3) category = '⭐ Medium value';
        else category = '📢 Low value (common)';
        
        console.log(`  ${node.name}: degree=${node.degree}, weight=${node.weight} - ${category}`);
    });
    
    return predictions;
}

// Compare different scenarios to show when Adamic-Adar excels
export function compareScenarios() {
    console.log('\n=== Scenario Comparison: When Adamic-Adar Excels ===');
    
    // Scenario 1: Hub connections (many common neighbors, but they're all hubs)
    console.log('\n1. Hub-Heavy Scenario:');
    console.log('   Two people with many mutual friends, but all friends are popular');
    
    const hubScore = adamicAdarScore(graph, 'Alice', 'Ivy'); // Both connected to hubs
    const hubCN = commonNeighborsScore(graph, 'Alice', 'Ivy');
    console.log(`   Alice ↔ Ivy: AA=${hubScore.toFixed(3)}, CN=${hubCN}`);
    console.log(`   Interpretation: Lower AA score despite CN>0 because mutual friends are popular`);
    
    // Scenario 2: Rare connector scenario  
    console.log('\n2. Rare Connector Scenario:');
    console.log('   Two people with fewer mutual friends, but they are rare/exclusive');
    
    const rareScore = adamicAdarScore(graph, 'Carol', 'Eve'); // Connected via rare nodes
    const rareCN = commonNeighborsScore(graph, 'Carol', 'Eve');
    console.log(`   Carol ↔ Eve: AA=${rareScore.toFixed(3)}, CN=${rareCN}`);
    console.log(`   Interpretation: Higher weight per connection due to rare mutual friends`);
    
    // Scenario 3: Mixed scenario
    console.log('\n3. Mixed Scenario:');
    console.log('   Combination of rare and common mutual friends');
    
    const mixedScore = adamicAdarScore(graph, 'Bob', 'Dave'); 
    const mixedCN = commonNeighborsScore(graph, 'Bob', 'Dave');
    console.log(`   Bob ↔ Dave: AA=${mixedScore.toFixed(3)}, CN=${mixedCN}`);
    
    // Analysis summary
    console.log('\n=== Key Insights ===');
    console.log('✓ Adamic-Adar values quality over quantity of connections');
    console.log('✓ Rare mutual friends (low degree) contribute more to the score');
    console.log('✓ Popular mutual friends (high degree) contribute less weight');
    console.log('✓ Better for networks where exclusivity matters (academic, professional)');
    console.log('✓ Common Neighbors treats all mutual friends equally');
}

// Demonstrate real-world applications
export function demonstrateApplications() {
    console.log('\n=== Real-World Applications ===');
    
    console.log('\n1. Academic Collaboration Networks:');
    console.log('   - Rare mutual collaborators indicate specialized fields');
    console.log('   - More valuable than popular researchers everyone knows');
    
    console.log('\n2. Professional Networking:');
    console.log('   - Exclusive mutual connections signal specialized expertise');
    console.log('   - Industry-specific contacts worth more than general networkers');
    
    console.log('\n3. Social Media (Quality Connections):');
    console.log('   - Close mutual friends more meaningful than distant acquaintances');
    console.log('   - Selective people\'s endorsements carry more weight');
    
    console.log('\n4. Dating Applications:');
    console.log('   - Mutual friends who don\'t know everyone = stronger social proof');
    console.log('   - Quality mutual connections better conversation starters');
    
    // Show practical recommendation for different user types
    console.log('\n=== User-Specific Recommendations ===');
    
    const userTypes = [
        { name: 'Carol', type: 'Selective Connector', expectedPartners: ['specialists', 'quality-focused'] },
        { name: 'Alice', type: 'Social Hub', expectedPartners: ['diverse', 'broad-network'] },
        { name: 'Henry', type: 'Exclusive Circle', expectedPartners: ['niche', 'high-value'] }
    ];
    
    userTypes.forEach(user => {
        const personalPredictions = adamicAdarPrediction(graph, {
            includeExisting: false
        }).filter(pred => pred.source === user.name || pred.target === user.name);
        
        console.log(`\n${user.name} (${user.type}):`);
        console.log(`  Top recommendations: ${personalPredictions.slice(0, 2).map(p => 
            p.source === user.name ? p.target : p.source
        ).join(', ')}`);
        console.log(`  Best match type: ${user.expectedPartners.join(', ')}`);
    });
}

// Performance analysis compared to Common Neighbors
export function performanceAnalysis() {
    console.log('\n=== Performance Analysis ===');
    
    // Get all predictions from both algorithms
    const aaPredictions = adamicAdarPrediction(graph, { includeExisting: false });
    const cnPredictions = people.flatMap(person1 => 
        people.filter(person2 => person1 < person2 && !graph.hasEdge(person1, person2))
            .map(person2 => ({
                source: person1,
                target: person2,
                score: commonNeighborsScore(graph, person1, person2)
            }))
    ).filter(pred => pred.score > 0)
     .sort((a, b) => b.score - a.score);
    
    console.log('\nAlgorithm Comparison:');
    console.log(`Adamic-Adar predictions: ${aaPredictions.length}`);
    console.log(`Common Neighbors predictions: ${cnPredictions.length}`);
    
    // Compare top predictions
    console.log('\nTop 5 predictions comparison:');
    console.log('\nAdamic-Adar Top 5:');
    aaPredictions.slice(0, 5).forEach((pred, i) => {
        console.log(`  ${i+1}. ${pred.source} ↔ ${pred.target}: ${pred.score.toFixed(3)}`);
    });
    
    console.log('\nCommon Neighbors Top 5:');
    cnPredictions.slice(0, 5).forEach((pred, i) => {
        console.log(`  ${i+1}. ${pred.source} ↔ ${pred.target}: ${pred.score}`);
    });
    
    // Ranking differences
    const aaPairs = new Set(aaPredictions.map(p => `${p.source}-${p.target}`));
    const cnPairs = new Set(cnPredictions.map(p => `${p.source}-${p.target}`));
    const overlap = [...aaPairs].filter(pair => cnPairs.has(pair)).length;
    
    console.log(`\nRanking Analysis:`);
    console.log(`Overlapping predictions: ${overlap}/${Math.max(aaPredictions.length, cnPredictions.length)}`);
    console.log(`Adamic-Adar unique insights: ${aaPredictions.length - overlap}`);
    console.log(`Common Neighbors unique insights: ${cnPredictions.length - overlap}`);
    
    console.log('\n=== When to Use Each Algorithm ===');
    console.log('Use Adamic-Adar when:');
    console.log('  ✓ Network has varied node degrees (hubs + specialists)');
    console.log('  ✓ Rare connections are more meaningful');
    console.log('  ✓ Quality matters more than quantity');
    console.log('  ✓ Domain expertise/specialization is important');
    
    console.log('\nUse Common Neighbors when:');
    console.log('  ✓ All connections have similar value');
    console.log('  ✓ Network is relatively homogeneous');
    console.log('  ✓ Simplicity and interpretability are priorities');
    console.log('  ✓ Computational efficiency is critical');
}