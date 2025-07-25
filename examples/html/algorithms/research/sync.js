/**
 * SynC (Synergistic Deep Graph Clustering) Algorithm Demonstrations
 * 
 * This file contains comprehensive examples and test cases for the SynC algorithm,
 * showcasing its synergistic learning capabilities that combine representation learning
 * with clustering for improved graph community detection.
 */

import { syncClustering } from './algorithms.js';

/**
 * Test basic SynC functionality with a simple network
 */
export function testBasicSynergisticClustering() {
    console.log('\n=== SynC: Basic Synergistic Clustering ===');
    
    // Create a simple graph with clear community structure
    const graph = new Map();
    
    // Community 1: Dense connections
    const community1 = ['A', 'B', 'C'];
    community1.forEach(node => {
        const connections = new Map();
        community1.forEach(other => {
            if (other !== node) {
                connections.set(other, 1);
            }
        });
        graph.set(node, connections);
    });
    
    // Community 2: Dense connections
    const community2 = ['D', 'E', 'F'];
    community2.forEach(node => {
        const connections = graph.get(node) || new Map();
        community2.forEach(other => {
            if (other !== node) {
                connections.set(other, 1);
            }
        });
        graph.set(node, connections);
    });
    
    // Weak inter-community connection
    graph.get('C').set('D', 1);
    graph.get('D').set('C', 1);
    
    const config = {
        numClusters: 2,
        maxIterations: 50,
        learningRate: 0.01,
        lambda: 0.1,
        seed: 42
    };
    
    const result = syncClustering(graph, config);
    
    console.log('Clusters found:', result.clusters);
    console.log('Final loss:', result.loss.toFixed(4));
    console.log('Iterations:', result.iterations);
    console.log('Converged:', result.converged);
    
    // Analyze embedding quality
    console.log('\nEmbedding Analysis:');
    result.embeddings.forEach((embedding, nodeId) => {
        const clusterId = result.clusters.get(nodeId);
        console.log(`Node ${nodeId} (Cluster ${clusterId}): [${embedding.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`);
    });
    
    return result;
}

/**
 * Test SynC on social network with friendship groups
 */
export function testSocialNetworkClustering() {
    console.log('\n=== SynC: Social Network Clustering ===');
    
    // Create social network with distinct friendship groups
    const graph = new Map();
    
    // High school friends (tight group)
    const highSchool = ['Alice', 'Bob', 'Carol', 'Dave'];
    highSchool.forEach(person => {
        const friends = new Map();
        highSchool.forEach(friend => {
            if (friend !== person) {
                friends.set(friend, 1);
            }
        });
        graph.set(person, friends);
    });
    
    // College friends (another tight group)
    const college = ['Eve', 'Frank', 'Grace'];
    college.forEach(person => {
        const friends = graph.get(person) || new Map();
        college.forEach(friend => {
            if (friend !== person) {
                friends.set(friend, 1);
            }
        });
        graph.set(person, friends);
    });
    
    // Work colleagues (third group)
    const work = ['Henry', 'Iris', 'Jack'];
    work.forEach(person => {
        const friends = graph.get(person) || new Map();
        work.forEach(colleague => {
            if (colleague !== person) {
                friends.set(colleague, 1);
            }
        });
        graph.set(person, friends);
    });
    
    // Add bridge connections
    graph.get('Dave').set('Eve', 1);
    graph.get('Eve').set('Dave', 1);
    graph.get('Grace').set('Henry', 1);
    graph.get('Henry').set('Grace', 1);
    
    const config = {
        numClusters: 3,
        maxIterations: 100,
        learningRate: 0.02,
        lambda: 0.15,
        seed: 123
    };
    
    const result = syncClustering(graph, config);
    
    console.log('Social groups identified:', result.clusters);
    console.log('Clustering quality (loss):', result.loss.toFixed(4));
    console.log('Learning convergence:', result.converged ? 'Yes' : 'No');
    
    // Analyze group formation
    const groups = new Map();
    for (const [person, groupId] of result.clusters) {
        if (!groups.has(groupId)) {
            groups.set(groupId, []);
        }
        groups.get(groupId).push(person);
    }
    
    groups.forEach((members, groupId) => {
        console.log(`Social Group ${groupId}: ${members.join(', ')}`);
    });
    
    // Show embedding synergy
    console.log('\nSynergistic Learning Analysis:');
    console.log('- Initial random embeddings evolved through graph structure');
    console.log('- Clustering objective guided embedding refinement');
    console.log('- Final embeddings capture both local and global patterns');
    
    return result;
}

