/**
 * Ford-Fulkerson Maximum Flow Example
 * 
 * This example demonstrates how to use the Ford-Fulkerson algorithm
 * to find the maximum flow in a network, such as:
 * - Transportation networks
 * - Data flow in computer networks
 * - Supply chain optimization
 * - Bipartite matching problems
 */

import { fordFulkerson, edmondsKarp, createBipartiteFlowNetwork } from '../src/flow/ford-fulkerson';

console.log('=== Ford-Fulkerson Maximum Flow Examples ===\n');

// Example 1: Simple flow network
console.log('Example 1: Water Pipeline Network');
console.log('Finding maximum water flow from source to sink\n');

const pipelineNetwork = new Map([
    ['source', new Map([['A', 10], ['B', 10]])],
    ['A', new Map([['B', 2], ['C', 4], ['D', 8]])],
    ['B', new Map([['D', 9]])],
    ['C', new Map([['sink', 10]])],
    ['D', new Map([['C', 6], ['sink', 10]])],
    ['sink', new Map()]
]);

const result1 = fordFulkerson(pipelineNetwork, 'source', 'sink');
console.log(`Maximum flow: ${result1.maxFlow} units/second`);
console.log('\nFlow distribution:');
for (const [from, flows] of result1.flowGraph) {
    for (const [to, flow] of flows) {
        if (flow > 0) {
            console.log(`  ${from} → ${to}: ${flow} units/second`);
        }
    }
}

if (result1.minCut) {
    console.log('\nMinimum cut (bottleneck edges):');
    for (const [from, to] of result1.minCut.edges) {
        console.log(`  ${from} → ${to}`);
    }
}

// Example 2: Computer Network Bandwidth
console.log('\n\nExample 2: Computer Network Bandwidth Allocation');
console.log('Maximizing data throughput in a network\n');

const networkBandwidth = new Map([
    ['Server', new Map([['Router1', 100], ['Router2', 150]])],
    ['Router1', new Map([['Router3', 80], ['Router4', 70]])],
    ['Router2', new Map([['Router3', 60], ['Router4', 90]])],
    ['Router3', new Map([['Client', 120]])],
    ['Router4', new Map([['Client', 100]])],
    ['Client', new Map()]
]);

// Using Edmonds-Karp (BFS-based Ford-Fulkerson) for better performance
const result2 = edmondsKarp(networkBandwidth, 'Server', 'Client');
console.log(`Maximum bandwidth: ${result2.maxFlow} Mbps`);
console.log('\nBandwidth allocation:');
for (const [from, flows] of result2.flowGraph) {
    for (const [to, flow] of flows) {
        if (flow > 0) {
            console.log(`  ${from} → ${to}: ${flow} Mbps`);
        }
    }
}

// Example 3: Bipartite Matching (Job Assignment)
console.log('\n\nExample 3: Job Assignment Problem');
console.log('Matching workers to jobs using maximum flow\n');

const workers = ['Alice', 'Bob', 'Charlie', 'Diana'];
const jobs = ['Frontend', 'Backend', 'Database', 'DevOps'];
const qualifications: [string, string][] = [
    ['Alice', 'Frontend'],
    ['Alice', 'Backend'],
    ['Bob', 'Backend'],
    ['Bob', 'Database'],
    ['Charlie', 'Database'],
    ['Charlie', 'DevOps'],
    ['Diana', 'Frontend'],
    ['Diana', 'DevOps']
];

const { graph: bipartiteGraph, source, sink } = createBipartiteFlowNetwork(
    workers,
    jobs,
    qualifications
);

const matching = fordFulkerson(bipartiteGraph, source, sink);
console.log(`Maximum matching: ${matching.maxFlow} assignments`);
console.log('\nJob assignments:');
for (const [from, flows] of matching.flowGraph) {
    for (const [to, flow] of flows) {
        if (flow > 0 && workers.includes(from) && jobs.includes(to)) {
            console.log(`  ${from} → ${to}`);
        }
    }
}

// Example 4: Supply Chain Distribution
console.log('\n\nExample 4: Supply Chain Distribution');
console.log('Optimizing product flow from factories to stores\n');

const supplyChain = new Map([
    ['Factory1', new Map([['Warehouse1', 300], ['Warehouse2', 400]])],
    ['Factory2', new Map([['Warehouse1', 200], ['Warehouse2', 300]])],
    ['Warehouse1', new Map([['Store1', 200], ['Store2', 150], ['Store3', 150]])],
    ['Warehouse2', new Map([['Store2', 200], ['Store3', 250], ['Store4', 200]])],
    ['Store1', new Map([['Demand', 180]])],
    ['Store2', new Map([['Demand', 300]])],
    ['Store3', new Map([['Demand', 350]])],
    ['Store4', new Map([['Demand', 170]])],
    ['Demand', new Map()]
]);

// Create super source connecting to all factories
const supplyChainWithSource = new Map(supplyChain);
supplyChainWithSource.set('SuperSource', new Map([
    ['Factory1', 700],  // Factory1 capacity
    ['Factory2', 500]   // Factory2 capacity
]));

const distribution = edmondsKarp(supplyChainWithSource, 'SuperSource', 'Demand');
console.log(`Total products distributed: ${distribution.maxFlow} units`);
console.log('\nDistribution flow:');

console.log('\nFrom Factories:');
for (const [from, flows] of distribution.flowGraph) {
    if (from.startsWith('Factory')) {
        for (const [to, flow] of flows) {
            if (flow > 0 && to.startsWith('Warehouse')) {
                console.log(`  ${from} → ${to}: ${flow} units`);
            }
        }
    }
}

console.log('\nFrom Warehouses:');
for (const [from, flows] of distribution.flowGraph) {
    if (from.startsWith('Warehouse')) {
        for (const [to, flow] of flows) {
            if (flow > 0 && to.startsWith('Store')) {
                console.log(`  ${from} → ${to}: ${flow} units`);
            }
        }
    }
}

console.log('\nTo Stores:');
for (const [from, flows] of distribution.flowGraph) {
    if (from.startsWith('Store')) {
        for (const [to, flow] of flows) {
            if (flow > 0) {
                console.log(`  ${from}: ${flow} units delivered`);
            }
        }
    }
}

// Analysis
console.log('\n=== Analysis ===');
console.log('The Ford-Fulkerson algorithm efficiently finds the maximum flow by:');
console.log('1. Finding augmenting paths from source to sink');
console.log('2. Pushing maximum possible flow through each path');
console.log('3. Updating residual capacities');
console.log('4. Repeating until no more augmenting paths exist');
console.log('\nThe minimum cut identifies network bottlenecks that limit flow.');