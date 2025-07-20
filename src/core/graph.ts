import type {Edge, GraphConfig, Node, NodeId} from "../types/index.js";

/**
 * Core Graph data structure for the Graphty Algorithms library
 *
 * Provides efficient graph representation with support for both directed and undirected graphs.
 * Uses adjacency lists for optimal performance with sparse graphs.
 */
export class Graph {
    private nodeMap: Map<NodeId, Node>;
    private adjacencyList: Map<NodeId, Map<NodeId, Edge>>;
    private incomingEdges: Map<NodeId, Map<NodeId, Edge>>; // For directed graphs
    private config: GraphConfig;
    private edgeCount: number;

    constructor(config: Partial<GraphConfig> = {}) {
        this.config = {
            directed: false,
            allowSelfLoops: true,
            allowParallelEdges: false,
            ... config,
        };
        this.nodeMap = new Map();
        this.adjacencyList = new Map();
        this.incomingEdges = new Map();
        this.edgeCount = 0;
    }

    /**
     * Add a node to the graph
     */
    addNode(id: NodeId, data?: Record<string, unknown>): void {
        if (!this.nodeMap.has(id)) {
            this.nodeMap.set(id, {id, data});
            this.adjacencyList.set(id, new Map());

            if (this.config.directed) {
                this.incomingEdges.set(id, new Map());
            }
        }
    }

    /**
     * Remove a node from the graph
     */
    removeNode(id: NodeId): boolean {
        if (!this.nodeMap.has(id)) {
            return false;
        }

        // Remove all edges connected to this node
        const outgoingEdges = this.adjacencyList.get(id);
        if (outgoingEdges) {
            for (const targetId of Array.from(outgoingEdges.keys())) {
                this.removeEdge(id, targetId);
            }
        }

        if (this.config.directed) {
            const incomingEdges = this.incomingEdges.get(id);
            if (incomingEdges) {
                for (const sourceId of Array.from(incomingEdges.keys())) {
                    this.removeEdge(sourceId, id);
                }
            }
        } else {
            // For undirected graphs, also remove edges where this node is the target
            for (const [nodeId, edges] of Array.from(this.adjacencyList)) {
                if (edges.has(id)) {
                    this.removeEdge(nodeId, id);
                }
            }
        }

        // Remove the node itself
        this.nodeMap.delete(id);
        this.adjacencyList.delete(id);

        if (this.config.directed) {
            this.incomingEdges.delete(id);
        }

        return true;
    }

    /**
     * Add an edge to the graph
     */
    addEdge(source: NodeId, target: NodeId, weight = 1, data?: Record<string, unknown>): void {
        // Ensure both nodes exist
        this.addNode(source);
        this.addNode(target);

        // Check self-loops
        if (!this.config.allowSelfLoops && source === target) {
            throw new Error("Self-loops are not allowed in this graph");
        }

        // Check parallel edges
        if (!this.config.allowParallelEdges && this.hasEdge(source, target)) {
            throw new Error("Parallel edges are not allowed in this graph");
        }

        const edge: Edge = {source, target, weight, data};

        // Add to adjacency list
        const sourceAdjacency = this.adjacencyList.get(source);

        if (sourceAdjacency) {
            sourceAdjacency.set(target, edge);
        }

        if (this.config.directed) {
            // For directed graphs, add to incoming edges list
            const targetIncoming = this.incomingEdges.get(target);

            if (targetIncoming) {
                targetIncoming.set(source, edge);
            }
        } else {
            // For undirected graphs, add the reverse edge
            if (source !== target) {
                const reverseEdge: Edge = {source: target, target: source, weight, data};
                const targetAdjacency = this.adjacencyList.get(target);

                if (targetAdjacency) {
                    targetAdjacency.set(source, reverseEdge);
                }
            }
        }

        this.edgeCount++;
    }

    /**
     * Remove an edge from the graph
     */
    removeEdge(source: NodeId, target: NodeId): boolean {
        const sourceEdges = this.adjacencyList.get(source);
        if (!sourceEdges?.has(target)) {
            return false;
        }

        sourceEdges.delete(target);

        if (this.config.directed) {
            const targetIncoming = this.incomingEdges.get(target);
            if (targetIncoming) {
                targetIncoming.delete(source);
            }
        } else {
            // For undirected graphs, remove the reverse edge
            const targetEdges = this.adjacencyList.get(target);
            if (targetEdges) {
                targetEdges.delete(source);
            }
        }

        this.edgeCount--;
        return true;
    }

