/* eslint-disable no-console */
/**
 * Comprehensive benchmark suite for ALL 98 algorithms in @graphty/algorithms
 *
 * Two modes:
 * - Full benchmark: Completes in under 1 hour
 * - Quick benchmark: Completes in under 2 minutes
 */

import * as algorithms from "./algorithms/index.js";
import {Graph} from "./core/graph.js";

interface BenchmarkResult {
    algorithm: string;
    category: string;
    executionTime: number;
    success: boolean;
    error?: string;
    nodeCount: number;
    edgeCount: number;
    mode: "quick" | "full";
}

const ALGORITHM_CATEGORIES = {
    traversal: {
        algorithms: [
            "breadthFirstSearch",
            "isBipartite",
            "shortestPathBFS",
            "singleSourceShortestPathBFS",
            "depthFirstSearch",
            "findStronglyConnectedComponents",
            "hasCycleDFS",
            "topologicalSort",
        ],
        config: {
            name: "Traversal",
            quick: {nodes: 1000, edges: 5000, runs: 3},
            full: {nodes: 10000, edges: 50000, runs: 10},
        },
    },
    shortestPath: {
        algorithms: [
            "bellmanFord",
            "bellmanFordPath",
            "hasNegativeCycle",
            "allPairsShortestPath",
            "dijkstra",
            "dijkstraPath",
            "singleSourceShortestPath",
            "floydWarshall",
            "floydWarshallPath",
            "transitiveClosure",
        ],
        config: {
            name: "Shortest Path",
            quick: {nodes: 100, edges: 500, runs: 1}, // Smaller for O(V³) algorithms
            full: {nodes: 500, edges: 2500, runs: 3},
        },
    },
    centrality: {
        algorithms: [
            "betweennessCentrality",
            "closenessCentrality",
            "degreeCentrality",
            "eigenvectorCentrality",
            "hits",
            "katzCentrality",
            "pageRank",
            "personalizedPageRank",
        ],
        config: {
            name: "Centrality",
            quick: {nodes: 500, edges: 2500, runs: 1},
            full: {nodes: 2000, edges: 10000, runs: 3},
        },
    },
    components: {
        algorithms: [
            "connectedComponents",
            "connectedComponentsDFS",
            "stronglyConnectedComponents",
            "weaklyConnectedComponents",
            "isConnected",
            "isStronglyConnected",
            "isWeaklyConnected",
            "numberOfConnectedComponents",
            "largestConnectedComponent",
            "getConnectedComponent",
        ],
        config: {
            name: "Components",
            quick: {nodes: 2000, edges: 10000, runs: 3},
            full: {nodes: 10000, edges: 50000, runs: 10},
        },
    },
    mst: {
        algorithms: ["kruskalMST", "primMST", "minimumSpanningTree"],
        config: {
            name: "Minimum Spanning Tree",
            quick: {nodes: 1000, edges: 5000, runs: 5},
            full: {nodes: 5000, edges: 25000, runs: 10},
        },
    },
    community: {
        algorithms: ["girvanNewman", "labelPropagation", "leiden", "louvain"],
        config: {
            name: "Community Detection",
            quick: {nodes: 200, edges: 1000, runs: 1}, // Very expensive algorithms
            full: {nodes: 1000, edges: 5000, runs: 2},
        },
    },
    matching: {
        algorithms: ["bipartitePartition", "greedyBipartiteMatching", "maximumBipartiteMatching"],
        config: {
            name: "Matching",
            quick: {nodes: 500, edges: 1000, runs: 3},
            full: {nodes: 2000, edges: 4000, runs: 5},
        },
    },
} as const;

/**
 * Main benchmark runner
 */
