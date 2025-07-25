import { minSTCut, stoerWagner, kargerMinCut } from './algorithms.js';

// Comprehensive Min-Cut Algorithm demonstrations
console.log('=== Min-Cut Algorithm Comprehensive Analysis ===\n');

// Test Case 1: Network Reliability Analysis
export function testNetworkReliabilityAnalysis() {
    console.log('1. Network Reliability Analysis:');
    
    // Computer network with servers, switches, routers, and gateway
    const computerNetwork = new Map([
        ['Server1', new Map([['Switch1', 100], ['Switch2', 100]])],
        ['Server2', new Map([['Switch1', 100], ['Switch2', 100]])],
        ['Switch1', new Map([['Router1', 50], ['Router2', 50]])],
        ['Switch2', new Map([['Router1', 50], ['Router2', 50]])],
        ['Router1', new Map([['Gateway', 80]])],
        ['Router2', new Map([['Gateway', 80]])],
        ['Gateway', new Map()]
    ]);
    
    console.log('Computer Network Topology:');
    console.log('Servers → Switches → Routers → Gateway');
    console.log('Finding critical connections that limit throughput...\n');
    
    // Find s-t minimum cut from servers to gateway
    const stCut1 = minSTCut(computerNetwork, 'Server1', 'Gateway');
    console.log('Minimum cut from Server1 to Gateway:');
    console.log(`Cut value: ${stCut1.cutValue} Mbps`);
    console.log('Critical edges that limit throughput:');
    stCut1.cutEdges.forEach(edge => {
        console.log(`  ${edge.from} → ${edge.to} (capacity: ${edge.weight})`);
    });
    
    // Find global minimum cut using Stoer-Wagner
    console.log('\nGlobal minimum cut (weakest point in entire network):');
    const globalCut = stoerWagner(computerNetwork);
    console.log(`Cut value: ${globalCut.cutValue} Mbps`);
    console.log('Network partitions:');
    console.log(`  Partition 1: ${Array.from(globalCut.partition1).join(', ')}`);
    console.log(`  Partition 2: ${Array.from(globalCut.partition2).join(', ')}`);
    console.log('Critical edges:');
    globalCut.cutEdges.forEach(edge => {
        console.log(`  ${edge.from} → ${edge.to} (capacity: ${edge.weight})`);
    });
    
    console.log('');
    return { stCut1, globalCut };
}

// Test Case 2: Social Network Analysis
export function testSocialNetworkAnalysis() {
    console.log('2. Social Network Analysis:');
    
    const socialNetwork = new Map([
        // Community 1 (tight-knit group)
        ['Alice', new Map([['Bob', 10], ['Charlie', 10], ['Diana', 8], ['Eve', 2]])],
        ['Bob', new Map([['Alice', 10], ['Charlie', 9], ['Diana', 7], ['Frank', 1]])],
        ['Charlie', new Map([['Alice', 10], ['Bob', 9], ['Diana', 8], ['George', 1]])],
        ['Diana', new Map([['Alice', 8], ['Bob', 7], ['Charlie', 8], ['Helen', 2]])],
        
        // Community 2 (another tight-knit group)
        ['Eve', new Map([['Alice', 2], ['Frank', 9], ['George', 10], ['Helen', 8]])],
        ['Frank', new Map([['Bob', 1], ['Eve', 9], ['George', 10], ['Helen', 9]])],
        ['George', new Map([['Charlie', 1], ['Eve', 10], ['Frank', 10], ['Helen', 8]])],
        ['Helen', new Map([['Diana', 2], ['Eve', 8], ['Frank', 9], ['George', 8]])]
    ]);
    
    console.log('Social Network with two communities connected by weak ties...');
    
    // Use Karger's algorithm (multiple runs for better accuracy)
    console.log('Running Karger\'s randomized algorithm...');
    let bestCut = null;
    
    for (let i = 0; i < 20; i++) {
        const cut = kargerMinCut(socialNetwork, 1);
        if (!bestCut || cut.cutValue < bestCut.cutValue) {
            bestCut = cut;
        }
    }
    
    if (bestCut) {
        console.log(`\nBest minimum cut found: ${bestCut.cutValue}`);
        console.log('Community separation:');
        console.log(`  Group 1: ${Array.from(bestCut.partition1).join(', ')}`);
        console.log(`  Group 2: ${Array.from(bestCut.partition2).join(', ')}`);
        console.log('Weak connections between communities:');
        bestCut.cutEdges.forEach(edge => {
            console.log(`  ${edge.from} ↔ ${edge.to} (strength: ${edge.weight})`);
        });
    }
    
    // Compare with Stoer-Wagner
    const stoerCut = stoerWagner(socialNetwork);
    console.log(`\nStoer-Wagner result: Cut value ${stoerCut.cutValue}`);
    console.log(`Communities found: ${stoerCut.partition1.size} vs ${stoerCut.partition2.size} people`);
    
    console.log('');
    return { bestCut, stoerCut };
}

