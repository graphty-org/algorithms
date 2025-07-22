/**
 * Leiden Community Detection Example
 * 
 * This example demonstrates the Leiden algorithm for community detection,
 * which is an improved version of the Louvain algorithm that guarantees
 * well-connected communities.
 * 
 * Applications include:
 * - Social network analysis
 * - Biological network clustering
 * - Recommendation systems
 * - Document clustering
 */

import { leiden } from '../src/algorithms/community/leiden';

console.log('=== Leiden Community Detection Examples ===\n');

// Example 1: Social Network Communities
console.log('Example 1: Social Media Friend Network');
console.log('Detecting friend groups in a social network\n');

// Create a social network with clear community structure
const socialNetworkSets = new Map<string, Set<string>>([
    // High school friends cluster
    ['Alice', new Set(['Bob', 'Charlie', 'Diana', 'Eve'])],
    ['Bob', new Set(['Alice', 'Charlie', 'Diana'])],
    ['Charlie', new Set(['Alice', 'Bob', 'Diana'])],
    ['Diana', new Set(['Alice', 'Bob', 'Charlie', 'Eve'])],
    ['Eve', new Set(['Alice', 'Diana', 'Frank'])], // Bridge to work cluster
    
    // Work colleagues cluster
    ['Frank', new Set(['Eve', 'George', 'Helen', 'Ivan', 'Julia'])],
    ['George', new Set(['Frank', 'Helen', 'Ivan', 'Julia'])],
    ['Helen', new Set(['Frank', 'George', 'Ivan', 'Julia'])],
    ['Ivan', new Set(['Frank', 'George', 'Helen', 'Julia'])],
    ['Julia', new Set(['Frank', 'George', 'Helen', 'Ivan', 'Kevin'])], // Bridge to hobby cluster
    
    // Hobby group cluster
    ['Kevin', new Set(['Julia', 'Laura', 'Mike', 'Nancy'])],
    ['Laura', new Set(['Kevin', 'Mike', 'Nancy', 'Oscar'])],
    ['Mike', new Set(['Kevin', 'Laura', 'Nancy', 'Oscar'])],
    ['Nancy', new Set(['Kevin', 'Laura', 'Mike', 'Oscar'])],
    ['Oscar', new Set(['Laura', 'Mike', 'Nancy'])]
]);

// Convert to weighted graph format
const socialNetwork = new Map<string, Map<string, number>>();
for (const [node, neighbors] of socialNetworkSets) {
    const nodeNeighbors = new Map<string, number>();
    for (const neighbor of neighbors) {
        nodeNeighbors.set(neighbor, 1); // Unit weight
    }
    socialNetwork.set(node, nodeNeighbors);
}

const socialResult = leiden(socialNetwork, { 
    resolution: 1.0,
    randomSeed: 42
});

// Convert Map to community arrays
const socialCommunities = new Map<number, string[]>();
for (const [node, communityId] of socialResult.communities) {
    if (!socialCommunities.has(communityId)) {
        socialCommunities.set(communityId, []);
    }
    socialCommunities.get(communityId)!.push(node);
}
const socialCommArray = Array.from(socialCommunities.values());

console.log(`Found ${socialCommArray.length} communities`);
console.log(`Modularity: ${socialResult.modularity.toFixed(3)}`);
console.log(`Converged in ${socialResult.iterations} iterations\n`);

socialCommArray.forEach((community, index) => {
    console.log(`Community ${index + 1}: ${community.join(', ')}`);
});

// Example 2: Scientific Collaboration Network
console.log('\n\nExample 2: Scientific Collaboration Network');
console.log('Finding research groups based on paper co-authorship\n');

