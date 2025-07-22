/**
 * Hierarchical Clustering Examples
 * 
 * This example demonstrates hierarchical clustering for discovering
 * multi-scale structure in graphs and networks.
 */

import {
  hierarchicalClustering,
  cutDendrogram,
  cutDendrogramKClusters,
  modularityHierarchicalClustering,
  type LinkageMethod
} from '../src/clustering/hierarchical';

// Example 1: Social Groups Hierarchy
console.log('=== Example 1: Social Groups Hierarchy ===\n');

// Friend network with natural groups
const socialNetwork = new Map([
  // Family group
  ['Alice', new Set(['Bob', 'Carol'])],
  ['Bob', new Set(['Alice', 'Carol'])],
  ['Carol', new Set(['Alice', 'Bob', 'David'])], // Bridge to work group
  
  // Work group
  ['David', new Set(['Carol', 'Eve', 'Frank'])],
  ['Eve', new Set(['David', 'Frank'])],
  ['Frank', new Set(['David', 'Eve', 'George'])], // Bridge to hobby group
  
  // Hobby group
  ['George', new Set(['Frank', 'Helen', 'Ivan'])],
  ['Helen', new Set(['George', 'Ivan'])],
  ['Ivan', new Set(['George', 'Helen'])]
]);

console.log('Hierarchical clustering with different linkage methods:\n');

const linkageMethods: LinkageMethod[] = ['single', 'complete', 'average'];

for (const method of linkageMethods) {
  const result = hierarchicalClustering(socialNetwork, method);
  
  console.log(`${method.toUpperCase()} linkage:`);
  console.log(`  Dendrogram height: ${result.root.height}`);
  console.log(`  Root distance: ${result.root.distance}`);
  
  // Show clusters at different levels
  for (let k = 1; k <= 3; k++) {
    const clusters = cutDendrogramKClusters(result.root, k);
    console.log(`  ${k} clusters:`, clusters.map(c => Array.from(c).join(', ')));
  }
  console.log();
}

// Example 2: Biological Network Analysis
console.log('=== Example 2: Protein Interaction Network ===\n');

// Protein interaction network with functional modules
const proteinNetwork = new Map([
  // DNA repair module
  ['BRCA1', new Set(['BRCA2', 'RAD51', 'PALB2'])],
  ['BRCA2', new Set(['BRCA1', 'RAD51', 'PALB2'])],
  ['RAD51', new Set(['BRCA1', 'BRCA2', 'RAD52'])],
  ['RAD52', new Set(['RAD51'])],
  ['PALB2', new Set(['BRCA1', 'BRCA2'])],
  
  // Cell cycle module
  ['CDK1', new Set(['CCNB1', 'CDC25'])],
  ['CCNB1', new Set(['CDK1', 'CDC25', 'APC'])],
  ['CDC25', new Set(['CDK1', 'CCNB1'])],
  ['APC', new Set(['CCNB1', 'CDC20'])],
  ['CDC20', new Set(['APC'])],
  
  // Weak connection between modules
  ['RAD51', new Set(['BRCA1', 'BRCA2', 'RAD52', 'CDK1'])],
  ['CDK1', new Set(['CCNB1', 'CDC25', 'RAD51'])]
]);

const bioResult = modularityHierarchicalClustering(proteinNetwork);

console.log('Modularity-based hierarchical clustering:');
console.log(`Total proteins: ${bioResult.root.members.size}`);

// Find functional modules
const modules2 = cutDendrogramKClusters(bioResult.root, 2);
console.log('\nIdentified functional modules:');
modules2.forEach((module, i) => {
  console.log(`  Module ${i + 1}: ${Array.from(module).join(', ')}`);
});

// Show dendrogram structure
console.log('\nDendrogram merge sequence:');
for (let i = proteinNetwork.size; i < bioResult.dendrogram.length; i++) {
  const node = bioResult.dendrogram[i];
  console.log(`  Step ${i - proteinNetwork.size + 1}: Merged ${node.members.size} proteins at distance ${node.distance.toFixed(3)}`);
}

