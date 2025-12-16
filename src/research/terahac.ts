import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";

/**
 * Configuration options for the TeraHAC (Hierarchical Agglomerative Clustering) algorithm
 */
export interface TeraHACConfig {
    /** Linkage criterion: 'single', 'complete', 'average', 'ward' */
    linkage?: "single" | "complete" | "average" | "ward";
    /** Number of clusters to stop at (optional) */
    numClusters?: number;
    /** Distance threshold to stop clustering */
    distanceThreshold?: number;
    /** Maximum number of nodes to process efficiently */
    maxNodes?: number;
    /** Use graph structure for distance calculation */
    useGraphDistance?: boolean;
    /** Custom warning handler (default: console.warn) */
    onWarning?: (message: string) => void;
}

/**
 * Represents a node in the dendrogram/cluster hierarchy
 */
export interface ClusterNode {
    /** Unique identifier for this cluster */
    id: string;
    /** Node IDs in this cluster */
    members: Set<NodeId>;
    /** Left child cluster (if internal node) */
    left?: ClusterNode;
    /** Right child cluster (if internal node) */
    right?: ClusterNode;
    /** Distance at which this cluster was formed */
    distance: number;
    /** Size of the cluster */
    size: number;
}

/**
 * Result of the TeraHAC clustering algorithm
 */
export interface TeraHACResult {
    /** Root of the dendrogram */
    dendrogram: ClusterNode;
    /** Flat clustering at specified level */
    clusters: Map<NodeId, number>;
    /** All merge distances in order */
    distances: number[];
    /** Number of clusters in final result */
    numClusters: number;
}

/**
 * TeraHAC - Hierarchical Agglomerative Clustering for Large Graphs
 *
 * This algorithm performs hierarchical clustering on graphs by iteratively
 * merging the closest clusters. Optimized for scalability to handle large
 * graphs efficiently.
 *
 * Based on: "Scaling Hierarchical Agglomerative Clustering to Trillion-Edge Graphs"
 * Google Research 2024
 *
 * @param graph - Input graph to cluster
 * @param config - Configuration options
 * @returns Hierarchical clustering result
 */
export function teraHAC(graph: Graph, config: TeraHACConfig = {}): TeraHACResult {
    const {
        linkage = "average",
        numClusters,
        distanceThreshold,
        maxNodes = 10000,
        useGraphDistance = true,
        onWarning = console.warn,
    } = config;

    // Input validation
    if (numClusters !== undefined && (numClusters < 1 || !Number.isInteger(numClusters))) {
        throw new Error("numClusters must be a positive integer");
    }

    const nodes = Array.from(graph.nodes());
    const nodeCount = nodes.length;

    if (nodeCount === 0) {
        throw new Error("Cannot cluster empty graph");
    }

    if (nodeCount > maxNodes) {
        onWarning(`Graph has ${String(nodeCount)} nodes, which exceeds maxNodes (${String(maxNodes)}). Performance may be degraded.`);
    }

    // Initialize each node as its own cluster
    const clusters = new Map<string, ClusterNode>();
    let nextClusterId = nodeCount;

    for (let i = 0; i < nodeCount; i++) {
        const node = nodes[i];
        if (!node) {
            continue;
        }

        const clusterId = i.toString();
        clusters.set(clusterId, {
            id: clusterId,
            members: new Set([node.id]),
            distance: 0,
            size: 1,
        });
    }

    // Calculate initial distance matrix
    const distanceMatrix = calculateDistanceMatrix(graph, nodes, useGraphDistance);
    const mergeDistances: number[] = [];

    // Priority queue for efficient nearest neighbor finding
    const mergeCandidates = initializeMergeCandidates(clusters, distanceMatrix);

    let dendrogram: ClusterNode | undefined;

    // Perform agglomerative clustering
    while (clusters.size > 1 && mergeCandidates.length > 0) {
        // Find closest pair of clusters
        const {cluster1Id, cluster2Id, distance} = findClosestPair(mergeCandidates);

        // Check stopping criteria
        if (numClusters && clusters.size <= numClusters) {
            break;
        }

        if (distanceThreshold && distance > distanceThreshold) {
            break;
        }

        // Get the two clusters to merge
        const cluster1 = clusters.get(cluster1Id);
        const cluster2 = clusters.get(cluster2Id);
        if (!cluster1 || !cluster2) {
            continue;
        }

        // Create new merged cluster
        const newClusterId = (nextClusterId++).toString();
        const mergedMembers = new Set([... cluster1.members, ... cluster2.members]);

        const newCluster: ClusterNode = {
            id: newClusterId,
            members: mergedMembers,
            left: cluster1,
            right: cluster2,
            distance,
            size: cluster1.size + cluster2.size,
        };

        // Remove old clusters
        clusters.delete(cluster1Id);
        clusters.delete(cluster2Id);

        // Add new cluster
        clusters.set(newClusterId, newCluster);
        mergeDistances.push(distance);

        // Update merge candidates
        updateMergeCandidates(mergeCandidates, cluster1Id, cluster2Id, newClusterId, clusters, distanceMatrix, linkage);

        dendrogram = newCluster;
    }

    // If we have multiple remaining clusters, create a virtual root
    if (clusters.size > 1) {
        const remainingClusters = Array.from(clusters.values());
        let root = remainingClusters[0];
        if (!root) {
            dendrogram = undefined;
        } else {
            for (let i = 1; i < remainingClusters.length; i++) {
                const currentCluster = remainingClusters[i];
                if (!currentCluster) {
                    continue;
                }

                const newRoot: ClusterNode = {
                    id: (nextClusterId++).toString(),
                    members: new Set([... root.members, ... currentCluster.members]),
                    left: root,
                    right: currentCluster,
                    distance: Infinity,
                    size: root.size + currentCluster.size,
                };
                root = newRoot;
            }
            dendrogram = root;
        }

        dendrogram = root;
    }

    dendrogram ??= Array.from(clusters.values())[0];

    // Extract flat clustering
    const finalNumClusters = numClusters ?? clusters.size;
    const flatClusters = dendrogram ? extractFlatClustering(dendrogram, finalNumClusters) : new Map<NodeId, number>();

    if (!dendrogram) {
        throw new Error("Failed to create dendrogram");
    }

    return {
        dendrogram,
        clusters: flatClusters,
        distances: mergeDistances,
        numClusters: finalNumClusters,
    };
}

