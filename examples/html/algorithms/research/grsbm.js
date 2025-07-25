/**
 * GRSBM (Greedy Recursive Spectral Bisection with Modularity) Algorithm Demonstrations
 * 
 * This file contains comprehensive examples and test cases for the GRSBM algorithm,
 * showcasing its explainable community detection capabilities across various graph structures.
 */

import { grsbm } from './algorithms.js';

/**
 * Test basic GRSBM functionality with a simple network
 */
export function testBasicCommunityDetection() {
    console.log('\n=== GRSBM: Basic Community Detection ===');
    
    // Create a simple graph with clear community structure
    const graph = new Map();
    
    // Community 1: A-B-C (triangle)
    graph.set('A', new Map([['B', 1], ['C', 1]]));
    graph.set('B', new Map([['A', 1], ['C', 1]]));
    graph.set('C', new Map([['A', 1], ['B', 1], ['D', 1]])); // Bridge to community 2
    
    // Community 2: D-E-F (triangle)
    graph.set('D', new Map([['C', 1], ['E', 1], ['F', 1]]));
    graph.set('E', new Map([['D', 1], ['F', 1]]));
    graph.set('F', new Map([['D', 1], ['E', 1]]));
    
    const config = {
        minClusterSize: 2,
        maxDepth: 3,
        seed: 42
    };
    
    const result = grsbm(graph, config);
    
    console.log('Communities found:', result.numClusters);
    console.log('Final clustering:', result.clusters);
    console.log('Modularity progression:', result.modularityScores);
    
    // Display explanations
    result.explanation.forEach((exp, index) => {
        console.log(`\nSplit ${index + 1}:`);
        console.log(`- Cluster: ${exp.clusterId}`);
        console.log(`- Reason: ${exp.reason}`);
        console.log(`- Modularity improvement: ${exp.modularityImprovement.toFixed(4)}`);
        console.log(`- Key nodes: ${exp.keyNodes.join(', ')}`);
    });
    
    return result;
}

/**
 * Test GRSBM on academic collaboration network
 */
export function testAcademicNetwork() {
    console.log('\n=== GRSBM: Academic Collaboration Network ===');
    
    // Create academic network with departments
    const graph = new Map();
    
    // Computer Science Department
    const cs = ['Alice', 'Bob', 'Carol'];
    cs.forEach(person => {
        const connections = new Map();
        cs.forEach(other => {
            if (other !== person) {
                connections.set(other, Math.random() > 0.3 ? 1 : 0);
            }
        });
        graph.set(person, connections);
    });
    
    // Physics Department
    const physics = ['David', 'Eve', 'Frank'];
    physics.forEach(person => {
        const connections = graph.get(person) || new Map();
        physics.forEach(other => {
            if (other !== person) {
                connections.set(other, Math.random() > 0.3 ? 1 : 0);
            }
        });
        graph.set(person, connections);
    });
    
    // Mathematics Department
    const math = ['Grace', 'Henry', 'Iris'];
    math.forEach(person => {
        const connections = graph.get(person) || new Map();
        math.forEach(other => {
            if (other !== person) {
                connections.set(other, Math.random() > 0.3 ? 1 : 0);
            }
        });
        graph.set(person, connections);
    });
    
    // Add interdisciplinary collaborations (weaker connections)
    const addCollaboration = (person1, person2, weight = 1) => {
        if (graph.has(person1) && graph.has(person2)) {
            graph.get(person1).set(person2, weight);
            graph.get(person2).set(person1, weight);
        }
    };
    
    // CS-Physics collaboration
    addCollaboration('Carol', 'David', 1);
    
    // Physics-Math collaboration
    addCollaboration('Frank', 'Grace', 1);
    
    // CS-Math collaboration
    addCollaboration('Bob', 'Henry', 1);
    
    const config = {
        minClusterSize: 2,
        maxDepth: 4,
        seed: 123
    };
    
    const result = grsbm(graph, config);
    
    console.log('Academic departments detected:', result.numClusters);
    console.log('Researcher clustering:', result.clusters);
    console.log('Hierarchical structure depth:', findMaxDepth(result.root));
    
    // Analyze which researchers are in which communities
    const communities = new Map();
    for (const [researcher, communityId] of result.clusters) {
        if (!communities.has(communityId)) {
            communities.set(communityId, []);
        }
        communities.get(communityId).push(researcher);
    }
    
    communities.forEach((members, communityId) => {
        console.log(`Community ${communityId}: ${members.join(', ')}`);
    });
    
    return result;
}

