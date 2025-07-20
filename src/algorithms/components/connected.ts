import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";
import {UnionFind} from "../../data-structures/union-find.js";

/**
 * Connected components algorithms
 *
 * Finds connected components in undirected graphs and strongly connected
 * components in directed graphs using various efficient algorithms.
 */

/**
 * Find connected components in an undirected graph using Union-Find
 */
export function connectedComponents(graph: Graph): NodeId[][] {
    if (graph.isDirected) {
        throw new Error("Connected components algorithm requires an undirected graph. Use stronglyConnectedComponents for directed graphs.");
    }

    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    
    if (nodes.length === 0) {
        return [];
    }

    const unionFind = new UnionFind(nodes);

    // Union connected nodes
    for (const edge of graph.edges()) {
        unionFind.union(edge.source, edge.target);
    }

    return unionFind.getAllComponents();
}

/**
 * Find connected components using DFS (alternative implementation)
 */
export function connectedComponentsDFS(graph: Graph): NodeId[][] {
    if (graph.isDirected) {
        throw new Error("Connected components algorithm requires an undirected graph");
    }

    const visited = new Set<NodeId>();
    const components: NodeId[][] = [];

    for (const node of graph.nodes()) {
        if (!visited.has(node.id)) {
            const component: NodeId[] = [];
            dfsComponent(graph, node.id, visited, component);
            components.push(component);
        }
    }

    return components;
}

/**
 * DFS helper for connected components
 */
function dfsComponent(
    graph: Graph,
    nodeId: NodeId,
    visited: Set<NodeId>,
    component: NodeId[],
): void {
    visited.add(nodeId);
    component.push(nodeId);

    for (const neighbor of graph.neighbors(nodeId)) {
        if (!visited.has(neighbor)) {
            dfsComponent(graph, neighbor, visited, component);
        }
    }
}

/**
 * Find the number of connected components
 */
export function numberOfConnectedComponents(graph: Graph): number {
    return connectedComponents(graph).length;
}

/**
 * Check if the graph is connected (has exactly one connected component)
 */
export function isConnected(graph: Graph): boolean {
    return numberOfConnectedComponents(graph) <= 1;
}

/**
 * Find the largest connected component
 */
export function largestConnectedComponent(graph: Graph): NodeId[] {
    const components = connectedComponents(graph);
    
    if (components.length === 0) {
        return [];
    }

    return components.reduce((largest, current) => 
        current.length > largest.length ? current : largest
    );
}

/**
 * Get the connected component containing a specific node
 */
export function getConnectedComponent(graph: Graph, nodeId: NodeId): NodeId[] {
    if (!graph.hasNode(nodeId)) {
        throw new Error(`Node ${String(nodeId)} not found in graph`);
    }

    if (graph.isDirected) {
        throw new Error("Connected components algorithm requires an undirected graph");
    }

    const visited = new Set<NodeId>();
    const component: NodeId[] = [];
    
    dfsComponent(graph, nodeId, visited, component);
    
    return component;
}

/**
 * Find strongly connected components using Tarjan's algorithm
 */
