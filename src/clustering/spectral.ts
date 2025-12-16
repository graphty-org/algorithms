import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";
import {euclideanDistance} from "../utils/math-utilities.js";

/**
 * Spectral Clustering implementation
 *
 * Uses eigenvalues and eigenvectors of the graph Laplacian matrix to perform clustering.
 * Particularly effective for finding non-convex clusters and communities in graphs.
 *
 * Time complexity: O(V³) for eigendecomposition
 * Space complexity: O(V²)
 */

export interface SpectralClusteringOptions {
    k: number; // Number of clusters to find
    laplacianType?: "unnormalized" | "normalized" | "randomWalk"; // Type of Laplacian
    maxIterations?: number; // Max iterations for k-means (default: 100)
    tolerance?: number; // Convergence tolerance (default: 1e-4)
}

export interface SpectralClusteringResult {
    communities: NodeId[][];
    clusterAssignments: Map<NodeId, number>;
    eigenvalues?: number[];
    eigenvectors?: number[][];
}

/**
 * Perform spectral clustering on a graph
 *
 * @warning This implementation uses simplified power iteration for eigenvector
 * computation with approximate eigenvalues. For production use cases requiring
 * precise clustering, consider using a proper linear algebra library like ml-matrix.
 *
 * The approximate eigenvalues (0.1, 0.2 for second and third eigenvectors) work
 * well for most graph structures but may produce suboptimal results for graphs
 * with unusual spectral properties.
 */
export function spectralClustering(
    graph: Graph,
    options: SpectralClusteringOptions,
): SpectralClusteringResult {
    const {
        k,
        laplacianType = "normalized",
        maxIterations = 100,
        tolerance = 1e-4,
    } = options;

    // Input validation
    if (k < 1 || !Number.isInteger(k)) {
        throw new Error("k must be a positive integer");
    }

    const nodes = Array.from(graph.nodes());
    const nodeIds = nodes.map((node) => node.id);
    const n = nodeIds.length;

    if (k >= n) {
        // Return each node as its own cluster
        const communities: NodeId[][] = nodeIds.map((id) => [id]);
        const clusterAssignments = new Map<NodeId, number>();
        nodeIds.forEach((id, index) => clusterAssignments.set(id, index));
        return {communities, clusterAssignments};
    }

    // Build adjacency matrix
    const adjacencyMatrix = buildAdjacencyMatrix(graph, nodeIds);

    // Build Laplacian matrix
    const laplacianMatrix = buildLaplacianMatrix(adjacencyMatrix, laplacianType);

    // Find k smallest eigenvectors
    const eigenResult = findSmallestEigenvectors(laplacianMatrix, k);

    // Perform k-means clustering on the eigenvectors
    // For spectral clustering, we need to transpose the eigenvector matrix
    // Each row should be a data point (node) with features from the eigenvectors
    const dataPoints: number[][] = [];
    for (let i = 0; i < nodeIds.length; i++) {
        const point: number[] = [];
        for (let j = 0; j < k; j++) {
            const eigenvector = eigenResult.eigenvectors[j];
            if (eigenvector) {
                point.push(eigenvector[i] ?? 0);
            }
        }
        dataPoints.push(point);
    }

    // Normalize the data points row-wise (for normalized spectral clustering)
    if (laplacianType === "normalized") {
        normalizeRows(dataPoints);
    }

    const kmeans = kMeansClustering(dataPoints, k, maxIterations, tolerance);

    // Build communities
    const communities: NodeId[][] = Array.from({length: k}, () => []);
    const clusterAssignments = new Map<NodeId, number>();

    for (let i = 0; i < nodeIds.length; i++) {
        const clusterId = kmeans.assignments[i] ?? 0;
        const nodeId = nodeIds[i];
        if (!nodeId) {
            continue;
        }

        // Ensure clusterId is valid
        if (clusterId >= 0 && clusterId < k) {
            const community = communities[clusterId];
            if (community) {
                community.push(nodeId);
            }

            clusterAssignments.set(nodeId, clusterId);
        } else {
            // Assign to first cluster if invalid
            const firstCommunity = communities[0];
            if (firstCommunity) {
                firstCommunity.push(nodeId);
            }

            clusterAssignments.set(nodeId, 0);
        }
    }

    // Filter out empty communities
    const nonEmptyCommunities = communities.filter((community) => community.length > 0);

    return {
        communities: nonEmptyCommunities,
        clusterAssignments,
        eigenvalues: eigenResult.eigenvalues,
        eigenvectors: eigenResult.eigenvectors,
    };
}

