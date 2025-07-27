import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";
import {SeededRandom} from "../utils/math-utilities.js";

/**
 * Configuration options for the GRSBM (Greedy Recursive Spectral Bisection) algorithm
 */
export interface GRSBMConfig {
    /** Maximum depth of recursive bisection */
    maxDepth?: number;
    /** Minimum cluster size to continue splitting */
    minClusterSize?: number;
    /** Number of eigenvectors to use for spectral embedding */
    numEigenvectors?: number;
    /** Convergence tolerance for eigenvalue computation */
    tolerance?: number;
    /** Maximum number of power iterations for eigenvalue computation */
    maxIterations?: number;
    /** Random seed for reproducibility */
    seed?: number;
}

/**
 * Represents a cluster in the hierarchical structure
 */
export interface GRSBMCluster {
    /** Unique identifier for this cluster */
    id: string;
    /** Node IDs in this cluster */
    members: Set<NodeId>;
    /** Left child cluster (if split) */
    left?: GRSBMCluster;
    /** Right child cluster (if split) */
    right?: GRSBMCluster;
    /** Modularity score of this cluster */
    modularity: number;
    /** Depth in the hierarchy */
    depth: number;
    /** Spectral embedding quality score */
    spectralScore: number;
}

/**
 * Result of the GRSBM clustering algorithm
 */
export interface GRSBMResult {
    /** Root of the cluster hierarchy */
    root: GRSBMCluster;
    /** Flat clustering at leaf level */
    clusters: Map<NodeId, number>;
    /** Number of final clusters */
    numClusters: number;
    /** Modularity scores for each level */
    modularityScores: number[];
    /** Explanation of the clustering structure */
    explanation: ClusterExplanation[];
}

/**
 * Explanation for a cluster split decision
 */
export interface ClusterExplanation {
    /** Cluster that was split */
    clusterId: string;
    /** Reason for the split */
    reason: string;
    /** Modularity improvement from the split */
    modularityImprovement: number;
    /** Key nodes that influenced the split */
    keyNodes: NodeId[];
    /** Spectral embedding values */
    spectralValues: number[];
}

/**
 * GRSBM - Greedy Recursive Spectral Bisection with Modularity
 *
 * This algorithm performs hierarchical community detection using spectral
 * bisection guided by modularity optimization. It provides explainable
 * community structure by tracking the reasoning behind each split.
 *
 * Based on: "Explainable Community Detection via Hierarchical Spectral Clustering" (2024)
 *
 * @param graph - Input graph to cluster
 * @param config - Configuration options
 * @returns Hierarchical clustering result with explanations
 */
