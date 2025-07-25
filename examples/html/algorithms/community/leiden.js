import { leiden } from './algorithms.js';

// Comprehensive Leiden Community Detection demonstrations
console.log('=== Leiden Community Detection Comprehensive Analysis ===\n');

// Test Case 1: Social Network Communities
export function testSocialNetworkCommunities() {
    console.log('1. Social Network Communities:');
    
    // Create a social network with clear community structure
    const socialNetwork = new Map([
        // High school friends cluster
        ['Alice', new Map([['Bob', 1], ['Charlie', 1], ['Diana', 1], ['Eve', 1]])],
        ['Bob', new Map([['Alice', 1], ['Charlie', 1], ['Diana', 1]])],
        ['Charlie', new Map([['Alice', 1], ['Bob', 1], ['Diana', 1]])],
        ['Diana', new Map([['Alice', 1], ['Bob', 1], ['Charlie', 1], ['Eve', 1]])],
        ['Eve', new Map([['Alice', 1], ['Diana', 1], ['Frank', 1]])], // Bridge to work cluster
        
        // Work colleagues cluster
        ['Frank', new Map([['Eve', 1], ['George', 1], ['Helen', 1], ['Ivan', 1], ['Julia', 1]])],
        ['George', new Map([['Frank', 1], ['Helen', 1], ['Ivan', 1], ['Julia', 1]])],
        ['Helen', new Map([['Frank', 1], ['George', 1], ['Ivan', 1], ['Julia', 1]])],
        ['Ivan', new Map([['Frank', 1], ['George', 1], ['Helen', 1], ['Julia', 1]])],
        ['Julia', new Map([['Frank', 1], ['George', 1], ['Helen', 1], ['Ivan', 1], ['Kevin', 1]])], // Bridge to hobby cluster
        
        // Hobby group cluster
        ['Kevin', new Map([['Julia', 1], ['Laura', 1], ['Mike', 1], ['Nancy', 1]])],
        ['Laura', new Map([['Kevin', 1], ['Mike', 1], ['Nancy', 1], ['Oscar', 1]])],
        ['Mike', new Map([['Kevin', 1], ['Laura', 1], ['Nancy', 1], ['Oscar', 1]])],
        ['Nancy', new Map([['Kevin', 1], ['Laura', 1], ['Mike', 1], ['Oscar', 1]])],
        ['Oscar', new Map([['Laura', 1], ['Mike', 1], ['Nancy', 1]])]
    ]);
    
    const socialResult = leiden(socialNetwork, { 
        resolution: 1.0,
        randomSeed: 42
    });
    
    // Convert communities map to arrays
    const socialCommunities = new Map();
    for (const [node, communityId] of socialResult.communities) {
        if (!socialCommunities.has(communityId)) {
            socialCommunities.set(communityId, []);
        }
        socialCommunities.get(communityId).push(node);
    }
    const socialCommArray = Array.from(socialCommunities.values());
    
    console.log(`Found ${socialCommArray.length} communities`);
    console.log(`Modularity: ${socialResult.modularity.toFixed(3)}`);
    console.log(`Converged in ${socialResult.iterations} iterations\n`);
    
    socialCommArray.forEach((community, index) => {
        console.log(`Community ${index + 1}: ${community.join(', ')}`);
    });
    
    console.log('');
    return { socialResult, socialCommArray };
}

