import {readFileSync, writeFileSync} from "fs";
import {join} from "path";

import {betweennessCentrality} from "../../src/algorithms/centrality/betweenness.js";
import {closenessCentrality} from "../../src/algorithms/centrality/closeness.js";
import {dijkstra} from "../../src/algorithms/shortest-path/dijkstra.js";
import {floydWarshall} from "../../src/algorithms/shortest-path/floyd-warshall.js";
import {breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS} from "../../src/algorithms/traversal/bfs.js";
import {Graph} from "../../src/core/graph.js";

/**
 * Performance regression testing framework
 *
 * Runs performance tests and compares against baseline results
 * to detect regressions > 10%
 */

interface PerformanceBaseline {
    algorithm: string;
    graphType: string;
    nodeCount: number;
    edgeCount: number;
    executionTime: number;
    memoryUsed: number;
    timestamp: string;
    gitCommit?: string;
}

interface RegressionResult {
    algorithm: string;
    graphType: string;
    nodeCount: number;
    passed: boolean;
    currentTime: number;
    baselineTime: number;
    percentChange: number;
    memoryChange?: number;
}

// Configuration
const REGRESSION_THRESHOLD = 0.1; // 10% regression threshold
const BASELINE_FILE = join(process.cwd(), "test/performance-baseline.json");
const WARMUP_RUNS = 3;
const BENCHMARK_RUNS = 10;

// Graph types to test
enum GraphType {
    SMALL_WORLD = "small-world",
    SCALE_FREE = "scale-free",
    RANDOM = "random",
    COMPLETE = "complete",
}

class PerformanceRegressionTest {
    private baselines = new Map<string, PerformanceBaseline>();
    private results: RegressionResult[] = [];

    constructor() {
        this.loadBaselines();
    }

    /**
     * Load baseline performance data
     */
    private loadBaselines(): void {
        try {
            const data = readFileSync(BASELINE_FILE, "utf8");
            const baselines = JSON.parse(data) as PerformanceBaseline[];
            for (const baseline of baselines) {
                const key = this.getBaselineKey(baseline);
                this.baselines.set(key, baseline);
            }
            console.log(`Loaded ${String(baselines.length)} baseline measurements`);
        } catch {
            console.warn("No baseline file found. Will create new baseline.");
        }
    }

    /**
     * Save baselines to file
     */
    private saveBaselines(): void {
        const baselines = Array.from(this.baselines.values());
        writeFileSync(BASELINE_FILE, JSON.stringify(baselines, null, 2));
        console.log(`Saved ${String(baselines.length)} baseline measurements`);
    }

    /**
     * Get unique key for baseline lookup
     */
    private getBaselineKey(baseline: {algorithm: string, graphType: string, nodeCount: number}): string {
        return `${baseline.algorithm}-${baseline.graphType}-${String(baseline.nodeCount)}`;
    }

    /**
     * Run all performance regression tests
     */
    runAll(): boolean {
        console.log("🔥 Performance Regression Test Suite");
        console.log("====================================\n");

        // Test configurations
        const configs = [
            // Small graphs (baseline)
            {nodeCount: 1000, graphType: GraphType.SMALL_WORLD},
            {nodeCount: 1000, graphType: GraphType.SCALE_FREE},
            {nodeCount: 1000, graphType: GraphType.RANDOM},

            // Medium graphs (optimization threshold)
            {nodeCount: 10000, graphType: GraphType.SMALL_WORLD},
            {nodeCount: 10000, graphType: GraphType.SCALE_FREE},
            {nodeCount: 10000, graphType: GraphType.RANDOM},

            // Large graphs (optimized)
            {nodeCount: 50000, graphType: GraphType.SMALL_WORLD},
            {nodeCount: 50000, graphType: GraphType.SCALE_FREE},

            // Very large (stress test)
            {nodeCount: 100000, graphType: GraphType.SMALL_WORLD},
        ];

        // Algorithms to test
        const algorithms = [
            {name: "BFS", fn: (graph: Graph) => this.benchmarkBFS(graph)},
            {name: "ShortestPath", fn: (graph: Graph) => this.benchmarkShortestPath(graph)},
            {name: "SingleSourceSP", fn: (graph: Graph) => this.benchmarkSingleSourceSP(graph)},
            {name: "Betweenness", fn: (graph: Graph) => this.benchmarkBetweenness(graph)},
            {name: "Closeness", fn: (graph: Graph) => this.benchmarkCloseness(graph)},
            {name: "Dijkstra", fn: (graph: Graph) => this.benchmarkDijkstra(graph)},
        ];

        // Run tests
        for (const config of configs) {
            console.log(`\n📊 Testing ${config.graphType} graph with ${String(config.nodeCount)} nodes`);
            console.log("=".repeat(50));

            const graph = this.generateGraph(config.nodeCount, config.graphType);
            console.log(`Generated graph: ${String(graph.nodeCount)} nodes, ${String(graph.totalEdgeCount)} edges`);

            for (const algo of algorithms) {
                // Skip expensive algorithms on very large graphs
                if (config.nodeCount > 50000 && ["Betweenness", "Closeness", "FloydWarshall"].includes(algo.name)) {
                    continue;
                }

                this.runBenchmark(algo.name, algo.fn, graph, config.graphType);
            }
        }

        // Display results
        this.displayResults();

        // Check for regressions
        const hasRegressions = this.results.some((r) => !r.passed);

        if (hasRegressions) {
            console.log("\n❌ Performance regressions detected!");
            console.log("Consider investigating the failing algorithms.");
        } else {
            console.log("\n✅ All performance tests passed!");
        }

        return !hasRegressions;
    }

