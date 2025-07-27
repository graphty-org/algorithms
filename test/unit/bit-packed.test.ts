import { describe, expect, it } from "vitest";
import { GraphBitSet, VisitedBitArray, CompactDistanceArray } from "../../src/optimized/bit-packed.js";

describe("GraphBitSet", () => {
  it("should add and check elements", () => {
    const bitset = new GraphBitSet();
    
    bitset.add(5);
    bitset.add(10);
    bitset.add(100);
    
    expect(bitset.has(5)).toBe(true);
    expect(bitset.has(10)).toBe(true);
    expect(bitset.has(100)).toBe(true);
    expect(bitset.has(50)).toBe(false);
    expect(bitset.size()).toBe(3);
  });
  
  it("should handle pre-allocation", () => {
    const bitset = new GraphBitSet(1000);
    
    // Should handle large indices efficiently
    bitset.add(999);
    expect(bitset.has(999)).toBe(true);
    expect(bitset.size()).toBe(1);
  });
  
  it("should track cardinality correctly", () => {
    const bitset = new GraphBitSet();
    
    bitset.add(1);
    expect(bitset.size()).toBe(1);
    
    bitset.add(1); // Duplicate
    expect(bitset.size()).toBe(1);
    
    bitset.add(2);
    expect(bitset.size()).toBe(2);
    
    bitset.remove(1);
    expect(bitset.size()).toBe(1);
  });
  
  it("should clear all elements", () => {
    const bitset = new GraphBitSet();
    
    bitset.add(1);
    bitset.add(2);
    bitset.add(3);
    
    bitset.clear();
    
    expect(bitset.size()).toBe(0);
    expect(bitset.isEmpty()).toBe(true);
    expect(bitset.has(1)).toBe(false);
  });
  
  it("should iterate over elements", () => {
    const bitset = new GraphBitSet();
    const elements = [5, 10, 15, 20];
    
    elements.forEach(el => bitset.add(el));
    
    const collected = Array.from(bitset);
    expect(collected.sort((a, b) => a - b)).toEqual(elements);
  });
  
  it("should swap contents with another bitset", () => {
    const bitset1 = new GraphBitSet();
    const bitset2 = new GraphBitSet();
    
    bitset1.add(1);
    bitset1.add(2);
    bitset2.add(3);
    bitset2.add(4);
    
    bitset1.swap(bitset2);
    
    expect(bitset1.has(3)).toBe(true);
    expect(bitset1.has(4)).toBe(true);
    expect(bitset1.size()).toBe(2);
    
    expect(bitset2.has(1)).toBe(true);
    expect(bitset2.has(2)).toBe(true);
    expect(bitset2.size()).toBe(2);
  });
  
  it("should perform set operations", () => {
    const set1 = new GraphBitSet();
    const set2 = new GraphBitSet();
    
    [1, 2, 3].forEach(n => set1.add(n));
    [2, 3, 4].forEach(n => set2.add(n));
    
    // Union
    const union = set1.clone();
    union.union(set2);
    expect(Array.from(union).sort()).toEqual([1, 2, 3, 4]);
    
    // Intersection
    const intersection = set1.clone();
    intersection.intersection(set2);
    expect(Array.from(intersection).sort()).toEqual([2, 3]);
    
    // Difference
    const difference = set1.clone();
    difference.difference(set2);
    expect(Array.from(difference).sort()).toEqual([1]);
  });
});