// Test Case 3: Transportation Network Bottlenecks
export function testTransportationBottlenecks() {
    console.log('3. Transportation Network Bottlenecks:');
    
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
    
    console.log('Transportation network: North Hub → Highways → Junctions → Bridges → South Hub');
    
    // Find minimum cut between North and South
    const trafficCut = minSTCut(roadNetwork, 'NorthHub', 'SouthHub');
    console.log('\nMinimum cut between North and South regions:');
    console.log(`Total capacity: ${trafficCut.cutValue} vehicles/hour`);
    console.log('\nBottleneck roads:');
    trafficCut.cutEdges.forEach(edge => {
        console.log(`  ${edge.from} → ${edge.to}: ${edge.weight} vehicles/hour`);
    });
    
    // Analyze different source-sink pairs
    const alternativePairs = [
        ['Highway1', 'SouthHub'],
        ['Junction1', 'Bridge1'],
        ['Junction2', 'Bridge2']
    ];
    
    console.log('\nAnalyzing alternative routes:');
    alternativePairs.forEach(([source, sink]) => {
        const cut = minSTCut(roadNetwork, source, sink);
        console.log(`  ${source} to ${sink}: Max flow = ${cut.cutValue} vehicles/hour`);
    });
    
    console.log('');
    return { trafficCut };
}

// Test Case 4: Circuit Design Partitioning
export function testCircuitPartitioning() {
    console.log('4. Circuit Design Partitioning:');
    
    const circuit = new Map([
        // Module A components (densely connected)
        ['A1', new Map([['A2', 5], ['A3', 4], ['B1', 1], ['B2', 1]])],
        ['A2', new Map([['A1', 5], ['A3', 6], ['A4', 4], ['C1', 1]])],
        ['A3', new Map([['A1', 4], ['A2', 6], ['A4', 5], ['B3', 1]])],
        ['A4', new Map([['A2', 4], ['A3', 5], ['C2', 1]])],
        
        // Module B components (densely connected)
        ['B1', new Map([['A1', 1], ['B2', 5], ['B3', 4]])],
        ['B2', new Map([['A1', 1], ['B1', 5], ['B3', 6], ['B4', 4]])],
        ['B3', new Map([['A3', 1], ['B1', 4], ['B2', 6], ['B4', 5]])],
        ['B4', new Map([['B2', 4], ['B3', 5], ['C3', 1]])],
        
        // Module C components (densely connected)
        ['C1', new Map([['A2', 1], ['C2', 5], ['C3', 4]])],
        ['C2', new Map([['A4', 1], ['C1', 5], ['C3', 6]])],
        ['C3', new Map([['B4', 1], ['C1', 4], ['C2', 6]])]
    ]);
    
    console.log('Circuit with components A1-A4, B1-B4, C1-C3');
    console.log('Dense intra-module connections, sparse inter-module connections');
    
    // Find optimal partition using Stoer-Wagner
    const partition = stoerWagner(circuit);
    console.log(`\nOptimal partition found:`);
    console.log(`Minimum cut value: ${partition.cutValue} connections`);
    console.log('\nInter-module connections to minimize:');
    partition.cutEdges.forEach(edge => {
        console.log(`  ${edge.from} ↔ ${edge.to} (weight: ${edge.weight})`);
    });
    
    // Show partition sets
    console.log('\nOptimal circuit partition:');
    console.log(`Module 1: ${Array.from(partition.partition1).sort().join(', ')}`);
    console.log(`Module 2: ${Array.from(partition.partition2).sort().join(', ')}`);
    
    // Analyze partition quality
    const totalEdgeWeight = Array.from(circuit.entries()).reduce((total, [node, neighbors]) => {
        return total + Array.from(neighbors.values()).reduce((sum, weight) => sum + weight, 0);
    }, 0) / 2; // Divide by 2 since edges are counted twice
    
    const cutRatio = partition.cutValue / totalEdgeWeight;
    console.log(`\nPartition quality: ${(cutRatio * 100).toFixed(1)}% of total connections are inter-module`);
    
    console.log('');
    return { partition, cutRatio };
}