// Test Case 2: Scientific Collaboration Network
export function testScientificCollaboration() {
    console.log('2. Scientific Collaboration Network:');
    
    const collaborationNetwork = new Map([
        // Machine Learning researchers
        ['Prof_ML1', new Map([['PhD_ML1', 1], ['PhD_ML2', 1], ['PostDoc_ML', 1], ['Prof_ML2', 1]])],
        ['Prof_ML2', new Map([['Prof_ML1', 1], ['PhD_ML2', 1], ['PhD_ML3', 1], ['PostDoc_ML', 1]])],
        ['PhD_ML1', new Map([['Prof_ML1', 1], ['PhD_ML2', 1], ['PostDoc_ML', 1]])],
        ['PhD_ML2', new Map([['Prof_ML1', 1], ['Prof_ML2', 1], ['PhD_ML1', 1], ['PhD_ML3', 1]])],
        ['PhD_ML3', new Map([['Prof_ML2', 1], ['PhD_ML2', 1], ['PostDoc_ML', 1]])],
        ['PostDoc_ML', new Map([['Prof_ML1', 1], ['Prof_ML2', 1], ['PhD_ML1', 1], ['PhD_ML3', 1], ['Prof_Bio1', 1]])], // Interdisciplinary
        
        // Bioinformatics researchers
        ['Prof_Bio1', new Map([['PostDoc_ML', 1], ['PhD_Bio1', 1], ['PhD_Bio2', 1], ['PostDoc_Bio', 1]])],
        ['Prof_Bio2', new Map([['PhD_Bio1', 1], ['PhD_Bio2', 1], ['PhD_Bio3', 1], ['PostDoc_Bio', 1]])],
        ['PhD_Bio1', new Map([['Prof_Bio1', 1], ['Prof_Bio2', 1], ['PhD_Bio2', 1]])],
        ['PhD_Bio2', new Map([['Prof_Bio1', 1], ['Prof_Bio2', 1], ['PhD_Bio1', 1], ['PhD_Bio3', 1]])],
        ['PhD_Bio3', new Map([['Prof_Bio2', 1], ['PhD_Bio2', 1], ['PostDoc_Bio', 1]])],
        ['PostDoc_Bio', new Map([['Prof_Bio1', 1], ['Prof_Bio2', 1], ['PhD_Bio3', 1]])],
        
        // Theoretical CS researchers
        ['Prof_Theory1', new Map([['PhD_Theory1', 1], ['PhD_Theory2', 1], ['PostDoc_Theory', 1]])],
        ['Prof_Theory2', new Map([['PhD_Theory2', 1], ['PhD_Theory3', 1], ['PostDoc_Theory', 1]])],
        ['PhD_Theory1', new Map([['Prof_Theory1', 1], ['PhD_Theory2', 1]])],
        ['PhD_Theory2', new Map([['Prof_Theory1', 1], ['Prof_Theory2', 1], ['PhD_Theory1', 1], ['PhD_Theory3', 1]])],
        ['PhD_Theory3', new Map([['Prof_Theory2', 1], ['PhD_Theory2', 1], ['PostDoc_Theory', 1]])],
        ['PostDoc_Theory', new Map([['Prof_Theory1', 1], ['Prof_Theory2', 1], ['PhD_Theory3', 1]])]
    ]);
    
    const collabResult = leiden(collaborationNetwork, {
        resolution: 1.2, // Slightly higher resolution for finer communities
        maxIterations: 50
    });
    
    // Convert Map to community arrays
    const collabCommunities = new Map();
    for (const [node, communityId] of collabResult.communities) {
        if (!collabCommunities.has(communityId)) {
            collabCommunities.set(communityId, []);
        }
        collabCommunities.get(communityId).push(node);
    }
    const collabCommArray = Array.from(collabCommunities.values());
    
    console.log(`Found ${collabCommArray.length} research groups`);
    console.log(`Modularity: ${collabResult.modularity.toFixed(3)}\n`);
    
    collabCommArray.forEach((community, index) => {
        console.log(`Research Group ${index + 1}:`);
        console.log(`  Members: ${community.join(', ')}`);
        console.log(`  Size: ${community.length} researchers`);
    });
    
    console.log('');
    return { collabResult, collabCommArray };
}

