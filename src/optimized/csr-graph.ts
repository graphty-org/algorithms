import type { NodeId } from "../types/index.js";

/**
 * Interface for read-only graph operations
 */
export interface ReadonlyGraph<TNodeId = NodeId> {
  nodeCount(): number;
  edgeCount(): number;
  hasNode(nodeId: TNodeId): boolean;
  hasEdge(source: TNodeId, target: TNodeId): boolean;
  neighbors(nodeId: TNodeId): IterableIterator<TNodeId>;
  outDegree(nodeId: TNodeId): number;
  nodes(): IterableIterator<TNodeId>;
}

/**
 * Internal data structure for CSR representation
 */
interface CSRGraphData<TNodeId> {
  // Row pointers: indices where each node's edges start
  rowPointers: Uint32Array;
  
  // Column indices: destination nodes for each edge
  columnIndices: Uint32Array;
  
  // Edge weights (optional)
  edgeWeights?: Float32Array;
  
  // Reverse edges for bottom-up BFS (optional)
  reverseRowPointers?: Uint32Array;
  reverseColumnIndices?: Uint32Array;
  
  // Node ID mapping
  nodeIdToIndex: Map<TNodeId, number>;
  indexToNodeId: TNodeId[];
}

/**
 * Compressed Sparse Row (CSR) graph representation
 * 
 * Provides cache-efficient graph storage with sequential memory access patterns.
 * Optimized for traversal operations and sparse graphs.
 */
export class CSRGraph<TNodeId = NodeId> implements ReadonlyGraph<TNodeId> {
  private data: CSRGraphData<TNodeId>;
  
  constructor(adjacencyList: Map<TNodeId, TNodeId[]>, weights?: Map<string, number>, buildReverse = true) {
    this.data = this.buildCSR(adjacencyList, weights, buildReverse);
  }
  
  /**
   * Build CSR structure from adjacency list
   */
  private buildCSR(
    adjacencyList: Map<TNodeId, TNodeId[]>,
    weights?: Map<string, number>,
    buildReverse = true
  ): CSRGraphData<TNodeId> {
    // Collect all unique nodes (both sources and targets)
    const allNodes = new Set<TNodeId>();
    for (const [source, neighbors] of adjacencyList) {
      allNodes.add(source);
      for (const neighbor of neighbors) {
        allNodes.add(neighbor);
      }
    }
    
    // Sort nodes for consistent ordering (helps with testing and debugging)
    const nodes = Array.from(allNodes).sort((a, b) => {
      // Try to sort numerically if possible, otherwise use string comparison
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      return String(a).localeCompare(String(b));
    });
    const nodeCount = nodes.length;
    
    // Build node mappings
    const nodeIdToIndex = new Map<TNodeId, number>();
    const indexToNodeId: TNodeId[] = [];
    
    nodes.forEach((nodeId, index) => {
      nodeIdToIndex.set(nodeId, index);
      indexToNodeId[index] = nodeId;
    });
    
    // Count total edges
    let edgeCount = 0;
    for (const neighbors of adjacencyList.values()) {
      edgeCount += neighbors.length;
    }
    
    // Allocate arrays
    const rowPointers = new Uint32Array(nodeCount + 1);
    const columnIndices = new Uint32Array(edgeCount);
    const edgeWeights = weights ? new Float32Array(edgeCount) : undefined;
    
    // Build CSR structure
    let currentEdge = 0;
    for (let i = 0; i < nodeCount; i++) {
      rowPointers[i] = currentEdge;
      const nodeId = indexToNodeId[i];
      if (nodeId === undefined) {
        throw new Error(`Invalid node index ${i}`);
      }
      const neighbors = adjacencyList.get(nodeId) || [];
      
      // Sort neighbors for better cache locality and binary search
      const sortedNeighbors = neighbors
        .map(n => ({ id: n, index: nodeIdToIndex.get(n)! }))
        .sort((a, b) => a.index - b.index);
      
      for (const neighbor of sortedNeighbors) {
        columnIndices[currentEdge] = neighbor.index;
        
        if (edgeWeights && weights) {
          const edgeKey = `${String(nodeId)}-${String(neighbor.id)}`;
          const weight = weights.get(edgeKey);
          if (weight !== undefined) {
            edgeWeights[currentEdge] = weight;
          } else {
            edgeWeights[currentEdge] = 1;
          }
        }
        
        currentEdge++;
      }
    }
    rowPointers[nodeCount] = currentEdge;
    
    const result: CSRGraphData<TNodeId> = {
      rowPointers,
      columnIndices,
      nodeIdToIndex,
      indexToNodeId
    };
    
    if (edgeWeights) {
      result.edgeWeights = edgeWeights;
    }
    
    // Build reverse edges for bottom-up BFS
    if (buildReverse) {
      const reverseAdjacency = new Map<number, number[]>();
      for (let i = 0; i < nodeCount; i++) {
        reverseAdjacency.set(i, []);
      }
      
      // Build reverse adjacency from forward edges
      for (let i = 0; i < nodeCount; i++) {
        const start = rowPointers[i];
        const end = rowPointers[i + 1];
        if (start !== undefined && end !== undefined) {
          for (let j = start; j < end; j++) {
            const target = columnIndices[j];
            if (target !== undefined) {
              reverseAdjacency.get(target)?.push(i);
            }
          }
        }
      }
      
      // Build reverse CSR
      const reverseRowPointers = new Uint32Array(nodeCount + 1);
      const reverseColumnIndices = new Uint32Array(edgeCount);
      
      let reverseEdge = 0;
      for (let i = 0; i < nodeCount; i++) {
        reverseRowPointers[i] = reverseEdge;
        const incoming = reverseAdjacency.get(i) || [];
        incoming.sort((a, b) => a - b);
        
        for (const source of incoming) {
          reverseColumnIndices[reverseEdge++] = source;
        }
      }
      reverseRowPointers[nodeCount] = reverseEdge;
      
      result.reverseRowPointers = reverseRowPointers;
      result.reverseColumnIndices = reverseColumnIndices;
    }
    
    return result;
  }
  
