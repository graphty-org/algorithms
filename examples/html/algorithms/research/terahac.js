/**
 * TeraHAC (Hierarchical Agglomerative Clustering) Algorithm Demonstrations
 * 
 * This file contains comprehensive examples and test cases for the TeraHAC algorithm,
 * showcasing its hierarchical clustering capabilities for building dendrograms and
 * understanding multi-scale community structure in graphs.
 */

import { teraHAC } from './algorithms.js';

/**
 * Test basic TeraHAC functionality with a simple network
 */
export function testBasicHierarchicalClustering() {
    console.log('\n=== TeraHAC: Basic Hierarchical Clustering ===');
    
    // Create a simple graph with clear hierarchical structure
    const graph = new Map();
    
    // Cluster 1: Triangle
    const cluster1 = ['A', 'B', 'C'];
    cluster1.forEach(node => {
        const connections = new Map();
        cluster1.forEach(other => {
            if (other !== node) {
                connections.set(other, 1);
            }
        });
        graph.set(node, connections);
    });
    
    // Cluster 2: Triangle
    const cluster2 = ['D', 'E', 'F'];
    cluster2.forEach(node => {
        const connections = graph.get(node) || new Map();
        cluster2.forEach(other => {
            if (other !== node) {
                connections.set(other, 1);
            }
        });
        graph.set(node, connections);
    });
    
    // Bridge connection
    graph.get('C').set('D', 1);
    graph.get('D').set('C', 1);
    
    const config = {
        linkage: 'average',
        numClusters: 2,
        useGraphDistance: true
    };
    
    const result = teraHAC(graph, config);
    
    console.log('Hierarchical structure:');
    console.log('Final clusters:', result.clusters);
    console.log('Number of clusters:', result.numClusters);
    console.log('Merge distances:', result.distances);
    
    // Analyze dendrogram structure
    console.log('\nDendrogram Analysis:');
    analyzeDendrogram(result.dendrogram, 0);
    
    return result;
}

/**
 * Test TeraHAC on social network with family groups
 */
export function testSocialNetworkHierarchy() {
    console.log('\n=== TeraHAC: Social Network Hierarchy ===');
    
    // Create social network with hierarchical family structure
    const graph = new Map();
    
    // Nuclear family 1
    const family1 = ['Dad1', 'Mom1', 'Kid1A', 'Kid1B'];
    family1.forEach(person => {
        const relationships = new Map();
        family1.forEach(other => {
            if (other !== person) {
                relationships.set(other, 1);
            }
        });
        graph.set(person, relationships);
    });
    
    // Nuclear family 2
    const family2 = ['Dad2', 'Mom2', 'Kid2A', 'Kid2B'];
    family2.forEach(person => {
        const relationships = graph.get(person) || new Map();
        family2.forEach(other => {
            if (other !== person) {
                relationships.set(other, 1);
            }
        });
        graph.set(person, relationships);
    });
    
    // Extended family connections (grandparents)
    const addRelationship = (person1, person2) => {
        if (graph.has(person1) && graph.has(person2)) {
            graph.get(person1).set(person2, 1);
            graph.get(person2).set(person1, 1);
        }
    };
    
    // Add family friends connections (weaker)
    addRelationship('Dad1', 'Dad2'); // Fathers know each other
    addRelationship('Kid1A', 'Kid2A'); // Kids are friends
    
    // Test different linkage methods
    const linkageMethods = ['single', 'complete', 'average', 'ward'];
    
    linkageMethods.forEach(linkage => {
        console.log(`\n--- ${linkage.toUpperCase()} Linkage ---`);
        
        const config = {
            linkage: linkage,
            numClusters: 2,
            useGraphDistance: true
        };
        
        const result = teraHAC(graph, config);
        
        console.log(`Clusters found: ${result.numClusters}`);
        console.log(`Merge steps: ${result.distances.length}`);
        
        // Analyze family groupings
        const families = new Map();
        for (const [person, familyId] of result.clusters) {
            if (!families.has(familyId)) {
                families.set(familyId, []);
            }
            families.get(familyId).push(person);
        }
        
        families.forEach((members, familyId) => {
            console.log(`Family Group ${familyId}: ${members.join(', ')}`);
        });
        
        console.log(`Max merge distance: ${Math.max(...result.distances).toFixed(3)}`);
    });
    
    return true;
}

