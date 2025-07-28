/* eslint-disable no-console */
import {betweennessCentrality} from "../algorithms/centrality/betweenness.js";
import {closenessCentrality} from "../algorithms/centrality/closeness.js";
import {breadthFirstSearch, shortestPathBFS, singleSourceShortestPathBFS} from "../algorithms/traversal/bfs.js";
import {Graph} from "../core/graph.js";
import {configureOptimizations} from "./graph-adapter.js";

/**
 * Focused performance validation for Priority 1 optimizations
 *
 * This validates that we meet the core performance targets from the design document
 * with reasonable test times suitable for CI/development.
 */

interface ValidationResult {
    algorithm: string;
    nodeCount: number;
    executionTime: number;
    targetTime?: number;
    passed: boolean;
    speedupVsBaseline?: number;
}

/**
 * Performance targets (adjusted for practicality)
 */
const VALIDATION_TARGETS = {
    BFS_10K: 10, // 10K nodes: <10ms (baseline test)
    BFS_50K: 50, // 50K nodes: <50ms (optimization should kick in)
    BFS_100K: 200, // 100K nodes: <200ms (major optimization test)
    SHORTEST_PATH_10K: 15, // 10K nodes: <15ms
    SHORTEST_PATH_50K: 100, // 50K nodes: <100ms
    BETWEENNESS_1K: 2000, // 1K nodes: <2s (computationally intensive)
    CLOSENESS_1K: 1000, // 1K nodes: <1s (all nodes)
} as const;

export function runValidationSuite(): boolean {
    console.log("🎯 Performance Validation Suite - Priority 1 Optimizations");
    console.log("============================================================\n");

    // Enable all optimizations
    configureOptimizations({
        useDirectionOptimizedBFS: true,
        useCSRFormat: true,
        useBitPackedStructures: true,
        bfsAlpha: 15.0,
        bfsBeta: 20.0,
        enableCaching: true,
    });

    const results: ValidationResult[] = [];
    let totalPassed = 0;

    // Test 1: BFS Performance on Different Graph Sizes
    console.log("📊 Testing BFS Performance Scaling");
    console.log("===================================");

    const bfsResults = testBFSScaling();
    results.push(... bfsResults);
    totalPassed += bfsResults.filter((r) => r.passed).length;

    // Test 2: Shortest Path Algorithms
    console.log("\n🛣️  Testing Shortest Path Algorithms");
    console.log("====================================");

    const pathResults = testShortestPaths();
    results.push(... pathResults);
    totalPassed += pathResults.filter((r) => r.passed).length;

    // Test 3: Centrality Algorithms (limited testing due to computational cost)
    console.log("\n📐 Testing Centrality Algorithms");
    console.log("================================");

    const centralityResults = testCentralityAlgorithms();
    results.push(... centralityResults);
    totalPassed += centralityResults.filter((r) => r.passed).length;

    // Summary
    console.log("\n📈 Validation Summary");
    console.log("====================");

    displayValidationTable(results);

    const overallPassed = totalPassed === results.length;
    console.log(`\n${overallPassed ? "✅" : "❌"} Overall Result: ${String(totalPassed)}/${String(results.length)} tests passed`);

    if (!overallPassed) {
        console.log("\n⚠️  Failed tests indicate performance regressions or unmet optimization targets.");
        console.log("   Consider investigating CSR conversion overhead or algorithm implementation.");
    } else {
        console.log("\n🎉 All performance targets met! Priority 1 optimizations are working correctly.");
    }

    return overallPassed;
}

/**
 * Test BFS performance scaling with graph size
 */
function testBFSScaling(): ValidationResult[] {
    const results: ValidationResult[] = [];

    const configs = [
        {nodes: 10000, target: VALIDATION_TARGETS.BFS_10K, name: "10K nodes"},
        {nodes: 50000, target: VALIDATION_TARGETS.BFS_50K, name: "50K nodes"},
        {nodes: 100000, target: VALIDATION_TARGETS.BFS_100K, name: "100K nodes"},
    ];

    let baseline = 0;

    for (const config of configs) {
        console.log(`  Testing BFS on ${config.name}...`);

        const graph = createTestGraph(config.nodes, 15);

        // Warm up
        for (let i = 0; i < 3; i++) {
            breadthFirstSearch(graph, 0);
        }

        // Benchmark
        const time = measureExecution(() => {
            breadthFirstSearch(graph, 0);
        }, 5);

        if (baseline === 0) {
            baseline = time;
        }

        const passed = time <= config.target;
        const speedup = baseline > 0 ? baseline / time : undefined;

        const bfsValidationResult: ValidationResult = {
            algorithm: `BFS (${config.name})`,
            nodeCount: config.nodes,
            executionTime: time,
            targetTime: config.target,
            passed,
        };
        if (speedup !== undefined) {
            bfsValidationResult.speedupVsBaseline = speedup;
        }

        results.push(bfsValidationResult);

        console.log(`    Result: ${time.toFixed(2)}ms ${passed ? "✅" : "❌"} (target: ${String(config.target)}ms)`);
    }

    return results;
}

/**
 * Test shortest path algorithms
 */
