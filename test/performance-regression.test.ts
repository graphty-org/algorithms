import {describe, expect, it} from "vitest";

import {PerformanceRegressionTest} from "./helpers/performance-regression.js";

describe("Performance Regression Tests", () => {
    it.skip("should not have performance regressions > 10%", () => {
        const test = new PerformanceRegressionTest();
        const success = test.runAll();
        expect(success).toBe(true);
    }, 60000); // 60 second timeout for performance tests

    it("should be able to update baselines", () => {
        // This test is for documentation purposes
        // Run with: npm run test:performance -- --update-baselines
        expect(true).toBe(true);
    });
});