    /**
     * Check if a node exists in the graph
     */
    hasNode(id: NodeId): boolean {
        return this.nodeMap.has(id);
    }

    /**
     * Check if an edge exists in the graph
     */
    hasEdge(source: NodeId, target: NodeId): boolean {
        const sourceEdges = this.adjacencyList.get(source);
        return sourceEdges ? sourceEdges.has(target) : false;
    }

    /**
     * Get a node by ID
     */
    getNode(id: NodeId): Node | undefined {
        return this.nodeMap.get(id);
    }

    /**
     * Get an edge by source and target
     */
    getEdge(source: NodeId, target: NodeId): Edge | undefined {
        const sourceEdges = this.adjacencyList.get(source);
        return sourceEdges ? sourceEdges.get(target) : undefined;
    }

    /**
     * Get the number of nodes in the graph
     */
    get nodeCount(): number {
        return this.nodeMap.size;
    }

    /**
     * Get the number of edges in the graph
     */
    get totalEdgeCount(): number {
        return this.edgeCount;
    }

    /**
     * Check if the graph is directed
     */
    get isDirected(): boolean {
        return this.config.directed;
    }

    /**
     * Get all nodes in the graph
     */
    nodes(): IterableIterator<Node> {
        return this.nodeMap.values();
    }

    /**
     * Get all edges in the graph
     */
    *edges(): IterableIterator<Edge> {
        for (const [source, edges] of Array.from(this.adjacencyList)) {
            for (const edge of edges.values()) {
                // For undirected graphs, only yield each edge once
                if (!this.config.directed && source > edge.target) {
                    continue;
                }

                yield edge;
            }
        }
    }

    /**
     * Get neighbors of a node (outgoing edges)
     */
    neighbors(nodeId: NodeId): IterableIterator<NodeId> {
        const edges = this.adjacencyList.get(nodeId);
        return edges ? edges.keys() : new Map().keys();
    }

    /**
     * Get incoming neighbors of a node (directed graphs only)
     */
    inNeighbors(nodeId: NodeId): IterableIterator<NodeId> {
        if (!this.config.directed) {
            return this.neighbors(nodeId);
        }

        const edges = this.incomingEdges.get(nodeId);
        return edges ? edges.keys() : new Map().keys();
    }

    /**
     * Get outgoing neighbors of a node
     */
    outNeighbors(nodeId: NodeId): IterableIterator<NodeId> {
        return this.neighbors(nodeId);
    }

    /**
     * Get the degree of a node
     */
    degree(nodeId: NodeId): number {
        if (this.config.directed) {
            return this.inDegree(nodeId) + this.outDegree(nodeId);
        }

        const edges = this.adjacencyList.get(nodeId);
        return edges ? edges.size : 0;
    }

    /**
     * Get the in-degree of a node
     */
    inDegree(nodeId: NodeId): number {
        if (!this.config.directed) {
            return this.degree(nodeId);
        }

        const edges = this.incomingEdges.get(nodeId);
        return edges ? edges.size : 0;
    }

    /**
     * Get the out-degree of a node
     */
    outDegree(nodeId: NodeId): number {
        const edges = this.adjacencyList.get(nodeId);
        return edges ? edges.size : 0;
    }

    /**
     * Create a copy of the graph
     */
    clone(): Graph {
        const cloned = new Graph(this.config);

        // Copy nodes
        for (const node of Array.from(this.nodeMap.values())) {
            cloned.addNode(node.id, node.data ? {... node.data} : undefined);
        }

        // Copy edges
        for (const edge of Array.from(this.edges())) {
            cloned.addEdge(
                edge.source,
                edge.target,
                edge.weight,
                edge.data ? {... edge.data} : undefined,
            );
        }

        return cloned;
    }

    /**
     * Get graph configuration
     */
    getConfig(): GraphConfig {
        return {... this.config};
    }

    /**
     * Clear all nodes and edges from the graph
     */
    clear(): void {
        this.nodeMap.clear();
        this.adjacencyList.clear();
        this.incomingEdges.clear();
        this.edgeCount = 0;
    }

    /**
     * Get the number of unique edges in the graph
     * For undirected graphs, each edge is counted once
     */
    get uniqueEdgeCount(): number {
        if (this.config.directed) {
            return this.edgeCount;
        }

        // For undirected graphs, we need to count each edge only once
        let count = 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _edge of Array.from(this.edges())) {
            count++;
        }
        return count;
    }
}
