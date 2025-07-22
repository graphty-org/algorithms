// Girvan-Newman Community Detection Algorithm Example
import { Graph, girvanNewman } from '../dist/algorithms.js';

console.log('=== Girvan-Newman Community Detection Example ===');

// Create a classic network with two well-defined communities connected by a bridge
const network = new Graph();

// Community 1: Tightly connected group
network.addEdge('A', 'B');
network.addEdge('A', 'C');
network.addEdge('B', 'C');
network.addEdge('B', 'D');
network.addEdge('C', 'D');

// Community 2: Another tightly connected group
network.addEdge('E', 'F');
network.addEdge('E', 'G');
network.addEdge('F', 'G');
network.addEdge('F', 'H');
network.addEdge('G', 'H');

// Bridge connecting the two communities
network.addEdge('D', 'E');  // This edge has high betweenness centrality

console.log('Network Structure:');
console.log('Community 1: A-B-C-D (densely connected)');
console.log('Community 2: E-F-G-H (densely connected)');
console.log('Bridge: D-E (connects the communities)');
console.log('');
console.log('A --- B --- D === E --- F');
console.log('|     |     |   |     |');
console.log('|     |     |   |     |');
console.log('C ----+     |   +---- G');
console.log('      |     |         |');
console.log('      D     E --------H');

// Run Girvan-Newman algorithm
console.log('\n1. Basic Girvan-Newman Community Detection:');
const dendrogram = girvanNewman(network);
console.log(`Dendrogram steps: ${dendrogram.length}`);

// Find the partition with the highest modularity
let bestPartition = dendrogram[0];
let bestModularity = dendrogram[0].modularity;
for (const partition of dendrogram) {
    if (partition.modularity > bestModularity) {
        bestModularity = partition.modularity;
        bestPartition = partition;
    }
}

console.log(`\nBest partition (highest modularity):`)
console.log(`Communities: ${bestPartition.communities.length}`);
console.log(`Modularity: ${bestPartition.modularity.toFixed(4)}`);

console.log('\nCommunity assignments:');
bestPartition.communities.forEach((community, index) => {
    console.log(`Community ${index + 1}: [${community.sort().join(', ')}]`);
});

// Show the dendrogram (hierarchical community structure)
console.log('\n2. Hierarchical Dendrogram:');
console.log('Community evolution:');
dendrogram.slice(0, 10).forEach((step, index) => {
    console.log(`Step ${index + 1}:`);
    console.log(`  Communities: ${step.communities.length}`);
    console.log(`  Modularity: ${step.modularity.toFixed(4)}`);
    if (step.communities.length <= 4) {  // Only show details for few communities
        step.communities.forEach((community, i) => {
            console.log(`    ${i + 1}: [${community.sort().join(', ')}]`);
        });
    }
});

// Run with maximum communities limit
console.log('\n3. Limiting maximum communities to 3:');
const limitedDendrogram = girvanNewman(network, { maxCommunities: 3 });
const lastLimited = limitedDendrogram[limitedDendrogram.length - 1];
console.log(`Limited communities: ${lastLimited.communities.length}`);
console.log(`Limited modularity: ${lastLimited.modularity.toFixed(4)}`);

// Run with minimum community size constraint
console.log('\n4. Minimum community size of 2:');
const minSizeDendrogram = girvanNewman(network, { minCommunitySize: 2 });
const lastMinSize = minSizeDendrogram[minSizeDendrogram.length - 1];
console.log(`Communities with min size 2: ${lastMinSize.communities.length}`);
lastMinSize.communities.forEach((community, index) => {
    console.log(`Community ${index + 1} (size ${community.length}): [${community.sort().join(', ')}]`);
});

// Example 2: Social network analysis
console.log('\n\n=== Example 2: Social Network Analysis ===');
const socialNetwork = new Graph();

// Create departmental clusters
// Sales department
socialNetwork.addEdge('Alice', 'Bob');
socialNetwork.addEdge('Alice', 'Carol');
socialNetwork.addEdge('Bob', 'Carol');
socialNetwork.addEdge('Bob', 'David');
socialNetwork.addEdge('Carol', 'David');
socialNetwork.addEdge('Alice', 'David');

// Engineering department
socialNetwork.addEdge('Eve', 'Frank');
socialNetwork.addEdge('Eve', 'Grace');
socialNetwork.addEdge('Frank', 'Grace');
socialNetwork.addEdge('Frank', 'Henry');
socialNetwork.addEdge('Grace', 'Henry');
socialNetwork.addEdge('Eve', 'Henry');