// Example 3: Geographic Clustering
console.log('\n=== Example 3: City Network by Distance ===\n');

// Cities connected by direct routes
const cityNetwork = new Map([
  // West Coast
  ['Seattle', new Set(['Portland', 'Vancouver'])],
  ['Portland', new Set(['Seattle', 'SanFrancisco', 'Eugene'])],
  ['SanFrancisco', new Set(['Portland', 'LosAngeles', 'Sacramento'])],
  ['LosAngeles', new Set(['SanFrancisco', 'SanDiego'])],
  ['SanDiego', new Set(['LosAngeles'])],
  
  // Mountain region
  ['Denver', new Set(['SaltLake', 'Phoenix'])],
  ['SaltLake', new Set(['Denver', 'Portland'])],
  ['Phoenix', new Set(['Denver', 'LosAngeles'])],
  
  // Canada
  ['Vancouver', new Set(['Seattle', 'Calgary'])],
  ['Calgary', new Set(['Vancouver'])],
  
  // California inland
  ['Sacramento', new Set(['SanFrancisco', 'Eugene'])],
  ['Eugene', new Set(['Portland', 'Sacramento'])]
]);

const geoResult = hierarchicalClustering(cityNetwork, 'average');

console.log('Geographic hierarchical clustering:');

// Show different numbers of regions
for (let regions = 2; regions <= 5; regions++) {
  const clusters = cutDendrogramKClusters(geoResult.root, regions);
  console.log(`\n${regions} regions:`);
  clusters.forEach((cluster, i) => {
    console.log(`  Region ${i + 1}: ${Array.from(cluster).join(', ')}`);
  });
}

// Example 4: Temporal Network Evolution
console.log('\n=== Example 4: Communication Network Over Time ===\n');

// Simulate network growth over time
const timeSteps = [
  // Initial core team
  new Map([
    ['CEO', new Set(['CTO', 'CFO'])],
    ['CTO', new Set(['CEO', 'CFO'])],
    ['CFO', new Set(['CEO', 'CTO'])]
  ]),
  
  // Add engineering team
  new Map([
    ['CEO', new Set(['CTO', 'CFO'])],
    ['CTO', new Set(['CEO', 'CFO', 'Eng1', 'Eng2'])],
    ['CFO', new Set(['CEO', 'CTO'])],
    ['Eng1', new Set(['CTO', 'Eng2'])],
    ['Eng2', new Set(['CTO', 'Eng1'])]
  ]),
  
  // Add sales team
  new Map([
    ['CEO', new Set(['CTO', 'CFO', 'SalesDir'])],
    ['CTO', new Set(['CEO', 'CFO', 'Eng1', 'Eng2'])],
    ['CFO', new Set(['CEO', 'CTO', 'SalesDir'])],
    ['Eng1', new Set(['CTO', 'Eng2'])],
    ['Eng2', new Set(['CTO', 'Eng1'])],
    ['SalesDir', new Set(['CEO', 'CFO', 'Sales1', 'Sales2'])],
    ['Sales1', new Set(['SalesDir', 'Sales2'])],
    ['Sales2', new Set(['SalesDir', 'Sales1'])]
  ])
];

console.log('Network evolution analysis:');

timeSteps.forEach((network, t) => {
  const result = hierarchicalClustering(network, 'complete');
  
  console.log(`\nTime ${t + 1}: ${network.size} members`);
  
  // Find natural team structure
  const maxClusters = Math.min(3, network.size);
  for (let k = 1; k <= maxClusters; k++) {
    const clusters = cutDendrogramKClusters(result.root, k);
    console.log(`  ${k} teams:`, clusters.map(c => `[${Array.from(c).join(', ')}]`).join(' '));
  }
});

// Example 5: Document Clustering
console.log('\n=== Example 5: Document Similarity Network ===\n');

