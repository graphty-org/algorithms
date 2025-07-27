import {describe, expect, it} from "vitest";

import {euclideanDistance, normalize, SeededRandom, shuffle} from "../../../src/utils/math-utilities.js";

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

describe("shuffle", () => {
    it("should shuffle array in place", () => {
        const arr = [1, 2, 3, 4, 5];
        const original = [... arr];
        const shuffled = shuffle(arr);

        expect(shuffled).toBe(arr); // Same reference
        expect(shuffled.sort()).toEqual(original.sort()); // Same elements
    });

    it("should be deterministic with seeded RNG", () => {
        const arr1 = [1, 2, 3, 4, 5];
        const arr2 = [1, 2, 3, 4, 5];

        const rng1 = SeededRandom.createGenerator(42);
        const rng2 = SeededRandom.createGenerator(42);

        shuffle(arr1, rng1);
        shuffle(arr2, rng2);

        expect(arr1).toEqual(arr2);
    });

    it("should handle empty array", () => {
        const arr: number[] = [];
        const shuffled = shuffle(arr);
        expect(shuffled).toEqual([]);
    });

    it("should handle single element array", () => {
        const arr = [42];
        const shuffled = shuffle(arr);
        expect(shuffled).toEqual([42]);
    });

    it("should handle array with undefined values", () => {
        const arr = [1, undefined, 3, undefined, 5];
        const original = [... arr];
        shuffle(arr);

        // Check all elements are preserved
        expect(arr.length).toBe(original.length);
        expect(arr.filter((x) => x !== undefined).sort()).toEqual(original.filter((x) => x !== undefined).sort());
    });

    it("should produce different results with different RNG values", () => {
        const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const arr2 = [... arr1];

        const rng1 = SeededRandom.createGenerator(42);
        const rng2 = SeededRandom.createGenerator(123);

        shuffle(arr1, rng1);
        shuffle(arr2, rng2);

        // Arrays should be different (with high probability)
        expect(arr1).not.toEqual(arr2);
    });
});

describe("euclideanDistance", () => {
    it("should calculate distance between 2D vectors", () => {
        expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
        expect(euclideanDistance([1, 1], [4, 5])).toBe(5);
    });

    it("should calculate distance between 3D vectors", () => {
        expect(euclideanDistance([0, 0, 0], [2, 3, 6])).toBe(7);
        expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBe(0);
    });

    it("should handle single dimension vectors", () => {
        expect(euclideanDistance([5], [8])).toBe(3);
        expect(euclideanDistance([10], [10])).toBe(0);
    });

    it("should handle negative coordinates", () => {
        expect(euclideanDistance([-1, -1], [2, 3])).toBe(5);
        expect(euclideanDistance([-3, -4], [0, 0])).toBe(5);
    });

    it("should throw error for vectors of different lengths", () => {
        expect(() => euclideanDistance([1, 2], [1, 2, 3])).toThrow("Vectors must have same length");
        expect(() => euclideanDistance([1], [])).toThrow("Vectors must have same length");
    });

    it("should handle empty vectors", () => {
        expect(euclideanDistance([], [])).toBe(0);
    });

    it("should handle vectors with undefined values", () => {
        const a = [1, undefined, 3] as number[];
        const b = [4, undefined, 7] as number[];
        // Should skip undefined values and calculate sqrt((4-1)^2 + (7-3)^2) = sqrt(9 + 16) = 5
        expect(euclideanDistance(a, b)).toBe(5);
    });

    it("should handle floating point values", () => {
        expect(euclideanDistance([1.5, 2.5], [4.5, 6.5])).toBe(5);
        expect(euclideanDistance([0.1, 0.2], [0.3, 0.4])).toBeCloseTo(Math.sqrt(0.08), 10);
    });
});

