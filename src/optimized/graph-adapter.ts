import type {Graph} from "../core/graph.js";
import type {NodeId} from "../types/index.js";
import {CSRGraph, type ReadonlyGraph} from "./csr-graph.js";

/**
 * Adapter to convert standard Graph to CSR format
 *
 * Provides transparent conversion while maintaining API compatibility
 */
export class GraphAdapter<TNodeId = NodeId> implements ReadonlyGraph<TNodeId> {
    private csrGraph: CSRGraph<TNodeId>;

    constructor(graph: Graph | ReadonlyGraph<TNodeId>) {
    // Check if already a CSRGraph
        if (graph instanceof CSRGraph) {
            this.csrGraph = graph as CSRGraph<TNodeId>;
        } else {
            // Convert to CSR format
            this.csrGraph = this.convertToCSR(graph);
        }
    }

    /**
   * Convert standard graph to CSR format
   */
    private convertToCSR(graph: Graph | ReadonlyGraph<TNodeId>): CSRGraph<TNodeId> {
        const adjacencyList = new Map<TNodeId, TNodeId[]>();
        const weights = new Map<string, number>();

        // Handle both Graph and ReadonlyGraph interfaces
        if ("nodes" in graph && typeof graph.nodes === "function") {
            // Build adjacency list from Graph
            for (const node of graph.nodes()) {
                const nodeId = (node as {id: TNodeId}).id;
                const neighbors: TNodeId[] = [];

                const graphTyped = graph as Graph;
                for (const neighborId of graphTyped.neighbors(nodeId as NodeId)) {
                    neighbors.push(neighborId as TNodeId);

                    // Get edge weight if available
                    if ("getEdge" in graph && typeof graph.getEdge === "function") {
                        const edge = graphTyped.getEdge(nodeId as NodeId, neighborId);
                        if (edge?.weight !== undefined) {
                            weights.set(`${String(nodeId)}-${String(neighborId)}`, edge.weight);
                        }
                    }
                }

                adjacencyList.set(nodeId, neighbors);
            }
        }

        return new CSRGraph(adjacencyList, weights.size > 0 ? weights : undefined);
    }

    // Delegate all methods to CSR implementation
    nodeCount(): number {
        return this.csrGraph.nodeCount();
    }

    edgeCount(): number {
        return this.csrGraph.edgeCount();
    }

    hasNode(nodeId: TNodeId): boolean {
        return this.csrGraph.hasNode(nodeId);
    }

    hasEdge(source: TNodeId, target: TNodeId): boolean {
        return this.csrGraph.hasEdge(source, target);
    }

    neighbors(nodeId: TNodeId): IterableIterator<TNodeId> {
        return this.csrGraph.neighbors(nodeId);
    }

    outDegree(nodeId: TNodeId): number {
        return this.csrGraph.outDegree(nodeId);
    }

    nodes(): IterableIterator<TNodeId> {
        return this.csrGraph.nodes();
    }

    /**
   * Get the underlying CSR graph
   */
    getCSRGraph(): CSRGraph<TNodeId> {
        return this.csrGraph;
    }
}

/**
 * Configuration for graph algorithm optimizations
 */
export interface GraphAlgorithmConfig {
    // Enable optimizations
    useDirectionOptimizedBFS?: boolean;
    useCSRFormat?: boolean;
    useBitPackedStructures?: boolean;

    // Algorithm-specific parameters
    bfsAlpha?: number;
    bfsBeta?: number;

    // Memory vs speed tradeoffs
    preallocateSize?: number;
    enableCaching?: boolean;
}

/**
 * Configure optimizations globally
 * @deprecated This function is a no-op and will be removed in a future version
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function configureOptimizations(_config: GraphAlgorithmConfig): void {
    // No-op for backward compatibility
}

/**
 * Get current configuration
 * @deprecated This function returns empty config and will be removed in a future version
 */
export function getOptimizationConfig(): GraphAlgorithmConfig {
    return {};
}

/**
 * Check if a graph is already in CSR format
 */
export function isCSRGraph<TNodeId = NodeId>(graph: unknown): graph is CSRGraph<TNodeId> {
    return graph instanceof CSRGraph;
}

/**
 * Convert any graph to CSR format
 */
export function toCSRGraph<TNodeId = NodeId>(
    graph: Graph | ReadonlyGraph<TNodeId> | CSRGraph<TNodeId>,
): CSRGraph<TNodeId> {
    if (isCSRGraph<TNodeId>(graph)) {
        return graph;
    }

    const adapter = new GraphAdapter<TNodeId>(graph);
    return adapter.getCSRGraph();
}

/**
 * Create an optimized graph from nodes and edges
 */
export function createOptimizedGraph<TNodeId = NodeId>(
    nodes: TNodeId[],
    edges: [TNodeId, TNodeId, number?][],
): CSRGraph<TNodeId> {
    const adjacencyList = new Map<TNodeId, TNodeId[]>();
    const weights = new Map<string, number>();

    // Initialize nodes
    for (const node of nodes) {
        adjacencyList.set(node, []);
    }

    // Add edges
    for (const [source, target, weight] of edges) {
        const neighbors = adjacencyList.get(source);
        if (neighbors) {
            neighbors.push(target);
            if (weight !== undefined) {
                weights.set(`${String(source)}-${String(target)}`, weight);
            }
        }
    }

    return new CSRGraph(adjacencyList, weights.size > 0 ? weights : undefined);
}
