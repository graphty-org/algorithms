/**
 * Flow Algorithm Examples
 * 
 * This example demonstrates maximum flow and minimum cut algorithms
 * for network optimization problems.
 */

import { 
  fordFulkerson, 
  edmondsKarp, 
  createBipartiteFlowNetwork 
} from '../src/flow/ford-fulkerson';
import { 
  minSTCut, 
  stoerWagner, 
  kargerMinCut 
} from '../src/flow/min-cut';

// Example 1: Network Flow - Transportation Network
console.log('=== Example 1: Transportation Network ===\n');

// Cities connected by highways with capacity (vehicles/hour)
const transportNetwork = new Map([
  ['LA', new Map([
    ['Vegas', 300],
    ['Phoenix', 400]
  ])],
  ['Vegas', new Map([
    ['Denver', 200],
    ['SaltLake', 250]
  ])],
  ['Phoenix', new Map([
    ['Denver', 350],
    ['Albuquerque', 300]
  ])],
  ['SaltLake', new Map([
    ['Denver', 200],
    ['Chicago', 400]
  ])],
  ['Denver', new Map([
    ['Chicago', 500]
  ])],
  ['Albuquerque', new Map([
    ['Denver', 250],
    ['Dallas', 400]
  ])],
  ['Dallas', new Map([
    ['Chicago', 550]
  ])],
  ['Chicago', new Map()]
]);

console.log('Maximum flow from LA to Chicago:');
const flowResult = fordFulkerson(transportNetwork, 'LA', 'Chicago');
console.log(`Max vehicles/hour: ${flowResult.maxFlow}`);
console.log('\nFlow distribution:');
for (const [from, flows] of flowResult.flowGraph) {
  for (const [to, flow] of flows) {
    if (flow > 0) {
      console.log(`  ${from} → ${to}: ${flow} vehicles/hour`);
    }
  }
}

// Example 2: Minimum Cut - Network Reliability
console.log('\n=== Example 2: Network Reliability Analysis ===\n');

const minCutResult = minSTCut(transportNetwork, 'LA', 'Chicago');
console.log(`Minimum cut capacity: ${minCutResult.cutValue} vehicles/hour`);
console.log('Critical edges (bottlenecks):');
for (const edge of minCutResult.cutEdges) {
  console.log(`  ${edge.from} → ${edge.to} (capacity: ${edge.weight})`);
}
console.log('\nNodes on LA side:', Array.from(minCutResult.partition1));
console.log('Nodes on Chicago side:', Array.from(minCutResult.partition2));

// Example 3: Bipartite Matching - Job Assignment
console.log('\n=== Example 3: Job Assignment Problem ===\n');

const workers = ['Alice', 'Bob', 'Charlie', 'Diana'];
const jobs = ['Frontend', 'Backend', 'Database', 'DevOps'];
const qualifications: Array<[string, string]> = [
  ['Alice', 'Frontend'],
  ['Alice', 'Backend'],
  ['Bob', 'Backend'],
  ['Bob', 'Database'],
  ['Charlie', 'Database'],
  ['Charlie', 'DevOps'],
  ['Diana', 'Frontend'],
  ['Diana', 'DevOps']
];

const { graph: jobGraph, source, sink } = createBipartiteFlowNetwork(
  workers, 
  jobs, 
  qualifications
);

const matchingResult = edmondsKarp(jobGraph, source, sink);
console.log(`Maximum matching: ${matchingResult.maxFlow} assignments`);
console.log('\nJob assignments:');
for (const worker of workers) {
  const flows = matchingResult.flowGraph.get(worker);
  if (flows) {
    for (const [job, flow] of flows) {
      if (flow > 0 && jobs.includes(job)) {
        console.log(`  ${worker} → ${job}`);
      }
    }
  }
}

// Example 4: Global Min Cut - Community Detection
console.log('\n=== Example 4: Social Network Community Detection ===\n');

// Social network with friendship strengths
const socialNetwork = new Map([
  ['Alice', new Map([
    ['Bob', 10],
    ['Charlie', 8],
    ['Diana', 2]
  ])],
  ['Bob', new Map([
    ['Alice', 10],
    ['Charlie', 9],
    ['Eve', 1]
  ])],
  ['Charlie', new Map([
    ['Alice', 8],
    ['Bob', 9],
    ['Frank', 1]
  ])],
  ['Diana', new Map([
    ['Alice', 2],
    ['Eve', 9],
    ['Frank', 10]
  ])],
  ['Eve', new Map([
    ['Bob', 1],
    ['Diana', 9],
    ['Frank', 8]
  ])],
  ['Frank', new Map([
    ['Charlie', 1],
    ['Diana', 10],
    ['Eve', 8]
  ])]
]);

const communityResult = stoerWagner(socialNetwork);
console.log(`Minimum cut value: ${communityResult.cutValue}`);
console.log('Community 1:', Array.from(communityResult.partition1));
console.log('Community 2:', Array.from(communityResult.partition2));
console.log('\nWeak connections between communities:');
for (const edge of communityResult.cutEdges) {
  console.log(`  ${edge.from} ↔ ${edge.to} (strength: ${edge.weight})`);
}