describe("normalize", () => {
    describe("minMax", () => {
        it("should normalize values to [0, 1] range", () => {
            const values = new Map([["a", 10], ["b", 20], ["c", 30]]);
            normalize.minMax(values);
            expect(values.get("a")).toBe(0);
            expect(values.get("b")).toBe(0.5);
            expect(values.get("c")).toBe(1);
        });

        it("should handle all equal values", () => {
            const values = new Map([["a", 5], ["b", 5], ["c", 5]]);
            normalize.minMax(values);
            expect(values.get("a")).toBe(5);
            expect(values.get("b")).toBe(5);
            expect(values.get("c")).toBe(5);
        });

        it("should handle negative values", () => {
            const values = new Map([["a", -10], ["b", 0], ["c", 10]]);
            normalize.minMax(values);
            expect(values.get("a")).toBe(0);
            expect(values.get("b")).toBe(0.5);
            expect(values.get("c")).toBe(1);
        });

        it("should handle empty map", () => {
            const values = new Map<string, number>();
            normalize.minMax(values);
            expect(values.size).toBe(0);
        });
    });

    describe("byMax", () => {
        it("should normalize by maximum value", () => {
            const values = new Map([["a", 10], ["b", 20], ["c", 40]]);
            normalize.byMax(values);
            expect(values.get("a")).toBe(0.25);
            expect(values.get("b")).toBe(0.5);
            expect(values.get("c")).toBe(1);
        });

        it("should handle all zeros", () => {
            const values = new Map([["a", 0], ["b", 0], ["c", 0]]);
            normalize.byMax(values);
            expect(values.get("a")).toBe(0);
            expect(values.get("b")).toBe(0);
            expect(values.get("c")).toBe(0);
        });

        it("should handle negative values", () => {
            const values = new Map([["a", -10], ["b", -5], ["c", -20]]);
            normalize.byMax(values);
            // When all values are negative, max is -5, so:
            // -10 / -5 = 2
            // -5 / -5 = 1
            // -20 / -5 = 4
            expect(values.get("a")).toBe(2);
            expect(values.get("b")).toBe(1);
            expect(values.get("c")).toBe(4);
        });
    });

    describe("l2Norm", () => {
        it("should perform L2 normalization", () => {
            const values = new Map([["a", 3], ["b", 4]]);
            normalize.l2Norm(values);
            expect(values.get("a")).toBeCloseTo(0.6, 10);
            expect(values.get("b")).toBeCloseTo(0.8, 10);
        });

        it("should handle single value", () => {
            const values = new Map([["a", 5]]);
            normalize.l2Norm(values);
            expect(values.get("a")).toBe(1);
        });

        it("should handle all zeros", () => {
            const values = new Map([["a", 0], ["b", 0]]);
            normalize.l2Norm(values);
            expect(values.get("a")).toBe(0);
            expect(values.get("b")).toBe(0);
        });

        it("should normalize to unit length", () => {
            const values = new Map([["a", 1], ["b", 2], ["c", 2]]);
            normalize.l2Norm(values);
            const sumSquares = Array.from(values.values())
                .reduce((sum, val) => sum + (val * val), 0);
            expect(sumSquares).toBeCloseTo(1, 10);
        });
    });

    describe("sumToOne", () => {
        it("should normalize values to sum to 1", () => {
            const values = new Map([["a", 10], ["b", 20], ["c", 30]]);
            normalize.sumToOne(values);
            expect(values.get("a")).toBeCloseTo(1 / 6, 10);
            expect(values.get("b")).toBeCloseTo(2 / 6, 10);
            expect(values.get("c")).toBeCloseTo(3 / 6, 10);

            const sum = Array.from(values.values()).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 10);
        });

        it("should handle negative values", () => {
            const values = new Map([["a", -10], ["b", 20], ["c", 30]]);
            normalize.sumToOne(values);
            const sum = Array.from(values.values()).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1, 10);
        });

        it("should handle all zeros", () => {
            const values = new Map([["a", 0], ["b", 0]]);
            normalize.sumToOne(values);
            expect(values.get("a")).toBe(0);
            expect(values.get("b")).toBe(0);
        });
    });
});