/**
 * Calculate distance matrix between all pairs of nodes
 */
function calculateDistanceMatrix(graph: Graph, nodes: {id: NodeId}[], useGraphDistance: boolean): number[][] {
    const n = nodes.length;
    const matrix: number[][] = Array.from({length: n}, () => new Array(n).fill(Infinity) as number[]);

    if (useGraphDistance) {
        // Use graph-based distances (shortest path)
        for (let i = 0; i < n; i++) {
            const node = nodes[i];
            if (!node) {
                continue;
            }

            const distances = bfsShortestPaths(graph, node.id);
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const targetNode = nodes[j];
                    if (targetNode && i < matrix.length && j < n) {
                        const row = matrix[i];
                        if (row && j < row.length) {
                            const distance = distances.get(targetNode.id);
                            row[j] = distance ?? Infinity;
                        }
                    }
                } else if (i < matrix.length) {
                    const row = matrix[i];
                    if (row && j < row.length) {
                        row[j] = 0;
                    }
                }
            }
        }
    } else {
        // Use simple edge-based distances
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const node1 = nodes[i];
                const node2 = nodes[j];
                if (node1 && node2) {
                    const hasEdge = graph.hasEdge(node1.id, node2.id);
                    const distance = hasEdge ? 1 : 2; // Connected: 1, not connected: 2
                    if (i < matrix.length) {
                        const rowI = matrix[i];
                        if (rowI && j < rowI.length) {
                            rowI[j] = distance;
                        }
                    }

                    if (j < matrix.length) {
                        const rowJ = matrix[j];
                        if (rowJ && i < rowJ.length) {
                            rowJ[i] = distance;
                        }
                    }
                }
            }
            if (i < matrix.length) {
                const row = matrix[i];
                if (row && i < row.length) {
                    row[i] = 0;
                }
            }
        }
    }

    return matrix;
}

/**
 * BFS-based shortest path calculation from a source node
 */
function bfsShortestPaths(graph: Graph, source: NodeId): Map<NodeId, number> {
    const distances = new Map<NodeId, number>();
    const queue: [NodeId, number][] = [[source, 0]];
    const visited = new Set<NodeId>();

    visited.add(source);
    distances.set(source, 0);

    while (queue.length > 0) {
        const item = queue.shift();
        if (!item) {
            break;
        }

        const [current, distance] = item;

        for (const neighbor of graph.neighbors(current)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                distances.set(neighbor, distance + 1);
                queue.push([neighbor, distance + 1]);
            }
        }
    }

    return distances;
}

/**
 * Initialize merge candidates priority queue
 */
function initializeMergeCandidates(
    clusters: Map<string, ClusterNode>,
    distanceMatrix: number[][],
): {cluster1Id: string, cluster2Id: string, distance: number}[] {
    const candidates: {cluster1Id: string, cluster2Id: string, distance: number}[] = [];
    const clusterIds = Array.from(clusters.keys());

    for (let i = 0; i < clusterIds.length; i++) {
        for (let j = i + 1; j < clusterIds.length; j++) {
            const id1 = clusterIds[i];
            const id2 = clusterIds[j];
            if (!id1 || !id2) {
                continue;
            }

            const row = distanceMatrix[parseInt(id1)];
            if (!row) {
                continue;
            }

            const distance = row[parseInt(id2)] ?? Infinity;
            // Include all candidates, even disconnected ones (with finite but large distance)
            candidates.push({
                cluster1Id: id1,
                cluster2Id: id2,
                distance: distance === Infinity ? 100 : distance,
            });
        }
    }

    // Sort by distance (ascending)
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates;
}