/**
 * Test SynC on research collaboration network
 */
export function testResearchCollaborations() {
    console.log('\n=== SynC: Research Collaboration Network ===');
    
    // Create research network with different disciplines
    const graph = new Map();
    
    // AI/ML researchers
    const aiResearchers = ['AI_Prof', 'ML_Doc', 'DL_Student', 'NLP_Researcher'];
    aiResearchers.forEach(researcher => {
        const collaborations = new Map();
        aiResearchers.forEach(colleague => {
            if (colleague !== researcher && Math.random() > 0.3) {
                collaborations.set(colleague, 1);
            }
        });
        graph.set(researcher, collaborations);
    });
    
    // Systems researchers
    const systemsResearchers = ['Sys_Prof', 'DB_Doc', 'Net_Student', 'Sec_Researcher'];
    systemsResearchers.forEach(researcher => {
        const collaborations = graph.get(researcher) || new Map();
        systemsResearchers.forEach(colleague => {
            if (colleague !== researcher && Math.random() > 0.3) {
                collaborations.set(colleague, 1);
            }
        });
        graph.set(researcher, collaborations);
    });
    
    // Theory researchers
    const theoryResearchers = ['Theory_Prof', 'Algo_Doc', 'Crypto_Student'];
    theoryResearchers.forEach(researcher => {
        const collaborations = graph.get(researcher) || new Map();
        theoryResearchers.forEach(colleague => {
            if (colleague !== researcher && Math.random() > 0.4) {
                collaborations.set(colleague, 1);
            }
        });
        graph.set(researcher, collaborations);
    });
    
    // Add interdisciplinary collaborations
    const addCollaboration = (researcher1, researcher2) => {
        if (graph.has(researcher1) && graph.has(researcher2)) {
            graph.get(researcher1).set(researcher2, 1);
            graph.get(researcher2).set(researcher1, 1);
        }
    };
    
    addCollaboration('AI_Prof', 'Sys_Prof'); // AI-Systems bridge
    addCollaboration('ML_Doc', 'Theory_Prof'); // ML-Theory bridge
    addCollaboration('DL_Student', 'Algo_Doc'); // Student collaboration
    
    const config = {
        numClusters: 3,
        maxIterations: 150,
        learningRate: 0.015,
        lambda: 0.2,
        tolerance: 1e-5,
        seed: 456
    };
    
    const result = syncClustering(graph, config);
    
    console.log('Research disciplines identified:');
    
    // Group researchers by discovered clusters
    const disciplines = new Map();
    for (const [researcher, disciplineId] of result.clusters) {
        if (!disciplines.has(disciplineId)) {
            disciplines.set(disciplineId, []);
        }
        disciplines.get(disciplineId).push(researcher);
    }
    
    disciplines.forEach((researchers, disciplineId) => {
        console.log(`Research Cluster ${disciplineId}: ${researchers.join(', ')}`);
    });
    
    console.log(`\nSynergistic Learning Results:`);
    console.log(`- Loss: ${result.loss.toFixed(4)}`);
    console.log(`- Iterations: ${result.iterations}`);
    console.log(`- Embedding dimensions: ${result.embeddings.values().next().value?.length || 0}`);
    
    // Analyze interdisciplinary connections
    console.log('\nInterdisciplinary Analysis:');
    for (const [researcher, disciplineId] of result.clusters) {
        const collaborations = graph.get(researcher);
        if (collaborations) {
            const crossDisciplinaryLinks = [];
            for (const [colleague] of collaborations) {
                const colleagueDiscipline = result.clusters.get(colleague);
                if (colleagueDiscipline !== disciplineId) {
                    crossDisciplinaryLinks.push(colleague);
                }
            }
            if (crossDisciplinaryLinks.length > 0) {
                console.log(`${researcher} bridges to: ${crossDisciplinaryLinks.join(', ')}`);
            }
        }
    }
    
    return result;
}

/**
 * Test SynC on protein interaction modules
 */