// Test Case 5: Algorithm Performance Comparison
export function testAlgorithmPerformance() {
    console.log('5. Algorithm Performance Comparison:');
    
    // Create test networks of different sizes
    const testSizes = [8, 12, 16, 20];
    
    testSizes.forEach(size => {
        console.log(`\nTesting with ${size} nodes:`);
        
        const testNetwork = createTestNetwork(size);
        const nodes = Array.from(testNetwork.keys());
        const source = nodes[0];
        const sink = nodes[nodes.length - 1];
        
        // Time each algorithm
        const startST = performance.now();
        const stResult = minSTCut(testNetwork, source, sink);
        const timeST = performance.now() - startST;
        
        const startStoer = performance.now();
        const stoerResult = stoerWagner(testNetwork);
        const timeStoer = performance.now() - startStoer;
        
        const startKarger = performance.now();
        const kargerResult = kargerMinCut(testNetwork, 10);
        const timeKarger = performance.now() - startKarger;
        
        console.log(`  S-T Cut: ${stResult.cutValue} (${timeST.toFixed(2)}ms)`);
        console.log(`  Stoer-Wagner: ${stoerResult.cutValue} (${timeStoer.toFixed(2)}ms)`);
        console.log(`  Karger: ${kargerResult.cutValue} (${timeKarger.toFixed(2)}ms)`);
        
        // Find the minimum cut value
        const minCut = Math.min(stResult.cutValue, stoerResult.cutValue, kargerResult.cutValue);
        console.log(`  Global minimum: ${minCut}`);
    });
    
    console.log('\nPerformance Notes:');
    console.log('- S-T Cut: Fast for specific source-sink pairs');
    console.log('- Stoer-Wagner: Deterministic, good for exact global minimum');
    console.log('- Karger: Randomized, scales well but approximate');
}

