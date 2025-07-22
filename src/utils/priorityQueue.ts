/**
 * Min Priority Queue implementation for graph algorithms
 */
export class MinPriorityQueue<T> {
    private heap: T[] = [];
    private compare: (a: T, b: T) => number;

    constructor(compareFunction?: (a: T, b: T) => number) {
        this.compare = compareFunction ?? ((a: T, b: T) => this.defaultCompare(a, b));
    }

    private defaultCompare(a: T, b: T): number {
        const aWithDistance = a as T & {distance?: number};
        const bWithDistance = b as T & {distance?: number};

        if (aWithDistance.distance !== undefined && bWithDistance.distance !== undefined) {
            return aWithDistance.distance - bWithDistance.distance;
        }

        return 0;
    }

    private parent(i: number): number {
        return Math.floor((i - 1) / 2);
    }

    private leftChild(i: number): number {
        return (2 * i) + 1;
    }

    private rightChild(i: number): number {
        return (2 * i) + 2;
    }

    private swap(i: number, j: number): void {
        const temp = this.heap[i];
        const temp2 = this.heap[j];
        if (temp !== undefined && temp2 !== undefined) {
            this.heap[i] = temp2;
            this.heap[j] = temp;
        }
    }

    private heapifyUp(index: number): void {
        while (index > 0) {
            const parentIndex = this.parent(index);
            const current = this.heap[index];
            const parent = this.heap[parentIndex];
            if (current !== undefined && parent !== undefined && this.compare(current, parent) < 0) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    private heapifyDown(index: number): void {
        while (index < this.heap.length) {
            let minIndex = index;
            const left = this.leftChild(index);
            const right = this.rightChild(index);

            const leftItem = this.heap[left];
            const minItem = this.heap[minIndex];
            if (left < this.heap.length && leftItem !== undefined && minItem !== undefined && this.compare(leftItem, minItem) < 0) {
                minIndex = left;
            }

            const rightItem = this.heap[right];
            const newMinItem = this.heap[minIndex];
            if (right < this.heap.length && rightItem !== undefined && newMinItem !== undefined && this.compare(rightItem, newMinItem) < 0) {
                minIndex = right;
            }

            if (minIndex !== index) {
                this.swap(index, minIndex);
                index = minIndex;
            } else {
                break;
            }
        }
    }

    insert(value: T): void {
        this.heap.push(value);
        this.heapifyUp(this.heap.length - 1);
    }

    extractMin(): T | undefined {
        if (this.heap.length === 0) {
            return undefined;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const min = this.heap[0];
        const last = this.heap.pop();
        if (last !== undefined) {
            this.heap[0] = last;
            this.heapifyDown(0);
        }

        return min;
    }

    peek(): T | undefined {
        return this.heap[0];
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    size(): number {
        return this.heap.length;
    }
}
