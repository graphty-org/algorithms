/**
 * K-Core Decomposition Algorithm
 *
 * Finds the k-core subgraph where each node has at least k neighbors
 * within the subgraph. Used for identifying cohesive groups and
 * understanding graph structure.
 */

import type {Graph} from "../core/graph.js";

/**
 * Convert Graph to adjacency set representation
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

export interface KCoreResult<T> {
    cores: Map<number, Set<T>>;
    coreness: Map<T, number>;
    maxCore: number;
}

/**
 * Internal implementation of K-Core decomposition algorithm
 */
function kCoreDecompositionImpl<T>(
    graph: Map<T, Set<T>>,
): KCoreResult<T> {
    if (graph.size === 0) {
        return {cores: new Map(), coreness: new Map(), maxCore: 0};
    }

    const n = graph.size;
    const nodes = Array.from(graph.keys());
    const nodeToIndex = new Map<T, number>();
    nodes.forEach((node, i) => nodeToIndex.set(node, i));

    // Initialize data structures
    const degree = new Array<number>(n).fill(0);
    const pos = new Array<number>(n).fill(0);
    const vert = new Array<number>(n).fill(0);
    const coreness = new Map<T, number>();

    // Initialize coreness for all nodes to 0
    for (let i = 0; i < n; i++) {
        const node = nodes[i];
        if (node !== undefined) {
            coreness.set(node, 0);
        }
    }

    // Compute initial degrees
    let maxDegree = 0;
    for (let i = 0; i < n; i++) {
        const node = nodes[i];
        if (!node) {
            continue;
        }

        const neighbors = graph.get(node);
        const nodeSize = neighbors ? neighbors.size : 0;

        degree[i] = nodeSize;
        maxDegree = Math.max(maxDegree, nodeSize);
    }

    // Count nodes of each degree
    const bin = new Array<number>(maxDegree + 1).fill(0);
    for (let i = 0; i < n; i++) {
        const deg = degree[i];
        if (deg !== undefined && deg >= 0 && deg < bin.length) {
            const currentCount = bin[deg];
            if (currentCount !== undefined) {
                bin[deg] = currentCount + 1;
            }
        }
    }

    // Starting position of each degree in sorted array
    let start = 0;
    for (let d = 0; d <= maxDegree; d++) {
        const temp = bin[d] ?? 0;
        bin[d] = start;
        start += temp;
    }

    // Sort nodes by degree
    for (let i = 0; i < n; i++) {
        const deg = degree[i];
        if (deg !== undefined && deg >= 0 && deg < bin.length) {
            const posIndex = bin[deg] ?? 0;
            pos[i] = posIndex;
            vert[posIndex] = i;
            const currentBin = bin[deg];
            if (currentBin !== undefined) {
                bin[deg] = currentBin + 1;
            }
        } else {
            // If we can't properly place the node in vert, set its position to -1
            // This shouldn't happen with our fixes, but just in case
            pos[i] = -1;
        }
    }

    // Recover starting positions
    for (let d = maxDegree; d > 0; d--) {
        bin[d] = bin[d - 1] ?? 0;
    }
    bin[0] = 0;

    // Main algorithm
    for (let i = 0; i < n; i++) {
        const v = vert[i];
        if (v === undefined) {
            continue;
        }

        const node = nodes[v];
        if (node === undefined) {
            continue;
        }

        const degreeV = degree[v];
        if (degreeV !== undefined) {
            coreness.set(node, degreeV);
        }

        // Process neighbors
        const neighbors = graph.get(node);
        if (!neighbors) {
            // Node has no neighbors, skip neighbor processing but coreness is already set
            continue;
        }

        for (const neighbor of neighbors) {
            const u = nodeToIndex.get(neighbor);
            if (u === undefined) {
                continue;
            }

            const degreeU = degree[u];
            const degreeV = degree[v];
            if (degreeU !== undefined && degreeV !== undefined && degreeU > degreeV) {
                const du = degreeU;
                const pu = pos[u];
                const pw = bin[du] ?? 0;
                const w = vert[pw];

                if (u !== w && w !== undefined && pw < n && pu !== undefined) {
                    // Swap u and w in the sorted order
                    vert[pu] = w;
                    vert[pw] = u;
                    pos[u] = pw;
                    pos[w] = pu;
                }

                const currentBin = bin[du];
                if (currentBin !== undefined) {
                    bin[du] = currentBin + 1;
                }

                degree[u] = degreeU - 1;
            }
        }
    }

    // Build cores map
    const cores = new Map<number, Set<T>>();
    let maxCore = 0;

    for (const [node, core] of coreness) {
        if (!cores.has(core)) {
            cores.set(core, new Set());
        }

        const coreSet = cores.get(core);
        if (coreSet) {
            coreSet.add(node);
        }

        maxCore = Math.max(maxCore, core);
    }

    return {cores, coreness, maxCore};
}