// Test Case 6: Edge Cases and Special Graphs
export function testEdgeCases() {
    console.log('\n6. Edge Cases and Special Graphs:');
    
    // Test 1: Disconnected graph
    console.log('Testing disconnected graph:');
    const disconnected = new Map([
        ['A', new Map([['B', 5]])],
        ['B', new Map([['A', 5]])],
        ['C', new Map([['D', 3]])],
        ['D', new Map([['C', 3]])]
    ]);
    
    const disconnectedCut = stoerWagner(disconnected);
    console.log(`Disconnected graph cut: ${disconnectedCut.cutValue}`);
    
    // Test 2: Complete graph
    console.log('\nTesting complete graph K4:');
    const complete = new Map([
        ['1', new Map([['2', 1], ['3', 1], ['4', 1]])],
        ['2', new Map([['1', 1], ['3', 1], ['4', 1]])],
        ['3', new Map([['1', 1], ['2', 1], ['4', 1]])],
        ['4', new Map([['1', 1], ['2', 1], ['3', 1]])]
    ]);
    
    const completeCut = stoerWagner(complete);
    console.log(`Complete graph K4 cut: ${completeCut.cutValue}`);
    console.log(`Expected: 3 (any single node vs the rest)`);
    
    // Test 3: Star graph
    console.log('\nTesting star graph:');
    const star = new Map([
        ['center', new Map([['leaf1', 2], ['leaf2', 2], ['leaf3', 2], ['leaf4', 2]])],
        ['leaf1', new Map([['center', 2]])],
        ['leaf2', new Map([['center', 2]])],
        ['leaf3', new Map([['center', 2]])],
        ['leaf4', new Map([['center', 2]])]
    ]);
    
    const starCut = stoerWagner(star);
    console.log(`Star graph cut: ${starCut.cutValue}`);
    console.log(`Expected: 2 (single leaf vs rest)`);
    
    // Test 4: Path graph
    console.log('\nTesting path graph:');
    const path = new Map([
        ['A', new Map([['B', 1]])],
        ['B', new Map([['A', 1], ['C', 1]])],
        ['C', new Map([['B', 1], ['D', 1]])],
        ['D', new Map([['C', 1]])]
    ]);
    
    const pathCut = stoerWagner(path);
    console.log(`Path graph cut: ${pathCut.cutValue}`);
    console.log(`Expected: 1 (any single edge)`);
    
    console.log('');
    return { disconnectedCut, completeCut, starCut, pathCut };
}

// Test Case 7: Real-world Application Scenarios
export function testRealWorldApplications() {
    console.log('7. Real-world Application Scenarios:');
    
    // Scenario 1: Data Center Network
    console.log('\nData Center Network Resilience:');
    const dataCenter = new Map([
        ['LoadBalancer', new Map([['Server1', 1000], ['Server2', 1000], ['Server3', 1000]])],
        ['Server1', new Map([['Switch1', 800], ['Switch2', 200]])],
        ['Server2', new Map([['Switch1', 600], ['Switch2', 400]])],
        ['Server3', new Map([['Switch2', 800], ['Switch1', 200]])],
        ['Switch1', new Map([['Router', 500]])],
        ['Switch2', new Map([['Router', 500]])],
        ['Router', new Map([['Internet', 1000]])],
        ['Internet', new Map()]
    ]);
    
    const dcCut = minSTCut(dataCenter, 'LoadBalancer', 'Internet');
    console.log(`Data center bottleneck: ${dcCut.cutValue} Mbps`);
    console.log('Critical network components:');
    dcCut.cutEdges.forEach(edge => {
        console.log(`  ${edge.from} → ${edge.to}: ${edge.weight} Mbps`);
    });
    
    // Scenario 2: Supply Chain Network
    console.log('\nSupply Chain Vulnerability Analysis:');
    const supplyChain = new Map([
        ['Factory1', new Map([['Warehouse1', 100], ['Warehouse2', 80]])],
        ['Factory2', new Map([['Warehouse2', 120], ['Warehouse3', 90]])],
        ['Warehouse1', new Map([['Distribution1', 150]])],
        ['Warehouse2', new Map([['Distribution1', 100], ['Distribution2', 80]])],
        ['Warehouse3', new Map([['Distribution2', 110]])],
        ['Distribution1', new Map([['Retail', 200]])],
        ['Distribution2', new Map([['Retail', 150]])],
        ['Retail', new Map()]
    ]);
    
    const supplyCut = minSTCut(supplyChain, 'Factory1', 'Retail');
    console.log(`Supply chain capacity (Factory1 to Retail): ${supplyCut.cutValue} units`);
    
    const globalSupplyCut = stoerWagner(supplyChain);
    console.log(`Global supply chain bottleneck: ${globalSupplyCut.cutValue} units`);
    
    console.log('');
    return { dcCut, supplyCut, globalSupplyCut };
}

