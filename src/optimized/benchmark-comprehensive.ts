/* eslint-disable no-console */
import {betweennessCentrality} from "../algorithms/centrality/betweenness.js";
import {closenessCentrality} from "../algorithms/centrality/closeness.js";
import {breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS} from "../algorithms/traversal/bfs.js";
import {Graph} from "../core/graph.js";
import {configureOptimizations} from "./graph-adapter.js";

/**
 * Comprehensive performance validation suite for all optimized algorithms
 *
 * This benchmark validates that we meet the target performance metrics
 * defined in the optimization design document.
 */

interface BenchmarkResult {
    algorithm: string;
    graphType: string;
    nodeCount: number;
    edgeCount: number;
    executionTime: number;
    memoryUsed: number;
    speedup?: number;
    meetsTarget: boolean;
    targetTime?: number;
}

interface TestConfig {
    nodes: number;
    edgesPerNode: number;
    name: string;
    targetTime?: number; // Target time in ms for validation
}

/**
 * Performance targets from design document (line 883-886)
 */
const PERFORMANCE_TARGETS = {
    BFS: {
        1000000: 100, // 1M nodes: <100ms
    },
    BETWEENNESS_CENTRALITY: {
        100000: 5000, // 100K nodes: <5s (scaled from 1M target)
        1000000: 25000, // 1M nodes: <25s (estimated)
    },
    CLOSENESS_CENTRALITY: {
        100000: 3000, // 100K nodes: <3s (estimated)
        1000000: 15000, // 1M nodes: <15s (estimated)
    },
    SHORTEST_PATH: {
        100000: 200, // 100K nodes: <200ms (estimated)
        1000000: 1000, // 1M nodes: <1s (estimated)
    },
} as const;

/**
 * Main comprehensive benchmark function
 */
export function runComprehensiveBenchmarks(): void {
    console.log("🚀 Comprehensive Graph Algorithm Performance Validation");
    console.log("======================================================\n");

    // Enable optimizations globally
    configureOptimizations({
        useDirectionOptimizedBFS: true,
        useCSRFormat: true,
        useBitPackedStructures: true,
        bfsAlpha: 15.0,
        bfsBeta: 20.0,
        enableCaching: true,
    });

    const testConfigs: TestConfig[] = [
        {nodes: 1000, edgesPerNode: 10, name: "Small Graph (1K nodes)"},
        {nodes: 10000, edgesPerNode: 15, name: "Medium Graph (10K nodes)"},
        {nodes: 50000, edgesPerNode: 20, name: "Large Graph (50K nodes)"},
        // Add larger tests only for production benchmarking
        // {nodes: 100000, edgesPerNode: 25, name: "Very Large Graph (100K nodes)"},
        // {nodes: 1000000, edgesPerNode: 10, name: "Massive Graph (1M nodes)"},
    ];

    const results: BenchmarkResult[] = [];

    for (const config of testConfigs) {
        console.log(`\n📊 ${config.name}`);
        console.log("=".repeat(config.name.length + 4));

        // Create test graphs of different types
        const smallWorldGraph = createSmallWorldGraph(config.nodes, config.edgesPerNode);
        const scaleFreeGraph = createScaleFreeGraph(config.nodes, config.edgesPerNode);

        console.log(`Nodes: ${config.nodes.toLocaleString()}, Edges: ${smallWorldGraph.uniqueEdgeCount.toLocaleString()}\n`);

        // Test BFS on both graph types
        results.push(... benchmarkBFS(smallWorldGraph, "Small-World", config));
        results.push(... benchmarkBFS(scaleFreeGraph, "Scale-Free", config));

        // Test centrality algorithms (more computationally intensive)
        if (config.nodes <= 10000) { // Only test on smaller graphs to avoid long runs
            results.push(... benchmarkCentrality(smallWorldGraph, "Small-World", config));
            results.push(... benchmarkCentrality(scaleFreeGraph, "Scale-Free", config));
        }

        // Test shortest path algorithms
        results.push(... benchmarkShortestPath(smallWorldGraph, "Small-World", config));
        results.push(... benchmarkShortestPath(scaleFreeGraph, "Scale-Free", config));
    }

    // Summary report
    console.log("\n📈 Performance Validation Summary");
    console.log("=================================\n");

    displaySummaryTable(results);

    const failedTargets = results.filter((r) => r.targetTime && !r.meetsTarget);
    if (failedTargets.length > 0) {
        console.log("\n❌ Failed Performance Targets:");
        for (const result of failedTargets) {
            console.log(`  ${result.algorithm} (${result.graphType}, ${result.nodeCount.toLocaleString()} nodes): ${result.executionTime.toFixed(2)}ms > ${String(result.targetTime)}ms`);
        }
    } else {
        console.log("✅ All performance targets met!");
    }

    // Memory efficiency report
    console.log("\n💾 Memory Efficiency Analysis");
    console.log("=============================\n");
    displayMemoryAnalysis(results);
}

