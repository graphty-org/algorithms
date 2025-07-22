import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";

/**
 * Markov Clustering (MCL) algorithm implementation
 *
 * MCL simulates flow in graphs and finds clusters based on the notion that
 * random walks stay within clusters and rarely move between clusters.
 * The algorithm alternates between expansion (matrix squaring) and
 * inflation (element-wise powering and normalization).
 *
 * Time complexity: O(V³) per iteration
 * Space complexity: O(V²)
 */

export interface MCLOptions {
    expansion?: number; // Expansion parameter (default: 2)
    inflation?: number; // Inflation parameter (default: 2)
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number; // Convergence tolerance (default: 1e-6)
    pruningThreshold?: number; // Pruning threshold (default: 1e-5)
    selfLoops?: boolean; // Add self-loops (default: true)
}

export interface MCLResult {
    communities: NodeId[][];
    attractors: Set<NodeId>; // Attractor nodes (cluster representatives)
    iterations: number;
    converged: boolean;
}

/**
 * Perform Markov Clustering on a graph
 */
export function markovClustering(
    graph: Graph,
    options: MCLOptions = {},
): MCLResult {
    const {
        expansion = 2,
        inflation = 2,
        maxIterations = 100,
        tolerance = 1e-6,
        pruningThreshold = 1e-5,
        selfLoops = true,
    } = options;

    const nodes = Array.from(graph.nodes());
    const nodeIds = nodes.map((node) => node.id);
    const n = nodeIds.length;

    if (n === 0) {
        return {
            communities: [],
            attractors: new Set(),
            iterations: 0,
            converged: true,
        };
    }

    // Build initial transition matrix
    let matrix = buildTransitionMatrix(graph, nodeIds, selfLoops);

    let converged = false;
    let iteration = 0;

    for (iteration = 0; iteration < maxIterations; iteration++) {
        const oldMatrix = matrix.map((row) => [... row]);

        // Expansion step (matrix multiplication)
        matrix = matrixPower(matrix, expansion);

        // Inflation step (element-wise powering and column normalization)
        matrix = inflate(matrix, inflation);

        // Pruning step (remove small values)
        matrix = prune(matrix, pruningThreshold);

        // Check for convergence
        if (hasConverged(oldMatrix, matrix, tolerance)) {
            converged = true;
            break;
        }
    }

    // Extract clusters from final matrix
    const {communities, attractors} = extractClusters(matrix, nodeIds);

    return {
        communities,
        attractors,
        iterations: iteration + 1,
        converged,
    };
}

/**
 * Build initial transition matrix from graph
 */
function buildTransitionMatrix(graph: Graph, nodeIds: NodeId[], selfLoops: boolean): number[][] {
    const n = nodeIds.length;
    const matrix = Array.from({length: n}, (): number[] => Array(n).fill(0) as number[]);
    const nodeToIndex = new Map<NodeId, number>();

    nodeIds.forEach((id, index) => nodeToIndex.set(id, index));

    // Fill adjacency values
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
                const row = matrix[i];
                if (!row) {
                    continue;
                }

                row[j] = weight;
            }
        }

        // Add self-loops
        if (selfLoops) {
            const row = matrix[i];
            if (!row) {
                continue;
            }

            row[i] = 1;
        }
    }

    // Column-normalize the matrix
    for (let j = 0; j < n; j++) {
        let colSum = 0;
        for (let i = 0; i < n; i++) {
            const val = matrix[i]?.[j];
            if (val !== undefined) {
                colSum += val;
            }
        }

        if (colSum > 0) {
            for (let i = 0; i < n; i++) {
                const row = matrix[i];
                if (!row) {
                    continue;
                }

                const val = row[j];
                if (val !== undefined) {
                    row[j] = val / colSum;
                }
            }
        }
    }

    return matrix;
}

/**
 * Raise matrix to a power (for expansion step)
 */
function matrixPower(matrix: number[][], power: number): number[][] {
    if (power === 1) {
        return matrix;
    }

    if (power === 2) {
        return matrixMultiply(matrix, matrix);
    }

    let result = matrix;
    for (let i = 1; i < power; i++) {
        result = matrixMultiply(result, matrix);
    }
    return result;
}

/**
 * Multiply two matrices
 */
function matrixMultiply(a: number[][], b: number[][]): number[][] {
    const n = a.length;
    const m = b[0]?.length ?? 0;
    const p = b.length;

    const result: number[][] = Array.from({length: n}, () => Array(m).fill(0) as number[]);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            for (let k = 0; k < p; k++) {
                const aVal = a[i]?.[k] ?? 0;
                const bVal = b[k]?.[j] ?? 0;
                const resultRow = result[i];
                if (!resultRow) {
                    continue;
                }

                const prevVal = resultRow[j];
                if (prevVal !== undefined) {
                    resultRow[j] = prevVal + (aVal * bVal);
                }
            }
        }
    }

    return result;
}

/**
 * Inflation step: element-wise powering and column normalization
 */