/**
 * Test TeraHAC on gene regulatory network
 */
export function testGeneRegulatoryNetwork() {
    console.log('\n=== TeraHAC: Gene Regulatory Network ===');
    
    // Create gene network with pathways and modules
    const graph = new Map();
    
    // Cell cycle pathway
    const cellCycle = ['CyclinA', 'CyclinB', 'CDK1', 'CDK2', 'p53'];
    cellCycle.forEach(gene => {
        const interactions = new Map();
        cellCycle.forEach(other => {
            if (other !== gene && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(gene, interactions);
    });
    
    // DNA repair pathway
    const dnaRepair = ['BRCA1', 'BRCA2', 'ATM', 'ATR'];
    dnaRepair.forEach(gene => {
        const interactions = graph.get(gene) || new Map();
        dnaRepair.forEach(other => {
            if (other !== gene && Math.random() > 0.4) {
                interactions.set(other, 1);
            }
        });
        graph.set(gene, interactions);
    });
    
    // Apoptosis pathway
    const apoptosis = ['BAX', 'BCL2', 'CASP3'];
    apoptosis.forEach(gene => {
        const interactions = graph.get(gene) || new Map();
        apoptosis.forEach(other => {
            if (other !== gene && Math.random() > 0.5) {
                interactions.set(other, 1);
            }
        });
        graph.set(gene, interactions);
    });
    
    // Add pathway cross-talk
    const addInteraction = (gene1, gene2) => {
        if (graph.has(gene1) && graph.has(gene2)) {
            graph.get(gene1).set(gene2, 1);
            graph.get(gene2).set(gene1, 1);
        }
    };
    
    // p53 regulates apoptosis
    addInteraction('p53', 'BAX');
    addInteraction('p53', 'BCL2');
    
    // DNA damage triggers cell cycle arrest
    addInteraction('ATM', 'p53');
    
    const config = {
        linkage: 'average',
        numClusters: 3,
        useGraphDistance: true
    };
    
    const result = teraHAC(graph, config);
    
    console.log('Gene pathway hierarchy:');
    
    // Analyze pathway clustering
    const pathways = new Map();
    for (const [gene, pathwayId] of result.clusters) {
        if (!pathways.has(pathwayId)) {
            pathways.set(pathwayId, []);
        }
        pathways.get(pathwayId).push(gene);
    }
    
    pathways.forEach((genes, pathwayId) => {
        console.log(`Pathway Cluster ${pathwayId}: ${genes.join(', ')}`);
    });
    
    console.log('\nHierarchical Analysis:');
    console.log(`- Merge distances: [${result.distances.map(d => d.toFixed(2)).join(', ')}]`);
    console.log(`- Tree depth: ${calculateTreeDepth(result.dendrogram)}`);
    
    // Show cross-pathway interactions
    console.log('\nCross-pathway Interactions:');
    for (const [gene, pathwayId] of result.clusters) {
        const interactions = graph.get(gene);
        if (interactions) {
            const crossPathwayInteractions = [];
            for (const [partner] of interactions) {
                const partnerPathway = result.clusters.get(partner);
                if (partnerPathway !== pathwayId) {
                    crossPathwayInteractions.push(partner);
                }
            }
            if (crossPathwayInteractions.length > 0) {
                console.log(`${gene} interacts across pathways with: ${crossPathwayInteractions.join(', ')}`);
            }
        }
    }
    
    return result;
}

/**
 * Test TeraHAC on organizational hierarchy
 */
export function testOrganizationalHierarchy() {
    console.log('\n=== TeraHAC: Organizational Hierarchy ===');
    
    // Create organizational network
    const graph = new Map();
    
    // Executive team
    const executives = ['CEO', 'CTO', 'CFO', 'COO'];
    executives.forEach(exec => {
        const relationships = new Map();
        executives.forEach(other => {
            if (other !== exec) {
                relationships.set(other, 1);
            }
        });
        graph.set(exec, relationships);
    });
    
    // Engineering department
    const engineering = ['Tech_Lead', 'Senior_Dev', 'Junior_Dev', 'DevOps'];
    engineering.forEach(employee => {
        const relationships = graph.get(employee) || new Map();
        engineering.forEach(other => {
            if (other !== employee) {
                relationships.set(other, 1);
            }
        });
        graph.set(employee, relationships);
    });
    
    // Finance department
    const finance = ['Finance_Dir', 'Accountant', 'Analyst'];
    finance.forEach(employee => {
        const relationships = graph.get(employee) || new Map();
        finance.forEach(other => {
            if (other !== employee) {
                relationships.set(other, 1);
            }
        });
        graph.set(employee, relationships);
    });
    
    // Sales department
    const sales = ['Sales_Dir', 'Account_Mgr', 'Sales_Rep'];
    sales.forEach(employee => {
        const relationships = graph.get(employee) || new Map();
        sales.forEach(other => {
            if (other !== employee) {
                relationships.set(other, 1);
            }
        });
        graph.set(employee, relationships);
    });
    
    // Add hierarchical connections
    const addConnection = (person1, person2) => {
        if (graph.has(person1) && graph.has(person2)) {
            graph.get(person1).set(person2, 1);
            graph.get(person2).set(person1, 1);
        }
    };
    
    // Executive to department heads
    addConnection('CTO', 'Tech_Lead');
    addConnection('CFO', 'Finance_Dir');
    addConnection('COO', 'Sales_Dir');
    
    // Some cross-department collaborations
    addConnection('Tech_Lead', 'Finance_Dir'); // Tech-Finance projects
    addConnection('Sales_Dir', 'Senior_Dev'); // Sales-Engineering collaboration
    
    const config = {
        linkage: 'average',
        distanceThreshold: 3.0, // Stop at reasonable organizational distance
        useGraphDistance: true
    };
    
    const result = teraHAC(graph, config);
    
    console.log('Organizational hierarchy detected:');
    
    // Analyze organizational units
    const units = new Map();
    for (const [employee, unitId] of result.clusters) {
        if (!units.has(unitId)) {
            units.set(unitId, []);
        }
        units.get(unitId).push(employee);
    }
    
    units.forEach((employees, unitId) => {
        console.log(`Organizational Unit ${unitId}: ${employees.join(', ')}`);
    });
    
    console.log('\nHierarchy Analysis:');
    console.log(`- Final units: ${units.size}`);
    console.log(`- Merge steps: ${result.distances.length}`);
    console.log(`- Distance range: ${Math.min(...result.distances).toFixed(2)} - ${Math.max(...result.distances).toFixed(2)}`);
    
    // Identify cross-unit collaborations
    console.log('\nCross-unit Collaborations:');
    for (const [employee, unitId] of result.clusters) {
        const connections = graph.get(employee);
        if (connections) {
            const crossUnitConnections = [];
            for (const [colleague] of connections) {
                const colleagueUnit = result.clusters.get(colleague);
                if (colleagueUnit !== unitId) {
                    crossUnitConnections.push(colleague);
                }
            }
            if (crossUnitConnections.length > 0) {
                console.log(`${employee} collaborates across units with: ${crossUnitConnections.join(', ')}`);
            }
        }
    }
    
    return result;
}

/**
 * Test TeraHAC on geographic city network
 */
export function testGeographicClustering() {
    console.log('\n=== TeraHAC: Geographic City Clustering ===');
    
    // Create city network based on geographic proximity and connections
    const graph = new Map();
    
    // East Coast cities
    const eastCoast = ['NYC', 'Boston', 'Philadelphia', 'Washington_DC', 'Atlanta'];
    eastCoast.forEach(city => {
        const connections = new Map();
        eastCoast.forEach(other => {
            if (other !== city && Math.random() > 0.4) {
                connections.set(other, 1);
            }
        });
        graph.set(city, connections);
    });
    
    // West Coast cities
    const westCoast = ['LA', 'San_Francisco', 'Seattle', 'Portland'];
    westCoast.forEach(city => {
        const connections = graph.get(city) || new Map();
        westCoast.forEach(other => {
            if (other !== city && Math.random() > 0.4) {
                connections.set(other, 1);
            }
        });
        graph.set(city, connections);
    });
    
    // Midwest cities
    const midwest = ['Chicago', 'Detroit', 'Cleveland'];
    midwest.forEach(city => {
        const connections = graph.get(city) || new Map();
        midwest.forEach(other => {
            if (other !== city && Math.random() > 0.5) {
                connections.set(other, 1);
            }
        });
        graph.set(city, connections);
    });
    
    // Add some cross-regional connections (major transportation hubs)
    const addConnection = (city1, city2) => {
        if (graph.has(city1) && graph.has(city2)) {
            graph.get(city1).set(city2, 1);
            graph.get(city2).set(city1, 1);
        }
    };
    
    // Major hub connections
    addConnection('NYC', 'Chicago'); // Major airline route
    addConnection('Chicago', 'LA'); // Transcontinental route
    addConnection('Washington_DC', 'Seattle'); // Political/tech connection
    
    // Test with different stopping criteria
    const configs = [
        { name: 'By Number', config: { linkage: 'average', numClusters: 3, useGraphDistance: true } },
        { name: 'By Distance', config: { linkage: 'average', distanceThreshold: 2.5, useGraphDistance: true } },
        { name: 'Complete Linkage', config: { linkage: 'complete', numClusters: 3, useGraphDistance: true } }
    ];
    
    configs.forEach(({ name, config }) => {
        console.log(`\n--- ${name} Clustering ---`);
        
        const result = teraHAC(graph, config);
        
        console.log(`Geographic regions identified: ${result.numClusters}`);
        
        // Analyze regional clustering
        const regions = new Map();
        for (const [city, regionId] of result.clusters) {
            if (!regions.has(regionId)) {
                regions.set(regionId, []);
            }
            regions.get(regionId).push(city);
        }
        
        regions.forEach((cities, regionId) => {
            console.log(`Region ${regionId}: ${cities.join(', ')}`);
        });
        
        console.log(`Merge distances: [${result.distances.map(d => d.toFixed(2)).join(', ')}]`);
        
        // Calculate clustering quality
        const silhouetteScore = calculateSimpleSilhouette(result.clusters, graph);
        console.log(`Clustering quality (simplified): ${silhouetteScore.toFixed(3)}`);
    });
    
    return true;
}

/**
 * Test TeraHAC scalability and performance
 */
export function testTeraHACScalability() {
    console.log('\n=== TeraHAC: Scalability Analysis ===');
    
    const networkSizes = [10, 20, 30];
    
    networkSizes.forEach(size => {
        console.log(`\n--- Network Size: ${size} nodes ---`);
        
        // Create larger network with community structure
        const graph = new Map();
        const numCommunities = Math.max(2, Math.floor(size / 8));
        const nodesPerCommunity = Math.floor(size / numCommunities);
        
        for (let community = 0; community < numCommunities; community++) {
            const nodes = [];
            for (let i = 0; i < nodesPerCommunity; i++) {
                nodes.push(`C${community}_N${i}`);
            }
            
            // Dense internal connections
            nodes.forEach(node => {
                const connections = new Map();
                nodes.forEach(other => {
                    if (other !== node && Math.random() > 0.3) {
                        connections.set(other, 1);
                    }
                });
                graph.set(node, connections);
            });
            
            // Sparse inter-community connections
            if (community < numCommunities - 1) {
                const bridgeNode1 = nodes[nodes.length - 1];
                const bridgeNode2 = `C${community + 1}_N0`;
                if (bridgeNode1) {
                    const connections = graph.get(bridgeNode1) || new Map();
                    connections.set(bridgeNode2, 1);
                    graph.set(bridgeNode1, connections);
                }
            }
        }
        
        const config = {
            linkage: 'average',
            numClusters: numCommunities,
            useGraphDistance: false // Use direct distance for scalability
        };
        
        const startTime = performance.now();
        const result = teraHAC(graph, config);
        const endTime = performance.now();
        
        console.log(`Nodes: ${size}, Expected communities: ${numCommunities}`);
        console.log(`Found clusters: ${result.numClusters}`);
        console.log(`Runtime: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Merge steps: ${result.distances.length}`);
        console.log(`Tree depth: ${calculateTreeDepth(result.dendrogram)}`);
        
        // Calculate clustering accuracy
        const accuracy = calculateClusteringAccuracy(result.clusters, numCommunities, nodesPerCommunity);
        console.log(`Clustering accuracy: ${(accuracy * 100).toFixed(1)}%`);
        
        // Memory usage estimate
        const estimatedMemory = estimateMemoryUsage(size);
        console.log(`Estimated memory usage: ${estimatedMemory.toFixed(1)}MB`);
    });
    
    return true;
}

/**
 * Test different linkage criteria comparison
 */
export function testLinkageCriteriaComparison() {
    console.log('\n=== TeraHAC: Linkage Criteria Comparison ===');
    
    // Create test graph with known structure
    const graph = new Map();
    
    // Create elongated clusters to test linkage sensitivity
    const cluster1 = ['A1', 'A2', 'A3', 'A4']; // Chain
    for (let i = 0; i < cluster1.length - 1; i++) {
        const node = cluster1[i];
        const next = cluster1[i + 1];
        if (node && next) {
            graph.set(node, graph.get(node) || new Map());
            graph.set(next, graph.get(next) || new Map());
            graph.get(node).set(next, 1);
            graph.get(next).set(node, 1);
        }
    }
    
    const cluster2 = ['B1', 'B2', 'B3', 'B4']; // Chain
    for (let i = 0; i < cluster2.length - 1; i++) {
        const node = cluster2[i];
        const next = cluster2[i + 1];
        if (node && next) {
            graph.set(node, graph.get(node) || new Map());
            graph.set(next, graph.get(next) || new Map());
            graph.get(node).set(next, 1);
            graph.get(next).set(node, 1);
        }
    }
    
    // Bridge between clusters
    graph.get('A4').set('B1', 1);
    graph.get('B1').set('A4', 1);
    
    const linkageMethods = ['single', 'complete', 'average', 'ward'];
    
    console.log('Comparing linkage methods on elongated clusters:');
    
    linkageMethods.forEach(linkage => {
        console.log(`\n--- ${linkage.toUpperCase()} Linkage ---`);
        
        const config = {
            linkage: linkage,
            numClusters: 2,
            useGraphDistance: true
        };
        
        const result = teraHAC(graph, config);
        
        // Analyze how each method groups the chains
        const clusters = new Map();
        for (const [node, clusterId] of result.clusters) {
            if (!clusters.has(clusterId)) {
                clusters.set(clusterId, []);
            }
            clusters.get(clusterId).push(node);
        }
        
        clusters.forEach((nodes, clusterId) => {
            console.log(`Cluster ${clusterId}: ${nodes.sort().join(', ')}`);
        });
        
        console.log(`Merge distances: [${result.distances.map(d => d.toFixed(3)).join(', ')}]`);
        
        // Show linkage characteristics
        const linkageCharacteristics = {
            single: 'Tends to create elongated clusters, sensitive to outliers',
            complete: 'Creates compact, spherical clusters',
            average: 'Balanced approach, moderately robust',
            ward: 'Minimizes within-cluster variance, creates balanced clusters'
        };
        
        console.log(`Characteristic: ${linkageCharacteristics[linkage]}`);
    });
    
    return true;
}

/**
 * Helper function to analyze dendrogram structure
 */
function analyzeDendrogram(node, depth) {
    const indent = '  '.repeat(depth);
    
    if (!node.left && !node.right) {
        // Leaf node
        console.log(`${indent}Leaf: ${Array.from(node.members).join(', ')} (size: ${node.size})`);
    } else {
        // Internal node
        console.log(`${indent}Node: ${node.id} (distance: ${node.distance.toFixed(3)}, size: ${node.size})`);
        if (node.left) {
            analyzeDendrogram(node.left, depth + 1);
        }
        if (node.right) {
            analyzeDendrogram(node.right, depth + 1);
        }
    }
}

/**
 * Helper function to calculate tree depth
 */
function calculateTreeDepth(node) {
    if (!node.left && !node.right) {
        return 1;
    }
    
    const leftDepth = node.left ? calculateTreeDepth(node.left) : 0;
    const rightDepth = node.right ? calculateTreeDepth(node.right) : 0;
    
    return 1 + Math.max(leftDepth, rightDepth);
}

/**
 * Helper function to calculate simplified silhouette score
 */
function calculateSimpleSilhouette(clusters, graph) {
    let totalScore = 0;
    let nodeCount = 0;
    
    for (const [nodeId, clusterId] of clusters) {
        const neighbors = graph.get(nodeId);
        if (!neighbors) continue;
        
        let intraClusterDistance = 0;
        let intraClusterCount = 0;
        let interClusterDistance = 0;
        let interClusterCount = 0;
        
        for (const [neighborId] of neighbors) {
            const neighborCluster = clusters.get(neighborId);
            if (neighborCluster === clusterId) {
                intraClusterDistance += 1;
                intraClusterCount++;
            } else {
                interClusterDistance += 1;
                interClusterCount++;
            }
        }
        
        const avgIntra = intraClusterCount > 0 ? intraClusterDistance / intraClusterCount : 0;
        const avgInter = interClusterCount > 0 ? interClusterDistance / interClusterCount : 1;
        
        const silhouette = (avgInter - avgIntra) / Math.max(avgIntra, avgInter);
        totalScore += silhouette;
        nodeCount++;
    }
    
    return nodeCount > 0 ? totalScore / nodeCount : 0;
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
            expectedNodes.push(`C${community}_N${i}`);
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
        if (clusterCounts.size > 0) {
            const maxCount = Math.max(...clusterCounts.values());
            correctAssignments += maxCount;
        }
    }
    
    return totalAssignments > 0 ? correctAssignments / totalAssignments : 0;
}

/**
 * Helper function to estimate memory usage
 */
function estimateMemoryUsage(numNodes) {
    // Simplified memory estimation for TeraHAC
    // Distance matrix: O(n²), dendrogram: O(n), candidates: O(n²)
    const distanceMatrixSize = numNodes * numNodes * 8; // 8 bytes per double
    const dendrogramSize = numNodes * 200; // Estimated node structure size
    const candidatesSize = (numNodes * (numNodes - 1) / 2) * 24; // Candidate objects
    
    const totalBytes = distanceMatrixSize + dendrogramSize + candidatesSize;
    return totalBytes / (1024 * 1024); // Convert to MB
}

/**
 * Run all TeraHAC demonstration tests
 */
export function runAllTeraHACTests() {
    console.log('🌳 Running TeraHAC (Hierarchical Agglomerative Clustering) Algorithm Tests...\n');
    
    const results = {
        basic: testBasicHierarchicalClustering(),
        social: testSocialNetworkHierarchy(),
        genes: testGeneRegulatoryNetwork(),
        organization: testOrganizationalHierarchy(),
        geographic: testGeographicClustering(),
        scalability: testTeraHACScalability(),
        linkage: testLinkageCriteriaComparison()
    };
    
    console.log('\n✅ All TeraHAC tests completed!');
    console.log('\nSummary:');
    console.log('- TeraHAC builds complete hierarchical cluster dendrograms');
    console.log('- Different linkage criteria capture different cluster shapes and properties');
    console.log('- Effective for social networks, biological systems, and organizational structures');
    console.log('- Provides multi-scale view of community structure');
    console.log('- Scalable implementation optimized for large graphs (up to tera-scale)');
    
    return results;
}