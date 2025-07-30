import type {Graph} from "../../core/graph.js";
import type {CommunityResult, NodeId} from "../../types/index.js";

/**
 * Optimized Louvain community detection algorithm with early pruning and threshold cycling
 *
 * Key optimizations:
 * - Leaf node pruning: Skip nodes with degree 1
 * - Importance ordering: Process high-impact nodes first
 * - Threshold cycling: Adaptive convergence thresholds
 * - Early termination: Stop when changes become insignificant
 *
 * Expected speedup: 2-5x on large graphs with many leaf nodes
 */

export interface OptimizedLouvainOptions {
    /**
     * Resolution parameter (default: 1.0)
     */
    resolution?: number;
    /**
     * Maximum iterations per level (default: 100)
     */
    maxIterations?: number;
    /**
     * Convergence tolerance (default: 1e-6)
     */
    tolerance?: number;
    /**
     * Enable leaf node pruning (default: true)
     */
    pruneLeaves?: boolean;
    /**
     * Enable importance-based node ordering (default: true)
     */
    importanceOrdering?: boolean;
    /**
     * Base pruning threshold (default: 0.01)
     */
    pruningThreshold?: number;
    /**
     * Enable adaptive threshold cycling (default: true)
     */
    thresholdCycling?: boolean;
}

interface PruningStats {
    leafNodesPruned: number;
    lowDegreeNodesPruned: number;
    stableNodesPruned: number;
}

export class OptimizedLouvain {
    private graph: Graph;
    private communities: Map<NodeId, number>;
    private communityWeights: Map<number, number>;
    private nodeWeights: Map<NodeId, number>;
    private nodeDegrees: Map<NodeId, number>;
    private totalWeight: number;
    private pruningStats: PruningStats;

    constructor(graph: Graph) {
        this.graph = graph;
        this.communities = new Map();
        this.communityWeights = new Map();
        this.nodeWeights = new Map();
        this.nodeDegrees = new Map();
        this.totalWeight = 0;
        this.pruningStats = {
            leafNodesPruned: 0,
            lowDegreeNodesPruned: 0,
            stableNodesPruned: 0,
        };
    }

    /**
     * Run optimized Louvain algorithm
     */
    public detectCommunities(options: OptimizedLouvainOptions = {}): CommunityResult {
        const {
            resolution = 1.0,
            maxIterations = 100,
            tolerance = 1e-6,
            pruneLeaves = true,
            importanceOrdering = true,
            pruningThreshold = 0.01,
            thresholdCycling = true,
        } = options;

        // Initialize
        this.initialize();
        let modularity = this.calculateModularity(resolution);
        let iteration = 0;
        let improved = true;

        while (iteration < maxIterations && improved) {
            // Get nodes in optimal processing order
            const orderedNodes = importanceOrdering ?
                this.getNodesInImportanceOrder() :
                Array.from(this.graph.nodes()).map((n) => n.id);

            // Apply adaptive threshold
            const threshold = thresholdCycling ?
                this.getAdaptiveThreshold(iteration, pruningThreshold) :
                0;

            // Perform local optimization
            improved = this.performLocalMoving(orderedNodes, {
                pruneLeaves,
                threshold,
                resolution,
            });

            if (improved) {
                const newModularity = this.calculateModularity(resolution);

                // Check convergence
                if (Math.abs(newModularity - modularity) < tolerance) {
                    break;
                }

                modularity = newModularity;
                iteration++;
            }
        }

        // Convert community assignments to result format
        const communityGroups = new Map<number, NodeId[]>();

        for (const [nodeId, community] of this.communities) {
            if (!communityGroups.has(community)) {
                communityGroups.set(community, []);
            }

            const group = communityGroups.get(community);
            if (group) {
                group.push(nodeId);
            }
        }

        return {
            communities: Array.from(communityGroups.values()),
            modularity,
            iterations: iteration,
        };
    }