// Test Case 3: E-commerce Product Co-purchase Network
export function testProductCoPurchaseNetwork() {
    console.log('3. E-commerce Product Co-purchase Network:');
    
    const purchaseNetwork = new Map([
        // Electronics cluster
        ['Laptop', new Map([['Mouse', 1], ['Keyboard', 1], ['Monitor', 1], ['USB_Hub', 1], ['Webcam', 1]])],
        ['Mouse', new Map([['Laptop', 1], ['Keyboard', 1], ['Mouse_Pad', 1]])],
        ['Keyboard', new Map([['Laptop', 1], ['Mouse', 1], ['Wrist_Rest', 1]])],
        ['Monitor', new Map([['Laptop', 1], ['HDMI_Cable', 1], ['Monitor_Stand', 1]])],
        ['USB_Hub', new Map([['Laptop', 1], ['External_HDD', 1]])],
        ['Webcam', new Map([['Laptop', 1], ['Microphone', 1]])],
        ['Mouse_Pad', new Map([['Mouse', 1], ['Keyboard', 1]])],
        ['Wrist_Rest', new Map([['Keyboard', 1], ['Mouse_Pad', 1]])],
        ['HDMI_Cable', new Map([['Monitor', 1], ['Laptop', 1]])],
        ['Monitor_Stand', new Map([['Monitor', 1], ['Desk_Lamp', 1]])],
        ['External_HDD', new Map([['USB_Hub', 1], ['Laptop', 1]])],
        ['Microphone', new Map([['Webcam', 1], ['Pop_Filter', 1]])],
        ['Pop_Filter', new Map([['Microphone', 1]])],
        
        // Office supplies cluster
        ['Desk_Lamp', new Map([['Monitor_Stand', 1], ['Desk_Organizer', 1], ['Notebook', 1]])],
        ['Desk_Organizer', new Map([['Desk_Lamp', 1], ['Pens', 1], ['Stapler', 1]])],
        ['Notebook', new Map([['Desk_Lamp', 1], ['Pens', 1], ['Highlighters', 1]])],
        ['Pens', new Map([['Desk_Organizer', 1], ['Notebook', 1], ['Highlighters', 1]])],
        ['Highlighters', new Map([['Notebook', 1], ['Pens', 1], ['Sticky_Notes', 1]])],
        ['Sticky_Notes', new Map([['Highlighters', 1], ['Pens', 1]])],
        ['Stapler', new Map([['Desk_Organizer', 1], ['Paper_Clips', 1]])],
        ['Paper_Clips', new Map([['Stapler', 1], ['Binder_Clips', 1]])],
        ['Binder_Clips', new Map([['Paper_Clips', 1]])],
        
        // Fitness cluster
        ['Yoga_Mat', new Map([['Resistance_Bands', 1], ['Water_Bottle', 1], ['Foam_Roller', 1]])],
        ['Resistance_Bands', new Map([['Yoga_Mat', 1], ['Dumbbells', 1], ['Exercise_Guide', 1]])],
        ['Water_Bottle', new Map([['Yoga_Mat', 1], ['Protein_Shaker', 1], ['Gym_Bag', 1]])],
        ['Foam_Roller', new Map([['Yoga_Mat', 1], ['Massage_Ball', 1]])],
        ['Dumbbells', new Map([['Resistance_Bands', 1], ['Weight_Bench', 1], ['Exercise_Guide', 1]])],
        ['Exercise_Guide', new Map([['Resistance_Bands', 1], ['Dumbbells', 1]])],
        ['Protein_Shaker', new Map([['Water_Bottle', 1], ['Protein_Powder', 1]])],
        ['Gym_Bag', new Map([['Water_Bottle', 1], ['Gym_Towel', 1]])],
        ['Massage_Ball', new Map([['Foam_Roller', 1]])],
        ['Weight_Bench', new Map([['Dumbbells', 1]])],
        ['Protein_Powder', new Map([['Protein_Shaker', 1]])],
        ['Gym_Towel', new Map([['Gym_Bag', 1]])]
    ]);
    
    // Run with different resolutions to see hierarchical structure
    console.log('Testing different resolution parameters:\n');
    
    const resolutionResults = [];
    for (const resolution of [0.5, 1.0, 1.5]) {
        const result = leiden(purchaseNetwork, { 
            resolution,
            randomSeed: 42
        });
        
        // Convert Map to community arrays
        const resCommunities = new Map();
        for (const [node, communityId] of result.communities) {
            if (!resCommunities.has(communityId)) {
                resCommunities.set(communityId, []);
            }
            resCommunities.get(communityId).push(node);
        }
        const resCommArray = Array.from(resCommunities.values());
        
        console.log(`Resolution ${resolution}:`);
        console.log(`  Communities: ${resCommArray.length}`);
        console.log(`  Modularity: ${result.modularity.toFixed(3)}`);
        
        if (resolution === 1.0) {
            console.log('\n  Detected product categories:');
            resCommArray.forEach((community, index) => {
                console.log(`    Category ${index + 1}: ${community.slice(0, 5).join(', ')}${community.length > 5 ? '...' : ''}`);
            });
        }
        console.log();
        
        resolutionResults.push({ resolution, result, communities: resCommArray });
    }
    
    return resolutionResults;
}

