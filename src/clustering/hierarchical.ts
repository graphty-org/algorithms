/**
 * Hierarchical Clustering Algorithm
 *
 * Builds a hierarchy of clusters through agglomeration (bottom-up)
 * or division (top-down). Useful for understanding multi-scale
 * structure in graphs.
 */

import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";

/**
 * Convert Graph to adjacency set representation for clustering
 */
function graphToAdjacencySet(graph: Graph): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();

    // Initialize all nodes
    for (const node of graph.nodes()) {
        adjacency.set(String(node.id), new Set());
    }

    // Add edges
    for (const edge of graph.edges()) {
        const source = String(edge.source);
        const target = String(edge.target);

        const sourceSet = adjacency.get(source);
        if (sourceSet) {
            sourceSet.add(target);
        }

        // For undirected graphs, add reverse edge
        if (!graph.isDirected) {
            const targetSet = adjacency.get(target);
            if (targetSet) {
                targetSet.add(source);
            }
        }
    }

    return adjacency;
}

export interface ClusterNode<T> {
    id: string;
    members: Set<T>;
    left?: ClusterNode<T> | undefined;
    right?: ClusterNode<T> | undefined;
    distance: number;
    height: number;
    // For forest roots, store the individual trees
    trees?: ClusterNode<T>[] | undefined;
}

export interface HierarchicalClusteringResult<T> {
    root: ClusterNode<T>;
    dendrogram: ClusterNode<T>[];
    clusters: Map<number, Set<T>[]>;
}

export type LinkageMethod = "single" | "complete" | "average" | "ward";

/**
 * Compute distance between two nodes based on graph structure
 */
function computeGraphDistance<T>(
    graph: Map<T, Set<T>>,
    distances: Map<T, Map<T, number>>,
): void {
    // Use BFS to compute shortest path distances
    for (const start of graph.keys()) {
        const dist = new Map<T, number>();
        const queue: T[] = [start];
        dist.set(start, 0);

        while (queue.length > 0) {
            const node = queue.shift();
            if (!node) {
                continue;
            }

            const neighbors = graph.get(node);

            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (!dist.has(neighbor)) {
                        dist.set(neighbor, (dist.get(node) ?? 0) + 1);
                        queue.push(neighbor);
                    }
                }
            }
        }

        distances.set(start, dist);
    }
}

/**
 * Compute distance between two clusters based on linkage method
 */
function clusterDistance<T>(
    cluster1: ClusterNode<T>,
    cluster2: ClusterNode<T>,
    distances: Map<T, Map<T, number>>,
    linkage: LinkageMethod,
): number {
    const allDistances: number[] = [];

    for (const node1 of cluster1.members) {
        const node1Distances = distances.get(node1);
        if (!node1Distances) {
            continue;
        }

        for (const node2 of cluster2.members) {
            const dist = node1Distances.get(node2);
            if (dist !== undefined) {
                allDistances.push(dist);
            }
        }
    }

    if (allDistances.length === 0) {
        return Infinity;
    }

    switch (linkage) {
        case "single":
            return Math.min(... allDistances);
        case "complete":
            return Math.max(... allDistances);
        case "average":
            return allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
        case "ward": {
            // Simplified Ward's method - minimize within-cluster variance
            const size1 = cluster1.members.size;
            const size2 = cluster2.members.size;
            const avgDist = allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
            return avgDist * ((size1 * size2) / (size1 + size2));
        }
        default:
            return Math.min(... allDistances);
    }
}

/**
 * Internal implementation of agglomerative hierarchical clustering
 */
