// Adamic-Adar Link Prediction Example
import { Graph, adamicAdarScore, adamicAdarPrediction, adamicAdarForPairs } from '../dist/algorithms.js';

console.log('=== Adamic-Adar Link Prediction Example ===');

// Create a social network where some people are "hubs" with many connections
const socialNetwork = new Graph();

// Popular users (hubs)
const hubs = ['Influencer', 'Celebrity'];

// Regular users
const regularUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];

// Connect hubs to many people
hubs.forEach(hub => {
    regularUsers.forEach(user => {
        if (Math.random() < 0.7) { // 70% chance of connection
            socialNetwork.addEdge(hub, user);
        }
    });
});

// Add connections between regular users
socialNetwork.addEdge('Alice', 'Bob');
socialNetwork.addEdge('Alice', 'Charlie');
socialNetwork.addEdge('Bob', 'Charlie');
socialNetwork.addEdge('Bob', 'David');
socialNetwork.addEdge('Charlie', 'David');
socialNetwork.addEdge('David', 'Eve');
socialNetwork.addEdge('Eve', 'Frank');
socialNetwork.addEdge('Frank', 'Grace');
socialNetwork.addEdge('Grace', 'Henry');

console.log('Social Network with Influencers:');
console.log('- Influencer and Celebrity are connected to many users');
console.log('- Regular users form a chain with some triangles');
console.log('- Connections through influencers are less predictive');

// Compare Common Neighbors vs Adamic-Adar
console.log('\n1. Comparing Common Neighbors vs Adamic-Adar:');

const { commonNeighborsScore } = await import('../dist/algorithms.js');

const testPairs = [
    ['Alice', 'David'],    // Connected through regular users
    ['Alice', 'Eve'],      // Connected through hubs and regular users
    ['Bob', 'Eve'],        // Similar connections
    ['Frank', 'Henry'],    // Connected through Grace
    ['Alice', 'Frank']     // Distant connection
];

console.log('\nPair           | Common Neighbors | CN Score | AA Score | Ratio');
console.log('---------------|------------------|----------|----------|-------');

testPairs.forEach(([u, v]) => {
    const cnScore = commonNeighborsScore(socialNetwork, u, v);
    const aaScore = adamicAdarScore(socialNetwork, u, v);
    
    // Get common neighbors manually
    const neighbors1 = new Set(socialNetwork.neighbors(u));
    const neighbors2 = new Set(socialNetwork.neighbors(v));
    const commonNeighbors = Array.from(neighbors1).filter(n => neighbors2.has(n));
    
    const ratio = cnScore > 0 ? (aaScore / cnScore).toFixed(2) : 'N/A';
    console.log(`${u}-${v}`.padEnd(14) + ' | ' +
                commonNeighbors.join(',').padEnd(16) + ' | ' +
                cnScore.toString().padEnd(8) + ' | ' +
                aaScore.toFixed(3).padEnd(8) + ' | ' +
                ratio);
});

// Create a citation network
console.log('\n\n2. Academic Citation Network:');
const citationNetwork = new Graph();

// Highly cited papers (many connections)
const highlyClted = ['SeminalPaper1', 'SeminalPaper2'];

// Moderately cited papers
const moderatelyCited = ['Paper_A', 'Paper_B', 'Paper_C', 'Paper_D'];

// Recent papers
const recentPapers = ['Recent1', 'Recent2', 'Recent3', 'Recent4', 'Recent5'];

// Connect papers (simulating citations)
highlyClted.forEach(paper => {
    moderatelyCited.forEach(citer => {
        citationNetwork.addEdge(citer, paper);
    });
    recentPapers.slice(0, 3).forEach(citer => {
        citationNetwork.addEdge(citer, paper);
    });
});

// Add some connections between moderate papers
citationNetwork.addEdge('Paper_A', 'Paper_B');
citationNetwork.addEdge('Paper_B', 'Paper_C');
citationNetwork.addEdge('Paper_C', 'Paper_D');

// Recent papers cite moderate papers
citationNetwork.addEdge('Recent1', 'Paper_A');
citationNetwork.addEdge('Recent2', 'Paper_B');
citationNetwork.addEdge('Recent3', 'Paper_C');
citationNetwork.addEdge('Recent4', 'Paper_D');
citationNetwork.addEdge('Recent5', 'Paper_D');

console.log('Citation Network Structure:');
console.log('- Seminal papers: Cited by many (high degree)');
console.log('- Moderate papers: Some citations, interconnected');
console.log('- Recent papers: Few citations, cite others');

// Find citation recommendations
console.log('\n3. Citation Recommendations using Adamic-Adar:');
const allCitations = adamicAdarPrediction(citationNetwork);

// Group by paper type
const recommendations = {
    recent: [],
    moderate: [],
    crossType: []
};

allCitations.forEach((pred) => {
    if (pred.score > 0) {
        const pair = `${pred.source}-${pred.target}`;
        if (recentPapers.includes(pred.source) && recentPapers.includes(pred.target)) {
            recommendations.recent.push({ pair, score: pred.score });
        } else if (moderatelyCited.includes(pred.source) && moderatelyCited.includes(pred.target)) {
            recommendations.moderate.push({ pair, score: pred.score });
        } else {
            recommendations.crossType.push({ pair, score: pred.score });
        }
    }
});