// Utility function to create test networks
function createTestNetwork(size) {
    const network = new Map();
    
    // Create nodes
    for (let i = 0; i < size; i++) {
        network.set(`N${i}`, new Map());
    }
    
    // Create edges with community structure
    const nodes = Array.from(network.keys());
    const midpoint = Math.floor(size / 2);
    
    // Dense connections within communities
    for (let i = 0; i < midpoint; i++) {
        for (let j = i + 1; j < midpoint; j++) {
            const weight = Math.floor(Math.random() * 10) + 5; // 5-14
            network.get(nodes[i]).set(nodes[j], weight);
            network.get(nodes[j]).set(nodes[i], weight);
        }
    }
    
    for (let i = midpoint; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
            const weight = Math.floor(Math.random() * 10) + 5; // 5-14
            network.get(nodes[i]).set(nodes[j], weight);
            network.get(nodes[j]).set(nodes[i], weight);
        }
    }
    
    // Sparse connections between communities
    for (let i = 0; i < midpoint; i++) {
        for (let j = midpoint; j < size; j++) {
            if (Math.random() < 0.3) { // 30% chance
                const weight = Math.floor(Math.random() * 3) + 1; // 1-3
                network.get(nodes[i]).set(nodes[j], weight);
                network.get(nodes[j]).set(nodes[i], weight);
            }
        }
    }
    
    return network;
}

// Educational examples showing when to use each algorithm
export function educationalExamples() {
    console.log('\n=== Educational Applications ===');
    
    console.log('\n1. When to use S-T Min Cut:');
    console.log('   - Network capacity analysis between specific points');
    console.log('   - Finding bottlenecks in supply chains');
    console.log('   - Maximum flow problems (transportation, communication)');
    console.log('   - Fast when you know source and destination');
    
    console.log('\n2. When to use Stoer-Wagner:');
    console.log('   - Finding the globally weakest connection');
    console.log('   - Network reliability analysis');
    console.log('   - Optimal graph partitioning');
    console.log('   - Deterministic results needed');
    
    console.log('\n3. When to use Karger:');
    console.log('   - Large networks where exact solution isn\'t critical');
    console.log('   - Quick approximation of minimum cut');
    console.log('   - Randomized algorithms acceptable');
    console.log('   - Good performance-accuracy trade-off');
    
    console.log('\n4. Real-world Applications:');
    console.log('   - Social Network Analysis: Finding community boundaries');
    console.log('   - Image Segmentation: Separating objects from background');
    console.log('   - VLSI Design: Minimizing chip area and wire length');
    console.log('   - Network Security: Identifying critical vulnerabilities');
    console.log('   - Transportation: Finding traffic bottlenecks');
}

// Main demonstration function
export function runMinCut() {
    testNetworkReliabilityAnalysis();
    testSocialNetworkAnalysis();
    testTransportationBottlenecks();
    testCircuitPartitioning();
    testAlgorithmPerformance();
    testEdgeCases();
    testRealWorldApplications();
    educationalExamples();
    
    console.log('\n=== Summary ===');
    console.log('Min-Cut algorithms are fundamental tools for analyzing network structure:');
    console.log('• S-T Cut: Specific source-sink analysis using max-flow min-cut theorem');
    console.log('• Stoer-Wagner: Deterministic global minimum cut for undirected graphs');
    console.log('• Karger: Randomized approach with good scalability');
    console.log('\nKey insights:');
    console.log('• Minimum cuts reveal network bottlenecks and vulnerabilities');
    console.log('• Different algorithms suit different problem types and constraints');
    console.log('• Cut value indicates network resilience and capacity');
    console.log('• Applications span from computer networks to social analysis');
}