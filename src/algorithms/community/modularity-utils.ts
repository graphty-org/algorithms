/**
 * Shared modularity calculation utilities for community detection algorithms
 *
 * Used by: Louvain, Leiden, Girvan-Newman
 */
import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * Calculate total edge weight in the graph
 *
 * For undirected graphs, each edge is counted once.
 * For directed graphs, each directed edge is counted once.
 *
 * @param graph - The input graph
 * @returns Total sum of edge weights (default weight is 1)
 */
export function getTotalEdgeWeight(graph: Graph): number {
    let totalWeight = 0;

    for (const edge of graph.edges()) {
        totalWeight += edge.weight ?? 1;
    }

    return totalWeight;
}

/**
 * Get the total degree (sum of edge weights) for a node
 *
 * Computes the weighted degree by summing all edge weights incident to the node.
 *
 * @param graph - The input graph
 * @param nodeId - The node ID to compute degree for
 * @returns The weighted degree of the node
 */
export function getNodeDegree(graph: Graph, nodeId: NodeId): number {
    let degree = 0;

    for (const neighbor of graph.neighbors(nodeId)) {
        const edge = graph.getEdge(nodeId, neighbor);
        degree += edge?.weight ?? 1;
    }

    return degree;
}

/**
 * Get communities of neighboring nodes
 *
 * Returns the set of community IDs that neighbors of the given node belong to.
 *
 * @param graph - The input graph
 * @param nodeId - The node to get neighbor communities for
 * @param communities - Map from node IDs to community IDs
 * @returns Set of community IDs that neighbors belong to
 */
export function getNeighborCommunities(
    graph: Graph,
    nodeId: NodeId,
    communities: Map<NodeId, number>,
): Set<number> {
    const neighborCommunities = new Set<number>();

    for (const neighbor of graph.neighbors(nodeId)) {
        const community = communities.get(neighbor);
        if (community !== undefined) {
            neighborCommunities.add(community);
        }
    }

    return neighborCommunities;
}

/**
 * Calculate modularity of a partition
 *
 * Modularity measures the quality of a community partition. It compares the
 * number of edges within communities to what would be expected in a random graph.
 *
 * Formula: Q = (1/2m) * Σ[A_ij - γ(k_i * k_j)/(2m)] * δ(c_i, c_j)
 * where:
 * - m = total edge weight
 * - A_ij = adjacency matrix entry (edge weight between i and j)
 * - k_i, k_j = degrees of nodes i and j
 * - γ = resolution parameter (higher values favor smaller communities)
 * - δ = Kronecker delta (1 if same community, 0 otherwise)
 *
 * @param graph - The input graph
 * @param communities - Map from node IDs to community IDs
 * @param resolution - Resolution parameter (default: 1.0)
 * @returns Modularity score (range typically -0.5 to 1.0)
 */
export function calculateModularity(
    graph: Graph,
    communities: Map<NodeId, number>,
    resolution = 1.0,
): number {
    const totalEdgeWeight = getTotalEdgeWeight(graph);
    if (totalEdgeWeight === 0) {
        return 0;
    }

    let modularity = 0;

    // For undirected graphs, we need to be careful not to double-count edges
    const countedEdges = new Set<string>();

    // Calculate modularity: Q = (1/2m) * Σ[A_ij - γ(k_i * k_j)/(2m)] * δ(c_i, c_j)
    for (const nodeI of graph.nodes()) {
        for (const nodeJ of graph.nodes()) {
            // Skip if already counted this pair in undirected graph
            if (!graph.isDirected) {
                const nodeIStr = String(nodeI.id);
                const nodeJStr = String(nodeJ.id);
                const edgeKey = nodeIStr <= nodeJStr ? `${nodeIStr}-${nodeJStr}` : `${nodeJStr}-${nodeIStr}`;
                if (countedEdges.has(edgeKey)) {
                    continue;
                }

                countedEdges.add(edgeKey);
            }

            if (communities.get(nodeI.id) === communities.get(nodeJ.id)) {
                const edge = graph.getEdge(nodeI.id, nodeJ.id);
                const reverseEdge = !graph.isDirected ? graph.getEdge(nodeJ.id, nodeI.id) : null;

                let edgeWeight = 0;
                if (edge) {
                    edgeWeight += edge.weight ?? 1;
                }

                if (reverseEdge && nodeI.id !== nodeJ.id) {
                    edgeWeight += reverseEdge.weight ?? 1;
                }

                const degreeI = getNodeDegree(graph, nodeI.id);
                const degreeJ = getNodeDegree(graph, nodeJ.id);

                modularity += edgeWeight - ((resolution * degreeI * degreeJ) / (2 * totalEdgeWeight));
            }
        }
    }

    return modularity / (2 * totalEdgeWeight);
}
