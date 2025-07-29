import {Graph} from "../../src/core/graph.js";
import {DirectionOptimizedBFS} from "../../src/optimized/direction-optimized-bfs.js";
import {toCSRGraph} from "../../src/optimized/graph-adapter.js";

/**
 * Memory profiling utilities for graph optimizations
 *
 * Provides detailed memory usage analysis for:
 * - CSR conversion process
 * - Algorithm execution
 * - Data structure overhead
 */

interface MemorySnapshot {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
    label: string;
}

interface MemoryProfile {
    algorithm: string;
    graphSize: number;
    edgeCount: number;
    snapshots: MemorySnapshot[];
    summary: {
        initialMemory: number;
        peakMemory: number;
        finalMemory: number;
        csrConversionCost: number;
        algorithmCost: number;
        totalCost: number;
    };
}

export class MemoryProfiler {
    private snapshots: MemorySnapshot[] = [];
    private startTime = 0;

    /**
     * Start profiling
     */
    start(): void {
        this.snapshots = [];
        this.startTime = performance.now();
        this.snapshot("start");
    }

    /**
     * Take a memory snapshot
     */
    snapshot(label: string): MemorySnapshot {
        if (typeof process === "undefined") {
            // Browser environment - use performance.memory if available
            const performanceWithMemory = performance as unknown as {memory?: {usedJSHeapSize: number, totalJSHeapSize: number}};
            const {memory} = performanceWithMemory;
            if (memory) {
                const snapshot: MemorySnapshot = {
                    timestamp: performance.now() - this.startTime,
                    heapUsed: memory.usedJSHeapSize,
                    heapTotal: memory.totalJSHeapSize,
                    external: 0,
                    arrayBuffers: 0,
                    label,
                };
                this.snapshots.push(snapshot);
                return snapshot;
            }
        }

        // Node.js environment
        const usage = process.memoryUsage();
        const snapshot: MemorySnapshot = {
            timestamp: performance.now() - this.startTime,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers || 0,
            label,
        };
        this.snapshots.push(snapshot);
        return snapshot;
    }

    /**
     * Get memory profile summary
     */
    getSummary(): MemoryProfile["summary"] {
        if (this.snapshots.length < 2) {
            throw new Error("Not enough snapshots for summary");
        }

        const initial = this.snapshots[0];
        const final = this.snapshots[this.snapshots.length - 1];
        let peak = initial;

        if (!initial || !final) {
            throw new Error("Missing snapshots");
        }

        let csrConversionCost = 0;
        let algorithmCost = 0;

        // Find peak memory and conversion costs
        for (const snapshot of this.snapshots) {
            if (peak && snapshot.heapUsed > peak.heapUsed) {
                peak = snapshot;
            }

            if (snapshot.label === "after-csr-conversion") {
                csrConversionCost = snapshot.heapUsed - initial.heapUsed;
            } else if (snapshot.label === "after-algorithm") {
                const preAlgoSnapshot = this.snapshots.find((s) => s.label === "before-algorithm");
                if (preAlgoSnapshot) {
                    algorithmCost = snapshot.heapUsed - preAlgoSnapshot.heapUsed;
                }
            }
        }

        return {
            initialMemory: initial.heapUsed,
            peakMemory: peak?.heapUsed ?? initial.heapUsed,
            finalMemory: final.heapUsed,
            csrConversionCost,
            algorithmCost,
            totalCost: final.heapUsed - initial.heapUsed,
        };
    }

    /**
     * Generate detailed report
     */
    generateReport(algorithm: string, graph: {nodeCount: number, edgeCount: number}): MemoryProfile {
        return {
            algorithm,
            graphSize: graph.nodeCount,
            edgeCount: graph.edgeCount,
            snapshots: this.snapshots,
            summary: this.getSummary(),
        };
    }
}

/**
 * Profile CSR conversion memory usage
 */
export function profileCSRConversion(graph: Graph): MemoryProfile {
    const profiler = new MemoryProfiler();
    profiler.start();

    // Force garbage collection if available (V8 only)
    if (global.gc) {
        global.gc();
        profiler.snapshot("after-gc");
    }

    profiler.snapshot("before-conversion");

    // Perform CSR conversion
    const csrGraph = toCSRGraph(graph);

    profiler.snapshot("after-csr-conversion");

    // Access some data to ensure it's not optimized away
    const nodeCount = csrGraph.nodeCount();
    const edgeCount = csrGraph.edgeCount();

    profiler.snapshot("after-access");

    return profiler.generateReport("CSR Conversion", {nodeCount, edgeCount});
}

/**
 * Profile Direction-Optimized BFS memory usage
 */
export function profileDirectionOptimizedBFS(graph: Graph, source: number): MemoryProfile {
    const profiler = new MemoryProfiler();
    profiler.start();

    // Convert to CSR
    profiler.snapshot("before-conversion");
    const csrGraph = toCSRGraph(graph);
    profiler.snapshot("after-csr-conversion");

    // Create BFS instance
    profiler.snapshot("before-bfs-init");
    const bfs = new DirectionOptimizedBFS(csrGraph);
    profiler.snapshot("after-bfs-init");

    // Run algorithm
    profiler.snapshot("before-algorithm");
    const result = bfs.search(source);
    profiler.snapshot("after-algorithm");

    // Access results to prevent optimization
    void result.distances.size;
    profiler.snapshot("after-access");

    return profiler.generateReport("Direction-Optimized BFS", {nodeCount: graph.nodeCount, edgeCount: graph.totalEdgeCount});
}

/**
 * Estimate memory usage for different data structures
 */
