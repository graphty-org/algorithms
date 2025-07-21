// Connected Components Algorithm Example
import { Graph, connectedComponents, connectedComponentsDFS, numberOfConnectedComponents, 
         isConnected, largestConnectedComponent, connectedComponentContaining } from '../dist/algorithms.js';

console.log('=== Connected Components Example ===');

// Create a graph with multiple disconnected components
const graph = new Graph();

// Component 1: Social group
graph.addEdge('Alice', 'Bob');
graph.addEdge('Bob', 'Charlie');
graph.addEdge('Charlie', 'Alice');

// Component 2: Work team
graph.addEdge('David', 'Eve');
graph.addEdge('Eve', 'Frank');

// Component 3: Family
graph.addEdge('Grace', 'Henry');
graph.addEdge('Henry', 'Ivy');
graph.addEdge('Ivy', 'Jack');
graph.addEdge('Jack', 'Grace');

// Component 4: Isolated nodes
graph.addNode('Loner1');
graph.addNode('Loner2');

console.log('Graph Structure:');
console.log('Component 1 (Social): Alice-Bob-Charlie (triangle)');
console.log('Component 2 (Work): David-Eve-Frank (path)');
console.log('Component 3 (Family): Grace-Henry-Ivy-Jack (cycle)');
console.log('Component 4: Loner1 (isolated)');
console.log('Component 5: Loner2 (isolated)');

// Find all connected components using Union-Find
console.log('\n1. Connected Components (Union-Find):');
const components = connectedComponents(graph);
console.log(`Found ${components.length} connected components`);

components.forEach((component, index) => {
    console.log(`Component ${index + 1} (size ${component.length}): [${component.sort().join(', ')}]`);
});

// Find connected components using DFS
console.log('\n2. Connected Components (DFS):');
const componentsDFS = connectedComponentsDFS(graph);
console.log(`DFS found ${componentsDFS.length} connected components`);

componentsDFS.forEach((component, index) => {
    console.log(`DFS Component ${index + 1}: [${component.sort().join(', ')}]`);
});

// Count the number of components
console.log('\n3. Component Statistics:');
const numComponents = numberOfConnectedComponents(graph);
console.log(`Total number of components: ${numComponents}`);

// Check if the graph is connected
const connected = isConnected(graph);
console.log(`Is the graph connected? ${connected}`);

// Find the largest connected component
console.log('\n4. Largest Connected Component:');
const largest = largestConnectedComponent(graph);
console.log(`Largest component size: ${largest.length}`);
console.log(`Largest component: [${largest.sort().join(', ')}]`);

// Find which component a specific node belongs to
console.log('\n5. Component Membership:');
const aliceComponent = connectedComponentContaining(graph, 'Alice');
console.log(`Alice's component: [${aliceComponent.sort().join(', ')}]`);

const davidComponent = connectedComponentContaining(graph, 'David');
console.log(`David's component: [${davidComponent.sort().join(', ')}]`);

// Test with a fully connected graph
console.log('\n6. Fully Connected Graph:');
const connectedGraph = new Graph();
connectedGraph.addEdge('X', 'Y');
connectedGraph.addEdge('Y', 'Z');
connectedGraph.addEdge('Z', 'W');
connectedGraph.addEdge('W', 'X');

const connectedComponents2 = connectedComponents(connectedGraph);
console.log(`Connected graph components: ${connectedComponents2.length}`);
console.log(`Is connected: ${isConnected(connectedGraph)}`);

// Test with empty graph
console.log('\n7. Empty Graph:');
const emptyGraph = new Graph();
const emptyComponents = connectedComponents(emptyGraph);
console.log(`Empty graph components: ${emptyComponents.length}`);
console.log(`Empty graph is connected: ${isConnected(emptyGraph)}`);

// Test with single node
console.log('\n8. Single Node Graph:');
const singleGraph = new Graph();
singleGraph.addNode('OnlyNode');
const singleComponents = connectedComponents(singleGraph);
console.log(`Single node components: ${singleComponents.length}`);
console.log(`Single node is connected: ${isConnected(singleGraph)}`);

// Analyze component sizes
console.log('\n9. Component Size Analysis:');
const componentSizes = components.map(comp => comp.length).sort((a, b) => b - a);
console.log(`Component sizes (largest to smallest): [${componentSizes.join(', ')}]`);

const totalNodes = componentSizes.reduce((sum, size) => sum + size, 0);
console.log(`Total nodes in all components: ${totalNodes}`);
console.log(`Total nodes in graph: ${graph.nodeCount}`);

// Bridge detection concept
console.log('\n10. Component Connectivity:');
console.log('Before adding bridges:');
console.log(`  Components: ${components.length}`);
console.log(`  Largest size: ${Math.max(...componentSizes)}`);

// Simulate adding a bridge between components
const bridgedGraph = graph.clone();
bridgedGraph.addEdge('Alice', 'David');  // Connect component 1 and 2

const bridgedComponents = connectedComponents(bridgedGraph);
console.log('\nAfter adding bridge Alice-David:');
console.log(`  Components: ${bridgedComponents.length}`);
const bridgedSizes = bridgedComponents.map(comp => comp.length).sort((a, b) => b - a);
console.log(`  Largest size: ${Math.max(...bridgedSizes)}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Should find 5 components in original graph:', 
    components.length === 5);
console.log('✓ Union-Find and DFS should give same number of components:', 
    components.length === componentsDFS.length);
console.log('✓ Graph should not be connected (multiple components):', 
    !connected);
console.log('✓ Largest component should be size 4 (Grace-Henry-Ivy-Jack):', 
    largest.length === 4);
console.log('✓ Sum of component sizes should equal total nodes:', 
    totalNodes === graph.nodeCount);
console.log('✓ Fully connected graph should have 1 component:', 
    connectedComponents2.length === 1);
console.log('✓ Empty graph should have 0 components:', 
    emptyComponents.length === 0);
console.log('✓ Single node should have 1 component:', 
    singleComponents.length === 1);
console.log('✓ Adding bridge should reduce number of components:', 
    bridgedComponents.length < components.length);

// Check that each node appears in exactly one component
const allNodesInComponents = new Set();
components.forEach(component => {
    component.forEach(node => allNodesInComponents.add(node));
});
console.log('✓ All nodes should appear in exactly one component:', 
    allNodesInComponents.size === graph.nodeCount);

// Verify specific component memberships
console.log('✓ Alice should be with Bob and Charlie:', 
    aliceComponent.includes('Bob') && aliceComponent.includes('Charlie'));
console.log('✓ David should be with Eve and Frank:', 
    davidComponent.includes('Eve') && davidComponent.includes('Frank'));