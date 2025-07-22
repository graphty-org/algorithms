import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * Graph Isomorphism (VF2) algorithm implementation
 *
 * Determines if two graphs are isomorphic (structurally identical).
 * Two graphs are isomorphic if there exists a bijection between their vertices
 * that preserves adjacency.
 *
 * Based on the VF2 algorithm by Cordella et al. (2004)
 *
 * Time complexity: O(n! × n) worst case, but typically much faster
 * Space complexity: O(n)
 */

export interface IsomorphismResult {
    isIsomorphic: boolean;
    mapping?: Map<NodeId, NodeId>; // Maps nodes from graph1 to graph2
}

export interface IsomorphismOptions {
    nodeMatch?: (node1: NodeId, node2: NodeId, g1: Graph, g2: Graph) => boolean;
    edgeMatch?: (edge1: [NodeId, NodeId], edge2: [NodeId, NodeId], g1: Graph, g2: Graph) => boolean;
    findAllMappings?: boolean; // Find all possible isomorphisms
}

interface VF2State {
    core1: Map<NodeId, NodeId>; // Mapping from G1 to G2
    core2: Map<NodeId, NodeId>; // Mapping from G2 to G1
    in1: Map<NodeId, number>; // Terminal set in G1
    in2: Map<NodeId, number>; // Terminal set in G2
    out1: Map<NodeId, number>; // Terminal set out G1
    out2: Map<NodeId, number>; // Terminal set out G2
    depth: number; // Current depth of search
}

/**
 * Check if two graphs are isomorphic using VF2 algorithm
 */
export function isGraphIsomorphic(
    graph1: Graph,
    graph2: Graph,
    options: IsomorphismOptions = {},
): IsomorphismResult {
    // Quick checks
    if (graph1.nodeCount !== graph2.nodeCount || graph1.totalEdgeCount !== graph2.totalEdgeCount) {
        return {isIsomorphic: false};
    }

    if (graph1.isDirected !== graph2.isDirected) {
        return {isIsomorphic: false};
    }

    const nodes1 = Array.from(graph1.nodes()).map((n) => n.id);
    const nodes2 = Array.from(graph2.nodes()).map((n) => n.id);

    // Check degree sequences
    const degrees1 = nodes1.map((n) => graph1.degree(n)).sort((a, b) => a - b);
    const degrees2 = nodes2.map((n) => graph2.degree(n)).sort((a, b) => a - b);

    for (let i = 0; i < degrees1.length; i++) {
        if (degrees1[i] !== degrees2[i]) {
            return {isIsomorphic: false};
        }
    }

    // Initialize VF2 state
    const state: VF2State = {
        core1: new Map(),
        core2: new Map(),
        in1: new Map(),
        in2: new Map(),
        out1: new Map(),
        out2: new Map(),
        depth: 0,
    };

    // Find isomorphism
    const mappings: Map<NodeId, NodeId>[] = [];
    const found = vf2Recurse(graph1, graph2, state, nodes1, nodes2, options, mappings);

    if (found && mappings.length > 0) {
        return {
            isIsomorphic: true,
            mapping: mappings[0] ?? new Map<NodeId, NodeId>(),
        };
    }

    return {isIsomorphic: false};
}

/**
 * VF2 recursive search
 */
