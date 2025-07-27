/**
 * Seeded random number generator for reproducible results
 */
export class SeededRandom {
    private seed: number;
    private readonly m = 0x80000000; // 2**31
    private readonly a = 1103515245;
    private readonly c = 12345;

    constructor(seed: number) {
        // Handle negative seeds correctly
        this.seed = ((seed % this.m) + this.m) % this.m;
    }

    /**
     * Generate next random number between 0 and 1
     */
    next(): number {
        this.seed = ((this.a * this.seed) + this.c) % this.m;
        return this.seed / (this.m - 1);
    }

    /**
     * Create a generator function for backward compatibility
     */
    static createGenerator(seed: number): () => number {
        const rng = new SeededRandom(seed);
        return () => rng.next();
    }
}

/**
 * Fisher-Yates shuffle algorithm
 * @param array - Array to shuffle (will be modified in place)
 * @param rng - Optional random number generator (defaults to Math.random)
 * @returns The shuffled array (same reference as input)
 */
export function shuffle<T>(array: T[], rng: () => number = Math.random): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = array[i];
        const tempJ = array[j];
        if (temp !== undefined && tempJ !== undefined) {
            array[i] = tempJ;
            array[j] = temp;
        }
    }
    return array;
}

/**
 * Calculate Euclidean distance between two vectors
 * @param a - First vector
 * @param b - Second vector
 * @returns Euclidean distance
 * @throws Error if vectors have different lengths
 */
export function euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error("Vectors must have same length");
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const aVal = a[i];
        const bVal = b[i];
        if (aVal !== undefined && bVal !== undefined) {
            const diff = aVal - bVal;
            sum += diff * diff;
        }
    }
    return Math.sqrt(sum);
}

export const normalize = {
    /**
     * Min-max normalization to [0, 1] range
     */
    minMax(values: Map<string, number>): void {
        const vals = Array.from(values.values());
        const min = Math.min(... vals);
        const max = Math.max(... vals);
        const range = max - min;

        if (range === 0) {
            return;
        }

        for (const [key, value] of values) {
            values.set(key, (value - min) / range);
        }
    },

    /**
     * Normalize by maximum value
     */
    byMax(values: Map<string, number>): void {
        const max = Math.max(... values.values());
        if (max === 0) {
            return;
        }

        for (const [key, value] of values) {
            values.set(key, value / max);
        }
    },

    /**
     * L2 (Euclidean) normalization
     */
    l2Norm(values: Map<string, number>): void {
        const sumSquares = Array.from(values.values())
            .reduce((sum, val) => sum + (val * val), 0);
        const norm = Math.sqrt(sumSquares);

        if (norm === 0) {
            return;
        }

        for (const [key, value] of values) {
            values.set(key, value / norm);
        }
    },

    /**
     * Normalize to sum to 1
     */
    sumToOne(values: Map<string, number>): void {
        const sum = Array.from(values.values())
            .reduce((acc, val) => acc + val, 0);

        if (sum === 0) {
            return;
        }

        for (const [key, value] of values) {
            values.set(key, value / sum);
        }
    },
};