    /**
     * Initialize data structures
     */
    private initialize(): void {
        let communityId = 0;

        // Initialize each node in its own community
        for (const node of this.graph.nodes()) {
            this.communities.set(node.id, communityId);

            // Calculate node weight and degree
            let nodeWeight = 0;
            let degree = 0;

            for (const neighbor of Array.from(this.graph.neighbors(node.id))) {
                const edge = this.graph.getEdge(node.id, neighbor);
                const weight = edge?.weight ?? 1;
                nodeWeight += weight;
                degree++;
            }

            // For undirected graphs, also check incoming edges
            if (!this.graph.isDirected) {
                for (const neighbor of Array.from(this.graph.inNeighbors(node.id))) {
                    if (!this.graph.hasEdge(node.id, neighbor)) {
                        const edge = this.graph.getEdge(neighbor, node.id);
                        const weight = edge?.weight ?? 1;
                        nodeWeight += weight;
                        degree++;
                    }
                }
            }

            this.nodeWeights.set(node.id, nodeWeight);
            this.nodeDegrees.set(node.id, degree);
            this.communityWeights.set(communityId, nodeWeight);
            this.totalWeight += nodeWeight;

            communityId++;
        }

        // Total weight is sum of all edge weights
        // For undirected graphs, each edge is counted twice from both endpoints
        this.totalWeight = this.totalWeight / 2;
    }

    /**
     * Get nodes ordered by importance (degree * log(weight))
     */
    private getNodesInImportanceOrder(): NodeId[] {
        const nodeImportance = new Map<NodeId, number>();

        for (const [nodeId, degree] of this.nodeDegrees) {
            const weight = this.nodeWeights.get(nodeId) ?? 0;
            // Importance score: combination of degree and weight
            // High-degree nodes and nodes with heavy edges are processed first
            const importance = degree * Math.log(1 + weight);
            nodeImportance.set(nodeId, importance);
        }

        // Sort by importance (descending)
        return Array.from(nodeImportance.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([nodeId]) => nodeId);
    }

    /**
     * Perform local moving phase with optimizations
     */
    private performLocalMoving(
        nodes: NodeId[],
        options: {
            pruneLeaves: boolean;
            threshold: number;
            resolution: number;
        },
    ): boolean {
        const {pruneLeaves, threshold, resolution} = options;
        let improvement = false;
        let hasChanged = true;

        while (hasChanged) {
            hasChanged = false;

            for (const nodeId of nodes) {
                // Early pruning: skip leaf nodes
                if (pruneLeaves && this.isLeafNode(nodeId)) {
                    this.pruningStats.leafNodesPruned++;
                    continue;
                }

                const currentCommunity = this.communities.get(nodeId) ?? 0;
                const neighborCommunities = this.getNeighborCommunities(nodeId);

                // Skip isolated nodes
                if (neighborCommunities.size === 0) {
                    continue;
                }

                // Find best community to move to
                let bestCommunity = currentCommunity;
                let bestGain = 0;

                // Remove node from its current community to calculate gains
                this.removeNodeFromCommunity(nodeId, currentCommunity);

                for (const community of neighborCommunities) {
                    const gain = this.calculateModularityGain(nodeId, community, resolution);

                    // Apply threshold - only move if gain exceeds threshold
                    if (gain > bestGain + threshold) {
                        bestGain = gain;
                        bestCommunity = community;
                    }
                }

                // Try staying in current community
                const currentGain = this.calculateModularityGain(nodeId, currentCommunity, resolution);
                if (currentGain > bestGain + threshold) {
                    bestGain = currentGain;
                    bestCommunity = currentCommunity;
                }

                // Add node to best community
                this.addNodeToCommunity(nodeId, bestCommunity);

                // Track if node moved
                if (bestCommunity !== currentCommunity) {
                    hasChanged = true;
                    improvement = true;
                }
            }
        }

        return improvement;
    }

    /**
     * Check if node is a leaf (degree 1)
     */
    private isLeafNode(nodeId: NodeId): boolean {
        const degree = this.nodeDegrees.get(nodeId) ?? 0;
        return degree === 1;
    }

    /**
     * Get adaptive threshold that decreases with iterations
     */
    private getAdaptiveThreshold(iteration: number, baseThreshold: number): number {
        // Exponentially decay threshold with iterations
        // This allows coarse movements early and fine-tuning later
        return baseThreshold * Math.pow(0.5, iteration / 10);
    }

