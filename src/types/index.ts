/**
 * Core types for the Graphty Algorithms library
 */

// Node identifier type
export type NodeId = string | number;

// Edge representation
export interface Edge {
    source: NodeId;
    target: NodeId;
    weight?: number;
    id?: string;
    data?: Record<string, unknown> | undefined;
}

// Node representation
export interface Node {
    id: NodeId;
    data?: Record<string, unknown> | undefined;
}

// Graph configuration
export interface GraphConfig {
    directed: boolean;
    allowSelfLoops: boolean;
    allowParallelEdges: boolean;
}

// Algorithm result interfaces
export interface ShortestPathResult {
    distance: number;
    path: NodeId[];
    predecessor: Map<NodeId, NodeId | null>;
}

export type CentralityResult = Record<string, number>;

export interface TraversalResult {
    visited: Set<NodeId>;
    order: NodeId[];
    tree?: Map<NodeId, NodeId | null>;
}

export interface CommunityResult {
    communities: NodeId[][];
    modularity: number;
    iterations?: number;
}

export interface ComponentResult {
    components: NodeId[][];
    componentMap: Map<NodeId, number>;
}

export interface MSTResult {
    edges: Edge[];
    totalWeight: number;
}

export interface FloydWarshallResult {
    distances: Map<NodeId, Map<NodeId, number>>;
    predecessors: Map<NodeId, Map<NodeId, NodeId | null>>;
    hasNegativeCycle: boolean;
}

// Algorithm options interfaces
export interface TraversalOptions {
    targetNode?: NodeId;
    visitCallback?: (node: NodeId, level: number) => void;
}

export interface DijkstraOptions {
    target?: NodeId;
}

export interface BellmanFordResult {
    distances: Map<NodeId, number>;
    previous: Map<NodeId, NodeId | null>;
    hasNegativeCycle: boolean;
    negativeCycleNodes?: NodeId[];
}

export interface CentralityOptions {
    normalized?: boolean;
    endpoints?: boolean;
    mode?: "in" | "out" | "total"; // For directed graphs
}

export interface PageRankOptions {
    alpha?: number; // Damping factor (default: 0.85)
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number; // Convergence tolerance (default: 1e-6)
    personalization?: Map<NodeId, number>; // Personalized PageRank
}

export interface LouvainOptions {
    resolution?: number; // Resolution parameter (default: 1.0)
    maxIterations?: number; // Maximum iterations (default: 100)
    tolerance?: number; // Improvement tolerance (default: 1e-6)
}

export interface GirvanNewmanOptions {
    maxCommunities?: number; // Stop when this many communities reached
    minCommunitySize?: number; // Minimum size for valid community
    maxIterations?: number; // Maximum iterations to prevent infinite loops
}