function vf2Recurse(
    g1: Graph,
    g2: Graph,
    state: VF2State,
    nodes1: NodeId[],
    nodes2: NodeId[],
    options: IsomorphismOptions,
    mappings: Map<NodeId, NodeId>[],
): boolean {
    // Check if we've found a complete mapping
    if (state.core1.size === nodes1.length) {
        mappings.push(new Map(state.core1));
        return !options.findAllMappings; // Continue if we want all mappings
    }

    // Get candidate pairs
    const candidates = getCandidatePairs(g1, g2, state, nodes1, nodes2);

    for (const [node1, node2] of candidates) {
        if (isFeasible(g1, g2, state, node1, node2, options)) {
            // Add pair to mapping
            const newState = addPair(g1, g2, state, node1, node2);

            if (vf2Recurse(g1, g2, newState, nodes1, nodes2, options, mappings)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Get candidate pairs for the next mapping
 */
function getCandidatePairs(
    g1: Graph,
    g2: Graph,
    state: VF2State,
    nodes1: NodeId[],
    nodes2: NodeId[],
): [NodeId, NodeId][] {
    const pairs: [NodeId, NodeId][] = [];

    // Try to pick from terminal sets first
    let node1: NodeId | null = null;

    // Pick from out1
    for (const [n] of state.out1) {
        if (!state.core1.has(n)) {
            node1 = n;
            break;
        }
    }

    // If not found, pick from in1
    if (!node1) {
        for (const [n] of state.in1) {
            if (!state.core1.has(n)) {
                node1 = n;
                break;
            }
        }
    }

    // If still not found, pick any unmapped node
    if (!node1) {
        for (const n of nodes1) {
            if (!state.core1.has(n)) {
                node1 = n;
                break;
            }
        }
    }

    if (!node1) {
        return pairs;
    }

    // Find compatible nodes in G2
    for (const node2 of nodes2) {
        if (!state.core2.has(node2)) {
            // Basic compatibility check
            if (g1.degree(node1) === g2.degree(node2)) {
                pairs.push([node1, node2]);
            }
        }
    }

    return pairs;
}

/**
 * Check if a pair is feasible
 */
function isFeasible(
    g1: Graph,
    g2: Graph,
    state: VF2State,
    node1: NodeId,
    node2: NodeId,
    options: IsomorphismOptions,
): boolean {
    // Node match predicate
    if (options.nodeMatch && !options.nodeMatch(node1, node2, g1, g2)) {
        return false;
    }

    // Check syntactic feasibility
    const neighbors1 = new Set(g1.neighbors(node1));
    const neighbors2 = new Set(g2.neighbors(node2));

    // Check that mapped neighbors correspond
    for (const [n1, n2] of state.core1) {
        if (neighbors1.has(n1)) {
            if (!neighbors2.has(n2)) {
                return false;
            }

            // Edge match predicate
            if (options.edgeMatch && !options.edgeMatch([node1, n1], [node2, n2], g1, g2)) {
                return false;
            }
        } else if (neighbors2.has(n2)) {
            return false;
        }
    }

    // Check terminal set sizes
    let new1In = 0; let new1Out = 0; let term1In = 0; let term1Out = 0;
    let new2In = 0; let new2Out = 0; let term2In = 0; let term2Out = 0;

    for (const neighbor of neighbors1) {
        if (state.core1.has(neighbor)) {
            // Already mapped
        } else if (state.in1.has(neighbor)) {
            term1In++;
        } else if (state.out1.has(neighbor)) {
            term1Out++;
        } else {
            if (g1.isDirected) {
                if (g1.hasEdge(neighbor, node1)) {
                    new1In++;
                }

                if (g1.hasEdge(node1, neighbor)) {
                    new1Out++;
                }
            } else {
                new1In++;
                new1Out++;
            }
        }
    }

    for (const neighbor of neighbors2) {
        if (state.core2.has(neighbor)) {
            // Already mapped
        } else if (state.in2.has(neighbor)) {
            term2In++;
        } else if (state.out2.has(neighbor)) {
            term2Out++;
        } else {
            if (g2.isDirected) {
                if (g2.hasEdge(neighbor, node2)) {
                    new2In++;
                }

                if (g2.hasEdge(node2, neighbor)) {
                    new2Out++;
                }
            } else {
                new2In++;
                new2Out++;
            }
        }
    }

    return term1In === term2In && term1Out === term2Out &&
           new1In === new2In && new1Out === new2Out;
}

/**
 * Add a pair to the mapping and update terminal sets
 */
function addPair(
    g1: Graph,
    g2: Graph,
    state: VF2State,
    node1: NodeId,
    node2: NodeId,
): VF2State {
    const newState: VF2State = {
        core1: new Map(state.core1),
        core2: new Map(state.core2),
        in1: new Map(state.in1),
        in2: new Map(state.in2),
        out1: new Map(state.out1),
        out2: new Map(state.out2),
        depth: state.depth + 1,
    };

    newState.core1.set(node1, node2);
    newState.core2.set(node2, node1);

    // Update terminal sets
    const neighbors1 = g1.neighbors(node1);
    for (const neighbor of neighbors1) {
        if (!newState.core1.has(neighbor) && !newState.in1.has(neighbor) && !newState.out1.has(neighbor)) {
            if (g1.isDirected) {
                if (g1.hasEdge(neighbor, node1)) {
                    newState.in1.set(neighbor, newState.depth);
                }

                if (g1.hasEdge(node1, neighbor)) {
                    newState.out1.set(neighbor, newState.depth);
                }
            } else {
                newState.in1.set(neighbor, newState.depth);
                newState.out1.set(neighbor, newState.depth);
            }
        }
    }

    const neighbors2 = g2.neighbors(node2);
    for (const neighbor of neighbors2) {
        if (!newState.core2.has(neighbor) && !newState.in2.has(neighbor) && !newState.out2.has(neighbor)) {
            if (g2.isDirected) {
                if (g2.hasEdge(neighbor, node2)) {
                    newState.in2.set(neighbor, newState.depth);
                }

                if (g2.hasEdge(node2, neighbor)) {
                    newState.out2.set(neighbor, newState.depth);
                }
            } else {
                newState.in2.set(neighbor, newState.depth);
                newState.out2.set(neighbor, newState.depth);
            }
        }
    }

    return newState;
}

/**
 * Find all isomorphisms between two graphs
 */
export function findAllIsomorphisms(
    graph1: Graph,
    graph2: Graph,
    options: IsomorphismOptions = {},
): Map<NodeId, NodeId>[] {
    // Quick checks
    if (graph1.nodeCount !== graph2.nodeCount || graph1.totalEdgeCount !== graph2.totalEdgeCount) {
        return [];
    }

    if (graph1.isDirected !== graph2.isDirected) {
        return [];
    }

    const nodes1 = Array.from(graph1.nodes()).map((n) => n.id);
    const nodes2 = Array.from(graph2.nodes()).map((n) => n.id);

    // Check degree sequences
    const degrees1 = nodes1.map((n) => graph1.degree(n)).sort((a, b) => a - b);
    const degrees2 = nodes2.map((n) => graph2.degree(n)).sort((a, b) => a - b);

    for (let i = 0; i < degrees1.length; i++) {
        if (degrees1[i] !== degrees2[i]) {
            return [];
        }
    }

    // Handle empty graphs
    if (nodes1.length === 0) {
        return [new Map<NodeId, NodeId>()];
    }

    // Initialize VF2 state
    const state: VF2State = {
        core1: new Map(),
        core2: new Map(),
        in1: new Map(),
        in2: new Map(),
        out1: new Map(),
        out2: new Map(),
        depth: 0,
    };

    // Find all isomorphisms
    const mappings: Map<NodeId, NodeId>[] = [];
    vf2Recurse(graph1, graph2, state, nodes1, nodes2, {... options, findAllMappings: true}, mappings);

    return mappings;
}
