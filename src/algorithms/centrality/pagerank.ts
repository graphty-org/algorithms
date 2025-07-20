import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * PageRank algorithm implementation
 *
 * Measures the importance of nodes in a directed graph based on the
 * structure of incoming links. Originally designed for ranking web pages.
 */

/**
 * PageRank algorithm options
 */
export interface PageRankOptions {
    /**
     * Damping factor (probability of following a link) (default: 0.85)
     */
    dampingFactor?: number;
    /**
     * Maximum number of iterations (default: 100)
     */
    maxIterations?: number;
    /**
     * Convergence tolerance (default: 1e-6)
     */
    tolerance?: number;
    /**
     * Initial PageRank values for nodes (default: uniform distribution)
     */
    initialRanks?: Map<NodeId, number>;
    /**
     * Personalization vector for Personalized PageRank (default: null)
     */
    personalization?: Map<NodeId, number>;
    /**
     * Weight attribute for weighted PageRank (default: null = unweighted)
     */
    weight?: string;
}

/**
 * PageRank algorithm result
 */
export interface PageRankResult {
    /**
     * PageRank scores for each node
     */
    ranks: Record<string, number>;
    /**
     * Number of iterations until convergence
     */
    iterations: number;
    /**
     * Whether the algorithm converged
     */
    converged: boolean;
}

/**
 * Calculate PageRank for all nodes in the graph
 */
export function pageRank(
    graph: Graph,
    options: PageRankOptions = {},
): PageRankResult {
    const {
        dampingFactor = 0.85,
        maxIterations = 100,
        tolerance = 1e-6,
        initialRanks,
        personalization,
        weight,
    } = options;

    if (!graph.isDirected) {
        throw new Error("PageRank requires a directed graph");
    }

    if (dampingFactor < 0 || dampingFactor > 1) {
        throw new Error("Damping factor must be between 0 and 1");
    }

    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const n = nodes.length;

    if (n === 0) {
        return {ranks: {}, iterations: 0, converged: true};
    }

    // Initialize PageRank values
    let ranks = new Map<NodeId, number>();
    if (initialRanks) {
        for (const nodeId of nodes) {
            ranks.set(nodeId, initialRanks.get(nodeId) ?? 1 / n);
        }
    } else {
        for (const nodeId of nodes) {
            ranks.set(nodeId, 1 / n);
        }
    }

    // Normalize initial ranks
    normalizeRanks(ranks);

    // Calculate out-degrees and handle dangling nodes
    const outDegrees = new Map<NodeId, number>();
    const outWeights = new Map<NodeId, number>();
    const danglingNodes: NodeId[] = [];

    for (const nodeId of nodes) {
        let outDegree = 0;
        let totalOutWeight = 0;

        for (const neighbor of graph.neighbors(nodeId)) {
            outDegree++;
            if (weight) {
                const edge = graph.getEdge(nodeId, neighbor);
                const edgeWeight = edge?.weight ?? 1;
                totalOutWeight += edgeWeight;
            } else {
                totalOutWeight += 1;
            }
        }

        outDegrees.set(nodeId, outDegree);
        outWeights.set(nodeId, totalOutWeight);

        if (outDegree === 0) {
            danglingNodes.push(nodeId);
        }
    }

    // Setup personalization vector
    let personalVector: Map<NodeId, number> | null = null;
    if (personalization) {
        personalVector = new Map(personalization);
        normalizeRanks(personalVector);
    }

    let converged = false;
    let iteration = 0;

    // Power iteration
    for (iteration = 0; iteration < maxIterations; iteration++) {
        const newRanks = new Map<NodeId, number>();

        // Initialize with teleportation probability
        for (const nodeId of nodes) {
            if (personalVector) {
                newRanks.set(nodeId, (1 - dampingFactor) * (personalVector.get(nodeId) ?? 0));
            } else {
                newRanks.set(nodeId, (1 - dampingFactor) / n);
            }
        }

        // Handle dangling nodes
        let danglingSum = 0;
        for (const danglingNode of danglingNodes) {
            danglingSum += ranks.get(danglingNode) ?? 0;
        }

        if (danglingSum > 0) {
            const danglingContribution = dampingFactor * danglingSum / n;
            for (const nodeId of nodes) {
                const currentRank = newRanks.get(nodeId) ?? 0;
                if (personalVector) {
                    const personalContrib = danglingContribution * (personalVector.get(nodeId) ?? 0);
                    newRanks.set(nodeId, currentRank + personalContrib);
                } else {
                    newRanks.set(nodeId, currentRank + danglingContribution);
                }
            }
        }

        // Propagate rank from each node to its neighbors
        for (const nodeId of nodes) {
            const currentRank = ranks.get(nodeId) ?? 0;
            const nodeOutWeight = outWeights.get(nodeId) ?? 0;

            if (nodeOutWeight > 0) {
                for (const neighbor of graph.neighbors(nodeId)) {
                    let edgeWeight = 1;
                    if (weight) {
                        const edge = graph.getEdge(nodeId, neighbor);
                        edgeWeight = edge?.weight ?? 1;
                    }

                    const contribution = dampingFactor * currentRank * (edgeWeight / nodeOutWeight);
                    const neighborRank = newRanks.get(neighbor) ?? 0;
                    newRanks.set(neighbor, neighborRank + contribution);
                }
            }
        }

        // Check for convergence
        let maxDiff = 0;
        for (const nodeId of nodes) {
            const oldRank = ranks.get(nodeId) ?? 0;
            const newRank = newRanks.get(nodeId) ?? 0;
            maxDiff = Math.max(maxDiff, Math.abs(newRank - oldRank));
        }

        ranks = newRanks;

        if (maxDiff < tolerance) {
            converged = true;
            break;
        }
    }

    // Convert to string-keyed record
    const result: Record<string, number> = {};
    for (const nodeId of nodes) {
        result[String(nodeId)] = ranks.get(nodeId) ?? 0;
    }

    return {
        ranks: result,
        iterations: iteration + 1,
        converged,
    };
}