// Test Case 4: Protein Interaction Network
export function testProteinInteractionNetwork() {
    console.log('4. Protein Interaction Network:');
    
    const proteinNetwork = new Map([
        // DNA repair module
        ['BRCA1', new Map([['BRCA2', 1], ['RAD51', 1], ['PALB2', 1], ['BARD1', 1]])],
        ['BRCA2', new Map([['BRCA1', 1], ['RAD51', 1], ['PALB2', 1], ['DSS1', 1]])],
        ['RAD51', new Map([['BRCA1', 1], ['BRCA2', 1], ['RAD52', 1], ['XRCC3', 1]])],
        ['PALB2', new Map([['BRCA1', 1], ['BRCA2', 1], ['RAD51', 1]])],
        ['BARD1', new Map([['BRCA1', 1], ['RAD51', 1]])],
        ['DSS1', new Map([['BRCA2', 1], ['RAD52', 1]])],
        ['RAD52', new Map([['RAD51', 1], ['DSS1', 1], ['XRCC3', 1]])],
        ['XRCC3', new Map([['RAD51', 1], ['RAD52', 1]])],
        
        // Cell cycle regulation module
        ['CDK1', new Map([['CCNB1', 1], ['CDK2', 1], ['WEE1', 1], ['CDC25', 1]])],
        ['CCNB1', new Map([['CDK1', 1], ['CCNA2', 1], ['APC', 1]])],
        ['CDK2', new Map([['CDK1', 1], ['CCNA2', 1], ['CCNE1', 1], ['p21', 1]])],
        ['CCNA2', new Map([['CCNB1', 1], ['CDK2', 1], ['CCNE1', 1]])],
        ['CCNE1', new Map([['CDK2', 1], ['CCNA2', 1], ['p27', 1]])],
        ['WEE1', new Map([['CDK1', 1], ['CHK1', 1]])],
        ['CDC25', new Map([['CDK1', 1], ['CHK1', 1]])],
        ['CHK1', new Map([['WEE1', 1], ['CDC25', 1], ['ATR', 1]])],
        ['p21', new Map([['CDK2', 1], ['p53', 1]])],
        ['p27', new Map([['CCNE1', 1], ['SKP2', 1]])],
        ['APC', new Map([['CCNB1', 1], ['CDC20', 1]])],
        ['CDC20', new Map([['APC', 1]])],
        ['SKP2', new Map([['p27', 1]])],
        
        // Cross-talk between modules
        ['p53', new Map([['p21', 1], ['BRCA1', 1], ['ATR', 1]])],
        ['ATR', new Map([['CHK1', 1], ['p53', 1], ['BRCA1', 1]])]
    ]);
    
    const proteinResult = leiden(proteinNetwork, {
        resolution: 1.0,
        randomSeed: 42
    });
    
    // Convert Map to community arrays
    const proteinCommunities = new Map();
    for (const [node, communityId] of proteinResult.communities) {
        if (!proteinCommunities.has(communityId)) {
            proteinCommunities.set(communityId, []);
        }
        proteinCommunities.get(communityId).push(node);
    }
    const proteinCommArray = Array.from(proteinCommunities.values());
    
    console.log(`Found ${proteinCommArray.length} functional modules`);
    console.log(`Modularity: ${proteinResult.modularity.toFixed(3)}\n`);
    
    proteinCommArray.forEach((community, index) => {
        console.log(`Functional Module ${index + 1}:`);
        console.log(`  Proteins: ${community.join(', ')}`);
        
        // Identify module function based on known proteins
        if (community.includes('BRCA1') || community.includes('RAD51')) {
            console.log('  Likely function: DNA damage repair');
        } else if (community.includes('CDK1') || community.includes('CCNB1')) {
            console.log('  Likely function: Cell cycle regulation');
        }
        console.log();
    });
    
    return { proteinResult, proteinCommArray };
}