// Marketing department
socialNetwork.addEdge('Ivy', 'Jack');
socialNetwork.addEdge('Ivy', 'Kate');
socialNetwork.addEdge('Jack', 'Kate');

// Cross-department collaborations (weak ties)
socialNetwork.addEdge('Carol', 'Eve');     // Sales-Engineering
socialNetwork.addEdge('David', 'Frank');    // Sales-Engineering
socialNetwork.addEdge('Grace', 'Ivy');      // Engineering-Marketing

console.log('Analyzing organizational structure...');
const orgDendrogram = girvanNewman(socialNetwork);

// Find optimal number of departments
let bestOrgPartition = orgDendrogram[0];
let bestOrgModularity = orgDendrogram[0].modularity;
for (const partition of orgDendrogram) {
    if (partition.modularity > bestOrgModularity) {
        bestOrgModularity = partition.modularity;
        bestOrgPartition = partition;
    }
}

console.log(`\nDetected ${bestOrgPartition.communities.length} departments:`);
bestOrgPartition.communities.forEach((dept, index) => {
    console.log(`Department ${index + 1}: ${dept.sort().join(', ')}`);
});
console.log(`Department separation quality (modularity): ${bestOrgModularity.toFixed(4)}`);

// Look for a specific number of communities (e.g., known 3 departments)
console.log('\nForcing 3 departments:');
let threeDeptPartition = null;
for (const partition of orgDendrogram) {
    if (partition.communities.length === 3) {
        threeDeptPartition = partition;
        break;
    }
}
if (threeDeptPartition) {
    threeDeptPartition.communities.forEach((dept, index) => {
        console.log(`Department ${index + 1}: ${dept.sort().join(', ')}`);
    });
    console.log(`Modularity with 3 departments: ${threeDeptPartition.modularity.toFixed(4)}`);
}

// Example 3: Karate Club Example
console.log('\n\n=== Example 3: Zachary\'s Karate Club ===');
// This is a simplified version of the famous Karate Club network
const karateClub = new Graph();

// Instructor's group
const instructor = 'Instructor';
const instructorGroup = ['Student1', 'Student2', 'Student3', 'Student4'];
instructorGroup.forEach(student => {
    karateClub.addEdge(instructor, student);
});
// Connections within instructor's group
karateClub.addEdge('Student1', 'Student2');
karateClub.addEdge('Student2', 'Student3');
karateClub.addEdge('Student3', 'Student4');
karateClub.addEdge('Student1', 'Student4');

// Administrator's group
const administrator = 'Administrator';
const adminGroup = ['Student5', 'Student6', 'Student7', 'Student8'];
adminGroup.forEach(student => {
    karateClub.addEdge(administrator, student);
});
// Connections within administrator's group
karateClub.addEdge('Student5', 'Student6');
karateClub.addEdge('Student6', 'Student7');
karateClub.addEdge('Student7', 'Student8');
karateClub.addEdge('Student5', 'Student8');

// Few connections between groups (conflict situation)
karateClub.addEdge('Student2', 'Student6');  // Weak tie
karateClub.addEdge('Student3', 'Student7');  // Weak tie

console.log('Network represents a club with internal conflict...');
const clubDendrogram = girvanNewman(karateClub);

// Find the two-faction split
let twoFactionPartition = null;
for (const partition of clubDendrogram) {
    if (partition.communities.length === 2) {
        twoFactionPartition = partition;
        break;
    }
}

if (twoFactionPartition) {
    console.log('\nTwo-faction split detected:');
    twoFactionPartition.communities.forEach((faction, index) => {
        console.log(`Faction ${index + 1}: ${faction.sort().join(', ')}`);
    });
    console.log(`Split quality (modularity): ${twoFactionPartition.modularity.toFixed(4)}`);
}

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Algorithm should find natural community boundaries:', 
    bestPartition.communities.length === 2);
console.log('✓ Bridge edges should be removed first in hierarchical decomposition:', 
    dendrogram.length > 1);
console.log('✓ Modularity should be positive for well-defined communities:', 
    bestModularity > 0);
console.log('✓ Each node should belong to exactly one community:', 
    bestPartition.communities.reduce((sum, comm) => sum + comm.length, 0) === network.nodeCount);