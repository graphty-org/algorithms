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