// Documents connected by shared topics
const documents = new Map([
  // Machine Learning cluster
  ['ML_intro', new Set(['ML_supervised', 'ML_unsupervised', 'Stats_basics'])],
  ['ML_supervised', new Set(['ML_intro', 'ML_deep', 'ML_trees'])],
  ['ML_unsupervised', new Set(['ML_intro', 'ML_clustering'])],
  ['ML_deep', new Set(['ML_supervised', 'ML_neural'])],
  ['ML_neural', new Set(['ML_deep'])],
  ['ML_trees', new Set(['ML_supervised'])],
  ['ML_clustering', new Set(['ML_unsupervised', 'Stats_clustering'])],
  
  // Statistics cluster
  ['Stats_basics', new Set(['ML_intro', 'Stats_inference'])],
  ['Stats_inference', new Set(['Stats_basics', 'Stats_bayesian'])],
  ['Stats_bayesian', new Set(['Stats_inference'])],
  ['Stats_clustering', new Set(['ML_clustering'])],
  
  // Database cluster
  ['DB_intro', new Set(['DB_sql', 'DB_nosql'])],
  ['DB_sql', new Set(['DB_intro', 'DB_optimization'])],
  ['DB_nosql', new Set(['DB_intro'])],
  ['DB_optimization', new Set(['DB_sql'])]
]);

const docResult = modularityHierarchicalClustering(documents);

console.log('Document clustering by topic:');

// Find topic clusters
const topics = cutDendrogramKClusters(docResult.root, 3);
console.log('\nIdentified topics:');
topics.forEach((topic, i) => {
  const docs = Array.from(topic);
  const category = docs[0].split('_')[0];
  console.log(`  Topic ${i + 1} (${category}): ${docs.length} documents`);
  console.log(`    Documents: ${docs.join(', ')}`);
});

// Example 6: Hierarchical Community Detection
console.log('\n=== Example 6: Multi-level Community Structure ===\n');

// Network with hierarchical community structure
const communities = new Map<string, Set<string>>();

// Create hierarchical structure: 2 super-communities, each with 2 sub-communities
for (let superComm = 0; superComm < 2; superComm++) {
  for (let sub = 0; sub < 2; sub++) {
    const communityPrefix = `S${superComm}C${sub}`;
    
    // Create a small community
    for (let i = 0; i < 4; i++) {
      const node = `${communityPrefix}N${i}`;
      communities.set(node, new Set());
      
      // Connect within sub-community (dense)
      for (let j = 0; j < 4; j++) {
        if (i !== j) {
          communities.get(node)!.add(`${communityPrefix}N${j}`);
        }
      }
      
      // Connect to other sub-community in same super-community (sparse)
      if (i === 0) {
        const otherSub = sub === 0 ? 1 : 0;
        communities.get(node)!.add(`S${superComm}C${otherSub}N0`);
      }
      
      // Connect super-communities (very sparse)
      if (superComm === 0 && sub === 0 && i === 0) {
        communities.get(node)!.add('S1C0N0');
      }
    }
  }
}

const hierResult = modularityHierarchicalClustering(communities);

console.log('Hierarchical community detection:');
console.log(`Network size: ${communities.size} nodes`);

// Show community structure at different levels
const levels = [2, 4, 8];
for (const k of levels) {
  const clusters = cutDendrogramKClusters(hierResult.root, k);
  console.log(`\n${k} communities:`);
  clusters.forEach((cluster, i) => {
    const nodes = Array.from(cluster);
    const sample = nodes.slice(0, 3).join(', ') + (nodes.length > 3 ? '...' : '');
    console.log(`  Community ${i + 1}: ${cluster.size} nodes [${sample}]`);
  });
}

// Analyze merge distances
console.log('\nMerge distances (modularity loss):');
const merges = hierResult.dendrogram.slice(communities.size);
merges.slice(0, 5).forEach((node, i) => {
  console.log(`  Merge ${i + 1}: distance = ${node.distance.toFixed(4)}`);
});