console.log('\nTop recommendations by category:');
['recent', 'moderate', 'crossType'].forEach(category => {
    console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)} papers:`);
    recommendations[category]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .forEach(({ pair, score }) => {
            const [u, v] = pair.split('-');
            console.log(`  ${u} ↔ ${v}: ${score.toFixed(3)}`);
            // Show common neighbors and their contributions
            const neighbors1 = new Set(citationNetwork.neighbors(u));
            const neighbors2 = new Set(citationNetwork.neighbors(v));
            const common = Array.from(neighbors1).filter(n => neighbors2.has(n));
            common.forEach(neighbor => {
                const degree = citationNetwork.degree(neighbor);
                const contribution = 1 / Math.log(degree);
                console.log(`    via ${neighbor} (degree ${degree}): +${contribution.toFixed(3)}`);
            });
        });
});

// Create a product recommendation network
console.log('\n\n4. E-commerce Product Co-purchase Network:');
const productNetwork = new Graph();

// Product categories
const electronics = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Webcam'];
const accessories = ['LaptopBag', 'MousePad', 'USBHub', 'HDMICable'];
const popular = ['PhoneCharger', 'Headphones']; // Bought with everything

// Electronics often bought together
electronics.forEach((p1, i) => {
    electronics.slice(i + 1).forEach(p2 => {
        if (Math.random() < 0.4) {
            productNetwork.addEdge(p1, p2);
        }
    });
});

// Accessories bought with electronics
electronics.forEach(electronic => {
    accessories.forEach(accessory => {
        if (Math.random() < 0.3) {
            productNetwork.addEdge(electronic, accessory);
        }
    });
});

// Popular items bought with many products
popular.forEach(popItem => {
    [...electronics, ...accessories].forEach(product => {
        if (Math.random() < 0.6) {
            productNetwork.addEdge(popItem, product);
        }
    });
});

console.log('Product Categories:');
console.log('- Electronics: Core products (Laptop, Mouse, etc.)');
console.log('- Accessories: Supporting products (Bags, Cables, etc.)');
console.log('- Popular: High-degree items (Chargers, Headphones)');

// Product recommendations
console.log('\n5. Product Recommendations:');

const testProducts = ['Laptop', 'Mouse', 'LaptopBag'];

testProducts.forEach(product => {
    console.log(`\nRecommendations for ${product} buyers:`);
    
    const scores = new Map();
    productNetwork.nodes().forEach(node => {
        const other = node.id;
        if (other !== product && !productNetwork.hasEdge(product, other)) {
            const score = adamicAdarScore(productNetwork, product, other);
            if (score > 0) {
                scores.set(other, score);
            }
        }
    });
    
    Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([rec, score]) => {
            console.log(`  ${rec}: ${score.toFixed(3)}`);
        });
});

// Analyze the weight distribution
console.log('\n\n6. Adamic-Adar Weight Analysis:');

const degreeContributions = new Map();

// Calculate contribution by node degree
productNetwork.nodes().forEach(node => {
    const degree = productNetwork.degree(node.id);
    const contribution = 1 / Math.log(degree);
    
    if (!degreeContributions.has(degree)) {
        degreeContributions.set(degree, []);
    }
    degreeContributions.get(degree).push({
        node: node.id,
        contribution
    });
});

console.log('Degree | Nodes                          | AA Contribution');
console.log('-------|--------------------------------|----------------');
Array.from(degreeContributions.entries())
    .sort((a, b) => b[0] - a[0])
    .slice(0, 5)
    .forEach(([degree, nodes]) => {
        const nodeNames = nodes.slice(0, 3).map(n => n.node).join(', ');
        const contrib = nodes[0].contribution;
        console.log(`${degree.toString().padEnd(6)} | ${nodeNames.padEnd(30)} | ${contrib.toFixed(3)}`);
    });

// Performance comparison
console.log('\n\n7. Performance Analysis:');

// Create test networks of different sizes
const sizes = [50, 100, 200];

sizes.forEach(size => {
    const testGraph = new Graph();
    
    // Create random graph
    for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
            if (Math.random() < 0.1) { // 10% edge probability
                testGraph.addEdge(`N${i}`, `N${j}`);
            }
        }
    }
    
    const start = Date.now();
    const predictions = adamicAdarPrediction(testGraph);
    const time = Date.now() - start;
    
    const nonZero = Array.from(predictions.values()).filter(s => s > 0).length;
    
    console.log(`\nNetwork size: ${size} nodes, ${testGraph.edgeCount} edges`);
    console.log(`  Time: ${time}ms`);
    console.log(`  Non-zero predictions: ${nonZero}`);
    console.log(`  Average score: ${(Array.from(predictions.values()).reduce((a, b) => a + b, 0) / predictions.size).toFixed(3)}`);
});

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Adamic-Adar gives lower weight to high-degree neighbors:', 
    adamicAdarScore(socialNetwork, 'Alice', 'Eve') < commonNeighborsScore(socialNetwork, 'Alice', 'Eve'));
// Calculate expected score manually
const laptopNeighbors = new Set(productNetwork.neighbors('Laptop'));
const monitorNeighbors = new Set(productNetwork.neighbors('Monitor'));
const commonLM = Array.from(laptopNeighbors).filter(n => monitorNeighbors.has(n));
const expectedScore = commonLM.reduce((sum, n) => sum + 1/Math.log(productNetwork.degree(n)), 0);
console.log('✓ Score is sum of 1/log(degree) for common neighbors:', 
    Math.abs(adamicAdarScore(productNetwork, 'Laptop', 'Monitor') - expectedScore) < 0.001);
console.log('✓ All predictions have non-negative scores:', 
    allCitations.every(pred => pred.score >= 0));
console.log('✓ High-degree nodes contribute less:', 
    1/Math.log(10) < 1/Math.log(3));