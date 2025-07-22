/**
 * Hierarchical Clustering Algorithm
 *
 * Builds a hierarchy of clusters through agglomeration (bottom-up)
 * or division (top-down). Useful for understanding multi-scale
 * structure in graphs.
 */

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
                        const nodeDistance = dist.get(node);
                        if (nodeDistance !== undefined) {
                            dist.set(neighbor, nodeDistance + 1);
                        }

                        queue.push(neighbor);
                    }
                }
            }
        }

        distances.set(start, dist);
    }
}

/**
 * Compute distance between clusters based on linkage method
 */
function clusterDistance<T>(
    cluster1: Set<T>,
    cluster2: Set<T>,
    distances: Map<T, Map<T, number>>,
    method: LinkageMethod,
): number {
    if (cluster1.size === 0 || cluster2.size === 0) {
        return Infinity;
    }

    const allDistances: number[] = [];

    for (const node1 of cluster1) {
        for (const node2 of cluster2) {
            const dist = distances.get(node1)?.get(node2) ?? Infinity;
            allDistances.push(dist);
        }
    }

    switch (method) {
        case "single":
            return Math.min(... allDistances);
        case "complete":
            return Math.max(... allDistances);
        case "average":
            return allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
        case "ward":
            // Ward's method minimizes within-cluster variance
            // For simplicity, we use average here
            return allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
        default:
            return Math.min(... allDistances);
    }
}

/**
 * Agglomerative hierarchical clustering
 * Builds clusters bottom-up by merging closest pairs
 *
 * @param graph - Undirected graph
 * @param linkage - Linkage method for cluster distance
 * @returns Hierarchical clustering result
 *
 * Time Complexity: O(n³) naive, O(n² log n) with heap
 * Space Complexity: O(n²)
 */
export function hierarchicalClustering<T>(
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
        const clusterI = clusters[i];
        if (!clusterI) {
            continue;
        }

        clusterDistances.set(clusterI.id, new Map());
        for (let j = i + 1; j < clusters.length; j++) {
            const clusterJ = clusters[j];
            if (!clusterJ) {
                continue;
            }

            const dist = clusterDistance(
                clusterI.members,
                clusterJ.members,
                distances,
                linkage,
            );
            const clusterIDistances = clusterDistances.get(clusterI.id);
            if (clusterIDistances) {
                clusterIDistances.set(clusterJ.id, dist);
            }
        }
    }

    // Merge clusters until only one remains
    while (clusters.length > 1) {
    // Find closest pair of clusters
        let minDist = Infinity;
        let merge1 = 0;
        let merge2 = 0;

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const clusterI = clusters[i];
                const clusterJ = clusters[j];
                if (!clusterI || !clusterJ) {
                    continue;
                }

                const dist = clusterDistances.get(clusterI.id)?.get(clusterJ.id) ??
                    clusterDistances.get(clusterJ.id)?.get(clusterI.id) ??
                    Infinity;

                if (dist < minDist) {
                    minDist = dist;
                    merge1 = i;
                    merge2 = j;
                }
            }
        }

        // Check if we found a valid merge
        if (minDist === Infinity || merge1 === merge2) {
            // No more clusters can be merged (disconnected components)
            break;
        }

        // Create new cluster
        const cluster1 = clusters[merge1];
        const cluster2 = clusters[merge2];
        if (!cluster1 || !cluster2) {
            continue;
        }

        const newCluster: ClusterNode<T> = {
            id: `cluster-${String(clusterCount++)}`,
            members: new Set([... cluster1.members, ... cluster2.members]),
            left: cluster1,
            right: cluster2,
            distance: minDist,
            height: Math.max(cluster1.height, cluster2.height) + 1,
        };

        dendrogram.push(newCluster);

        // Update cluster distances for new cluster
        clusterDistances.set(newCluster.id, new Map());

        for (let i = 0; i < clusters.length; i++) {
            if (i !== merge1 && i !== merge2) {
                const clusterI = clusters[i];
                if (!clusterI) {
                    continue;
                }

                const newDist = clusterDistance(
                    newCluster.members,
                    clusterI.members,
                    distances,
                    linkage,
                );
                const newClusterDistances = clusterDistances.get(newCluster.id);
                if (newClusterDistances) {
                    newClusterDistances.set(clusterI.id, newDist);
                }
            }
        }

        // Remove old clusters and their distances
        clusterDistances.delete(cluster1.id);
        clusterDistances.delete(cluster2.id);
        for (const [, dists] of clusterDistances) {
            dists.delete(cluster1.id);
            dists.delete(cluster2.id);
        }

        // Remove merged clusters and add new one
        clusters.splice(Math.max(merge1, merge2), 1);
        clusters.splice(Math.min(merge1, merge2), 1);
        clusters.push(newCluster);
    }

    // Generate clusters at different levels
    const clustersByLevel = new Map<number, Set<T>[]>();

    function extractClustersAtHeight(node: ClusterNode<T>, height: number, clusters: Set<T>[]): void {
        if (node.height <= height || !node.left || !node.right) {
            clusters.push(node.members);
        } else {
            extractClustersAtHeight(node.left, height, clusters);
            extractClustersAtHeight(node.right, height, clusters);
        }
    }

    // Handle the case where we have multiple disconnected components
    let root: ClusterNode<T>;
    if (clusters.length === 0) {
        return {
            root: {id: "empty", members: new Set(), distance: 0, height: 0},
            dendrogram: [],
            clusters: new Map(),
        };
    } else if (clusters.length === 1 && clusters[0]) {
        root = clusters[0];
    } else {
        // Create a root that combines all remaining clusters (forest)
        const allMembers = new Set<T>();
        let maxHeight = 0;
        for (const cluster of clusters) {
            for (const member of cluster.members) {
                allMembers.add(member);
            }
            maxHeight = Math.max(maxHeight, cluster.height);
        }

        root = {
            id: "root-forest",
            members: allMembers,
            distance: Infinity,
            height: maxHeight + 1,
            // Store references to the individual trees
            trees: [... clusters],
        };

        dendrogram.push(root);
    }

    for (let h = 0; h <= root.height; h++) {
        const clustersAtHeight: Set<T>[] = [];

        if (clusters.length > 1 && h === root.height) {
            // At forest root height, return single cluster with all members
            clustersAtHeight.push(root.members);
        } else if (clusters.length > 1 && h < root.height) {
            // For forest, extract from each tree separately
            for (const tree of clusters) {
                extractClustersAtHeight(tree, h, clustersAtHeight);
            }
        } else {
            extractClustersAtHeight(root, h, clustersAtHeight);
        }

        clustersByLevel.set(h, clustersAtHeight);
    }

    return {
        root,
        dendrogram,
        clusters: clustersByLevel,
    };
}

