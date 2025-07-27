import { TypedFastBitSet } from "typedfastbitset";

/**
 * Wrapper around TypedFastBitSet with graph-specific optimizations
 * 
 * Provides efficient bit-packed set operations optimized for graph algorithms
 * with 8x memory reduction compared to standard JavaScript Set for boolean values.
 */
export class GraphBitSet {
  private bitset: TypedFastBitSet;
  private _cardinality: number = 0;
  
  constructor(capacity?: number) {
    this.bitset = new TypedFastBitSet();
    if (capacity) {
      // Pre-allocate for known size
      this.bitset.resize(capacity);
    }
  }
  
  /**
   * Add a single element
   */
  add(index: number): void {
    if (!this.bitset.has(index)) {
      this.bitset.add(index);
      this._cardinality++;
    }
  }
  
  /**
   * Remove a single element
   */
  remove(index: number): void {
    if (this.bitset.has(index)) {
      this.bitset.remove(index);
      this._cardinality--;
    }
  }
  
  /**
   * Check if element exists
   */
  has(index: number): boolean {
    return this.bitset.has(index);
  }
  
  /**
   * Clear all elements
   */
  clear(): void {
    this.bitset.clear();
    this._cardinality = 0;
  }
  
  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this._cardinality === 0;
  }
  
  /**
   * Optimized for graph algorithms - add range of indices
   */
  addRange(start: number, end: number): void {
    for (let i = start; i < end; i++) {
      if (!this.bitset.has(i)) {
        this.bitset.add(i);
        this._cardinality++;
      }
    }
  }
  
  /**
   * Fast cardinality tracking
   */
  size(): number {
    return this._cardinality;
  }
  
  /**
   * Batch operations for frontier management - swap contents
   */
  swap(other: GraphBitSet): void {
    [this.bitset, other.bitset] = [other.bitset, this.bitset];
    [this._cardinality, other._cardinality] = [other._cardinality, this._cardinality];
  }
  
  /**
   * Efficient iteration
   */
  *[Symbol.iterator](): Generator<number> {
    // Use TypedFastBitSet's optimized iteration
    yield* this.bitset;
  }
  
  /**
   * Set operations with cardinality tracking
   */
  union(other: GraphBitSet): void {
    const result = this.bitset.union(other.bitset);
    if (result !== undefined) {
      this.bitset = result;
    }
    const size = this.bitset.size();
    this._cardinality = size ?? 0;
  }
  
  intersection(other: GraphBitSet): void {
    const result = this.bitset.intersection(other.bitset);
    if (result !== undefined) {
      this.bitset = result;
    }
    const size = this.bitset.size();
    this._cardinality = size ?? 0;
  }
  
  difference(other: GraphBitSet): void {
    const result = this.bitset.difference(other.bitset);
    if (result !== undefined) {
      this.bitset = result;
    }
    const size = this.bitset.size();
    this._cardinality = size ?? 0;
  }
  
  /**
   * Clone the bitset
   */
  clone(): GraphBitSet {
    const cloned = new GraphBitSet();
    const clonedBitset = this.bitset.clone();
    if (clonedBitset !== undefined) {
      cloned.bitset = clonedBitset;
    }
    cloned._cardinality = this._cardinality;
    return cloned;
  }
}

/**
 * Specialized bit array for visited tracking
 * 
 * More memory efficient than GraphBitSet for simple boolean arrays
 * that don't need set operations.
 */
export class VisitedBitArray {
  private words: Uint32Array;
  private wordCount: number;
  private _size: number;
  
  constructor(size: number) {
    this._size = size;
    this.wordCount = Math.ceil(size / 32);
    this.words = new Uint32Array(this.wordCount);
  }
  
  /**
   * Set bit at index
   */
  set(index: number): void {
    if (index < 0 || index >= this._size) {
      throw new Error(`Index ${index} out of bounds [0, ${this._size})`);
    }
    const wordIndex = index >>> 5;  // divide by 32
    const bitIndex = index & 31;     // modulo 32
    const word = this.words[wordIndex];
    if (word !== undefined) {
      this.words[wordIndex] = word | (1 << bitIndex);
    }
  }
  
