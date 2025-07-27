import {describe, expect, it} from "vitest";

import {SeededRandom} from "../../../src/utils/math-utilities.js";

describe("SeededRandom", () => {
    it("should produce deterministic values", () => {
        const rng1 = new SeededRandom(42);
        const rng2 = new SeededRandom(42);

        for (let i = 0; i < 100; i++) {
            expect(rng1.next()).toBe(rng2.next());
        }
    });

    it("should produce values between 0 and 1", () => {
        const rng = new SeededRandom(12345);
        for (let i = 0; i < 1000; i++) {
            const value = rng.next();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
        }
    });

    it("should match legacy implementation", () => {
        // Test against known values from existing implementation
        const generator = SeededRandom.createGenerator(42);
        expect(generator()).toBeCloseTo(0.5823075899771916, 8);
        expect(generator()).toBeCloseTo(0.5198186638391664, 8);
    });

    it("should produce different sequences with different seeds", () => {
        const rng1 = new SeededRandom(42);
        const rng2 = new SeededRandom(43);

        const values1 = Array.from({length: 10}, () => rng1.next());
        const values2 = Array.from({length: 10}, () => rng2.next());

        // At least some values should be different
        const differentCount = values1.filter((v, i) => v !== values2[i]).length;
        expect(differentCount).toBeGreaterThan(0);
    });

    it("should handle edge case seeds", () => {
        const seeds = [0, 1, -1, 2147483647, -2147483648, Number.MAX_SAFE_INTEGER];

        for (const seed of seeds) {
            const rng = new SeededRandom(seed);
            const value = rng.next();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
        }
    });

    it("should maintain compatibility through createGenerator", () => {
        const generator1 = SeededRandom.createGenerator(42);
        const generator2 = SeededRandom.createGenerator(42);

        for (let i = 0; i < 10; i++) {
            expect(generator1()).toBe(generator2());
        }
    });
});