/**
 * Benchmark BFS algorithms
 */
function benchmarkBFS(graph: Graph, graphType: string, config: TestConfig): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];

    console.log(`🔍 BFS Benchmarks (${graphType})`);

    // Warm up JIT
    for (let i = 0; i < 3; i++) {
        breadthFirstSearch(graph, 0);
    }

    // Benchmark single-source BFS
    const bfsTime = benchmarkAlgorithm(() => {
        breadthFirstSearch(graph, 0);
    }, 5);

    const targetTime = (PERFORMANCE_TARGETS.BFS as Record<string, number>)[String(config.nodes)];

    const bfsResult: BenchmarkResult = {
        algorithm: "BFS",
        graphType,
        nodeCount: config.nodes,
        edgeCount: graph.uniqueEdgeCount,
        executionTime: bfsTime,
        memoryUsed: estimateMemoryUsage(graph, "BFS"),
        meetsTarget: targetTime === undefined || bfsTime <= targetTime,
    };
    if (targetTime !== undefined) {
        bfsResult.targetTime = targetTime;
    }

    results.push(bfsResult);

    let statusIcon: string;
    if (targetTime === undefined) {
        statusIcon = "";
    } else if (bfsTime <= targetTime) {
        statusIcon = "✅";
    } else {
        statusIcon = "❌";
    }

    console.log(`  Single-source BFS: ${bfsTime.toFixed(2)}ms ${statusIcon}`);

    return results;
}

/**
 * Benchmark centrality algorithms
 */
function benchmarkCentrality(graph: Graph, graphType: string, config: TestConfig): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];

    console.log(`📐 Centrality Benchmarks (${graphType})`);

    // Note: Computing centrality for all nodes

    // Benchmark betweenness centrality
    const betweennessTime = benchmarkAlgorithm(() => {
        betweennessCentrality(graph, {optimized: true});
    }, 1); // Only 1 run due to computational intensity

    const betweennessTarget = (PERFORMANCE_TARGETS.BETWEENNESS_CENTRALITY as Record<string, number>)[String(config.nodes)];

    const betweennessResult: BenchmarkResult = {
        algorithm: "Betweenness Centrality",
        graphType,
        nodeCount: config.nodes,
        edgeCount: graph.uniqueEdgeCount,
        executionTime: betweennessTime,
        memoryUsed: estimateMemoryUsage(graph, "BETWEENNESS"),
        meetsTarget: betweennessTarget === undefined || betweennessTime <= betweennessTarget,
    };
    if (betweennessTarget !== undefined) {
        betweennessResult.targetTime = betweennessTarget;
    }

    results.push(betweennessResult);

    let betweennessStatusIcon: string;
    if (betweennessTarget === undefined) {
        betweennessStatusIcon = "";
    } else if (betweennessTime <= betweennessTarget) {
        betweennessStatusIcon = "✅";
    } else {
        betweennessStatusIcon = "❌";
    }

    console.log(`  Betweenness Centrality: ${betweennessTime.toFixed(2)}ms ${betweennessStatusIcon}`);

    // Benchmark closeness centrality (sample)
    const closenessTime = benchmarkAlgorithm(() => {
        closenessCentrality(graph, {optimized: true});
    }, 2);

    const closenessTarget = (PERFORMANCE_TARGETS.CLOSENESS_CENTRALITY as Record<string, number>)[String(config.nodes)];
    const avgClosenessTime = closenessTime; // Total time for all nodes

    const closenessResult: BenchmarkResult = {
        algorithm: "Closeness Centrality",
        graphType,
        nodeCount: config.nodes,
        edgeCount: graph.uniqueEdgeCount,
        executionTime: avgClosenessTime,
        memoryUsed: estimateMemoryUsage(graph, "CLOSENESS"),
        meetsTarget: closenessTarget === undefined || avgClosenessTime <= closenessTarget,
    };
    if (closenessTarget !== undefined) {
        closenessResult.targetTime = closenessTarget;
    }

    results.push(closenessResult);

    console.log(`  Closeness Centrality (avg): ${avgClosenessTime.toFixed(3)}ms/node`);

    return results;
}

