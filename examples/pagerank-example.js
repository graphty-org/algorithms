// PageRank Algorithm Example
import { Graph, pageRank, personalizedPageRank, pageRankCentrality, topPageRankNodes } from '../dist/algorithms.js';

console.log('=== PageRank Example ===');

// Create a directed graph representing a web of pages
const graph = new Graph({ directed: true });

// Add edges representing links between pages
graph.addEdge('HomePage', 'About');
graph.addEdge('HomePage', 'Products');
graph.addEdge('HomePage', 'Contact');
graph.addEdge('About', 'HomePage');
graph.addEdge('About', 'Contact');
graph.addEdge('Products', 'HomePage');
graph.addEdge('Products', 'ProductA');
graph.addEdge('Products', 'ProductB');
graph.addEdge('ProductA', 'Products');
graph.addEdge('ProductB', 'Products');
graph.addEdge('Contact', 'HomePage');

console.log('Directed Graph (Web Pages):');
console.log('HomePage <--> About');
console.log('   |           |');
console.log('   v           v');
console.log('Products <-> Contact');
console.log('   |');
console.log('   +-> ProductA');
console.log('   +-> ProductB');

// Calculate basic PageRank
console.log('\n1. Basic PageRank (default damping factor 0.85):');
const pageRankScores = pageRank(graph);
console.log('PageRank scores:');
Object.entries(pageRankScores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([page, score]) => {
        console.log(`  ${page}: ${score.toFixed(4)}`);
    });

// Calculate PageRank with different damping factor
console.log('\n2. PageRank with damping factor 0.5:');
const lowDampingScores = pageRank(graph, { dampingFactor: 0.5 });
console.log('PageRank scores (damping 0.5):');
Object.entries(lowDampingScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([page, score]) => {
        console.log(`  ${page}: ${score.toFixed(4)}`);
    });

// Calculate Personalized PageRank
console.log('\n3. Personalized PageRank (biased toward Products):');
const personalizedScores = personalizedPageRank(graph, ['Products']);
console.log('Personalized PageRank scores:');
Object.entries(personalizedScores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([page, score]) => {
        console.log(`  ${page}: ${score.toFixed(4)}`);
    });

// Get PageRank as centrality measure
console.log('\n4. PageRank Centrality:');
const centrality = pageRankCentrality(graph);
console.log('Centrality scores:');
Object.entries(centrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([page, score]) => {
        console.log(`  ${page}: ${score.toFixed(4)}`);
    });

// Get top k nodes by PageRank
console.log('\n5. Top 3 pages by PageRank:');
const topPages = topPageRankNodes(graph, 3);
console.log('Top pages:');
topPages.forEach(({ node, score }, index) => {
    console.log(`  ${index + 1}. ${node}: ${score.toFixed(4)}`);
});

// Test with weighted edges
console.log('\n6. Weighted PageRank:');
const weightedGraph = new Graph({ directed: true });
weightedGraph.addEdge('A', 'B', 3);
weightedGraph.addEdge('A', 'C', 1);
weightedGraph.addEdge('B', 'C', 2);
weightedGraph.addEdge('C', 'A', 1);

const weightedScores = pageRank(weightedGraph, { weighted: true });
console.log('Weighted PageRank scores:');
Object.entries(weightedScores)
    .sort((a, b) => b[1] - a[1])
    .forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(4)}`);
    });

// Verify results
console.log('\n=== Verification ===');
const totalScore = Object.values(pageRankScores).reduce((sum, score) => sum + score, 0);
console.log('✓ PageRank scores sum to ~1.0:', Math.abs(totalScore - 1.0) < 0.001);
console.log('✓ All scores are positive:', Object.values(pageRankScores).every(score => score > 0));
console.log('✓ HomePage should have high PageRank (many incoming links):', 
    pageRankScores.HomePage > 0.15);
console.log('✓ Products should be highly ranked in personalized PageRank:', 
    personalizedScores.Products > personalizedScores.About);