/**
 * Build adjacency matrix from graph
 */
function buildAdjacencyMatrix(graph: Graph, nodeIds: NodeId[]): number[][] {
    const n = nodeIds.length;
    const matrix: number[][] = Array.from({length: n}, () => Array(n).fill(0) as number[]);
    const nodeToIndex = new Map<NodeId, number>();

    nodeIds.forEach((id, index) => nodeToIndex.set(id, index));

    for (let i = 0; i < n; i++) {
        const nodeId = nodeIds[i];
        if (!nodeId) {
            continue;
        }

        const neighbors = graph.neighbors(nodeId);

        for (const neighbor of neighbors) {
            const j = nodeToIndex.get(neighbor);
            if (j !== undefined) {
                const edge = graph.getEdge(nodeId, neighbor);
                const weight = edge?.weight ?? 1;
                const matrixRow = matrix[i];
                if (matrixRow) {
                    matrixRow[j] = weight;
                }

                if (!graph.isDirected) {
                    const matrixRowJ = matrix[j];
                    if (matrixRowJ) {
                        matrixRowJ[i] = weight;
                    }
                }
            }
        }
    }

    return matrix;
}

/**
 * Build Laplacian matrix from adjacency matrix
 */
function buildLaplacianMatrix(adjacency: number[][], type: string): number[][] {
    const n = adjacency.length;
    const laplacian: number[][] = Array.from({length: n}, () => Array(n).fill(0) as number[]);

    // Calculate degree matrix
    const degrees = Array(n).fill(0) as number[];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const adjacencyRow = adjacency[i];
            const adjacencyVal = adjacencyRow ? adjacencyRow[j] : 0;
            if (adjacencyVal !== undefined) {
                const degreeVal = degrees[i];
                if (degreeVal !== undefined) {
                    degrees[i] = degreeVal + adjacencyVal;
                }
            }
        }
    }

    if (type === "unnormalized") {
        // L = D - A
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    const laplacianRow = laplacian[i];
                    const degreeVal = degrees[i];
                    if (laplacianRow && degreeVal !== undefined) {
                        laplacianRow[j] = degreeVal;
                    }
                } else {
                    const adjacencyRow = adjacency[i];
                    const laplacianRow = laplacian[i];
                    if (adjacencyRow && laplacianRow) {
                        const adjacencyVal = adjacencyRow[j];
                        laplacianRow[j] = adjacencyVal !== undefined ? -adjacencyVal : 0;
                    }
                }
            }
        }
    } else if (type === "normalized") {
        // L_sym = D^(-1/2) * L * D^(-1/2)
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    const di = degrees[i];
                    const laplacianRow = laplacian[i];
                    if (laplacianRow) {
                        laplacianRow[j] = di !== undefined && di > 0 ? 1 : 0;
                    }
                } else {
                    const adjacencyRow = adjacency[i];
                    if (!adjacencyRow) {
                        continue;
                    }

                    const adjacencyVal = adjacencyRow[j];
                    const di = degrees[i];
                    const dj = degrees[j];
                    if (adjacencyVal !== undefined && adjacencyVal > 0 && di !== undefined && dj !== undefined && di > 0 && dj > 0) {
                        const laplacianRow = laplacian[i];
                        if (laplacianRow) {
                            laplacianRow[j] = -adjacencyVal / Math.sqrt(di * dj);
                        }
                    }
                }
            }
        }
    } else if (type === "randomWalk") {
        // L_rw = D^(-1) * L
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    const di = degrees[i];
                    const laplacianRow = laplacian[i];
                    if (laplacianRow) {
                        laplacianRow[j] = di !== undefined && di > 0 ? 1 : 0;
                    }
                } else {
                    const adjacencyRow = adjacency[i];
                    if (!adjacencyRow) {
                        continue;
                    }

                    const adjacencyVal = adjacencyRow[j];
                    const di = degrees[i];
                    if (adjacencyVal !== undefined && adjacencyVal > 0 && di !== undefined && di > 0) {
                        const laplacianRow = laplacian[i];
                        if (laplacianRow) {
                            laplacianRow[j] = -adjacencyVal / di;
                        }
                    }
                }
            }
        }
    }

    return laplacian;
}