    /**
     * Calculate modularity gain from moving a node to a community
     */
    private calculateModularityGain(
        nodeId: NodeId,
        targetCommunity: number,
        resolution: number,
    ): number {
        const nodeWeight = this.nodeWeights.get(nodeId) ?? 0;

        // Sum of weights from node to target community
        let weightToTarget = 0;

        for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
            if (this.communities.get(neighbor) === targetCommunity) {
                const edge = this.graph.getEdge(nodeId, neighbor);
                weightToTarget += edge?.weight ?? 1;
            }
        }

        // For undirected graphs, also check incoming edges
        if (!this.graph.isDirected) {
            for (const neighbor of Array.from(this.graph.inNeighbors(nodeId))) {
                if (this.communities.get(neighbor) === targetCommunity && !this.graph.hasEdge(nodeId, neighbor)) {
                    const edge = this.graph.getEdge(neighbor, nodeId);
                    weightToTarget += edge?.weight ?? 1;
                }
            }
        }

        // Weight of target community
        const targetWeight = this.communityWeights.get(targetCommunity) ?? 0;

        // Modularity gain formula
        const gain = (weightToTarget - ((resolution * nodeWeight * targetWeight) / (2 * this.totalWeight))) / this.totalWeight;

        return gain;
    }

    /**
     * Remove node from community (for gain calculation)
     */
    private removeNodeFromCommunity(nodeId: NodeId, community: number): void {
        const nodeWeight = this.nodeWeights.get(nodeId) ?? 0;
        this.communityWeights.set(community, (this.communityWeights.get(community) ?? 0) - nodeWeight);
        this.communities.delete(nodeId);
    }

    /**
     * Add node to community
     */
    private addNodeToCommunity(nodeId: NodeId, community: number): void {
        const nodeWeight = this.nodeWeights.get(nodeId) ?? 0;
        this.communityWeights.set(community, (this.communityWeights.get(community) ?? 0) + nodeWeight);
        this.communities.set(nodeId, community);
    }

    /**
     * Get neighboring communities of a node
     */
    private getNeighborCommunities(nodeId: NodeId): Set<number> {
        const communities = new Set<number>();

        for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
            const community = this.communities.get(neighbor);
            if (community !== undefined) {
                communities.add(community);
            }
        }

        // For undirected graphs, also check incoming edges
        if (!this.graph.isDirected) {
            for (const neighbor of Array.from(this.graph.inNeighbors(nodeId))) {
                const community = this.communities.get(neighbor);
                if (community !== undefined) {
                    communities.add(community);
                }
            }
        }

        return communities;
    }

    /**
     * Calculate total modularity
     */
    private calculateModularity(resolution: number): number {
        if (this.totalWeight === 0) {
            return 0;
        }

        let modularity = 0;

        // Sum over all communities
        const communityInternalWeights = new Map<number, number>();

        // Calculate internal weights for each community
        for (const node of this.graph.nodes()) {
            const nodeId = node.id;
            const community = this.communities.get(nodeId) ?? 0;

            for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
                if (this.communities.get(neighbor) === community) {
                    const edge = this.graph.getEdge(nodeId, neighbor);
                    const weight = edge?.weight ?? 1;
                    communityInternalWeights.set(community, (communityInternalWeights.get(community) ?? 0) + weight);
                }
            }
        }

        // Calculate modularity
        for (const [community, internalWeight] of communityInternalWeights) {
            const communityWeight = this.communityWeights.get(community) ?? 0;
            // For undirected graphs, internal weights are counted twice
            const aIn = this.graph.isDirected ? internalWeight : internalWeight / 2;
            const aTotal = communityWeight;

            // Modularity formula: sum of (fraction of edges within community - expected fraction)
            const actualFraction = aIn / this.totalWeight;
            const expectedFraction = resolution * Math.pow(aTotal / (2 * this.totalWeight), 2);
            modularity += actualFraction - expectedFraction;
        }

        return modularity;
    }

    /**
     * Get pruning statistics
     */
    public getPruningStats(): PruningStats {
        return {... this.pruningStats};
    }
}

/**
 * Optimized Louvain algorithm with automatic optimization selection
 */
export function louvainOptimized(
    graph: Graph,
    options: OptimizedLouvainOptions = {},
): CommunityResult {
    const optimizer = new OptimizedLouvain(graph);
    return optimizer.detectCommunities(options);
}