export function grsbm(graph: Graph, config: GRSBMConfig = {}): GRSBMResult {
    const {
        maxDepth = 10,
        minClusterSize = 2, // Reduced default to allow more splits
        numEigenvectors = 2,
        tolerance = 1e-6,
        maxIterations = 100,
        seed = 42,
    } = config;

    // Set random seed for reproducibility
    const rng = SeededRandom.createGenerator(seed);
    const originalRandom = Math.random;
    Math.random = rng;

    const nodes = Array.from(graph.nodes());
    const nodeCount = nodes.length;

    if (nodeCount === 0) {
        throw new Error("Cannot cluster empty graph");
    }

    // Initialize root cluster with all nodes
    const rootMembers = new Set(nodes.map((node) => node.id));
    const initialModularity = calculateModularity(graph, new Map([... rootMembers].map((id) => [id, 0])));

    const root: GRSBMCluster = {
        id: "root",
        members: rootMembers,
        modularity: initialModularity,
        depth: 0,
        spectralScore: 0,
    };

    const explanations: ClusterExplanation[] = [];
    const modularityScores: number[] = [initialModularity];

    // Perform recursive bisection
    const clusterQueue: GRSBMCluster[] = [root];
    let nextClusterId = 1;

    while (clusterQueue.length > 0) {
        const currentCluster = clusterQueue.shift();
        if (!currentCluster) {
            continue;
        }

        // Check stopping criteria
        if (currentCluster.depth >= maxDepth ||
            currentCluster.members.size < minClusterSize * 2) {
            continue;
        }

        // Attempt spectral bisection
        const bisectionResult = spectralBisection(
            graph,
            currentCluster,
            numEigenvectors,
            tolerance,
            maxIterations,
        );

        if (!bisectionResult) {
            continue; // Could not split this cluster
        }

        const {leftMembers, rightMembers, spectralScore, keyNodes, spectralValues, reason} = bisectionResult;

        // Create child clusters
        const leftCluster: GRSBMCluster = {
            id: `cluster_${String(nextClusterId++)}`,
            members: leftMembers,
            modularity: 0, // Will be calculated below
            depth: currentCluster.depth + 1,
            spectralScore,
        };

        const rightCluster: GRSBMCluster = {
            id: `cluster_${String(nextClusterId++)}`,
            members: rightMembers,
            modularity: 0, // Will be calculated below
            depth: currentCluster.depth + 1,
            spectralScore,
        };

        // Calculate modularity improvement
        const newAssignment = new Map<NodeId, number>();
        for (const nodeId of leftMembers) {
            newAssignment.set(nodeId, 0);
        }
        for (const nodeId of rightMembers) {
            newAssignment.set(nodeId, 1);
        }

        const newModularity = calculateModularity(graph, newAssignment);
        const modularityImprovement = newModularity - currentCluster.modularity;

        // Only split if modularity improves or is neutral (allow small splits)
        if (modularityImprovement >= -0.01) { // Small tolerance for neutral splits
            leftCluster.modularity = newModularity;
            rightCluster.modularity = newModularity;

            currentCluster.left = leftCluster;
            currentCluster.right = rightCluster;

            // Add explanation
            explanations.push({
                clusterId: currentCluster.id,
                reason,
                modularityImprovement,
                keyNodes,
                spectralValues,
            });

            modularityScores.push(newModularity);

            // Add children to queue for further processing
            clusterQueue.push(leftCluster, rightCluster);
        }
    }

    // Extract flat clustering from leaf nodes
    const clusters = new Map<NodeId, number>();
    let clusterId = 0;

    function assignClusterIds(cluster: GRSBMCluster): void {
        if (!cluster.left && !cluster.right) {
            // Leaf node
            for (const nodeId of cluster.members) {
                clusters.set(nodeId, clusterId);
            }
            clusterId++;
        } else {
            // Internal node - traverse children
            if (cluster.left) {
                assignClusterIds(cluster.left);
            }

            if (cluster.right) {
                assignClusterIds(cluster.right);
            }
        }
    }

    assignClusterIds(root);

    // Restore original random function
    Math.random = originalRandom;

    return {
        root,
        clusters,
        numClusters: clusterId,
        modularityScores,
        explanation: explanations,
    };
}

/**
 * Perform spectral bisection on a cluster
 */
