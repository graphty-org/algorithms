import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";
import {euclideanDistance, SeededRandom} from "../utils/math-utilities.js";

/**
 * Configuration options for the SynC (Synergistic Deep Graph Clustering) algorithm
 */
export interface SynCConfig {
    /** Number of clusters to find */
    numClusters: number;
    /** Maximum number of iterations for convergence */
    maxIterations?: number;
    /** Convergence tolerance */
    tolerance?: number;
    /** Random seed for reproducibility */
    seed?: number;
    /** Learning rate for optimization */
    learningRate?: number;
    /** Regularization parameter */
    lambda?: number;
}

/**
 * Result of the SynC clustering algorithm
 */
export interface SynCResult {
    /** Cluster assignments for each node */
    clusters: Map<NodeId, number>;
    /** Final loss value */
    loss: number;
    /** Number of iterations performed */
    iterations: number;
    /** Node embeddings learned by the algorithm */
    embeddings: Map<NodeId, number[]>;
    /** Whether the algorithm converged */
    converged: boolean;
}

/**
 * Synergistic Deep Graph Clustering (SynC) Algorithm
 *
 * This algorithm combines representation learning with structure augmentation
 * for improved clustering performance on graphs. It jointly optimizes node
 * embeddings and cluster assignments while preserving graph structure.
 *
 * Based on: "Synergistic Deep Graph Clustering" (arXiv:2406.15797, June 2024)
 *
 * @param graph - Input graph to cluster
 * @param config - Configuration options
 * @returns Clustering result with assignments and embeddings
 */
export function syncClustering(graph: Graph, config: SynCConfig): SynCResult {
    const {
        numClusters,
        maxIterations = 100,
        tolerance = 1e-6,
        seed = 42,
        learningRate = 0.01,
        lambda = 0.1,
    } = config;

    // Set random seed for reproducibility (save original)
    const originalRandom = Math.random;
    const rng = SeededRandom.createGenerator(seed);
    Math.random = rng;

    const nodes = Array.from(graph.nodes());
    const nodeCount = nodes.length;

    if (nodeCount === 0) {
        return {
            clusters: new Map(),
            loss: 0,
            iterations: 0,
            embeddings: new Map(),
            converged: true,
        };
    }

    if (numClusters <= 0 || numClusters > nodeCount) {
        throw new Error(`Invalid number of clusters: ${String(numClusters)}. Must be between 1 and ${String(nodeCount)}`);
    }

    // Initialize node embeddings (simplified version using graph features)
    const embeddingDim = Math.min(64, nodeCount);
    const embeddings = new Map<NodeId, number[]>();

    // Initialize embeddings based on node features
    for (const node of nodes) {
        const embedding = initializeNodeEmbedding(graph, node.id, embeddingDim);
        embeddings.set(node.id, embedding);
    }

    // Initialize cluster centers
    const clusterCenters = initializeClusterCenters(embeddings, numClusters);

    let previousLoss = Infinity;
    let iterations = 0;
    let converged = false;

    for (iterations = 0; iterations < maxIterations; iterations++) {
        // E-step: Assign nodes to clusters
        const clusters = new Map<NodeId, number>();

        for (const node of nodes) {
            const nodeEmbedding = embeddings.get(node.id);
            if (!nodeEmbedding) {
                continue;
            }

            let bestCluster = 0;
            let minDistance = Infinity;

            for (let k = 0; k < numClusters; k++) {
                const center = clusterCenters[k];
                if (!center) {
                    continue;
                }

                const distance = euclideanDistance(nodeEmbedding, center);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCluster = k;
                }
            }

            clusters.set(node.id, bestCluster);
        }

        // M-step: Update embeddings and cluster centers
        updateEmbeddings(graph, embeddings, clusters, learningRate, lambda);
        updateClusterCenters(embeddings, clusters, clusterCenters, numClusters);

        // Calculate current loss
        const currentLoss = calculateLoss(graph, embeddings, clusters, clusterCenters, lambda);

        // Check for convergence
        if (Math.abs(previousLoss - currentLoss) < tolerance) {
            converged = true;
            break;
        }

        previousLoss = currentLoss;
    }

    // Final cluster assignment
    const finalClusters = new Map<NodeId, number>();
    for (const node of nodes) {
        const nodeEmbedding = embeddings.get(node.id);
        if (!nodeEmbedding) {
            continue;
        }

        let bestCluster = 0;
        let minDistance = Infinity;

        for (let k = 0; k < numClusters; k++) {
            const center = clusterCenters[k];
            if (!center) {
                continue;
            }

            const distance = euclideanDistance(nodeEmbedding, center);
            if (distance < minDistance) {
                minDistance = distance;
                bestCluster = k;
            }
        }

        finalClusters.set(node.id, bestCluster);
    }

    // Restore original random function
    Math.random = originalRandom;

    return {
        clusters: finalClusters,
        loss: previousLoss,
        iterations: iterations + 1,
        embeddings,
        converged,
    };
}

