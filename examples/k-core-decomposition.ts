/**
 * K-Core Decomposition Examples
 * 
 * This example demonstrates k-core decomposition for analyzing
 * graph structure and identifying cohesive groups.
 */

import {
  kCoreDecomposition,
  getKCore,
  getKCoreSubgraph,
  degeneracyOrdering,
  kTruss,
  toUndirected
} from '../src/clustering/k-core';

// Example 1: Social Network Analysis
console.log('=== Example 1: Social Network Core Analysis ===\n');

// Friend network where edges represent mutual friendships
const socialNetwork = new Map([
  ['Alice', new Set(['Bob', 'Charlie', 'Diana', 'Eve'])],
  ['Bob', new Set(['Alice', 'Charlie', 'Diana', 'Frank'])],
  ['Charlie', new Set(['Alice', 'Bob', 'Diana', 'George'])],
  ['Diana', new Set(['Alice', 'Bob', 'Charlie', 'Eve', 'Frank'])],
  ['Eve', new Set(['Alice', 'Diana', 'Helen'])],
  ['Frank', new Set(['Bob', 'Diana', 'George'])],
  ['George', new Set(['Charlie', 'Frank', 'Helen'])],
  ['Helen', new Set(['Eve', 'George', 'Ian'])],
  ['Ian', new Set(['Helen'])]
]);

const socialCores = kCoreDecomposition(socialNetwork);

console.log(`Maximum k-core: ${socialCores.maxCore}-core\n`);
console.log('Core membership:');
for (let k = 1; k <= socialCores.maxCore; k++) {
  const members = socialCores.cores.get(k);
  if (members && members.size > 0) {
    console.log(`  ${k}-core: ${Array.from(members).join(', ')}`);
  }
}

console.log('\nIndividual coreness values:');
for (const [person, coreness] of socialCores.coreness) {
  console.log(`  ${person}: ${coreness}-core`);
}

// Find the most cohesive group (highest k-core)
const mostCohesive = getKCore(socialNetwork, socialCores.maxCore);
console.log(`\nMost cohesive group (${socialCores.maxCore}-core):`, Array.from(mostCohesive));

// Example 2: Collaboration Network
console.log('\n=== Example 2: Research Collaboration Network ===\n');

// Researchers who have co-authored papers
const collaborations = new Map([
  ['Dr. Smith', new Set(['Dr. Jones', 'Dr. Brown', 'Dr. Davis'])],
  ['Dr. Jones', new Set(['Dr. Smith', 'Dr. Brown', 'Dr. Davis', 'Dr. Wilson'])],
  ['Dr. Brown', new Set(['Dr. Smith', 'Dr. Jones', 'Dr. Davis', 'Dr. Wilson', 'Dr. Taylor'])],
  ['Dr. Davis', new Set(['Dr. Smith', 'Dr. Jones', 'Dr. Brown'])],
  ['Dr. Wilson', new Set(['Dr. Jones', 'Dr. Brown', 'Dr. Taylor', 'Dr. Anderson'])],
  ['Dr. Taylor', new Set(['Dr. Brown', 'Dr. Wilson', 'Dr. Anderson'])],
  ['Dr. Anderson', new Set(['Dr. Wilson', 'Dr. Taylor', 'Dr. Lee'])],
  ['Dr. Lee', new Set(['Dr. Anderson'])]
]);

// Find core research groups
const researchCores = kCoreDecomposition(collaborations);

console.log('Research collaboration cores:');
for (let k = researchCores.maxCore; k >= 1; k--) {
  const coreMembers = getKCore(collaborations, k);
  if (coreMembers.size > 0) {
    console.log(`\n${k}-core researchers (at least ${k} collaborators in group):`);
    console.log(`  ${Array.from(coreMembers).join(', ')}`);
    
    // Get the actual subgraph
    const subgraph = getKCoreSubgraph(collaborations, k);
    console.log(`  Subgraph has ${subgraph.size} researchers`);
  }
}

// Example 3: Network Resilience Analysis
console.log('\n=== Example 3: Network Resilience Analysis ===\n');

// Computer network topology
const network = new Map([
  ['Router1', new Set(['Router2', 'Router3', 'Switch1'])],
  ['Router2', new Set(['Router1', 'Router3', 'Router4', 'Switch1'])],
  ['Router3', new Set(['Router1', 'Router2', 'Router4', 'Switch2'])],
  ['Router4', new Set(['Router2', 'Router3', 'Switch2'])],
  ['Switch1', new Set(['Router1', 'Router2', 'Server1', 'Server2'])],
  ['Switch2', new Set(['Router3', 'Router4', 'Server3', 'Server4'])],
  ['Server1', new Set(['Switch1'])],
  ['Server2', new Set(['Switch1'])],
  ['Server3', new Set(['Switch2'])],
  ['Server4', new Set(['Switch2'])]
]);

const networkCores = kCoreDecomposition(network);

console.log('Network component analysis:');
for (const [device, coreness] of networkCores.coreness) {
  const resilience = coreness >= 2 ? 'Resilient' : 'Vulnerable';
  console.log(`  ${device}: ${coreness}-core (${resilience})`);
}

// Identify critical infrastructure (high k-core)
const criticalDevices = getKCore(network, 2);
console.log('\nCritical infrastructure (2-core or higher):');
console.log(`  ${Array.from(criticalDevices).join(', ')}`);

// Example 4: Degeneracy Ordering
console.log('\n=== Example 4: Degeneracy Ordering ===\n');

const ordering = degeneracyOrdering(socialNetwork);
console.log('Degeneracy ordering (process nodes in this order):');
ordering.forEach((person, index) => {
  console.log(`  ${index + 1}. ${person} (coreness: ${socialCores.coreness.get(person)})`);
});

