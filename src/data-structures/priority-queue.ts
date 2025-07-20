/**
 * Priority Queue implementation using a binary heap
 *
 * Optimized for graph algorithms requiring efficient priority-based operations.
 * Uses a min-heap by default but supports custom comparison functions.
 */
export class PriorityQueue<T> {
    private heap: {item: T, priority: number}[];
    private compareFn: (a: number, b: number) => number;

    constructor(compareFn?: (a: number, b: number) => number) {
        this.heap = [];
        // Default to min-heap (smaller priority values have higher priority)
        this.compareFn = compareFn ?? ((a, b) => a - b);
    }

    /**
     * Add an item with the given priority to the queue
     */
    enqueue(item: T, priority: number): void {
        const element = {item, priority};
        this.heap.push(element);
        this.heapifyUp(this.heap.length - 1);
    }

    /**
     * Remove and return the item with the highest priority
     */
    dequeue(): T | undefined {
        if (this.heap.length === 0) {
            return undefined;
        }

        if (this.heap.length === 1) {
            return this.heap.pop()?.item;
        }

        const root = this.heap[0];
        const lastElement = this.heap.pop();

        if (lastElement) {
            this.heap[0] = lastElement;
            this.heapifyDown(0);
        }

        return root.item;
    }

    /**
     * View the item with the highest priority without removing it
     */
    peek(): T | undefined {
        return this.heap.length > 0 ? this.heap[0].item : undefined;
    }

    /**
     * Check if the queue is empty
     */
    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    /**
     * Get the number of items in the queue
     */
    size(): number {
        return this.heap.length;
    }

    /**
     * Update the priority of an item if it exists in the queue
     * Returns true if the item was found and updated
     */
    updatePriority(item: T, newPriority: number): boolean {
        const index = this.heap.findIndex((element) => element.item === item);

        if (index === -1) {
            return false;
        }

        const oldPriority = this.heap[index].priority;
        this.heap[index].priority = newPriority;

        // Determine whether to heapify up or down based on priority change
        if (this.compareFn(newPriority, oldPriority) < 0) {
            this.heapifyUp(index);
        } else if (this.compareFn(newPriority, oldPriority) > 0) {
            this.heapifyDown(index);
        }

        return true;
    }

    /**
     * Clear all items from the queue
     */
    clear(): void {
        this.heap = [];
    }

    /**
     * Convert queue to array (for testing/debugging)
     */
    toArray(): {item: T, priority: number}[] {
        return [... this.heap];
    }

    /**
     * Move element up the heap until heap property is satisfied
     */
    private heapifyUp(index: number): void {
        if (index === 0) {
            return;
        }

        const parentIndex = Math.floor((index - 1) / 2);

        if (this.compareFn(this.heap[index].priority, this.heap[parentIndex].priority) < 0) {
            this.swap(index, parentIndex);
            this.heapifyUp(parentIndex);
        }
    }

    /**
     * Move element down the heap until heap property is satisfied
     */
    private heapifyDown(index: number): void {
        const leftChildIndex = (2 * index) + 1;
        const rightChildIndex = (2 * index) + 2;
        let targetIndex = index;

        // Find the child with highest priority (lowest value for min-heap)
        if (leftChildIndex < this.heap.length &&
            this.compareFn(this.heap[leftChildIndex].priority, this.heap[targetIndex].priority) < 0) {
            targetIndex = leftChildIndex;
        }

        if (rightChildIndex < this.heap.length &&
            this.compareFn(this.heap[rightChildIndex].priority, this.heap[targetIndex].priority) < 0) {
            targetIndex = rightChildIndex;
        }

        // If we found a child with higher priority, swap and continue
        if (targetIndex !== index) {
            this.swap(index, targetIndex);
            this.heapifyDown(targetIndex);
        }
    }

    /**
     * Swap two elements in the heap
     */
    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}
