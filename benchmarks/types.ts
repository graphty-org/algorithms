// Benchmark-specific types for performance testing

export interface BenchmarkGraph {
    vertices: number;
    edges: [number, number, number?][]; // [from, to, weight?]
    directed: boolean;
    weighted: boolean;
}

export type BenchmarkAdjacencyList = Record<number, {to: number; weight?: number}[]>;

export interface BenchmarkGraphMetadata {
    generationAlgorithm: string;
    parameters?: Record<string, any>;
}

export class BenchmarkGraphImpl implements BenchmarkGraph {
    vertices: number;
    edges: [number, number, number?][] = [];
    adjacencyList: BenchmarkAdjacencyList = {};
    directed: boolean;
    weighted: boolean;
    metadata?: BenchmarkGraphMetadata;

    constructor(vertices: number, directed = false, weighted = false, metadata?: BenchmarkGraphMetadata) {
        this.vertices = vertices;
        this.directed = directed;
        this.weighted = weighted;
        this.metadata = metadata;

        // Initialize adjacency list
        for (let i = 0; i < vertices; i++) {
            this.adjacencyList[i] = [];
        }
    }

    addEdge(from: number, to: number, weight?: number): void {
        this.edges.push([from, to, weight]);
        this.adjacencyList[from].push({to, weight});

        if (!this.directed) {
            this.adjacencyList[to].push({to: from, weight});
        }
    }

    getNeighbors(vertex: number): {to: number; weight?: number}[] {
        return this.adjacencyList[vertex] || [];
    }

    hasVertex(vertex: number): boolean {
        return vertex >= 0 && vertex < this.vertices;
    }

    getEdgeCount(): number {
        return this.directed ? this.edges.length : this.edges.length * 2;
    }
}