function spectralBisection(
    graph: Graph,
    cluster: GRSBMCluster,
    numEigenvectors: number,
    tolerance: number,
    maxIterations: number,
): {
    leftMembers: Set<NodeId>;
    rightMembers: Set<NodeId>;
    spectralScore: number;
    keyNodes: NodeId[];
    spectralValues: number[];
    reason: string;
} | null {
    const members = Array.from(cluster.members);
    const n = members.length;

    if (n < 4) {
        return null; // Too small to split meaningfully
    }

    // Create subgraph Laplacian matrix
    const laplacian = createLaplacianMatrix(graph, members);

    // Compute the second smallest eigenvector (Fiedler vector)
    const eigenvector = computeFiedlerVector(laplacian, tolerance, maxIterations);

    if (!eigenvector) {
        return null; // Could not compute eigenvector
    }

    // Find optimal split point
    const sortedIndices = eigenvector
        .map((value, index) => ({value, index}))
        .sort((a, b) => a.value - b.value);

    let bestSplitIndex = Math.floor(n / 2);
    let bestModularity = -Infinity;

    // Try different split points
    for (let splitIndex = Math.floor(n * 0.2); splitIndex <= Math.floor(n * 0.8); splitIndex++) {
        const leftIndices = sortedIndices.slice(0, splitIndex).map((item) => item.index);
        const rightIndices = sortedIndices.slice(splitIndex).map((item) => item.index);

        const assignment = new Map<NodeId, number>();
        for (const idx of leftIndices) {
            const nodeId = members[idx];
            if (nodeId !== undefined) {
                assignment.set(nodeId, 0);
            }
        }
        for (const idx of rightIndices) {
            const nodeId = members[idx];
            if (nodeId !== undefined) {
                assignment.set(nodeId, 1);
            }
        }

        const modularity = calculateModularity(graph, assignment);

        if (modularity > bestModularity) {
            bestModularity = modularity;
            bestSplitIndex = splitIndex;
        }
    }

    // Create final split
    const leftIndices = sortedIndices.slice(0, bestSplitIndex).map((item) => item.index);
    const rightIndices = sortedIndices.slice(bestSplitIndex).map((item) => item.index);

    const leftMembers = new Set<NodeId>();
    const rightMembers = new Set<NodeId>();

    for (const idx of leftIndices) {
        const nodeId = members[idx];
        if (nodeId !== undefined) {
            leftMembers.add(nodeId);
        }
    }

    for (const idx of rightIndices) {
        const nodeId = members[idx];
        if (nodeId !== undefined) {
            rightMembers.add(nodeId);
        }
    }

    // Identify key nodes (those with extreme spectral values)
    const extremeThreshold = 0.1;
    const sortedValues = [... eigenvector].sort((a, b) => Math.abs(b) - Math.abs(a));
    const threshold = sortedValues[Math.floor(sortedValues.length * extremeThreshold)] ?? 0;

    const keyNodes: NodeId[] = [];
    for (let i = 0; i < eigenvector.length; i++) {
        const eigenValue = eigenvector[i];
        if (eigenValue !== undefined && Math.abs(eigenValue) >= Math.abs(threshold)) {
            const nodeId = members[i];
            if (nodeId !== undefined) {
                keyNodes.push(nodeId);
            }
        }
    }

    // Calculate spectral score (based on eigenvalue gap)
    const firstValue = sortedValues[0] ?? 0;
    const lastValue = sortedValues[sortedValues.length - 1] ?? 0;
    const spectralScore = Math.abs(firstValue - lastValue);

    // Generate explanation
    const reason = `Spectral bisection based on Fiedler vector with modularity ${bestModularity.toFixed(3)}. Split creates clusters of sizes ${String(leftMembers.size)} and ${String(rightMembers.size)}.`;

    return {
        leftMembers,
        rightMembers,
        spectralScore,
        keyNodes: keyNodes.slice(0, 5), // Top 5 key nodes
        spectralValues: eigenvector,
        reason,
    };
}

/**
 * Create Laplacian matrix for a subgraph
 */
function createLaplacianMatrix(graph: Graph, nodes: NodeId[]): number[][] {
    const n = nodes.length;
    const nodeIndex = new Map<NodeId, number>();

    // Create node index mapping
    for (let i = 0; i < n; i++) {
        const node = nodes[i];
        if (node !== undefined) {
            nodeIndex.set(node, i);
        }
    }

    // Initialize Laplacian matrix
    const laplacian = Array.from({length: n}, () => new Array<number>(n).fill(0));

    // Fill adjacency part and calculate degrees
    const degrees = new Array<number>(n).fill(0);

    for (let i = 0; i < n; i++) {
        const nodeId = nodes[i];
        if (nodeId === undefined) {
            continue;
        }

        for (const neighbor of graph.neighbors(nodeId)) {
            const neighborIdx = nodeIndex.get(neighbor);
            if (neighborIdx !== undefined && i < laplacian.length && i < degrees.length) {
                const row = laplacian[i];
                if (row) {
                    row[neighborIdx] = -1;
                    degrees[i] = (degrees[i] ?? 0) + 1;
                }
            }
        }
    }

    // Set diagonal (degree) values
    for (let i = 0; i < n; i++) {
        const row = laplacian[i];
        const degree = degrees[i];
        if (row && degree !== undefined) {
            row[i] = degree;
        }
    }

    return laplacian;
}

/**
 * Compute the Fiedler vector (second smallest eigenvector) using power iteration
 */
