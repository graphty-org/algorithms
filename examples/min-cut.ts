/**
 * Minimum Cut Algorithm Examples
 * 
 * This example demonstrates various minimum cut algorithms:
 * - s-t cut using max flow
 * - Stoer-Wagner algorithm for global minimum cut
 * - Karger's randomized algorithm
 * 
 * Applications include:
 * - Network reliability analysis
 * - Image segmentation
 * - Community detection
 * - Circuit design
 */

import { minSTCut, stoerWagner, kargerMinCut, type MinCutResult } from '../src/flow/min-cut';

console.log('=== Minimum Cut Algorithm Examples ===\n');

// Example 1: Network Reliability Analysis
console.log('Example 1: Network Reliability - Finding Weakest Links');
console.log('Identifying critical connections in a computer network\n');

const computerNetwork = new Map([
    ['Server1', new Map([['Switch1', 100], ['Switch2', 100]])],
    ['Server2', new Map([['Switch1', 100], ['Switch2', 100]])],
    ['Switch1', new Map([['Router1', 50], ['Router2', 50]])],
    ['Switch2', new Map([['Router1', 50], ['Router2', 50]])],
    ['Router1', new Map([['Gateway', 80]])],
    ['Router2', new Map([['Gateway', 80]])],
    ['Gateway', new Map()]
]);

// Find s-t minimum cut from servers to gateway
const stCut1 = minSTCut(computerNetwork, 'Server1', 'Gateway');
console.log('Minimum cut from Server1 to Gateway:');
console.log(`Cut value: ${stCut1.cutValue} Mbps`);
console.log('Critical edges that limit throughput:');
for (const edge of stCut1.cutEdges) {
    console.log(`  ${edge.from} → ${edge.to}`);
}

// Find global minimum cut using Stoer-Wagner
console.log('\nGlobal minimum cut (weakest point in entire network):');
const globalCut = stoerWagner(computerNetwork);
console.log(`Cut value: ${globalCut.cutValue} Mbps`);
console.log('Edges in the minimum cut:');
for (const edge of globalCut.cutEdges) {
    console.log(`  ${edge.from} → ${edge.to}`);
}

// Example 2: Social Network Analysis
console.log('\n\nExample 2: Social Network - Finding Community Boundaries');
console.log('Identifying weak connections between communities\n');

const socialNetwork = new Map([
    // Community 1
    ['Alice', new Map([['Bob', 10], ['Charlie', 10], ['Diana', 8], ['Eve', 2]])],
    ['Bob', new Map([['Alice', 10], ['Charlie', 9], ['Diana', 7], ['Frank', 1]])],
    ['Charlie', new Map([['Alice', 10], ['Bob', 9], ['Diana', 8], ['George', 1]])],
    ['Diana', new Map([['Alice', 8], ['Bob', 7], ['Charlie', 8], ['Helen', 2]])],
    
    // Community 2
    ['Eve', new Map([['Alice', 2], ['Frank', 9], ['George', 10], ['Helen', 8]])],
    ['Frank', new Map([['Bob', 1], ['Eve', 9], ['George', 10], ['Helen', 9]])],
    ['George', new Map([['Charlie', 1], ['Eve', 10], ['Frank', 10], ['Helen', 8]])],
    ['Helen', new Map([['Diana', 2], ['Eve', 8], ['Frank', 9], ['George', 8]])]
]);

// Use Karger's algorithm (multiple runs for better accuracy)
console.log('Running Karger\'s randomized algorithm (10 iterations)...');
let bestCut: MinCutResult | null = null;

for (let i = 0; i < 10; i++) {
    const cut = kargerMinCut(socialNetwork);
    if (!bestCut || cut.cutValue < bestCut.cutValue) {
        bestCut = cut;
    }
}

if (bestCut) {
    console.log(`\nBest minimum cut found: ${bestCut.cutValue}`);
    console.log('Weak connections between communities:');
    for (const edge of bestCut.cutEdges) {
        console.log(`  ${edge.from} ↔ ${edge.to}`);
    }
}

// Example 3: Transportation Network
console.log('\n\nExample 3: Transportation Network - Finding Bottlenecks');
console.log('Identifying critical road segments for traffic flow\n');