// Test Case 5: Parameter Sensitivity Analysis
export function testParameterSensitivity() {
    console.log('5. Parameter Sensitivity Analysis:');
    
    // Create a test network with known community structure
    const testNetwork = new Map([
        // Community 1
        ['A1', new Map([['A2', 1], ['A3', 1], ['A4', 1]])],
        ['A2', new Map([['A1', 1], ['A3', 1], ['A4', 1]])],
        ['A3', new Map([['A1', 1], ['A2', 1], ['A4', 1]])],
        ['A4', new Map([['A1', 1], ['A2', 1], ['A3', 1], ['B1', 1]])], // Bridge
        
        // Community 2
        ['B1', new Map([['A4', 1], ['B2', 1], ['B3', 1], ['B4', 1]])],
        ['B2', new Map([['B1', 1], ['B3', 1], ['B4', 1]])],
        ['B3', new Map([['B1', 1], ['B2', 1], ['B4', 1]])],
        ['B4', new Map([['B1', 1], ['B2', 1], ['B3', 1], ['C1', 1]])], // Bridge
        
        // Community 3
        ['C1', new Map([['B4', 1], ['C2', 1], ['C3', 1]])],
        ['C2', new Map([['C1', 1], ['C3', 1]])],
        ['C3', new Map([['C1', 1], ['C2', 1]])]
    ]);
    
    console.log('Testing different parameter combinations:\n');
    
    const parameters = [
        { resolution: 0.5, description: 'Low resolution (larger communities)' },
        { resolution: 1.0, description: 'Default resolution' },
        { resolution: 1.5, description: 'High resolution (smaller communities)' },
        { resolution: 2.0, description: 'Very high resolution' }
    ];
    
    parameters.forEach(param => {
        const result = leiden(testNetwork, {
            resolution: param.resolution,
            maxIterations: 50,
            randomSeed: 42
        });
        
        const communityCount = new Set(result.communities.values()).size;
        
        console.log(`${param.description}:`);
        console.log(`  Resolution: ${param.resolution}`);
        console.log(`  Communities found: ${communityCount}`);
        console.log(`  Modularity: ${result.modularity.toFixed(3)}`);
        console.log(`  Iterations: ${result.iterations}`);
        console.log('');
    });
    
    return parameters.map(param => ({
        ...param,
        result: leiden(testNetwork, { resolution: param.resolution, randomSeed: 42 })
    }));
}

// Test Case 6: Comparison with Random Networks
export function testRandomNetworkComparison() {
    console.log('6. Random Network Comparison:');
    
    // Create random network (should have low modularity)
    const randomNetwork = new Map();
    const nodes = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10'];
    
    // Initialize nodes
    nodes.forEach(node => randomNetwork.set(node, new Map()));
    
    // Add random edges
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() < 0.3) { // 30% connection probability
                randomNetwork.get(nodes[i]).set(nodes[j], 1);
                randomNetwork.get(nodes[j]).set(nodes[i], 1);
            }
        }
    }
    
    // Create structured network (should have high modularity)
    const structuredNetwork = new Map([
        // Tight cluster 1
        ['S1', new Map([['S2', 1], ['S3', 1], ['S4', 1]])],
        ['S2', new Map([['S1', 1], ['S3', 1], ['S4', 1]])],
        ['S3', new Map([['S1', 1], ['S2', 1], ['S4', 1]])],
        ['S4', new Map([['S1', 1], ['S2', 1], ['S3', 1], ['S6', 1]])], // Bridge
        
        // Tight cluster 2
        ['S5', new Map([['S6', 1], ['S7', 1], ['S8', 1]])],
        ['S6', new Map([['S4', 1], ['S5', 1], ['S7', 1], ['S8', 1]])],
        ['S7', new Map([['S5', 1], ['S6', 1], ['S8', 1]])],
        ['S8', new Map([['S5', 1], ['S6', 1], ['S7', 1]])]
    ]);
    
    console.log('Comparing random vs. structured networks:\n');
    
    const randomResult = leiden(randomNetwork, { resolution: 1.0, randomSeed: 42 });
    const structuredResult = leiden(structuredNetwork, { resolution: 1.0, randomSeed: 42 });
    
    const randomCommunities = new Set(randomResult.communities.values()).size;
    const structuredCommunities = new Set(structuredResult.communities.values()).size;
    
    console.log('Random Network:');
    console.log(`  Communities: ${randomCommunities}`);
    console.log(`  Modularity: ${randomResult.modularity.toFixed(3)}`);
    console.log(`  Quality: ${randomResult.modularity > 0.3 ? 'Good' : 'Poor'} community structure\n`);
    
    console.log('Structured Network:');
    console.log(`  Communities: ${structuredCommunities}`);
    console.log(`  Modularity: ${structuredResult.modularity.toFixed(3)}`);
    console.log(`  Quality: ${structuredResult.modularity > 0.3 ? 'Good' : 'Poor'} community structure\n`);
    
    console.log('Analysis:');
    console.log(`Structured network shows ${structuredResult.modularity > randomResult.modularity ? 'better' : 'worse'} community structure`);
    console.log(`Modularity difference: ${(structuredResult.modularity - randomResult.modularity).toFixed(3)}`);
    console.log('');
    
    return { randomResult, structuredResult };
}