/**
 * Extract the k-core subgraph
 * Returns nodes that belong to k-core or higher
 *
 * @param graph - Undirected graph
 * @param k - Core number
 * @returns Set of nodes in k-core or higher
 */
export function getKCore(
    graph: Graph,
    k: number,
): Set<string> {
    const {coreness} = kCoreDecomposition(graph);
    const kCore = new Set<string>();

    for (const [node, core] of coreness) {
        if (core >= k) {
            kCore.add(node);
        }
    }

    return kCore;
}

/**
 * Get the induced subgraph for k-core
 * Returns the actual subgraph containing only k-core nodes
 *
 * @param graph - Original graph
 * @param k - Core number
 * @returns K-core subgraph
 */
export function getKCoreSubgraph(
    graph: Graph,
    k: number,
): Map<string, Set<string>> {
    const kCoreNodes = getKCore(graph, k);
    const adjacencySet = graphToAdjacencySet(graph);
    const subgraph = new Map<string, Set<string>>();

    for (const node of kCoreNodes) {
        const neighbors = adjacencySet.get(node);
        if (neighbors) {
            const coreNeighbors = new Set<string>();
            for (const neighbor of neighbors) {
                if (kCoreNodes.has(neighbor)) {
                    coreNeighbors.add(neighbor);
                }
            }
            subgraph.set(node, coreNeighbors);
        }
    }

    return subgraph;
}

/**
 * Degeneracy ordering of the graph
 * Orders nodes by their coreness values
 *
 * @param graph - Undirected graph
 * @returns Array of nodes ordered by degeneracy
 */
export function degeneracyOrdering(
    graph: Graph,
): string[] {
    const adjacencySet = graphToAdjacencySet(graph);
    const degree = new Map<string, number>();
    const remaining = new Map<string, Set<string>>();
    const ordering: string[] = [];

    // Initialize
    for (const [node, neighbors] of adjacencySet) {
        degree.set(node, neighbors.size);
        remaining.set(node, new Set(neighbors));
    }

    // Build ordering
    while (ordering.length < adjacencySet.size) {
    // Find minimum degree node
        let minDegree = Infinity;
        let minNode: string | undefined;

        for (const [node, deg] of degree) {
            if (!ordering.includes(node) && deg < minDegree) {
                minDegree = deg;
                minNode = node;
            }
        }

        if (minNode === undefined) {
            break;
        }

        ordering.push(minNode);

        // Update neighbors
        const neighbors = remaining.get(minNode);
        if (neighbors) {
            for (const neighbor of neighbors) {
                const neighborDegree = degree.get(neighbor);
                if (neighborDegree !== undefined) {
                    degree.set(neighbor, neighborDegree - 1);
                }

                remaining.get(neighbor)?.delete(minNode);
            }
        }
    }

    return ordering;
}

/**
 * Find k-truss subgraph (triangular k-cores)
 * Each edge must be part of at least k-2 triangles
 *
 * @param graph - Undirected graph
 * @param k - Truss number (k >= 2)
 * @returns Edges in k-truss
 */
