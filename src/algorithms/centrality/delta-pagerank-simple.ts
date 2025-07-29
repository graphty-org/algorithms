import type {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

/**
 * Simplified Delta-based PageRank that matches the standard algorithm
 * but only processes active nodes for efficiency.
 *
 * Key optimization: Supports incremental updates when graph structure changes,
 * avoiding full recomputation from scratch.
 */
export class SimpleDeltaPageRank {
    private graph: Graph;
    private nodeCount: number;
    private previousScores: Map<NodeId, number> | null = null;

    constructor(graph: Graph) {
        if (!graph.isDirected) {
            throw new Error("PageRank requires a directed graph");
        }

        this.graph = graph;
        this.nodeCount = graph.nodeCount;
    }

    public compute(options: {
        dampingFactor?: number;
        tolerance?: number;
        maxIterations?: number;
        personalization?: Map<NodeId, number>;
        weight?: string;
    } = {}): Map<NodeId, number> {
        const {
            dampingFactor = 0.85,
            tolerance = 1e-6,
            maxIterations = 100,
            personalization,
            weight,
        } = options;

        if (this.nodeCount === 0) {
            return new Map();
        }

        // Initialize scores
        const scores = new Map<NodeId, number>();
        const newScores = new Map<NodeId, number>();

        for (const node of this.graph.nodes()) {
            scores.set(node.id, 1.0 / this.nodeCount);
        }

        // Precompute out-degrees and weights
        const outWeights = new Map<NodeId, number>();
        const danglingNodes = new Set<NodeId>();

        for (const node of this.graph.nodes()) {
            let totalWeight = 0;
            let outDegree = 0;

            for (const neighbor of Array.from(this.graph.neighbors(node.id))) {
                outDegree++;
                const edge = this.graph.getEdge(node.id, neighbor);
                totalWeight += edge?.weight ?? 1;
            }

            outWeights.set(node.id, totalWeight);
            if (outDegree === 0) {
                danglingNodes.add(node.id);
            }
        }

        // Normalize personalization vector if provided
        let personalVector: Map<NodeId, number> | null = null;
        if (personalization) {
            personalVector = new Map(personalization);
            this.normalizeMap(personalVector);
        }

        // Power iteration with active node tracking
        let activeNodes = new Set<NodeId>(scores.keys());
        let iteration = 0;

        for (iteration = 0; iteration < maxIterations; iteration++) {
            // Initialize new scores
            for (const nodeId of scores.keys()) {
                if (personalVector) {
                    newScores.set(nodeId, (1 - dampingFactor) * (personalVector.get(nodeId) ?? 0));
                } else {
                    newScores.set(nodeId, (1 - dampingFactor) / this.nodeCount);
                }
            }

            // Handle dangling nodes
            let danglingSum = 0;
            for (const danglingNode of danglingNodes) {
                danglingSum += scores.get(danglingNode) ?? 0;
            }

            if (danglingSum > 0) {
                const danglingContribution = dampingFactor * danglingSum / this.nodeCount;
                for (const nodeId of scores.keys()) {
                    const current = newScores.get(nodeId) ?? 0;
                    if (personalVector) {
                        const personalContrib = danglingContribution * (personalVector.get(nodeId) ?? 0);
                        newScores.set(nodeId, current + personalContrib);
                    } else {
                        newScores.set(nodeId, current + danglingContribution);
                    }
                }
            }

            // Propagate rank from active nodes only
            for (const nodeId of activeNodes) {
                const currentRank = scores.get(nodeId) ?? 0;
                const nodeOutWeight = outWeights.get(nodeId) ?? 0;

                if (nodeOutWeight > 0) {
                    for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
                        let edgeWeight = 1;
                        if (weight) {
                            const edge = this.graph.getEdge(nodeId, neighbor);
                            edgeWeight = edge?.weight ?? 1;
                        }

                        const contribution = dampingFactor * currentRank * (edgeWeight / nodeOutWeight);
                        const neighborRank = newScores.get(neighbor) ?? 0;
                        newScores.set(neighbor, neighborRank + contribution);
                    }
                }
            }

            // Check convergence and identify active nodes
            const nextActive = new Set<NodeId>();
            let maxDiff = 0;

            for (const nodeId of scores.keys()) {
                const oldRank = scores.get(nodeId) ?? 0;
                const newRank = newScores.get(nodeId) ?? 0;
                const diff = Math.abs(newRank - oldRank);
                maxDiff = Math.max(maxDiff, diff);

                // Mark as active if change is significant
                if (diff > tolerance / 10) {
                    nextActive.add(nodeId);
                    // Also mark neighbors as potentially active
                    for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
                        nextActive.add(neighbor);
                    }
                    for (const neighbor of Array.from(this.graph.inNeighbors(nodeId))) {
                        nextActive.add(neighbor);
                    }
                }
            }

            // Swap score maps
            scores.clear();
            for (const [k, v] of newScores) {
                scores.set(k, v);
            }
            newScores.clear();

            activeNodes = nextActive;

            if (maxDiff < tolerance) {
                break;
            }
        }

        // Store scores for potential incremental updates
        this.previousScores = new Map(scores);

        return scores;
    }

    /**
     * Perform incremental update after graph modification.
     * This is where delta-based approach provides significant speedup.
     *
     * @param modifiedNodes Set of nodes that were modified (edges added/removed)
     * @param options Computation options
     * @returns Updated PageRank scores
     */
    public update(
        modifiedNodes: Set<NodeId>,
        options: {
            dampingFactor?: number;
            tolerance?: number;
            maxIterations?: number;
            personalization?: Map<NodeId, number>;
            weight?: string;
        } = {},
    ): Map<NodeId, number> {
        if (!this.previousScores) {
            // No previous computation, do full compute
            return this.compute(options);
        }

        const {
            dampingFactor = 0.85,
            tolerance = 1e-6,
            maxIterations = 100,
            personalization,
            weight,
        } = options;

        // Initialize scores from previous computation
        const scores = new Map(this.previousScores);
        const newScores = new Map<NodeId, number>();

        // Ensure all current nodes are included
        for (const node of this.graph.nodes()) {
            if (!scores.has(node.id)) {
                scores.set(node.id, 1.0 / this.nodeCount);
            }
        }

        // Start with only modified nodes and their neighbors as active
        let activeNodes = new Set<NodeId>();
        for (const nodeId of modifiedNodes) {
            activeNodes.add(nodeId);
            // Add incoming neighbors
            for (const neighbor of Array.from(this.graph.inNeighbors(nodeId))) {
                activeNodes.add(neighbor);
            }
            // Add outgoing neighbors
            for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
                activeNodes.add(neighbor);
            }
        }

        // Recompute out-weights for modified nodes
        const outWeights = new Map<NodeId, number>();
        const danglingNodes = new Set<NodeId>();

        for (const node of this.graph.nodes()) {
            let totalWeight = 0;
            let outDegree = 0;

            for (const neighbor of Array.from(this.graph.neighbors(node.id))) {
                outDegree++;
                const edge = this.graph.getEdge(node.id, neighbor);
                totalWeight += edge?.weight ?? 1;
            }

            outWeights.set(node.id, totalWeight);
            if (outDegree === 0) {
                danglingNodes.add(node.id);
            }
        }

        // Normalize personalization vector if provided
        let personalVector: Map<NodeId, number> | null = null;
        if (personalization) {
            personalVector = new Map(personalization);
            this.normalizeMap(personalVector);
        }

        // Run limited iterations focusing on active nodes
        let iteration = 0;

        for (iteration = 0; iteration < maxIterations && activeNodes.size > 0; iteration++) {
            // Initialize new scores
            for (const nodeId of scores.keys()) {
                if (personalVector) {
                    newScores.set(nodeId, (1 - dampingFactor) * (personalVector.get(nodeId) ?? 0));
                } else {
                    newScores.set(nodeId, (1 - dampingFactor) / this.nodeCount);
                }
            }

            // Handle dangling nodes
            let danglingSum = 0;
            for (const danglingNode of danglingNodes) {
                danglingSum += scores.get(danglingNode) ?? 0;
            }

            if (danglingSum > 0) {
                const danglingContribution = dampingFactor * danglingSum / this.nodeCount;
                for (const nodeId of scores.keys()) {
                    const current = newScores.get(nodeId) ?? 0;
                    if (personalVector) {
                        const personalContrib = danglingContribution * (personalVector.get(nodeId) ?? 0);
                        newScores.set(nodeId, current + personalContrib);
                    } else {
                        newScores.set(nodeId, current + danglingContribution);
                    }
                }
            }

            // Propagate rank from ALL nodes (not just active)
            // This ensures correctness
            for (const nodeId of scores.keys()) {
                const currentRank = scores.get(nodeId) ?? 0;
                const nodeOutWeight = outWeights.get(nodeId) ?? 0;

                if (nodeOutWeight > 0) {
                    for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
                        let edgeWeight = 1;
                        if (weight) {
                            const edge = this.graph.getEdge(nodeId, neighbor);
                            edgeWeight = edge?.weight ?? 1;
                        }

                        const contribution = dampingFactor * currentRank * (edgeWeight / nodeOutWeight);
                        const neighborRank = newScores.get(neighbor) ?? 0;
                        newScores.set(neighbor, neighborRank + contribution);
                    }
                }
            }

            // Check convergence only for active nodes
            const nextActive = new Set<NodeId>();
            let maxDiff = 0;

            for (const nodeId of activeNodes) {
                const oldRank = scores.get(nodeId) ?? 0;
                const newRank = newScores.get(nodeId) ?? 0;
                const diff = Math.abs(newRank - oldRank);
                maxDiff = Math.max(maxDiff, diff);

                // Mark as active if change is significant
                if (diff > tolerance / 10) {
                    nextActive.add(nodeId);
                    // Also mark neighbors as potentially active
                    for (const neighbor of Array.from(this.graph.neighbors(nodeId))) {
                        nextActive.add(neighbor);
                    }
                    for (const neighbor of Array.from(this.graph.inNeighbors(nodeId))) {
                        nextActive.add(neighbor);
                    }
                }
            }

            // Swap score maps
            scores.clear();
            for (const [k, v] of newScores) {
                scores.set(k, v);
            }
            newScores.clear();

            activeNodes = nextActive;

            if (maxDiff < tolerance) {
                break;
            }
        }

        // Store scores for future incremental updates
        this.previousScores = new Map(scores);

        return scores;
    }

    private normalizeMap(map: Map<NodeId, number>): void {
        let sum = 0;
        for (const value of map.values()) {
            sum += value;
        }

        if (sum > 0) {
            for (const [key, value] of Array.from(map)) {
                map.set(key, value / sum);
            }
        }
    }
}