function hierarchicalClusteringImpl<T>(
    graph: Map<T, Set<T>>,
    linkage: LinkageMethod = "single",
): HierarchicalClusteringResult<T> {
    const nodes = Array.from(graph.keys());
    const n = nodes.length;

    if (n === 0) {
        return {
            root: {id: "empty", members: new Set(), distance: 0, height: 0},
            dendrogram: [],
            clusters: new Map(),
        };
    }

    // Compute pairwise distances
    const distances = new Map<T, Map<T, number>>();
    computeGraphDistance(graph, distances);

    // Initialize clusters - each node is its own cluster
    const clusters: ClusterNode<T>[] = nodes.map((node, i) => ({
        id: `leaf-${String(i)}`,
        members: new Set([node]),
        distance: 0,
        height: 0,
    }));

    const dendrogram: ClusterNode<T>[] = [... clusters];
    let clusterCount = n;

    // Distance matrix between clusters
    const clusterDistances = new Map<string, Map<string, number>>();

    // Initialize cluster distances
    for (let i = 0; i < clusters.length; i++) {
        const cluster1 = clusters[i];
        if (!cluster1) {
            continue;
        }

        const distMap = new Map<string, number>();
        for (let j = i + 1; j < clusters.length; j++) {
            const cluster2 = clusters[j];
            if (!cluster2) {
                continue;
            }

            const dist = clusterDistance(cluster1, cluster2, distances, linkage);
            distMap.set(cluster2.id, dist);
        }
        clusterDistances.set(cluster1.id, distMap);
    }

    // Active clusters
    const activeClusters = new Set(clusters);

    // Merge clusters until only one remains
    while (activeClusters.size > 1) {
        // Find closest pair of clusters
        let minDist = Infinity;
        let mergeCluster1: ClusterNode<T> | null = null;
        let mergeCluster2: ClusterNode<T> | null = null;

        for (const cluster1 of activeClusters) {
            const distMap = clusterDistances.get(cluster1.id);
            if (!distMap) {
                continue;
            }

            for (const cluster2 of activeClusters) {
                if (cluster1.id >= cluster2.id) {
                    continue;
                }

                const dist = distMap.get(cluster2.id) ??
                    clusterDistances.get(cluster2.id)?.get(cluster1.id) ??
                    Infinity;

                if (dist < minDist) {
                    minDist = dist;
                    mergeCluster1 = cluster1;
                    mergeCluster2 = cluster2;
                }
            }
        }

        if (!mergeCluster1 || !mergeCluster2 || minDist === Infinity) {
            // No valid merge found - create forest
            const trees = Array.from(activeClusters);
            const forestRoot: ClusterNode<T> = {
                id: `forest-${String(clusterCount++)}`,
                members: new Set(nodes),
                distance: Infinity,
                height: Math.max(... trees.map((t) => t.height)) + 1,
                trees,
            };
            dendrogram.push(forestRoot);
            activeClusters.clear();
            activeClusters.add(forestRoot);
            break;
        }

        // Create new cluster
        const newCluster: ClusterNode<T> = {
            id: `cluster-${String(clusterCount++)}`,
            members: new Set([... mergeCluster1.members, ... mergeCluster2.members]),
            left: mergeCluster1,
            right: mergeCluster2,
            distance: minDist,
            height: Math.max(mergeCluster1.height, mergeCluster2.height) + 1,
        };

        dendrogram.push(newCluster);

        // Update distances to new cluster
        const newDistMap = new Map<string, number>();
        for (const cluster of activeClusters) {
            if (cluster.id === mergeCluster1.id || cluster.id === mergeCluster2.id) {
                continue;
            }

            const dist = clusterDistance(newCluster, cluster, distances, linkage);
            newDistMap.set(cluster.id, dist);

            // Update reverse direction
            const clusterDistMap = clusterDistances.get(cluster.id);
            if (clusterDistMap) {
                clusterDistMap.set(newCluster.id, dist);
            }
        }
        clusterDistances.set(newCluster.id, newDistMap);

        // Remove merged clusters
        activeClusters.delete(mergeCluster1);
        activeClusters.delete(mergeCluster2);
        clusterDistances.delete(mergeCluster1.id);
        clusterDistances.delete(mergeCluster2.id);

        // Clean up references
        for (const distMap of clusterDistances.values()) {
            distMap.delete(mergeCluster1.id);
            distMap.delete(mergeCluster2.id);
        }

        activeClusters.add(newCluster);
    }

    // Root is the last remaining cluster
    const root = activeClusters.size > 0 ? Array.from(activeClusters)[0] : dendrogram[dendrogram.length - 1];

    // Generate clusters at different heights
    const clustersByLevel = new Map<number, Set<T>[]>();

    if (!root) {
        return {
            root: {id: "empty", members: new Set(), distance: 0, height: 0},
            dendrogram: [],
            clusters: new Map(),
        };
    }

    for (let h = 0; h <= root.height; h++) {
        clustersByLevel.set(h, cutDendrogram(root, h));
    }

    return {
        root,
        dendrogram,
        clusters: clustersByLevel,
    };
}

/**
 * Cut dendrogram at specific height to get clusters
 */
export function cutDendrogram<T>(
    root: ClusterNode<T>,
    height: number,
): Set<T>[] {
    const clusters: Set<T>[] = [];

    function traverse(node: ClusterNode<T>): void {
        if (node.height <= height || (!node.left && !node.right)) {
            clusters.push(node.members);
        } else {
            if (node.trees) {
                // Handle forest nodes
                for (const tree of node.trees) {
                    traverse(tree);
                }
            } else {
                if (node.left) {
                    traverse(node.left);
                }

                if (node.right) {
                    traverse(node.right);
                }
            }
        }
    }

    traverse(root);
    return clusters;
}

/**
 * Cut dendrogram to get exactly k clusters
 */
export function cutDendrogramKClusters<T>(
    root: ClusterNode<T>,
    k: number,
): Set<T>[] {
    if (k <= 0) {
        return [];
    }

    if (k === 1) {
        return [root.members];
    }

    // Binary search for the right height
    let low = 0;
    let high = root.height;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const clusters = cutDendrogram(root, mid);

        if (clusters.length === k) {
            return clusters;
        } else if (clusters.length < k) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }

    return cutDendrogram(root, low);
}