export const MemoryEstimator = {
    /**
     * Estimate memory for standard Graph representation
     */
    estimateStandardGraph(nodeCount: number, edgeCount: number): number {
        // Map overhead per entry: ~100 bytes
        // Set overhead per entry: ~50 bytes
        // Node object: ~50 bytes
        // Edge storage: ~30 bytes per edge

        const nodeMapOverhead = nodeCount * 100;
        const nodeObjectOverhead = nodeCount * 50;
        const adjacencyListOverhead = nodeCount * 100; // Map for each node
        const edgeOverhead = edgeCount * 30 * 2; // Stored twice for undirected

        return nodeMapOverhead + nodeObjectOverhead + adjacencyListOverhead + edgeOverhead;
    },

    /**
     * Estimate memory for CSR representation
     */
    estimateCSRGraph(nodeCount: number, edgeCount: number): number {
        // Row pointers: 4 bytes per node + 1
        const rowPointers = (nodeCount + 1) * 4;

        // Column indices: 4 bytes per edge
        const columnIndices = edgeCount * 4;

        // Reverse indices for undirected graphs
        const reverseIndices = edgeCount * 4;

        // Node ID mappings
        const nodeIdToIndex = nodeCount * 100; // Map overhead
        const indexToNodeId = nodeCount * 8; // Array of references

        return rowPointers + columnIndices + reverseIndices + nodeIdToIndex + indexToNodeId;
    },

    /**
     * Estimate memory for bit-packed structures
     */
    estimateBitPackedStructures(nodeCount: number): number {
        // Visited bit array: 1 bit per node
        const visitedBits = Math.ceil(nodeCount / 8);

        // Distance array: 4 bytes per node (Uint32Array)
        const distances = nodeCount * 4;

        // Parent array: 4 bytes per node (Int32Array)
        const parents = nodeCount * 4;

        // Frontier bitsets (2 for swapping)
        const frontierBits = Math.ceil(nodeCount / 8) * 2;

        return visitedBits + distances + parents + frontierBits;
    },

    /**
     * Generate comparison report
     */
    generateComparisonReport(nodeCount: number, avgDegree: number): void {
        const edgeCount = nodeCount * avgDegree;

        const standardMemory = this.estimateStandardGraph(nodeCount, edgeCount);
        const csrMemory = this.estimateCSRGraph(nodeCount, edgeCount);
        const bitPackedMemory = this.estimateBitPackedStructures(nodeCount);

        console.log("\n📊 Memory Usage Comparison");
        console.log("=========================");
        console.log(`Graph: ${nodeCount.toLocaleString()} nodes, ${edgeCount.toLocaleString()} edges`);
        console.log("\nData Structure Sizes:");
        console.log(`  Standard Graph: ${(standardMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  CSR Graph: ${(csrMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Bit-packed BFS: ${(bitPackedMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log("\nMemory Savings:");
        console.log(`  CSR vs Standard: ${(standardMemory / csrMemory).toFixed(1)}x reduction`);
        console.log(`  Total Optimized: ${(standardMemory / (csrMemory + bitPackedMemory)).toFixed(1)}x reduction`);
    },
};

/**
 * Run comprehensive memory profiling
 */
export function runMemoryProfiling(): void {
    console.log("🧠 Memory Profiling Suite");
    console.log("========================\n");

    const sizes = [1000, 10000, 50000, 100000];
    const results: MemoryProfile[] = [];

    for (const size of sizes) {
        console.log(`\nProfiling ${String(size)} node graph...`);

        // Create test graph
        const graph = new Graph();
        for (let i = 0; i < size; i++) {
            graph.addNode(i);
        }

        // Add edges (small-world graph)
        const k = 10;
        for (let i = 0; i < size; i++) {
            for (let j = 1; j <= k / 2; j++) {
                const target = (i + j) % size;
                graph.addEdge(i, target);
            }
        }

        // Profile CSR conversion
        console.log("  Profiling CSR conversion...");
        const csrProfile = profileCSRConversion(graph);
        results.push(csrProfile);

        console.log(`    Conversion cost: ${(csrProfile.summary.csrConversionCost / 1024 / 1024).toFixed(2)} MB`);

        // Profile BFS
        console.log("  Profiling Direction-Optimized BFS...");
        const bfsProfile = profileDirectionOptimizedBFS(graph, 0);
        results.push(bfsProfile);

        console.log(`    Algorithm cost: ${(bfsProfile.summary.algorithmCost / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Peak memory: ${(bfsProfile.summary.peakMemory / 1024 / 1024).toFixed(2)} MB`);

        // Show comparison
        MemoryEstimator.generateComparisonReport(size, 10);
    }

    // Summary table
    console.log("\n\n📊 Memory Profiling Summary");
    console.log("===========================");
    console.log("\nAlgorithm         | Nodes   | Initial | Peak    | Final   | Cost");
    console.log("------------------|---------|---------|---------|---------|-------");

    for (const profile of results) {
        const s = profile.summary;
        console.log(
            `${profile.algorithm.padEnd(17)} | ` +
            `${profile.graphSize.toString().padEnd(7)} | ` +
            `${(s.initialMemory / 1024 / 1024).toFixed(1).padStart(7)} | ` +
            `${(s.peakMemory / 1024 / 1024).toFixed(1).padStart(7)} | ` +
            `${(s.finalMemory / 1024 / 1024).toFixed(1).padStart(7)} | ${
                (s.totalCost / 1024 / 1024).toFixed(1).padStart(5)}`,
        );
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1] ?? ""}`) {
    runMemoryProfiling();
}