const collaborationNetworkSets = new Map<string, Set<string>>([
    // Machine Learning researchers
    ['Prof_ML1', new Set(['PhD_ML1', 'PhD_ML2', 'PostDoc_ML', 'Prof_ML2'])],
    ['Prof_ML2', new Set(['Prof_ML1', 'PhD_ML2', 'PhD_ML3', 'PostDoc_ML'])],
    ['PhD_ML1', new Set(['Prof_ML1', 'PhD_ML2', 'PostDoc_ML'])],
    ['PhD_ML2', new Set(['Prof_ML1', 'Prof_ML2', 'PhD_ML1', 'PhD_ML3'])],
    ['PhD_ML3', new Set(['Prof_ML2', 'PhD_ML2', 'PostDoc_ML'])],
    ['PostDoc_ML', new Set(['Prof_ML1', 'Prof_ML2', 'PhD_ML1', 'PhD_ML3', 'Prof_Bio1'])], // Interdisciplinary
    
    // Bioinformatics researchers
    ['Prof_Bio1', new Set(['PostDoc_ML', 'PhD_Bio1', 'PhD_Bio2', 'PostDoc_Bio'])],
    ['Prof_Bio2', new Set(['PhD_Bio1', 'PhD_Bio2', 'PhD_Bio3', 'PostDoc_Bio'])],
    ['PhD_Bio1', new Set(['Prof_Bio1', 'Prof_Bio2', 'PhD_Bio2'])],
    ['PhD_Bio2', new Set(['Prof_Bio1', 'Prof_Bio2', 'PhD_Bio1', 'PhD_Bio3'])],
    ['PhD_Bio3', new Set(['Prof_Bio2', 'PhD_Bio2', 'PostDoc_Bio'])],
    ['PostDoc_Bio', new Set(['Prof_Bio1', 'Prof_Bio2', 'PhD_Bio3'])],
    
    // Theoretical CS researchers
    ['Prof_Theory1', new Set(['PhD_Theory1', 'PhD_Theory2', 'PostDoc_Theory'])],
    ['Prof_Theory2', new Set(['PhD_Theory2', 'PhD_Theory3', 'PostDoc_Theory'])],
    ['PhD_Theory1', new Set(['Prof_Theory1', 'PhD_Theory2'])],
    ['PhD_Theory2', new Set(['Prof_Theory1', 'Prof_Theory2', 'PhD_Theory1', 'PhD_Theory3'])],
    ['PhD_Theory3', new Set(['Prof_Theory2', 'PhD_Theory2', 'PostDoc_Theory'])],
    ['PostDoc_Theory', new Set(['Prof_Theory1', 'Prof_Theory2', 'PhD_Theory3'])]
]);

// Convert to weighted graph format
const collaborationNetwork = new Map<string, Map<string, number>>();
for (const [node, neighbors] of collaborationNetworkSets) {
    const nodeNeighbors = new Map<string, number>();
    for (const neighbor of neighbors) {
        nodeNeighbors.set(neighbor, 1); // Unit weight
    }
    collaborationNetwork.set(node, nodeNeighbors);
}

const collabResult = leiden(collaborationNetwork, {
    resolution: 1.2, // Slightly higher resolution for finer communities
    maxIterations: 50
});

// Convert Map to community arrays
const collabCommunities = new Map<number, string[]>();
for (const [node, communityId] of collabResult.communities) {
    if (!collabCommunities.has(communityId)) {
        collabCommunities.set(communityId, []);
    }
    collabCommunities.get(communityId)!.push(node);
}
const collabCommArray = Array.from(collabCommunities.values());

console.log(`Found ${collabCommArray.length} research groups`);
console.log(`Modularity: ${collabResult.modularity.toFixed(3)}\n`);

collabCommArray.forEach((community, index) => {
    console.log(`Research Group ${index + 1}:`);
    console.log(`  Members: ${community.join(', ')}`);
    console.log(`  Size: ${community.length} researchers`);
});

// Example 3: Product Purchase Network
console.log('\n\nExample 3: E-commerce Product Co-purchase Network');
console.log('Finding product categories from purchase patterns\n');

