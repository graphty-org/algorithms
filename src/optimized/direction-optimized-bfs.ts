import type {NodeId} from "../types/index.js";
import {CompactDistanceArray, GraphBitSet} from "./bit-packed.js";
import {CSRGraph} from "./csr-graph.js";

/**
 * Options for Direction-Optimized BFS
 */
export interface DirectionOptimizedBFSOptions {
    alpha?: number; // Default: 15 - Controls top-down to bottom-up switch
    beta?: number; // Default: 18 - Controls bottom-up to top-down switch
}

/**
 * Result of BFS traversal
 */
export interface BFSResult<TNodeId> {
    distances: Map<TNodeId, number>;
    parents: Map<TNodeId, TNodeId | null>;
    visitedCount: number;
}

/**
 * Direction-Optimized Breadth-First Search
 *
 * Dynamically switches between top-down and bottom-up search strategies
 * based on the size of the frontier. Particularly effective for low-diameter
 * graphs like social networks.
 *
 * Based on: Beamer, S., Asanović, K., & Patterson, D. (2012).
 * "Direction-optimizing breadth-first search." SC'12.
 */
export class DirectionOptimizedBFS<TNodeId = NodeId> {
    private graph: CSRGraph<TNodeId>;
    private alpha: number;
    private beta: number;

    // Data structures
    private parent: Int32Array; // -1 = unvisited, -2 = source, else parent ID
    private frontier: GraphBitSet; // Current frontier bitmap
    private nextFrontier: GraphBitSet; // Next level frontier
    private distances: CompactDistanceArray;

    constructor(graph: CSRGraph<TNodeId>, options?: DirectionOptimizedBFSOptions) {
        this.graph = graph;
        this.alpha = options?.alpha ?? 15;
        this.beta = options?.beta ?? 18;

        const nodeCount = graph.nodeCount();
        this.parent = new Int32Array(nodeCount).fill(-1);
        this.frontier = new GraphBitSet(nodeCount);
        this.nextFrontier = new GraphBitSet(nodeCount);
        this.distances = new CompactDistanceArray(nodeCount);
    }

    /**
   * Perform BFS from a single source
   */
    search(source: TNodeId): BFSResult<TNodeId> {
        const sourceIndex = this.graph.nodeToIndex(source);
        this.parent[sourceIndex] = -2; // Mark as source
        this.frontier.add(sourceIndex);
        this.distances.set(sourceIndex, 0);

        // let currentDistance = 0; // Variable not used
        // Initialize edgesToCheck to total edges to prevent immediate switch to bottom-up
        let edgesToCheck = this.graph.edgeCount();
        let scoutCount = 0; // Will be set after first top-down step
        let awakeCount = 1; // Number of nodes in current frontier
        let oldAwakeCount = 0;

        // Direction tracking
        let useBottomUp = false;

        while (!this.frontier.isEmpty()) {
            oldAwakeCount = awakeCount;

            if (useBottomUp) {
                // Check if we should switch back to top-down
                if (awakeCount >= oldAwakeCount ||
            awakeCount > this.graph.nodeCount() / this.beta) {
                    useBottomUp = false;
                }
            } else {
                // Check if we should switch to bottom-up
                if (scoutCount > edgesToCheck / this.alpha) {
                    useBottomUp = true;
                }
            }

            if (useBottomUp) {
                awakeCount = this.bottomUpStep();
            } else {
                scoutCount = this.topDownStep();
                awakeCount = this.nextFrontier.size();
            }

            // Swap frontiers
            this.frontier.swap(this.nextFrontier);
            this.nextFrontier.clear();

            // currentDistance++; // Variable not used
            edgesToCheck = this.calculateEdgesToCheck();
        }

        return this.buildResult();
    }

    /**
   * Top-down BFS step - explore from frontier
   */
    private topDownStep(): number {
        let scoutCount = 0;

        // Iterate through frontier nodes
        for (const node of this.frontier) {
            const currentDistance = this.distances.get(node);

            for (const neighbor of this.graph.iterateNeighborIndices(node)) {
                if (this.parent[neighbor] === -1) {
                    this.parent[neighbor] = node;
                    this.distances.set(neighbor, currentDistance + 1);
                    this.nextFrontier.add(neighbor);
                    scoutCount += this.graph.outDegreeByIndex(neighbor);
                }
            }
        }

        return scoutCount;
    }