  /**
   * Get bit at index
   */
  get(index: number): boolean {
    if (index < 0 || index >= this._size) {
      return false;
    }
    const wordIndex = index >>> 5;
    const bitIndex = index & 31;
    const word = this.words[wordIndex];
    return word !== undefined && (word & (1 << bitIndex)) !== 0;
  }
  
  /**
   * Clear all bits
   */
  clear(): void {
    this.words.fill(0);
  }
  
  /**
   * Toggle bit at index
   */
  toggle(index: number): void {
    if (index < 0 || index >= this._size) {
      throw new Error(`Index ${index} out of bounds [0, ${this._size})`);
    }
    const wordIndex = index >>> 5;
    const bitIndex = index & 31;
    const word = this.words[wordIndex];
    if (word !== undefined) {
      this.words[wordIndex] = word ^ (1 << bitIndex);
    }
  }
  
  /**
   * Population count for statistics
   */
  popcount(): number {
    let count = 0;
    for (let i = 0; i < this.wordCount; i++) {
      const word = this.words[i];
      if (word !== undefined) {
        count += this.popcountWord(word);
      }
    }
    return count;
  }
  
  /**
   * Efficient population count for a single word
   * Uses bit manipulation tricks for fast counting
   */
  private popcountWord(n: number): number {
    let x = n;
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0xF0F0F0F) * 0x1010101) >>> 24;
  }
  
  /**
   * Get size of the bit array
   */
  size(): number {
    return this._size;
  }
  
  /**
   * Check if all bits are zero
   */
  isEmpty(): boolean {
    for (let i = 0; i < this.wordCount; i++) {
      if (this.words[i] !== 0) return false;
    }
    return true;
  }
  
  /**
   * Set multiple bits from array
   */
  setMultiple(indices: number[]): void {
    for (const index of indices) {
      this.set(index);
    }
  }
  
  /**
   * Get indices of all set bits
   */
  getSetIndices(): number[] {
    const indices: number[] = [];
    for (let wordIndex = 0; wordIndex < this.wordCount; wordIndex++) {
      const word = this.words[wordIndex];
      if (!word || word === 0) continue;
      
      for (let bitIndex = 0; bitIndex < 32; bitIndex++) {
        if (word & (1 << bitIndex)) {
          const index = (wordIndex << 5) + bitIndex;
          if (index < this._size) {
            indices.push(index);
          }
        }
      }
    }
    return indices;
  }
}

/**
 * Bit-packed distance array for BFS
 * 
 * Optimized for storing distances using 16-bit integers (up to 65,535 levels)
 * Still provides 2x memory savings compared to standard 32-bit numbers
 */
export class CompactDistanceArray {
  private data: Uint16Array;
  private _size: number;
  private static readonly INFINITY = 65535;
  
  constructor(size: number) {
    this._size = size;
    this.data = new Uint16Array(size);
    this.data.fill(CompactDistanceArray.INFINITY); // Initialize with max value (unvisited)
  }
  
  /**
   * Set distance at index
   */
  set(index: number, distance: number): void {
    if (distance >= CompactDistanceArray.INFINITY) {
      throw new Error(`Distance exceeds maximum value (${CompactDistanceArray.INFINITY - 1})`);
    }
    this.data[index] = distance;
  }
  
  /**
   * Get distance at index
   */
  get(index: number): number {
    const value = this.data[index];
    return value ?? CompactDistanceArray.INFINITY;  // Default to unvisited
  }
  
  /**
   * Check if node has been visited
   */
  isVisited(index: number): boolean {
    return this.data[index] !== CompactDistanceArray.INFINITY;
  }
  
  /**
   * Reset all distances
   */
  clear(): void {
    this.data.fill(CompactDistanceArray.INFINITY);
  }
  
  /**
   * Get size
   */
  size(): number {
    return this._size;
  }
}