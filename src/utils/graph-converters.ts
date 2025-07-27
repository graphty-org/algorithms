import {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";

/**
 * Convert Graph class to Map representation
 * Used by community detection and flow algorithms
 */
export function graphToMap(graph: Graph): Map<string, Map<string, number>> {
    const map = new Map<string, Map<string, number>>();

    // Initialize all nodes
    for (const node of graph.nodes()) {
        map.set(String(node.id), new Map());
    }

    // Add edges with weights
    for (const edge of graph.edges()) {
        const source = String(edge.source);
        const target = String(edge.target);
        const weight = edge.weight ?? 1;

        const sourceMap = map.get(source);
        if (sourceMap) {
            sourceMap.set(target, weight);
        }

        // For undirected graphs, add reverse edge
        if (!graph.isDirected) {
            const targetMap = map.get(target);
            if (targetMap) {
                targetMap.set(source, weight);
            }
        }
    }

    return map;
}

/**
 * Convert Map representation to Graph class
 */
export function mapToGraph(
    map: Map<string, Map<string, number>>,
    isDirected = true,
): Graph {
    const graph = new Graph({directed: isDirected});

    // Add all nodes first
    for (const node of map.keys()) {
        graph.addNode(node);
    }

    // Add edges
    const processedEdges = new Set<string>();

    for (const [source, neighbors] of map) {
        for (const [target, weight] of neighbors) {
            const edgeKey = isDirected ? `${source}->${target}` : [source, target].sort().join("-");

            // Skip if we've already processed this edge (for undirected graphs)
            if (!isDirected && processedEdges.has(edgeKey)) {
                continue;
            }

            graph.addEdge(source, target, weight);
            processedEdges.add(edgeKey);
        }
    }

    return graph;
}

/**
 * Adapter for using Graph algorithms with Map representation
 * Implements a subset of Graph interface methods needed by algorithms
 */
export class GraphAdapter {
    private map: Map<string, Map<string, number>>;
    public readonly isDirected: boolean;

    constructor(map: Map<string, Map<string, number>>, isDirected = true) {
        this.map = map;
        this.isDirected = isDirected;
    }

    /**
     * Get all nodes
     */
    nodes(): {id: NodeId}[] {
        return Array.from(this.map.keys()).map((id) => ({id}));
    }

    /**
     * Get node count
     */
    get nodeCount(): number {
        return this.map.size;
    }

    /**
     * Check if node exists
     */
    hasNode(nodeId: NodeId): boolean {
        return this.map.has(String(nodeId));
    }

    /**
     * Get neighbors of a node
     */
    neighbors(nodeId: NodeId): NodeId[] {
        const neighbors = this.map.get(String(nodeId));
        if (!neighbors) {
            return [];
        }

        return Array.from(neighbors.keys());
    }

    /**
     * Get edge between two nodes
     */
    getEdge(source: NodeId, target: NodeId): {source: NodeId, target: NodeId, weight?: number} | null {
        const sourceNeighbors = this.map.get(String(source));
        if (!sourceNeighbors) {
            return null;
        }

        const weight = sourceNeighbors.get(String(target));
        if (weight === undefined) {
            return null;
        }

        return {source, target, weight};
    }

    /**
     * Check if edge exists
     */
    hasEdge(source: NodeId, target: NodeId): boolean {
        const sourceNeighbors = this.map.get(String(source));
        if (!sourceNeighbors) {
            return false;
        }

        return sourceNeighbors.has(String(target));
    }

    /**
     * Get all edges
     */
    edges(): {source: NodeId, target: NodeId, weight?: number}[] {
        const edges: {source: NodeId, target: NodeId, weight?: number}[] = [];
        const processedEdges = new Set<string>();

        for (const [source, neighbors] of this.map) {
            for (const [target, weight] of neighbors) {
                const edgeKey = this.isDirected ? `${source}->${target}` : [source, target].sort().join("-");

                // Skip if we've already processed this edge (for undirected graphs)
                if (!this.isDirected && processedEdges.has(edgeKey)) {
                    continue;
                }

                edges.push({source, target, weight});
                processedEdges.add(edgeKey);
            }
        }

        return edges;
    }

    /**
     * Get edge count
     */
    get edgeCount(): number {
        if (this.isDirected) {
            let count = 0;
            for (const neighbors of this.map.values()) {
                count += neighbors.size;
            }
            return count;
        }

        // For undirected graphs, count each edge once
        let count = 0;
        const counted = new Set<string>();

        for (const [source, neighbors] of this.map) {
            for (const target of neighbors.keys()) {
                const edgeKey = [source, target].sort().join("-");
                if (!counted.has(edgeKey)) {
                    counted.add(edgeKey);
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Get node degree
     */
    degree(nodeId: NodeId): number {
        const neighbors = this.map.get(String(nodeId));
        return neighbors ? neighbors.size : 0;
    }

    /**
     * Get in-degree (for directed graphs)
     */
    inDegree(nodeId: NodeId): number {
        if (!this.isDirected) {
            return this.degree(nodeId);
        }

        let count = 0;
        const targetId = String(nodeId);

        for (const neighbors of this.map.values()) {
            if (neighbors.has(targetId)) {
                count++;
            }
        }

        return count;
    }

    /**
     * Get out-degree (for directed graphs)
     */
    outDegree(nodeId: NodeId): number {
        return this.degree(nodeId);
    }

    /**
     * Get underlying map representation
     */
    getMap(): Map<string, Map<string, number>> {
        return this.map;
    }
}