  // Core API methods
  nodeCount(): number {
    return this.data.indexToNodeId.length;
  }
  
  edgeCount(): number {
    return this.data.columnIndices.length;
  }
  
  hasNode(nodeId: TNodeId): boolean {
    return this.data.nodeIdToIndex.has(nodeId);
  }
  
  hasEdge(source: TNodeId, target: TNodeId): boolean {
    const sourceIndex = this.data.nodeIdToIndex.get(source);
    const targetIndex = this.data.nodeIdToIndex.get(target);
    
    if (sourceIndex === undefined || targetIndex === undefined) {
      return false;
    }
    
    const start = this.data.rowPointers[sourceIndex];
    const end = this.data.rowPointers[sourceIndex + 1];
    
    // Binary search for target in sorted neighbors
    if (targetIndex === undefined || start === undefined || end === undefined) {
      return false;
    }
    return this.binarySearch(this.data.columnIndices, targetIndex, start, end) !== -1;
  }
  
  /**
   * Get neighbors as node IDs
   */
  neighbors(nodeId: TNodeId): IterableIterator<TNodeId> {
    const nodeIndex = this.data.nodeIdToIndex.get(nodeId);
    if (nodeIndex === undefined) {
      return new Set<TNodeId>().values();
    }
    
    const self = this;
    function* generateNeighbors(): Generator<TNodeId> {
      const start = self.data.rowPointers[nodeIndex!];
      const end = self.data.rowPointers[nodeIndex! + 1];
      
      if (start !== undefined && end !== undefined) {
        for (let i = start; i < end; i++) {
          const idx = self.data.columnIndices[i];
          if (idx !== undefined) {
            const nodeId = self.data.indexToNodeId[idx];
            if (nodeId !== undefined) {
              yield nodeId;
            }
          }
        }
      }
    }
    
    return generateNeighbors();
  }
  
  /**
   * Get all nodes
   */
  nodes(): IterableIterator<TNodeId> {
    return this.data.indexToNodeId.values();
  }
  
  /**
   * Get neighbors as indices (internal use)
   */
  getNeighborIndices(nodeIndex: number): number[] {
    if (nodeIndex < 0 || nodeIndex >= this.data.indexToNodeId.length) {
      return [];
    }
    const start = this.data.rowPointers[nodeIndex];
    const end = this.data.rowPointers[nodeIndex + 1];
    if (start === undefined || end === undefined) {
      return [];
    }
    return Array.from(this.data.columnIndices.subarray(start, end));
  }
  
  outDegree(nodeId: TNodeId): number {
    const nodeIndex = this.data.nodeIdToIndex.get(nodeId);
    if (nodeIndex === undefined) {
      return 0;
    }
    return this.outDegreeByIndex(nodeIndex);
  }
  