/**
 * Compute modularity-based hierarchical clustering
 * Uses modularity gain to decide merges
 */
export function modularityHierarchicalClustering<T>(
    graph: Map<T, Set<T>>,
): HierarchicalClusteringResult<T> {
    const nodes = Array.from(graph.keys());
    const n = nodes.length;

    if (n === 0) {
        return {
            root: {id: "empty", members: new Set(), distance: 0, height: 0},
            dendrogram: [],
            clusters: new Map(),
        };
    }

    // Compute degrees
    const degrees = new Map<T, number>();
    let totalEdges = 0;

    for (const [node, neighbors] of graph) {
        degrees.set(node, neighbors.size);
        totalEdges += neighbors.size;
    }

    // For undirected graphs
    totalEdges = totalEdges / 2;

    // Initialize clusters
    const clusters: ClusterNode<T>[] = nodes.map((node, i) => ({
        id: `leaf-${String(i)}`,
        members: new Set([node]),
        distance: 0,
        height: 0,
    }));

    const dendrogram: ClusterNode<T>[] = [... clusters];
    let clusterCount = n;

    // Active clusters
    const activeClusters = new Set(clusters);

    // Community assignments
    const communities = new Map<T, number>();
    nodes.forEach((node, i) => communities.set(node, i));

    // Merge clusters based on modularity gain
    while (activeClusters.size > 1) {
        let maxGain = -Infinity;
        let mergeCluster1: ClusterNode<T> | null = null;
        let mergeCluster2: ClusterNode<T> | null = null;

        for (const cluster1 of activeClusters) {
            for (const cluster2 of activeClusters) {
                if (cluster1.id >= cluster2.id) {
                    continue;
                }

                // Calculate modularity gain
                let edgesBetween = 0;
                let degreeProduct = 0;

                for (const node1 of cluster1.members) {
                    const neighbors = graph.get(node1);
                    const degree1 = degrees.get(node1) ?? 0;

                    for (const node2 of cluster2.members) {
                        if (neighbors?.has(node2)) {
                            edgesBetween++;
                        }

                        const degree2 = degrees.get(node2) ?? 0;
                        degreeProduct += degree1 * degree2;
                    }
                }

                const gain = (edgesBetween / totalEdges) -
                    (degreeProduct / (4 * totalEdges * totalEdges));

                if (gain > maxGain) {
                    maxGain = gain;
                    mergeCluster1 = cluster1;
                    mergeCluster2 = cluster2;
                }
            }
        }

        if (!mergeCluster1 || !mergeCluster2) {
            break;
        }

        // Create new cluster
        const newCluster: ClusterNode<T> = {
            id: `cluster-${String(clusterCount++)}`,
            members: new Set([... mergeCluster1.members, ... mergeCluster2.members]),
            left: mergeCluster1,
            right: mergeCluster2,
            distance: -maxGain, // Use negative gain as distance
            height: Math.max(mergeCluster1.height, mergeCluster2.height) + 1,
        };

        dendrogram.push(newCluster);

        // Remove old and add new
        activeClusters.delete(mergeCluster1);
        activeClusters.delete(mergeCluster2);
        activeClusters.add(newCluster);
    }

    // Root is the last remaining cluster
    const root = Array.from(activeClusters)[0] ?? dendrogram[dendrogram.length - 1];

    // Generate clusters at different heights
    const clustersByLevel = new Map<number, Set<T>[]>();

    if (!root) {
        return {
            root: {id: "empty", members: new Set(), distance: 0, height: 0},
            dendrogram: [],
            clusters: new Map(),
        };
    }

    for (let h = 0; h <= root.height; h++) {
        clustersByLevel.set(h, cutDendrogram(root, h));
    }

    return {
        root,
        dendrogram,
        clusters: clustersByLevel,
    };
}

/**
 * Agglomerative hierarchical clustering
 * Builds clusters bottom-up by merging closest pairs
 *
 * @param graph - Undirected graph - accepts Graph class or Map<T, Set<T>>
 * @param linkage - Linkage method for cluster distance
 * @returns Hierarchical clustering result
 *
 * Time Complexity: O(n³) naive, O(n² log n) with heap
 * Space Complexity: O(n²)
 */
export function hierarchicalClustering<T = NodeId>(
    graph: Graph | Map<T, Set<T>>,
    linkage: LinkageMethod = "single",
): HierarchicalClusteringResult<T> {
    if (graph instanceof Map) {
        return hierarchicalClusteringImpl(graph, linkage);
    }

    // Convert Graph to adjacency set representation
    const adjacencySet = graphToAdjacencySet(graph);
    // Type assertion needed because we know the keys are strings
    return hierarchicalClusteringImpl(adjacencySet as Map<T, Set<T>>, linkage);
}