/**
 * Cut dendrogram at specified height to get clusters
 */
export function cutDendrogram<T>(
    root: ClusterNode<T>,
    height: number,
): Set<T>[] {
    const clusters: Set<T>[] = [];

    function traverse(node: ClusterNode<T>): void {
        // Handle forest root specially
        if (node.trees) {
            if (node.height <= height) {
                // If we're at or below the requested height, return the whole forest as one cluster
                clusters.push(node.members);
            } else {
                // Otherwise, traverse each tree in the forest
                for (const tree of node.trees) {
                    traverse(tree);
                }
            }

            return;
        }

        // Normal binary tree traversal
        if (node.height <= height || !node.left || !node.right) {
            clusters.push(node.members);
        } else {
            traverse(node.left);
            traverse(node.right);
        }
    }

    traverse(root);
    return clusters;
}

/**
 * Cut dendrogram to get k clusters
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

    // Find the height that gives us k clusters
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

    // Calculate total edges
    let m = 0;
    for (const neighbors of graph.values()) {
        m += neighbors.size;
    }
    m = m / 2; // Each edge counted twice

    // Initialize clusters
    const clusters: ClusterNode<T>[] = nodes.map((node, i) => ({
        id: `leaf-${String(i)}`,
        members: new Set([node]),
        distance: 0,
        height: 0,
    }));

    const dendrogram: ClusterNode<T>[] = [... clusters];
    let clusterCount = n;

    // Track community assignments
    const communityMap = new Map<T, number>();
    nodes.forEach((node, i) => communityMap.set(node, i));

    // Compute modularity gain for merging communities
    function modularityGain(comm1: Set<T>, comm2: Set<T>): number {
        let edgesBetween = 0;
        let degree1 = 0;
        let degree2 = 0;

        for (const node1 of comm1) {
            const neighbors = graph.get(node1);
            if (!neighbors) {
                continue;
            }

            degree1 += neighbors.size;

            for (const neighbor of neighbors) {
                if (comm2.has(neighbor)) {
                    edgesBetween++;
                }
            }
        }

        for (const node2 of comm2) {
            const node2Neighbors = graph.get(node2);
            if (node2Neighbors) {
                degree2 += node2Neighbors.size;
            }
        }

        // Modularity gain formula
        const gain = (edgesBetween / m) - ((degree1 * degree2) / (4 * m * m));
        return gain;
    }

    // Merge clusters based on modularity
    while (clusters.length > 1) {
        let maxGain = -Infinity;
        let merge1 = 0;
        let merge2 = 0;

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const clusterI = clusters[i];
                const clusterJ = clusters[j];
                if (!clusterI || !clusterJ) {
                    continue;
                }

                const gain = modularityGain(clusterI.members, clusterJ.members);

                if (gain > maxGain) {
                    maxGain = gain;
                    merge1 = i;
                    merge2 = j;
                }
            }
        }

        // Create new cluster
        const cluster1 = clusters[merge1];
        const cluster2 = clusters[merge2];
        if (!cluster1 || !cluster2) {
            continue;
        }

        const newCluster: ClusterNode<T> = {
            id: `cluster-${String(clusterCount++)}`,
            members: new Set([... cluster1.members, ... cluster2.members]),
            left: cluster1,
            right: cluster2,
            distance: -maxGain, // Use negative gain as distance
            height: Math.max(cluster1.height, cluster2.height) + 1,
        };

        dendrogram.push(newCluster);

        // Update community assignments
        for (const node of newCluster.members) {
            communityMap.set(node, clusterCount - 1);
        }

        // Remove merged clusters
        clusters.splice(Math.max(merge1, merge2), 1);
        clusters.splice(Math.min(merge1, merge2), 1);
        clusters.push(newCluster);
    }

    // Generate clusters at different levels
    const clustersByLevel = new Map<number, Set<T>[]>();
    const root = clusters[0];

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

