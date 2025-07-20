import {Graph} from "../../core/graph.js";
import type {NodeId, TraversalOptions, TraversalResult} from "../../types/index.js";

/**
 * Depth-First Search (DFS) implementation
 *
 * Explores graph by going as deep as possible before backtracking.
 * Useful for cycle detection, topological sorting, and connectivity analysis.
 */

/**
 * DFS traversal options
 */
export interface DFSOptions extends TraversalOptions {
    recursive?: boolean; // Use recursive implementation (default: false for browser safety)
    preOrder?: boolean; // Visit nodes in pre-order (default: true)
}

/**
 * Perform depth-first search starting from a given node
 */
export function depthFirstSearch(
    graph: Graph,
    startNode: NodeId,
    options: DFSOptions = {},
): TraversalResult {
    if (!graph.hasNode(startNode)) {
        throw new Error(`Start node ${String(startNode)} not found in graph`);
    }

    const visited = new Set<NodeId>();
    const order: NodeId[] = [];
    const tree = new Map<NodeId, NodeId | null>();

    if (options.recursive) {
        dfsRecursive(graph, startNode, visited, order, tree, options, 0);
    } else {
        dfsIterative(graph, startNode, visited, order, tree, options);
    }

    return {visited, order, tree};
}

/**
 * Iterative DFS implementation (safer for browsers)
 */
function dfsIterative(
    graph: Graph,
    startNode: NodeId,
    visited: Set<NodeId>,
    order: NodeId[],
    tree: Map<NodeId, NodeId | null>,
    options: DFSOptions,
): void {
    if (options.preOrder === false) {
        // For post-order, use a simpler recursive approach to ensure correctness
        dfsRecursive(graph, startNode, visited, order, tree, options, 0, null);
        return;
    }

    const stack: {node: NodeId, parent: NodeId | null, depth: number}[] = [];
    stack.push({node: startNode, parent: null, depth: 0});

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) {
            break;
        }

        if (!visited.has(current.node)) {
            visited.add(current.node);
            tree.set(current.node, current.parent);

            // Pre-order processing
            order.push(current.node);

            // Call visitor callback if provided
            if (options.visitCallback) {
                options.visitCallback(current.node, current.depth);
            }

            // Early termination if target found
            if (options.targetNode && current.node === options.targetNode) {
                break;
            }

            // Add neighbors to stack in reverse order to maintain left-to-right traversal
            const neighbors = Array.from(graph.neighbors(current.node));
            for (let i = neighbors.length - 1; i >= 0; i--) {
                const neighbor = neighbors[i];
                if (!visited.has(neighbor)) {
                    stack.push({node: neighbor, parent: current.node, depth: current.depth + 1});
                }
            }
        }
    }
}

/**
 * Recursive DFS implementation
 */
function dfsRecursive(
    graph: Graph,
    node: NodeId,
    visited: Set<NodeId>,
    order: NodeId[],
    tree: Map<NodeId, NodeId | null>,
    options: DFSOptions,
    depth: number,
    parent: NodeId | null = null,
): void {
    visited.add(node);
    tree.set(node, parent);

    // Pre-order processing
    if (options.preOrder !== false) {
        order.push(node);

        if (options.visitCallback) {
            options.visitCallback(node, depth);
        }

        // Early termination if target found
        if (options.targetNode && node === options.targetNode) {
            return;
        }
    }

    // Recursively visit neighbors
    for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
            dfsRecursive(graph, neighbor, visited, order, tree, options, depth + 1, node);
        }
    }

    // Post-order processing
    if (options.preOrder === false) {
        order.push(node);

        if (options.visitCallback) {
            options.visitCallback(node, depth);
        }
    }
}

/**
 * Detect cycles in a graph using DFS
 */