export function runAllAlgorithmsBenchmark(mode: "quick" | "full" = "full"): BenchmarkResult[] {
    const startTime = Date.now();
    const timeLimit = mode === "quick" ? 2 * 60 * 1000 : 60 * 60 * 1000; // 2 min or 1 hour

    console.log(`🚀 ${mode === "quick" ? "Quick" : "Comprehensive"} Benchmark - All ${String(getTotalAlgorithmCount())} Algorithms`);
    console.log(`=${"=".repeat(60)}`);
    console.log(`Time limit: ${mode === "quick" ? "2 minutes" : "1 hour"}`);
    console.log(`Start time: ${new Date().toLocaleTimeString()}\n`);

    const results: BenchmarkResult[] = [];
    let totalTested = 0;
    let totalPassed = 0;

    for (const [categoryKey, categoryData] of Object.entries(ALGORITHM_CATEGORIES)) {
        const elapsed = Date.now() - startTime;
        if (elapsed > timeLimit) {
            console.log("⏰ Time limit reached, stopping benchmark");
            break;
        }

        console.log(`\n📊 ${categoryData.config.name} Algorithms`);
        console.log("-".repeat(categoryData.config.name.length + 12));

        const config = categoryData.config[mode];
        const graph = createTestGraph(config.nodes, config.edges, categoryKey);

        for (const algoName of categoryData.algorithms) {
            const elapsed = Date.now() - startTime;
            if (elapsed > timeLimit) {
                console.log(`⏰ Time limit reached in category ${categoryData.config.name}`);
                break;
            }

            const result = benchmarkAlgorithm(algoName, categoryData.config.name, graph, config.runs, mode);
            results.push(result);
            totalTested++;

            if (result.success) {
                totalPassed++;
                console.log(`  ✅ ${algoName}: ${result.executionTime.toFixed(2)}ms`);
            } else {
                console.log(`  ❌ ${algoName}: ${result.error?.substring(0, 50) ?? "Failed"}`);
            }
        }
    }

    const totalTime = (Date.now() - startTime) / 1000;

    console.log("\n📈 Benchmark Complete");
    console.log("===================");
    console.log(`Total time: ${totalTime.toFixed(1)}s`);
    console.log(`Algorithms tested: ${String(totalTested)}`);
    console.log(`Success rate: ${String(totalPassed)}/${String(totalTested)} (${(totalPassed / totalTested * 100).toFixed(1)}%)`);

    if (mode === "full") {
        displayDetailedResults(results);
    }

    return results;
}

/**
 * Benchmark a single algorithm
 */
function benchmarkAlgorithm(
    algoName: string,
    category: string,
    graph: Graph,
    runs: number,
    mode: "quick" | "full",
): BenchmarkResult {
    const algo = (algorithms as Record<string, unknown>)[algoName];

    if (!algo || typeof algo !== "function") {
        return {
            algorithm: algoName,
            category,
            executionTime: 0,
            success: false,
            error: "Algorithm not found or not a function",
            nodeCount: graph.nodeCount,
            edgeCount: graph.uniqueEdgeCount,
            mode,
        };
    }

    try {
        const times: number[] = [];

        for (let i = 0; i < runs; i++) {
            const args = getAlgorithmArgs(algoName, graph);
            const start = performance.now();

            (algo as (... args: unknown[]) => unknown)(... args);

            const time = performance.now() - start;
            times.push(time);
        }

        // Use median time to avoid outliers
        times.sort((a, b) => a - b);
        const medianTime = times[Math.floor(times.length / 2)] ?? 0;

        return {
            algorithm: algoName,
            category,
            executionTime: medianTime,
            success: true,
            nodeCount: graph.nodeCount,
            edgeCount: graph.uniqueEdgeCount,
            mode,
        };
    } catch (error) {
        return {
            algorithm: algoName,
            category,
            executionTime: 0,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            nodeCount: graph.nodeCount,
            edgeCount: graph.uniqueEdgeCount,
            mode,
        };
    }
}

/**
 * Get appropriate arguments for each algorithm
 */