export function stronglyConnectedComponents(graph: Graph): NodeId[][] {
    if (!graph.isDirected) {
        throw new Error("Strongly connected components require a directed graph");
    }

    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    const components: NodeId[][] = [];
    const indices = new Map<NodeId, number>();
    const lowLinks = new Map<NodeId, number>();
    const onStack = new Set<NodeId>();
    const stack: NodeId[] = [];
    let index = 0;

    function tarjanSCC(nodeId: NodeId): void {
        // Set the depth index for this node
        indices.set(nodeId, index);
        lowLinks.set(nodeId, index);
        index++;
        stack.push(nodeId);
        onStack.add(nodeId);

        // Consider successors
        for (const neighbor of graph.neighbors(nodeId)) {
            if (!indices.has(neighbor)) {
                // Successor has not yet been visited; recurse on it
                tarjanSCC(neighbor);
                const nodeLL = lowLinks.get(nodeId) ?? 0;
                const neighborLL = lowLinks.get(neighbor) ?? 0;
                lowLinks.set(nodeId, Math.min(nodeLL, neighborLL));
            } else if (onStack.has(neighbor)) {
                // Successor is in stack and hence in the current SCC
                const nodeLL = lowLinks.get(nodeId) ?? 0;
                const neighborIndex = indices.get(neighbor) ?? 0;
                lowLinks.set(nodeId, Math.min(nodeLL, neighborIndex));
            }
        }

        // If nodeId is a root node, pop the stack and create an SCC
        const nodeIndex = indices.get(nodeId) ?? 0;
        const nodeLowLink = lowLinks.get(nodeId) ?? 0;
        
        if (nodeLowLink === nodeIndex) {
            const component: NodeId[] = [];
            let w: NodeId;
            
            do {
                w = stack.pop();
                if (w === undefined) {
                    break;
                }
                onStack.delete(w);
                component.push(w);
            } while (w !== nodeId);
            
            components.push(component);
        }
    }

    for (const nodeId of nodes) {
        if (!indices.has(nodeId)) {
            tarjanSCC(nodeId);
        }
    }

    return components;
}

/**
 * Check if a directed graph is strongly connected
 */
export function isStronglyConnected(graph: Graph): boolean {
    if (!graph.isDirected) {
        throw new Error("Strong connectivity check requires a directed graph");
    }

    const components = stronglyConnectedComponents(graph);
    return components.length <= 1;
}

/**
 * Find weakly connected components in a directed graph
 * (treat the graph as undirected for connectivity)
 */
export function weaklyConnectedComponents(graph: Graph): NodeId[][] {
    if (!graph.isDirected) {
        throw new Error("Weakly connected components are for directed graphs. Use connectedComponents for undirected graphs.");
    }

    const nodes = Array.from(graph.nodes()).map((node) => node.id);
    
    if (nodes.length === 0) {
        return [];
    }

    const unionFind = new UnionFind(nodes);

    // Union nodes connected by edges (ignore direction)
    for (const edge of graph.edges()) {
        unionFind.union(edge.source, edge.target);
    }

    return unionFind.getAllComponents();
}

/**
 * Check if a directed graph is weakly connected
 */
export function isWeaklyConnected(graph: Graph): boolean {
    if (!graph.isDirected) {
        throw new Error("Weak connectivity check requires a directed graph");
    }

    return weaklyConnectedComponents(graph).length <= 1;
}

/**
 * Find condensation graph (quotient graph of strongly connected components)
 */
export function condensationGraph(graph: Graph): {
    condensedGraph: Graph;
    componentMap: Map<NodeId, number>;
    components: NodeId[][];
} {
    if (!graph.isDirected) {
        throw new Error("Condensation graph requires a directed graph");
    }

    const components = stronglyConnectedComponents(graph);
    const componentMap = new Map<NodeId, number>();
    const condensedGraph = new (graph.constructor as new (...args: any[]) => Graph)({directed: true});

    // Map each node to its component index
    for (let i = 0; i < components.length; i++) {
        for (const nodeId of components[i]) {
            componentMap.set(nodeId, i);
        }
        // Add component as a node in condensed graph
        condensedGraph.addNode(i);
    }

    // Add edges between components
    const addedEdges = new Set<string>();
    
    for (const edge of graph.edges()) {
        const sourceComponent = componentMap.get(edge.source);
        const targetComponent = componentMap.get(edge.target);

        if (sourceComponent !== undefined && targetComponent !== undefined && 
            sourceComponent !== targetComponent) {
            const edgeKey = `${sourceComponent}-${targetComponent}`;
            
            if (!addedEdges.has(edgeKey)) {
                condensedGraph.addEdge(sourceComponent, targetComponent);
                addedEdges.add(edgeKey);
            }
        }
    }

    return {
        condensedGraph,
        componentMap,
        components,
    };
}