const purchaseNetworkSets = new Map<string, Set<string>>([
    // Electronics cluster
    ['Laptop', new Set(['Mouse', 'Keyboard', 'Monitor', 'USB_Hub', 'Webcam'])],
    ['Mouse', new Set(['Laptop', 'Keyboard', 'Mouse_Pad'])],
    ['Keyboard', new Set(['Laptop', 'Mouse', 'Wrist_Rest'])],
    ['Monitor', new Set(['Laptop', 'HDMI_Cable', 'Monitor_Stand'])],
    ['USB_Hub', new Set(['Laptop', 'External_HDD'])],
    ['Webcam', new Set(['Laptop', 'Microphone'])],
    ['Mouse_Pad', new Set(['Mouse', 'Keyboard'])],
    ['Wrist_Rest', new Set(['Keyboard', 'Mouse_Pad'])],
    ['HDMI_Cable', new Set(['Monitor', 'Laptop'])],
    ['Monitor_Stand', new Set(['Monitor', 'Desk_Lamp'])],
    ['External_HDD', new Set(['USB_Hub', 'Laptop'])],
    ['Microphone', new Set(['Webcam', 'Pop_Filter'])],
    ['Pop_Filter', new Set(['Microphone'])],
    
    // Office supplies cluster
    ['Desk_Lamp', new Set(['Monitor_Stand', 'Desk_Organizer', 'Notebook'])],
    ['Desk_Organizer', new Set(['Desk_Lamp', 'Pens', 'Stapler'])],
    ['Notebook', new Set(['Desk_Lamp', 'Pens', 'Highlighters'])],
    ['Pens', new Set(['Desk_Organizer', 'Notebook', 'Highlighters'])],
    ['Highlighters', new Set(['Notebook', 'Pens', 'Sticky_Notes'])],
    ['Sticky_Notes', new Set(['Highlighters', 'Pens'])],
    ['Stapler', new Set(['Desk_Organizer', 'Paper_Clips'])],
    ['Paper_Clips', new Set(['Stapler', 'Binder_Clips'])],
    ['Binder_Clips', new Set(['Paper_Clips'])],
    
    // Fitness cluster
    ['Yoga_Mat', new Set(['Resistance_Bands', 'Water_Bottle', 'Foam_Roller'])],
    ['Resistance_Bands', new Set(['Yoga_Mat', 'Dumbbells', 'Exercise_Guide'])],
    ['Water_Bottle', new Set(['Yoga_Mat', 'Protein_Shaker', 'Gym_Bag'])],
    ['Foam_Roller', new Set(['Yoga_Mat', 'Massage_Ball'])],
    ['Dumbbells', new Set(['Resistance_Bands', 'Weight_Bench', 'Exercise_Guide'])],
    ['Exercise_Guide', new Set(['Resistance_Bands', 'Dumbbells'])],
    ['Protein_Shaker', new Set(['Water_Bottle', 'Protein_Powder'])],
    ['Gym_Bag', new Set(['Water_Bottle', 'Gym_Towel'])],
    ['Massage_Ball', new Set(['Foam_Roller'])],
    ['Weight_Bench', new Set(['Dumbbells'])],
    ['Protein_Powder', new Set(['Protein_Shaker'])],
    ['Gym_Towel', new Set(['Gym_Bag'])]
]);

// Convert to weighted graph format
const purchaseNetwork = new Map<string, Map<string, number>>();
for (const [node, neighbors] of purchaseNetworkSets) {
    const nodeNeighbors = new Map<string, number>();
    for (const neighbor of neighbors) {
        nodeNeighbors.set(neighbor, 1); // Unit weight
    }
    purchaseNetwork.set(node, nodeNeighbors);
}

// Run with different resolutions to see hierarchical structure
console.log('Testing different resolution parameters:\n');

