import { Graph, isGraphIsomorphic, findAllIsomorphisms } from './algorithms.js';

// Comprehensive Graph Isomorphism demonstrations
console.log('=== Graph Isomorphism Comprehensive Analysis ===\n');

// Test Case 1: Simple Isomorphic Graphs
export function testBasicIsomorphism() {
    console.log('1. Basic Isomorphic Graphs:');
    
    // Create two triangles with different node labels
    const triangle1 = new Graph();
    const triangle2 = new Graph();
    
    // Triangle 1: nodes 1, 2, 3
    triangle1.addNode('1'); triangle1.addNode('2'); triangle1.addNode('3');
    triangle1.addEdge('1', '2'); triangle1.addEdge('2', '3'); triangle1.addEdge('3', '1');
    
    // Triangle 2: nodes A, B, C (same structure)
    triangle2.addNode('A'); triangle2.addNode('B'); triangle2.addNode('C');
    triangle2.addEdge('A', 'B'); triangle2.addEdge('B', 'C'); triangle2.addEdge('C', 'A');
    
    console.log('Triangle 1: 1-2-3-1 (cycle)');
    console.log('Triangle 2: A-B-C-A (cycle)');
    
    const result1 = isGraphIsomorphic(triangle1, triangle2);
    console.log(`Isomorphic: ${result1.isIsomorphic}`);
    
    if (result1.mapping) {
        console.log('Node mapping:');
        result1.mapping.forEach((nodeB, nodeA) => {
            console.log(`  ${nodeA} → ${nodeB}`);
        });
    }
    
    // Find all possible mappings
    const allMappings1 = findAllIsomorphisms(triangle1, triangle2);
    console.log(`Total mappings found: ${allMappings1.length}`);
    console.log('(Triangles have rotational symmetry)\n');
    
    return { result1, allMappings1 };
}

// Test Case 2: Non-Isomorphic Graphs
export function testNonIsomorphism() {
    console.log('2. Non-Isomorphic Graphs:');
    
    // Create a path vs a cycle
    const path = new Graph();
    const cycle = new Graph();
    
    // Path: 1-2-3-4
    ['1', '2', '3', '4'].forEach(node => path.addNode(node));
    path.addEdge('1', '2'); path.addEdge('2', '3'); path.addEdge('3', '4');
    
    // Cycle: A-B-C-D-A
    ['A', 'B', 'C', 'D'].forEach(node => cycle.addNode(node));
    cycle.addEdge('A', 'B'); cycle.addEdge('B', 'C'); 
    cycle.addEdge('C', 'D'); cycle.addEdge('D', 'A');
    
    console.log('Path: 1-2-3-4 (linear)');
    console.log('Cycle: A-B-C-D-A (circular)');
    
    const result2 = isGraphIsomorphic(path, cycle);
    console.log(`Isomorphic: ${result2.isIsomorphic}`);
    console.log('Reason: Different degree sequences');
    
    // Analyze degree sequences
    const pathDegrees = ['1', '2', '3', '4'].map(n => path.degree(n)).sort((a,b) => a-b);
    const cycleDegrees = ['A', 'B', 'C', 'D'].map(n => cycle.degree(n)).sort((a,b) => a-b);
    
    console.log(`Path degrees: [${pathDegrees.join(', ')}]`);
    console.log(`Cycle degrees: [${cycleDegrees.join(', ')}]`);
    console.log('Path has nodes with degree 1, cycle has all nodes with degree 2\n');
    
    return result2;
}

// Test Case 3: Complex Isomorphic Graphs
export function testComplexIsomorphism() {
    console.log('3. Complex Isomorphic Graphs:');
    
    // Create two "bowtie" graphs (two triangles connected at one vertex)
    const bowtie1 = new Graph();
    const bowtie2 = new Graph();
    
    // Bowtie 1: Two triangles sharing vertex 'center'
    ['left1', 'left2', 'center', 'right1', 'right2'].forEach(node => bowtie1.addNode(node));
    // Left triangle
    bowtie1.addEdge('left1', 'left2'); bowtie1.addEdge('left2', 'center'); bowtie1.addEdge('center', 'left1');
    // Right triangle
    bowtie1.addEdge('center', 'right1'); bowtie1.addEdge('right1', 'right2'); bowtie1.addEdge('right2', 'center');
    
    // Bowtie 2: Same structure, different labels
    ['A', 'B', 'C', 'D', 'E'].forEach(node => bowtie2.addNode(node));
    // One triangle: A-B-C
    bowtie2.addEdge('A', 'B'); bowtie2.addEdge('B', 'C'); bowtie2.addEdge('C', 'A');
    // Other triangle: C-D-E (C is the shared vertex)
    bowtie2.addEdge('C', 'D'); bowtie2.addEdge('D', 'E'); bowtie2.addEdge('E', 'C');
    
    console.log('Bowtie 1: Two triangles connected at "center"');
    console.log('Bowtie 2: Two triangles connected at "C"');
    
    const result3 = isGraphIsomorphic(bowtie1, bowtie2);
    console.log(`Isomorphic: ${result3.isIsomorphic}`);
    
    if (result3.mapping) {
        console.log('Node mapping:');
        result3.mapping.forEach((nodeB, nodeA) => {
            console.log(`  ${nodeA} → ${nodeB}`);
        });
        
        // Verify the center node mapping
        const centerMappedTo = result3.mapping.get('center');
        console.log(`Center node "center" maps to "${centerMappedTo}" (should have degree 4)`);
    }
    
    console.log('');
    return result3;
}