function inflate(matrix: number[][], inflation: number): number[][] {
    const n = matrix.length;
    const result: number[][] = Array.from({length: n}, () => Array(n).fill(0) as number[]);

    // Element-wise powering
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const val = matrix[i]?.[j];
            if (val !== undefined) {
                const resultRow = result[i];
                if (resultRow) {
                    resultRow[j] = Math.pow(val, inflation);
                }
            }
        }
    }

    // Column normalization
    for (let j = 0; j < n; j++) {
        let colSum = 0;
        for (let i = 0; i < n; i++) {
            const val = result[i]?.[j];
            if (val !== undefined) {
                colSum += val;
            }
        }

        if (colSum > 0) {
            for (let i = 0; i < n; i++) {
                const row = result[i];
                if (!row) {
                    continue;
                }

                const val = row[j];
                if (val !== undefined) {
                    row[j] = val / colSum;
                }
            }
        }
    }

    return result;
}

/**
 * Pruning step: remove small values
 */
function prune(matrix: number[][], threshold: number): number[][] {
    const n = matrix.length;
    const result: number[][] = Array.from({length: n}, () => Array(n).fill(0) as number[]);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const matrixRow = matrix[i];
            if (!matrixRow) {
                continue;
            }

            const matrixVal = matrixRow[j];
            if (matrixVal !== undefined && matrixVal >= threshold) {
                const resultRow = result[i];
                if (resultRow) {
                    resultRow[j] = matrixVal;
                }
            }
        }
    }

    // Re-normalize columns after pruning
    for (let j = 0; j < n; j++) {
        let colSum = 0;
        for (let i = 0; i < n; i++) {
            const resultRow = result[i];
            if (!resultRow) {
                continue;
            }

            const val = resultRow[j];
            if (val !== undefined) {
                colSum += val;
            }
        }

        if (colSum > 0) {
            for (let i = 0; i < n; i++) {
                const resultRow = result[i];
                if (!resultRow) {
                    continue;
                }

                const val = resultRow[j];
                if (val !== undefined) {
                    resultRow[j] = val / colSum;
                }
            }
        }
    }

    return result;
}

/**
 * Check if the algorithm has converged
 */
function hasConverged(oldMatrix: number[][], newMatrix: number[][], tolerance: number): boolean {
    const n = oldMatrix.length;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const oldRow = oldMatrix[i];
            const newRow = newMatrix[i];
            if (!oldRow || !newRow) {
                continue;
            }

            const oldVal = oldRow[j];
            const newVal = newRow[j];
            if (oldVal !== undefined && newVal !== undefined && Math.abs(oldVal - newVal) > tolerance) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Extract clusters from the final matrix
 */
function extractClusters(matrix: number[][], nodeIds: NodeId[]): {
    communities: NodeId[][];
    attractors: Set<NodeId>;
} {
    const n = matrix.length;
    const attractors = new Set<NodeId>();
    const communities: NodeId[][] = [];
    const nodeToCluster = new Map<number, number>();

    // Find attractors (columns with non-zero diagonal elements)
    for (let i = 0; i < n; i++) {
        const matrixRow = matrix[i];
        if (!matrixRow) {
            continue;
        }

        const diagonalVal = matrixRow[i];
        const nodeId = nodeIds[i];
        if (diagonalVal !== undefined && diagonalVal > 0 && nodeId !== undefined) {
            attractors.add(nodeId);
        }
    }

    // Assign nodes to clusters based on columns
    let clusterIndex = 0;
    for (let j = 0; j < n; j++) {
        // Find nodes that belong to this cluster (column)
        const clusterNodes: number[] = [];
        for (let i = 0; i < n; i++) {
            const matrixRow = matrix[i];
            if (!matrixRow) {
                continue;
            }

            const val = matrixRow[j];
            if (val !== undefined && val > 0 && !nodeToCluster.has(i)) {
                clusterNodes.push(i);
                nodeToCluster.set(i, clusterIndex);
            }
        }

        if (clusterNodes.length > 0) {
            communities.push(clusterNodes.map((idx) => {
                const nodeId = nodeIds[idx];
                return nodeId;
            }).filter((node): node is NodeId => node !== undefined));
            clusterIndex++;
        }
    }

    // Handle isolated nodes
    for (let i = 0; i < n; i++) {
        if (!nodeToCluster.has(i)) {
            const nodeId = nodeIds[i];
            if (nodeId !== undefined) {
                communities.push([nodeId]);
            }

            nodeToCluster.set(i, clusterIndex++);
        }
    }

    return {communities, attractors};
}

/**
 * Calculate modularity of MCL clustering result
 */
export function calculateMCLModularity(
    graph: Graph,
    communities: NodeId[][],
): number {
    const m = graph.totalEdgeCount;
    if (m === 0) {
        return 0;
    }

    let modularity = 0;
    const communityMap = new Map<NodeId, number>();

    // Build community map
    communities.forEach((community, index) => {
        community.forEach((nodeId) => {
            communityMap.set(nodeId, index);
        });
    });

    // Calculate modularity
    for (const edge of graph.edges()) {
        const sourceCommunity = communityMap.get(edge.source);
        const targetCommunity = communityMap.get(edge.target);

        if (sourceCommunity !== undefined && targetCommunity !== undefined && sourceCommunity === targetCommunity) {
            modularity += 1;
        }

        const sourceDegree = graph.degree(edge.source);
        const targetDegree = graph.degree(edge.target);
        modularity -= (sourceDegree * targetDegree) / (2 * m);
    }

    return modularity / (2 * m);
}
