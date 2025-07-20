import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * Betweenness centrality implementation using Brandes' algorithm
 *
 * Measures the extent to which a node lies on paths between other nodes.
 * Uses the fast O(VE) algorithm by Ulrik Brandes.
 */

/**
 * Betweenness centrality options
 */
export interface BetweennessCentralityOptions {
    /**
     * Whether to normalize the centrality values (default: false)
     */
    normalized?: boolean;
    /**
     * Whether to use endpoints in path counting (default: false)
     */
    endpoints?: boolean;
}

/**
 * Calculate betweenness centrality for all nodes using Brandes' algorithm
 */
export function betweennessCentrality(
    graph: Graph,
    options: BetweennessCentralityOptions = {},
): Record<string, number> {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const centrality: Record<string, number> = {};

    // Initialize centrality scores
    for (const nodeId of nodes) {
        centrality[String(nodeId)] = 0;
    }

    // Brandes' algorithm
    for (const source of nodes) {
        const stack: NodeId[] = [];
        const predecessors = new Map<NodeId, NodeId[]>();
        const sigma = new Map<NodeId, number>(); // Number of shortest paths
        const distance = new Map<NodeId, number>();
        const delta = new Map<NodeId, number>();

        // Initialize
        for (const nodeId of nodes) {
            predecessors.set(nodeId, []);
            sigma.set(nodeId, 0);
            distance.set(nodeId, -1);
            delta.set(nodeId, 0);
        }

        sigma.set(source, 1);
        distance.set(source, 0);

        const queue: NodeId[] = [source];

        // BFS to find shortest paths
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                break;
            }

            stack.push(current);

            for (const neighbor of Array.from(graph.neighbors(current))) {
                const currentDistance = distance.get(current);
                let neighborDistance = distance.get(neighbor);

                if (currentDistance === undefined || neighborDistance === undefined) {
                    continue;
                }

                // First time we reach this neighbor
                if (neighborDistance < 0) {
                    queue.push(neighbor);
                    distance.set(neighbor, currentDistance + 1);
                    neighborDistance = currentDistance + 1; // Update local variable
                }

                // Shortest path to neighbor via current
                if (neighborDistance === currentDistance + 1) {
                    const neighborSigma = sigma.get(neighbor) ?? 0;
                    const currentSigma = sigma.get(current) ?? 0;
                    sigma.set(neighbor, neighborSigma + currentSigma);

                    const preds = predecessors.get(neighbor);
                    if (preds) {
                        preds.push(current);
                    }
                }
            }
        }

        // Accumulation - back-propagation of dependencies
        while (stack.length > 0) {
            const w = stack.pop();
            if (!w) {
                break;
            }

            const wPreds = predecessors.get(w) ?? [];
            const wSigma = sigma.get(w) ?? 0;
            const wDelta = delta.get(w) ?? 0;

            for (const v of wPreds) {
                const vSigma = sigma.get(v) ?? 0;
                const vDelta = delta.get(v) ?? 0;

                if (vSigma > 0 && wSigma > 0) {
                    const contribution = (vSigma / wSigma) * (1 + wDelta);
                    delta.set(v, vDelta + contribution);
                }
            }

            if (w !== source) {
                const currentCentrality = centrality[String(w)] ?? 0;
                centrality[String(w)] = currentCentrality + wDelta;
            }
        }
    }

    // For undirected graphs, divide by 2 (each shortest path is counted twice)
    if (!graph.isDirected) {
        for (const nodeId of nodes) {
            const key = String(nodeId);
            const currentValue = centrality[key];
            if (currentValue !== undefined) {
                centrality[key] = currentValue / 2;
            }
        }
    }

    // Normalization
    if (options.normalized) {
        const n = nodes.length;
        let normalizationFactor: number;

        if (graph.isDirected) {
            normalizationFactor = (n - 1) * (n - 2);
        } else {
            normalizationFactor = ((n - 1) * (n - 2)) / 2;
        }

        if (normalizationFactor > 0) {
            for (const nodeId of nodes) {
                const key = String(nodeId);
                const currentValue = centrality[key];
                if (currentValue !== undefined) {
                    centrality[key] = currentValue / normalizationFactor;
                }
            }
        }
    }

    return centrality;
}