/**
 * Initialize node embedding based on graph structure and features
 */
function initializeNodeEmbedding(graph: Graph, nodeId: NodeId, dim: number): number[] {
    const embedding = new Array<number>(dim).fill(0);

    // Use node degree as a base feature
    const degree = graph.degree(nodeId);
    const normalizedDegree = degree / Math.max(1, graph.nodeCount - 1);

    // Initialize with small random values influenced by graph structure
    for (let i = 0; i < dim; i++) {
        embedding[i] = ((Math.random() - 0.5) * 0.1) + (normalizedDegree * 0.1);
    }

    return embedding;
}

/**
 * Initialize cluster centers using k-means++ style initialization
 */
function initializeClusterCenters(embeddings: Map<NodeId, number[]>, numClusters: number): number[][] {
    const embeddingArray = Array.from(embeddings.values());
    const centers: number[][] = [];

    // Choose first center randomly
    const firstCenter = embeddingArray[Math.floor(Math.random() * embeddingArray.length)];
    if (firstCenter) {
        centers.push([... firstCenter] as number[]);
    }

    // Choose remaining centers using k-means++ initialization
    for (let k = 1; k < numClusters; k++) {
        const distances: number[] = [];
        let totalDistance = 0;

        for (const embedding of embeddingArray) {
            let minDistance = Infinity;
            for (const center of centers) {
                const distance = euclideanDistance(embedding, center);
                minDistance = Math.min(minDistance, distance);
            }
            distances.push(minDistance * minDistance);
            totalDistance += minDistance * minDistance;
        }

        // Choose next center with probability proportional to squared distance
        let randomValue = Math.random() * totalDistance;
        for (let i = 0; i < embeddingArray.length; i++) {
            const distanceValue = distances[i];
            if (distanceValue !== undefined) {
                randomValue -= distanceValue;
            }

            if (randomValue <= 0) {
                const newCenter = embeddingArray[i];
                if (newCenter) {
                    centers.push([... newCenter] as number[]);
                }

                break;
            }
        }
    }

    return centers;
}

/**
 * Update node embeddings using gradient descent
 */
function updateEmbeddings(
    graph: Graph,
    embeddings: Map<NodeId, number[]>,
    clusters: Map<NodeId, number>,
    learningRate: number,
    lambda: number,
): void {
    const gradients = new Map<NodeId, number[]>();

    // Initialize gradients
    for (const [nodeId, embedding] of embeddings) {
        gradients.set(nodeId, new Array<number>(embedding.length).fill(0));
    }

    // Calculate gradients based on graph structure (simplified)
    for (const node of graph.nodes()) {
        const nodeId = node.id;
        const nodeEmbedding = embeddings.get(nodeId);
        if (!nodeEmbedding) {
            continue;
        }

        const gradient = gradients.get(nodeId);
        if (!gradient) {
            continue;
        }

        // Neighbor reconstruction loss gradient
        for (const neighborId of graph.neighbors(nodeId)) {
            const neighborEmbedding = embeddings.get(neighborId);
            if (!neighborEmbedding) {
                continue;
            }

            const diff = nodeEmbedding.map((val: number, i: number) => val - (neighborEmbedding[i] ?? 0));

            for (let i = 0; i < gradient.length; i++) {
                const gradVal = gradient[i];
                const diffVal = diff[i];
                if (gradVal !== undefined && diffVal !== undefined) {
                    gradient[i] = gradVal + (lambda * diffVal);
                }
            }
        }

        // Regularization gradient
        for (let i = 0; i < gradient.length; i++) {
            const gradVal = gradient[i];
            const nodeVal = nodeEmbedding[i];
            if (gradVal !== undefined && nodeVal !== undefined) {
                gradient[i] = gradVal + (lambda * nodeVal);
            }
        }
    }

    // Update embeddings
    for (const [nodeId, embedding] of embeddings) {
        const gradient = gradients.get(nodeId);
        if (!gradient) {
            continue;
        }

        for (let i = 0; i < embedding.length; i++) {
            const embVal = embedding[i];
            const gradVal = gradient[i];
            if (embVal !== undefined && gradVal !== undefined) {
                embedding[i] = embVal - (learningRate * gradVal);
            }
        }
    }
}