    /**
   * Bottom-up BFS step - check unvisited nodes
   */
    private bottomUpStep(): number {
        const nodeCount = this.graph.nodeCount();
        let awakeCount = 0;

        // Check all unvisited nodes
        for (let node = 0; node < nodeCount; node++) {
            if (this.parent[node] === -1) {
                // Use incoming edges for bottom-up traversal
                for (const neighbor of this.graph.iterateIncomingNeighborIndices(node)) {
                    if (this.frontier.has(neighbor)) {
                        this.parent[node] = neighbor;
                        const neighborDist = this.distances.get(neighbor);
                        this.distances.set(node, neighborDist + 1);
                        this.nextFrontier.add(node);
                        awakeCount++;
                        break; // Found a parent, no need to check more
                    }
                }
            }
        }

        return awakeCount;
    }

    /**
   * Calculate edges to check for switching heuristic
   */
    private calculateEdgesToCheck(): number {
        let count = 0;
        for (const node of this.frontier) {
            count += this.graph.outDegreeByIndex(node);
        }
        return count;
    }

    /**
   * Build result map from internal data structures
   */
    private buildResult(): BFSResult<TNodeId> {
        const distances = new Map<TNodeId, number>();
        const parents = new Map<TNodeId, TNodeId | null>();
        let visitedCount = 0;

        for (let i = 0; i < this.graph.nodeCount(); i++) {
            if (this.parent[i] !== -1) {
                const nodeId = this.graph.indexToNodeId(i);
                distances.set(nodeId, this.distances.get(i));

                if (this.parent[i] === -2) {
                    // Source node
                    parents.set(nodeId, null);
                } else {
                    // Regular node with parent
                    const parentIndex = this.parent[i];
                    if (parentIndex !== undefined && parentIndex >= 0) {
                        parents.set(nodeId, this.graph.indexToNodeId(parentIndex));
                    }
                }

                visitedCount++;
            }
        }

        return {distances, parents, visitedCount};
    }

    /**
   * Perform multi-source BFS
   */
    searchMultiple(sources: TNodeId[]): BFSResult<TNodeId> {
    // Initialize multiple sources
        for (const source of sources) {
            const sourceIndex = this.graph.nodeToIndex(source);
            this.parent[sourceIndex] = -2; // Mark as source
            this.frontier.add(sourceIndex);
            this.distances.set(sourceIndex, 0);
        }

        // let currentDistance = 0; // Variable not used
        let edgesToCheck = 0;
        let scoutCount = 0;

        // Calculate initial edges to check
        for (const node of this.frontier) {
            const degree = this.graph.outDegreeByIndex(node);
            edgesToCheck += degree;
            scoutCount += degree;
        }

        let awakeCount = sources.length;
        let oldAwakeCount = 0;
        let useBottomUp = false;

        while (!this.frontier.isEmpty()) {
            oldAwakeCount = awakeCount;

            if (useBottomUp) {
                if (awakeCount >= oldAwakeCount ||
            awakeCount > this.graph.nodeCount() / this.beta) {
                    useBottomUp = false;
                }
            } else {
                if (scoutCount > edgesToCheck / this.alpha) {
                    useBottomUp = true;
                }
            }

            if (useBottomUp) {
                awakeCount = this.bottomUpStep();
            } else {
                scoutCount = this.topDownStep();
                awakeCount = this.nextFrontier.size();
            }

            this.frontier.swap(this.nextFrontier);
            this.nextFrontier.clear();

            // currentDistance++; // Variable not used
            edgesToCheck = this.calculateEdgesToCheck();
        }

        return this.buildResult();
    }

    /**
   * Reset internal state for reuse
   */
    reset(): void {
        this.parent.fill(-1);
        this.frontier.clear();
        this.nextFrontier.clear();
        this.distances.clear();
    }
}

/**
 * Convenience function for single-source BFS
 */
export function directionOptimizedBFS<TNodeId = NodeId>(
    graph: CSRGraph<TNodeId>,
    source: TNodeId,
    options?: DirectionOptimizedBFSOptions,
): BFSResult<TNodeId> {
    const bfs = new DirectionOptimizedBFS(graph, options);
    return bfs.search(source);
}

/**
 * Convenience function for multi-source BFS
 */
export function directionOptimizedBFSMultiple<TNodeId = NodeId>(
    graph: CSRGraph<TNodeId>,
    sources: TNodeId[],
    options?: DirectionOptimizedBFSOptions,
): BFSResult<TNodeId> {
    const bfs = new DirectionOptimizedBFS(graph, options);
    return bfs.searchMultiple(sources);
}