// Test Case 7: Performance Analysis
export function performanceAnalysis() {
    console.log('7. Performance Analysis:');
    
    console.log('Testing algorithm performance on different network sizes:\n');
    
    const sizes = [10, 20, 30, 50];
    
    sizes.forEach(size => {
        // Create a network with community structure
        const network = createCommunityNetwork(size);
        
        const start = performance.now();
        const result = leiden(network, { resolution: 1.0, randomSeed: 42 });
        const time = performance.now() - start;
        
        const communityCount = new Set(result.communities.values()).size;
        
        console.log(`Network size: ${size} nodes`);
        console.log(`  Communities found: ${communityCount}`);
        console.log(`  Modularity: ${result.modularity.toFixed(3)}`);
        console.log(`  Iterations: ${result.iterations}`);
        console.log(`  Time taken: ${time.toFixed(2)}ms`);
        console.log('');
    });
    
    console.log('Note: Leiden typically converges quickly due to its efficient refinement phase');
}

// Utility function to create a network with community structure
function createCommunityNetwork(size) {
    const network = new Map();
    const communitySize = Math.floor(size / 2);
    
    // Community 1
    const community1 = [];
    for (let i = 0; i < communitySize; i++) {
        const nodeId = `C1_${i}`;
        community1.push(nodeId);
        network.set(nodeId, new Map());
    }
    
    // Densely connect community 1
    for (let i = 0; i < community1.length; i++) {
        for (let j = i + 1; j < community1.length; j++) {
            if (Math.random() < 0.8) {  // 80% connection probability
                network.get(community1[i]).set(community1[j], 1);
                network.get(community1[j]).set(community1[i], 1);
            }
        }
    }
    
    // Community 2
    const community2 = [];
    for (let i = communitySize; i < size; i++) {
        const nodeId = `C2_${i - communitySize}`;
        community2.push(nodeId);
        network.set(nodeId, new Map());
    }
    
    // Densely connect community 2
    for (let i = 0; i < community2.length; i++) {
        for (let j = i + 1; j < community2.length; j++) {
            if (Math.random() < 0.8) {  // 80% connection probability
                network.get(community2[i]).set(community2[j], 1);
                network.get(community2[j]).set(community2[i], 1);
            }
        }
    }
    
    // Sparse connections between communities
    for (let i = 0; i < Math.min(2, community1.length, community2.length); i++) {
        if (Math.random() < 0.2) {  // 20% connection probability
            const node1 = community1[Math.floor(Math.random() * community1.length)];
            const node2 = community2[Math.floor(Math.random() * community2.length)];
            network.get(node1).set(node2, 1);
            network.get(node2).set(node1, 1);
        }
    }
    
    return network;
}

// Educational examples showing real-world applications
export function educationalExamples() {
    console.log('\n=== Educational Applications ===');
    
    console.log('\n1. Social Media Analysis:');
    console.log('   - Detecting friend groups and social circles');
    console.log('   - Identifying influencer communities');
    console.log('   - Finding echo chambers in political discussions');
    
    console.log('\n2. Biological Systems:');
    console.log('   - Protein functional modules in interaction networks');
    console.log('   - Gene regulatory network communities');
    console.log('   - Metabolic pathway clustering');
    
    console.log('\n3. Market Research:');
    console.log('   - Customer segmentation based on purchase behavior');
    console.log('   - Product recommendation systems');
    console.log('   - Brand affinity groups');
    
    console.log('\n4. Scientific Literature:');
    console.log('   - Research field identification in citation networks');
    console.log('   - Collaboration patterns among scientists');
    console.log('   - Topic clustering in academic papers');
    
    console.log('\n5. Transportation Networks:');
    console.log('   - Traffic flow communities in road networks');
    console.log('   - Public transit system optimization');
    console.log('   - Supply chain cluster analysis');
}

// Main demonstration function
export function runLeiden() {
    testSocialNetworkCommunities();
    testScientificCollaboration();
    testProductCoPurchaseNetwork();
    testProteinInteractionNetwork();
    testParameterSensitivity();
    testRandomNetworkComparison();
    performanceAnalysis();
    educationalExamples();
    
    console.log('\n=== Summary ===');
    console.log('The Leiden algorithm improves upon Louvain by:');
    console.log('• Guaranteeing well-connected communities through refinement');
    console.log('• Providing better quality partitions with higher modularity');
    console.log('• Being more stable across different runs');
    console.log('• Having excellent scalability for large networks');
    console.log('\nKey parameters:');
    console.log('• Resolution: Controls community size (higher = smaller communities)');
    console.log('• Quality: Measured by modularity (higher = better community structure)');
    console.log('• Applications: Social networks, biological systems, recommendation engines');
}