const roadNetwork = new Map([
    // North region
    ['NorthHub', new Map([['Highway1', 1000], ['Highway2', 800]])],
    ['Highway1', new Map([['Junction1', 600], ['Junction2', 400]])],
    ['Highway2', new Map([['Junction2', 500], ['Junction3', 500]])],
    
    // Central bottleneck
    ['Junction1', new Map([['Bridge1', 300], ['Bridge2', 200]])],
    ['Junction2', new Map([['Bridge1', 200], ['Bridge2', 300]])],
    ['Junction3', new Map([['Bridge2', 400]])],
    
    // South region
    ['Bridge1', new Map([['SouthRoad1', 500], ['SouthRoad2', 400]])],
    ['Bridge2', new Map([['SouthRoad2', 400], ['SouthRoad3', 500]])],
    ['SouthRoad1', new Map([['SouthHub', 800]])],
    ['SouthRoad2', new Map([['SouthHub', 700]])],
    ['SouthRoad3', new Map([['SouthHub', 800]])],
    ['SouthHub', new Map()]
]);

// Find minimum cut between North and South
const trafficCut = minSTCut(roadNetwork, 'NorthHub', 'SouthHub');
console.log('Minimum cut between North and South regions:');
console.log(`Total capacity: ${trafficCut.cutValue} vehicles/hour`);
console.log('\nBottleneck roads:');
for (const edge of trafficCut.cutEdges) {
    const capacity = roadNetwork.get(edge.from)?.get(edge.to) ?? 0;
    console.log(`  ${edge.from} → ${edge.to}: ${capacity} vehicles/hour`);
}

// Example 4: Circuit Design - Partitioning
console.log('\n\nExample 4: Circuit Partitioning');
console.log('Minimizing connections between circuit modules\n');

const circuit = new Map([
    // Module A components
    ['A1', new Map([['A2', 5], ['A3', 4], ['B1', 1], ['B2', 1]])],
    ['A2', new Map([['A1', 5], ['A3', 6], ['A4', 4], ['C1', 1]])],
    ['A3', new Map([['A1', 4], ['A2', 6], ['A4', 5], ['B3', 1]])],
    ['A4', new Map([['A2', 4], ['A3', 5], ['C2', 1]])],
    
    // Module B components
    ['B1', new Map([['A1', 1], ['B2', 5], ['B3', 4]])],
    ['B2', new Map([['A1', 1], ['B1', 5], ['B3', 6], ['B4', 4]])],
    ['B3', new Map([['A3', 1], ['B1', 4], ['B2', 6], ['B4', 5]])],
    ['B4', new Map([['B2', 4], ['B3', 5], ['C3', 1]])],
    
    // Module C components
    ['C1', new Map([['A2', 1], ['C2', 5], ['C3', 4]])],
    ['C2', new Map([['A4', 1], ['C1', 5], ['C3', 6]])],
    ['C3', new Map([['B4', 1], ['C1', 4], ['C2', 6]])]
]);

// Find optimal partition using Stoer-Wagner
const partition = stoerWagner(circuit);
console.log(`Minimum cut value: ${partition.cutValue} connections`);
console.log('\nInter-module connections to minimize:');
for (const edge of partition.cutEdges) {
    console.log(`  ${edge.from} ↔ ${edge.to}`);
}

// Show partition sets
if (partition.partition1 && partition.partition2) {
    console.log('\nOptimal circuit partition:');
    console.log('Set 1:', Array.from(partition.partition1).sort().join(', '));
    console.log('Set 2:', Array.from(partition.partition2).sort().join(', '));
}

// Analysis
console.log('\n=== Analysis ===');
console.log('Minimum cut algorithms help identify:');
console.log('1. Network bottlenecks and critical connections');
console.log('2. Natural boundaries between communities');
console.log('3. Optimal partitions for load balancing');
console.log('4. Vulnerability points in infrastructure');
console.log('\nDifferent algorithms offer trade-offs:');
console.log('- s-t cut: Fast, specific source-sink analysis');
console.log('- Stoer-Wagner: Deterministic global minimum cut');
console.log('- Karger: Randomized, good for large graphs');