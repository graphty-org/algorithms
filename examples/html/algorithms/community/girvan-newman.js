import { Graph, girvanNewman } from './algorithms.js';

// Comprehensive Girvan-Newman Community Detection demonstrations
console.log('=== Girvan-Newman Community Detection Comprehensive Analysis ===\n');

// Test Case 1: Basic Two-Community Network
export function testBasicCommunityDetection() {
    console.log('1. Basic Two-Community Network:');
    
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
    
    console.log(`\nBest partition (highest modularity):`);
    console.log(`Communities: ${bestPartition.communities.length}`);
    console.log(`Modularity: ${bestPartition.modularity.toFixed(4)}`);
    
    console.log('\nCommunity assignments:');
    bestPartition.communities.forEach((community, index) => {
        console.log(`Community ${index + 1}: [${community.sort().join(', ')}]`);
    });
    
    console.log('');
    return { dendrogram, bestPartition };
}

// Test Case 2: Social Network Analysis
export function testSocialNetworkAnalysis() {
    console.log('2. Social Network Analysis:');
    
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
    
    console.log('');
    return { orgDendrogram, bestOrgPartition };
}

// Test Case 3: Zachary's Karate Club Example
export function testKarateClubExample() {
    console.log('3. Zachary\'s Karate Club:');
    
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
    
    console.log('');
    return { clubDendrogram, twoFactionPartition };
}

// Test Case 4: Algorithm Parameters
export function testAlgorithmParameters() {
    console.log('4. Algorithm Parameters:');
    
    // Create a larger network for parameter testing
    const network = new Graph();
    
    // Build a 3-community network
    // Community 1
    ['A1', 'A2', 'A3', 'A4'].forEach((node, i, arr) => {
        network.addNode(node);
        if (i > 0) network.addEdge(arr[i-1], node);
    });
    network.addEdge('A1', 'A3');
    network.addEdge('A2', 'A4');
    
    // Community 2
    ['B1', 'B2', 'B3', 'B4'].forEach((node, i, arr) => {
        network.addNode(node);
        if (i > 0) network.addEdge(arr[i-1], node);
    });
    network.addEdge('B1', 'B3');
    network.addEdge('B2', 'B4');
    
    // Community 3 (smaller)
    ['C1', 'C2'].forEach(node => network.addNode(node));
    network.addEdge('C1', 'C2');
    
    // Inter-community bridges
    network.addEdge('A4', 'B1');
    network.addEdge('B4', 'C1');
    
    console.log('Testing with maximum communities limit:');
    const limitedResult = girvanNewman(network, { maxCommunities: 2 });
    console.log(`With maxCommunities=2: Found ${limitedResult[limitedResult.length - 1].communities.length} communities`);
    
    console.log('\nTesting with minimum community size:');
    const minSizeResult = girvanNewman(network, { minCommunitySize: 3 });
    const finalPartition = minSizeResult[minSizeResult.length - 1];
    console.log(`With minCommunitySize=3: Found ${finalPartition.communities.length} valid communities`);
    finalPartition.communities.forEach((community, index) => {
        console.log(`Community ${index + 1} (size ${community.length}): [${community.sort().join(', ')}]`);
    });
    
    console.log('');
    return { limitedResult, minSizeResult };
}

// Test Case 5: Edge Betweenness Analysis
export function testEdgeBetweennessAnalysis() {
    console.log('5. Edge Betweenness Analysis:');
    
    // Create a simple network to demonstrate edge betweenness
    const network = new Graph();
    
    // Linear chain with branches
    network.addEdge('A', 'B');
    network.addEdge('B', 'C');  // This edge should have high betweenness
    network.addEdge('C', 'D');
    
    // Branches
    network.addEdge('A', 'E');
    network.addEdge('B', 'F');
    network.addEdge('C', 'G');
    network.addEdge('D', 'H');
    
    console.log('Network: A-B-C-D with branches E, F, G, H');
    console.log('Edge B-C should have highest betweenness (on many shortest paths)');
    
    const dendrogram = girvanNewman(network);
    console.log(`\nRemoval sequence (hierarchical decomposition):`);
    dendrogram.forEach((step, index) => {
        if (index === 0) {
            console.log(`Step ${index + 1}: Initial state - ${step.communities.length} community`);
        } else {
            console.log(`Step ${index + 1}: ${step.communities.length} communities, Modularity: ${step.modularity.toFixed(4)}`);
        }
    });
    
    console.log('\nNote: The algorithm removes edges in order of decreasing betweenness centrality');
    console.log('');
    return dendrogram;
}

// Test Case 6: Performance Analysis
export function performanceAnalysis() {
    console.log('6. Performance Analysis:');
    
    // Test with different network sizes
    const sizes = [8, 12, 16, 20];
    
    sizes.forEach(size => {
        console.log(`\nTesting with ${size} nodes:`);
        
        // Create a random network with community structure
        const network = createCommunityNetwork(size);
        
        // Time the algorithm
        const start = performance.now();
        const dendrogram = girvanNewman(network);
        const time = performance.now() - start;
        
        // Find best partition
        let bestModularity = -1;
        let bestCommunities = 1;
        dendrogram.forEach(partition => {
            if (partition.modularity > bestModularity) {
                bestModularity = partition.modularity;
                bestCommunities = partition.communities.length;
            }
        });
        
        console.log(`  Time taken: ${time.toFixed(2)}ms`);
        console.log(`  Dendrogram steps: ${dendrogram.length}`);
        console.log(`  Best modularity: ${bestModularity.toFixed(4)}`);
        console.log(`  Best communities: ${bestCommunities}`);
    });
    
    console.log('\nComplexity: O(m^2 n) for m edges and n nodes due to betweenness calculations');
}