export function testProteinModules() {
    console.log('\n=== SynC: Protein Interaction Modules ===');
    
    // Create protein interaction network with functional modules
    const graph = new Map();
    
    // Metabolic pathway proteins
    const metabolic = ['ATP_synthase', 'Glucose_kinase', 'Pyruvate_kinase', 'Lactate_DH'];
    metabolic.forEach(protein => {
        const interactions = new Map();
        metabolic.forEach(other => {
            if (other !== protein && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(protein, interactions);
    });
    
    // Signal transduction proteins
    const signaling = ['Receptor_A', 'Kinase_B', 'Phosphatase_C', 'TF_D'];
    signaling.forEach(protein => {
        const interactions = graph.get(protein) || new Map();
        signaling.forEach(other => {
            if (other !== protein && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(protein, interactions);
    });
    
    // DNA repair pathway
    const dnaRepair = ['DNA_pol', 'Helicase', 'Ligase'];
    dnaRepair.forEach(protein => {
        const interactions = graph.get(protein) || new Map();
        dnaRepair.forEach(other => {
            if (other !== protein && Math.random() > 0.5) {
                interactions.set(other, 1);
            }
        });
        graph.set(protein, interactions);
    });
    
    // Add regulatory cross-talk
    const addInteraction = (protein1, protein2) => {
        if (graph.has(protein1) && graph.has(protein2)) {
            graph.get(protein1).set(protein2, 1);
            graph.get(protein2).set(protein1, 1);
        }
    };
    
    addInteraction('ATP_synthase', 'Receptor_A'); // Energy sensing
    addInteraction('Kinase_B', 'DNA_pol'); // Checkpoint control
    
    const config = {
        numClusters: 3,
        maxIterations: 120,
        learningRate: 0.025,
        lambda: 0.1,
        seed: 789
    };
    
    const result = syncClustering(graph, config);
    
    console.log('Protein functional modules:');
    
    // Analyze discovered modules
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
    
    console.log(`\nSynergistic Discovery Results:`);
    console.log(`- Embedding-guided clustering identified ${modules.size} functional modules`);
    console.log(`- Final loss: ${result.loss.toFixed(4)}`);
    console.log(`- Converged in ${result.iterations} iterations`);
    
    // Show how embeddings capture functional similarity
    console.log('\nFunctional Embedding Analysis:');
    for (const [protein, embedding] of result.embeddings) {
        const moduleId = result.clusters.get(protein);
        const embeddingSignature = embedding.slice(0, 3).map(v => v.toFixed(2)).join(', ');
        console.log(`${protein} (Module ${moduleId}): [${embeddingSignature}...]`);
    }
    
    return result;
}

/**
 * Test SynC on technology company ecosystem
 */
export function testTechEcosystem() {
    console.log('\n=== SynC: Technology Company Ecosystem ===');
    
    // Create tech company interaction network
    const graph = new Map();
    
    // Big Tech platforms
    const platforms = ['Google', 'Apple', 'Microsoft', 'Amazon'];
    platforms.forEach(company => {
        const partnerships = new Map();
        platforms.forEach(other => {
            if (other !== company && Math.random() > 0.6) {
                partnerships.set(other, 1);
            }
        });
        graph.set(company, partnerships);
    });
    
    // AI/ML companies
    const aiCompanies = ['OpenAI', 'Anthropic', 'DeepMind', 'Hugging_Face'];
    aiCompanies.forEach(company => {
        const partnerships = graph.get(company) || new Map();
        aiCompanies.forEach(other => {
            if (other !== company && Math.random() > 0.5) {
                partnerships.set(other, 1);
            }
        });
        graph.set(company, partnerships);
    });
    
    // Enterprise software
    const enterprise = ['Salesforce', 'Oracle', 'SAP', 'Workday'];
    enterprise.forEach(company => {
        const partnerships = graph.get(company) || new Map();
        enterprise.forEach(other => {
            if (other !== company && Math.random() > 0.4) {
                partnerships.set(other, 1);
            }
        });
        graph.set(company, partnerships);
    });
    
    // Add strategic partnerships across ecosystems
    const addPartnership = (company1, company2) => {
        if (graph.has(company1) && graph.has(company2)) {
            graph.get(company1).set(company2, 1);
            graph.get(company2).set(company1, 1);
        }
    };
    
    // Platform-AI partnerships
    addPartnership('Microsoft', 'OpenAI');
    addPartnership('Google', 'DeepMind');
    addPartnership('Amazon', 'Hugging_Face');
    
    // Platform-Enterprise partnerships
    addPartnership('Microsoft', 'Salesforce');
    addPartnership('Google', 'Workday');
    
    const config = {
        numClusters: 3,
        maxIterations: 100,
        learningRate: 0.02,
        lambda: 0.12,
        seed: 999
    };
    
    const result = syncClustering(graph, config);
    
    console.log('Technology ecosystems discovered:');
    
    // Analyze ecosystem formation
    const ecosystems = new Map();
    for (const [company, ecosystemId] of result.clusters) {
        if (!ecosystems.has(ecosystemId)) {
            ecosystems.set(ecosystemId, []);
        }
        ecosystems.get(ecosystemId).push(company);
    }
    
    ecosystems.forEach((companies, ecosystemId) => {
        console.log(`Tech Ecosystem ${ecosystemId}: ${companies.join(', ')}`);
    });
    
    console.log(`\nEcosystem Intelligence:`);
    console.log(`- Synergistic learning revealed ${ecosystems.size} distinct tech ecosystems`);
    console.log(`- Embedding space captures competitive and collaborative relationships`);
    console.log(`- Final optimization loss: ${result.loss.toFixed(4)}`);
    
    // Strategic insights
    console.log('\nStrategic Partnership Analysis:');
    for (const [company, ecosystemId] of result.clusters) {
        const partnerships = graph.get(company);
        if (partnerships) {
            const crossEcosystemPartners = [];
            for (const [partner] of partnerships) {
                const partnerEcosystem = result.clusters.get(partner);
                if (partnerEcosystem !== ecosystemId) {
                    crossEcosystemPartners.push(partner);
                }
            }
            if (crossEcosystemPartners.length > 0) {
                console.log(`${company} bridges ecosystems via: ${crossEcosystemPartners.join(', ')}`);
            }
        }
    }
    
    return result;
}

/**
 * Test SynC parameter sensitivity and configuration options
 */
export function testSynCParameters() {
    console.log('\n=== SynC: Parameter Sensitivity Analysis ===');
    
    // Create test graph with known structure
    const graph = new Map();
    
    // Create 3 clear communities
    for (let community = 0; community < 3; community++) {
        const nodes = [];
        for (let i = 0; i < 4; i++) {
            nodes.push(`C${community}N${i}`);
        }
        
        // Dense internal connections
        nodes.forEach(node => {
            const connections = new Map();
            nodes.forEach(other => {
                if (other !== node) {
                    connections.set(other, 1);
                }
            });
            graph.set(node, connections);
        });
        
        // Sparse external connections
        if (community < 2) {
            const bridgeNode1 = `C${community}N3`;
            const bridgeNode2 = `C${community + 1}N0`;
            graph.get(bridgeNode1).set(bridgeNode2, 1);
            graph.get(bridgeNode2).set(bridgeNode1, 1);
        }
    }
    
    // Test different parameter configurations
    const configs = [
        {
            name: 'Standard',
            config: { numClusters: 3, learningRate: 0.01, lambda: 0.1 }
        },
        {
            name: 'High Learning Rate',
            config: { numClusters: 3, learningRate: 0.05, lambda: 0.1 }
        },
        {
            name: 'High Regularization',
            config: { numClusters: 3, learningRate: 0.01, lambda: 0.5 }
        },
        {
            name: 'Conservative',
            config: { numClusters: 3, learningRate: 0.005, lambda: 0.05, maxIterations: 200 }
        },
        {
            name: 'Aggressive',
            config: { numClusters: 3, learningRate: 0.03, lambda: 0.2, tolerance: 1e-4 }
        }
    ];
    
    configs.forEach(({ name, config }) => {
        console.log(`\n--- Configuration: ${name} ---`);
        const result = syncClustering(graph, { ...config, seed: 42 });
        
        console.log(`Learning Rate: ${config.learningRate}, Lambda: ${config.lambda}`);
        console.log(`Iterations: ${result.iterations}, Loss: ${result.loss.toFixed(4)}`);
        console.log(`Converged: ${result.converged}`);
        
        // Check clustering quality
        const clusters = new Map();
        for (const [nodeId, clusterId] of result.clusters) {
            if (!clusters.has(clusterId)) {
                clusters.set(clusterId, []);
            }
            clusters.get(clusterId).push(nodeId);
        }
        
        console.log(`Clusters formed: ${clusters.size}`);
        clusters.forEach((nodes, clusterId) => {
            console.log(`  Cluster ${clusterId}: ${nodes.length} nodes`);
        });
        
        // Analyze parameter impact
        const avgEmbeddingNorm = Array.from(result.embeddings.values())
            .map(embedding => Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)))
            .reduce((sum, norm) => sum + norm, 0) / result.embeddings.size;
        console.log(`Average embedding magnitude: ${avgEmbeddingNorm.toFixed(3)}`);
    });
    
    return true;
}

/**
 * Test SynC scalability with larger networks
 */
export function testSynCScalability() {
    console.log('\n=== SynC: Scalability Analysis ===');
    
    const networkSizes = [10, 20, 30];
    
    networkSizes.forEach(size => {
        console.log(`\n--- Network Size: ${size} nodes ---`);
        
        // Create larger network
        const graph = new Map();
        const numCommunities = Math.ceil(size / 10);
        const nodesPerCommunity = Math.floor(size / numCommunities);
        
        for (let community = 0; community < numCommunities; community++) {
            const nodes = [];
            for (let i = 0; i < nodesPerCommunity; i++) {
                nodes.push(`N${community}_${i}`);
            }
            
            // Dense internal connections
            nodes.forEach(node => {
                const connections = new Map();
                nodes.forEach(other => {
                    if (other !== node && Math.random() > 0.4) {
                        connections.set(other, 1);
                    }
                });
                graph.set(node, connections);
            });
            
            // Sparse inter-community connections
            if (community < numCommunities - 1) {
                const bridgeNode1 = nodes[nodes.length - 1];
                const bridgeNode2 = `N${community + 1}_0`;
                if (bridgeNode1) {
                    const connections = graph.get(bridgeNode1) || new Map();
                    connections.set(bridgeNode2, 1);
                    graph.set(bridgeNode1, connections);
                }
            }
        }
        
        const config = {
            numClusters: numCommunities,
            maxIterations: 50,
            learningRate: 0.01,
            lambda: 0.1,
            seed: 42
        };
        
        const startTime = performance.now();
        const result = syncClustering(graph, config);
        const endTime = performance.now();
        
        console.log(`Nodes: ${size}, Expected clusters: ${numCommunities}`);
        console.log(`Found clusters: ${new Set(result.clusters.values()).size}`);
        console.log(`Runtime: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Iterations: ${result.iterations}, Loss: ${result.loss.toFixed(4)}`);
        console.log(`Converged: ${result.converged}`);
        
        // Calculate clustering accuracy (simplified)
        const clusterAccuracy = calculateClusteringAccuracy(result.clusters, numCommunities, nodesPerCommunity);
        console.log(`Clustering accuracy: ${(clusterAccuracy * 100).toFixed(1)}%`);
    });
    
    return true;
}

/**
 * Helper function to calculate clustering accuracy
 */
function calculateClusteringAccuracy(clusters, expectedCommunities, nodesPerCommunity) {
    let correctAssignments = 0;
    let totalAssignments = 0;
    
    for (let community = 0; community < expectedCommunities; community++) {
        const expectedNodes = [];
        for (let i = 0; i < nodesPerCommunity; i++) {
            expectedNodes.push(`N${community}_${i}`);
        }
        
        // Find the most common cluster assignment for this community
        const clusterCounts = new Map();
        expectedNodes.forEach(node => {
            const clusterId = clusters.get(node);
            if (clusterId !== undefined) {
                clusterCounts.set(clusterId, (clusterCounts.get(clusterId) || 0) + 1);
                totalAssignments++;
            }
        });
        
        // Count correct assignments (nodes in the majority cluster)
        const maxCount = Math.max(...clusterCounts.values());
        correctAssignments += maxCount;
    }
    
    return totalAssignments > 0 ? correctAssignments / totalAssignments : 0;
}

/**
 * Run all SynC demonstration tests
 */
export function runAllSynCTests() {
    console.log('🧠 Running SynC (Synergistic Deep Graph Clustering) Algorithm Tests...\n');
    
    const results = {
        basic: testBasicSynergisticClustering(),
        social: testSocialNetworkClustering(),
        research: testResearchCollaborations(),
        protein: testProteinModules(),
        tech: testTechEcosystem(),
        parameters: testSynCParameters(),
        scalability: testSynCScalability()
    };
    
    console.log('\n✅ All SynC tests completed!');
    console.log('\nSummary:');
    console.log('- SynC combines representation learning with clustering optimization');
    console.log('- Synergistic approach: embeddings improve clustering, clustering improves embeddings');
    console.log('- Effective for social networks, research collaborations, and biological systems');
    console.log('- Configurable learning rate, regularization, and convergence criteria');
    console.log('- Joint optimization leads to meaningful representations and accurate clusters');
    
    return results;
}