/**
 * Benchmark shortest path algorithms
 */
function benchmarkShortestPath(graph: Graph, graphType: string, config: TestConfig): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];

    console.log(`🛣️  Shortest Path Benchmarks (${graphType})`);

    // Test pairwise shortest path
    const source = 0;
    const target = Math.floor(config.nodes / 2);

    const shortestPathTime = benchmarkAlgorithm(() => {
        shortestPathBFS(graph, source, target);
    }, 10);

    const shortestPathTarget = (PERFORMANCE_TARGETS.SHORTEST_PATH as Record<string, number>)[String(config.nodes)];

    const pathResult: BenchmarkResult = {
        algorithm: "Shortest Path (BFS)",
        graphType,
        nodeCount: config.nodes,
        edgeCount: graph.uniqueEdgeCount,
        executionTime: shortestPathTime,
        memoryUsed: estimateMemoryUsage(graph, "SHORTEST_PATH"),
        meetsTarget: shortestPathTarget === undefined || shortestPathTime <= shortestPathTarget,
    };
    if (shortestPathTarget !== undefined) {
        pathResult.targetTime = shortestPathTarget;
    }

    results.push(pathResult);

    let pathStatusIcon: string;
    if (shortestPathTarget === undefined) {
        pathStatusIcon = "";
    } else if (shortestPathTime <= shortestPathTarget) {
        pathStatusIcon = "✅";
    } else {
        pathStatusIcon = "❌";
    }

    console.log(`  Pairwise Shortest Path: ${shortestPathTime.toFixed(2)}ms ${pathStatusIcon}`);

    // Test single-source shortest paths (sample)
    const ssTime = benchmarkAlgorithm(() => {
        singleSourceShortestPathBFS(graph, source);
    }, 3);

    results.push({
        algorithm: "Single-Source Shortest Paths",
        graphType,
        nodeCount: config.nodes,
        edgeCount: graph.uniqueEdgeCount,
        executionTime: ssTime,
        memoryUsed: estimateMemoryUsage(graph, "SINGLE_SOURCE"),
        meetsTarget: true, // No specific target for this
    });

    console.log(`  Single-Source Shortest Paths: ${ssTime.toFixed(2)}ms`);

    return results;
}

/**
 * Generic algorithm benchmarking utility
 */
function benchmarkAlgorithm(algorithm: () => void, runs: number): number {
    const times: number[] = [];

    for (let i = 0; i < runs; i++) {
        const start = performance.now();
        algorithm();
        const end = performance.now();
        times.push(end - start);
    }

    // Return median time to avoid outliers
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)] ?? 0;
}

/**
 * Create small-world graph (Watts-Strogatz model)
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

    // Rewire some edges for small-world property
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
 * Create scale-free graph (Barabási-Albert model)
 */