// Test Case 7: Algorithm Limitations
export function testAlgorithmLimitations() {
    console.log('\n7. Algorithm Limitations:');
    
    // Create a network where Girvan-Newman might not find optimal communities
    const network = new Graph();
    
    // Create a "ring of cliques" - challenging for Girvan-Newman
    // Three small cliques connected in a ring
    // Clique 1
    network.addEdge('A1', 'A2');
    network.addEdge('A2', 'A3');
    network.addEdge('A3', 'A1');
    
    // Clique 2
    network.addEdge('B1', 'B2');
    network.addEdge('B2', 'B3');
    network.addEdge('B3', 'B1');
    
    // Clique 3
    network.addEdge('C1', 'C2');
    network.addEdge('C2', 'C3');
    network.addEdge('C3', 'C1');
    
    // Ring connections
    network.addEdge('A1', 'B1');
    network.addEdge('B1', 'C1');
    network.addEdge('C1', 'A1');
    
    console.log('Testing "ring of cliques" network:');
    console.log('Three triangular cliques connected in a ring - challenging structure');
    
    const dendrogram = girvanNewman(network);
    
    let bestPartition = dendrogram[0];
    let bestModularity = dendrogram[0].modularity;
    for (const partition of dendrogram) {
        if (partition.modularity > bestModularity) {
            bestModularity = partition.modularity;
            bestPartition = partition;
        }
    }
    
    console.log(`\nBest result: ${bestPartition.communities.length} communities`);
    console.log(`Modularity: ${bestModularity.toFixed(4)}`);
    bestPartition.communities.forEach((community, index) => {
        console.log(`Community ${index + 1}: [${community.sort().join(', ')}]`);
    });
    
    console.log('\nLimitation: Girvan-Newman uses only topological information');
    console.log('For weighted graphs or when node attributes matter, other methods may be better');
    console.log('');
    
    return { dendrogram, bestPartition };
}

// Utility function to create a network with community structure
function createCommunityNetwork(totalNodes) {
    const network = new Graph();
    const communitySize = Math.floor(totalNodes / 2);
    
    // Community 1
    const community1 = [];
    for (let i = 0; i < communitySize; i++) {
        const nodeId = `C1_${i}`;
        community1.push(nodeId);
        network.addNode(nodeId);
    }
    
    // Densely connect community 1
    for (let i = 0; i < community1.length; i++) {
        for (let j = i + 1; j < community1.length; j++) {
            if (Math.random() < 0.7) {  // 70% connection probability
                network.addEdge(community1[i], community1[j]);
            }
        }
    }
    
    // Community 2
    const community2 = [];
    for (let i = communitySize; i < totalNodes; i++) {
        const nodeId = `C2_${i - communitySize}`;
        community2.push(nodeId);
        network.addNode(nodeId);
    }
    
    // Densely connect community 2
    for (let i = 0; i < community2.length; i++) {
        for (let j = i + 1; j < community2.length; j++) {
            if (Math.random() < 0.7) {  // 70% connection probability
                network.addEdge(community2[i], community2[j]);
            }
        }
    }
    
    // Sparse connections between communities
    for (let i = 0; i < Math.min(3, community1.length, community2.length); i++) {
        if (Math.random() < 0.3) {  // 30% connection probability
            const node1 = community1[Math.floor(Math.random() * community1.length)];
            const node2 = community2[Math.floor(Math.random() * community2.length)];
            network.addEdge(node1, node2);
        }
    }
    
    return network;
}

// Educational examples showing real-world applications
export function educationalExamples() {
    console.log('\n=== Educational Applications ===');
    
    console.log('\n1. Social Network Analysis:');
    console.log('   - Finding friend groups in social media networks');
    console.log('   - Identifying organizational departments in collaboration networks');
    console.log('   - Detecting polarized communities in political discussions');
    
    console.log('\n2. Biological Networks:');
    console.log('   - Finding functional modules in protein interaction networks');
    console.log('   - Identifying disease-related gene clusters');
    console.log('   - Analyzing metabolic pathway organization');
    
    console.log('\n3. Information Networks:');
    console.log('   - Clustering web pages by topic similarity');
    console.log('   - Finding research communities in citation networks');
    console.log('   - Organizing scientific literature by field');
    
    console.log('\n4. Infrastructure Networks:');
    console.log('   - Identifying critical bridges in transportation networks');
    console.log('   - Finding vulnerable connections in power grids');
    console.log('   - Analyzing communication network resilience');
    
    console.log('\n5. Economic Networks:');
    console.log('   - Detecting market sectors in stock correlation networks');
    console.log('   - Finding trading communities in financial markets');
    console.log('   - Analyzing supply chain clusters');
}

// Main demonstration function
export function runGirvanNewman() {
    testBasicCommunityDetection();
    testSocialNetworkAnalysis();
    testKarateClubExample();
    testAlgorithmParameters();
    testEdgeBetweennessAnalysis();
    performanceAnalysis();
    testAlgorithmLimitations();
    educationalExamples();
    
    console.log('\n=== Summary ===');
    console.log('The Girvan-Newman algorithm is a divisive hierarchical method for community detection.');
    console.log('Key features:');
    console.log('• Removes edges with highest betweenness centrality iteratively');
    console.log('• Produces a dendrogram showing hierarchical community structure');
    console.log('• Works well for networks with clear community boundaries');
    console.log('• Best partition is typically the one with highest modularity');
    console.log('• Time complexity: O(m²n) - can be slow for large networks');
}