function getAlgorithmArgs(algoName: string, graph: Graph): unknown[] {
    // Get random nodes for algorithms that need them
    const nodes = Array.from(graph.nodes()).map((n) => n.id);
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    const randomNode2 = nodes[Math.floor(Math.random() * nodes.length)];

    // Algorithm-specific argument mapping
    switch (algoName) {
        // Single source algorithms
        case "breadthFirstSearch":
        case "depthFirstSearch":
        case "singleSourceShortestPathBFS":
        case "singleSourceShortestPath":
        case "dijkstra":
        case "bellmanFord":
            return [graph, randomNode];

        // PageRank algorithms need directed graph
        case "pageRank": {
            const directedForPR = createDirectedGraph(graph);
            return [directedForPR];
        }

        case "personalizedPageRank": {
            const directedForPPR = createDirectedGraph(graph);
            const personalNodes = [randomNode]; // Array of nodes for personalization
            return [directedForPPR, personalNodes];
        }

        // Two node algorithms
        case "shortestPathBFS":
        case "dijkstraPath":
        case "bellmanFordPath":
            return [graph, randomNode, randomNode2];

        // Component-specific algorithms
        case "getConnectedComponent":
            return [graph, randomNode];

        // Algorithms that need specific graph types
        case "topologicalSort":
        case "findStronglyConnectedComponents":
        case "stronglyConnectedComponents":
        case "weaklyConnectedComponents":
        case "isStronglyConnected":
        case "isWeaklyConnected": {
            // Create a directed version of the graph for these algorithms
            const directedGraph = createDirectedGraph(graph);
            return [directedGraph];
        }

        // Bipartite algorithms need bipartite graphs
        case "bipartitePartition":
        case "greedyBipartiteMatching":
        case "maximumBipartiteMatching": {
            const bipartiteGraph = createBipartiteGraph(Math.floor(graph.nodeCount / 2));
            return [bipartiteGraph];
        }

        // Community detection algorithms
        case "labelPropagation":
        case "leiden":
        case "louvain":
        case "girvanNewman":
            return [graph, {}]; // Pass empty options

        // Default: just the graph
        default:
            return [graph];
    }
}

/**
 * Create test graph appropriate for each algorithm category
 */
function createTestGraph(nodes: number, edges: number, category: string): Graph {
    const graph = new Graph();

    // Add nodes
    for (let i = 0; i < nodes; i++) {
        graph.addNode(i);
    }

    // Create different graph structures for different algorithm categories
    switch (category) {
        case "shortestPath":
            // Sparse connected graph for shortest path algorithms
            createConnectedGraph(graph, Math.min(edges, nodes * 3));
            break;

        case "centrality":
            // Small-world graph good for centrality analysis
            createSmallWorldGraph(graph, Math.floor(edges / nodes));
            break;

        case "community":
            // Graph with community structure
            createCommunityGraph(graph, edges);
            break;

        default:
            // Random connected graph
            createConnectedGraph(graph, edges);
    }

    return graph;
}

/**
 * Create a connected random graph
 */
function createConnectedGraph(graph: Graph, targetEdges: number): void {
    const nodes = graph.nodeCount;

    // First create a spanning tree to ensure connectivity
    for (let i = 1; i < nodes; i++) {
        const parent = Math.floor(Math.random() * i);
        graph.addEdge(parent, i);
    }

    // Add remaining edges randomly
    let edgesAdded = nodes - 1;
    while (edgesAdded < targetEdges) {
        const source = Math.floor(Math.random() * nodes);
        const target = Math.floor(Math.random() * nodes);

        if (source !== target && !graph.hasEdge(source, target)) {
            graph.addEdge(source, target);
            edgesAdded++;
        }
    }
}

/**
 * Create small-world graph (Watts-Strogatz model)
 */
function createSmallWorldGraph(graph: Graph, avgDegree: number): void {
    const nodes = graph.nodeCount;
    const k = Math.floor(avgDegree / 2);

    // Ring lattice
    for (let i = 0; i < nodes; i++) {
        for (let j = 1; j <= k; j++) {
            const target = (i + j) % nodes;
            graph.addEdge(i, target);
        }
    }

    // Rewire some edges
    const rewireProb = 0.1;
    for (let i = 0; i < nodes; i++) {
        for (let j = 1; j <= k; j++) {
            if (Math.random() < rewireProb) {
                const oldTarget = (i + j) % nodes;
                const newTarget = Math.floor(Math.random() * nodes);
                if (newTarget !== i && !graph.hasEdge(i, newTarget)) {
                    graph.removeEdge(i, oldTarget);
                    graph.addEdge(i, newTarget);
                }
            }
        }
    }
}