    /**
     * Run a single benchmark
     */
    private runBenchmark(
        algorithm: string,
        benchmarkFn: (graph: Graph) => number,
        graph: Graph,
        graphType: string,
    ): void {
        console.log(`\n  Testing ${algorithm}...`);

        // Warm up
        for (let i = 0; i < WARMUP_RUNS; i++) {
            benchmarkFn(graph);
        }

        // Measure
        const times: number[] = [];
        const memStart = process.memoryUsage().heapUsed;

        for (let i = 0; i < BENCHMARK_RUNS; i++) {
            const time = benchmarkFn(graph);
            times.push(time);
        }

        const memEnd = process.memoryUsage().heapUsed;
        const memoryUsed = memEnd - memStart;

        // Calculate median time
        times.sort((a, b) => a - b);
        const medianTime = times[Math.floor(times.length / 2)] ?? 0;

        // Compare with baseline
        const key = this.getBaselineKey({algorithm, graphType, nodeCount: graph.nodeCount});
        const baseline = this.baselines.get(key);

        if (baseline) {
            // Check for regression
            const percentChange = (medianTime - baseline.executionTime) / baseline.executionTime;
            const passed = percentChange <= REGRESSION_THRESHOLD;

            this.results.push({
                algorithm,
                graphType,
                nodeCount: graph.nodeCount,
                passed,
                currentTime: medianTime,
                baselineTime: baseline.executionTime,
                percentChange,
                memoryChange: (memoryUsed - baseline.memoryUsed) / baseline.memoryUsed,
            });

            const status = passed ? "✅" : "❌";
            const change = percentChange >= 0 ? `+${(percentChange * 100).toFixed(1)}%` : `${(percentChange * 100).toFixed(1)}%`;
            console.log(`    Time: ${medianTime.toFixed(2)}ms (baseline: ${baseline.executionTime.toFixed(2)}ms) ${change} ${status}`);
        } else {
            // Create new baseline
            const newBaseline: PerformanceBaseline = {
                algorithm,
                graphType,
                nodeCount: graph.nodeCount,
                edgeCount: graph.totalEdgeCount,
                executionTime: medianTime,
                memoryUsed,
                timestamp: new Date().toISOString(),
            };

            this.baselines.set(key, newBaseline);
            console.log(`    Time: ${medianTime.toFixed(2)}ms (new baseline)`);
        }
    }

    /**
     * Generate test graphs
     */
    private generateGraph(nodeCount: number, graphType: GraphType): Graph {
        const graph = new Graph();

        // Add nodes
        for (let i = 0; i < nodeCount; i++) {
            graph.addNode(i);
        }

        switch (graphType) {
            case GraphType.SMALL_WORLD:
                return this.generateSmallWorldGraph(graph, nodeCount);
            case GraphType.SCALE_FREE:
                return this.generateScaleFreeGraph(graph, nodeCount);
            case GraphType.RANDOM:
                return this.generateRandomGraph(graph, nodeCount);
            case GraphType.COMPLETE:
                return this.generateCompleteGraph(graph, nodeCount);
            default:
                throw new Error(`Unknown graph type: ${graphType as string}`);
        }
    }

    /**
     * Generate Watts-Strogatz small-world graph
     */
    private generateSmallWorldGraph(graph: Graph, nodeCount: number): Graph {
        const k = 10; // Average degree
        const p = 0.1; // Rewiring probability

        // Create ring lattice
        for (let i = 0; i < nodeCount; i++) {
            for (let j = 1; j <= k / 2; j++) {
                const target = (i + j) % nodeCount;
                graph.addEdge(i, target, 1);
            }
        }

        // Rewire edges
        for (let i = 0; i < nodeCount; i++) {
            for (let j = 1; j <= k / 2; j++) {
                if (Math.random() < p) {
                    const oldTarget = (i + j) % nodeCount;
                    const newTarget = Math.floor(Math.random() * nodeCount);
                    if (newTarget !== i && !graph.hasEdge(i, newTarget)) {
                        try {
                            graph.removeEdge(i, oldTarget);
                        } catch {
                            // Edge might not exist due to previous rewiring
                        }
                        graph.addEdge(i, newTarget, 1);
                    }
                }
            }
        }

        return graph;
    }