function testShortestPaths(): ValidationResult[] {
    const results: ValidationResult[] = [];

    const configs = [
        {nodes: 10000, target: VALIDATION_TARGETS.SHORTEST_PATH_10K, name: "10K nodes"},
        {nodes: 50000, target: VALIDATION_TARGETS.SHORTEST_PATH_50K, name: "50K nodes"},
    ];

    for (const config of configs) {
        console.log(`  Testing shortest paths on ${config.name}...`);

        const graph = createTestGraph(config.nodes, 15);
        const source = 0;
        const target = Math.floor(config.nodes / 2);

        // Test pairwise shortest path
        const pairTime = measureExecution(() => {
            shortestPathBFS(graph, source, target);
        }, 10);

        const pairPassed = pairTime <= config.target;

        results.push({
            algorithm: `Shortest Path (${config.name})`,
            nodeCount: config.nodes,
            executionTime: pairTime,
            targetTime: config.target,
            passed: pairPassed,
        });

        console.log(`    Pairwise: ${pairTime.toFixed(2)}ms ${pairPassed ? "✅" : "❌"} (target: ${String(config.target)}ms)`);

        // Test single-source (more expensive, so only for smaller graphs)
        if (config.nodes <= 10000) {
            const ssTime = measureExecution(() => {
                singleSourceShortestPathBFS(graph, source);
            }, 3);

            // More lenient target for single-source (processes all nodes)
            const ssTarget = config.target * 10;
            const ssPassed = ssTime <= ssTarget;

            results.push({
                algorithm: `Single-Source SP (${config.name})`,
                nodeCount: config.nodes,
                executionTime: ssTime,
                targetTime: ssTarget,
                passed: ssPassed,
            });

            console.log(`    Single-Source: ${ssTime.toFixed(2)}ms ${ssPassed ? "✅" : "❌"} (target: ${String(ssTarget)}ms)`);
        }
    }

    return results;
}

/**
 * Test centrality algorithms (limited scope due to computational cost)
 */
function testCentralityAlgorithms(): ValidationResult[] {
    const results: ValidationResult[] = [];

    console.log("  Testing centrality on 1K nodes (computationally intensive)...");

    const graph = createTestGraph(1000, 10);

    // Test betweenness centrality
    const betweennessTime = measureExecution(() => {
        betweennessCentrality(graph, {optimized: true});
    }, 1); // Only 1 run due to cost

    const betweennessPassed = betweennessTime <= VALIDATION_TARGETS.BETWEENNESS_1K;

    results.push({
        algorithm: "Betweenness Centrality (1K nodes)",
        nodeCount: 1000,
        executionTime: betweennessTime,
        targetTime: VALIDATION_TARGETS.BETWEENNESS_1K,
        passed: betweennessPassed,
    });

    console.log(`    Betweenness: ${betweennessTime.toFixed(2)}ms ${betweennessPassed ? "✅" : "❌"} (target: ${String(VALIDATION_TARGETS.BETWEENNESS_1K)}ms)`);

    // Test closeness centrality
    const closenessTime = measureExecution(() => {
        closenessCentrality(graph, {optimized: true});
    }, 2);

    const closenessPassed = closenessTime <= VALIDATION_TARGETS.CLOSENESS_1K;

    results.push({
        algorithm: "Closeness Centrality (1K nodes)",
        nodeCount: 1000,
        executionTime: closenessTime,
        targetTime: VALIDATION_TARGETS.CLOSENESS_1K,
        passed: closenessPassed,
    });

    console.log(`    Closeness: ${closenessTime.toFixed(2)}ms ${closenessPassed ? "✅" : "❌"} (target: ${String(VALIDATION_TARGETS.CLOSENESS_1K)}ms)`);

    return results;
}

/**
 * Create a test graph with good properties for optimization testing
 */
function createTestGraph(nodeCount: number, avgDegree: number): Graph {
    const graph = new Graph();

    // Add all nodes
    for (let i = 0; i < nodeCount; i++) {
        graph.addNode(i);
    }

    // Create a small-world graph that benefits from direction-optimized BFS
    const k = Math.floor(avgDegree / 2);

    // Ring lattice
    for (let i = 0; i < nodeCount; i++) {
        for (let j = 1; j <= k; j++) {
            const target = (i + j) % nodeCount;
            graph.addEdge(i, target);
        }
    }

    // Add some random long-range connections (small-world property)
    const rewireProb = 0.1;
    const longRangeEdges = Math.floor(nodeCount * rewireProb);

    for (let i = 0; i < longRangeEdges; i++) {
        const source = Math.floor(Math.random() * nodeCount);
        const target = Math.floor(Math.random() * nodeCount);

        if (source !== target && !graph.hasEdge(source, target)) {
            graph.addEdge(source, target);
        }
    }

    return graph;
}

/**
 * Measure execution time with multiple runs for accuracy
 */
function measureExecution(fn: () => void, runs: number): number {
    const times: number[] = [];

    for (let i = 0; i < runs; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        times.push(end - start);
    }

    // Return median to avoid outliers
    times.sort((a, b) => a - b);
    return times[Math.floor(times.length / 2)] ?? 0;
}

/**
 * Display validation results in a clean table
 */
function displayValidationTable(results: ValidationResult[]): void {
    console.log("\nAlgorithm                         | Nodes   | Time (ms) | Target (ms) | Status");
    console.log("----------------------------------|---------|-----------|-------------|--------");

    for (const result of results) {
        const status = result.passed ? "✅ PASS" : "❌ FAIL";
        const target = result.targetTime ? result.targetTime.toFixed(0) : "N/A";
        const speedup = result.speedupVsBaseline ? ` (${result.speedupVsBaseline.toFixed(2)}x)` : "";

        console.log(
            `${result.algorithm.padEnd(33)} | ${result.nodeCount.toLocaleString().padEnd(7)} | ${result.executionTime.toFixed(2).padStart(9)} | ${target.padStart(11)} | ${status}${speedup}`,
        );
    }
}

// Run validation if called directly
if (typeof process !== "undefined" && import.meta.url === `file://${process.argv[1] ?? ""}`) {
    const success = runValidationSuite();
    process.exit(success ? 0 : 1);
}