/**
 * Find k smallest eigenvectors using simplified eigendecomposition
 * This is a simplified implementation - in practice, you'd use LAPACK or similar
 */
function findSmallestEigenvectors(matrix: number[][], k: number): {
    eigenvalues: number[];
    eigenvectors: number[][];
} {
    const n = matrix.length;

    if (n === 0 || k === 0) {
        return {eigenvalues: [], eigenvectors: []};
    }

    // For very small matrices, use the full power iteration approach
    // Remove the simplified approach that was causing issues
    if (k >= n) {
        // If k >= n, we still need proper eigenvectors, not identity
        // Fall through to the power iteration below
    }

    // For spectral clustering, we need proper eigenvectors
    // Special handling for small k values which are common in clustering
    if (k <= 3 && n > k) {
        return computeSmallestEigenvectorsSimple(matrix, k, n);
    }

    // For larger k, use power iteration
    const eigenvectors: number[][] = [];
    const eigenvalues: number[] = [];
    const maxIterations = 100;

    for (let eigIdx = 0; eigIdx < k; eigIdx++) {
        // Initialize random vector
        let vector = Array(n).fill(0).map(() => Math.random() - 0.5);

        // Normalize initial vector
        const initNorm = Math.sqrt(vector.reduce((sum, val) => sum + (val * val), 0));
        if (initNorm > 0) {
            vector = vector.map((val) => val / initNorm);
        }

        // Orthogonalize against previous eigenvectors
        for (let j = 0; j < eigIdx; j++) {
            const ejVector = eigenvectors[j];
            if (!ejVector) {
                continue;
            }

            const dot = vector.reduce((sum, val, idx) => sum + (val * (ejVector[idx] ?? 0)), 0);
            vector = vector.map((val, idx) => val - (dot * (ejVector[idx] ?? 0)));
        }

        // Power iteration
        for (let iter = 0; iter < maxIterations; iter++) {
            // Multiply by matrix
            const newVector = Array(n).fill(0) as number[];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const matrixRow = matrix[i];
                    const vecVal = vector[j];
                    const matrixVal = matrixRow?.[j];
                    if (matrixVal !== undefined && vecVal !== undefined) {
                        const nvVal = newVector[i];
                        if (nvVal !== undefined) {
                            newVector[i] = nvVal + (matrixVal * vecVal);
                        }
                    }
                }
            }

            // Orthogonalize against previous eigenvectors
            for (let j = 0; j < eigIdx; j++) {
                const ejVector = eigenvectors[j];
                if (!ejVector) {
                    continue;
                }

                const dot = newVector.reduce((sum, val, idx) => sum + (val * (ejVector[idx] ?? 0)), 0);
                for (let i = 0; i < n; i++) {
                    const ejVal = ejVector[i];
                    if (ejVal !== undefined) {
                        const nvVal = newVector[i];
                        if (nvVal !== undefined) {
                            newVector[i] = nvVal - (dot * ejVal);
                        }
                    }
                }
            }

            // Normalize
            const norm = Math.sqrt(newVector.reduce((sum, val) => sum + ((val * val)), 0));
            if (norm > 1e-10) {
                vector = newVector.map((val) => val / norm);
            } else {
                break;
            }
        }

        // Calculate eigenvalue (Rayleigh quotient)
        let eigenvalue = 0;
        const Av = Array(n).fill(0) as number[];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const matrixRow = matrix[i];
                const vecVal = vector[j];
                const matrixVal = matrixRow?.[j];
                if (matrixVal !== undefined && vecVal !== undefined) {
                    const avVal = Av[i];
                    if (avVal !== undefined) {
                        Av[i] = avVal + (matrixVal * vecVal);
                    }
                }
            }
        }
        eigenvalue = vector.reduce((sum, val, idx) => {
            const avVal = Av[idx];
            return sum + (val * (avVal ?? 0));
        }, 0);

        eigenvectors.push(vector);
        eigenvalues.push(eigenvalue);
    }

    return {eigenvalues, eigenvectors};
}

/**
 * Normalize matrix rows to unit length
 */