// Example 5: K-Truss Analysis
console.log('\n=== Example 5: K-Truss for Strong Relationships ===\n');

// Small tight-knit community
const community = new Map([
  ['A', new Set(['B', 'C', 'D', 'E'])],
  ['B', new Set(['A', 'C', 'D', 'E'])],
  ['C', new Set(['A', 'B', 'D', 'E'])],
  ['D', new Set(['A', 'B', 'C', 'E', 'F'])],
  ['E', new Set(['A', 'B', 'C', 'D', 'F'])],
  ['F', new Set(['D', 'E', 'G'])],
  ['G', new Set(['F'])]
]);

console.log('K-truss analysis (edges in strong triangular relationships):');
for (let k = 3; k <= 5; k++) {
  const trussEdges = kTruss(community, k);
  if (trussEdges.size > 0) {
    console.log(`\n${k}-truss (edges in at least ${k-2} triangles):`);
    for (const edge of trussEdges) {
      console.log(`  ${edge.replace(',', ' ↔ ')}`);
    }
  }
}

// Example 6: Converting Directed to Undirected
console.log('\n=== Example 6: Analyzing Information Flow Network ===\n');

// Information flow network (directed)
const infoFlow = new Map([
  ['News', new Map([['Blog1', 1], ['Blog2', 1]])],
  ['Blog1', new Map([['Reader1', 1], ['Reader2', 1], ['Blog2', 1]])],
  ['Blog2', new Map([['Reader2', 1], ['Reader3', 1]])],
  ['Reader1', new Map([['Reader2', 1]])],
  ['Reader2', new Map([['Reader3', 1]])],
  ['Reader3', new Map()]
]);

const undirectedFlow = toUndirected(infoFlow);
const flowCores = kCoreDecomposition(undirectedFlow);

console.log('Information flow k-core analysis:');
for (const [node, coreness] of flowCores.coreness) {
  const role = node.startsWith('News') ? 'Source' : 
               node.startsWith('Blog') ? 'Amplifier' : 'Consumer';
  console.log(`  ${node}: ${coreness}-core (${role})`);
}

// Example 7: Temporal Core Evolution
console.log('\n=== Example 7: Temporal Network Evolution ===\n');

// Simulate network growth
const growingNetwork = new Map<string, Set<string>>();
const timeSteps = [
  [['A', 'B'], ['B', 'C'], ['C', 'A']], // Time 1: Triangle
  [['D', 'A'], ['D', 'B'], ['D', 'C']], // Time 2: Add central node
  [['E', 'D'], ['E', 'A']],             // Time 3: Add peripheral node
  [['F', 'E'], ['F', 'D'], ['F', 'B']]  // Time 4: More connections
];

console.log('Network k-core evolution:');
for (let t = 0; t < timeSteps.length; t++) {
  // Add edges for this time step
  for (const [u, v] of timeSteps[t]) {
    if (!growingNetwork.has(u)) growingNetwork.set(u, new Set());
    if (!growingNetwork.has(v)) growingNetwork.set(v, new Set());
    growingNetwork.get(u)!.add(v);
    growingNetwork.get(v)!.add(u);
  }
  
  const cores = kCoreDecomposition(growingNetwork);
  console.log(`\nTime ${t + 1}: Max k-core = ${cores.maxCore}`);
  console.log(`  Nodes: ${growingNetwork.size}, Edges: ${Array.from(growingNetwork.values()).reduce((sum, neighbors) => sum + neighbors.size, 0) / 2}`);
}

// Example 8: Finding Dense Subgraphs
console.log('\n=== Example 8: Dense Subgraph Discovery ===\n');

// Academic department network
const department = new Map([
  // Core faculty group
  ['Prof. A', new Set(['Prof. B', 'Prof. C', 'Prof. D', 'Student1', 'Student2'])],
  ['Prof. B', new Set(['Prof. A', 'Prof. C', 'Prof. D', 'Student2', 'Student3'])],
  ['Prof. C', new Set(['Prof. A', 'Prof. B', 'Prof. D', 'Student3', 'Student4'])],
  ['Prof. D', new Set(['Prof. A', 'Prof. B', 'Prof. C', 'Student4', 'Student5'])],
  
  // Students with varying connectivity
  ['Student1', new Set(['Prof. A', 'Student2'])],
  ['Student2', new Set(['Prof. A', 'Prof. B', 'Student1', 'Student3'])],
  ['Student3', new Set(['Prof. B', 'Prof. C', 'Student2', 'Student4'])],
  ['Student4', new Set(['Prof. C', 'Prof. D', 'Student3', 'Student5'])],
  ['Student5', new Set(['Prof. D', 'Student4'])],
  
  // Visiting researchers
  ['Visitor1', new Set(['Prof. A', 'Prof. B'])],
  ['Visitor2', new Set(['Prof. C'])]
]);

const deptCores = kCoreDecomposition(department);

console.log('Department structure analysis:');
for (let k = deptCores.maxCore; k >= 1; k--) {
  const members = Array.from(deptCores.cores.get(k) || []);
  if (members.length > 0) {
    const faculty = members.filter(m => m.startsWith('Prof')).length;
    const students = members.filter(m => m.startsWith('Student')).length;
    const visitors = members.filter(m => m.startsWith('Visitor')).length;
    
    console.log(`\n${k}-core: ${faculty} faculty, ${students} students, ${visitors} visitors`);
    if (k === deptCores.maxCore) {
      console.log('  Core research group:', members.join(', '));
    }
  }
}