/**
 * Test GRSBM on social network with clear communities
 */
export function testSocialCommunities() {
    console.log('\n=== GRSBM: Social Network Communities ===');
    
    // Create social network with friend groups
    const graph = new Map();
    
    // High school friends (tight-knit group)
    const highSchool = ['Alice', 'Bob', 'Carol', 'Dave'];
    highSchool.forEach(person => {
        const connections = new Map();
        highSchool.forEach(friend => {
            if (friend !== person) {
                connections.set(friend, 1);
            }
        });
        graph.set(person, connections);
    });
    
    // College friends (another tight-knit group)
    const college = ['Eve', 'Frank', 'Grace', 'Henry'];
    college.forEach(person => {
        const connections = graph.get(person) || new Map();
        college.forEach(friend => {
            if (friend !== person) {
                connections.set(friend, 1);
            }
        });
        graph.set(person, connections);
    });
    
    // Work colleagues (third group)
    const work = ['Iris', 'Jack', 'Kate', 'Liam'];
    work.forEach(person => {
        const connections = graph.get(person) || new Map();
        work.forEach(colleague => {
            if (colleague !== person) {
                connections.set(colleague, 1);
            }
        });
        graph.set(person, connections);
    });
    
    // Add bridging connections (people who know each other across groups)
    const addConnection = (person1, person2) => {
        if (graph.has(person1) && graph.has(person2)) {
            graph.get(person1).set(person2, 1);
            graph.get(person2).set(person1, 1);
        }
    };
    
    // Dave (high school) knows Eve (college)
    addConnection('Dave', 'Eve');
    
    // Grace (college) knows Iris (work)
    addConnection('Grace', 'Iris');
    
    const config = {
        minClusterSize: 3,
        maxDepth: 3,
        seed: 456
    };
    
    const result = grsbm(graph, config);
    
    console.log('Social communities found:', result.numClusters);
    console.log('Community assignments:', result.clusters);
    
    // Analyze community quality
    const modularity = result.modularityScores[result.modularityScores.length - 1];
    console.log('Final modularity score:', modularity.toFixed(4));
    
    // Show explanations for community formation
    result.explanation.forEach((exp, index) => {
        console.log(`\nCommunity split ${index + 1}:`);
        console.log(`- Target: ${exp.clusterId}`);
        console.log(`- Reason: ${exp.reason}`);
        console.log(`- Key influencers: ${exp.keyNodes.join(', ')}`);
    });
    
    return result;
}

/**
 * Test GRSBM on protein interaction network
 */