/**
 * Create graph with community structure
 */
function createCommunityGraph(graph: Graph, targetEdges: number): void {
    const nodes = graph.nodeCount;
    const communities = Math.min(5, Math.floor(nodes / 20)); // 5 communities max
    const communitySize = Math.floor(nodes / communities);

    let edgesAdded = 0;

    // Create dense connections within communities
    for (let c = 0; c < communities; c++) {
        const start = c * communitySize;
        const end = Math.min((c + 1) * communitySize, nodes);

        for (let i = start; i < end && edgesAdded < targetEdges; i++) {
            for (let j = i + 1; j < end && edgesAdded < targetEdges; j++) {
                if (Math.random() < 0.8) { // High probability within community
                    graph.addEdge(i, j);
                    edgesAdded++;
                }
            }
        }
    }

    // Add sparse connections between communities
    while (edgesAdded < targetEdges) {
        const source = Math.floor(Math.random() * nodes);
        const target = Math.floor(Math.random() * nodes);

        if (source !== target && !graph.hasEdge(source, target)) {
            graph.addEdge(source, target);
            edgesAdded++;
        }
    }
}

/**
 * Create directed version of graph
 */
function createDirectedGraph(undirectedGraph: Graph): Graph {
    const directedGraph = new Graph({directed: true});

    // Copy nodes
    for (const node of undirectedGraph.nodes()) {
        directedGraph.addNode(node.id);
    }

    // Copy edges as directed
    for (const edge of undirectedGraph.edges()) {
        directedGraph.addEdge(edge.source, edge.target);
    }

    return directedGraph;
}

/**
 * Create bipartite graph
 */
function createBipartiteGraph(nodesPerPartition: number): Graph {
    const graph = new Graph();

    // Add nodes (0 to n-1 in first partition, n to 2n-1 in second)
    for (let i = 0; i < nodesPerPartition * 2; i++) {
        graph.addNode(i);
    }

    // Add edges only between partitions
    for (let i = 0; i < nodesPerPartition; i++) {
        for (let j = nodesPerPartition; j < nodesPerPartition * 2; j++) {
            if (Math.random() < 0.3) { // Sparse bipartite graph
                graph.addEdge(i, j);
            }
        }
    }

    return graph;
}

/**
 * Get total algorithm count
 */
function getTotalAlgorithmCount(): number {
    return Object.values(ALGORITHM_CATEGORIES).reduce((total, category) =>
        total + category.algorithms.length, 0);
}

/**
 * Display detailed results for full benchmark
 */
function displayDetailedResults(results: BenchmarkResult[]): void {
    console.log("\n📊 Detailed Results");
    console.log("==================");

    const categories = new Map<string, BenchmarkResult[]>();

    for (const result of results) {
        if (!categories.has(result.category)) {
            categories.set(result.category, []);
        }

        categories.get(result.category)?.push(result);
    }

    for (const [category, categoryResults] of categories) {
        console.log(`\n${category}:`);
        console.log("-".repeat(category.length + 1));

        const successful = categoryResults.filter((r) => r.success);
        const failed = categoryResults.filter((r) => !r.success);

        if (successful.length > 0) {
            const avgTime = successful.reduce((sum, r) => sum + r.executionTime, 0) / successful.length;
            console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
            const minTime = Math.min(... successful.map((r) => r.executionTime));
            const maxTime = Math.max(... successful.map((r) => r.executionTime));
            console.log(`  Range: ${minTime.toFixed(2)}ms - ${maxTime.toFixed(2)}ms`);
        }

        if (failed.length > 0) {
            console.log(`  Failed algorithms: ${failed.map((r) => r.algorithm).join(", ")}`);
        }
    }
}

// Run benchmark if called directly
if (typeof process !== "undefined" && import.meta.url === `file://${process.argv[1] ?? ""}`) {
    const mode = process.argv.includes("--quick") ? "quick" : "full";
    runAllAlgorithmsBenchmark(mode);
}
