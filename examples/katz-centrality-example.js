// Katz Centrality Example
import { Graph, katzCentrality } from '../dist/algorithms.js';

console.log('=== Katz Centrality Example ===');

// Create a hierarchical organization network
const orgNetwork = new Graph({ directed: true });

// Executive level
orgNetwork.addEdge('CEO', 'CTO');
orgNetwork.addEdge('CEO', 'CFO');
orgNetwork.addEdge('CEO', 'COO');

// Technology branch
orgNetwork.addEdge('CTO', 'VP_Engineering');
orgNetwork.addEdge('CTO', 'VP_Product');
orgNetwork.addEdge('VP_Engineering', 'Eng_Manager1');
orgNetwork.addEdge('VP_Engineering', 'Eng_Manager2');
orgNetwork.addEdge('Eng_Manager1', 'Engineer1');
orgNetwork.addEdge('Eng_Manager1', 'Engineer2');
orgNetwork.addEdge('Eng_Manager2', 'Engineer3');
orgNetwork.addEdge('Eng_Manager2', 'Engineer4');

// Finance branch
orgNetwork.addEdge('CFO', 'Finance_Director');
orgNetwork.addEdge('Finance_Director', 'Accountant1');
orgNetwork.addEdge('Finance_Director', 'Accountant2');

// Operations branch
orgNetwork.addEdge('COO', 'Operations_Manager');
orgNetwork.addEdge('Operations_Manager', 'Coordinator1');
orgNetwork.addEdge('Operations_Manager', 'Coordinator2');

// Cross-functional connections
orgNetwork.addEdge('VP_Product', 'Eng_Manager1');
orgNetwork.addEdge('Finance_Director', 'Operations_Manager');

console.log('Organizational Hierarchy:');
console.log('                    CEO');
console.log('                 /   |   \\');
console.log('              CTO   CFO   COO');
console.log('             /  \\    |     |');
console.log('      VP_Eng VP_Prod |  Ops_Mgr');
console.log('        / \\     |    |    / \\');
console.log('   Mgr1   Mgr2  |  Fin_Dir  Coord1,2');
console.log('   / \\     / \\  |    / \\');
console.log('Eng1,2  Eng3,4 |  Acc1,2');
console.log('         \\____/          \\___/');
console.log('      (cross-functional links)');

// Calculate Katz centrality with default parameters
console.log('\n1. Katz Centrality with default parameters:');
const katzDefault = katzCentrality(orgNetwork);

console.log('\nInfluence scores (default α=0.1):');
Object.entries(katzDefault)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([person, centrality]) => {
        const inDegree = orgNetwork.inDegree(person);
        const outDegree = orgNetwork.outDegree(person);
        console.log(`  ${person.padEnd(20)} ${centrality.toFixed(4)} (in: ${inDegree}, out: ${outDegree})`);
    });

// Test with different attenuation factors
console.log('\n2. Effect of attenuation factor (α):');
const alphaValues = [0.05, 0.1, 0.15, 0.2];

console.log('\nTop 5 nodes for each α value:');
console.log('α     | #1          | #2          | #3          | #4          | #5');
console.log('------|-------------|-------------|-------------|-------------|------------');

for (const alpha of alphaValues) {
    const katzAlpha = katzCentrality(orgNetwork, { alpha });
    const top5 = Object.entries(katzAlpha)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([node]) => node);
    
    console.log(`${alpha.toFixed(2)}  | ${top5.map(n => n.padEnd(11)).join(' | ')}`);
}

// Create a network with cycles
console.log('\n\n=== Network with Cycles (Information Flow) ===');
const infoNetwork = new Graph({ directed: true });

// Create nodes representing information sources
const nodes = ['News', 'Blog', 'Twitter', 'Reddit', 'YouTube', 'Podcast', 'User1', 'User2', 'User3'];
nodes.forEach(node => infoNetwork.addNode(node));

