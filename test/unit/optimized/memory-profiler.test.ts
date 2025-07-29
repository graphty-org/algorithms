import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {MemoryProfiler} from "../../helpers/memory-profiler.js";

// Mock console methods
const originalConsole = {
    log: console.log,
    table: console.table,
};

describe("MemoryProfiler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        console.log = vi.fn();
        console.table = vi.fn();

        // Mock process.memoryUsage
        vi.spyOn(process, "memoryUsage").mockReturnValue({
            rss: 100000000,
            heapTotal: 80000000,
            heapUsed: 60000000,
            external: 10000000,
            arrayBuffers: 5000000,
        });
    });

    afterEach(() => {
        console.log = originalConsole.log;
        console.table = originalConsole.table;
        vi.restoreAllMocks();
    });

    describe("constructor and start", () => {
        it("should initialize and start profiling", () => {
            const profiler = new MemoryProfiler();
            profiler.start();
            // Should have initial snapshot
            const snapshot = profiler.snapshot("test");
            expect(snapshot.label).toBe("test");
        });
    });

    describe("snapshot", () => {
        it("should take memory snapshot with label", () => {
            const profiler = new MemoryProfiler("TestAlgorithm");
            const snapshot = profiler.snapshot("Initial");

            expect(snapshot.label).toBe("Initial");
            expect(snapshot.heapUsed).toBe(60000000);
            expect(snapshot.heapTotal).toBe(80000000);
            expect(snapshot.external).toBe(10000000);
            expect(snapshot.arrayBuffers).toBe(5000000);
            expect(snapshot.timestamp).toBeGreaterThan(0);
        });

        it("should add snapshot with correct data", () => {
            const profiler = new MemoryProfiler();
            profiler.start();
            const snapshot1 = profiler.snapshot("First");
            const snapshot2 = profiler.snapshot("Second");

            expect(snapshot1.label).toBe("First");
            expect(snapshot2.label).toBe("Second");
            expect(snapshot2.timestamp).toBeGreaterThan(snapshot1.timestamp);
        });
    });

    describe("getSummary", () => {
        it("should calculate memory summary", () => {
            const profiler = new MemoryProfiler();
            profiler.start();

            // First snapshot
            profiler.snapshot("start");

            // Mock increased memory usage
            vi.spyOn(process, "memoryUsage").mockReturnValue({
                rss: 120000000,
                heapTotal: 90000000,
                heapUsed: 75000000,
                external: 12000000,
                arrayBuffers: 6000000,
            });

            profiler.snapshot("end");

            const summary = profiler.getSummary();

            expect(summary.initialMemory).toBe(60000000);
            expect(summary.finalMemory).toBe(75000000);
            expect(summary.totalCost).toBe(15000000); // 75M - 60M
        });

        it("should throw error with insufficient snapshots", () => {
            const profiler = new MemoryProfiler();
            profiler.start();

            expect(() => profiler.getSummary())
                .toThrow("Not enough snapshots for summary");
        });
    });

    describe("generateReport", () => {
        it("should generate complete profile report", () => {
            const profiler = new MemoryProfiler();
            profiler.start();
            profiler.snapshot("start");
            profiler.snapshot("end");

            const graph = {nodeCount: 100, edgeCount: 200};
            const report = profiler.generateReport("TestAlgorithm", graph);

            expect(report.algorithm).toBe("TestAlgorithm");
            expect(report.graphSize).toBe(100);
            expect(report.edgeCount).toBe(200);
            expect(report.snapshots.length).toBeGreaterThanOrEqual(2);
            expect(report.summary).toBeDefined();
        });
    });

    // These tests are covered by getSummary tests above

    // MemoryProfiler doesn't have printReport method

    // profileCSRConversion is not a static method on MemoryProfiler

    // profileAlgorithm is not a static method on MemoryProfiler

    // compareProfiles is not a static method on MemoryProfiler

    // formatBytes is not a public method on MemoryProfiler
});