// Example 5: Comparing Algorithms
console.log('\n=== Example 5: Algorithm Comparison ===\n');

// Create a test network
const testNetwork = new Map([
  ['s', new Map([['a', 10], ['b', 10]])],
  ['a', new Map([['b', 2], ['t', 4], ['c', 8]])],
  ['b', new Map([['t', 10]])],
  ['c', new Map([['b', 9], ['t', 10]])],
  ['t', new Map()]
]);

console.log('Comparing Ford-Fulkerson vs Edmonds-Karp:');

let start = Date.now();
const ffResult = fordFulkerson(testNetwork, 's', 't');
const ffTime = Date.now() - start;

start = Date.now();
const ekResult = edmondsKarp(testNetwork, 's', 't');
const ekTime = Date.now() - start;

console.log(`Ford-Fulkerson: ${ffResult.maxFlow} (${ffTime}ms)`);
console.log(`Edmonds-Karp: ${ekResult.maxFlow} (${ekTime}ms)`);

// Example 6: Karger's Algorithm - Probabilistic Min Cut
console.log('\n=== Example 6: Probabilistic Min Cut ===\n');

console.log('Running Karger\'s algorithm multiple times:');
const cuts: number[] = [];
for (let i = 0; i < 5; i++) {
  const result = kargerMinCut(socialNetwork, 50);
  cuts.push(result.cutValue);
}

console.log('Cut values found:', cuts);
console.log('Minimum:', Math.min(...cuts));
console.log('Note: Karger\'s algorithm is randomized and may find different cuts');

// Example 7: Capacity Planning
console.log('\n=== Example 7: Data Center Capacity Planning ===\n');

// Data flow between servers (Gbps)
const datacenter = new Map([
  ['Gateway', new Map([
    ['Web1', 10],
    ['Web2', 10],
    ['Web3', 10]
  ])],
  ['Web1', new Map([
    ['App1', 8],
    ['App2', 7]
  ])],
  ['Web2', new Map([
    ['App1', 6],
    ['App2', 8],
    ['App3', 5]
  ])],
  ['Web3', new Map([
    ['App2', 5],
    ['App3', 9]
  ])],
  ['App1', new Map([
    ['DB1', 10],
    ['DB2', 5]
  ])],
  ['App2', new Map([
    ['DB1', 8],
    ['DB2', 8]
  ])],
  ['App3', new Map([
    ['DB2', 10]
  ])],
  ['DB1', new Map([
    ['Storage', 15]
  ])],
  ['DB2', new Map([
    ['Storage', 15]
  ])],
  ['Storage', new Map()]
]);

const capacity = fordFulkerson(datacenter, 'Gateway', 'Storage');
console.log(`Maximum data throughput: ${capacity.maxFlow} Gbps`);

const bottlenecks = minSTCut(datacenter, 'Gateway', 'Storage');
console.log('\nBottleneck analysis:');
console.log(`Minimum cut capacity: ${bottlenecks.cutValue} Gbps`);
console.log('Critical connections:');
for (const edge of bottlenecks.cutEdges) {
  console.log(`  ${edge.from} → ${edge.to}: ${edge.weight} Gbps`);
}

// Example 8: Multi-commodity Flow (simplified)
console.log('\n=== Example 8: Supply Chain Network ===\n');

// Supply chain with multiple products (simplified to single commodity)
const supplyChain = new Map([
  ['Factory1', new Map([
    ['Warehouse1', 100],
    ['Warehouse2', 150]
  ])],
  ['Factory2', new Map([
    ['Warehouse1', 120],
    ['Warehouse3', 180]
  ])],
  ['Warehouse1', new Map([
    ['Store1', 80],
    ['Store2', 90],
    ['Store3', 70]
  ])],
  ['Warehouse2', new Map([
    ['Store2', 100],
    ['Store4', 120]
  ])],
  ['Warehouse3', new Map([
    ['Store3', 110],
    ['Store4', 130]
  ])],
  ['Store1', new Map([['Customers', 80]])],
  ['Store2', new Map([['Customers', 190]])],
  ['Store3', new Map([['Customers', 180]])],
  ['Store4', new Map([['Customers', 250]])],
  ['Customers', new Map()]
]);

// Create super source connecting to all factories
const enhancedChain = new Map(supplyChain);
enhancedChain.set('SuperSource', new Map([
  ['Factory1', 250],
  ['Factory2', 300]
]));

const supplyResult = fordFulkerson(enhancedChain, 'SuperSource', 'Customers');
console.log(`Maximum supply capacity: ${supplyResult.maxFlow} units/day`);
console.log('\nSupply distribution:');
const factories = ['Factory1', 'Factory2'];
for (const factory of factories) {
  const flow = supplyResult.flowGraph.get('SuperSource')?.get(factory) || 0;
  console.log(`  ${factory}: ${flow} units/day`);
}