  /**
   * Get out-degree by index (internal use)
   */
  outDegreeByIndex(nodeIndex: number): number {
    const start = this.data.rowPointers[nodeIndex];
    const end = this.data.rowPointers[nodeIndex + 1];
    if (start !== undefined && end !== undefined) {
      return end - start;
    }
    return 0;
  }
  
  /**
   * Iterator support for neighbor indices
   */
  *iterateNeighborIndices(nodeIndex: number): Generator<number> {
    const start = this.data.rowPointers[nodeIndex];
    const end = this.data.rowPointers[nodeIndex + 1];
    
    if (start !== undefined && end !== undefined) {
      for (let i = start; i < end; i++) {
        const value = this.data.columnIndices[i];
        if (value !== undefined) {
          yield value;
        }
      }
    }
  }
  
  /**
   * Iterator support for incoming neighbor indices (for bottom-up BFS)
   */
  *iterateIncomingNeighborIndices(nodeIndex: number): Generator<number> {
    if (!this.data.reverseRowPointers || !this.data.reverseColumnIndices) {
      return;
    }
    
    const start = this.data.reverseRowPointers[nodeIndex];
    const end = this.data.reverseRowPointers[nodeIndex + 1];
    
    if (start !== undefined && end !== undefined) {
      for (let i = start; i < end; i++) {
        const value = this.data.reverseColumnIndices[i];
        if (value !== undefined) {
          yield value;
        }
      }
    }
  }
  
  /**
   * Convert node ID to index
   */
  nodeToIndex(nodeId: TNodeId): number {
    const index = this.data.nodeIdToIndex.get(nodeId);
    if (index === undefined) {
      throw new Error(`Node ${String(nodeId)} not found in graph`);
    }
    return index;
  }
  
  /**
   * Convert index to node ID
   */
  indexToNodeId(index: number): TNodeId {
    const nodeId = this.data.indexToNodeId[index];
    if (nodeId === undefined) {
      throw new Error(`Index ${index} out of bounds`);
    }
    return nodeId;
  }
  
  /**
   * Get edge weight
   */
  getEdgeWeight(source: TNodeId, target: TNodeId): number | undefined {
    if (!this.data.edgeWeights) {
      return undefined;
    }
    
    const sourceIndex = this.data.nodeIdToIndex.get(source);
    const targetIndex = this.data.nodeIdToIndex.get(target);
    
    if (sourceIndex === undefined || targetIndex === undefined) {
      return undefined;
    }
    
    const start = this.data.rowPointers[sourceIndex];
    const end = this.data.rowPointers[sourceIndex + 1];
    
    if (targetIndex === undefined || start === undefined || end === undefined) {
      return undefined;
    }
    const edgeIndex = this.binarySearch(this.data.columnIndices, targetIndex, start, end);
    if (edgeIndex === -1) {
      return undefined;
    }
    
    return this.data.edgeWeights[edgeIndex];
  }
  
  /**
   * Binary search for target in sorted array
   */
  private binarySearch(arr: Uint32Array, target: number, start: number, end: number): number {
    let left = start;
    let right = end - 1;
    
    while (left <= right) {
      const mid = (left + right) >>> 1;
      const value = arr[mid];
      
      if (value === undefined) return -1;
      if (value === target) return mid;
      if (value < target) left = mid + 1;
      else right = mid - 1;
    }
    
    return -1;
  }
  
  /**
   * Create CSR graph from standard Graph
   */
  static fromGraph<TNodeId = NodeId>(graph: {
    nodes(): IterableIterator<{ id: TNodeId }>;
    neighbors(nodeId: TNodeId): IterableIterator<TNodeId>;
    hasNode(nodeId: TNodeId): boolean;
    getEdge?(source: TNodeId, target: TNodeId): { weight?: number } | undefined;
  }): CSRGraph<TNodeId> {
    const adjacencyList = new Map<TNodeId, TNodeId[]>();
    const weights = new Map<string, number>();
    
    // Build adjacency list
    for (const node of graph.nodes()) {
      const neighbors: TNodeId[] = [];
      for (const neighbor of graph.neighbors(node.id)) {
        neighbors.push(neighbor);
        
        // Get edge weight if available
        if (graph.getEdge) {
          const edge = graph.getEdge(node.id, neighbor);
          if (edge?.weight !== undefined) {
            weights.set(`${String(node.id)}-${String(neighbor)}`, edge.weight);
          }
        }
      }
      adjacencyList.set(node.id, neighbors);
    }
    
    return new CSRGraph(adjacencyList, weights.size > 0 ? weights : undefined);
  }
}