/**
 * Find the closest pair of clusters
 */
function findClosestPair(
    mergeCandidates: {cluster1Id: string, cluster2Id: string, distance: number}[],
): {cluster1Id: string, cluster2Id: string, distance: number} {
    // Return the first (closest) valid candidate
    const candidate = mergeCandidates.shift();
    if (!candidate) {
        throw new Error("No merge candidates available");
    }

    return candidate;
}

/**
 * Update merge candidates after a merge operation
 */
function updateMergeCandidates(
    mergeCandidates: {cluster1Id: string, cluster2Id: string, distance: number}[],
    oldCluster1Id: string,
    oldCluster2Id: string,
    newClusterId: string,
    clusters: Map<string, ClusterNode>,
    distanceMatrix: number[][],
    linkage: string,
): void {
    // Remove candidates involving the merged clusters
    for (let i = mergeCandidates.length - 1; i >= 0; i--) {
        const candidate = mergeCandidates[i];
        if (!candidate) {
            continue;
        }

        if (candidate.cluster1Id === oldCluster1Id || candidate.cluster1Id === oldCluster2Id ||
            candidate.cluster2Id === oldCluster1Id || candidate.cluster2Id === oldCluster2Id) {
            mergeCandidates.splice(i, 1);
        }
    }

    // Add new candidates for the merged cluster
    const newCluster = clusters.get(newClusterId);
    if (!newCluster) {
        return;
    }

    for (const [clusterId, cluster] of clusters) {
        if (clusterId !== newClusterId) {
            const distance = calculateClusterDistance(newCluster, cluster, distanceMatrix, linkage);
            mergeCandidates.push({
                cluster1Id: newClusterId,
                cluster2Id: clusterId,
                distance: distance === Infinity ? 100 : distance,
            });
        }
    }

    // Re-sort candidates
    mergeCandidates.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate distance between two clusters based on linkage criterion
 */
function calculateClusterDistance(
    cluster1: ClusterNode,
    cluster2: ClusterNode,
    distanceMatrix: number[][],
    linkage: string,
): number {
    const members1 = Array.from(cluster1.members);
    const members2 = Array.from(cluster2.members);
    const distances: number[] = [];

    // Calculate all pairwise distances between cluster members
    for (const member1 of members1) {
        for (const member2 of members2) {
            const idx1 = parseInt(member1.toString());
            const idx2 = parseInt(member2.toString());
            if (idx1 < distanceMatrix.length && idx2 < distanceMatrix.length) {
                const row = distanceMatrix[idx1];
                if (row) {
                    const distance = row[idx2];
                    if (distance !== undefined) {
                        distances.push(distance);
                    }
                }
            }
        }
    }

    if (distances.length === 0) {
        return Infinity;
    }

    // Apply linkage criterion
    switch (linkage) {
        case "single":
            return Math.min(... distances);
        case "complete":
            return Math.max(... distances);
        case "average":
            return distances.reduce((sum, d) => sum + d, 0) / distances.length;
        case "ward":
            // Simplified Ward linkage (would need cluster centroids for full implementation)
            return distances.reduce((sum, d) => sum + (d * d), 0) / distances.length;
        default:
            return distances.reduce((sum, d) => sum + d, 0) / distances.length;
    }
}

/**
 * Extract flat clustering from dendrogram
 */
function extractFlatClustering(dendrogram: ClusterNode, numClusters: number): Map<NodeId, number> {
    const clusters = new Map<NodeId, number>();

    if (numClusters === 1) {
        // Single cluster
        const clusterId = 0;
        for (const member of dendrogram.members) {
            clusters.set(member, clusterId);
        }
        return clusters;
    }

    // Find clusters at the specified level
    const clusterNodes: ClusterNode[] = [];
    const queue: ClusterNode[] = [dendrogram];

    while (queue.length > 0 && clusterNodes.length < numClusters) {
        const current = queue.shift();
        if (!current) {
            break;
        }

        if (!current.left || !current.right || clusterNodes.length + queue.length + 1 >= numClusters) {
            // This is a leaf or we need to keep this level
            clusterNodes.push(current);
        } else {
            // Continue decomposing
            queue.push(current.left, current.right);
        }
    }

    // Assign cluster IDs
    for (let i = 0; i < clusterNodes.length; i++) {
        const cluster = clusterNodes[i];
        if (!cluster) {
            continue;
        }

        for (const member of cluster.members) {
            clusters.set(member, i);
        }
    }

    return clusters;
}
