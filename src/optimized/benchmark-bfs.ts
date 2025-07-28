/* eslint-disable no-console */
import {breadthFirstSearch} from "../algorithms/traversal/bfs.js";
import {Graph} from "../core/graph.js";
import {bfsOptimized} from "./bfs-optimized.js";
import {configureOptimizations} from "./graph-adapter.js";

/**
 * Benchmark Direction-Optimized BFS against standard BFS
 */
function benchmarkBFS(): void {
    console.log("BFS Performance Benchmark");
    console.log("========================\n");

    // Test configurations
    const testConfigs = [
        {nodes: 1000, edgesPerNode: 10, name: "Small Graph (1K nodes)"},
        {nodes: 10000, edgesPerNode: 15, name: "Medium Graph (10K nodes)"},
        {nodes: 50000, edgesPerNode: 20, name: "Large Graph (50K nodes)"},
        {nodes: 100000, edgesPerNode: 25, name: "Very Large Graph (100K nodes)"},
    ];

    // Enable optimizations globally
    configureOptimizations({
        useDirectionOptimizedBFS: true,
        useCSRFormat: true,
        useBitPackedStructures: true,
    });

    for (const config of testConfigs) {
        console.log(`\n${config.name}`);
        console.log("-".repeat(config.name.length));

        // Create a small-world graph (good for Direction-Optimized BFS)
        const graph = createSmallWorldGraph(config.nodes, config.edgesPerNode);

        // Warm up JIT
        for (let i = 0; i < 3; i++) {
            breadthFirstSearch(graph, 0);
            bfsOptimized(graph, 0, {optimized: true});
        }

        // Benchmark standard BFS
        const standardRuns = 10;
        const standardStart = performance.now();
        for (let i = 0; i < standardRuns; i++) {
            breadthFirstSearch(graph, 0);
        }
        const standardTime = (performance.now() - standardStart) / standardRuns;

        // Benchmark auto-optimized BFS (first run includes conversion if needed)
        const optimizedFirstStart = performance.now();
        const firstResult = breadthFirstSearch(graph, 0);
        const optimizedFirstTime = performance.now() - optimizedFirstStart;

        // Benchmark auto-optimized BFS (subsequent runs use cached CSR if applicable)
        const optimizedRuns = 10;
        const optimizedStart = performance.now();
        for (let i = 0; i < optimizedRuns; i++) {
            breadthFirstSearch(graph, 0);
        }
        const optimizedTime = (performance.now() - optimizedStart) / optimizedRuns;

        // Results
        console.log(`Nodes visited: ${String(firstResult.visited.size)}`);
        console.log("\nStandard BFS:");
        console.log(`  Average time: ${standardTime.toFixed(2)}ms`);

        console.log("\nAuto-Optimized BFS:");
        console.log(`  First run: ${optimizedFirstTime.toFixed(2)}ms`);
        console.log(`  Average time: ${optimizedTime.toFixed(2)}ms`);
        console.log(`  Speedup vs standard: ${(standardTime / optimizedTime).toFixed(2)}x`);
        console.log(`  Using: ${config.nodes >= 10000 ? "Direction-Optimized BFS" : "Standard BFS"}`);

        // Memory estimation
        const standardMemory = estimateStandardMemory(graph);
        const optimizedMemory = estimateOptimizedMemory(graph);
        console.log("\nMemory Usage:");
        console.log(`  Standard: ~${(standardMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Optimized: ~${(optimizedMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Reduction: ${(standardMemory / optimizedMemory).toFixed(1)}x`);
    }
}

/**
 * Create a small-world graph (good for demonstrating Direction-Optimized BFS)
 */
function createSmallWorldGraph(nodeCount: number, avgDegree: number): Graph {
    const graph = new Graph();

    // Add all nodes
    for (let i = 0; i < nodeCount; i++) {
        graph.addNode(i);
    }

    // Create ring lattice with local connections
    const k = Math.floor(avgDegree / 2);
    for (let i = 0; i < nodeCount; i++) {
        for (let j = 1; j <= k; j++) {
            const target = (i + j) % nodeCount;
            graph.addEdge(i, target);
        }
    }

    // Rewire some edges for small-world property (Watts-Strogatz model)
    const rewireProb = 0.1;
    for (let i = 0; i < nodeCount; i++) {
        for (let j = 1; j <= k; j++) {
            if (Math.random() < rewireProb) {
                const oldTarget = (i + j) % nodeCount;
                const newTarget = Math.floor(Math.random() * nodeCount);
                if (newTarget !== i && !graph.hasEdge(i, newTarget)) {
                    graph.removeEdge(i, oldTarget);
                    graph.addEdge(i, newTarget);
                }
            }
        }
    }

    return graph;
}

/**
 * Estimate memory usage for standard graph representation
 */
function estimateStandardMemory(graph: Graph): number {
    // Rough estimates:
    // - Map overhead: ~100 bytes per entry
    // - Set overhead: ~50 bytes per entry
    // - Node object: ~50 bytes
    // - Edge storage in adjacency list: ~30 bytes per edge

    const nodeMemory = graph.nodeCount * 150; // Map entry + node object
    const edgeMemory = graph.uniqueEdgeCount * 2 * 30; // Stored twice for undirected
    const visitedSetMemory = graph.nodeCount * 50; // Set for visited nodes
    const queueMemory = graph.nodeCount * 8; // Queue can grow to all nodes

    return nodeMemory + edgeMemory + visitedSetMemory + queueMemory;
}

/**
 * Estimate memory usage for optimized representation
 */
function estimateOptimizedMemory(graph: Graph): number {
    // CSR format:
    // - Row pointers: 4 bytes per node
    // - Column indices: 4 bytes per edge
    // - Node ID mappings: ~100 bytes per node (Map overhead)
    // - Bit-packed visited: 1 bit per node (1/8 byte)
    // - Compact distances: 2 bytes per node (Uint16Array)

    const csrMemory = (graph.nodeCount * 4) + (graph.uniqueEdgeCount * 2 * 4);
    const mappingMemory = graph.nodeCount * 100;
    const bitPackedMemory = Math.ceil(graph.nodeCount / 8) + (graph.nodeCount * 2);

    return csrMemory + mappingMemory + bitPackedMemory;
}

// Run benchmark if called directly (Node.js only)
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (typeof process !== "undefined" && process?.argv && import.meta.url === `file://${String(process.argv[1])}`) {
    benchmarkBFS();
}

export {benchmarkBFS};
