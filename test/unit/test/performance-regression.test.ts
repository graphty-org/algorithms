import * as fs from "fs";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {PerformanceRegressionTest} from "../../helpers/performance-regression.js";

vi.mock("fs", async() => {
    const actual = await vi.importActual<typeof fs>("fs");
    return {
        ... actual,
        readFileSync: vi.fn(),
        writeFileSync: vi.fn(),
    };
});

// Mock console methods
const originalConsole = {
    log: console.log,
    warn: console.warn,
};

describe("PerformanceRegressionTest", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.log = vi.fn();
        console.warn = vi.fn();
        // Mock performance.now to return predictable values
        let time = 0;
        vi.spyOn(performance, "now").mockImplementation(() => {
            time += 1;
            return time;
        });
    });

    afterEach(() => {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        vi.restoreAllMocks();
    });

    describe("constructor and baseline loading", () => {
        it("should load baselines from file if exists", () => {
            const mockBaselines = [
                {
                    algorithm: "BFS",
                    graphType: "small-world",
                    nodeCount: 1000,
                    edgeCount: 5000,
                    executionTime: 10,
                    memoryUsed: 1000000,
                    timestamp: new Date().toISOString(),
                },
            ];

            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockBaselines));

            new PerformanceRegressionTest();

            expect(fs.readFileSync).toHaveBeenCalledWith(
                expect.stringContaining("performance-baseline.json"),
                "utf8",
            );
            expect(console.log).toHaveBeenCalledWith("Loaded 1 baseline measurements");
        });

        it("should handle missing baseline file", () => {
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error("File not found");
            });

            new PerformanceRegressionTest();

            expect(console.warn).toHaveBeenCalledWith(
                "No baseline file found. Will create new baseline.",
            );
        });
    });

    describe("runAll", () => {
        it("should run performance tests and return true when no regressions", () => {
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error("No baseline");
            });

            const test = new PerformanceRegressionTest();
            const result = test.runAll();

            expect(result).toBe(true);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Performance Regression Test Suite"),
            );
        });

        it("should detect performance regressions", () => {
            const mockBaselines = [
                {
                    algorithm: "BFS",
                    graphType: "small-world",
                    nodeCount: 1000,
                    edgeCount: 5000,
                    executionTime: 5, // Baseline is 5ms
                    memoryUsed: 1000000,
                    timestamp: new Date().toISOString(),
                },
            ];

            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockBaselines));

            // Mock performance.now to simulate slower execution
            let callCount = 0;
            vi.spyOn(performance, "now").mockImplementation(() => {
                // Return values that simulate 20ms execution time (> 10% regression)
                callCount++;
                if (callCount % 2 === 1) {
                    return 0;
                }
                return 20;
            });

            const test = new PerformanceRegressionTest();
            const result = test.runAll();

            expect(result).toBe(false);
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Performance regressions detected!"),
            );
        });
    });

    describe("updateBaselines", () => {
        it("should update baselines by running all tests and saving", () => {
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error("No baseline");
            });

            const test = new PerformanceRegressionTest();
            test.updateBaselines();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("performance-baseline.json"),
                expect.any(String),
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Baselines updated successfully!"),
            );
        });
    });

    describe("private methods", () => {
        it("should generate correct baseline keys", () => {
            const test = new PerformanceRegressionTest();
            const getBaselineKey = (test as unknown as {getBaselineKey: (config: {algorithm: string; graphType: string; nodeCount: number}) => string}).getBaselineKey.bind(test);

            const key = getBaselineKey({
                algorithm: "BFS",
                graphType: "small-world",
                nodeCount: 1000,
            });

            expect(key).toBe("BFS-small-world-1000");
        });

        it("should save baselines correctly", () => {
            const test = new PerformanceRegressionTest();
            const {baselines} = test as unknown as {baselines: Map<string, BenchmarkResult>};

            baselines.set("test-key", {
                algorithm: "TestAlgo",
                graphType: "test",
                nodeCount: 100,
                edgeCount: 200,
                executionTime: 5,
                memoryUsed: 1000,
                timestamp: "2024-01-01",
            });

            const saveBaselines = (test as unknown as {saveBaselines: () => void}).saveBaselines.bind(test);
            saveBaselines();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining("TestAlgo"),
            );
        });
    });

    describe("graph generation", () => {
        it("should generate small world graph", () => {
            const test = new PerformanceRegressionTest();
            const generateSmallWorldGraph = (test as unknown as {generateSmallWorldGraph: (size: number) => Graph}).generateSmallWorldGraph.bind(test);
            const Graph = vi.fn().mockImplementation(() => ({
                addNode: vi.fn(),
                addEdge: vi.fn(),
                hasEdge: vi.fn().mockReturnValue(false),
                removeEdge: vi.fn(),
            }));

            const mockGraph = new Graph();
            const result = generateSmallWorldGraph(mockGraph, 100);

            expect(mockGraph.addEdge).toHaveBeenCalled();
            expect(result).toBe(mockGraph);
        });

        it("should generate scale free graph", () => {
            const test = new PerformanceRegressionTest();
            const generateScaleFreeGraph = (test as unknown as {generateScaleFreeGraph: (size: number) => Graph}).generateScaleFreeGraph.bind(test);
            const Graph = vi.fn().mockImplementation(() => ({
                addNode: vi.fn(),
                addEdge: vi.fn(),
                neighbors: vi.fn().mockReturnValue([]),
            }));

            const mockGraph = new Graph();
            const result = generateScaleFreeGraph(mockGraph, 100);

            expect(mockGraph.addEdge).toHaveBeenCalled();
            expect(result).toBe(mockGraph);
        });

        it("should generate random graph", () => {
            const test = new PerformanceRegressionTest();
            const generateRandomGraph = (test as unknown as {generateRandomGraph: (size: number, density: number) => Graph}).generateRandomGraph.bind(test);
            const Graph = vi.fn().mockImplementation(() => ({
                addNode: vi.fn(),
                addEdge: vi.fn(),
            }));

            const mockGraph = new Graph();
            const result = generateRandomGraph(mockGraph, 100);

            expect(mockGraph.addEdge).toHaveBeenCalled();
            expect(result).toBe(mockGraph);
        });

        it("should generate complete graph", () => {
            const test = new PerformanceRegressionTest();
            const generateCompleteGraph = (test as unknown as {generateCompleteGraph: (size: number) => Graph}).generateCompleteGraph.bind(test);
            const Graph = vi.fn().mockImplementation(() => ({
                addNode: vi.fn(),
                addEdge: vi.fn(),
            }));

            const mockGraph = new Graph();
            const result = generateCompleteGraph(mockGraph, 5);

            // Complete graph with 5 nodes should have 10 edges (5*4/2)
            expect(mockGraph.addEdge).toHaveBeenCalledTimes(10);
            expect(result).toBe(mockGraph);
        });

        it("should throw error for unknown graph type", () => {
            const test = new PerformanceRegressionTest();
            const generateGraph = (test as unknown as {generateGraph: (size: number, density: number) => Graph}).generateGraph.bind(test);

            expect(() => generateGraph(10, "unknown")).toThrow("Unknown graph type: unknown");
        });
    });

    describe("benchmark methods", () => {
        it("should run BFS benchmark", () => {
            const test = new PerformanceRegressionTest();
            const benchmarkBFS = (test as unknown as {benchmarkBFS: () => void}).benchmarkBFS.bind(test);

            const mockGraph = {
                nodeCount: 100,
                nodes: () => [{id: 0}],
                neighbors: () => [],
            };

            const time = benchmarkBFS(mockGraph);
            expect(time).toBeGreaterThan(0);
        });

        it("should run shortest path benchmark", () => {
            const test = new PerformanceRegressionTest();
            const benchmarkShortestPath = (test as unknown as {benchmarkShortestPath: () => void}).benchmarkShortestPath.bind(test);

            const mockGraph = {
                nodeCount: 100,
                hasNode: () => true,
                neighbors: () => [],
            };

            const time = benchmarkShortestPath(mockGraph);
            expect(time).toBeGreaterThan(0);
        });

        it("should run single source shortest path benchmark", () => {
            const test = new PerformanceRegressionTest();
            const benchmarkSingleSourceSP = (test as unknown as {benchmarkSingleSourceSP: () => void}).benchmarkSingleSourceSP.bind(test);

            const mockGraph = {
                hasNode: () => true,
                neighbors: () => [],
            };

            const time = benchmarkSingleSourceSP(mockGraph);
            expect(time).toBeGreaterThan(0);
        });
    });

    describe("displayResults", () => {
        it("should display results summary", () => {
            const test = new PerformanceRegressionTest();
            const {results} = test as unknown as {results: BenchmarkResult[]};

            results.push({
                algorithm: "BFS",
                graphType: "small-world",
                nodeCount: 1000,
                passed: true,
                currentTime: 10,
                baselineTime: 9,
                percentChange: 0.11,
                memoryChange: 0.05,
            });

            results.push({
                algorithm: "Dijkstra",
                graphType: "random",
                nodeCount: 5000,
                passed: false,
                currentTime: 100,
                baselineTime: 80,
                percentChange: 0.25,
                memoryChange: 0.1,
            });

            const displayResults = (test as unknown as {displayResults: () => void}).displayResults.bind(test);
            displayResults();

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Performance Regression Summary"),
            );
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("1/2 passed"),
            );
        });
    });

    describe("runBenchmark", () => {
        it("should create new baseline when none exists", () => {
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error("No baseline");
            });

            const test = new PerformanceRegressionTest();
            const runBenchmark = (test as unknown as {runBenchmark: (graph: Graph, algorithmName: string, algorithm: (g: Graph) => unknown) => BenchmarkResult}).runBenchmark.bind(test);

            const mockGraph = {
                nodeCount: 100,
                totalEdgeCount: 200,
                nodes: () => [{id: 0}],
                neighbors: () => [],
            };

            const benchmarkFn = vi.fn().mockReturnValue(10);

            runBenchmark("TestAlgo", benchmarkFn, mockGraph, "test-type");

            expect(benchmarkFn).toHaveBeenCalledTimes(13); // 3 warmup + 10 benchmark
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("new baseline"),
            );
        });

        it("should compare with existing baseline", () => {
            const mockBaselines = [
                {
                    algorithm: "TestAlgo",
                    graphType: "test-type",
                    nodeCount: 100,
                    edgeCount: 200,
                    executionTime: 10,
                    memoryUsed: 1000000,
                    timestamp: new Date().toISOString(),
                },
            ];

            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockBaselines));

            const test = new PerformanceRegressionTest();
            const runBenchmark = (test as unknown as {runBenchmark: (graph: Graph, algorithmName: string, algorithm: (g: Graph) => unknown) => BenchmarkResult}).runBenchmark.bind(test);

            const mockGraph = {
                nodeCount: 100,
                totalEdgeCount: 200,
                nodes: () => [{id: 0}],
                neighbors: () => [],
            };

            const benchmarkFn = vi.fn().mockReturnValue(11); // 10% increase

            runBenchmark("TestAlgo", benchmarkFn, mockGraph, "test-type");

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("+10.0%"),
            );
        });
    });
});