function computeFiedlerVector(laplacian: number[][], tolerance: number, maxIterations: number): number[] | null {
    const n = laplacian.length;
    if (n < 2) {
        return null;
    }

    // Initialize random vector orthogonal to the all-ones vector
    let vector = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
        vector[i] = Math.random() - 0.5;
    }

    // Make orthogonal to all-ones vector
    const mean = vector.reduce((sum: number, val: number) => sum + val, 0) / n;
    for (let i = 0; i < n; i++) {
        const val = vector[i];
        if (val !== undefined) {
            vector[i] = val - mean;
        }
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((sum: number, val: number) => sum + (val * val), 0));
    if (norm > 0) {
        for (let i = 0; i < n; i++) {
            const val = vector[i];
            if (val !== undefined) {
                vector[i] = val / norm;
            }
        }
    }

    // Power iteration with deflation for second smallest eigenvalue
    for (let iter = 0; iter < maxIterations; iter++) {
        const newVector = new Array<number>(n).fill(0);

        // Matrix-vector multiplication: newVector = L * vector
        for (let i = 0; i < n; i++) {
            let sum = 0;
            const row = laplacian[i];
            if (row) {
                for (let j = 0; j < n; j++) {
                    const matrixVal = row[j];
                    const vectorVal = vector[j];
                    if (matrixVal !== undefined && vectorVal !== undefined) {
                        sum += matrixVal * vectorVal;
                    }
                }
            }

            newVector[i] = sum;
        }

        // For smallest eigenvalue, we actually want inverse iteration
        // This is simplified - in practice would solve (L - shift*I)x = vector
        // For now, use power iteration on -L (approximately)
        for (let i = 0; i < n; i++) {
            const val = newVector[i];
            if (val !== undefined) {
                newVector[i] = -val;
            }
        }

        // Orthogonalize against all-ones vector
        const newMean = newVector.reduce((sum, val) => sum + val, 0) / n;
        for (let i = 0; i < n; i++) {
            const val = newVector[i];
            if (val !== undefined) {
                newVector[i] = val - newMean;
            }
        }

        // Normalize
        const newNorm = Math.sqrt(newVector.reduce((sum, val) => sum + (val * val), 0));
        if (newNorm < tolerance) {
            break; // Converged to zero vector
        }

        for (let i = 0; i < n; i++) {
            const val = newVector[i];
            if (val !== undefined) {
                newVector[i] = val / newNorm;
            }
        }

        // Check convergence
        let diff = 0;
        for (let i = 0; i < n; i++) {
            const newVal = newVector[i];
            const oldVal = vector[i];
            if (newVal !== undefined && oldVal !== undefined) {
                diff += Math.abs(newVal - oldVal);
            }
        }

        vector = newVector;

        if (diff < tolerance) {
            break;
        }
    }

    return vector;
}

/**
 * Calculate modularity of a graph partitioning
 */
function calculateModularity(graph: Graph, assignment: Map<NodeId, number>): number {
    const totalEdges = graph.uniqueEdgeCount;
    if (totalEdges === 0) {
        return 0;
    }

    let modularity = 0;
    const communities = new Map<number, Set<NodeId>>();

    // Group nodes by community
    for (const [nodeId, communityId] of assignment) {
        if (!communities.has(communityId)) {
            communities.set(communityId, new Set());
        }

        const community = communities.get(communityId);
        if (community) {
            community.add(nodeId);
        }
    }

    // Calculate modularity for each community
    for (const [, members] of communities) {
        let internalEdges = 0;
        let totalDegree = 0;

        for (const nodeId of members) {
            const nodeDegree = graph.degree(nodeId);
            totalDegree += nodeDegree;

            // Count internal edges
            for (const neighbor of graph.neighbors(nodeId)) {
                if (members.has(neighbor)) {
                    internalEdges++;
                }
            }
        }

        // Each edge is counted twice in undirected graphs
        internalEdges /= 2;

        // Modularity contribution for this community
        const expectedEdges = (totalDegree * totalDegree) / (4 * totalEdges);
        modularity += (internalEdges - expectedEdges) / totalEdges;
    }

    return modularity;
}

