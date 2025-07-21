// Closeness Centrality Example
import { Graph, closenessCentrality, nodeClosenessCentrality } from '../dist/algorithms.js';

console.log('=== Closeness Centrality Example ===');

// Create a transportation network graph
const transportNet = new Graph();

// Add routes between cities with travel times (weights)
transportNet.addEdge('NYC', 'Boston', 4);
transportNet.addEdge('NYC', 'Philadelphia', 2);
transportNet.addEdge('NYC', 'Washington', 4);
transportNet.addEdge('Boston', 'Philadelphia', 5);
transportNet.addEdge('Philadelphia', 'Washington', 2);
transportNet.addEdge('Washington', 'Atlanta', 5);
transportNet.addEdge('Philadelphia', 'Pittsburgh', 5);
transportNet.addEdge('Pittsburgh', 'Chicago', 5);
transportNet.addEdge('Chicago', 'Detroit', 4);
transportNet.addEdge('Detroit', 'Boston', 8);

console.log('Transportation Network:');
console.log('Boston ---- NYC ---- Philadelphia ---- Pittsburgh');
console.log('  |         |  |           |               |');
console.log('  |         |  |           |            Chicago');
console.log('  |         |  Washington   |               |');
console.log('  |         |     |         |            Detroit');
console.log('  +---------+     |         |               |');
console.log('            |  Atlanta      |               |');
console.log('            +---------------+---------------+');

// Calculate closeness centrality for all cities
console.log('\n1. Closeness Centrality (transportation hubs):');
const centrality = closenessCentrality(transportNet);
console.log('Closeness centrality scores:');
Object.entries(centrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, score]) => {
        console.log(`  ${city}: ${score.toFixed(4)}`);
    });

// Calculate normalized closeness centrality
console.log('\n2. Normalized Closeness Centrality:');
const normalizedCentrality = closenessCentrality(transportNet, { normalized: true });
console.log('Normalized centrality scores:');
Object.entries(normalizedCentrality)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([city, score]) => {
        console.log(`  ${city}: ${score.toFixed(4)}`);
    });

// Get closeness centrality for a specific city
console.log('\n3. Closeness Centrality for Philadelphia:');
const phillyScore = nodeClosenessCentrality(transportNet, 'Philadelphia');
console.log(`Philadelphia centrality: ${phillyScore.toFixed(4)}`);

// Test with a simple star network to show extreme centrality
console.log('\n4. Star Network Example:');
const starNet = new Graph();
starNet.addEdge('Center', 'A');
starNet.addEdge('Center', 'B');
starNet.addEdge('Center', 'C');
starNet.addEdge('Center', 'D');

const starCentrality = closenessCentrality(starNet);
console.log('Star network centrality:');
Object.entries(starCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(4)}`);
    });

// Test with disconnected components
console.log('\n5. Disconnected Network:');
const disconnectedNet = new Graph();
disconnectedNet.addEdge('A', 'B');
disconnectedNet.addEdge('B', 'C');
disconnectedNet.addEdge('X', 'Y');
disconnectedNet.addEdge('Y', 'Z');

const disconnectedCentrality = closenessCentrality(disconnectedNet);
console.log('Disconnected network centrality:');
Object.entries(disconnectedCentrality)
    .sort((a, b) => b[1] - a[1])
    .forEach(([node, score]) => {
        console.log(`  ${node}: ${score.toFixed(4)}`);
    });

// Verify results
console.log('\n=== Verification ===');
const highestCentrality = Math.max(...Object.values(centrality));
const mostCentral = Object.entries(centrality)
    .find(([, score]) => score === highestCentrality)[0];
console.log('✓ Most central city in transport network:', mostCentral);
console.log('✓ Center node in star should have highest centrality:', 
    starCentrality.Center > starCentrality.A);
console.log('✓ Philadelphia should have high centrality (central location):', 
    centrality.Philadelphia > 0.003);
console.log('✓ All centrality scores should be positive:', 
    Object.values(centrality).every(score => score > 0));
console.log('✓ Disconnected components should have finite centrality:', 
    Object.values(disconnectedCentrality).every(score => isFinite(score)));