/**
 * Calculate Personalized PageRank for a specific set of source nodes
 */
export function personalizedPageRank(
    graph: Graph,
    personalNodes: NodeId[],
    options: Omit<PageRankOptions, "personalization"> = {},
): PageRankResult {
    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const personalization = new Map<NodeId, number>();

    // Initialize personalization vector
    for (const nodeId of nodes) {
        personalization.set(nodeId, 0);
    }

    // Set equal probability for personal nodes
    const personalValue = 1 / personalNodes.length;
    for (const personalNode of personalNodes) {
        if (!graph.hasNode(personalNode)) {
            throw new Error(`Personal node ${String(personalNode)} not found in graph`);
        }
        personalization.set(personalNode, personalValue);
    }

    return pageRank(graph, {
        ...options,
        personalization,
    });
}

/**
 * Calculate PageRank centrality (normalized PageRank scores)
 */
export function pageRankCentrality(
    graph: Graph,
    options: PageRankOptions = {},
): Record<string, number> {
    const result = pageRank(graph, options);
    return result.ranks;
}

/**
 * Get the top-k nodes by PageRank score
 */
export function topPageRankNodes(
    graph: Graph,
    k: number,
    options: PageRankOptions = {},
): Array<{node: NodeId, rank: number}> {
    const result = pageRank(graph, options);
    
    const nodeRanks: Array<{node: NodeId, rank: number}> = [];
    for (const [nodeStr, rank] of Object.entries(result.ranks)) {
        nodeRanks.push({node: nodeStr as NodeId, rank});
    }

    // Sort by rank in descending order
    nodeRanks.sort((a, b) => b.rank - a.rank);

    return nodeRanks.slice(0, k);
}

/**
 * Normalize ranks so they sum to 1
 */
function normalizeRanks(ranks: Map<NodeId, number>): void {
    let sum = 0;
    for (const rank of ranks.values()) {
        sum += rank;
    }

    if (sum > 0) {
        for (const [nodeId, rank] of ranks) {
            ranks.set(nodeId, rank / sum);
        }
    }
}