export function hasCycleDFS(graph: Graph): boolean {
    const visited = new Set<NodeId>();

    // Check each unvisited node for cycles
    for (const node of graph.nodes()) {
        if (!visited.has(node.id)) {
            if (graph.isDirected) {
                const recursionStack = new Set<NodeId>();
                if (hasCycleUtilDirected(graph, node.id, visited, recursionStack)) {
                    return true;
                }
            } else {
                if (hasCycleUtilUndirected(graph, node.id, visited, null)) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Utility function for cycle detection in directed graphs
 */
function hasCycleUtilDirected(
    graph: Graph,
    node: NodeId,
    visited: Set<NodeId>,
    recursionStack: Set<NodeId>,
): boolean {
    visited.add(node);
    recursionStack.add(node);

    // Check all neighbors
    for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
            if (hasCycleUtilDirected(graph, neighbor, visited, recursionStack)) {
                return true;
            }
        } else if (recursionStack.has(neighbor)) {
            // Back edge found - cycle detected
            return true;
        }
    }

    recursionStack.delete(node);
    return false;
}

/**
 * Utility function for cycle detection in undirected graphs
 */
function hasCycleUtilUndirected(
    graph: Graph,
    node: NodeId,
    visited: Set<NodeId>,
    parent: NodeId | null,
): boolean {
    visited.add(node);

    // Check all neighbors
    for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
            if (hasCycleUtilUndirected(graph, neighbor, visited, node)) {
                return true;
            }
        } else if (neighbor !== parent) {
            // Found a visited node that's not the parent - cycle detected
            return true;
        }
    }

    return false;
}

/**
 * Topological sorting using DFS (for directed acyclic graphs)
 */
export function topologicalSort(graph: Graph): NodeId[] | null {
    if (!graph.isDirected) {
        throw new Error("Topological sort requires a directed graph");
    }

    // First check if graph has cycles
    if (hasCycleDFS(graph)) {
        return null; // Cannot topologically sort a graph with cycles
    }

    const visited = new Set<NodeId>();
    const stack: NodeId[] = [];

    // Perform DFS from each unvisited node
    for (const node of graph.nodes()) {
        if (!visited.has(node.id)) {
            topologicalSortUtil(graph, node.id, visited, stack);
        }
    }

    // Return nodes in reverse order of finishing times
    return stack.reverse();
}

/**
 * Utility function for topological sorting
 */
function topologicalSortUtil(
    graph: Graph,
    node: NodeId,
    visited: Set<NodeId>,
    stack: NodeId[],
): void {
    visited.add(node);

    // Visit all neighbors first
    for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
            topologicalSortUtil(graph, neighbor, visited, stack);
        }
    }

    // Add current node to stack after visiting all neighbors
    stack.push(node);
}

/**
 * Find strongly connected components using DFS (for directed graphs)
 */
export function findStronglyConnectedComponents(graph: Graph): NodeId[][] {
    if (!graph.isDirected) {
        throw new Error("Strongly connected components require a directed graph");
    }

    const visited = new Set<NodeId>();
    const finishOrder: NodeId[] = [];

    // Step 1: Get nodes in order of finishing times
    for (const node of graph.nodes()) {
        if (!visited.has(node.id)) {
            dfsFinishOrder(graph, node.id, visited, finishOrder);
        }
    }

    // Step 2: Create transpose graph (reverse all edges)
    const transposeGraph = createTransposeGraph(graph);

    // Step 3: DFS on transpose graph in reverse finish order
    const visited2 = new Set<NodeId>();
    const components: NodeId[][] = [];

    for (let i = finishOrder.length - 1; i >= 0; i--) {
        const node = finishOrder[i];
        if (!visited2.has(node)) {
            const component: NodeId[] = [];
            dfsCollectComponent(transposeGraph, node, visited2, component);
            components.push(component);
        }
    }

    return components;
}

/**
 * DFS to record finish order
 */
function dfsFinishOrder(
    graph: Graph,
    node: NodeId,
    visited: Set<NodeId>,
    finishOrder: NodeId[],
): void {
    visited.add(node);

    for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
            dfsFinishOrder(graph, neighbor, visited, finishOrder);
        }
    }

    finishOrder.push(node);
}

/**
 * DFS to collect nodes in a component
 */
function dfsCollectComponent(
    graph: Graph,
    node: NodeId,
    visited: Set<NodeId>,
    component: NodeId[],
): void {
    visited.add(node);
    component.push(node);

    for (const neighbor of graph.neighbors(node)) {
        if (!visited.has(neighbor)) {
            dfsCollectComponent(graph, neighbor, visited, component);
        }
    }
}

/**
 * Create transpose (reverse) of a directed graph
 */
function createTransposeGraph(graph: Graph): Graph {
    const transpose = new Graph({directed: true});

    // Add all nodes
    for (const node of graph.nodes()) {
        transpose.addNode(node.id, node.data);
    }

    // Add reverse edges
    for (const edge of graph.edges()) {
        transpose.addEdge(edge.target, edge.source, edge.weight, edge.data);
    }

    return transpose;
}
