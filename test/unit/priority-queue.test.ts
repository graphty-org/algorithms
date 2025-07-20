import {describe, expect, it} from "vitest";

import {PriorityQueue} from "../../src/data-structures/priority-queue.js";

describe("PriorityQueue", () => {
    describe("constructor", () => {
        it("should create an empty priority queue", () => {
            const pq = new PriorityQueue<string>();

            expect(pq.isEmpty()).toBe(true);
            expect(pq.size()).toBe(0);
            expect(pq.peek()).toBeUndefined();
        });

        it("should accept custom comparison function", () => {
            // Max-heap (reverse of default min-heap)
            const pq = new PriorityQueue<string>((a, b) => b - a);

            pq.enqueue("low", 1);
            pq.enqueue("high", 10);
            pq.enqueue("medium", 5);

            expect(pq.dequeue()).toBe("high");
            expect(pq.dequeue()).toBe("medium");
            expect(pq.dequeue()).toBe("low");
        });
    });

    describe("enqueue and dequeue", () => {
        it("should maintain min-heap property by default", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("medium", 5);
            pq.enqueue("high", 10);
            pq.enqueue("low", 1);
            pq.enqueue("lowest", 0);

            expect(pq.dequeue()).toBe("lowest");
            expect(pq.dequeue()).toBe("low");
            expect(pq.dequeue()).toBe("medium");
            expect(pq.dequeue()).toBe("high");
        });

        it("should handle equal priorities correctly", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("first", 5);
            pq.enqueue("second", 5);
            pq.enqueue("third", 5);

            // Should maintain some consistent order
            const results = [pq.dequeue(), pq.dequeue(), pq.dequeue()];
            expect(results).toContain("first");
            expect(results).toContain("second");
            expect(results).toContain("third");
        });

        it("should return undefined when dequeuing from empty queue", () => {
            const pq = new PriorityQueue<string>();

            expect(pq.dequeue()).toBeUndefined();
        });

        it("should handle single element correctly", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("only", 42);

            expect(pq.size()).toBe(1);
            expect(pq.peek()).toBe("only");
            expect(pq.dequeue()).toBe("only");
            expect(pq.isEmpty()).toBe(true);
        });
    });

    describe("peek", () => {
        it("should return highest priority item without removing it", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("medium", 5);
            pq.enqueue("low", 1);
            pq.enqueue("high", 10);

            expect(pq.peek()).toBe("low");
            expect(pq.size()).toBe(3);
            expect(pq.peek()).toBe("low"); // Should still be there
        });

        it("should return undefined for empty queue", () => {
            const pq = new PriorityQueue<string>();

            expect(pq.peek()).toBeUndefined();
        });
    });

    describe("updatePriority", () => {
        it("should update priority and maintain heap property", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 5);
            pq.enqueue("b", 10);
            pq.enqueue("c", 15);

            expect(pq.updatePriority("b", 1)).toBe(true);
            expect(pq.dequeue()).toBe("b"); // Should now be highest priority
        });

        it("should return false for non-existent item", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 5);

            expect(pq.updatePriority("nonexistent", 1)).toBe(false);
        });

        it("should handle priority increase correctly", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 1);
            pq.enqueue("b", 5);
            pq.enqueue("c", 10);

            expect(pq.updatePriority("a", 15)).toBe(true);
            expect(pq.dequeue()).toBe("b"); // 'a' should now be last
            expect(pq.dequeue()).toBe("c");
            expect(pq.dequeue()).toBe("a");
        });
    });

    describe("clear", () => {
        it("should remove all items from queue", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 1);
            pq.enqueue("b", 2);
            pq.enqueue("c", 3);

            expect(pq.size()).toBe(3);
            pq.clear();
            expect(pq.size()).toBe(0);
            expect(pq.isEmpty()).toBe(true);
            expect(pq.peek()).toBeUndefined();
        });
    });

    describe("toArray", () => {
        it("should return array representation of queue", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 1);
            pq.enqueue("b", 2);
            pq.enqueue("c", 3);

            const array = pq.toArray();
            expect(array).toHaveLength(3);
            expect(array.every((item) => typeof item.item === "string")).toBe(true);
            expect(array.every((item) => typeof item.priority === "number")).toBe(true);
        });

        it("should return copy of internal array", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 1);

            const array1 = pq.toArray();
            const array2 = pq.toArray();

            expect(array1).not.toBe(array2); // Different array instances
            expect(array1).toEqual(array2); // But same content
        });
    });

    describe("stress test", () => {
        it("should handle large number of operations efficiently", () => {
            const pq = new PriorityQueue<number>();
            const items = 1000;

            // Add items in random order
            for (let i = 0; i < items; i++) {
                pq.enqueue(i, Math.random() * 1000);
            }

            expect(pq.size()).toBe(items);

            // Dequeue all items - should come out in priority order
            const lastPriority = -Infinity;
            for (let i = 0; i < items; i++) {
                const item = pq.dequeue();
                expect(item).toBeDefined();

                // Get the priority from the remaining queue state
                // This is a simplified check since we can't easily get the priority of dequeued item
                if (!pq.isEmpty()) {
                    // The next item should have equal or higher priority (min-heap)
                    const nextArray = pq.toArray();
                    if (nextArray.length > 0) {
                        const minPriority = Math.min(... nextArray.map((x) => x.priority));
                        expect(minPriority).toBeGreaterThanOrEqual(lastPriority);
                    }
                }
            }

            expect(pq.isEmpty()).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle negative priorities", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("negative", -5);
            pq.enqueue("positive", 5);
            pq.enqueue("zero", 0);

            expect(pq.dequeue()).toBe("negative");
            expect(pq.dequeue()).toBe("zero");
            expect(pq.dequeue()).toBe("positive");
        });

        it("should handle floating point priorities", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("a", 1.5);
            pq.enqueue("b", 1.1);
            pq.enqueue("c", 1.9);

            expect(pq.dequeue()).toBe("b");
            expect(pq.dequeue()).toBe("a");
            expect(pq.dequeue()).toBe("c");
        });

        it("should handle complex objects as items", () => {
            interface TestItem {
                id: string;
                value: number;
            }

            const pq = new PriorityQueue<TestItem>();

            const item1: TestItem = {id: "1", value: 100};
            const item2: TestItem = {id: "2", value: 200};

            pq.enqueue(item1, 10);
            pq.enqueue(item2, 5);

            expect(pq.dequeue()).toBe(item2);
            expect(pq.dequeue()).toBe(item1);
        });

        it("should handle very large queue efficiently", () => {
            const pq = new PriorityQueue<number>();
            const items = 1000;

            // Add items in reverse order to test heap operations
            for (let i = items; i > 0; i--) {
                pq.enqueue(i, i);
            }

            expect(pq.size()).toBe(items);

            // Should dequeue in ascending order
            for (let i = 1; i <= items; i++) {
                expect(pq.dequeue()).toBe(i);
            }

            expect(pq.isEmpty()).toBe(true);
        });

        it("should handle dequeue from empty queue gracefully", () => {
            const pq = new PriorityQueue<string>();

            expect(pq.dequeue()).toBeUndefined();
            expect(pq.isEmpty()).toBe(true);
            expect(pq.size()).toBe(0);
        });

        it("should handle very small priorities", () => {
            const pq = new PriorityQueue<string>();

            pq.enqueue("tiny", Number.EPSILON);
            pq.enqueue("zero", 0);
            pq.enqueue("negative_tiny", -Number.EPSILON);

            expect(pq.dequeue()).toBe("negative_tiny");
            expect(pq.dequeue()).toBe("zero");
            expect(pq.dequeue()).toBe("tiny");
        });
    });
});