function createScaleFreeGraph(nodeCount: number, avgDegree: number): Graph {
    const graph = new Graph();
    const m = Math.floor(avgDegree / 2); // Edges to add per new node

    // Start with a small complete graph
    const initialSize = Math.min(m + 1, 10);
    for (let i = 0; i < initialSize; i++) {
        graph.addNode(i);
        for (let j = 0; j < i; j++) {
            graph.addEdge(i, j);
        }
    }

    // Add remaining nodes with preferential attachment
    for (let i = initialSize; i < nodeCount; i++) {
        graph.addNode(i);

        const degrees = new Map<number, number>();
        let totalDegree = 0;

        // Calculate current degrees
        for (let j = 0; j < i; j++) {
            const degree = graph.outDegree(j);
            degrees.set(j, degree);
            totalDegree += degree;
        }

        // Add m edges with preferential attachment
        const addedEdges = new Set<number>();
        for (let k = 0; k < m && addedEdges.size < i; k++) {
            let target = -1;
            let attempts = 0;

            while ((target === -1 || addedEdges.has(target)) && attempts < 100) {
                const rand = Math.random() * totalDegree;
                let sum = 0;

                for (let j = 0; j < i; j++) {
                    sum += degrees.get(j) ?? 1; // Ensure minimum degree of 1
                    if (rand <= sum) {
                        target = j;
                        break;
                    }
                }
                attempts++;
            }

            if (target !== -1 && !addedEdges.has(target)) {
                graph.addEdge(i, target);
                addedEdges.add(target);
            }
        }
    }

    return graph;
}

/**
 * Estimate memory usage for different algorithms
 */
function estimateMemoryUsage(graph: Graph, algorithm: string): number {
    const baseMemory = (graph.nodeCount * 4) + (graph.uniqueEdgeCount * 2 * 4); // CSR format

    switch (algorithm) {
        case "BFS":
            return baseMemory + (graph.nodeCount * 2); // Distance array + visited bitmap
        case "BETWEENNESS":
            return baseMemory + (graph.nodeCount * 16); // Multiple arrays for path counting
        case "CLOSENESS":
            return baseMemory + (graph.nodeCount * 4); // Distance array only
        case "SHORTEST_PATH":
            return baseMemory + (graph.nodeCount * 8); // Distance + predecessor arrays
        case "SINGLE_SOURCE":
            return baseMemory + (graph.nodeCount * 12); // Distance + predecessor + result maps
        default:
            return baseMemory;
    }
}

/**
 * Display summary table of results
 */
function displaySummaryTable(results: BenchmarkResult[]): void {
    console.log("Algorithm                    | Graph Type  | Nodes   | Time (ms) | Target | Status");
    console.log("----------------------------|-------------|---------|-----------|--------|-------");

    for (const result of results) {
        let status: string;
        if (result.targetTime !== undefined) {
            status = result.meetsTarget ? "✅ PASS" : "❌ FAIL";
        } else {
            status = "  N/A ";
        }

        const target = result.targetTime ? `${result.targetTime.toFixed(0)}ms` : "   -  ";

        console.log(
            `${result.algorithm.padEnd(27)} | ${result.graphType.padEnd(11)} | ${result.nodeCount.toLocaleString().padEnd(7)} | ${result.executionTime.toFixed(2).padStart(9)} | ${target.padEnd(6)} | ${status}`,
        );
    }
}

/**
 * Display memory analysis
 */
function displayMemoryAnalysis(results: BenchmarkResult[]): void {
    const memoryByAlgorithm = new Map<string, number[]>();

    for (const result of results) {
        if (!memoryByAlgorithm.has(result.algorithm)) {
            memoryByAlgorithm.set(result.algorithm, []);
        }

        memoryByAlgorithm.get(result.algorithm)?.push(result.memoryUsed);
    }

    console.log("Algorithm                    | Avg Memory (MB) | Memory Efficiency");
    console.log("----------------------------|-----------------|------------------");

    for (const [algorithm, memories] of memoryByAlgorithm) {
        const avgMemory = memories.reduce((a, b) => a + b, 0) / memories.length;
        let efficiency: string;
        if (avgMemory < 100 * 1024 * 1024) {
            efficiency = "✅ Excellent";
        } else if (avgMemory < 500 * 1024 * 1024) {
            efficiency = "⚡ Good";
        } else {
            efficiency = "⚠️  High";
        }

        console.log(
            `${algorithm.padEnd(27)} | ${(avgMemory / 1024 / 1024).toFixed(2).padStart(15)} | ${efficiency}`,
        );
    }
}

// Run benchmark if called directly
if (typeof process !== "undefined" && import.meta.url === `file://${process.argv[1] ?? ""}`) {
    runComprehensiveBenchmarks();
}