/**
 * Calculate betweenness centrality for a specific node
 */
export function nodeBetweennessCentrality(
    graph: Graph,
    targetNode: NodeId,
    options: BetweennessCentralityOptions = {},
): number {
    if (!graph.hasNode(targetNode)) {
        throw new Error(`Node ${String(targetNode)} not found in graph`);
    }

    const allCentralities = betweennessCentrality(graph, options);
    return allCentralities[String(targetNode)] ?? 0;
}

/**
 * Calculate edge betweenness centrality
 */
export function edgeBetweennessCentrality(
    graph: Graph,
    options: BetweennessCentralityOptions = {},
): Map<string, number> {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const edgeCentrality = new Map<string, number>();

    // Initialize edge centrality scores
    for (const edge of Array.from(graph.edges())) {
        const edgeKey = `${String(edge.source)}-${String(edge.target)}`;
        edgeCentrality.set(edgeKey, 0);
    }

    // Modified Brandes' algorithm for edge betweenness
    for (const source of nodes) {
        const stack: NodeId[] = [];
        const predecessors = new Map<NodeId, NodeId[]>();
        const sigma = new Map<NodeId, number>();
        const distance = new Map<NodeId, number>();
        const delta = new Map<NodeId, number>();

        // Initialize
        for (const nodeId of nodes) {
            predecessors.set(nodeId, []);
            sigma.set(nodeId, 0);
            distance.set(nodeId, -1);
            delta.set(nodeId, 0);
        }

        sigma.set(source, 1);
        distance.set(source, 0);

        const queue: NodeId[] = [source];

        // BFS to find shortest paths
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) {
                break;
            }

            stack.push(current);

            for (const neighbor of Array.from(graph.neighbors(current))) {
                const currentDistance = distance.get(current);
                let neighborDistance = distance.get(neighbor);

                if (currentDistance === undefined || neighborDistance === undefined) {
                    continue;
                }

                if (neighborDistance < 0) {
                    queue.push(neighbor);
                    distance.set(neighbor, currentDistance + 1);
                    neighborDistance = currentDistance + 1; // Update local variable
                }

                if (neighborDistance === currentDistance + 1) {
                    const neighborSigma = sigma.get(neighbor) ?? 0;
                    const currentSigma = sigma.get(current) ?? 0;
                    sigma.set(neighbor, neighborSigma + currentSigma);

                    const preds = predecessors.get(neighbor);
                    if (preds) {
                        preds.push(current);
                    }
                }
            }
        }

        // Accumulation for edges
        while (stack.length > 0) {
            const w = stack.pop();
            if (!w) {
                break;
            }

            const wPreds = predecessors.get(w) ?? [];
            const wSigma = sigma.get(w) ?? 0;
            const wDelta = delta.get(w) ?? 0;

            for (const v of wPreds) {
                const vSigma = sigma.get(v) ?? 0;

                if (vSigma > 0 && wSigma > 0) {
                    const edgeContribution = vSigma / wSigma * (1 + wDelta);

                    // Update edge centrality
                    const edgeKey = `${String(v)}-${String(w)}`;
                    const currentEdgeCentrality = edgeCentrality.get(edgeKey) ?? 0;
                    edgeCentrality.set(edgeKey, currentEdgeCentrality + edgeContribution);

                    // Update node delta
                    const vDelta = delta.get(v) ?? 0;
                    delta.set(v, vDelta + edgeContribution);
                }
            }
        }
    }

    // For undirected graphs, divide by 2 (each shortest path is counted twice)
    if (!graph.isDirected) {
        for (const [edgeKey, centrality] of Array.from(edgeCentrality)) {
            edgeCentrality.set(edgeKey, centrality / 2);
        }
    }

    // Normalization for edges
    if (options.normalized) {
        const n = nodes.length;
        const normalizationFactor = graph.isDirected ? (n - 1) * (n - 2) : ((n - 1) * (n - 2)) / 2;

        if (normalizationFactor > 0) {
            for (const [edgeKey, centrality] of Array.from(edgeCentrality)) {
                edgeCentrality.set(edgeKey, centrality / normalizationFactor);
            }
        }
    }

    return edgeCentrality;
}