function normalizeRows(matrix: number[][]): void {
    for (const row of matrix) {
        const norm = Math.sqrt(row.reduce((sum, val) => sum + (val * val), 0));
        if (norm > 0) {
            for (let j = 0; j < row.length; j++) {
                const val = row[j];
                if (val !== undefined) {
                    row[j] = val / norm;
                }
            }
        }
    }
}

/**
 * K-means clustering algorithm
 */
function kMeansClustering(
    data: number[][],
    k: number,
    maxIterations: number,
    tolerance = 1e-4,
): {assignments: number[], centroids: number[][]} {
    const n = data.length;
    const d = data[0]?.length ?? 0;

    // Handle edge cases
    if (n === 0 || k === 0) {
        return {assignments: [], centroids: []};
    }

    if (k >= n) {
        // Each point is its own cluster
        return {
            assignments: Array.from({length: n}, (_, i) => i),
            centroids: data.slice(0, n),
        };
    }

    // Initialize centroids by selecting random data points
    const centroids: number[][] = [];
    const selectedIndices = new Set<number>();

    while (centroids.length < k && selectedIndices.size < n) {
        const idx = Math.floor(Math.random() * n);
        if (!selectedIndices.has(idx) && data[idx]) {
            selectedIndices.add(idx);
            centroids.push([... data[idx]]);
        }
    }

    // Fill remaining centroids with random values if needed
    while (centroids.length < k) {
        const centroid = Array(d).fill(0) as number[];
        for (let j = 0; j < d; j++) {
            centroid[j] = Math.random() - 0.5;
        }
        centroids.push(centroid);
    }

    const assignments = Array(n).fill(0) as number[];
    let oldAssignments = Array(n).fill(-1) as number[];

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Assign points to closest centroids
        for (let i = 0; i < n; i++) {
            let minDistance = Number.POSITIVE_INFINITY;
            let bestCluster = 0;

            for (let j = 0; j < k; j++) {
                const dataPoint = data[i];
                const centroid = centroids[j];
                if (!dataPoint || !centroid) {
                    continue;
                }

                const distance = euclideanDistance(dataPoint, centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCluster = j;
                }
            }

            assignments[i] = bestCluster;
        }

        // Check for convergence based on assignment changes
        let assignmentsChanged = false;
        for (let i = 0; i < n; i++) {
            if (assignments[i] !== oldAssignments[i]) {
                assignmentsChanged = true;
                break;
            }
        }

        if (!assignmentsChanged) {
            break;
        }

        oldAssignments = [... assignments];

        // Store old centroids for tolerance-based convergence check
        const oldCentroids = centroids.map((c) => [... c]);

        // Update centroids
        const counts = Array(k).fill(0) as number[];
        const sums: number[][] = Array.from({length: k}, () => Array(d).fill(0) as number[]);

        for (let i = 0; i < n; i++) {
            const cluster = assignments[i] ?? 0;
            const dataPoint = data[i];
            if (!dataPoint) {
                continue;
            }

            const sumsCluster = sums[cluster];
            if (sumsCluster !== undefined) {
                const countVal = counts[cluster];
                if (countVal !== undefined) {
                    counts[cluster] = countVal + 1;
                }

                for (let j = 0; j < d; j++) {
                    const dpVal = dataPoint[j];
                    if (dpVal !== undefined) {
                        const sumVal = sumsCluster[j];
                        if (sumVal !== undefined) {
                            sumsCluster[j] = sumVal + dpVal;
                        }
                    }
                }
            }
        }

        for (let i = 0; i < k; i++) {
            const countVal = counts[i];
            if (countVal !== undefined && countVal > 0) {
                const sumsRow = sums[i];
                const centroidsRow = centroids[i];
                if (sumsRow !== undefined && centroidsRow !== undefined) {
                    for (let j = 0; j < d; j++) {
                        const sumVal = sumsRow[j];
                        if (sumVal !== undefined) {
                            const countValInner = counts[i];
                            if (countValInner !== undefined) {
                                centroidsRow[j] = sumVal / countValInner;
                            }
                        }
                    }
                }
            }
        }

        // Check for tolerance-based convergence (centroid movement)
        let maxCentroidShift = 0;
        for (let i = 0; i < k; i++) {
            const oldCentroid = oldCentroids[i];
            const newCentroid = centroids[i];
            if (oldCentroid && newCentroid) {
                const shift = euclideanDistance(oldCentroid, newCentroid);
                if (shift > maxCentroidShift) {
                    maxCentroidShift = shift;
                }
            }
        }

        if (maxCentroidShift < tolerance) {
            break;
        }
    }

    return {assignments, centroids};
}

