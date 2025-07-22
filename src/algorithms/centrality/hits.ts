import type {Graph} from "../../core/graph.js";
import type {CentralityOptions} from "../../types/index.js";

/**
 * HITS (Hyperlink-Induced Topic Search) algorithm implementation
 *
 * Identifies hub and authority scores for nodes in a graph.
 * - Authorities: nodes with valuable information (pointed to by hubs)
 * - Hubs: nodes that point to many authorities
 *
 * Originally designed for web page ranking but applicable to any directed network.
 *
 * Time complexity: O(V + E) per iteration
 * Space complexity: O(V)
 */

export interface HITSResult {
    hubs: Record<string, number>;
    authorities: Record<string, number>;
}

export interface HITSOptions extends CentralityOptions {
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number; // Convergence tolerance (default: 1e-6)
}

/**
 * Calculate HITS hub and authority scores for all nodes in the graph
 * Uses iterative method with normalization
 */
export function hits(
    graph: Graph,
    options: HITSOptions = {},
): HITSResult {
    const {
        maxIterations = 100,
        tolerance = 1e-6,
        normalized = true,
    } = options;

    const hubs: Record<string, number> = {};
    const authorities: Record<string, number> = {};

    const nodes = Array.from(graph.nodes());
    const nodeIds = nodes.map((node) => node.id);

    if (nodeIds.length === 0) {
        return {hubs, authorities};
    }

    // Initialize scores
    let currentHubs = new Map<string, number>();
    let currentAuthorities = new Map<string, number>();
    let previousHubs = new Map<string, number>();
    let previousAuthorities = new Map<string, number>();

    // Start with uniform distribution
    const initialValue = 1.0 / Math.sqrt(nodeIds.length);
    for (const nodeId of nodeIds) {
        const key = nodeId.toString();
        currentHubs.set(key, initialValue);
        currentAuthorities.set(key, initialValue);
    }

    // Iterative computation
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        previousHubs = new Map(currentHubs);
        previousAuthorities = new Map(currentAuthorities);

        // Update authority scores
        // Authority score = sum of hub scores of nodes pointing to it
        const newAuthorities = new Map<string, number>();
        for (const nodeId of nodeIds) {
            let authorityScore = 0;
            const inNeighbors = Array.from(graph.inNeighbors(nodeId));

            for (const inNeighbor of inNeighbors) {
                const neighborKey = inNeighbor.toString();
                authorityScore += previousHubs.get(neighborKey) ?? 0;
            }

            newAuthorities.set(nodeId.toString(), authorityScore);
        }

        // Update hub scores
        // Hub score = sum of authority scores of nodes it points to
        const newHubs = new Map<string, number>();
        for (const nodeId of nodeIds) {
            let hubScore = 0;
            const outNeighbors = Array.from(graph.outNeighbors(nodeId));

            for (const outNeighbor of outNeighbors) {
                const neighborKey = outNeighbor.toString();
                hubScore += previousAuthorities.get(neighborKey) ?? 0;
            }

            newHubs.set(nodeId.toString(), hubScore);
        }

        // Normalize authority scores
        let authNorm = 0;
        for (const value of Array.from(newAuthorities.values())) {
            authNorm += value * value;
        }
        authNorm = Math.sqrt(authNorm);

        if (authNorm > 0) {
            for (const [nodeId, value] of Array.from(newAuthorities)) {
                newAuthorities.set(nodeId, value / authNorm);
            }
        }

        // Normalize hub scores
        let hubNorm = 0;
        for (const value of Array.from(newHubs.values())) {
            hubNorm += value * value;
        }
        hubNorm = Math.sqrt(hubNorm);

        if (hubNorm > 0) {
            for (const [nodeId, value] of Array.from(newHubs)) {
                newHubs.set(nodeId, value / hubNorm);
            }
        }

        currentAuthorities = newAuthorities;
        currentHubs = newHubs;

        // Check for convergence
        let maxDiff = 0;
        for (const [nodeId, value] of currentHubs) {
            const prevValue = previousHubs.get(nodeId) ?? 0;
            const diff = Math.abs(value - prevValue);
            maxDiff = Math.max(maxDiff, diff);
        }
        for (const [nodeId, value] of currentAuthorities) {
            const prevValue = previousAuthorities.get(nodeId) ?? 0;
            const diff = Math.abs(value - prevValue);
            maxDiff = Math.max(maxDiff, diff);
        }

        if (maxDiff < tolerance) {
            break;
        }
    }

    // Prepare results
    for (const [nodeId, value] of currentHubs) {
        hubs[nodeId] = value;
    }
    for (const [nodeId, value] of currentAuthorities) {
        authorities[nodeId] = value;
    }

    // The algorithm already normalizes to unit L2 norm during iterations
    // Additional max normalization is only applied if explicitly requested
    if (!normalized) {
        // If normalization is explicitly disabled, normalize to [0, 1] range
        let maxHub = 0;
        let maxAuth = 0;

        for (const value of Object.values(hubs)) {
            maxHub = Math.max(maxHub, value);
        }
        for (const value of Object.values(authorities)) {
            maxAuth = Math.max(maxAuth, value);
        }

        if (maxHub > 0) {
            for (const nodeId of Object.keys(hubs)) {
                const hubValue = hubs[nodeId];
                if (hubValue !== undefined) {
                    hubs[nodeId] = hubValue / maxHub;
                }
            }
        }

        if (maxAuth > 0) {
            for (const nodeId of Object.keys(authorities)) {
                const authValue = authorities[nodeId];
                if (authValue !== undefined) {
                    authorities[nodeId] = authValue / maxAuth;
                }
            }
        }
    }

    return {hubs, authorities};
}

/**
 * Calculate HITS scores for a specific node
 */
export function nodeHITS(
    graph: Graph,
    nodeId: string | number,
    options: HITSOptions = {},
): {hub: number, authority: number} {
    if (!graph.hasNode(nodeId)) {
        throw new Error(`Node ${String(nodeId)} not found in graph`);
    }

    const result = hits(graph, options);
    const key = nodeId.toString();

    return {
        hub: result.hubs[key] ?? 0,
        authority: result.authorities[key] ?? 0,
    };
}