/**
 * Update cluster centers based on current assignments
 */
function updateClusterCenters(
    embeddings: Map<NodeId, number[]>,
    clusters: Map<NodeId, number>,
    clusterCenters: number[][],
    numClusters: number,
): void {
    const dimensions = clusterCenters[0]?.length ?? 0;
    const clusterSums: number[][] = Array.from({length: numClusters}, () =>
        new Array(dimensions).fill(0) as number[],
    );
    const clusterCounts = new Array<number>(numClusters).fill(0);

    // Sum embeddings for each cluster
    for (const [nodeId, clusterIdx] of clusters) {
        const embedding = embeddings.get(nodeId);
        if (!embedding) {
            continue;
        }

        for (let i = 0; i < embedding.length; i++) {
            const clusterSum = clusterSums[clusterIdx];
            if (!clusterSum) {
                continue;
            }

            const sumVal = clusterSum[i];
            const embVal = embedding[i];
            if (sumVal !== undefined && embVal !== undefined) {
                clusterSum[i] = sumVal + embVal;
            }
        }
        if (clusterCounts[clusterIdx] !== undefined) {
            clusterCounts[clusterIdx]++;
        }
    }

    // Update cluster centers (average of assigned embeddings)
    for (let k = 0; k < numClusters; k++) {
        const count = clusterCounts[k];
        const center = clusterCenters[k];
        const sum = clusterSums[k];
        if (count !== undefined && count > 0 && center && sum) {
            for (let i = 0; i < center.length; i++) {
                const sumVal = sum[i];
                if (sumVal !== undefined) {
                    center[i] = sumVal / count;
                }
            }
        }
    }
}

/**
 * Calculate the total loss function
 */
function calculateLoss(
    graph: Graph,
    embeddings: Map<NodeId, number[]>,
    clusters: Map<NodeId, number>,
    clusterCenters: number[][],
    lambda: number,
): number {
    let clusteringLoss = 0;
    let reconstructionLoss = 0;
    let regularizationLoss = 0;

    // Clustering loss (distance to cluster centers)
    for (const [nodeId, clusterIdx] of clusters) {
        const embedding = embeddings.get(nodeId);
        if (!embedding) {
            continue;
        }

        const center = clusterCenters[clusterIdx];
        if (!center) {
            continue;
        }

        clusteringLoss += euclideanDistance(embedding, center) ** 2;
    }

    // Graph reconstruction loss
    for (const node of graph.nodes()) {
        const nodeId = node.id;
        const nodeEmbedding = embeddings.get(nodeId);
        if (!nodeEmbedding) {
            continue;
        }

        for (const neighborId of graph.neighbors(nodeId)) {
            const neighborEmbedding = embeddings.get(neighborId);
            if (!neighborEmbedding) {
                continue;
            }

            const distance = euclideanDistance(nodeEmbedding, neighborEmbedding);
            reconstructionLoss += distance ** 2;
        }
    }

    // Regularization loss
    for (const embedding of embeddings.values()) {
        for (const value of embedding) {
            regularizationLoss += value ** 2;
        }
    }

    return clusteringLoss + (lambda * reconstructionLoss) + (lambda * regularizationLoss);
}