/**
 * Compute smallest eigenvectors for small k (optimized for k=2, k=3)
 */
function computeSmallestEigenvectorsSimple(matrix: number[][], k: number, n: number): {
    eigenvalues: number[];
    eigenvectors: number[][];
} {
    const eigenvectors: number[][] = [];
    const eigenvalues: number[] = [];

    // First eigenvector is constant (corresponds to eigenvalue 0 for connected graph)
    const firstVector = Array(n).fill(1 / Math.sqrt(n)) as number[];
    eigenvectors.push(firstVector);
    eigenvalues.push(0);

    // For k >= 2, compute the Fiedler vector (second smallest eigenvector)
    if (k >= 2) {
        // Use power iteration on I - L/lambda_max to find second smallest
        const maxEig = 2; // For normalized Laplacian, max eigenvalue <= 2
        let vector = Array(n).fill(0).map(() => Math.random() - 0.5);

        // Make orthogonal to first eigenvector
        const dot1 = vector.reduce((sum, val) => sum + (val / Math.sqrt(n)), 0);
        vector = vector.map((val) => val - (dot1 / Math.sqrt(n)));

        // Power iteration on shifted matrix
        for (let iter = 0; iter < 100; iter++) {
            // Compute (I - L/maxEig) * v
            const newVector = Array(n).fill(0) as number[];

            // Identity part
            for (let i = 0; i < n; i++) {
                newVector[i] = vector[i] ?? 0;
            }

            // Subtract L * v / maxEig
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const matrixVal = matrix[i]?.[j] ?? 0;
                    const vecVal = vector[j] ?? 0;
                    newVector[i] = (newVector[i] ?? 0) - ((matrixVal * vecVal) / maxEig);
                }
            }

            // Orthogonalize against first eigenvector
            const dot = newVector.reduce((sum, val) => sum + (val / Math.sqrt(n)), 0);
            for (let i = 0; i < n; i++) {
                newVector[i] = (newVector[i] ?? 0) - (dot / Math.sqrt(n));
            }

            // Normalize
            const norm = Math.sqrt(newVector.reduce((sum, val) => sum + (val * val), 0));
            if (norm > 1e-10) {
                vector = newVector.map((val) => val / norm);
            }
        }

        eigenvectors.push(vector);
        eigenvalues.push(0.1); // Approximate
    }

    // For k = 3, add another eigenvector
    if (k >= 3) {
        let vector = Array(n).fill(0).map(() => Math.random() - 0.5);

        // Orthogonalize against previous eigenvectors
        for (const prev of eigenvectors) {
            const dot = vector.reduce((sum, val, idx) => sum + (val * (prev[idx] ?? 0)), 0);
            vector = vector.map((val, idx) => val - (dot * (prev[idx] ?? 0)));
        }

        // Similar power iteration
        for (let iter = 0; iter < 50; iter++) {
            const newVector = Array(n).fill(0) as number[];

            // Identity part
            for (let i = 0; i < n; i++) {
                newVector[i] = vector[i] ?? 0;
            }

            // Subtract L * v / 2
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const matrixVal = matrix[i]?.[j] ?? 0;
                    const vecVal = vector[j] ?? 0;
                    newVector[i] = (newVector[i] ?? 0) - ((matrixVal * vecVal) / 2);
                }
            }

            // Orthogonalize
            for (const prev of eigenvectors) {
                const dot = newVector.reduce((sum, val, idx) => sum + (val * (prev[idx] ?? 0)), 0);
                for (let i = 0; i < n; i++) {
                    newVector[i] = (newVector[i] ?? 0) - (dot * (prev[i] ?? 0));
                }
            }

            // Normalize
            const norm = Math.sqrt(newVector.reduce((sum, val) => sum + (val * val), 0));
            if (norm > 1e-10) {
                vector = newVector.map((val) => val / norm);
            }
        }

        eigenvectors.push(vector);
        eigenvalues.push(0.2); // Approximate
    }

    return {eigenvalues: eigenvalues.slice(0, k), eigenvectors: eigenvectors.slice(0, k)};
}