    /**
     * Generate Barabási-Albert scale-free graph
     */
    private generateScaleFreeGraph(graph: Graph, nodeCount: number): Graph {
        const m = 3; // Edges per new node

        // Start with complete graph of m+1 nodes
        for (let i = 0; i <= m; i++) {
            for (let j = i + 1; j <= m; j++) {
                graph.addEdge(i, j, 1);
            }
        }

        // Add remaining nodes with preferential attachment
        for (let i = m + 1; i < nodeCount; i++) {
            const degrees = new Map<number, number>();
            let totalDegree = 0;

            // Calculate degrees
            for (let j = 0; j < i; j++) {
                const degree = Array.from(graph.neighbors(j)).length;
                degrees.set(j, degree);
                totalDegree += degree;
            }

            // Add m edges with preferential attachment
            const targets = new Set<number>();
            while (targets.size < m && targets.size < i) {
                let random = Math.random() * totalDegree;
                for (const [node, degree] of degrees) {
                    random -= degree;
                    if (random <= 0 && !targets.has(node)) {
                        targets.add(node);
                        break;
                    }
                }
            }

            for (const target of targets) {
                graph.addEdge(i, target, 1);
            }
        }

        return graph;
    }

    /**
     * Generate Erdős–Rényi random graph
     */
    private generateRandomGraph(graph: Graph, nodeCount: number): Graph {
        const p = 10 / nodeCount; // Expected degree ~10

        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                if (Math.random() < p) {
                    graph.addEdge(i, j, 1);
                }
            }
        }

        return graph;
    }

    /**
     * Generate complete graph (for small tests only)
     */
    private generateCompleteGraph(graph: Graph, nodeCount: number): Graph {
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                graph.addEdge(i, j, 1);
            }
        }

        return graph;
    }

    /**
     * Benchmark functions
     */
    private benchmarkBFS(graph: Graph): number {
        const start = performance.now();
        breadthFirstSearch(graph, 0);
        return performance.now() - start;
    }

    private benchmarkShortestPath(graph: Graph): number {
        const target = Math.floor(graph.nodeCount / 2);
        const start = performance.now();
        shortestPathBFS(graph, 0, target);
        return performance.now() - start;
    }

    private benchmarkSingleSourceSP(graph: Graph): number {
        const start = performance.now();
        singleSourceShortestPathBFS(graph, 0);
        return performance.now() - start;
    }

    private benchmarkBetweenness(graph: Graph): number {
        const start = performance.now();
        betweennessCentrality(graph);
        return performance.now() - start;
    }

    private benchmarkCloseness(graph: Graph): number {
        const start = performance.now();
        closenessCentrality(graph);
        return performance.now() - start;
    }

    private benchmarkDijkstra(graph: Graph): number {
        const start = performance.now();
        dijkstra(graph, 0);
        return performance.now() - start;
    }

    private benchmarkFloydWarshall(graph: Graph): number {
        const start = performance.now();
        floydWarshall(graph);
        return performance.now() - start;
    }

    /**
     * Display results summary
     */
    private displayResults(): void {
        console.log("\n\n📊 Performance Regression Summary");
        console.log("=================================\n");

        console.log("Algorithm          | Graph Type   | Nodes  | Current | Baseline | Change | Status");
        console.log("-------------------|--------------|--------|---------|----------|--------|-------");

        for (const result of this.results) {
            const change = result.percentChange >= 0 ?
                `+${(result.percentChange * 100).toFixed(1)}%` :
                `${(result.percentChange * 100).toFixed(1)}%`;
            const status = result.passed ? "✅ PASS" : "❌ FAIL";

            console.log(
                `${result.algorithm.padEnd(18)} | ` +
                `${result.graphType.padEnd(12)} | ` +
                `${result.nodeCount.toString().padEnd(6)} | ` +
                `${result.currentTime.toFixed(1).padStart(7)} | ` +
                `${result.baselineTime.toFixed(1).padStart(8)} | ` +
                `${change.padStart(6)} | ${
                    status}`,
            );
        }

        // Summary statistics
        const totalTests = this.results.length;
        const passedTests = this.results.filter((r) => r.passed).length;
        const avgChange = this.results.reduce((sum, r) => sum + r.percentChange, 0) / totalTests;

        console.log(`\n${"=".repeat(80)}`);
        console.log(`Total: ${String(passedTests)}/${String(totalTests)} passed | Average change: ${(avgChange * 100).toFixed(1)}%`);
    }

    /**
     * Update baselines (for CI or manual update)
     */
    updateBaselines(): void {
        console.log("📝 Updating performance baselines...\n");

        // Clear existing baselines
        this.baselines.clear();

        // Run all benchmarks to create new baselines
        this.runAll();

        // Save new baselines
        this.saveBaselines();

        console.log("\n✅ Baselines updated successfully!");
    }
}

export {PerformanceRegressionTest};