export function testProteinNetwork() {
    console.log('\n=== GRSBM: Protein Interaction Network ===');
    
    // Create protein network with functional modules
    const graph = new Map();
    
    // Metabolic pathway proteins
    const metabolic = ['ATP1', 'ATP2', 'ATP3', 'GLUC1', 'GLUC2'];
    metabolic.forEach(protein => {
        const interactions = new Map();
        metabolic.forEach(other => {
            if (other !== protein && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(protein, interactions);
    });
    
    // Signaling pathway proteins
    const signaling = ['SIG1', 'SIG2', 'SIG3', 'KINASE1', 'KINASE2'];
    signaling.forEach(protein => {
        const interactions = graph.get(protein) || new Map();
        signaling.forEach(other => {
            if (other !== protein && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(protein, interactions);
    });
    
    // DNA repair proteins
    const dnaRepair = ['DNA1', 'DNA2', 'DNA3', 'REPAIR1'];
    dnaRepair.forEach(protein => {
        const interactions = graph.get(protein) || new Map();
        dnaRepair.forEach(other => {
            if (other !== protein && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(protein, interactions);
    });
    
    // Add cross-pathway interactions (regulatory connections)
    const addInteraction = (protein1, protein2) => {
        if (graph.has(protein1) && graph.has(protein2)) {
            graph.get(protein1).set(protein2, 1);
            graph.get(protein2).set(protein1, 1);
        }
    };
    
    // Metabolism regulates signaling
    addInteraction('ATP1', 'SIG1');
    addInteraction('GLUC2', 'KINASE1');
    
    // Signaling affects DNA repair
    addInteraction('SIG3', 'DNA1');
    
    const config = {
        minClusterSize: 2,
        maxDepth: 5,
        numEigenvectors: 3,
        seed: 789
    };
    
    const result = grsbm(graph, config);
    
    console.log('Protein modules identified:', result.numClusters);
    console.log('Module assignments:', result.clusters);
    
    // Analyze functional modules
    const modules = new Map();
    for (const [protein, moduleId] of result.clusters) {
        if (!modules.has(moduleId)) {
            modules.set(moduleId, []);
        }
        modules.get(moduleId).push(protein);
    }
    
    modules.forEach((proteins, moduleId) => {
        console.log(`Module ${moduleId}: ${proteins.join(', ')}`);
    });
    
    // Show spectral analysis insights
    result.explanation.forEach((exp, index) => {
        console.log(`\nModule formation ${index + 1}:`);
        console.log(`- Split cluster: ${exp.clusterId}`);
        console.log(`- Spectral separation quality: ${exp.spectralValues.length} eigenvector components`);
        console.log(`- Key hub proteins: ${exp.keyNodes.join(', ')}`);
    });
    
    return result;
}

/**
 * Test GRSBM on technology company network
 */
export function testTechCompanies() {
    console.log('\n=== GRSBM: Technology Company Ecosystem ===');
    
    // Create tech company collaboration/competition network
    const graph = new Map();
    
    // Big Tech companies
    const bigTech = ['Google', 'Apple', 'Microsoft', 'Amazon'];
    bigTech.forEach(company => {
        const relationships = new Map();
        bigTech.forEach(other => {
            if (other !== company) {
                // Competition but also some partnerships
                relationships.set(other, Math.random() > 0.5 ? 1 : 0);
            }
        });
        graph.set(company, relationships);
    });
    
    // Cloud providers (have partnerships with big tech)
    const cloud = ['AWS', 'Azure', 'GCP', 'Oracle'];
    cloud.forEach(company => {
        const relationships = graph.get(company) || new Map();
        cloud.forEach(other => {
            if (other !== company) {
                relationships.set(other, Math.random() > 0.6 ? 1 : 0);
            }
        });
        graph.set(company, relationships);
    });
    
    // Startups (various partnerships)
    const startups = ['OpenAI', 'Stripe', 'Figma', 'Notion'];
    startups.forEach(company => {
        const relationships = graph.get(company) || new Map();
        startups.forEach(other => {
            if (other !== company && Math.random() > 0.7) {
                relationships.set(other, 1);
            }
        });
        graph.set(company, relationships);
    });
    
    // Add strategic partnerships across categories
    const addPartnership = (company1, company2) => {
        if (graph.has(company1) && graph.has(company2)) {
            graph.get(company1).set(company2, 1);
            graph.get(company2).set(company1, 1);
        }
    };
    
    // Strategic partnerships
    addPartnership('Microsoft', 'OpenAI');
    addPartnership('Google', 'Figma');
    addPartnership('Apple', 'Stripe');
    addPartnership('Amazon', 'AWS');
    
    const config = {
        minClusterSize: 2,
        maxDepth: 4,
        seed: 999
    };
    
    const result = grsbm(graph, config);
    
    console.log('Technology ecosystems identified:', result.numClusters);
    console.log('Company clustering:', result.clusters);
    
    // Analyze technology ecosystems
    const ecosystems = new Map();
    for (const [company, ecosystemId] of result.clusters) {
        if (!ecosystems.has(ecosystemId)) {
            ecosystems.set(ecosystemId, []);
        }
        ecosystems.get(ecosystemId).push(company);
    }
    
    ecosystems.forEach((companies, ecosystemId) => {
        console.log(`Ecosystem ${ecosystemId}: ${companies.join(', ')}`);
    });
    
    // Show strategic insights
    console.log('\nStrategic Insights:');
    result.explanation.forEach((exp, index) => {
        console.log(`\nEcosystem split ${index + 1}:`);
        console.log(`- Analysis of: ${exp.clusterId}`);
        console.log(`- Market segmentation reasoning: ${exp.reason}`);
        console.log(`- Key market players: ${exp.keyNodes.join(', ')}`);
        console.log(`- Market separation strength: ${exp.modularityImprovement.toFixed(4)}`);
    });
    
    return result;
}

/**
 * Comprehensive test of GRSBM configuration parameters
 */
export function testGRSBMParameters() {
    console.log('\n=== GRSBM: Parameter Configuration Testing ===');
    
    // Create a medium-sized test graph
    const graph = new Map();
    
    // Create 4 communities of 4 nodes each
    for (let community = 0; community < 4; community++) {
        const nodes = [];
        for (let i = 0; i < 4; i++) {
            nodes.push(`C${community}N${i}`);
        }
        
        // Dense connections within community
        nodes.forEach(node => {
            const connections = new Map();
            nodes.forEach(other => {
                if (other !== node) {
                    connections.set(other, 1);
                }
            });
            graph.set(node, connections);
        });
        
        // Sparse connections to next community
        if (community < 3) {
            const currentLast = `C${community}N3`;
            const nextFirst = `C${community + 1}N0`;
            graph.get(currentLast).set(nextFirst, 1);
            graph.get(nextFirst).set(currentLast, 1);
        }
    }
    
    // Test different configurations
    const configs = [
        { name: 'Default', config: {} },
        { name: 'Deep hierarchy', config: { maxDepth: 6, minClusterSize: 2 } },
        { name: 'Large clusters', config: { minClusterSize: 6 } },
        { name: 'Many eigenvectors', config: { numEigenvectors: 5, minClusterSize: 2 } },
        { name: 'High precision', config: { tolerance: 1e-8, maxIterations: 200 } }
    ];
    
    configs.forEach(({ name, config }) => {
        console.log(`\n--- Configuration: ${name} ---`);
        const result = grsbm(graph, { ...config, seed: 42 });
        
        console.log(`Communities found: ${result.numClusters}`);
        console.log(`Hierarchy depth: ${findMaxDepth(result.root)}`);
        console.log(`Modularity progression: [${result.modularityScores.map(s => s.toFixed(3)).join(', ')}]`);
        console.log(`Explanations generated: ${result.explanation.length}`);
        
        // Show parameter impact
        if (result.explanation.length > 0) {
            const avgModularityImprovement = result.explanation
                .reduce((sum, exp) => sum + exp.modularityImprovement, 0) / result.explanation.length;
            console.log(`Average modularity improvement: ${avgModularityImprovement.toFixed(4)}`);
        }
    });
    
    return true;
}

/**
 * Helper function to find maximum depth in hierarchy
 */
function findMaxDepth(cluster) {
    if (!cluster.left && !cluster.right) {
        return cluster.depth;
    }
    
    let maxDepth = cluster.depth;
    if (cluster.left) {
        maxDepth = Math.max(maxDepth, findMaxDepth(cluster.left));
    }
    if (cluster.right) {
        maxDepth = Math.max(maxDepth, findMaxDepth(cluster.right));
    }
    
    return maxDepth;
}

/**
 * Run all GRSBM demonstration tests
 */
export function runAllGRSBMTests() {
    console.log('🧬 Running GRSBM (Greedy Recursive Spectral Bisection) Algorithm Tests...\n');
    
    const results = {
        basic: testBasicCommunityDetection(),
        academic: testAcademicNetwork(),
        social: testSocialCommunities(),
        protein: testProteinNetwork(),
        techCompanies: testTechCompanies(),
        parameters: testGRSBMParameters()
    };
    
    console.log('\n✅ All GRSBM tests completed!');
    console.log('\nSummary:');
    console.log('- GRSBM provides explainable hierarchical community detection');
    console.log('- Spectral bisection guided by modularity optimization');
    console.log('- Identifies key nodes and provides reasoning for splits');
    console.log('- Effective for academic, social, biological, and business networks');
    console.log('- Configurable parameters for different analysis needs');
    
    return results;
}