for (const resolution of [0.5, 1.0, 1.5]) {
    const result = leiden(purchaseNetwork, { 
        resolution,
        randomSeed: 42
    });
    
    // Convert Map to community arrays
    const resCommunities = new Map<number, string[]>();
    for (const [node, communityId] of result.communities) {
        if (!resCommunities.has(communityId)) {
            resCommunities.set(communityId, []);
        }
        resCommunities.get(communityId)!.push(node);
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
}

// Example 4: Protein Interaction Network
console.log('\nExample 4: Protein Interaction Network');
console.log('Identifying functional modules in biological networks\n');

const proteinNetworkSets = new Map<string, Set<string>>([
    // DNA repair module
    ['BRCA1', new Set(['BRCA2', 'RAD51', 'PALB2', 'BARD1'])],
    ['BRCA2', new Set(['BRCA1', 'RAD51', 'PALB2', 'DSS1'])],
    ['RAD51', new Set(['BRCA1', 'BRCA2', 'RAD52', 'XRCC3'])],
    ['PALB2', new Set(['BRCA1', 'BRCA2', 'RAD51'])],
    ['BARD1', new Set(['BRCA1', 'RAD51'])],
    ['DSS1', new Set(['BRCA2', 'RAD52'])],
    ['RAD52', new Set(['RAD51', 'DSS1', 'XRCC3'])],
    ['XRCC3', new Set(['RAD51', 'RAD52'])],
    
    // Cell cycle regulation module
    ['CDK1', new Set(['CCNB1', 'CDK2', 'WEE1', 'CDC25'])],
    ['CCNB1', new Set(['CDK1', 'CCNA2', 'APC'])],
    ['CDK2', new Set(['CDK1', 'CCNA2', 'CCNE1', 'p21'])],
    ['CCNA2', new Set(['CCNB1', 'CDK2', 'CCNE1'])],
    ['CCNE1', new Set(['CDK2', 'CCNA2', 'p27'])],
    ['WEE1', new Set(['CDK1', 'CHK1'])],
    ['CDC25', new Set(['CDK1', 'CHK1'])],
    ['CHK1', new Set(['WEE1', 'CDC25', 'ATR'])],
    ['p21', new Set(['CDK2', 'p53'])],
    ['p27', new Set(['CCNE1', 'SKP2'])],
    ['APC', new Set(['CCNB1', 'CDC20'])],
    ['CDC20', new Set(['APC'])],
    ['SKP2', new Set(['p27'])],
    
    // Cross-talk between modules
    ['p53', new Set(['p21', 'BRCA1', 'ATR'])],
    ['ATR', new Set(['CHK1', 'p53', 'BRCA1'])]
]);

// Convert to weighted graph format
const proteinNetwork = new Map<string, Map<string, number>>();
for (const [node, neighbors] of proteinNetworkSets) {
    const nodeNeighbors = new Map<string, number>();
    for (const neighbor of neighbors) {
        nodeNeighbors.set(neighbor, 1); // Unit weight
    }
    proteinNetwork.set(node, nodeNeighbors);
}

const proteinResult = leiden(proteinNetwork, {
    resolution: 1.0,
    minCommunitySize: 3,
    randomSeed: 42
});

// Convert Map to community arrays
const proteinCommunities = new Map<number, string[]>();
for (const [node, communityId] of proteinResult.communities) {
    if (!proteinCommunities.has(communityId)) {
        proteinCommunities.set(communityId, []);
    }
    proteinCommunities.get(communityId)!.push(node);
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

// Analysis
console.log('=== Analysis ===');
console.log('The Leiden algorithm improves upon Louvain by:');
console.log('1. Guaranteeing well-connected communities');
console.log('2. Providing better quality partitions');
console.log('3. Being more stable across runs');
console.log('\nKey parameters:');
console.log('- Resolution: Controls community size (higher = smaller communities)');
console.log('- Quality: Measured by modularity (higher = better community structure)');
console.log('- Applications: Social networks, biological systems, recommendation engines');