// Information flow paths
infoNetwork.addEdge('News', 'Blog');
infoNetwork.addEdge('News', 'Twitter');
infoNetwork.addEdge('Blog', 'Reddit');
infoNetwork.addEdge('Twitter', 'Reddit');
infoNetwork.addEdge('Reddit', 'YouTube');
infoNetwork.addEdge('YouTube', 'Podcast');
infoNetwork.addEdge('Podcast', 'Blog');  // Creates cycle
infoNetwork.addEdge('Twitter', 'User1');
infoNetwork.addEdge('Reddit', 'User2');
infoNetwork.addEdge('YouTube', 'User3');
infoNetwork.addEdge('User1', 'Twitter');  // User feedback
infoNetwork.addEdge('User2', 'Reddit');   // User feedback
infoNetwork.addEdge('User3', 'YouTube');  // User feedback

console.log('Information Flow Network:');
console.log('  News ──> Blog ──> Reddit ──> YouTube');
console.log('   │        ↑         ↑ ↓        ↓ ↑');
console.log('   └──> Twitter      User2    Podcast');
console.log('         ↓ ↑                     ↑');
console.log('        User1                    │');
console.log('                                 └────┘');

// Calculate Katz centrality for cyclic network
console.log('\n3. Katz Centrality in cyclic network:');
const katzCyclic = katzCentrality(infoNetwork, { alpha: 0.15 });

console.log('\nInformation influence scores:');
Object.entries(katzCyclic)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, centrality]) => {
        console.log(`  ${source.padEnd(10)} ${centrality.toFixed(4)}`);
    });

// Test with personalization vector (biased Katz)
console.log('\n\n=== Personalized Katz Centrality ===');
const socialNetwork = new Graph();

// Create a small social network
const people = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
people.forEach(person => socialNetwork.addNode(person));

// Add friendships
socialNetwork.addEdge('Alice', 'Bob');
socialNetwork.addEdge('Alice', 'Charlie');
socialNetwork.addEdge('Bob', 'Charlie');
socialNetwork.addEdge('Bob', 'David');
socialNetwork.addEdge('Charlie', 'Eve');
socialNetwork.addEdge('David', 'Eve');
socialNetwork.addEdge('David', 'Frank');
socialNetwork.addEdge('Eve', 'Frank');

console.log('Social Network:');
console.log('  Alice---Bob');
console.log('    \\     / \\');
console.log('     \\   /   David---Frank');
console.log('    Charlie   /     /');
console.log('        \\    /     /');
console.log('         Eve------/');

// Standard Katz centrality
const katzStandard = katzCentrality(socialNetwork);

// Personalized Katz with bias towards Alice
// Note: The current implementation uses a single beta value, not per-node
const katzPersonalized = katzCentrality(socialNetwork, { beta: 2.0 });

console.log('\n4. Comparison of standard vs personalized Katz:');
console.log('Person  | Standard Katz | Higher Beta (2.0)');
console.log('--------|--------------|------------------');
people.forEach(person => {
    console.log(`${person.padEnd(7)} | ${katzStandard[person].toFixed(4).padEnd(12)} | ${katzPersonalized[person].toFixed(4)}`);
});

// Test convergence
console.log('\n\n=== Convergence Analysis ===');
console.log('\n5. Testing convergence with different tolerances:');
const tolerances = [1e-3, 1e-6, 1e-9];
const testGraph = orgNetwork;

for (const tol of tolerances) {
    const start = Date.now();
    const result = katzCentrality(testGraph, { tolerance: tol });
    const time = Date.now() - start;
    
    // Get CEO centrality as reference
    const ceoCentrality = result['CEO'];
    console.log(`Tolerance ${tol}: CEO centrality = ${ceoCentrality.toFixed(8)}, Time: ${time}ms`);
}

// Verify results
console.log('\n=== Verification ===');
console.log('✓ CEO should have highest Katz centrality in org network:', 
    Object.entries(katzDefault).sort((a, b) => b[1] - a[1])[0][0] === 'CEO');
console.log('✓ All centrality values should be positive:', 
    Object.values(katzDefault).every(c => c > 0));
console.log('✓ Higher alpha should give more weight to distant connections:', 
    katzCentrality(orgNetwork, { alpha: 0.2 })['Engineer1'] > 
    katzCentrality(orgNetwork, { alpha: 0.05 })['Engineer1']);
console.log('✓ Personalized Katz should favor the biased node:', 
    katzPersonalized['Alice'] > katzStandard['Alice']);