// Test Case 4: Graph Automorphism (self-isomorphism)
export function testAutomorphism() {
    console.log('4. Graph Automorphism (Self-Isomorphism):');
    
    // Create a square (4-cycle with diagonals)
    const square = new Graph();
    ['1', '2', '3', '4'].forEach(node => square.addNode(node));
    // Square edges
    square.addEdge('1', '2'); square.addEdge('2', '3'); 
    square.addEdge('3', '4'); square.addEdge('4', '1');
    // Diagonals
    square.addEdge('1', '3'); square.addEdge('2', '4');
    
    console.log('Complete graph K4 (square with diagonals)');
    console.log('Testing automorphisms (mappings to itself)...');
    
    // Test isomorphism with itself
    const result4 = isGraphIsomorphic(square, square);
    console.log(`Self-isomorphic: ${result4.isIsomorphic}`);
    
    // Find all automorphisms
    const automorphisms = findAllIsomorphisms(square, square);
    console.log(`Number of automorphisms: ${automorphisms.length}`);
    console.log('(K4 has 4! = 24 automorphisms - all permutations)\n');
    
    // Show a few example automorphisms
    console.log('Example automorphisms:');
    automorphisms.slice(0, 3).forEach((mapping, index) => {
        console.log(`  Automorphism ${index + 1}:`);
        mapping.forEach((target, source) => {
            console.log(`    ${source} → ${target}`);
        });
    });
    
    console.log('');
    return { result4, automorphisms };
}

// Test Case 5: Real-world Application - Chemical Structures
export function testChemicalStructures() {
    console.log('5. Chemical Structure Isomorphism:');
    
    // Model simple hydrocarbon molecules
    // Butane: C-C-C-C (straight chain)
    const butane = new Graph();
    ['C1', 'C2', 'C3', 'C4'].forEach(node => butane.addNode(node));
    butane.addEdge('C1', 'C2'); butane.addEdge('C2', 'C3'); butane.addEdge('C3', 'C4');
    
    // Isobutane: branched structure
    //     C4
    //     |
    // C1-C2-C3
    const isobutane = new Graph();
    ['C1', 'C2', 'C3', 'C4'].forEach(node => isobutane.addNode(node));
    isobutane.addEdge('C1', 'C2'); isobutane.addEdge('C2', 'C3'); isobutane.addEdge('C2', 'C4');
    
    console.log('Butane: C1-C2-C3-C4 (straight chain)');
    console.log('Isobutane: C1-C2-C3 with C4 branching from C2');
    
    const chemResult = isGraphIsomorphic(butane, isobutane);
    console.log(`Isomorphic: ${chemResult.isIsomorphic}`);
    console.log('These are structural isomers - same molecular formula, different structure\n');
    
    return chemResult;
}

// Test Case 6: Performance Analysis
export function performanceAnalysis() {
    console.log('6. Performance Analysis:');
    
    // Test with different graph sizes
    const sizes = [4, 5, 6, 7];
    
    sizes.forEach(size => {
        console.log(`\nTesting with ${size} nodes:`);
        
        // Create two random graphs
        const graph1 = createRandomGraph(size, 0.5);
        const graph2 = createRandomGraph(size, 0.5);
        
        // Time the isomorphism check
        const start = performance.now();
        const result = isGraphIsomorphic(graph1, graph2);
        const time = performance.now() - start;
        
        console.log(`  Random graphs isomorphic: ${result.isIsomorphic}`);
        console.log(`  Time taken: ${time.toFixed(2)}ms`);
        
        // Test with guaranteed isomorphic graphs (same graph, permuted labels)
        const permuted = permuteGraphLabels(graph1);
        const startIso = performance.now();
        const resultIso = isGraphIsomorphic(graph1, permuted);
        const timeIso = performance.now() - startIso;
        
        console.log(`  Permuted isomorphism: ${resultIso.isIsomorphic}`);
        console.log(`  Time taken: ${timeIso.toFixed(2)}ms`);
    });
    
    console.log('\nComplexity: O(n!) worst case, but typically much faster due to pruning');
}