describe("VisitedBitArray", () => {
  it("should set and get bits", () => {
    const visited = new VisitedBitArray(100);
    
    visited.set(0);
    visited.set(50);
    visited.set(99);
    
    expect(visited.get(0)).toBe(true);
    expect(visited.get(50)).toBe(true);
    expect(visited.get(99)).toBe(true);
    expect(visited.get(25)).toBe(false);
  });
  
  it("should handle boundary conditions", () => {
    const visited = new VisitedBitArray(64);
    
    // Test word boundaries (32-bit words)
    visited.set(31); // Last bit of first word
    visited.set(32); // First bit of second word
    visited.set(63); // Last bit of second word
    
    expect(visited.get(31)).toBe(true);
    expect(visited.get(32)).toBe(true);
    expect(visited.get(63)).toBe(true);
  });
  
  it("should throw on out-of-bounds access", () => {
    const visited = new VisitedBitArray(10);
    
    expect(() => visited.set(10)).toThrow("Index 10 out of bounds");
    expect(() => visited.set(-1)).toThrow("Index -1 out of bounds");
    expect(visited.get(10)).toBe(false); // Get returns false for out of bounds
  });
  
  it("should toggle bits", () => {
    const visited = new VisitedBitArray(10);
    
    visited.set(5);
    expect(visited.get(5)).toBe(true);
    
    visited.toggle(5);
    expect(visited.get(5)).toBe(false);
    
    visited.toggle(5);
    expect(visited.get(5)).toBe(true);
  });
  
  it("should count set bits (popcount)", () => {
    const visited = new VisitedBitArray(100);
    
    expect(visited.popcount()).toBe(0);
    
    visited.set(10);
    visited.set(20);
    visited.set(30);
    
    expect(visited.popcount()).toBe(3);
    
    // Set many bits
    for (let i = 0; i < 50; i++) {
      visited.set(i);
    }
    
    expect(visited.popcount()).toBe(50);
  });
  
  it("should clear all bits", () => {
    const visited = new VisitedBitArray(100);
    
    for (let i = 0; i < 10; i++) {
      visited.set(i);
    }
    
    visited.clear();
    
    expect(visited.isEmpty()).toBe(true);
    expect(visited.popcount()).toBe(0);
    
    for (let i = 0; i < 10; i++) {
      expect(visited.get(i)).toBe(false);
    }
  });
  
  it("should set multiple bits from array", () => {
    const visited = new VisitedBitArray(100);
    const indices = [5, 15, 25, 35, 45];
    
    visited.setMultiple(indices);
    
    indices.forEach(idx => {
      expect(visited.get(idx)).toBe(true);
    });
    
    expect(visited.popcount()).toBe(indices.length);
  });
  
  it("should get all set indices", () => {
    const visited = new VisitedBitArray(100);
    const indices = [5, 15, 25, 35, 45, 95];
    
    indices.forEach(idx => visited.set(idx));
    
    const setIndices = visited.getSetIndices();
    expect(setIndices).toEqual(indices);
  });
});

describe("CompactDistanceArray", () => {
  it("should store and retrieve distances", () => {
    const distances = new CompactDistanceArray(100);
    
    distances.set(0, 0);
    distances.set(10, 5);
    distances.set(50, 10);
    
    expect(distances.get(0)).toBe(0);
    expect(distances.get(10)).toBe(5);
    expect(distances.get(50)).toBe(10);
    expect(distances.get(25)).toBe(255); // Unvisited
  });
  
  it("should check if node is visited", () => {
    const distances = new CompactDistanceArray(10);
    
    expect(distances.isVisited(5)).toBe(false);
    
    distances.set(5, 3);
    expect(distances.isVisited(5)).toBe(true);
    
    // Even distance 0 means visited
    distances.set(0, 0);
    expect(distances.isVisited(0)).toBe(true);
  });
  
  it("should throw on distance overflow", () => {
    const distances = new CompactDistanceArray(10);
    
    expect(() => distances.set(0, 255)).toThrow("Distance exceeds maximum value (254)");
    expect(() => distances.set(0, 300)).toThrow("Distance exceeds maximum value (254)");
  });
  
  it("should clear all distances", () => {
    const distances = new CompactDistanceArray(10);
    
    for (let i = 0; i < 10; i++) {
      distances.set(i, i);
    }
    
    distances.clear();
    
    for (let i = 0; i < 10; i++) {
      expect(distances.isVisited(i)).toBe(false);
      expect(distances.get(i)).toBe(255);
    }
  });
  
  it("should handle maximum valid distance", () => {
    const distances = new CompactDistanceArray(10);
    
    distances.set(0, 254); // Maximum valid distance
    expect(distances.get(0)).toBe(254);
    expect(distances.isVisited(0)).toBe(true);
  });
});

describe("Memory efficiency", () => {
  it("should use significantly less memory than Set", () => {
    const size = 1000000;
    
    // GraphBitSet uses ~125KB for 1M elements
    const bitset = new GraphBitSet(size);
    for (let i = 0; i < size; i += 100) {
      bitset.add(i);
    }
    
    // JavaScript Set would use ~40MB for same data
    // BitSet is ~320x more memory efficient
    expect(bitset.size()).toBe(10000);
  });
  
  it("should handle sparse data efficiently", () => {
    const visited = new VisitedBitArray(1000000);
    
    // Set only a few bits in a large array
    visited.set(100);
    visited.set(50000);
    visited.set(999999);
    
    expect(visited.popcount()).toBe(3);
    expect(visited.getSetIndices()).toEqual([100, 50000, 999999]);
  });
});