export function kTruss(
    graph: Graph,
    k: number,
): Set<string> {
    if (k < 2) {
        throw new Error("k must be at least 2 for k-truss");
    }

    const adjacencySet = graphToAdjacencySet(graph);

    // Count triangles for each edge
    const edgeTriangles = new Map<string, number>();
    const edges = new Set<string>();

    // Initialize edges
    for (const [u, neighbors] of adjacencySet) {
        for (const v of neighbors) {
            if (u < v) { // Avoid duplicates
                const edge = `${String(u)},${String(v)}`;
                edges.add(edge);
                edgeTriangles.set(edge, 0);
            }
        }
    }

    // Count triangles
    for (const [u, uNeighbors] of adjacencySet) {
        for (const v of uNeighbors) {
            if (u < v) {
                const vNeighbors = adjacencySet.get(v);
                if (vNeighbors) {
                    // Find common neighbors (triangles)
                    for (const w of uNeighbors) {
                        if (v < w && vNeighbors.has(w)) {
                            // Triangle found: u-v-w
                            const edge1 = `${String(u)},${String(v)}`;
                            const edge2 = `${String(u)},${String(w)}`;
                            const edge3 = `${String(v)},${String(w)}`;

                            const edge1Count = edgeTriangles.get(edge1);
                            const edge2Count = edgeTriangles.get(edge2);
                            const edge3Count = edgeTriangles.get(edge3);
                            if (edge1Count !== undefined) {
                                edgeTriangles.set(edge1, edge1Count + 1);
                            }

                            if (edge2Count !== undefined) {
                                edgeTriangles.set(edge2, edge2Count + 1);
                            }

                            if (edge3Count !== undefined) {
                                edgeTriangles.set(edge3, edge3Count + 1);
                            }
                        }
                    }
                }
            }
        }
    }

    // Remove edges with insufficient triangles
    const kTrussEdges = new Set<string>(edges);
    let changed = true;

    while (changed) {
        changed = false;
        const toRemove = new Set<string>();

        for (const edge of kTrussEdges) {
            const triangleCount = edgeTriangles.get(edge);
            if (triangleCount !== undefined && triangleCount < k - 2) {
                toRemove.add(edge);
                changed = true;
            }
        }

        // Remove edges and update triangle counts
        for (const edge of toRemove) {
            kTrussEdges.delete(edge);
            const parts = edge.split(",");
            if (parts.length < 2) {
                continue;
            }

            const [u, v] = parts;
            if (!u || !v) {
                continue;
            }

            // Update triangle counts for affected edges
            const uNeighbors = adjacencySet.get(u);
            const vNeighbors = adjacencySet.get(v);

            if (uNeighbors && vNeighbors) {
                for (const w of uNeighbors) {
                    if (vNeighbors.has(w)) {
                        const edge1 = u < w ? `${String(u)},${String(w)}` : `${String(w)},${String(u)}`;
                        const edge2 = v < w ? `${String(v)},${String(w)}` : `${String(w)},${String(v)}`;

                        if (kTrussEdges.has(edge1)) {
                            const edge1Count = edgeTriangles.get(edge1);
                            if (edge1Count !== undefined) {
                                edgeTriangles.set(edge1, edge1Count - 1);
                            }
                        }

                        if (kTrussEdges.has(edge2)) {
                            const edge2Count = edgeTriangles.get(edge2);
                            if (edge2Count !== undefined) {
                                edgeTriangles.set(edge2, edge2Count - 1);
                            }
                        }
                    }
                }
            }
        }
    }

    return kTrussEdges;
}

/**
 * Convert directed graph to undirected for k-core analysis
 */
export function toUndirected<T>(
    directedGraph: Map<T, Map<T, number>>,
): Map<T, Set<T>> {
    const undirected = new Map<T, Set<T>>();

    // Initialize all nodes
    for (const node of directedGraph.keys()) {
        undirected.set(node, new Set());
    }

    // Add edges in both directions
    for (const [u, neighbors] of directedGraph) {
        for (const v of neighbors.keys()) {
            const uNeighbors = undirected.get(u);
            if (uNeighbors) {
                uNeighbors.add(v);
            }

            if (!undirected.has(v)) {
                undirected.set(v, new Set());
            }

            const vNeighbors = undirected.get(v);
            if (vNeighbors) {
                vNeighbors.add(u);
            }
        }
    }

    return undirected;
}

/**
 * K-Core decomposition algorithm
 * Finds all k-cores in the graph and assigns coreness values to nodes
 *
 * @param graph - Undirected graph - accepts Graph class or Map<T, Set<T>>
 * @returns K-core decomposition results
 *
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
export function kCoreDecomposition(
    graph: Graph,
): KCoreResult<string> {
    // Convert Graph to adjacency set representation
    const adjacencySet = graphToAdjacencySet(graph);
    return kCoreDecompositionImpl(adjacencySet);
}