// Test Case 7: Edge Cases
export function testEdgeCases() {
    console.log('\n7. Edge Cases:');
    
    // Empty graphs
    const empty1 = new Graph();
    const empty2 = new Graph();
    const emptyResult = isGraphIsomorphic(empty1, empty2);
    console.log(`Empty graphs isomorphic: ${emptyResult.isIsomorphic}`);
    
    // Single node graphs
    const single1 = new Graph(); single1.addNode('A');
    const single2 = new Graph(); single2.addNode('X');
    const singleResult = isGraphIsomorphic(single1, single2);
    console.log(`Single node graphs isomorphic: ${singleResult.isIsomorphic}`);
    
    // Disconnected graphs
    const disconnected1 = new Graph();
    ['A', 'B', 'C', 'D'].forEach(node => disconnected1.addNode(node));
    disconnected1.addEdge('A', 'B'); disconnected1.addEdge('C', 'D');
    
    const disconnected2 = new Graph();
    ['1', '2', '3', '4'].forEach(node => disconnected2.addNode(node));
    disconnected2.addEdge('1', '2'); disconnected2.addEdge('3', '4');
    
    const disconnectedResult = isGraphIsomorphic(disconnected1, disconnected2);
    console.log(`Disconnected graphs isomorphic: ${disconnectedResult.isIsomorphic}`);
    
    console.log('');
}

// Utility function to create random graph
function createRandomGraph(nodeCount, edgeProbability) {
    const graph = new Graph();
    
    // Add nodes
    for (let i = 0; i < nodeCount; i++) {
        graph.addNode(i.toString());
    }
    
    // Add random edges
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            if (Math.random() < edgeProbability) {
                graph.addEdge(i.toString(), j.toString());
            }
        }
    }
    
    return graph;
}

// Utility function to permute graph labels
function permuteGraphLabels(graph) {
    const nodes = Array.from(graph.nodes()).map(n => n.id);
    const permuted = new Graph();
    
    // Create random permutation
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    const mapping = new Map();
    nodes.forEach((node, index) => {
        mapping.set(node, shuffled[index]);
    });
    
    // Add nodes with new labels
    shuffled.forEach(node => permuted.addNode(node));
    
    // Add edges with permuted labels
    for (const edge of graph.edges()) {
        const newSource = mapping.get(edge.source);
        const newTarget = mapping.get(edge.target);
        if (newSource && newTarget) {
            permuted.addEdge(newSource, newTarget);
        }
    }
    
    return permuted;
}

// Educational examples showing when isomorphism matters
export function educationalExamples() {
    console.log('\n=== Educational Applications ===');
    
    console.log('\n1. Social Network Analysis:');
    console.log('   - Finding similar community structures in different networks');
    console.log('   - Identifying recurring patterns in social connections');
    
    console.log('\n2. Chemical Compound Analysis:');
    console.log('   - Detecting structural isomers (same atoms, different arrangement)');
    console.log('   - Drug discovery: finding molecules with similar structures');
    
    console.log('\n3. Circuit Design:');
    console.log('   - Verifying if two circuit diagrams are functionally equivalent');
    console.log('   - Optimizing circuit layouts while preserving connectivity');
    
    console.log('\n4. Pattern Recognition:');
    console.log('   - Image analysis: finding similar structural patterns');
    console.log('   - Protein folding: comparing 3D molecular structures');
    
    console.log('\n5. Computer Science:');
    console.log('   - Code similarity detection (abstract syntax trees)');
    console.log('   - Database schema comparison');
    console.log('   - Network topology analysis');
}

// Main demonstration function
export function runGraphIsomorphism() {
    testBasicIsomorphism();
    testNonIsomorphism();
    testComplexIsomorphism();
    testAutomorphism();
    testChemicalStructures();
    performanceAnalysis();
    testEdgeCases();
    educationalExamples();
    
    console.log('\n=== Summary ===');
    console.log('Graph isomorphism is a fundamental problem in graph theory with many applications.');
    console.log('The VF2 algorithm efficiently tests structural equivalence between graphs.');
    console.log('Key insight: Two graphs are isomorphic if their "shape" is identical,');
    console.log('regardless of how the nodes are labeled or positioned.');
}