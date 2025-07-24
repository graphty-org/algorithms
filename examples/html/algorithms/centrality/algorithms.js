class Graph {
  constructor(config = {}) {
    this.config = {
      directed: false,
      allowSelfLoops: true,
      allowParallelEdges: false,
      ...config
    };
    this.nodeMap = /* @__PURE__ */ new Map();
    this.adjacencyList = /* @__PURE__ */ new Map();
    this.incomingEdges = /* @__PURE__ */ new Map();
    this.edgeCount = 0;
  }
  /**
   * Add a node to the graph
   */
  addNode(id, data) {
    if (!this.nodeMap.has(id)) {
      this.nodeMap.set(id, { id, data });
      this.adjacencyList.set(id, /* @__PURE__ */ new Map());
      if (this.config.directed) {
        this.incomingEdges.set(id, /* @__PURE__ */ new Map());
      }
    }
  }
  /**
   * Remove a node from the graph
   */
  removeNode(id) {
    if (!this.nodeMap.has(id)) {
      return false;
    }
    const outgoingEdges = this.adjacencyList.get(id);
    if (outgoingEdges) {
      for (const targetId of Array.from(outgoingEdges.keys())) {
        this.removeEdge(id, targetId);
      }
    }
    if (this.config.directed) {
      const incomingEdges = this.incomingEdges.get(id);
      if (incomingEdges) {
        for (const sourceId of Array.from(incomingEdges.keys())) {
          this.removeEdge(sourceId, id);
        }
      }
    } else {
      for (const [nodeId, edges] of Array.from(this.adjacencyList)) {
        if (edges.has(id)) {
          this.removeEdge(nodeId, id);
        }
      }
    }
    this.nodeMap.delete(id);
    this.adjacencyList.delete(id);
    if (this.config.directed) {
      this.incomingEdges.delete(id);
    }
    return true;
  }
  /**
   * Add an edge to the graph
   */
  addEdge(source, target, weight = 1, data) {
    this.addNode(source);
    this.addNode(target);
    if (!this.config.allowSelfLoops && source === target) {
      throw new Error("Self-loops are not allowed in this graph");
    }
    if (!this.config.allowParallelEdges && this.hasEdge(source, target)) {
      throw new Error("Parallel edges are not allowed in this graph");
    }
    const edge = { source, target, weight, data };
    const sourceAdjacency = this.adjacencyList.get(source);
    if (sourceAdjacency) {
      sourceAdjacency.set(target, edge);
    }
    if (this.config.directed) {
      const targetIncoming = this.incomingEdges.get(target);
      if (targetIncoming) {
        targetIncoming.set(source, edge);
      }
    } else {
      if (source !== target) {
        const reverseEdge = { source: target, target: source, weight, data };
        const targetAdjacency = this.adjacencyList.get(target);
        if (targetAdjacency) {
          targetAdjacency.set(source, reverseEdge);
        }
      }
    }
    this.edgeCount++;
  }
  /**
   * Remove an edge from the graph
   */
  removeEdge(source, target) {
    const sourceEdges = this.adjacencyList.get(source);
    if (!sourceEdges?.has(target)) {
      return false;
    }
    sourceEdges.delete(target);
    if (this.config.directed) {
      const targetIncoming = this.incomingEdges.get(target);
      if (targetIncoming) {
        targetIncoming.delete(source);
      }
    } else {
      const targetEdges = this.adjacencyList.get(target);
      if (targetEdges) {
        targetEdges.delete(source);
      }
    }
    this.edgeCount--;
    return true;
  }
  /**
   * Check if a node exists in the graph
   */
  hasNode(id) {
    return this.nodeMap.has(id);
  }
  /**
   * Check if an edge exists in the graph
   */
  hasEdge(source, target) {
    const sourceEdges = this.adjacencyList.get(source);
    return sourceEdges ? sourceEdges.has(target) : false;
  }
  /**
   * Get a node by ID
   */
  getNode(id) {
    return this.nodeMap.get(id);
  }
  /**
   * Get an edge by source and target
   */
  getEdge(source, target) {
    const sourceEdges = this.adjacencyList.get(source);
    return sourceEdges ? sourceEdges.get(target) : void 0;
  }
  /**
   * Get the number of nodes in the graph
   */
  get nodeCount() {
    return this.nodeMap.size;
  }
  /**
   * Get the number of edges in the graph
   */
  get totalEdgeCount() {
    return this.edgeCount;
  }
  /**
   * Check if the graph is directed
   */
  get isDirected() {
    return this.config.directed;
  }
  /**
   * Get all nodes in the graph
   */
  nodes() {
    return this.nodeMap.values();
  }
  /**
   * Get all edges in the graph
   */
  *edges() {
    for (const [source, edges] of Array.from(this.adjacencyList)) {
      for (const edge of edges.values()) {
        if (!this.config.directed && source > edge.target) {
          continue;
        }
        yield edge;
      }
    }
  }
  /**
   * Get neighbors of a node (outgoing edges)
   */
  neighbors(nodeId) {
    const edges = this.adjacencyList.get(nodeId);
    return edges ? edges.keys() : (/* @__PURE__ */ new Map()).keys();
  }
  /**
   * Get incoming neighbors of a node (directed graphs only)
   */
  inNeighbors(nodeId) {
    if (!this.config.directed) {
      return this.neighbors(nodeId);
    }
    const edges = this.incomingEdges.get(nodeId);
    return edges ? edges.keys() : (/* @__PURE__ */ new Map()).keys();
  }
  /**
   * Get outgoing neighbors of a node
   */
  outNeighbors(nodeId) {
    return this.neighbors(nodeId);
  }
  /**
   * Get the degree of a node
   */
  degree(nodeId) {
    if (this.config.directed) {
      return this.inDegree(nodeId) + this.outDegree(nodeId);
    }
    const edges = this.adjacencyList.get(nodeId);
    return edges ? edges.size : 0;
  }
  /**
   * Get the in-degree of a node
   */
  inDegree(nodeId) {
    if (!this.config.directed) {
      return this.degree(nodeId);
    }
    const edges = this.incomingEdges.get(nodeId);
    return edges ? edges.size : 0;
  }
  /**
   * Get the out-degree of a node
   */
  outDegree(nodeId) {
    const edges = this.adjacencyList.get(nodeId);
    return edges ? edges.size : 0;
  }
  /**
   * Create a copy of the graph
   */
  clone() {
    const cloned = new Graph(this.config);
    for (const node of Array.from(this.nodeMap.values())) {
      cloned.addNode(node.id, node.data ? { ...node.data } : void 0);
    }
    for (const edge of Array.from(this.edges())) {
      cloned.addEdge(
        edge.source,
        edge.target,
        edge.weight,
        edge.data ? { ...edge.data } : void 0
      );
    }
    return cloned;
  }
  /**
   * Get graph configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Clear all nodes and edges from the graph
   */
  clear() {
    this.nodeMap.clear();
    this.adjacencyList.clear();
    this.incomingEdges.clear();
    this.edgeCount = 0;
  }
  /**
   * Get the number of unique edges in the graph
   * For undirected graphs, each edge is counted once
   */
  get uniqueEdgeCount() {
    if (this.config.directed) {
      return this.edgeCount;
    }
    let count = 0;
    for (const _edge of Array.from(this.edges())) {
      count++;
    }
    return count;
  }
}
function breadthFirstSearch(graph, startNode, options = {}) {
  if (!graph.hasNode(startNode)) {
    throw new Error(`Start node ${String(startNode)} not found in graph`);
  }
  const visited = /* @__PURE__ */ new Set();
  const queue = [];
  const order = [];
  const tree = /* @__PURE__ */ new Map();
  queue.push({ node: startNode, level: 0 });
  visited.add(startNode);
  tree.set(startNode, null);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    order.push(current.node);
    if (options.visitCallback) {
      options.visitCallback(current.node, current.level);
    }
    if (options.targetNode && current.node === options.targetNode) {
      break;
    }
    for (const neighbor of graph.neighbors(current.node)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        tree.set(neighbor, current.node);
        queue.push({ node: neighbor, level: current.level + 1 });
      }
    }
  }
  return { visited, order, tree };
}
function shortestPathBFS(graph, source, target) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  if (!graph.hasNode(target)) {
    throw new Error(`Target node ${String(target)} not found in graph`);
  }
  if (source === target) {
    return {
      distance: 0,
      path: [source],
      predecessor: /* @__PURE__ */ new Map([[source, null]])
    };
  }
  const visited = /* @__PURE__ */ new Set();
  const queue = [];
  const predecessor = /* @__PURE__ */ new Map();
  queue.push({ node: source, distance: 0 });
  visited.add(source);
  predecessor.set(source, null);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (current.node === target) {
      const path = reconstructPath$2(target, predecessor);
      return {
        distance: current.distance,
        path,
        predecessor
      };
    }
    for (const neighbor of graph.neighbors(current.node)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        predecessor.set(neighbor, current.node);
        queue.push({ node: neighbor, distance: current.distance + 1 });
      }
    }
  }
  return null;
}
function singleSourceShortestPathBFS(graph, source) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  const results = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const queue = [];
  const predecessor = /* @__PURE__ */ new Map();
  queue.push({ node: source, distance: 0 });
  visited.add(source);
  predecessor.set(source, null);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const path = reconstructPath$2(current.node, predecessor);
    results.set(current.node, {
      distance: current.distance,
      path,
      predecessor: new Map(predecessor)
    });
    for (const neighbor of graph.neighbors(current.node)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        predecessor.set(neighbor, current.node);
        queue.push({ node: neighbor, distance: current.distance + 1 });
      }
    }
  }
  return results;
}
function isBipartite(graph) {
  if (graph.isDirected) {
    throw new Error("Bipartite test requires an undirected graph");
  }
  const color = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  for (const node of Array.from(graph.nodes())) {
    if (!visited.has(node.id)) {
      const queue = [node.id];
      color.set(node.id, 0);
      visited.add(node.id);
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) {
          break;
        }
        const currentColor = color.get(current);
        if (currentColor === void 0) {
          continue;
        }
        for (const neighbor of Array.from(graph.neighbors(current))) {
          if (!visited.has(neighbor)) {
            color.set(neighbor, currentColor === 0 ? 1 : 0);
            visited.add(neighbor);
            queue.push(neighbor);
          } else if (color.get(neighbor) === currentColor) {
            return false;
          }
        }
      }
    }
  }
  return true;
}
function reconstructPath$2(target, predecessor) {
  const path = [];
  let current = target;
  while (current !== null) {
    path.unshift(current);
    current = predecessor.get(current) ?? null;
  }
  return path;
}
function depthFirstSearch(graph, startNode, options = {}) {
  if (!graph.hasNode(startNode)) {
    throw new Error(`Start node ${String(startNode)} not found in graph`);
  }
  const visited = /* @__PURE__ */ new Set();
  const order = [];
  const tree = /* @__PURE__ */ new Map();
  if (options.recursive) {
    dfsRecursive(graph, startNode, visited, order, tree, options, 0);
  } else {
    dfsIterative(graph, startNode, visited, order, tree, options);
  }
  return { visited, order, tree };
}
function dfsIterative(graph, startNode, visited, order, tree, options) {
  if (options.preOrder === false) {
    dfsRecursive(graph, startNode, visited, order, tree, options, 0, null);
    return;
  }
  const stack = [];
  stack.push({ node: startNode, parent: null, depth: 0 });
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }
    if (!visited.has(current.node)) {
      visited.add(current.node);
      tree.set(current.node, current.parent);
      order.push(current.node);
      if (options.visitCallback) {
        options.visitCallback(current.node, current.depth);
      }
      if (options.targetNode && current.node === options.targetNode) {
        break;
      }
      const neighbors = Array.from(graph.neighbors(current.node));
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (neighbor !== void 0 && !visited.has(neighbor)) {
          stack.push({ node: neighbor, parent: current.node, depth: current.depth + 1 });
        }
      }
    }
  }
}
function dfsRecursive(graph, node, visited, order, tree, options, depth, parent = null) {
  visited.add(node);
  tree.set(node, parent);
  if (options.preOrder !== false) {
    order.push(node);
    if (options.visitCallback) {
      options.visitCallback(node, depth);
    }
    if (options.targetNode && node === options.targetNode) {
      return;
    }
  }
  for (const neighbor of Array.from(graph.neighbors(node))) {
    if (!visited.has(neighbor)) {
      dfsRecursive(graph, neighbor, visited, order, tree, options, depth + 1, node);
    }
  }
  if (options.preOrder === false) {
    order.push(node);
    if (options.visitCallback) {
      options.visitCallback(node, depth);
    }
  }
}
function hasCycleDFS(graph) {
  const visited = /* @__PURE__ */ new Set();
  for (const node of Array.from(graph.nodes())) {
    if (!visited.has(node.id)) {
      if (graph.isDirected) {
        const recursionStack = /* @__PURE__ */ new Set();
        if (hasCycleUtilDirected(graph, node.id, visited, recursionStack)) {
          return true;
        }
      } else {
        if (hasCycleUtilUndirected(graph, node.id, visited, null)) {
          return true;
        }
      }
    }
  }
  return false;
}
function hasCycleUtilDirected(graph, node, visited, recursionStack) {
  visited.add(node);
  recursionStack.add(node);
  for (const neighbor of Array.from(graph.neighbors(node))) {
    if (!visited.has(neighbor)) {
      if (hasCycleUtilDirected(graph, neighbor, visited, recursionStack)) {
        return true;
      }
    } else if (recursionStack.has(neighbor)) {
      return true;
    }
  }
  recursionStack.delete(node);
  return false;
}
function hasCycleUtilUndirected(graph, node, visited, parent) {
  visited.add(node);
  for (const neighbor of Array.from(graph.neighbors(node))) {
    if (!visited.has(neighbor)) {
      if (hasCycleUtilUndirected(graph, neighbor, visited, node)) {
        return true;
      }
    } else if (neighbor !== parent) {
      return true;
    }
  }
  return false;
}
function topologicalSort(graph) {
  if (!graph.isDirected) {
    throw new Error("Topological sort requires a directed graph");
  }
  if (hasCycleDFS(graph)) {
    return null;
  }
  const visited = /* @__PURE__ */ new Set();
  const stack = [];
  for (const node of Array.from(graph.nodes())) {
    if (!visited.has(node.id)) {
      topologicalSortUtil(graph, node.id, visited, stack);
    }
  }
  return stack.reverse();
}
function topologicalSortUtil(graph, node, visited, stack) {
  visited.add(node);
  for (const neighbor of Array.from(graph.neighbors(node))) {
    if (!visited.has(neighbor)) {
      topologicalSortUtil(graph, neighbor, visited, stack);
    }
  }
  stack.push(node);
}
function findStronglyConnectedComponents(graph) {
  if (!graph.isDirected) {
    throw new Error("Strongly connected components require a directed graph");
  }
  const visited = /* @__PURE__ */ new Set();
  const finishOrder = [];
  for (const node of Array.from(graph.nodes())) {
    if (!visited.has(node.id)) {
      dfsFinishOrder(graph, node.id, visited, finishOrder);
    }
  }
  const transposeGraph = createTransposeGraph(graph);
  const visited2 = /* @__PURE__ */ new Set();
  const components = [];
  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const node = finishOrder[i];
    if (node !== void 0 && !visited2.has(node)) {
      const component = [];
      dfsCollectComponent(transposeGraph, node, visited2, component);
      components.push(component);
    }
  }
  return components;
}
function dfsFinishOrder(graph, node, visited, finishOrder) {
  visited.add(node);
  for (const neighbor of Array.from(graph.neighbors(node))) {
    if (!visited.has(neighbor)) {
      dfsFinishOrder(graph, neighbor, visited, finishOrder);
    }
  }
  finishOrder.push(node);
}
function dfsCollectComponent(graph, node, visited, component) {
  visited.add(node);
  component.push(node);
  for (const neighbor of Array.from(graph.neighbors(node))) {
    if (!visited.has(neighbor)) {
      dfsCollectComponent(graph, neighbor, visited, component);
    }
  }
}
function createTransposeGraph(graph) {
  const transpose = new Graph({ directed: true });
  for (const node of Array.from(graph.nodes())) {
    transpose.addNode(node.id, node.data);
  }
  for (const edge of Array.from(graph.edges())) {
    transpose.addEdge(edge.target, edge.source, edge.weight, edge.data);
  }
  return transpose;
}
function bellmanFord(graph, source, options = {}) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  const distances = /* @__PURE__ */ new Map();
  const predecessors = /* @__PURE__ */ new Map();
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  for (const nodeId of nodes) {
    distances.set(nodeId, nodeId === source ? 0 : Infinity);
    predecessors.set(nodeId, null);
  }
  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    for (const edge of Array.from(graph.edges())) {
      const u = edge.source;
      const v = edge.target;
      const weight = edge.weight ?? 1;
      const distanceU = distances.get(u);
      const distanceV = distances.get(v);
      if (distanceU !== void 0 && distanceV !== void 0 && distanceU !== Infinity) {
        const newDistance = distanceU + weight;
        if (newDistance < distanceV) {
          distances.set(v, newDistance);
          predecessors.set(v, u);
          updated = true;
          if (options.target && v === options.target) {
            break;
          }
        }
      }
    }
    if (!updated) {
      break;
    }
  }
  const negativeCycleNodes = [];
  let hasNegativeCycle2 = false;
  for (const edge of graph.edges()) {
    const u = edge.source;
    const v = edge.target;
    const weight = edge.weight ?? 1;
    const distanceU = distances.get(u);
    const distanceV = distances.get(v);
    if (distanceU !== void 0 && distanceV !== void 0 && distanceU !== Infinity) {
      const newDistance = distanceU + weight;
      if (newDistance < distanceV) {
        hasNegativeCycle2 = true;
        negativeCycleNodes.push(v);
      }
    }
  }
  return {
    distances,
    predecessors,
    hasNegativeCycle: hasNegativeCycle2,
    negativeCycleNodes
  };
}
function bellmanFordPath(graph, source, target) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  if (!graph.hasNode(target)) {
    throw new Error(`Target node ${String(target)} not found in graph`);
  }
  const result = bellmanFord(graph, source, { target });
  if (result.hasNegativeCycle) {
    throw new Error("Graph contains a negative cycle");
  }
  const distance = result.distances.get(target);
  if (distance === void 0 || distance === Infinity) {
    return null;
  }
  const path = reconstructPath$1(target, result.predecessors);
  return {
    distance,
    path,
    predecessor: result.predecessors
  };
}
function hasNegativeCycle(graph) {
  const nodes = Array.from(graph.nodes());
  if (nodes.length === 0) {
    return false;
  }
  const checked = /* @__PURE__ */ new Set();
  for (const node of nodes) {
    if (!checked.has(node.id)) {
      const result = bellmanFord(graph, node.id);
      if (result.hasNegativeCycle) {
        return true;
      }
      for (const [nodeId, distance] of Array.from(result.distances)) {
        if (distance !== Infinity) {
          checked.add(nodeId);
        }
      }
    }
  }
  return false;
}
function reconstructPath$1(target, predecessors) {
  const path = [];
  let current = target;
  while (current !== null) {
    path.unshift(current);
    current = predecessors.get(current) ?? null;
  }
  return path;
}
class PriorityQueue {
  constructor(compareFn) {
    this.heap = [];
    this.compareFn = compareFn ?? ((a, b) => a - b);
  }
  /**
   * Add an item with the given priority to the queue
   */
  enqueue(item, priority) {
    const element = { item, priority };
    this.heap.push(element);
    this.heapifyUp(this.heap.length - 1);
  }
  /**
   * Remove and return the item with the highest priority
   */
  dequeue() {
    if (this.heap.length === 0) {
      return void 0;
    }
    if (this.heap.length === 1) {
      return this.heap.pop()?.item;
    }
    const root = this.heap[0];
    const lastElement = this.heap.pop();
    if (!root) {
      return void 0;
    }
    if (lastElement) {
      this.heap[0] = lastElement;
      this.heapifyDown(0);
    }
    return root.item;
  }
  /**
   * View the item with the highest priority without removing it
   */
  peek() {
    const first = this.heap[0];
    return first ? first.item : void 0;
  }
  /**
   * Check if the queue is empty
   */
  isEmpty() {
    return this.heap.length === 0;
  }
  /**
   * Get the number of items in the queue
   */
  size() {
    return this.heap.length;
  }
  /**
   * Update the priority of an item if it exists in the queue
   * Returns true if the item was found and updated
   */
  updatePriority(item, newPriority) {
    const index = this.heap.findIndex((element2) => element2.item === item);
    if (index === -1) {
      return false;
    }
    const element = this.heap[index];
    if (!element) {
      return false;
    }
    const oldPriority = element.priority;
    element.priority = newPriority;
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
  clear() {
    this.heap = [];
  }
  /**
   * Convert queue to array (for testing/debugging)
   */
  toArray() {
    return [...this.heap];
  }
  /**
   * Move element up the heap until heap property is satisfied
   */
  heapifyUp(index) {
    if (index === 0) {
      return;
    }
    const parentIndex = Math.floor((index - 1) / 2);
    const current = this.heap[index];
    const parent = this.heap[parentIndex];
    if (current && parent && this.compareFn(current.priority, parent.priority) < 0) {
      this.swap(index, parentIndex);
      this.heapifyUp(parentIndex);
    }
  }
  /**
   * Move element down the heap until heap property is satisfied
   */
  heapifyDown(index) {
    const leftChildIndex = 2 * index + 1;
    const rightChildIndex = 2 * index + 2;
    let targetIndex = index;
    const leftChild = this.heap[leftChildIndex];
    const target = this.heap[targetIndex];
    if (leftChildIndex < this.heap.length && leftChild && target && this.compareFn(leftChild.priority, target.priority) < 0) {
      targetIndex = leftChildIndex;
    }
    const rightChild = this.heap[rightChildIndex];
    const newTarget = this.heap[targetIndex];
    if (rightChildIndex < this.heap.length && rightChild && newTarget && this.compareFn(rightChild.priority, newTarget.priority) < 0) {
      targetIndex = rightChildIndex;
    }
    if (targetIndex !== index) {
      this.swap(index, targetIndex);
      this.heapifyDown(targetIndex);
    }
  }
  /**
   * Swap two elements in the heap
   */
  swap(i, j) {
    const temp = this.heap[i];
    const other = this.heap[j];
    if (temp && other) {
      this.heap[i] = other;
      this.heap[j] = temp;
    }
  }
}
function dijkstra(graph, source, options = {}) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  const distances = /* @__PURE__ */ new Map();
  const previous = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const pq = new PriorityQueue();
  for (const node of Array.from(graph.nodes())) {
    const distance = node.id === source ? 0 : Infinity;
    distances.set(node.id, distance);
    previous.set(node.id, null);
    pq.enqueue(node.id, distance);
  }
  while (!pq.isEmpty()) {
    const currentNode = pq.dequeue();
    if (currentNode === void 0) {
      break;
    }
    const currentDistance = distances.get(currentNode);
    if (currentDistance === void 0) {
      continue;
    }
    if (visited.has(currentNode)) {
      continue;
    }
    visited.add(currentNode);
    if (options.target && currentNode === options.target) {
      break;
    }
    if (currentDistance === Infinity) {
      break;
    }
    for (const neighbor of Array.from(graph.neighbors(currentNode))) {
      if (visited.has(neighbor)) {
        continue;
      }
      const edge = graph.getEdge(currentNode, neighbor);
      if (!edge) {
        continue;
      }
      const edgeWeight = edge.weight ?? 1;
      if (edgeWeight < 0) {
        throw new Error("Dijkstra's algorithm does not support negative edge weights");
      }
      const tentativeDistance = currentDistance + edgeWeight;
      const neighborDistance = distances.get(neighbor);
      if (neighborDistance === void 0) {
        continue;
      }
      if (tentativeDistance < neighborDistance) {
        distances.set(neighbor, tentativeDistance);
        previous.set(neighbor, currentNode);
        pq.enqueue(neighbor, tentativeDistance);
      }
    }
  }
  const results = /* @__PURE__ */ new Map();
  for (const [nodeId, distance] of distances) {
    if (distance < Infinity) {
      const path = reconstructPath(nodeId, previous);
      results.set(nodeId, {
        distance,
        path,
        predecessor: new Map(previous)
      });
    }
  }
  return results;
}
function dijkstraPath(graph, source, target) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  if (!graph.hasNode(target)) {
    throw new Error(`Target node ${String(target)} not found in graph`);
  }
  if (source === target) {
    return {
      distance: 0,
      path: [source],
      predecessor: /* @__PURE__ */ new Map([[source, null]])
    };
  }
  const results = dijkstra(graph, source, { target });
  return results.get(target) ?? null;
}
function singleSourceShortestPath(graph, source, cutoff) {
  if (!graph.hasNode(source)) {
    throw new Error(`Source node ${String(source)} not found in graph`);
  }
  const distances = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const pq = new PriorityQueue();
  for (const node of Array.from(graph.nodes())) {
    const distance = node.id === source ? 0 : Infinity;
    distances.set(node.id, distance);
    pq.enqueue(node.id, distance);
  }
  while (!pq.isEmpty()) {
    const currentNode = pq.dequeue();
    if (currentNode === void 0) {
      break;
    }
    const currentDistance = distances.get(currentNode);
    if (currentDistance === void 0) {
      continue;
    }
    if (visited.has(currentNode)) {
      continue;
    }
    visited.add(currentNode);
    if (currentDistance === Infinity || cutoff !== void 0 && currentDistance > cutoff) {
      break;
    }
    for (const neighbor of Array.from(graph.neighbors(currentNode))) {
      if (visited.has(neighbor)) {
        continue;
      }
      const edge = graph.getEdge(currentNode, neighbor);
      if (!edge) {
        continue;
      }
      const edgeWeight = edge.weight ?? 1;
      const tentativeDistance = currentDistance + edgeWeight;
      const neighborDistance = distances.get(neighbor);
      if (neighborDistance === void 0) {
        continue;
      }
      if (tentativeDistance < neighborDistance) {
        distances.set(neighbor, tentativeDistance);
        pq.enqueue(neighbor, tentativeDistance);
      }
    }
  }
  const result = /* @__PURE__ */ new Map();
  for (const [nodeId, distance] of distances) {
    if (distance < Infinity && (cutoff === void 0 || distance <= cutoff)) {
      result.set(nodeId, distance);
    }
  }
  return result;
}
function allPairsShortestPath(graph) {
  const results = /* @__PURE__ */ new Map();
  for (const node of Array.from(graph.nodes())) {
    const distances = singleSourceShortestPath(graph, node.id);
    results.set(node.id, distances);
  }
  return results;
}
function reconstructPath(target, previous) {
  const path = [];
  let current = target;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }
  return path;
}
function floydWarshall(graph) {
  const nodes = Array.from(graph.nodes()).map((n) => n.id);
  const distances = /* @__PURE__ */ new Map();
  const predecessors = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    distances.set(node, /* @__PURE__ */ new Map());
    predecessors.set(node, /* @__PURE__ */ new Map());
    const nodeDistances = distances.get(node);
    const nodePredecessors = predecessors.get(node);
    if (!nodeDistances || !nodePredecessors) {
      continue;
    }
    for (const other of nodes) {
      if (node === other) {
        nodeDistances.set(other, 0);
        nodePredecessors.set(other, null);
      } else {
        nodeDistances.set(other, Infinity);
        nodePredecessors.set(other, null);
      }
    }
  }
  for (const edge of Array.from(graph.edges())) {
    const weight = edge.weight ?? 1;
    const sourceDistances = distances.get(edge.source);
    const sourcePredecessors = predecessors.get(edge.source);
    if (sourceDistances && sourcePredecessors) {
      sourceDistances.set(edge.target, weight);
      sourcePredecessors.set(edge.target, edge.source);
    }
    if (!graph.isDirected) {
      const targetDistances = distances.get(edge.target);
      const targetPredecessors = predecessors.get(edge.target);
      if (targetDistances && targetPredecessors) {
        targetDistances.set(edge.source, weight);
        targetPredecessors.set(edge.source, edge.target);
      }
    }
  }
  for (const k of nodes) {
    for (const i of nodes) {
      for (const j of nodes) {
        const distancesI = distances.get(i);
        const distancesK = distances.get(k);
        const predecessorsI = predecessors.get(i);
        const predecessorsK = predecessors.get(k);
        if (!distancesI || !distancesK || !predecessorsI || !predecessorsK) {
          continue;
        }
        const distIK = distancesI.get(k);
        const distKJ = distancesK.get(j);
        const distIJ = distancesI.get(j);
        if (distIK === void 0 || distKJ === void 0 || distIJ === void 0) {
          continue;
        }
        if (distIK + distKJ < distIJ) {
          distancesI.set(j, distIK + distKJ);
          const predKJ = predecessorsK.get(j);
          predecessorsI.set(j, predKJ ?? null);
        }
      }
    }
  }
  let hasNegativeCycle2 = false;
  for (const node of nodes) {
    const nodeDistances = distances.get(node);
    if (!nodeDistances) {
      continue;
    }
    const selfDistance = nodeDistances.get(node);
    if (selfDistance !== void 0 && selfDistance < 0) {
      hasNegativeCycle2 = true;
      break;
    }
  }
  return {
    distances,
    predecessors,
    hasNegativeCycle: hasNegativeCycle2
  };
}
function floydWarshallPath(graph, source, target) {
  const result = floydWarshall(graph);
  if (!graph.hasNode(source) || !graph.hasNode(target)) {
    return null;
  }
  const sourceDistances = result.distances.get(source);
  if (!sourceDistances) {
    return null;
  }
  const distance = sourceDistances.get(target);
  if (distance === void 0 || distance === Infinity) {
    return null;
  }
  const path = [];
  let current = target;
  while (current !== null && current !== source) {
    path.unshift(current);
    const sourcePredecessors = result.predecessors.get(source);
    if (!sourcePredecessors) {
      return null;
    }
    current = sourcePredecessors.get(current) ?? null;
    if (path.length > graph.nodeCount) {
      return null;
    }
  }
  if (current === source) {
    path.unshift(source);
    return { path, distance };
  }
  return null;
}
function transitiveClosure(graph) {
  const result = floydWarshall(graph);
  const closure = /* @__PURE__ */ new Map();
  for (const [source, distances] of Array.from(result.distances)) {
    const reachable = /* @__PURE__ */ new Set();
    for (const [target, distance] of Array.from(distances)) {
      if (distance < Infinity) {
        reachable.add(target);
      }
    }
    closure.set(source, reachable);
  }
  return closure;
}
function betweennessCentrality(graph, options = {}) {
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const centrality = {};
  for (const nodeId of nodes) {
    centrality[String(nodeId)] = 0;
  }
  for (const source of nodes) {
    const stack = [];
    const predecessors = /* @__PURE__ */ new Map();
    const sigma = /* @__PURE__ */ new Map();
    const distance = /* @__PURE__ */ new Map();
    const delta = /* @__PURE__ */ new Map();
    for (const nodeId of nodes) {
      predecessors.set(nodeId, []);
      sigma.set(nodeId, 0);
      distance.set(nodeId, -1);
      delta.set(nodeId, 0);
    }
    sigma.set(source, 1);
    distance.set(source, 0);
    const queue = [source];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      stack.push(current);
      for (const neighbor of Array.from(graph.neighbors(current))) {
        const currentDistance = distance.get(current);
        let neighborDistance = distance.get(neighbor);
        if (currentDistance === void 0 || neighborDistance === void 0) {
          continue;
        }
        if (neighborDistance < 0) {
          queue.push(neighbor);
          distance.set(neighbor, currentDistance + 1);
          neighborDistance = currentDistance + 1;
        }
        if (neighborDistance === currentDistance + 1) {
          const neighborSigma = sigma.get(neighbor) ?? 0;
          const currentSigma = sigma.get(current) ?? 0;
          sigma.set(neighbor, neighborSigma + currentSigma);
          const preds = predecessors.get(neighbor);
          if (preds) {
            preds.push(current);
          }
        }
      }
    }
    while (stack.length > 0) {
      const w = stack.pop();
      if (!w) {
        break;
      }
      const wPreds = predecessors.get(w) ?? [];
      const wSigma = sigma.get(w) ?? 0;
      const wDelta = delta.get(w) ?? 0;
      for (const v of wPreds) {
        const vSigma = sigma.get(v) ?? 0;
        const vDelta = delta.get(v) ?? 0;
        if (vSigma > 0 && wSigma > 0) {
          let contribution = vSigma / wSigma * (1 + wDelta);
          if (!options.endpoints) {
            const isTargetEndpoint = predecessors.get(w)?.length === 0 && w !== source;
            if (isTargetEndpoint) {
              contribution = 0;
            }
          }
          delta.set(v, vDelta + contribution);
        }
      }
      if (w !== source) {
        const currentCentrality = centrality[String(w)] ?? 0;
        centrality[String(w)] = currentCentrality + wDelta;
      }
    }
  }
  if (!graph.isDirected) {
    for (const nodeId of nodes) {
      const key = String(nodeId);
      const currentValue = centrality[key];
      if (currentValue !== void 0) {
        centrality[key] = currentValue / 2;
      }
    }
  }
  if (options.normalized) {
    const n = nodes.length;
    let normalizationFactor;
    if (graph.isDirected) {
      normalizationFactor = (n - 1) * (n - 2);
    } else {
      normalizationFactor = (n - 1) * (n - 2) / 2;
    }
    if (normalizationFactor > 0) {
      for (const nodeId of nodes) {
        const key = String(nodeId);
        const currentValue = centrality[key];
        if (currentValue !== void 0) {
          centrality[key] = currentValue / normalizationFactor;
        }
      }
    }
  }
  return centrality;
}
function nodeBetweennessCentrality(graph, targetNode, options = {}) {
  if (!graph.hasNode(targetNode)) {
    throw new Error(`Node ${String(targetNode)} not found in graph`);
  }
  const allCentralities = betweennessCentrality(graph, options);
  return allCentralities[String(targetNode)] ?? 0;
}
function edgeBetweennessCentrality(graph, options = {}) {
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const edgeCentrality = /* @__PURE__ */ new Map();
  for (const edge of Array.from(graph.edges())) {
    const edgeKey = `${String(edge.source)}-${String(edge.target)}`;
    edgeCentrality.set(edgeKey, 0);
  }
  for (const source of nodes) {
    const stack = [];
    const predecessors = /* @__PURE__ */ new Map();
    const sigma = /* @__PURE__ */ new Map();
    const distance = /* @__PURE__ */ new Map();
    const delta = /* @__PURE__ */ new Map();
    for (const nodeId of nodes) {
      predecessors.set(nodeId, []);
      sigma.set(nodeId, 0);
      distance.set(nodeId, -1);
      delta.set(nodeId, 0);
    }
    sigma.set(source, 1);
    distance.set(source, 0);
    const queue = [source];
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      stack.push(current);
      for (const neighbor of Array.from(graph.neighbors(current))) {
        const currentDistance = distance.get(current);
        let neighborDistance = distance.get(neighbor);
        if (currentDistance === void 0 || neighborDistance === void 0) {
          continue;
        }
        if (neighborDistance < 0) {
          queue.push(neighbor);
          distance.set(neighbor, currentDistance + 1);
          neighborDistance = currentDistance + 1;
        }
        if (neighborDistance === currentDistance + 1) {
          const neighborSigma = sigma.get(neighbor) ?? 0;
          const currentSigma = sigma.get(current) ?? 0;
          sigma.set(neighbor, neighborSigma + currentSigma);
          const preds = predecessors.get(neighbor);
          if (preds) {
            preds.push(current);
          }
        }
      }
    }
    while (stack.length > 0) {
      const w = stack.pop();
      if (!w) {
        break;
      }
      const wPreds = predecessors.get(w) ?? [];
      const wSigma = sigma.get(w) ?? 0;
      const wDelta = delta.get(w) ?? 0;
      for (const v of wPreds) {
        const vSigma = sigma.get(v) ?? 0;
        if (vSigma > 0 && wSigma > 0) {
          let edgeContribution = vSigma / wSigma * (1 + wDelta);
          if (!options.endpoints) {
            const isTargetEndpoint = predecessors.get(w)?.length === 0 && w !== source;
            if (isTargetEndpoint) {
              edgeContribution = 0;
            }
          }
          const edgeKey = `${String(v)}-${String(w)}`;
          const currentEdgeCentrality = edgeCentrality.get(edgeKey) ?? 0;
          edgeCentrality.set(edgeKey, currentEdgeCentrality + edgeContribution);
          const vDelta = delta.get(v) ?? 0;
          delta.set(v, vDelta + edgeContribution);
        }
      }
    }
  }
  if (!graph.isDirected) {
    for (const [edgeKey, centrality] of Array.from(edgeCentrality)) {
      edgeCentrality.set(edgeKey, centrality / 2);
    }
  }
  if (options.normalized) {
    const n = nodes.length;
    const normalizationFactor = graph.isDirected ? (n - 1) * (n - 2) : (n - 1) * (n - 2) / 2;
    if (normalizationFactor > 0) {
      for (const [edgeKey, centrality] of Array.from(edgeCentrality)) {
        edgeCentrality.set(edgeKey, centrality / normalizationFactor);
      }
    }
  }
  return edgeCentrality;
}
function closenessCentrality(graph, options = {}) {
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const centrality = {};
  for (const sourceNode of nodes) {
    centrality[String(sourceNode)] = nodeClosenessCentrality(graph, sourceNode, options);
  }
  return centrality;
}
function nodeClosenessCentrality(graph, node, options = {}) {
  if (!graph.hasNode(node)) {
    throw new Error(`Node ${String(node)} not found in graph`);
  }
  const distances = singleSourceShortestPathLengths(graph, node, options.cutoff);
  if (distances.size <= 1) {
    return 0;
  }
  let centrality = 0;
  if (options.harmonic) {
    for (const [targetNode, distance] of Array.from(distances)) {
      if (targetNode !== node && distance > 0) {
        centrality += 1 / distance;
      }
    }
  } else {
    let totalDistance = 0;
    let reachableNodes = 0;
    for (const [targetNode, distance] of Array.from(distances)) {
      if (targetNode !== node) {
        totalDistance += distance;
        reachableNodes++;
      }
    }
    if (totalDistance > 0) {
      centrality = 1 / totalDistance;
      if (options.normalized) {
        const n = Array.from(graph.nodes()).length;
        centrality = centrality * reachableNodes / (n - 1);
      }
    }
  }
  if (options.harmonic && options.normalized) {
    const n = Array.from(graph.nodes()).length;
    if (n > 1) {
      centrality = centrality / (n - 1);
    }
  }
  return centrality;
}
function singleSourceShortestPathLengths(graph, source, cutoff) {
  const distances = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const queue = [];
  queue.push({ node: source, distance: 0 });
  visited.add(source);
  distances.set(source, 0);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (cutoff !== void 0 && current.distance >= cutoff) {
      continue;
    }
    for (const neighbor of Array.from(graph.neighbors(current.node))) {
      if (!visited.has(neighbor)) {
        const newDistance = current.distance + 1;
        if (cutoff !== void 0 && newDistance > cutoff) {
          continue;
        }
        visited.add(neighbor);
        distances.set(neighbor, newDistance);
        queue.push({ node: neighbor, distance: newDistance });
      }
    }
  }
  return distances;
}
function weightedClosenessCentrality(graph, options = {}) {
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const centrality = {};
  for (const sourceNode of nodes) {
    centrality[String(sourceNode)] = nodeWeightedClosenessCentrality(graph, sourceNode, options);
  }
  return centrality;
}
function nodeWeightedClosenessCentrality(graph, node, options = {}) {
  if (!graph.hasNode(node)) {
    throw new Error(`Node ${String(node)} not found in graph`);
  }
  const distances = dijkstraDistances(graph, node, options.cutoff);
  if (distances.size <= 1) {
    return 0;
  }
  let centrality = 0;
  if (options.harmonic) {
    for (const [targetNode, distance] of Array.from(distances)) {
      if (targetNode !== node && distance > 0 && distance < Infinity) {
        centrality += 1 / distance;
      }
    }
  } else {
    let totalDistance = 0;
    let reachableNodes = 0;
    for (const [targetNode, distance] of Array.from(distances)) {
      if (targetNode !== node && distance < Infinity) {
        totalDistance += distance;
        reachableNodes++;
      }
    }
    if (totalDistance > 0) {
      centrality = 1 / totalDistance;
      if (options.normalized) {
        const n = Array.from(graph.nodes()).length;
        centrality = centrality * reachableNodes / (n - 1);
      }
    }
  }
  if (options.harmonic && options.normalized) {
    const n = Array.from(graph.nodes()).length;
    if (n > 1) {
      centrality = centrality / (n - 1);
    }
  }
  return centrality;
}
function dijkstraDistances(graph, source, cutoff) {
  const distances = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const pq = [];
  for (const node of Array.from(graph.nodes())) {
    distances.set(node.id, node.id === source ? 0 : Infinity);
  }
  pq.push({ node: source, distance: 0 });
  while (pq.length > 0) {
    pq.sort((a, b) => a.distance - b.distance);
    const current = pq.shift();
    if (!current || visited.has(current.node)) {
      continue;
    }
    visited.add(current.node);
    if (cutoff !== void 0 && current.distance > cutoff) {
      continue;
    }
    for (const neighbor of Array.from(graph.neighbors(current.node))) {
      if (visited.has(neighbor)) {
        continue;
      }
      const edge = graph.getEdge(current.node, neighbor);
      if (!edge) {
        continue;
      }
      const edgeWeight = edge.weight ?? 1;
      const tentativeDistance = current.distance + edgeWeight;
      const currentDistance = distances.get(neighbor) ?? Infinity;
      if (tentativeDistance < currentDistance) {
        distances.set(neighbor, tentativeDistance);
        if (cutoff === void 0 || tentativeDistance <= cutoff) {
          pq.push({ node: neighbor, distance: tentativeDistance });
        }
      }
    }
  }
  return distances;
}
function degreeCentrality(graph, options = {}) {
  const centrality = {};
  const { nodeCount } = graph;
  const maxPossibleDegree = graph.isDirected ? nodeCount - 1 : nodeCount - 1;
  for (const node of Array.from(graph.nodes())) {
    let degree;
    if (graph.isDirected && options.mode) {
      switch (options.mode) {
        case "in": {
          degree = graph.inDegree(node.id);
          break;
        }
        case "out": {
          degree = graph.outDegree(node.id);
          break;
        }
        case "total": {
          degree = graph.degree(node.id);
          break;
        }
        default: {
          degree = graph.degree(node.id);
        }
      }
    } else {
      degree = graph.degree(node.id);
    }
    const normalizedDegree = options.normalized && maxPossibleDegree > 0 ? degree / maxPossibleDegree : degree;
    centrality[node.id.toString()] = normalizedDegree;
  }
  return centrality;
}
function nodeDegreeCentrality(graph, nodeId, options = {}) {
  if (!graph.hasNode(nodeId)) {
    throw new Error(`Node ${String(nodeId)} not found in graph`);
  }
  const { nodeCount } = graph;
  let degree;
  if (graph.isDirected && options.mode) {
    switch (options.mode) {
      case "in": {
        degree = graph.inDegree(nodeId);
        break;
      }
      case "out": {
        degree = graph.outDegree(nodeId);
        break;
      }
      case "total": {
        degree = graph.degree(nodeId);
        break;
      }
      default: {
        degree = graph.degree(nodeId);
      }
    }
  } else {
    degree = graph.degree(nodeId);
  }
  const maxPossibleDegree = nodeCount - 1;
  return options.normalized && maxPossibleDegree > 0 ? degree / maxPossibleDegree : degree;
}
function eigenvectorCentrality(graph, options = {}) {
  const {
    maxIterations = 100,
    tolerance = 1e-6,
    normalized = true,
    startVector
  } = options;
  const centrality = {};
  const nodes = Array.from(graph.nodes());
  const nodeIds = nodes.map((node) => node.id);
  if (nodeIds.length === 0) {
    return centrality;
  }
  let currentVector = /* @__PURE__ */ new Map();
  let previousVector = /* @__PURE__ */ new Map();
  if (startVector) {
    for (const nodeId of nodeIds) {
      const key = nodeId.toString();
      currentVector.set(key, startVector.get(key) ?? 1 / Math.sqrt(nodeIds.length));
    }
  } else {
    const initialValue = 1 / Math.sqrt(nodeIds.length);
    for (const nodeId of nodeIds) {
      currentVector.set(nodeId.toString(), initialValue);
    }
  }
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    previousVector = new Map(currentVector);
    currentVector = /* @__PURE__ */ new Map();
    for (const nodeId of nodeIds) {
      let sum = 0;
      const neighbors = Array.from(graph.neighbors(nodeId));
      for (const neighbor of neighbors) {
        const neighborKey = neighbor.toString();
        const prevValue = previousVector.get(neighborKey);
        sum += prevValue ?? 0;
      }
      currentVector.set(nodeId.toString(), sum);
    }
    let norm = 0;
    for (const value of Array.from(currentVector.values())) {
      norm += value * value;
    }
    norm = Math.sqrt(norm);
    if (norm === 0) {
      for (const nodeId of nodeIds) {
        centrality[nodeId.toString()] = 0;
      }
      return centrality;
    }
    for (const [nodeId, value] of Array.from(currentVector)) {
      currentVector.set(nodeId, value / norm);
    }
    let maxDiff = 0;
    for (const [nodeId, value] of Array.from(currentVector)) {
      const prevValue = previousVector.get(nodeId) ?? 0;
      const diff = Math.abs(value - prevValue);
      maxDiff = Math.max(maxDiff, diff);
    }
    if (maxDiff < tolerance) {
      break;
    }
  }
  for (const [nodeId, value] of Array.from(currentVector)) {
    centrality[nodeId] = value;
  }
  if (normalized) {
    let maxValue = 0;
    let minValue = Number.POSITIVE_INFINITY;
    for (const value of Object.values(centrality)) {
      maxValue = Math.max(maxValue, value);
      minValue = Math.min(minValue, value);
    }
    const range = maxValue - minValue;
    if (range > 0) {
      for (const nodeId of Object.keys(centrality)) {
        const centralityValue = centrality[nodeId];
        if (centralityValue !== void 0) {
          centrality[nodeId] = (centralityValue - minValue) / range;
        }
      }
    } else {
      for (const nodeId of Object.keys(centrality)) {
        centrality[nodeId] = maxValue > 0 ? 1 : 0;
      }
    }
  }
  return centrality;
}
function nodeEigenvectorCentrality(graph, nodeId, options = {}) {
  if (!graph.hasNode(nodeId)) {
    throw new Error(`Node ${String(nodeId)} not found in graph`);
  }
  const centrality = eigenvectorCentrality(graph, options);
  return centrality[nodeId.toString()] ?? 0;
}
function hits(graph, options = {}) {
  const {
    maxIterations = 100,
    tolerance = 1e-6,
    normalized = true
  } = options;
  const hubs = {};
  const authorities = {};
  const nodes = Array.from(graph.nodes());
  const nodeIds = nodes.map((node) => node.id);
  if (nodeIds.length === 0) {
    return { hubs, authorities };
  }
  let currentHubs = /* @__PURE__ */ new Map();
  let currentAuthorities = /* @__PURE__ */ new Map();
  let previousHubs = /* @__PURE__ */ new Map();
  let previousAuthorities = /* @__PURE__ */ new Map();
  const initialValue = 1 / Math.sqrt(nodeIds.length);
  for (const nodeId of nodeIds) {
    const key = nodeId.toString();
    currentHubs.set(key, initialValue);
    currentAuthorities.set(key, initialValue);
  }
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    previousHubs = new Map(currentHubs);
    previousAuthorities = new Map(currentAuthorities);
    const newAuthorities = /* @__PURE__ */ new Map();
    for (const nodeId of nodeIds) {
      let authorityScore = 0;
      const inNeighbors = Array.from(graph.inNeighbors(nodeId));
      for (const inNeighbor of inNeighbors) {
        const neighborKey = inNeighbor.toString();
        authorityScore += previousHubs.get(neighborKey) ?? 0;
      }
      newAuthorities.set(nodeId.toString(), authorityScore);
    }
    const newHubs = /* @__PURE__ */ new Map();
    for (const nodeId of nodeIds) {
      let hubScore = 0;
      const outNeighbors = Array.from(graph.outNeighbors(nodeId));
      for (const outNeighbor of outNeighbors) {
        const neighborKey = outNeighbor.toString();
        hubScore += previousAuthorities.get(neighborKey) ?? 0;
      }
      newHubs.set(nodeId.toString(), hubScore);
    }
    let authNorm = 0;
    for (const value of Array.from(newAuthorities.values())) {
      authNorm += value * value;
    }
    authNorm = Math.sqrt(authNorm);
    if (authNorm > 0) {
      for (const [nodeId, value] of Array.from(newAuthorities)) {
        newAuthorities.set(nodeId, value / authNorm);
      }
    }
    let hubNorm = 0;
    for (const value of Array.from(newHubs.values())) {
      hubNorm += value * value;
    }
    hubNorm = Math.sqrt(hubNorm);
    if (hubNorm > 0) {
      for (const [nodeId, value] of Array.from(newHubs)) {
        newHubs.set(nodeId, value / hubNorm);
      }
    }
    currentAuthorities = newAuthorities;
    currentHubs = newHubs;
    let maxDiff = 0;
    for (const [nodeId, value] of currentHubs) {
      const prevValue = previousHubs.get(nodeId) ?? 0;
      const diff = Math.abs(value - prevValue);
      maxDiff = Math.max(maxDiff, diff);
    }
    for (const [nodeId, value] of currentAuthorities) {
      const prevValue = previousAuthorities.get(nodeId) ?? 0;
      const diff = Math.abs(value - prevValue);
      maxDiff = Math.max(maxDiff, diff);
    }
    if (maxDiff < tolerance) {
      break;
    }
  }
  for (const [nodeId, value] of currentHubs) {
    hubs[nodeId] = value;
  }
  for (const [nodeId, value] of currentAuthorities) {
    authorities[nodeId] = value;
  }
  if (!normalized) {
    let maxHub = 0;
    let maxAuth = 0;
    for (const value of Object.values(hubs)) {
      maxHub = Math.max(maxHub, value);
    }
    for (const value of Object.values(authorities)) {
      maxAuth = Math.max(maxAuth, value);
    }
    if (maxHub > 0) {
      for (const nodeId of Object.keys(hubs)) {
        const hubValue = hubs[nodeId];
        if (hubValue !== void 0) {
          hubs[nodeId] = hubValue / maxHub;
        }
      }
    }
    if (maxAuth > 0) {
      for (const nodeId of Object.keys(authorities)) {
        const authValue = authorities[nodeId];
        if (authValue !== void 0) {
          authorities[nodeId] = authValue / maxAuth;
        }
      }
    }
  }
  return { hubs, authorities };
}
function nodeHITS(graph, nodeId, options = {}) {
  if (!graph.hasNode(nodeId)) {
    throw new Error(`Node ${String(nodeId)} not found in graph`);
  }
  const result = hits(graph, options);
  const key = nodeId.toString();
  return {
    hub: result.hubs[key] ?? 0,
    authority: result.authorities[key] ?? 0
  };
}
function katzCentrality(graph, options = {}) {
  const {
    alpha = 0.1,
    beta = 1,
    maxIterations = 100,
    tolerance = 1e-6,
    normalized = true
  } = options;
  const centrality = {};
  const nodes = Array.from(graph.nodes());
  const nodeIds = nodes.map((node) => node.id);
  if (nodeIds.length === 0) {
    return centrality;
  }
  let currentScores = /* @__PURE__ */ new Map();
  let previousScores = /* @__PURE__ */ new Map();
  for (const nodeId of nodeIds) {
    currentScores.set(nodeId.toString(), beta);
  }
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    previousScores = new Map(currentScores);
    currentScores = /* @__PURE__ */ new Map();
    for (const nodeId of nodeIds) {
      let sum = 0;
      const neighbors = graph.isDirected ? Array.from(graph.inNeighbors(nodeId)) : graph.neighbors(nodeId);
      for (const neighbor of neighbors) {
        const neighborKey = neighbor.toString();
        sum += previousScores.get(neighborKey) ?? 0;
      }
      currentScores.set(nodeId.toString(), alpha * sum + beta);
    }
    let maxDiff = 0;
    for (const [nodeId, value] of Array.from(currentScores)) {
      const prevValue = previousScores.get(nodeId) ?? 0;
      const diff = Math.abs(value - prevValue);
      maxDiff = Math.max(maxDiff, diff);
    }
    if (maxDiff < tolerance) {
      break;
    }
  }
  for (const [nodeId, value] of Array.from(currentScores)) {
    centrality[nodeId] = value;
  }
  if (normalized) {
    let maxValue = 0;
    let minValue = Number.POSITIVE_INFINITY;
    for (const value of Object.values(centrality)) {
      maxValue = Math.max(maxValue, value);
      minValue = Math.min(minValue, value);
    }
    const range = maxValue - minValue;
    if (range > 0) {
      for (const nodeId of Object.keys(centrality)) {
        const centralityValue = centrality[nodeId];
        if (centralityValue !== void 0) {
          centrality[nodeId] = (centralityValue - minValue) / range;
        }
      }
    }
  }
  return centrality;
}
function nodeKatzCentrality(graph, nodeId, options = {}) {
  if (!graph.hasNode(nodeId)) {
    throw new Error(`Node ${String(nodeId)} not found in graph`);
  }
  const centrality = katzCentrality(graph, options);
  return centrality[nodeId.toString()] ?? 0;
}
function pageRank(graph, options = {}) {
  const {
    dampingFactor = 0.85,
    maxIterations = 100,
    tolerance = 1e-6,
    initialRanks,
    personalization,
    weight
  } = options;
  if (!graph.isDirected) {
    throw new Error("PageRank requires a directed graph");
  }
  if (dampingFactor < 0 || dampingFactor > 1) {
    throw new Error("Damping factor must be between 0 and 1");
  }
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const n = nodes.length;
  if (n === 0) {
    return { ranks: {}, iterations: 0, converged: true };
  }
  let ranks = /* @__PURE__ */ new Map();
  if (initialRanks) {
    for (const nodeId of nodes) {
      ranks.set(nodeId, initialRanks.get(nodeId) ?? 1 / n);
    }
  } else {
    for (const nodeId of nodes) {
      ranks.set(nodeId, 1 / n);
    }
  }
  normalizeRanks(ranks);
  const outDegrees = /* @__PURE__ */ new Map();
  const outWeights = /* @__PURE__ */ new Map();
  const danglingNodes = [];
  for (const nodeId of nodes) {
    let outDegree = 0;
    let totalOutWeight = 0;
    for (const neighbor of Array.from(graph.neighbors(nodeId))) {
      outDegree++;
      if (weight) {
        const edge = graph.getEdge(nodeId, neighbor);
        const edgeWeight = edge?.weight ?? 1;
        totalOutWeight += edgeWeight;
      } else {
        totalOutWeight += 1;
      }
    }
    outDegrees.set(nodeId, outDegree);
    outWeights.set(nodeId, totalOutWeight);
    if (outDegree === 0) {
      danglingNodes.push(nodeId);
    }
  }
  let personalVector = null;
  if (personalization) {
    personalVector = new Map(personalization);
    normalizeRanks(personalVector);
  }
  let converged = false;
  let iteration = 0;
  for (iteration = 0; iteration < maxIterations; iteration++) {
    const newRanks = /* @__PURE__ */ new Map();
    for (const nodeId of nodes) {
      if (personalVector) {
        newRanks.set(nodeId, (1 - dampingFactor) * (personalVector.get(nodeId) ?? 0));
      } else {
        newRanks.set(nodeId, (1 - dampingFactor) / n);
      }
    }
    let danglingSum = 0;
    for (const danglingNode of danglingNodes) {
      danglingSum += ranks.get(danglingNode) ?? 0;
    }
    if (danglingSum > 0) {
      const danglingContribution = dampingFactor * danglingSum / n;
      for (const nodeId of nodes) {
        const currentRank = newRanks.get(nodeId) ?? 0;
        if (personalVector) {
          const personalContrib = danglingContribution * (personalVector.get(nodeId) ?? 0);
          newRanks.set(nodeId, currentRank + personalContrib);
        } else {
          newRanks.set(nodeId, currentRank + danglingContribution);
        }
      }
    }
    for (const nodeId of nodes) {
      const currentRank = ranks.get(nodeId) ?? 0;
      const nodeOutWeight = outWeights.get(nodeId) ?? 0;
      if (nodeOutWeight > 0) {
        for (const neighbor of Array.from(graph.neighbors(nodeId))) {
          let edgeWeight = 1;
          if (weight) {
            const edge = graph.getEdge(nodeId, neighbor);
            edgeWeight = edge?.weight ?? 1;
          }
          const contribution = dampingFactor * currentRank * (edgeWeight / nodeOutWeight);
          const neighborRank = newRanks.get(neighbor) ?? 0;
          newRanks.set(neighbor, neighborRank + contribution);
        }
      }
    }
    let maxDiff = 0;
    for (const nodeId of nodes) {
      const oldRank = ranks.get(nodeId) ?? 0;
      const newRank = newRanks.get(nodeId) ?? 0;
      maxDiff = Math.max(maxDiff, Math.abs(newRank - oldRank));
    }
    ranks = newRanks;
    if (maxDiff < tolerance) {
      converged = true;
      break;
    }
  }
  const result = {};
  for (const nodeId of nodes) {
    result[String(nodeId)] = ranks.get(nodeId) ?? 0;
  }
  return {
    ranks: result,
    iterations: iteration + 1,
    converged
  };
}
function personalizedPageRank(graph, personalNodes, options = {}) {
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const personalization = /* @__PURE__ */ new Map();
  for (const nodeId of nodes) {
    personalization.set(nodeId, 0);
  }
  const personalValue = 1 / personalNodes.length;
  for (const personalNode of personalNodes) {
    if (!graph.hasNode(personalNode)) {
      throw new Error(`Personal node ${String(personalNode)} not found in graph`);
    }
    personalization.set(personalNode, personalValue);
  }
  return pageRank(graph, {
    ...options,
    personalization
  });
}
function pageRankCentrality(graph, options = {}) {
  const result = pageRank(graph, options);
  return result.ranks;
}
function topPageRankNodes(graph, k, options = {}) {
  const result = pageRank(graph, options);
  const nodeRanks = [];
  for (const [nodeStr, rank] of Object.entries(result.ranks)) {
    nodeRanks.push({ node: nodeStr, rank });
  }
  nodeRanks.sort((a, b) => b.rank - a.rank);
  return nodeRanks.slice(0, k);
}
function normalizeRanks(ranks) {
  let sum = 0;
  for (const rank of ranks.values()) {
    sum += rank;
  }
  if (sum > 0) {
    for (const [nodeId, rank] of Array.from(ranks)) {
      ranks.set(nodeId, rank / sum);
    }
  }
}
class UnionFind {
  constructor(elements) {
    this.parent = /* @__PURE__ */ new Map();
    this.rank = /* @__PURE__ */ new Map();
    this.componentCount = elements.length;
    for (const element of elements) {
      this.parent.set(element, element);
      this.rank.set(element, 0);
    }
  }
  /**
   * Find the root of the set containing the element with path compression
   */
  find(element) {
    const parent = this.parent.get(element);
    if (parent === void 0) {
      throw new Error(`Element ${String(element)} not found in UnionFind`);
    }
    if (parent !== element) {
      this.parent.set(element, this.find(parent));
    }
    const result = this.parent.get(element);
    if (result === void 0) {
      throw new Error(`Element ${String(element)} not found in UnionFind`);
    }
    return result;
  }
  /**
   * Union two sets using union by rank
   */
  union(elementA, elementB) {
    const rootA = this.find(elementA);
    const rootB = this.find(elementB);
    if (rootA === rootB) {
      return;
    }
    const rankA = this.rank.get(rootA);
    const rankB = this.rank.get(rootB);
    if (rankA === void 0 || rankB === void 0) {
      throw new Error("Rank not found for root elements");
    }
    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
    this.componentCount--;
  }
  /**
   * Check if two elements are in the same connected component
   */
  connected(elementA, elementB) {
    try {
      return this.find(elementA) === this.find(elementB);
    } catch {
      return false;
    }
  }
  /**
   * Get the number of connected components
   */
  getComponentCount() {
    return this.componentCount;
  }
  /**
   * Get all elements that belong to the same component as the given element
   */
  getComponent(element) {
    const root = this.find(element);
    const component = [];
    for (const [node] of Array.from(this.parent)) {
      if (this.find(node) === root) {
        component.push(node);
      }
    }
    return component;
  }
  /**
   * Get all connected components as separate arrays
   */
  getAllComponents() {
    const componentMap = /* @__PURE__ */ new Map();
    for (const [node] of Array.from(this.parent)) {
      const root = this.find(node);
      if (!componentMap.has(root)) {
        componentMap.set(root, []);
      }
      const component = componentMap.get(root);
      if (component) {
        component.push(node);
      }
    }
    return Array.from(componentMap.values());
  }
  /**
   * Get the size of the component containing the given element
   */
  getComponentSize(element) {
    return this.getComponent(element).length;
  }
  /**
   * Add a new element to the data structure
   */
  addElement(element) {
    if (this.parent.has(element)) {
      return;
    }
    this.parent.set(element, element);
    this.rank.set(element, 0);
    this.componentCount++;
  }
  /**
   * Check if an element exists in the data structure
   */
  hasElement(element) {
    return this.parent.has(element);
  }
  /**
   * Get the total number of elements
   */
  size() {
    return this.parent.size;
  }
}
function connectedComponents(graph) {
  if (graph.isDirected) {
    throw new Error("Connected components algorithm requires an undirected graph. Use stronglyConnectedComponents for directed graphs.");
  }
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  if (nodes.length === 0) {
    return [];
  }
  const unionFind = new UnionFind(nodes);
  for (const edge of Array.from(graph.edges())) {
    unionFind.union(edge.source, edge.target);
  }
  return unionFind.getAllComponents();
}
function connectedComponentsDFS(graph) {
  if (graph.isDirected) {
    throw new Error("Connected components algorithm requires an undirected graph");
  }
  const visited = /* @__PURE__ */ new Set();
  const components = [];
  for (const node of Array.from(graph.nodes())) {
    if (!visited.has(node.id)) {
      const component = [];
      dfsComponent(graph, node.id, visited, component);
      components.push(component);
    }
  }
  return components;
}
function dfsComponent(graph, nodeId, visited, component) {
  visited.add(nodeId);
  component.push(nodeId);
  for (const neighbor of Array.from(graph.neighbors(nodeId))) {
    if (!visited.has(neighbor)) {
      dfsComponent(graph, neighbor, visited, component);
    }
  }
}
function numberOfConnectedComponents(graph) {
  return connectedComponents(graph).length;
}
function isConnected(graph) {
  return numberOfConnectedComponents(graph) <= 1;
}
function largestConnectedComponent(graph) {
  const components = connectedComponents(graph);
  if (components.length === 0) {
    return [];
  }
  return components.reduce(
    (largest, current) => current.length > largest.length ? current : largest
  );
}
function getConnectedComponent(graph, nodeId) {
  if (!graph.hasNode(nodeId)) {
    throw new Error(`Node ${String(nodeId)} not found in graph`);
  }
  if (graph.isDirected) {
    throw new Error("Connected components algorithm requires an undirected graph");
  }
  const visited = /* @__PURE__ */ new Set();
  const component = [];
  dfsComponent(graph, nodeId, visited, component);
  return component;
}
function stronglyConnectedComponents(graph) {
  if (!graph.isDirected) {
    throw new Error("Strongly connected components require a directed graph");
  }
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  const components = [];
  const indices = /* @__PURE__ */ new Map();
  const lowLinks = /* @__PURE__ */ new Map();
  const onStack = /* @__PURE__ */ new Set();
  const stack = [];
  let index = 0;
  function tarjanSCC(nodeId) {
    indices.set(nodeId, index);
    lowLinks.set(nodeId, index);
    index++;
    stack.push(nodeId);
    onStack.add(nodeId);
    for (const neighbor of Array.from(graph.neighbors(nodeId))) {
      if (!indices.has(neighbor)) {
        tarjanSCC(neighbor);
        const nodeLL = lowLinks.get(nodeId) ?? 0;
        const neighborLL = lowLinks.get(neighbor) ?? 0;
        lowLinks.set(nodeId, Math.min(nodeLL, neighborLL));
      } else if (onStack.has(neighbor)) {
        const nodeLL = lowLinks.get(nodeId) ?? 0;
        const neighborIndex = indices.get(neighbor) ?? 0;
        lowLinks.set(nodeId, Math.min(nodeLL, neighborIndex));
      }
    }
    const nodeIndex = indices.get(nodeId) ?? 0;
    const nodeLowLink = lowLinks.get(nodeId) ?? 0;
    if (nodeLowLink === nodeIndex) {
      const component = [];
      let w;
      do {
        const popped = stack.pop();
        if (popped === void 0) {
          break;
        }
        w = popped;
        onStack.delete(w);
        component.push(w);
      } while (w !== nodeId);
      components.push(component);
    }
  }
  for (const nodeId of nodes) {
    if (!indices.has(nodeId)) {
      tarjanSCC(nodeId);
    }
  }
  return components;
}
function isStronglyConnected(graph) {
  if (!graph.isDirected) {
    throw new Error("Strong connectivity check requires a directed graph");
  }
  const components = stronglyConnectedComponents(graph);
  return components.length <= 1;
}
function weaklyConnectedComponents(graph) {
  if (!graph.isDirected) {
    throw new Error("Weakly connected components are for directed graphs. Use connectedComponents for undirected graphs.");
  }
  const nodes = Array.from(graph.nodes()).map((node) => node.id);
  if (nodes.length === 0) {
    return [];
  }
  const unionFind = new UnionFind(nodes);
  for (const edge of Array.from(graph.edges())) {
    unionFind.union(edge.source, edge.target);
  }
  return unionFind.getAllComponents();
}
function isWeaklyConnected(graph) {
  if (!graph.isDirected) {
    throw new Error("Weak connectivity check requires a directed graph");
  }
  return weaklyConnectedComponents(graph).length <= 1;
}
function condensationGraph(graph) {
  if (!graph.isDirected) {
    throw new Error("Condensation graph requires a directed graph");
  }
  const components = stronglyConnectedComponents(graph);
  const componentMap = /* @__PURE__ */ new Map();
  const condensedGraph = new graph.constructor({ directed: true });
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    if (component) {
      for (const nodeId of component) {
        componentMap.set(nodeId, i);
      }
      condensedGraph.addNode(i);
    }
  }
  const addedEdges = /* @__PURE__ */ new Set();
  for (const edge of Array.from(graph.edges())) {
    const sourceComponent = componentMap.get(edge.source);
    const targetComponent = componentMap.get(edge.target);
    if (sourceComponent !== void 0 && targetComponent !== void 0 && sourceComponent !== targetComponent) {
      const edgeKey = `${String(sourceComponent)}-${String(targetComponent)}`;
      if (!addedEdges.has(edgeKey)) {
        condensedGraph.addEdge(sourceComponent, targetComponent);
        addedEdges.add(edgeKey);
      }
    }
  }
  return {
    condensedGraph,
    componentMap,
    components
  };
}
function kruskalMST(graph) {
  if (graph.isDirected) {
    throw new Error("Kruskal's algorithm requires an undirected graph");
  }
  const edges = [];
  const visitedEdges = /* @__PURE__ */ new Set();
  for (const edge of Array.from(graph.edges())) {
    const edgeKey = edge.source < edge.target ? `${String(edge.source)}-${String(edge.target)}` : `${String(edge.target)}-${String(edge.source)}`;
    if (!visitedEdges.has(edgeKey)) {
      visitedEdges.add(edgeKey);
      edges.push(edge);
    }
  }
  edges.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
  const nodes = Array.from(graph.nodes()).map((n) => n.id);
  const uf = new UnionFind(nodes);
  const mstEdges = [];
  let totalWeight = 0;
  for (const edge of edges) {
    if (!uf.connected(edge.source, edge.target)) {
      uf.union(edge.source, edge.target);
      mstEdges.push(edge);
      totalWeight += edge.weight ?? 0;
      if (mstEdges.length === graph.nodeCount - 1) {
        break;
      }
    }
  }
  if (mstEdges.length !== graph.nodeCount - 1) {
    throw new Error("Graph is not connected");
  }
  return {
    edges: mstEdges,
    totalWeight
  };
}
function minimumSpanningTree(graph) {
  return kruskalMST(graph);
}
function primMST(graph, startNode) {
  if (graph.isDirected) {
    throw new Error("Prim's algorithm requires an undirected graph");
  }
  const nodes = Array.from(graph.nodes());
  if (nodes.length === 0) {
    return {
      edges: [],
      totalWeight: 0
    };
  }
  const start = startNode ?? nodes[0]?.id;
  if (!start) {
    return {
      edges: [],
      totalWeight: 0
    };
  }
  if (!graph.hasNode(start)) {
    throw new Error(`Start node ${String(start)} not found in graph`);
  }
  const visited = /* @__PURE__ */ new Set();
  const mstEdges = [];
  let totalWeight = 0;
  const pq = new PriorityQueue();
  visited.add(start);
  for (const neighbor of Array.from(graph.neighbors(start))) {
    const edge = graph.getEdge(start, neighbor);
    if (edge) {
      pq.enqueue(edge, edge.weight ?? 0);
    }
  }
  while (!pq.isEmpty() && mstEdges.length < graph.nodeCount - 1) {
    const edge = pq.dequeue();
    if (!edge) {
      continue;
    }
    const unvisitedNode = visited.has(edge.source) ? edge.target : edge.source;
    if (visited.has(unvisitedNode)) {
      continue;
    }
    visited.add(unvisitedNode);
    mstEdges.push(edge);
    totalWeight += edge.weight ?? 0;
    for (const neighbor of Array.from(graph.neighbors(unvisitedNode))) {
      if (!visited.has(neighbor)) {
        const neighborEdge = graph.getEdge(unvisitedNode, neighbor);
        if (neighborEdge) {
          pq.enqueue(neighborEdge, neighborEdge.weight ?? 0);
        }
      }
    }
  }
  if (mstEdges.length !== graph.nodeCount - 1) {
    throw new Error("Graph is not connected");
  }
  return {
    edges: mstEdges,
    totalWeight
  };
}
function girvanNewman(graph, options = {}) {
  const { maxCommunities } = options;
  const minCommunitySize = options.minCommunitySize ?? 1;
  const dendrogram = [];
  const workingGraph = cloneGraph(graph);
  let components = getConnectedComponentsResult(workingGraph);
  dendrogram.push({
    communities: components.components.filter((community) => community.length >= minCommunitySize),
    modularity: calculateModularity$3(graph, components.componentMap)
  });
  while (Array.from(workingGraph.edges()).length > 0) {
    const edgeBetweenness = calculateEdgeBetweenness(workingGraph);
    if (edgeBetweenness.size === 0) {
      break;
    }
    const maxBetweenness = Math.max(...edgeBetweenness.values());
    const edgesToRemove = [];
    for (const [edgeKey, centrality] of edgeBetweenness) {
      if (Math.abs(centrality - maxBetweenness) < 1e-10) {
        const [source, target] = edgeKey.split("|");
        if (source && target) {
          edgesToRemove.push({ source, target });
        }
      }
    }
    for (const { source, target } of edgesToRemove) {
      workingGraph.removeEdge(source, target);
    }
    components = getConnectedComponentsResult(workingGraph);
    const validCommunities = components.components.filter(
      (community) => community.length >= minCommunitySize
    );
    const modularity = calculateModularity$3(graph, components.componentMap);
    dendrogram.push({
      communities: validCommunities,
      modularity
    });
    if (maxCommunities && validCommunities.length >= maxCommunities) {
      break;
    }
    if (validCommunities.length === workingGraph.nodeCount) {
      break;
    }
  }
  return dendrogram;
}
function calculateEdgeBetweenness(graph) {
  const edgeBetweenness = /* @__PURE__ */ new Map();
  for (const edge of graph.edges()) {
    const edgeKey = getEdgeKey(edge.source, edge.target);
    edgeBetweenness.set(edgeKey, 0);
  }
  for (const sourceNode of graph.nodes()) {
    const source = sourceNode.id;
    const { distances, predecessors, pathCounts } = findAllShortestPaths(graph, source);
    const dependency = /* @__PURE__ */ new Map();
    for (const node of graph.nodes()) {
      dependency.set(node.id, 0);
    }
    const sortedNodes = Array.from(distances.keys()).filter((node) => {
      const distance = distances.get(node);
      return distance !== void 0 && distance < Infinity;
    }).sort((a, b) => {
      const distanceA = distances.get(a);
      const distanceB = distances.get(b);
      if (distanceA === void 0 || distanceB === void 0) {
        return 0;
      }
      return distanceB - distanceA;
    });
    for (const node of sortedNodes) {
      if (node === source) {
        continue;
      }
      const nodeDependency = dependency.get(node);
      const nodePathCount = pathCounts.get(node);
      if (nodeDependency === void 0 || nodePathCount === void 0) {
        continue;
      }
      const nodePredecessors = predecessors.get(node) ?? [];
      for (const predecessor of nodePredecessors) {
        const predPathCount = pathCounts.get(predecessor);
        if (predPathCount === void 0) {
          continue;
        }
        const edgeDependency = predPathCount / nodePathCount * (1 + nodeDependency);
        const currentDependency = dependency.get(predecessor);
        if (currentDependency !== void 0) {
          dependency.set(predecessor, currentDependency + edgeDependency);
        }
        const edgeKey = getEdgeKey(predecessor, node);
        const currentBetweenness = edgeBetweenness.get(edgeKey) ?? 0;
        edgeBetweenness.set(edgeKey, currentBetweenness + edgeDependency);
      }
    }
  }
  if (!graph.isDirected) {
    for (const [edgeKey, betweenness] of edgeBetweenness) {
      edgeBetweenness.set(edgeKey, betweenness / 2);
    }
  }
  return edgeBetweenness;
}
function findAllShortestPaths(graph, source) {
  const distances = /* @__PURE__ */ new Map();
  const predecessors = /* @__PURE__ */ new Map();
  const pathCounts = /* @__PURE__ */ new Map();
  const queue = [];
  for (const node of graph.nodes()) {
    distances.set(node.id, Infinity);
    predecessors.set(node.id, []);
    pathCounts.set(node.id, 0);
  }
  distances.set(source, 0);
  pathCounts.set(source, 1);
  queue.push(source);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === void 0) {
      break;
    }
    const currentDistance = distances.get(current);
    if (currentDistance === void 0) {
      continue;
    }
    for (const neighbor of graph.neighbors(current)) {
      const edge = graph.getEdge(current, neighbor);
      const edgeWeight = edge?.weight ?? 1;
      const newDistance = currentDistance + edgeWeight;
      const neighborDistance = distances.get(neighbor);
      if (neighborDistance === void 0) {
        continue;
      }
      if (newDistance < neighborDistance) {
        distances.set(neighbor, newDistance);
        predecessors.set(neighbor, [current]);
        const currentPathCount = pathCounts.get(current);
        if (currentPathCount !== void 0) {
          pathCounts.set(neighbor, currentPathCount);
        }
        queue.push(neighbor);
      } else if (Math.abs(newDistance - neighborDistance) < 1e-10) {
        const neighborPredecessors = predecessors.get(neighbor);
        const neighborPathCount = pathCounts.get(neighbor);
        const currentPathCount = pathCounts.get(current);
        if (neighborPredecessors && neighborPathCount !== void 0 && currentPathCount !== void 0) {
          neighborPredecessors.push(current);
          pathCounts.set(neighbor, neighborPathCount + currentPathCount);
        }
      }
    }
  }
  return { distances, predecessors, pathCounts };
}
function getEdgeKey(source, target) {
  const sourceStr = String(source);
  const targetStr = String(target);
  if (sourceStr <= targetStr) {
    return `${sourceStr}|${targetStr}`;
  }
  return `${targetStr}|${sourceStr}`;
}
function calculateModularity$3(graph, communityMap) {
  const totalEdgeWeight = getTotalEdgeWeight$1(graph);
  if (totalEdgeWeight === 0) {
    return 0;
  }
  let modularity = 0;
  for (const nodeI of graph.nodes()) {
    for (const nodeJ of graph.nodes()) {
      if (communityMap.get(nodeI.id) === communityMap.get(nodeJ.id)) {
        const edge = graph.getEdge(nodeI.id, nodeJ.id);
        const edgeWeight = edge?.weight ?? 0;
        const degreeI = getNodeDegree$1(graph, nodeI.id);
        const degreeJ = getNodeDegree$1(graph, nodeJ.id);
        modularity += edgeWeight - degreeI * degreeJ / (2 * totalEdgeWeight);
      }
    }
  }
  return modularity / (2 * totalEdgeWeight);
}
function getTotalEdgeWeight$1(graph) {
  let totalWeight = 0;
  for (const edge of graph.edges()) {
    totalWeight += edge.weight ?? 1;
  }
  return totalWeight;
}
function getNodeDegree$1(graph, nodeId) {
  let degree = 0;
  for (const neighbor of graph.neighbors(nodeId)) {
    const edge = graph.getEdge(nodeId, neighbor);
    degree += edge?.weight ?? 1;
  }
  return degree;
}
function getConnectedComponentsResult(graph) {
  const components = connectedComponents(graph);
  const componentMap = /* @__PURE__ */ new Map();
  components.forEach((component, index) => {
    component.forEach((nodeId) => {
      componentMap.set(nodeId, index);
    });
  });
  return { components, componentMap };
}
function cloneGraph(graph) {
  const clone = new Graph({
    directed: graph.isDirected,
    allowSelfLoops: true,
    allowParallelEdges: false
  });
  for (const node of graph.nodes()) {
    clone.addNode(node.id, node.data);
  }
  for (const edge of graph.edges()) {
    clone.addEdge(edge.source, edge.target, edge.weight, edge.data);
  }
  return clone;
}
function labelPropagation(graph, options = {}) {
  const {
    maxIterations = 100,
    randomSeed = 42
  } = options;
  if (graph.size === 0) {
    return {
      communities: /* @__PURE__ */ new Map(),
      iterations: 0,
      converged: true
    };
  }
  let seed = randomSeed;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 2147483647;
    return seed / 2147483647;
  };
  const labels = /* @__PURE__ */ new Map();
  const nodes = Array.from(graph.keys());
  nodes.forEach((node, i) => labels.set(node, i));
  let iterations = 0;
  let converged = false;
  while (iterations < maxIterations && !converged) {
    iterations++;
    converged = true;
    const nodeOrder = [...nodes];
    shuffle$1(nodeOrder, random);
    for (const node of nodeOrder) {
      const neighbors = graph.get(node);
      if (!neighbors || neighbors.size === 0) {
        continue;
      }
      const labelCounts = /* @__PURE__ */ new Map();
      let maxCount = 0;
      const candidateLabels = [];
      for (const [neighbor, weight] of neighbors) {
        const neighborLabel = labels.get(neighbor);
        if (neighborLabel === void 0) {
          continue;
        }
        const count = (labelCounts.get(neighborLabel) ?? 0) + weight;
        labelCounts.set(neighborLabel, count);
        if (count > maxCount) {
          maxCount = count;
          candidateLabels.length = 0;
          candidateLabels.push(neighborLabel);
        } else if (count === maxCount) {
          candidateLabels.push(neighborLabel);
        }
      }
      const currentLabel = labels.get(node);
      if (currentLabel === void 0) {
        continue;
      }
      let newLabel = currentLabel;
      if (candidateLabels.length > 0) {
        if (labelCounts.get(currentLabel) === maxCount) {
          candidateLabels.push(currentLabel);
        }
        const index = Math.floor(random() * candidateLabels.length);
        const selectedLabel = candidateLabels[index];
        if (selectedLabel !== void 0) {
          newLabel = selectedLabel;
        }
      }
      if (newLabel !== currentLabel) {
        labels.set(node, newLabel);
        converged = false;
      }
    }
  }
  const uniqueLabels = new Set(labels.values());
  const labelMap = /* @__PURE__ */ new Map();
  let communityId = 0;
  for (const label of uniqueLabels) {
    labelMap.set(label, communityId++);
  }
  const communities = /* @__PURE__ */ new Map();
  for (const [node, label] of labels) {
    const mappedLabel = labelMap.get(label);
    if (mappedLabel !== void 0) {
      communities.set(node, mappedLabel);
    }
  }
  return {
    communities,
    iterations,
    converged
  };
}
function labelPropagationAsync(graph, options = {}) {
  const {
    maxIterations = 100
  } = options;
  if (graph.size === 0) {
    return {
      communities: /* @__PURE__ */ new Map(),
      iterations: 0,
      converged: true
    };
  }
  const labels = /* @__PURE__ */ new Map();
  const nodes = Array.from(graph.keys());
  nodes.forEach((node, i) => labels.set(node, i));
  let iterations = 0;
  let converged = false;
  while (iterations < maxIterations && !converged) {
    iterations++;
    converged = true;
    const newLabels = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      const neighbors = graph.get(node);
      if (!neighbors || neighbors.size === 0) {
        const nodeLabel2 = labels.get(node);
        if (nodeLabel2 !== void 0) {
          newLabels.set(node, nodeLabel2);
        }
        continue;
      }
      const labelCounts = /* @__PURE__ */ new Map();
      let maxCount = 0;
      const nodeLabel = labels.get(node);
      if (nodeLabel === void 0) {
        continue;
      }
      let maxLabel = nodeLabel;
      for (const [neighbor, weight] of neighbors) {
        const neighborLabel = labels.get(neighbor);
        if (neighborLabel === void 0) {
          continue;
        }
        const count = (labelCounts.get(neighborLabel) ?? 0) + weight;
        labelCounts.set(neighborLabel, count);
        if (count > maxCount || count === maxCount && neighborLabel < maxLabel) {
          maxCount = count;
          maxLabel = neighborLabel;
        }
      }
      newLabels.set(node, maxLabel);
      if (maxLabel !== labels.get(node)) {
        converged = false;
      }
    }
    for (const [node, label] of newLabels) {
      labels.set(node, label);
    }
  }
  const uniqueLabels = new Set(labels.values());
  const labelMap = /* @__PURE__ */ new Map();
  let communityId = 0;
  for (const label of uniqueLabels) {
    labelMap.set(label, communityId++);
  }
  const communities = /* @__PURE__ */ new Map();
  for (const [node, label] of labels) {
    const mappedLabel = labelMap.get(label);
    if (mappedLabel !== void 0) {
      communities.set(node, mappedLabel);
    }
  }
  return {
    communities,
    iterations,
    converged
  };
}
function labelPropagationSemiSupervised(graph, seedLabels, options = {}) {
  const {
    maxIterations = 100,
    randomSeed = 42
  } = options;
  let seed = randomSeed;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 2147483647;
    return seed / 2147483647;
  };
  const labels = /* @__PURE__ */ new Map();
  const nodes = Array.from(graph.keys());
  let labelCounter = Math.max(...Array.from(seedLabels.values())) + 1;
  for (const node of nodes) {
    if (seedLabels.has(node)) {
      const seedLabel = seedLabels.get(node);
      if (seedLabel !== void 0) {
        labels.set(node, seedLabel);
      }
    } else {
      labels.set(node, labelCounter++);
    }
  }
  let iterations = 0;
  let converged = false;
  while (iterations < maxIterations && !converged) {
    iterations++;
    converged = true;
    const nodeOrder = nodes.filter((n) => !seedLabels.has(n));
    shuffle$1(nodeOrder, random);
    for (const node of nodeOrder) {
      const neighbors = graph.get(node);
      if (!neighbors || neighbors.size === 0) {
        continue;
      }
      const labelCounts = /* @__PURE__ */ new Map();
      let maxCount = 0;
      const candidateLabels = [];
      for (const [neighbor, weight] of neighbors) {
        const neighborLabel = labels.get(neighbor);
        if (neighborLabel === void 0) {
          continue;
        }
        const count = (labelCounts.get(neighborLabel) ?? 0) + weight;
        labelCounts.set(neighborLabel, count);
        if (count > maxCount) {
          maxCount = count;
          candidateLabels.length = 0;
          candidateLabels.push(neighborLabel);
        } else if (count === maxCount) {
          candidateLabels.push(neighborLabel);
        }
      }
      const currentLabel = labels.get(node);
      if (currentLabel === void 0) {
        continue;
      }
      let newLabel = currentLabel;
      if (candidateLabels.length > 0) {
        const index = Math.floor(random() * candidateLabels.length);
        const selectedLabel = candidateLabels[index];
        if (selectedLabel !== void 0) {
          newLabel = selectedLabel;
        }
      }
      if (newLabel !== currentLabel) {
        labels.set(node, newLabel);
        converged = false;
      }
    }
  }
  return {
    communities: labels,
    iterations,
    converged
  };
}
function shuffle$1(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = array[i];
    const swapItem = array[j];
    if (temp !== void 0 && swapItem !== void 0) {
      array[i] = swapItem;
      array[j] = temp;
    }
  }
}
function leiden(graph, options = {}) {
  const {
    resolution = 1,
    randomSeed = 42,
    maxIterations = 100,
    threshold = 1e-7
  } = options;
  if (graph.size === 0) {
    return {
      communities: /* @__PURE__ */ new Map(),
      modularity: 0,
      iterations: 0
    };
  }
  let seed = randomSeed;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 2147483647;
    return seed / 2147483647;
  };
  let totalWeight = 0;
  const degrees = /* @__PURE__ */ new Map();
  for (const [node, neighbors] of graph) {
    let degree = 0;
    for (const weight of neighbors.values()) {
      degree += weight;
      totalWeight += weight;
    }
    degrees.set(node, degree);
  }
  totalWeight /= 2;
  const communities = /* @__PURE__ */ new Map();
  const nodes = Array.from(graph.keys());
  nodes.forEach((node, i) => communities.set(node, i));
  let modularity = calculateModularity$2(graph, communities, degrees, totalWeight, resolution);
  let bestModularity = modularity;
  let bestCommunities = new Map(communities);
  let iterations = 0;
  while (iterations < maxIterations) {
    iterations++;
    let improved = false;
    const nodeOrder = [...nodes];
    shuffle(nodeOrder, random);
    for (const node of nodeOrder) {
      const currentCommunity = communities.get(node);
      if (currentCommunity === void 0) {
        continue;
      }
      const neighborCommunities = getNeighborCommunities$1(node, graph, communities);
      let bestCommunity = currentCommunity;
      let bestGain = 0;
      for (const [community] of neighborCommunities) {
        if (community === currentCommunity) {
          continue;
        }
        const gain = calculateModularityGain(
          node,
          community,
          graph,
          communities,
          degrees,
          totalWeight,
          resolution
        );
        if (gain > bestGain) {
          bestGain = gain;
          bestCommunity = community;
        }
      }
      if (bestCommunity !== currentCommunity) {
        communities.set(node, bestCommunity);
        modularity += bestGain;
        improved = true;
      }
    }
    createAggregateNetwork(graph, communities);
    const subsetPartition = refinePartition(
      graph,
      communities
    );
    for (const [node, newCommunity] of subsetPartition) {
      communities.set(node, newCommunity);
    }
    modularity = calculateModularity$2(graph, communities, degrees, totalWeight, resolution);
    if (modularity > bestModularity + threshold) {
      bestModularity = modularity;
      bestCommunities = new Map(communities);
      improved = true;
    }
    if (!improved) {
      break;
    }
    const aggregated = aggregateCommunities(graph, communities);
    if (aggregated.graph.size === graph.size) {
      break;
    }
    const { graph: newGraph } = aggregated;
    graph = newGraph;
    communities.clear();
    let communityId = 0;
    for (const node of graph.keys()) {
      communities.set(node, communityId++);
    }
  }
  const finalCommunities = /* @__PURE__ */ new Map();
  for (const [node, community] of bestCommunities) {
    finalCommunities.set(node, community);
  }
  const communityRenumber = /* @__PURE__ */ new Map();
  let newId = 0;
  for (const community of new Set(finalCommunities.values())) {
    communityRenumber.set(community, newId++);
  }
  for (const [node, community] of finalCommunities) {
    const newCommunityId = communityRenumber.get(community);
    if (newCommunityId !== void 0) {
      finalCommunities.set(node, newCommunityId);
    }
  }
  return {
    communities: finalCommunities,
    modularity: bestModularity,
    iterations
  };
}
function calculateModularity$2(graph, communities, degrees, totalWeight, resolution) {
  let modularity = 0;
  const communityWeights = /* @__PURE__ */ new Map();
  for (const [node, neighbors] of graph) {
    const nodeCommunity = communities.get(node);
    if (nodeCommunity === void 0) {
      continue;
    }
    for (const [neighbor, weight] of neighbors) {
      const neighborCommunity = communities.get(neighbor);
      if (neighborCommunity === void 0) {
        continue;
      }
      if (nodeCommunity === neighborCommunity) {
        modularity += weight;
      }
    }
    const degree = degrees.get(node);
    if (degree !== void 0) {
      communityWeights.set(nodeCommunity, (communityWeights.get(nodeCommunity) ?? 0) + degree);
    }
  }
  if (totalWeight === 0) {
    return 0;
  }
  modularity /= 2 * totalWeight;
  for (const weight of communityWeights.values()) {
    modularity -= resolution * (weight / (2 * totalWeight)) ** 2;
  }
  return modularity;
}
function getNeighborCommunities$1(node, graph, communities) {
  const neighborCommunities = /* @__PURE__ */ new Map();
  const neighbors = graph.get(node);
  if (neighbors) {
    for (const [neighbor, weight] of neighbors) {
      const community = communities.get(neighbor);
      if (community !== void 0) {
        neighborCommunities.set(community, (neighborCommunities.get(community) ?? 0) + weight);
      }
    }
  }
  return neighborCommunities;
}
function calculateModularityGain(node, targetCommunity, graph, communities, degrees, totalWeight, resolution) {
  const currentCommunity = communities.get(node);
  const nodeDegree = degrees.get(node);
  if (currentCommunity === void 0 || nodeDegree === void 0) {
    return 0;
  }
  let weightToTarget = 0;
  let weightToCurrent = 0;
  const neighbors = graph.get(node);
  if (neighbors) {
    for (const [neighbor, weight] of neighbors) {
      const neighborCommunity = communities.get(neighbor);
      if (neighborCommunity === void 0) {
        continue;
      }
      if (neighborCommunity === targetCommunity) {
        weightToTarget += weight;
      } else if (neighborCommunity === currentCommunity && neighbor !== node) {
        weightToCurrent += weight;
      }
    }
  }
  let targetDegree = 0;
  let currentDegree = 0;
  for (const [n, c] of communities) {
    if (c === targetCommunity && n !== node) {
      const deg = degrees.get(n);
      if (deg !== void 0) {
        targetDegree += deg;
      }
    } else if (c === currentCommunity && n !== node) {
      const deg = degrees.get(n);
      if (deg !== void 0) {
        currentDegree += deg;
      }
    }
  }
  const m2 = 2 * totalWeight;
  const gain = (weightToTarget - weightToCurrent) / totalWeight - resolution * nodeDegree * (targetDegree - currentDegree) / (m2 * m2);
  return gain;
}
function createAggregateNetwork(graph, communities) {
  const aggregateGraph = /* @__PURE__ */ new Map();
  const nodeMapping = /* @__PURE__ */ new Map();
  for (const [node, community] of communities) {
    nodeMapping.set(node, community);
    if (!aggregateGraph.has(community)) {
      aggregateGraph.set(community, /* @__PURE__ */ new Map());
    }
  }
  for (const [node, neighbors] of graph) {
    const sourceCommunity = communities.get(node);
    if (sourceCommunity === void 0) {
      continue;
    }
    for (const [neighbor, weight] of neighbors) {
      const targetCommunity = communities.get(neighbor);
      if (targetCommunity === void 0) {
        continue;
      }
      const sourceNeighbors = aggregateGraph.get(sourceCommunity);
      if (sourceNeighbors) {
        const current = sourceNeighbors.get(targetCommunity) ?? 0;
        sourceNeighbors.set(targetCommunity, current + weight);
      }
    }
  }
  return { aggregateGraph, nodeMapping };
}
function refinePartition(originalGraph, communities) {
  const refined = /* @__PURE__ */ new Map();
  const communityNodes = /* @__PURE__ */ new Map();
  for (const [node, community] of communities) {
    if (!communityNodes.has(community)) {
      communityNodes.set(community, []);
    }
    const nodes = communityNodes.get(community);
    if (nodes) {
      nodes.push(node);
    }
  }
  let newCommunityId = 0;
  for (const [community, nodes] of communityNodes) {
    if (nodes.length === 1) {
      const singleNode = nodes[0];
      if (singleNode) {
        refined.set(singleNode, newCommunityId++);
      }
      continue;
    }
    const subgraph = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      subgraph.set(node, /* @__PURE__ */ new Set());
      const neighbors = originalGraph.get(node);
      if (neighbors) {
        for (const [neighbor] of neighbors) {
          if (communities.get(neighbor) === community) {
            const nodeSet = subgraph.get(node);
            if (nodeSet) {
              nodeSet.add(neighbor);
            }
          }
        }
      }
    }
    const components = findConnectedComponents(subgraph);
    for (const component of components) {
      for (const node of component) {
        refined.set(node, newCommunityId);
      }
      newCommunityId++;
    }
  }
  return refined;
}
function findConnectedComponents(graph) {
  const visited = /* @__PURE__ */ new Set();
  const components = [];
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const component = /* @__PURE__ */ new Set();
      const queue = [node];
      while (queue.length > 0) {
        const current = queue.shift();
        if (current === void 0 || visited.has(current)) {
          continue;
        }
        visited.add(current);
        component.add(current);
        const neighbors = graph.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }
      components.push(component);
    }
  }
  return components;
}
function aggregateCommunities(graph, communities) {
  const aggregated = /* @__PURE__ */ new Map();
  const mapping = /* @__PURE__ */ new Map();
  const communityNodes = /* @__PURE__ */ new Map();
  for (const community of new Set(communities.values())) {
    const superNode = `super_${String(community)}`;
    communityNodes.set(community, superNode);
    aggregated.set(superNode, /* @__PURE__ */ new Map());
  }
  for (const [node, community] of communities) {
    const superNode = communityNodes.get(community);
    if (superNode !== void 0) {
      mapping.set(node, superNode);
    }
  }
  for (const [node, neighbors] of graph) {
    const sourceCommunity = communities.get(node);
    if (sourceCommunity === void 0) {
      continue;
    }
    const sourceSuper = communityNodes.get(sourceCommunity);
    if (sourceSuper === void 0) {
      continue;
    }
    for (const [neighbor, weight] of neighbors) {
      const targetCommunity = communities.get(neighbor);
      if (targetCommunity === void 0) {
        continue;
      }
      const targetSuper = communityNodes.get(targetCommunity);
      if (targetSuper === void 0) {
        continue;
      }
      if (sourceSuper !== targetSuper) {
        const sourceNeighbors = aggregated.get(sourceSuper);
        if (sourceNeighbors) {
          const current = sourceNeighbors.get(targetSuper) ?? 0;
          sourceNeighbors.set(targetSuper, current + weight);
        }
      }
    }
  }
  return { graph: aggregated, mapping };
}
function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = array[i];
    const swapItem = array[j];
    if (temp !== void 0 && swapItem !== void 0) {
      array[i] = swapItem;
      array[j] = temp;
    }
  }
}
function louvain(graph, options = {}) {
  const resolution = options.resolution ?? 1;
  const maxIterations = options.maxIterations ?? 100;
  const tolerance = options.tolerance ?? 1e-6;
  const communities = initializeCommunities(graph);
  let modularity = calculateModularity$1(graph, communities, resolution);
  let iteration = 0;
  let improved = true;
  while (iteration < maxIterations && improved) {
    improved = louvainPhase1(graph, communities, resolution);
    if (improved) {
      const newModularity = calculateModularity$1(graph, communities, resolution);
      if (newModularity - modularity < tolerance) {
        break;
      }
      modularity = newModularity;
      iteration++;
    }
  }
  return {
    communities: extractCommunities(communities),
    modularity: calculateModularity$1(graph, communities, resolution),
    iterations: iteration
  };
}
function initializeCommunities(graph) {
  const communities = /* @__PURE__ */ new Map();
  let communityId = 0;
  for (const node of graph.nodes()) {
    communities.set(node.id, communityId++);
  }
  return communities;
}
function louvainPhase1(graph, communities, resolution) {
  let globalImprovement = false;
  let localImprovement = true;
  while (localImprovement) {
    localImprovement = false;
    for (const node of graph.nodes()) {
      const nodeId = node.id;
      const currentCommunity = communities.get(nodeId);
      if (currentCommunity === void 0) {
        continue;
      }
      const currentModularity = nodeModularityContribution(
        graph,
        nodeId,
        currentCommunity,
        communities,
        resolution
      );
      let bestCommunity = currentCommunity;
      let bestModularity = currentModularity;
      const neighborCommunities = getNeighborCommunities(graph, nodeId, communities);
      for (const neighborCommunity of neighborCommunities) {
        if (neighborCommunity === currentCommunity) {
          continue;
        }
        const newModularity = nodeModularityContribution(
          graph,
          nodeId,
          neighborCommunity,
          communities,
          resolution
        );
        if (newModularity > bestModularity) {
          bestModularity = newModularity;
          bestCommunity = neighborCommunity;
        }
      }
      if (bestCommunity !== currentCommunity) {
        communities.set(nodeId, bestCommunity);
        localImprovement = true;
        globalImprovement = true;
      }
    }
  }
  return globalImprovement;
}
function nodeModularityContribution(graph, nodeId, community, communities, resolution) {
  const totalEdgeWeight = getTotalEdgeWeight(graph);
  if (totalEdgeWeight === 0) {
    return 0;
  }
  let internalLinks = 0;
  let nodeDegree = 0;
  let communityDegree = 0;
  for (const neighbor of graph.neighbors(nodeId)) {
    const edge = graph.getEdge(nodeId, neighbor);
    const weight = edge?.weight ?? 1;
    nodeDegree += weight;
    if (communities.get(neighbor) === community) {
      internalLinks += weight;
    }
  }
  for (const [otherNodeId, otherCommunity] of communities) {
    if (otherCommunity === community && otherNodeId !== nodeId) {
      communityDegree += getNodeDegree(graph, otherNodeId);
    }
  }
  const modularityIncrease = (internalLinks - resolution * nodeDegree * communityDegree / (2 * totalEdgeWeight)) / totalEdgeWeight;
  return modularityIncrease;
}
function getNeighborCommunities(graph, nodeId, communities) {
  const neighborCommunities = /* @__PURE__ */ new Set();
  for (const neighbor of graph.neighbors(nodeId)) {
    const community = communities.get(neighbor);
    if (community !== void 0) {
      neighborCommunities.add(community);
    }
  }
  return neighborCommunities;
}
function calculateModularity$1(graph, communities, resolution) {
  const totalEdgeWeight = getTotalEdgeWeight(graph);
  if (totalEdgeWeight === 0) {
    return 0;
  }
  let modularity = 0;
  const countedEdges = /* @__PURE__ */ new Set();
  for (const nodeI of graph.nodes()) {
    for (const nodeJ of graph.nodes()) {
      if (!graph.isDirected) {
        const nodeIStr = String(nodeI.id);
        const nodeJStr = String(nodeJ.id);
        const edgeKey = nodeIStr <= nodeJStr ? `${nodeIStr}-${nodeJStr}` : `${nodeJStr}-${nodeIStr}`;
        if (countedEdges.has(edgeKey)) {
          continue;
        }
        countedEdges.add(edgeKey);
      }
      if (communities.get(nodeI.id) === communities.get(nodeJ.id)) {
        const edge = graph.getEdge(nodeI.id, nodeJ.id);
        const reverseEdge = !graph.isDirected ? graph.getEdge(nodeJ.id, nodeI.id) : null;
        let edgeWeight = 0;
        if (edge) {
          edgeWeight += edge.weight ?? 1;
        }
        if (reverseEdge && nodeI.id !== nodeJ.id) {
          edgeWeight += reverseEdge.weight ?? 1;
        }
        const degreeI = getNodeDegree(graph, nodeI.id);
        const degreeJ = getNodeDegree(graph, nodeJ.id);
        modularity += edgeWeight - resolution * degreeI * degreeJ / (2 * totalEdgeWeight);
      }
    }
  }
  return modularity / (2 * totalEdgeWeight);
}
function extractCommunities(communities) {
  const communityMap = /* @__PURE__ */ new Map();
  for (const [nodeId, community] of communities) {
    if (!communityMap.has(community)) {
      communityMap.set(community, []);
    }
    const communityNodes = communityMap.get(community);
    if (communityNodes) {
      communityNodes.push(nodeId);
    }
  }
  return Array.from(communityMap.values());
}
function getTotalEdgeWeight(graph) {
  let totalWeight = 0;
  for (const edge of graph.edges()) {
    totalWeight += edge.weight ?? 1;
  }
  return totalWeight;
}
function getNodeDegree(graph, nodeId) {
  let degree = 0;
  for (const neighbor of graph.neighbors(nodeId)) {
    const edge = graph.getEdge(nodeId, neighbor);
    degree += edge?.weight ?? 1;
  }
  return degree;
}
class MinPriorityQueue {
  constructor(compareFunction) {
    this.heap = [];
    this.compare = compareFunction ?? ((a, b) => this.defaultCompare(a, b));
  }
  defaultCompare(a, b) {
    const aWithDistance = a;
    const bWithDistance = b;
    if (aWithDistance.distance !== void 0 && bWithDistance.distance !== void 0) {
      return aWithDistance.distance - bWithDistance.distance;
    }
    return 0;
  }
  parent(i) {
    return Math.floor((i - 1) / 2);
  }
  leftChild(i) {
    return 2 * i + 1;
  }
  rightChild(i) {
    return 2 * i + 2;
  }
  swap(i, j) {
    const temp = this.heap[i];
    const temp2 = this.heap[j];
    if (temp !== void 0 && temp2 !== void 0) {
      this.heap[i] = temp2;
      this.heap[j] = temp;
    }
  }
  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.parent(index);
      const current = this.heap[index];
      const parent = this.heap[parentIndex];
      if (current !== void 0 && parent !== void 0 && this.compare(current, parent) < 0) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }
  heapifyDown(index) {
    while (index < this.heap.length) {
      let minIndex = index;
      const left = this.leftChild(index);
      const right = this.rightChild(index);
      const leftItem = this.heap[left];
      const minItem = this.heap[minIndex];
      if (left < this.heap.length && leftItem !== void 0 && minItem !== void 0 && this.compare(leftItem, minItem) < 0) {
        minIndex = left;
      }
      const rightItem = this.heap[right];
      const newMinItem = this.heap[minIndex];
      if (right < this.heap.length && rightItem !== void 0 && newMinItem !== void 0 && this.compare(rightItem, newMinItem) < 0) {
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
  insert(value) {
    this.heap.push(value);
    this.heapifyUp(this.heap.length - 1);
  }
  extractMin() {
    if (this.heap.length === 0) {
      return void 0;
    }
    if (this.heap.length === 1) {
      return this.heap.pop();
    }
    const min = this.heap[0];
    const last = this.heap.pop();
    if (last !== void 0) {
      this.heap[0] = last;
      this.heapifyDown(0);
    }
    return min;
  }
  peek() {
    return this.heap[0];
  }
  isEmpty() {
    return this.heap.length === 0;
  }
  size() {
    return this.heap.length;
  }
}
const pathfindingUtils = {
  /**
  * Reconstructs a path from start to goal using the cameFrom map
  */
  reconstructPath(cameFrom, goal) {
    const path = [goal];
    let current = goal;
    while (cameFrom.has(current)) {
      const next = cameFrom.get(current);
      if (next === void 0) {
        break;
      }
      current = next;
      path.unshift(current);
    }
    return path;
  },
  /**
  * Creates a grid graph for testing pathfinding algorithms
  */
  createGridGraph(width, height, obstacles = /* @__PURE__ */ new Set()) {
    const graph = /* @__PURE__ */ new Map();
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const node = `${String(x)},${String(y)}`;
        if (obstacles.has(node)) {
          continue;
        }
        const neighbors = /* @__PURE__ */ new Map();
        const directions = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0]
        ];
        for (const dir of directions) {
          const dx = dir[0];
          const dy = dir[1];
          if (dx === void 0 || dy === void 0) {
            continue;
          }
          const nx = x + dx;
          const ny = y + dy;
          const neighbor = `${String(nx)},${String(ny)}`;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && !obstacles.has(neighbor)) {
            neighbors.set(neighbor, 1);
          }
        }
        graph.set(node, neighbors);
      }
    }
    return graph;
  },
  /**
  * Parses a grid coordinate string
  */
  parseGridCoordinate(coord) {
    const parts = coord.split(",").map(Number);
    const x = parts[0];
    const y = parts[1];
    if (x === void 0 || y === void 0) {
      throw new Error(`Invalid coordinate: ${coord}`);
    }
    return [x, y];
  }
};
function astar(graph, start, goal, heuristic) {
  if (!graph.has(start) || !graph.has(goal)) {
    return null;
  }
  const openSet = new MinPriorityQueue();
  const gScore = /* @__PURE__ */ new Map();
  const fScore = /* @__PURE__ */ new Map();
  const cameFrom = /* @__PURE__ */ new Map();
  const closedSet = /* @__PURE__ */ new Set();
  gScore.set(start, 0);
  fScore.set(start, heuristic(start, goal));
  const startFScore = fScore.get(start);
  if (startFScore === void 0) {
    return null;
  }
  openSet.insert({ node: start, distance: startFScore });
  while (!openSet.isEmpty()) {
    const current = openSet.extractMin();
    if (!current) {
      break;
    }
    const currentNode = current.node;
    if (currentNode === goal) {
      const path = pathfindingUtils.reconstructPath(cameFrom, goal);
      const goalCost = gScore.get(goal);
      if (goalCost === void 0) {
        return null;
      }
      return { path, cost: goalCost };
    }
    closedSet.add(currentNode);
    const neighbors = graph.get(currentNode);
    if (!neighbors) {
      continue;
    }
    for (const [neighbor, weight] of neighbors) {
      if (closedSet.has(neighbor)) {
        continue;
      }
      const currentNodeGScore = gScore.get(currentNode);
      if (currentNodeGScore === void 0) {
        continue;
      }
      const tentativeGScore = currentNodeGScore + weight;
      const currentGScore = gScore.get(neighbor) ?? Infinity;
      if (tentativeGScore < currentGScore) {
        cameFrom.set(neighbor, currentNode);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal));
        const neighborFScore = fScore.get(neighbor);
        if (neighborFScore !== void 0) {
          openSet.insert({ node: neighbor, distance: neighborFScore });
        }
      }
    }
  }
  return null;
}
function astarWithDetails(graph, start, goal, heuristic) {
  const openSet = new MinPriorityQueue();
  const gScore = /* @__PURE__ */ new Map();
  const fScore = /* @__PURE__ */ new Map();
  const cameFrom = /* @__PURE__ */ new Map();
  const closedSet = /* @__PURE__ */ new Set();
  gScore.set(start, 0);
  fScore.set(start, heuristic(start, goal));
  const startFScore = fScore.get(start);
  if (startFScore === void 0) {
    return {
      path: null,
      cost: Infinity,
      visited: /* @__PURE__ */ new Set(),
      gScores: /* @__PURE__ */ new Map(),
      fScores: /* @__PURE__ */ new Map()
    };
  }
  openSet.insert({ node: start, distance: startFScore });
  while (!openSet.isEmpty()) {
    const current = openSet.extractMin();
    if (!current) {
      break;
    }
    const currentNode = current.node;
    if (currentNode === goal) {
      const path = pathfindingUtils.reconstructPath(cameFrom, goal);
      return {
        path,
        cost: gScore.get(goal) ?? Infinity,
        visited: closedSet,
        gScores: gScore,
        fScores: fScore
      };
    }
    closedSet.add(currentNode);
    const neighbors = graph.get(currentNode);
    if (!neighbors) {
      continue;
    }
    for (const [neighbor, weight] of neighbors) {
      if (closedSet.has(neighbor)) {
        continue;
      }
      const currentNodeGScore = gScore.get(currentNode);
      if (currentNodeGScore === void 0) {
        continue;
      }
      const tentativeGScore = currentNodeGScore + weight;
      const currentGScore = gScore.get(neighbor) ?? Infinity;
      if (tentativeGScore < currentGScore) {
        cameFrom.set(neighbor, currentNode);
        gScore.set(neighbor, tentativeGScore);
        fScore.set(neighbor, tentativeGScore + heuristic(neighbor, goal));
        const neighborFScore = fScore.get(neighbor);
        if (neighborFScore !== void 0) {
          openSet.insert({ node: neighbor, distance: neighborFScore });
        }
      }
    }
  }
  return {
    path: null,
    cost: Infinity,
    visited: closedSet,
    gScores: gScore,
    fScores: fScore
  };
}
const heuristics = {
  /**
  * Manhattan distance heuristic for grid-based graphs
  */
  manhattan: (a, b) => {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  },
  /**
  * Euclidean distance heuristic
  */
  euclidean: (a, b) => {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  },
  /**
  * Chebyshev distance heuristic (diagonal movement allowed)
  */
  chebyshev: (a, b) => {
    return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  },
  /**
  * Zero heuristic (makes A* behave like Dijkstra)
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  zero: (_a, _b) => 0
};
function fordFulkerson(graph, source, sink) {
  if (!graph.has(source) || !graph.has(sink)) {
    return { maxFlow: 0, flowGraph: /* @__PURE__ */ new Map() };
  }
  const residualGraph = createResidualGraph(graph);
  const flowGraph = /* @__PURE__ */ new Map();
  for (const [u, neighbors] of graph) {
    flowGraph.set(u, /* @__PURE__ */ new Map());
    for (const v of neighbors.keys()) {
      const uFlowNeighbors = flowGraph.get(u);
      if (uFlowNeighbors) {
        uFlowNeighbors.set(v, 0);
      }
    }
  }
  let maxFlow = 0;
  let path = findAugmentingPath(residualGraph, source, sink);
  while (path !== null) {
    let pathFlow = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      if (!u || !v) {
        continue;
      }
      const uEdges = residualGraph.get(u);
      if (!uEdges) {
        continue;
      }
      const capacity = uEdges.get(v);
      if (capacity !== void 0) {
        pathFlow = Math.min(pathFlow, capacity);
      }
    }
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      if (!u || !v) {
        continue;
      }
      const uEdges = residualGraph.get(u);
      if (uEdges) {
        const currentCapacity = uEdges.get(v);
        if (currentCapacity !== void 0) {
          uEdges.set(v, currentCapacity - pathFlow);
        }
      }
      if (!residualGraph.has(v)) {
        residualGraph.set(v, /* @__PURE__ */ new Map());
      }
      const vEdges = residualGraph.get(v);
      if (vEdges) {
        vEdges.set(u, (vEdges.get(u) ?? 0) + pathFlow);
      }
      if (graph.get(u)?.has(v)) {
        const uFlowEdges = flowGraph.get(u);
        if (uFlowEdges) {
          const currentFlow = uFlowEdges.get(v) ?? 0;
          uFlowEdges.set(v, currentFlow + pathFlow);
        }
      } else if (graph.get(v)?.has(u)) {
        const vFlowEdges = flowGraph.get(v);
        if (vFlowEdges) {
          const currentFlow = vFlowEdges.get(u) ?? 0;
          vFlowEdges.set(u, currentFlow - pathFlow);
        }
      }
    }
    maxFlow += pathFlow;
    path = findAugmentingPath(residualGraph, source, sink);
  }
  const minCut = findMinCut(residualGraph, source);
  return { maxFlow, flowGraph, minCut };
}
function edmondsKarp(graph, source, sink) {
  if (!graph.has(source) || !graph.has(sink)) {
    return { maxFlow: 0, flowGraph: /* @__PURE__ */ new Map() };
  }
  const residualGraph = createResidualGraph(graph);
  const flowGraph = /* @__PURE__ */ new Map();
  for (const [u, neighbors] of graph) {
    flowGraph.set(u, /* @__PURE__ */ new Map());
    for (const v of neighbors.keys()) {
      const uFlowNeighbors = flowGraph.get(u);
      if (uFlowNeighbors) {
        uFlowNeighbors.set(v, 0);
      }
    }
  }
  let maxFlow = 0;
  let path = findAugmentingPathBFS(residualGraph, source, sink);
  while (path !== null) {
    let pathFlow = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      if (!u || !v) {
        continue;
      }
      const uEdges = residualGraph.get(u);
      if (!uEdges) {
        continue;
      }
      const capacity = uEdges.get(v);
      if (capacity !== void 0) {
        pathFlow = Math.min(pathFlow, capacity);
      }
    }
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      if (!u || !v) {
        continue;
      }
      const uEdges = residualGraph.get(u);
      if (uEdges) {
        const currentCapacity = uEdges.get(v);
        if (currentCapacity !== void 0) {
          uEdges.set(v, currentCapacity - pathFlow);
        }
      }
      if (!residualGraph.has(v)) {
        residualGraph.set(v, /* @__PURE__ */ new Map());
      }
      const vEdges = residualGraph.get(v);
      if (vEdges) {
        vEdges.set(u, (vEdges.get(u) ?? 0) + pathFlow);
      }
      if (graph.get(u)?.has(v)) {
        const uFlowEdges = flowGraph.get(u);
        if (uFlowEdges) {
          const currentFlow = uFlowEdges.get(v) ?? 0;
          uFlowEdges.set(v, currentFlow + pathFlow);
        }
      } else if (graph.get(v)?.has(u)) {
        const vFlowEdges = flowGraph.get(v);
        if (vFlowEdges) {
          const currentFlow = vFlowEdges.get(u) ?? 0;
          vFlowEdges.set(u, currentFlow - pathFlow);
        }
      }
    }
    maxFlow += pathFlow;
    path = findAugmentingPathBFS(residualGraph, source, sink);
  }
  const minCut = findMinCut(residualGraph, source);
  return { maxFlow, flowGraph, minCut };
}
function createResidualGraph(graph) {
  const residual = /* @__PURE__ */ new Map();
  for (const [u, neighbors] of graph) {
    residual.set(u, /* @__PURE__ */ new Map());
    for (const [v, capacity] of neighbors) {
      const uResidualNeighbors = residual.get(u);
      if (uResidualNeighbors) {
        uResidualNeighbors.set(v, capacity);
      }
    }
  }
  return residual;
}
function findAugmentingPath(residualGraph, source, sink) {
  const visited = /* @__PURE__ */ new Set();
  const path = [];
  function dfs(node) {
    if (node === sink) {
      path.push(node);
      return true;
    }
    visited.add(node);
    path.push(node);
    const neighbors = residualGraph.get(node);
    if (neighbors) {
      for (const [neighbor, capacity] of neighbors) {
        if (!visited.has(neighbor) && capacity > 0) {
          if (dfs(neighbor)) {
            return true;
          }
        }
      }
    }
    path.pop();
    return false;
  }
  if (dfs(source)) {
    return path;
  }
  return null;
}
function findAugmentingPathBFS(residualGraph, source, sink) {
  const parent = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const queue = [source];
  visited.add(source);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const neighbors = residualGraph.get(current);
    if (neighbors) {
      for (const [neighbor, capacity] of neighbors) {
        if (!visited.has(neighbor) && capacity > 0) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          if (neighbor === sink) {
            const path = [];
            let node = sink;
            while (node !== source) {
              path.unshift(node);
              const parentNode = parent.get(node);
              if (!parentNode) {
                break;
              }
              node = parentNode;
            }
            path.unshift(source);
            return path;
          }
          queue.push(neighbor);
        }
      }
    }
  }
  return null;
}
function findMinCut(residualGraph, source) {
  const sourceSet = /* @__PURE__ */ new Set();
  const queue = [source];
  sourceSet.add(source);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const neighbors = residualGraph.get(current);
    if (neighbors) {
      for (const [neighbor, capacity] of neighbors) {
        if (!sourceSet.has(neighbor) && capacity > 0) {
          sourceSet.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }
  const sinkSet = /* @__PURE__ */ new Set();
  for (const node of residualGraph.keys()) {
    if (!sourceSet.has(node)) {
      sinkSet.add(node);
    }
  }
  const cutEdges = [];
  for (const u of sourceSet) {
    const neighbors = residualGraph.get(u);
    if (neighbors) {
      for (const v of neighbors.keys()) {
        if (sinkSet.has(v)) {
          cutEdges.push([u, v]);
        }
      }
    }
  }
  return { source: sourceSet, sink: sinkSet, edges: cutEdges };
}
function createBipartiteFlowNetwork(leftNodes, rightNodes, edges) {
  const graph = /* @__PURE__ */ new Map();
  const source = "__source__";
  const sink = "__sink__";
  graph.set(source, /* @__PURE__ */ new Map());
  for (const left of leftNodes) {
    const sourceNeighbors = graph.get(source);
    if (sourceNeighbors) {
      sourceNeighbors.set(left, 1);
    }
    graph.set(left, /* @__PURE__ */ new Map());
  }
  for (const [left, right] of edges) {
    if (!graph.has(left)) {
      graph.set(left, /* @__PURE__ */ new Map());
    }
    const leftNeighbors = graph.get(left);
    if (leftNeighbors) {
      leftNeighbors.set(right, 1);
    }
  }
  for (const right of rightNodes) {
    if (!graph.has(right)) {
      graph.set(right, /* @__PURE__ */ new Map());
    }
    const rightNeighbors = graph.get(right);
    if (rightNeighbors) {
      rightNeighbors.set(sink, 1);
    }
  }
  graph.set(sink, /* @__PURE__ */ new Map());
  return { graph, source, sink };
}
function minSTCut(graph, source, sink) {
  const flowResult = fordFulkerson(graph, source, sink);
  if (!flowResult.minCut) {
    return {
      cutValue: 0,
      partition1: /* @__PURE__ */ new Set(),
      partition2: /* @__PURE__ */ new Set(),
      cutEdges: []
    };
  }
  const cutEdges = [];
  for (const [u, v] of flowResult.minCut.edges) {
    const weight = graph.get(u)?.get(v) ?? 0;
    if (weight > 0) {
      cutEdges.push({ from: u, to: v, weight });
    }
  }
  return {
    cutValue: flowResult.maxFlow,
    partition1: flowResult.minCut.source,
    partition2: flowResult.minCut.sink,
    cutEdges
  };
}
function stoerWagner(graph) {
  const undirectedGraph = makeUndirected(graph);
  if (undirectedGraph.size < 2) {
    return {
      cutValue: 0,
      partition1: new Set(undirectedGraph.keys()),
      partition2: /* @__PURE__ */ new Set(),
      cutEdges: []
    };
  }
  const nodes = Array.from(undirectedGraph.keys());
  let minCutValue = Infinity;
  let bestPartition = /* @__PURE__ */ new Set();
  const contractionMap = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    contractionMap.set(node, /* @__PURE__ */ new Set([node]));
  }
  while (nodes.length > 1) {
    const cut = minimumCutPhase(undirectedGraph, nodes);
    if (cut.value < minCutValue) {
      minCutValue = cut.value;
      const cutTNodes = contractionMap.get(cut.t);
      if (cutTNodes) {
        bestPartition = new Set(cutTNodes);
      }
    }
    const tNodes = contractionMap.get(cut.t);
    const sNodes = contractionMap.get(cut.s);
    if (!tNodes || !sNodes) {
      continue;
    }
    for (const node of tNodes) {
      sNodes.add(node);
    }
    contractionMap.delete(cut.t);
    contractNodes(undirectedGraph, nodes, cut.s, cut.t);
  }
  const partition1 = bestPartition;
  const partition2 = /* @__PURE__ */ new Set();
  for (const node of graph.keys()) {
    if (!partition1.has(node)) {
      partition2.add(node);
    }
  }
  const cutEdges = [];
  for (const u of partition1) {
    const neighbors = graph.get(u);
    if (neighbors) {
      for (const [v, weight] of neighbors) {
        if (partition2.has(v)) {
          cutEdges.push({ from: u, to: v, weight });
        }
      }
    }
  }
  return {
    cutValue: minCutValue,
    partition1,
    partition2,
    cutEdges
  };
}
function minimumCutPhase(graph, nodes) {
  const n = nodes.length;
  const weight = /* @__PURE__ */ new Map();
  const added = /* @__PURE__ */ new Set();
  const order = [];
  for (const node of nodes) {
    weight.set(node, 0);
  }
  let lastAdded = nodes[0];
  if (!lastAdded) {
    return { s: "", t: "", value: 0, partition: [] };
  }
  added.add(lastAdded);
  order.push(lastAdded);
  for (let i = 1; i < n; i++) {
    if (!lastAdded) {
      continue;
    }
    const neighbors = graph.get(lastAdded);
    if (neighbors) {
      for (const [neighbor, w] of neighbors) {
        if (!added.has(neighbor) && nodes.includes(neighbor)) {
          const currentWeight = weight.get(neighbor);
          if (currentWeight !== void 0) {
            weight.set(neighbor, currentWeight + w);
          }
        }
      }
    }
    let maxWeight = -1;
    let maxNode = "";
    for (const node of nodes) {
      const nodeWeight = weight.get(node);
      if (!added.has(node) && nodeWeight !== void 0 && nodeWeight > maxWeight) {
        maxWeight = nodeWeight;
        maxNode = node;
      }
    }
    added.add(maxNode);
    order.push(maxNode);
    lastAdded = maxNode;
  }
  const s = order[order.length - 2];
  const t = order[order.length - 1];
  if (!s || !t) {
    return { s: "", t: "", value: 0, partition: [] };
  }
  const cutValue = weight.get(t) ?? 0;
  const partition = order.slice(0, -1);
  return { s, t, value: cutValue, partition };
}
function contractNodes(graph, nodes, s, t) {
  const sNeighbors = graph.get(s);
  const tNeighbors = graph.get(t);
  if (!sNeighbors || !tNeighbors) {
    return;
  }
  for (const [neighbor, weight] of tNeighbors) {
    if (neighbor !== s) {
      sNeighbors.set(neighbor, (sNeighbors.get(neighbor) ?? 0) + weight);
      const neighborEdges = graph.get(neighbor);
      if (neighborEdges?.has(t)) {
        neighborEdges.delete(t);
        neighborEdges.set(s, (neighborEdges.get(s) ?? 0) + weight);
      }
    }
  }
  graph.delete(t);
  sNeighbors.delete(t);
  const index = nodes.indexOf(t);
  if (index > -1) {
    nodes.splice(index, 1);
  }
}
function makeUndirected(graph) {
  const undirected = /* @__PURE__ */ new Map();
  for (const node of graph.keys()) {
    undirected.set(node, /* @__PURE__ */ new Map());
  }
  for (const [u, neighbors] of graph) {
    for (const [v, weight] of neighbors) {
      const uNeighbors = undirected.get(u);
      if (uNeighbors) {
        uNeighbors.set(v, weight);
      }
      if (!undirected.has(v)) {
        undirected.set(v, /* @__PURE__ */ new Map());
      }
      const vNeighbors = undirected.get(v);
      if (vNeighbors) {
        vNeighbors.set(u, weight);
      }
    }
  }
  return undirected;
}
function kargerMinCut(graph, iterations = 100) {
  let minCutValue = Infinity;
  let bestPartition1 = /* @__PURE__ */ new Set();
  let bestPartition2 = /* @__PURE__ */ new Set();
  for (let i = 0; i < iterations; i++) {
    const result = kargerSingleRun(graph);
    if (result.cutValue < minCutValue) {
      minCutValue = result.cutValue;
      bestPartition1 = result.partition1;
      bestPartition2 = result.partition2;
    }
  }
  const cutEdges = [];
  for (const u of bestPartition1) {
    const neighbors = graph.get(u);
    if (neighbors) {
      for (const [v, weight] of neighbors) {
        if (bestPartition2.has(v)) {
          cutEdges.push({ from: u, to: v, weight });
        }
      }
    }
  }
  return {
    cutValue: minCutValue,
    partition1: bestPartition1,
    partition2: bestPartition2,
    cutEdges
  };
}
function kargerSingleRun(graph) {
  const workGraph = /* @__PURE__ */ new Map();
  const superNodes = /* @__PURE__ */ new Map();
  for (const [node, neighbors] of graph) {
    workGraph.set(node, new Map(neighbors));
    superNodes.set(node, /* @__PURE__ */ new Set([node]));
  }
  while (workGraph.size > 2) {
    const edges = [];
    for (const [u2, neighbors] of workGraph) {
      for (const [v2, weight] of neighbors) {
        if (u2 < v2) {
          edges.push([u2, v2, weight]);
        }
      }
    }
    if (edges.length === 0) {
      break;
    }
    const randomIndex = Math.floor(Math.random() * edges.length);
    const edge = edges[randomIndex];
    if (!edge) {
      continue;
    }
    const [u, v] = edge;
    if (u && v) {
      contractKarger(workGraph, superNodes, u, v);
    }
  }
  const nodes = Array.from(workGraph.keys());
  if (nodes.length < 2) {
    return {
      cutValue: 0,
      partition1: /* @__PURE__ */ new Set(),
      partition2: /* @__PURE__ */ new Set()
    };
  }
  const node1 = nodes[0];
  const node2 = nodes[1];
  if (!node1 || !node2) {
    return {
      cutValue: 0,
      partition1: /* @__PURE__ */ new Set(),
      partition2: /* @__PURE__ */ new Set()
    };
  }
  const cutValue = workGraph.get(node1)?.get(node2) ?? 0;
  return {
    cutValue,
    partition1: superNodes.get(node1) ?? /* @__PURE__ */ new Set(),
    partition2: superNodes.get(node2) ?? /* @__PURE__ */ new Set()
  };
}
function contractKarger(graph, superNodes, u, v) {
  const uNeighbors = graph.get(u);
  const vNeighbors = graph.get(v);
  if (!uNeighbors || !vNeighbors) {
    return;
  }
  const uSuper = superNodes.get(u);
  const vSuper = superNodes.get(v);
  if (!uSuper || !vSuper) {
    return;
  }
  for (const node of vSuper) {
    uSuper.add(node);
  }
  for (const [neighbor, weight] of vNeighbors) {
    if (neighbor !== u) {
      uNeighbors.set(neighbor, (uNeighbors.get(neighbor) ?? 0) + weight);
      const neighborEdges = graph.get(neighbor);
      if (neighborEdges) {
        neighborEdges.delete(v);
        if (neighbor !== u) {
          neighborEdges.set(u, (neighborEdges.get(u) ?? 0) + weight);
        }
      }
    }
  }
  uNeighbors.delete(u);
  uNeighbors.delete(v);
  graph.delete(v);
  superNodes.delete(v);
}
function computeGraphDistance(graph, distances) {
  for (const start of graph.keys()) {
    const dist = /* @__PURE__ */ new Map();
    const queue = [start];
    dist.set(start, 0);
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) {
        continue;
      }
      const neighbors = graph.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!dist.has(neighbor)) {
            const nodeDistance = dist.get(node);
            if (nodeDistance !== void 0) {
              dist.set(neighbor, nodeDistance + 1);
            }
            queue.push(neighbor);
          }
        }
      }
    }
    distances.set(start, dist);
  }
}
function clusterDistance(cluster1, cluster2, distances, method) {
  if (cluster1.size === 0 || cluster2.size === 0) {
    return Infinity;
  }
  const allDistances = [];
  for (const node1 of cluster1) {
    for (const node2 of cluster2) {
      const dist = distances.get(node1)?.get(node2) ?? Infinity;
      allDistances.push(dist);
    }
  }
  switch (method) {
    case "single":
      return Math.min(...allDistances);
    case "complete":
      return Math.max(...allDistances);
    case "average":
      return allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
    case "ward":
      return allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
    default:
      return Math.min(...allDistances);
  }
}
function hierarchicalClustering(graph, linkage = "single") {
  const nodes = Array.from(graph.keys());
  const n = nodes.length;
  if (n === 0) {
    return {
      root: { id: "empty", members: /* @__PURE__ */ new Set(), distance: 0, height: 0 },
      dendrogram: [],
      clusters: /* @__PURE__ */ new Map()
    };
  }
  const distances = /* @__PURE__ */ new Map();
  computeGraphDistance(graph, distances);
  const clusters = nodes.map((node, i) => ({
    id: `leaf-${String(i)}`,
    members: /* @__PURE__ */ new Set([node]),
    distance: 0,
    height: 0
  }));
  const dendrogram = [...clusters];
  let clusterCount = n;
  const clusterDistances = /* @__PURE__ */ new Map();
  for (let i = 0; i < clusters.length; i++) {
    const clusterI = clusters[i];
    if (!clusterI) {
      continue;
    }
    clusterDistances.set(clusterI.id, /* @__PURE__ */ new Map());
    for (let j = i + 1; j < clusters.length; j++) {
      const clusterJ = clusters[j];
      if (!clusterJ) {
        continue;
      }
      const dist = clusterDistance(
        clusterI.members,
        clusterJ.members,
        distances,
        linkage
      );
      const clusterIDistances = clusterDistances.get(clusterI.id);
      if (clusterIDistances) {
        clusterIDistances.set(clusterJ.id, dist);
      }
    }
  }
  while (clusters.length > 1) {
    let minDist = Infinity;
    let merge1 = 0;
    let merge2 = 0;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const clusterI = clusters[i];
        const clusterJ = clusters[j];
        if (!clusterI || !clusterJ) {
          continue;
        }
        const dist = clusterDistances.get(clusterI.id)?.get(clusterJ.id) ?? clusterDistances.get(clusterJ.id)?.get(clusterI.id) ?? Infinity;
        if (dist < minDist) {
          minDist = dist;
          merge1 = i;
          merge2 = j;
        }
      }
    }
    if (minDist === Infinity || merge1 === merge2) {
      break;
    }
    const cluster1 = clusters[merge1];
    const cluster2 = clusters[merge2];
    if (!cluster1 || !cluster2) {
      continue;
    }
    const newCluster = {
      id: `cluster-${String(clusterCount++)}`,
      members: /* @__PURE__ */ new Set([...cluster1.members, ...cluster2.members]),
      left: cluster1,
      right: cluster2,
      distance: minDist,
      height: Math.max(cluster1.height, cluster2.height) + 1
    };
    dendrogram.push(newCluster);
    clusterDistances.set(newCluster.id, /* @__PURE__ */ new Map());
    for (let i = 0; i < clusters.length; i++) {
      if (i !== merge1 && i !== merge2) {
        const clusterI = clusters[i];
        if (!clusterI) {
          continue;
        }
        const newDist = clusterDistance(
          newCluster.members,
          clusterI.members,
          distances,
          linkage
        );
        const newClusterDistances = clusterDistances.get(newCluster.id);
        if (newClusterDistances) {
          newClusterDistances.set(clusterI.id, newDist);
        }
      }
    }
    clusterDistances.delete(cluster1.id);
    clusterDistances.delete(cluster2.id);
    for (const [, dists] of clusterDistances) {
      dists.delete(cluster1.id);
      dists.delete(cluster2.id);
    }
    clusters.splice(Math.max(merge1, merge2), 1);
    clusters.splice(Math.min(merge1, merge2), 1);
    clusters.push(newCluster);
  }
  const clustersByLevel = /* @__PURE__ */ new Map();
  function extractClustersAtHeight(node, height, clusters2) {
    if (node.height <= height || !node.left || !node.right) {
      clusters2.push(node.members);
    } else {
      extractClustersAtHeight(node.left, height, clusters2);
      extractClustersAtHeight(node.right, height, clusters2);
    }
  }
  let root;
  if (clusters.length === 0) {
    return {
      root: { id: "empty", members: /* @__PURE__ */ new Set(), distance: 0, height: 0 },
      dendrogram: [],
      clusters: /* @__PURE__ */ new Map()
    };
  } else if (clusters.length === 1 && clusters[0]) {
    root = clusters[0];
  } else {
    const allMembers = /* @__PURE__ */ new Set();
    let maxHeight = 0;
    for (const cluster of clusters) {
      for (const member of cluster.members) {
        allMembers.add(member);
      }
      maxHeight = Math.max(maxHeight, cluster.height);
    }
    root = {
      id: "root-forest",
      members: allMembers,
      distance: Infinity,
      height: maxHeight + 1,
      // Store references to the individual trees
      trees: [...clusters]
    };
    dendrogram.push(root);
  }
  for (let h = 0; h <= root.height; h++) {
    const clustersAtHeight = [];
    if (clusters.length > 1 && h === root.height) {
      clustersAtHeight.push(root.members);
    } else if (clusters.length > 1 && h < root.height) {
      for (const tree of clusters) {
        extractClustersAtHeight(tree, h, clustersAtHeight);
      }
    } else {
      extractClustersAtHeight(root, h, clustersAtHeight);
    }
    clustersByLevel.set(h, clustersAtHeight);
  }
  return {
    root,
    dendrogram,
    clusters: clustersByLevel
  };
}
function cutDendrogram(root, height) {
  const clusters = [];
  function traverse(node) {
    if (node.trees) {
      if (node.height <= height) {
        clusters.push(node.members);
      } else {
        for (const tree of node.trees) {
          traverse(tree);
        }
      }
      return;
    }
    if (node.height <= height || !node.left || !node.right) {
      clusters.push(node.members);
    } else {
      traverse(node.left);
      traverse(node.right);
    }
  }
  traverse(root);
  return clusters;
}
function cutDendrogramKClusters(root, k) {
  if (k <= 0) {
    return [];
  }
  if (k === 1) {
    return [root.members];
  }
  let low = 0;
  let high = root.height;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const clusters = cutDendrogram(root, mid);
    if (clusters.length === k) {
      return clusters;
    } else if (clusters.length < k) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return cutDendrogram(root, low);
}
function modularityHierarchicalClustering(graph) {
  const nodes = Array.from(graph.keys());
  const n = nodes.length;
  if (n === 0) {
    return {
      root: { id: "empty", members: /* @__PURE__ */ new Set(), distance: 0, height: 0 },
      dendrogram: [],
      clusters: /* @__PURE__ */ new Map()
    };
  }
  let m = 0;
  for (const neighbors of graph.values()) {
    m += neighbors.size;
  }
  m = m / 2;
  const clusters = nodes.map((node, i) => ({
    id: `leaf-${String(i)}`,
    members: /* @__PURE__ */ new Set([node]),
    distance: 0,
    height: 0
  }));
  const dendrogram = [...clusters];
  let clusterCount = n;
  const communityMap = /* @__PURE__ */ new Map();
  nodes.forEach((node, i) => communityMap.set(node, i));
  function modularityGain(comm1, comm2) {
    let edgesBetween = 0;
    let degree1 = 0;
    let degree2 = 0;
    for (const node1 of comm1) {
      const neighbors = graph.get(node1);
      if (!neighbors) {
        continue;
      }
      degree1 += neighbors.size;
      for (const neighbor of neighbors) {
        if (comm2.has(neighbor)) {
          edgesBetween++;
        }
      }
    }
    for (const node2 of comm2) {
      const node2Neighbors = graph.get(node2);
      if (node2Neighbors) {
        degree2 += node2Neighbors.size;
      }
    }
    const gain = edgesBetween / m - degree1 * degree2 / (4 * m * m);
    return gain;
  }
  while (clusters.length > 1) {
    let maxGain = -Infinity;
    let merge1 = 0;
    let merge2 = 0;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const clusterI = clusters[i];
        const clusterJ = clusters[j];
        if (!clusterI || !clusterJ) {
          continue;
        }
        const gain = modularityGain(clusterI.members, clusterJ.members);
        if (gain > maxGain) {
          maxGain = gain;
          merge1 = i;
          merge2 = j;
        }
      }
    }
    const cluster1 = clusters[merge1];
    const cluster2 = clusters[merge2];
    if (!cluster1 || !cluster2) {
      continue;
    }
    const newCluster = {
      id: `cluster-${String(clusterCount++)}`,
      members: /* @__PURE__ */ new Set([...cluster1.members, ...cluster2.members]),
      left: cluster1,
      right: cluster2,
      distance: -maxGain,
      // Use negative gain as distance
      height: Math.max(cluster1.height, cluster2.height) + 1
    };
    dendrogram.push(newCluster);
    for (const node of newCluster.members) {
      communityMap.set(node, clusterCount - 1);
    }
    clusters.splice(Math.max(merge1, merge2), 1);
    clusters.splice(Math.min(merge1, merge2), 1);
    clusters.push(newCluster);
  }
  const clustersByLevel = /* @__PURE__ */ new Map();
  const root = clusters[0];
  if (!root) {
    return {
      root: { id: "empty", members: /* @__PURE__ */ new Set(), distance: 0, height: 0 },
      dendrogram: [],
      clusters: /* @__PURE__ */ new Map()
    };
  }
  for (let h = 0; h <= root.height; h++) {
    clustersByLevel.set(h, cutDendrogram(root, h));
  }
  return {
    root,
    dendrogram,
    clusters: clustersByLevel
  };
}
function kCoreDecomposition(graph) {
  if (graph.size === 0) {
    return { cores: /* @__PURE__ */ new Map(), coreness: /* @__PURE__ */ new Map(), maxCore: 0 };
  }
  const n = graph.size;
  const nodes = Array.from(graph.keys());
  const nodeToIndex = /* @__PURE__ */ new Map();
  nodes.forEach((node, i) => nodeToIndex.set(node, i));
  const degree = new Array(n).fill(0);
  const pos = new Array(n).fill(0);
  const vert = new Array(n).fill(0);
  const coreness = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    if (node !== void 0) {
      coreness.set(node, 0);
    }
  }
  let maxDegree = 0;
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    if (!node) {
      continue;
    }
    const neighbors = graph.get(node);
    const nodeSize = neighbors ? neighbors.size : 0;
    degree[i] = nodeSize;
    maxDegree = Math.max(maxDegree, nodeSize);
  }
  const bin = new Array(maxDegree + 1).fill(0);
  for (let i = 0; i < n; i++) {
    const deg = degree[i];
    if (deg !== void 0 && deg >= 0 && deg < bin.length) {
      const currentCount = bin[deg];
      if (currentCount !== void 0) {
        bin[deg] = currentCount + 1;
      }
    }
  }
  let start = 0;
  for (let d = 0; d <= maxDegree; d++) {
    const temp = bin[d] ?? 0;
    bin[d] = start;
    start += temp;
  }
  for (let i = 0; i < n; i++) {
    const deg = degree[i];
    if (deg !== void 0 && deg >= 0 && deg < bin.length) {
      const posIndex = bin[deg] ?? 0;
      pos[i] = posIndex;
      vert[posIndex] = i;
      const currentBin = bin[deg];
      if (currentBin !== void 0) {
        bin[deg] = currentBin + 1;
      }
    } else {
      pos[i] = -1;
    }
  }
  for (let d = maxDegree; d > 0; d--) {
    bin[d] = bin[d - 1] ?? 0;
  }
  bin[0] = 0;
  for (let i = 0; i < n; i++) {
    const v = vert[i];
    if (v === void 0) {
      continue;
    }
    const node = nodes[v];
    if (node === void 0) {
      continue;
    }
    const degreeV = degree[v];
    if (degreeV !== void 0) {
      coreness.set(node, degreeV);
    }
    const neighbors = graph.get(node);
    if (!neighbors) {
      continue;
    }
    for (const neighbor of neighbors) {
      const u = nodeToIndex.get(neighbor);
      if (u === void 0) {
        continue;
      }
      const degreeU = degree[u];
      const degreeV2 = degree[v];
      if (degreeU !== void 0 && degreeV2 !== void 0 && degreeU > degreeV2) {
        const du = degreeU;
        const pu = pos[u];
        const pw = bin[du] ?? 0;
        const w = vert[pw];
        if (u !== w && w !== void 0 && pw < n && pu !== void 0) {
          vert[pu] = w;
          vert[pw] = u;
          pos[u] = pw;
          pos[w] = pu;
        }
        const currentBin = bin[du];
        if (currentBin !== void 0) {
          bin[du] = currentBin + 1;
        }
        degree[u] = degreeU - 1;
      }
    }
  }
  const cores = /* @__PURE__ */ new Map();
  let maxCore = 0;
  for (const [node, core] of coreness) {
    if (!cores.has(core)) {
      cores.set(core, /* @__PURE__ */ new Set());
    }
    const coreSet = cores.get(core);
    if (coreSet) {
      coreSet.add(node);
    }
    maxCore = Math.max(maxCore, core);
  }
  return { cores, coreness, maxCore };
}
function getKCore(graph, k) {
  const { coreness } = kCoreDecomposition(graph);
  const kCore = /* @__PURE__ */ new Set();
  for (const [node, core] of coreness) {
    if (core >= k) {
      kCore.add(node);
    }
  }
  return kCore;
}
function getKCoreSubgraph(graph, k) {
  const kCoreNodes = getKCore(graph, k);
  const subgraph = /* @__PURE__ */ new Map();
  for (const node of kCoreNodes) {
    const neighbors = graph.get(node);
    if (neighbors) {
      const coreNeighbors = /* @__PURE__ */ new Set();
      for (const neighbor of neighbors) {
        if (kCoreNodes.has(neighbor)) {
          coreNeighbors.add(neighbor);
        }
      }
      subgraph.set(node, coreNeighbors);
    }
  }
  return subgraph;
}
function degeneracyOrdering(graph) {
  const degree = /* @__PURE__ */ new Map();
  const remaining = /* @__PURE__ */ new Map();
  const ordering = [];
  for (const [node, neighbors] of graph) {
    degree.set(node, neighbors.size);
    remaining.set(node, new Set(neighbors));
  }
  while (ordering.length < graph.size) {
    let minDegree = Infinity;
    let minNode;
    for (const [node, deg] of degree) {
      if (!ordering.includes(node) && deg < minDegree) {
        minDegree = deg;
        minNode = node;
      }
    }
    if (minNode === void 0) {
      break;
    }
    ordering.push(minNode);
    const neighbors = remaining.get(minNode);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const neighborDegree = degree.get(neighbor);
        if (neighborDegree !== void 0) {
          degree.set(neighbor, neighborDegree - 1);
        }
        remaining.get(neighbor)?.delete(minNode);
      }
    }
  }
  return ordering;
}
function kTruss(graph, k) {
  if (k < 2) {
    throw new Error("k must be at least 2 for k-truss");
  }
  const edgeTriangles = /* @__PURE__ */ new Map();
  const edges = /* @__PURE__ */ new Set();
  for (const [u, neighbors] of graph) {
    for (const v of neighbors) {
      if (u < v) {
        const edge = `${String(u)},${String(v)}`;
        edges.add(edge);
        edgeTriangles.set(edge, 0);
      }
    }
  }
  for (const [u, uNeighbors] of graph) {
    for (const v of uNeighbors) {
      if (u < v) {
        const vNeighbors = graph.get(v);
        if (vNeighbors) {
          for (const w of uNeighbors) {
            if (v < w && vNeighbors.has(w)) {
              const edge1 = `${String(u)},${String(v)}`;
              const edge2 = `${String(u)},${String(w)}`;
              const edge3 = `${String(v)},${String(w)}`;
              const edge1Count = edgeTriangles.get(edge1);
              const edge2Count = edgeTriangles.get(edge2);
              const edge3Count = edgeTriangles.get(edge3);
              if (edge1Count !== void 0) {
                edgeTriangles.set(edge1, edge1Count + 1);
              }
              if (edge2Count !== void 0) {
                edgeTriangles.set(edge2, edge2Count + 1);
              }
              if (edge3Count !== void 0) {
                edgeTriangles.set(edge3, edge3Count + 1);
              }
            }
          }
        }
      }
    }
  }
  const kTrussEdges = new Set(edges);
  let changed = true;
  while (changed) {
    changed = false;
    const toRemove = /* @__PURE__ */ new Set();
    for (const edge of kTrussEdges) {
      const triangleCount = edgeTriangles.get(edge);
      if (triangleCount !== void 0 && triangleCount < k - 2) {
        toRemove.add(edge);
        changed = true;
      }
    }
    for (const edge of toRemove) {
      kTrussEdges.delete(edge);
      const parts = edge.split(",");
      if (parts.length < 2) {
        continue;
      }
      const [u, v] = parts;
      if (!u || !v) {
        continue;
      }
      const uNode = u;
      const vNode = v;
      const uNeighbors = graph.get(uNode);
      const vNeighbors = graph.get(vNode);
      if (uNeighbors && vNeighbors) {
        for (const w of uNeighbors) {
          if (vNeighbors.has(w)) {
            const edge1 = uNode < w ? `${String(uNode)},${String(w)}` : `${String(w)},${String(uNode)}`;
            const edge2 = vNode < w ? `${String(vNode)},${String(w)}` : `${String(w)},${String(vNode)}`;
            if (kTrussEdges.has(edge1)) {
              const edge1Count = edgeTriangles.get(edge1);
              if (edge1Count !== void 0) {
                edgeTriangles.set(edge1, edge1Count - 1);
              }
            }
            if (kTrussEdges.has(edge2)) {
              const edge2Count = edgeTriangles.get(edge2);
              if (edge2Count !== void 0) {
                edgeTriangles.set(edge2, edge2Count - 1);
              }
            }
          }
        }
      }
    }
  }
  return kTrussEdges;
}
function toUndirected(directedGraph) {
  const undirected = /* @__PURE__ */ new Map();
  for (const node of directedGraph.keys()) {
    undirected.set(node, /* @__PURE__ */ new Set());
  }
  for (const [u, neighbors] of directedGraph) {
    for (const v of neighbors.keys()) {
      const uNeighbors = undirected.get(u);
      if (uNeighbors) {
        uNeighbors.add(v);
      }
      if (!undirected.has(v)) {
        undirected.set(v, /* @__PURE__ */ new Set());
      }
      const vNeighbors = undirected.get(v);
      if (vNeighbors) {
        vNeighbors.add(u);
      }
    }
  }
  return undirected;
}
function markovClustering(graph, options = {}) {
  const {
    expansion = 2,
    inflation = 2,
    maxIterations = 100,
    tolerance = 1e-6,
    pruningThreshold = 1e-5,
    selfLoops = true
  } = options;
  const nodes = Array.from(graph.nodes());
  const nodeIds = nodes.map((node) => node.id);
  const n = nodeIds.length;
  if (n === 0) {
    return {
      communities: [],
      attractors: /* @__PURE__ */ new Set(),
      iterations: 0,
      converged: true
    };
  }
  let matrix = buildTransitionMatrix(graph, nodeIds, selfLoops);
  let converged = false;
  let iteration = 0;
  for (iteration = 0; iteration < maxIterations; iteration++) {
    const oldMatrix = matrix.map((row) => [...row]);
    matrix = matrixPower(matrix, expansion);
    matrix = inflate(matrix, inflation);
    matrix = prune(matrix, pruningThreshold);
    if (hasConverged(oldMatrix, matrix, tolerance)) {
      converged = true;
      break;
    }
  }
  const { communities, attractors } = extractClusters(matrix, nodeIds);
  return {
    communities,
    attractors,
    iterations: iteration + 1,
    converged
  };
}
function buildTransitionMatrix(graph, nodeIds, selfLoops) {
  const n = nodeIds.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const nodeToIndex = /* @__PURE__ */ new Map();
  nodeIds.forEach((id, index) => nodeToIndex.set(id, index));
  for (let i = 0; i < n; i++) {
    const nodeId = nodeIds[i];
    if (!nodeId) {
      continue;
    }
    const neighbors = graph.neighbors(nodeId);
    for (const neighbor of neighbors) {
      const j = nodeToIndex.get(neighbor);
      if (j !== void 0) {
        const edge = graph.getEdge(nodeId, neighbor);
        const weight = edge?.weight ?? 1;
        const row = matrix[i];
        if (!row) {
          continue;
        }
        row[j] = weight;
      }
    }
    if (selfLoops) {
      const row = matrix[i];
      if (!row) {
        continue;
      }
      row[i] = 1;
    }
  }
  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      const val = matrix[i]?.[j];
      if (val !== void 0) {
        colSum += val;
      }
    }
    if (colSum > 0) {
      for (let i = 0; i < n; i++) {
        const row = matrix[i];
        if (!row) {
          continue;
        }
        const val = row[j];
        if (val !== void 0) {
          row[j] = val / colSum;
        }
      }
    }
  }
  return matrix;
}
function matrixPower(matrix, power) {
  if (power === 1) {
    return matrix;
  }
  if (power === 2) {
    return matrixMultiply(matrix, matrix);
  }
  let result = matrix;
  for (let i = 1; i < power; i++) {
    result = matrixMultiply(result, matrix);
  }
  return result;
}
function matrixMultiply(a, b) {
  const n = a.length;
  const m = b[0]?.length ?? 0;
  const p = b.length;
  const result = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < p; k++) {
        const aVal = a[i]?.[k] ?? 0;
        const bVal = b[k]?.[j] ?? 0;
        const resultRow = result[i];
        if (!resultRow) {
          continue;
        }
        const prevVal = resultRow[j];
        if (prevVal !== void 0) {
          resultRow[j] = prevVal + aVal * bVal;
        }
      }
    }
  }
  return result;
}
function inflate(matrix, inflation) {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const val = matrix[i]?.[j];
      if (val !== void 0) {
        const resultRow = result[i];
        if (resultRow) {
          resultRow[j] = Math.pow(val, inflation);
        }
      }
    }
  }
  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      const val = result[i]?.[j];
      if (val !== void 0) {
        colSum += val;
      }
    }
    if (colSum > 0) {
      for (let i = 0; i < n; i++) {
        const row = result[i];
        if (!row) {
          continue;
        }
        const val = row[j];
        if (val !== void 0) {
          row[j] = val / colSum;
        }
      }
    }
  }
  return result;
}
function prune(matrix, threshold) {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const matrixRow = matrix[i];
      if (!matrixRow) {
        continue;
      }
      const matrixVal = matrixRow[j];
      if (matrixVal !== void 0 && matrixVal >= threshold) {
        const resultRow = result[i];
        if (resultRow) {
          resultRow[j] = matrixVal;
        }
      }
    }
  }
  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < n; i++) {
      const resultRow = result[i];
      if (!resultRow) {
        continue;
      }
      const val = resultRow[j];
      if (val !== void 0) {
        colSum += val;
      }
    }
    if (colSum > 0) {
      for (let i = 0; i < n; i++) {
        const resultRow = result[i];
        if (!resultRow) {
          continue;
        }
        const val = resultRow[j];
        if (val !== void 0) {
          resultRow[j] = val / colSum;
        }
      }
    }
  }
  return result;
}
function hasConverged(oldMatrix, newMatrix, tolerance) {
  const n = oldMatrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const oldRow = oldMatrix[i];
      const newRow = newMatrix[i];
      if (!oldRow || !newRow) {
        continue;
      }
      const oldVal = oldRow[j];
      const newVal = newRow[j];
      if (oldVal !== void 0 && newVal !== void 0 && Math.abs(oldVal - newVal) > tolerance) {
        return false;
      }
    }
  }
  return true;
}
function extractClusters(matrix, nodeIds) {
  const n = matrix.length;
  const attractors = /* @__PURE__ */ new Set();
  const communities = [];
  const nodeToCluster = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i++) {
    const matrixRow = matrix[i];
    if (!matrixRow) {
      continue;
    }
    const diagonalVal = matrixRow[i];
    const nodeId = nodeIds[i];
    if (diagonalVal !== void 0 && diagonalVal > 0 && nodeId !== void 0) {
      attractors.add(nodeId);
    }
  }
  let clusterIndex = 0;
  for (let j = 0; j < n; j++) {
    const clusterNodes = [];
    for (let i = 0; i < n; i++) {
      const matrixRow = matrix[i];
      if (!matrixRow) {
        continue;
      }
      const val = matrixRow[j];
      if (val !== void 0 && val > 0 && !nodeToCluster.has(i)) {
        clusterNodes.push(i);
        nodeToCluster.set(i, clusterIndex);
      }
    }
    if (clusterNodes.length > 0) {
      communities.push(clusterNodes.map((idx) => {
        const nodeId = nodeIds[idx];
        return nodeId;
      }).filter((node) => node !== void 0));
      clusterIndex++;
    }
  }
  for (let i = 0; i < n; i++) {
    if (!nodeToCluster.has(i)) {
      const nodeId = nodeIds[i];
      if (nodeId !== void 0) {
        communities.push([nodeId]);
      }
      nodeToCluster.set(i, clusterIndex++);
    }
  }
  return { communities, attractors };
}
function calculateMCLModularity(graph, communities) {
  const m = graph.totalEdgeCount;
  if (m === 0) {
    return 0;
  }
  let modularity = 0;
  const communityMap = /* @__PURE__ */ new Map();
  communities.forEach((community, index) => {
    community.forEach((nodeId) => {
      communityMap.set(nodeId, index);
    });
  });
  for (const edge of graph.edges()) {
    const sourceCommunity = communityMap.get(edge.source);
    const targetCommunity = communityMap.get(edge.target);
    if (sourceCommunity !== void 0 && targetCommunity !== void 0 && sourceCommunity === targetCommunity) {
      modularity += 1;
    }
    const sourceDegree = graph.degree(edge.source);
    const targetDegree = graph.degree(edge.target);
    modularity -= sourceDegree * targetDegree / (2 * m);
  }
  return modularity / (2 * m);
}
function spectralClustering(graph, options) {
  const {
    k,
    laplacianType = "normalized",
    maxIterations = 100
  } = options;
  const nodes = Array.from(graph.nodes());
  const nodeIds = nodes.map((node) => node.id);
  const n = nodeIds.length;
  if (k >= n) {
    const communities2 = nodeIds.map((id) => [id]);
    const clusterAssignments2 = /* @__PURE__ */ new Map();
    nodeIds.forEach((id, index) => clusterAssignments2.set(id, index));
    return { communities: communities2, clusterAssignments: clusterAssignments2 };
  }
  const adjacencyMatrix = buildAdjacencyMatrix(graph, nodeIds);
  const laplacianMatrix = buildLaplacianMatrix(adjacencyMatrix, laplacianType);
  const eigenResult = findSmallestEigenvectors(laplacianMatrix, k);
  const dataPoints = [];
  for (let i = 0; i < nodeIds.length; i++) {
    const point = [];
    for (let j = 0; j < k; j++) {
      const eigenvector = eigenResult.eigenvectors[j];
      if (eigenvector) {
        point.push(eigenvector[i] ?? 0);
      }
    }
    dataPoints.push(point);
  }
  if (laplacianType === "normalized") {
    normalizeRows(dataPoints);
  }
  const kmeans = kMeansClustering(dataPoints, k, maxIterations);
  const communities = Array.from({ length: k }, () => []);
  const clusterAssignments = /* @__PURE__ */ new Map();
  for (let i = 0; i < nodeIds.length; i++) {
    const clusterId = kmeans.assignments[i] ?? 0;
    const nodeId = nodeIds[i];
    if (!nodeId) {
      continue;
    }
    if (clusterId >= 0 && clusterId < k) {
      const community = communities[clusterId];
      if (community) {
        community.push(nodeId);
      }
      clusterAssignments.set(nodeId, clusterId);
    } else {
      const firstCommunity = communities[0];
      if (firstCommunity) {
        firstCommunity.push(nodeId);
      }
      clusterAssignments.set(nodeId, 0);
    }
  }
  const nonEmptyCommunities = communities.filter((community) => community.length > 0);
  return {
    communities: nonEmptyCommunities,
    clusterAssignments,
    eigenvalues: eigenResult.eigenvalues,
    eigenvectors: eigenResult.eigenvectors
  };
}
function buildAdjacencyMatrix(graph, nodeIds) {
  const n = nodeIds.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const nodeToIndex = /* @__PURE__ */ new Map();
  nodeIds.forEach((id, index) => nodeToIndex.set(id, index));
  for (let i = 0; i < n; i++) {
    const nodeId = nodeIds[i];
    if (!nodeId) {
      continue;
    }
    const neighbors = graph.neighbors(nodeId);
    for (const neighbor of neighbors) {
      const j = nodeToIndex.get(neighbor);
      if (j !== void 0) {
        const edge = graph.getEdge(nodeId, neighbor);
        const weight = edge?.weight ?? 1;
        const matrixRow = matrix[i];
        if (matrixRow) {
          matrixRow[j] = weight;
        }
        if (!graph.isDirected) {
          const matrixRowJ = matrix[j];
          if (matrixRowJ) {
            matrixRowJ[i] = weight;
          }
        }
      }
    }
  }
  return matrix;
}
function buildLaplacianMatrix(adjacency, type) {
  const n = adjacency.length;
  const laplacian = Array.from({ length: n }, () => Array(n).fill(0));
  const degrees = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const adjacencyRow = adjacency[i];
      const adjacencyVal = adjacencyRow ? adjacencyRow[j] : 0;
      if (adjacencyVal !== void 0) {
        const degreeVal = degrees[i];
        if (degreeVal !== void 0) {
          degrees[i] = degreeVal + adjacencyVal;
        }
      }
    }
  }
  if (type === "unnormalized") {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const laplacianRow = laplacian[i];
          const degreeVal = degrees[i];
          if (laplacianRow && degreeVal !== void 0) {
            laplacianRow[j] = degreeVal;
          }
        } else {
          const adjacencyRow = adjacency[i];
          const laplacianRow = laplacian[i];
          if (adjacencyRow && laplacianRow) {
            const adjacencyVal = adjacencyRow[j];
            laplacianRow[j] = adjacencyVal !== void 0 ? -adjacencyVal : 0;
          }
        }
      }
    }
  } else if (type === "normalized") {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const di = degrees[i];
          const laplacianRow = laplacian[i];
          if (laplacianRow) {
            laplacianRow[j] = di !== void 0 && di > 0 ? 1 : 0;
          }
        } else {
          const adjacencyRow = adjacency[i];
          if (!adjacencyRow) {
            continue;
          }
          const adjacencyVal = adjacencyRow[j];
          const di = degrees[i];
          const dj = degrees[j];
          if (adjacencyVal !== void 0 && adjacencyVal > 0 && di !== void 0 && dj !== void 0 && di > 0 && dj > 0) {
            const laplacianRow = laplacian[i];
            if (laplacianRow) {
              laplacianRow[j] = -adjacencyVal / Math.sqrt(di * dj);
            }
          }
        }
      }
    }
  } else if (type === "randomWalk") {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          const di = degrees[i];
          const laplacianRow = laplacian[i];
          if (laplacianRow) {
            laplacianRow[j] = di !== void 0 && di > 0 ? 1 : 0;
          }
        } else {
          const adjacencyRow = adjacency[i];
          if (!adjacencyRow) {
            continue;
          }
          const adjacencyVal = adjacencyRow[j];
          const di = degrees[i];
          if (adjacencyVal !== void 0 && adjacencyVal > 0 && di !== void 0 && di > 0) {
            const laplacianRow = laplacian[i];
            if (laplacianRow) {
              laplacianRow[j] = -adjacencyVal / di;
            }
          }
        }
      }
    }
  }
  return laplacian;
}
function findSmallestEigenvectors(matrix, k) {
  const n = matrix.length;
  if (n === 0 || k === 0) {
    return { eigenvalues: [], eigenvectors: [] };
  }
  if (k <= 3 && n > k) {
    return computeSmallestEigenvectorsSimple(matrix, k, n);
  }
  const eigenvectors = [];
  const eigenvalues = [];
  const maxIterations = 100;
  for (let eigIdx = 0; eigIdx < k; eigIdx++) {
    let vector = Array(n).fill(0).map(() => Math.random() - 0.5);
    const initNorm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (initNorm > 0) {
      vector = vector.map((val) => val / initNorm);
    }
    for (let j = 0; j < eigIdx; j++) {
      const ejVector = eigenvectors[j];
      if (!ejVector) {
        continue;
      }
      const dot = vector.reduce((sum, val, idx) => sum + val * (ejVector[idx] ?? 0), 0);
      vector = vector.map((val, idx) => val - dot * (ejVector[idx] ?? 0));
    }
    for (let iter = 0; iter < maxIterations; iter++) {
      const newVector = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const matrixRow = matrix[i];
          const vecVal = vector[j];
          const matrixVal = matrixRow?.[j];
          if (matrixVal !== void 0 && vecVal !== void 0) {
            const nvVal = newVector[i];
            if (nvVal !== void 0) {
              newVector[i] = nvVal + matrixVal * vecVal;
            }
          }
        }
      }
      for (let j = 0; j < eigIdx; j++) {
        const ejVector = eigenvectors[j];
        if (!ejVector) {
          continue;
        }
        const dot = newVector.reduce((sum, val, idx) => sum + val * (ejVector[idx] ?? 0), 0);
        for (let i = 0; i < n; i++) {
          const ejVal = ejVector[i];
          if (ejVal !== void 0) {
            const nvVal = newVector[i];
            if (nvVal !== void 0) {
              newVector[i] = nvVal - dot * ejVal;
            }
          }
        }
      }
      const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      if (norm > 1e-10) {
        vector = newVector.map((val) => val / norm);
      } else {
        break;
      }
    }
    let eigenvalue = 0;
    const Av = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const matrixRow = matrix[i];
        const vecVal = vector[j];
        const matrixVal = matrixRow?.[j];
        if (matrixVal !== void 0 && vecVal !== void 0) {
          const avVal = Av[i];
          if (avVal !== void 0) {
            Av[i] = avVal + matrixVal * vecVal;
          }
        }
      }
    }
    eigenvalue = vector.reduce((sum, val, idx) => {
      const avVal = Av[idx];
      return sum + val * (avVal ?? 0);
    }, 0);
    eigenvectors.push(vector);
    eigenvalues.push(eigenvalue);
  }
  return { eigenvalues, eigenvectors };
}
function normalizeRows(matrix) {
  for (const row of matrix) {
    const norm = Math.sqrt(row.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let j = 0; j < row.length; j++) {
        const val = row[j];
        if (val !== void 0) {
          row[j] = val / norm;
        }
      }
    }
  }
}
function kMeansClustering(data, k, maxIterations) {
  const n = data.length;
  const d = data[0]?.length ?? 0;
  if (n === 0 || k === 0) {
    return { assignments: [], centroids: [] };
  }
  if (k >= n) {
    return {
      assignments: Array.from({ length: n }, (_, i) => i),
      centroids: data.slice(0, n)
    };
  }
  const centroids = [];
  const selectedIndices = /* @__PURE__ */ new Set();
  while (centroids.length < k && selectedIndices.size < n) {
    const idx = Math.floor(Math.random() * n);
    if (!selectedIndices.has(idx) && data[idx]) {
      selectedIndices.add(idx);
      centroids.push([...data[idx]]);
    }
  }
  while (centroids.length < k) {
    const centroid = Array(d).fill(0);
    for (let j = 0; j < d; j++) {
      centroid[j] = Math.random() - 0.5;
    }
    centroids.push(centroid);
  }
  const assignments = Array(n).fill(0);
  let oldAssignments = Array(n).fill(-1);
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    for (let i = 0; i < n; i++) {
      let minDistance = Number.POSITIVE_INFINITY;
      let bestCluster = 0;
      for (let j = 0; j < k; j++) {
        const dataPoint = data[i];
        const centroid = centroids[j];
        if (!dataPoint || !centroid) {
          continue;
        }
        const distance = euclideanDistance$1(dataPoint, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = j;
        }
      }
      assignments[i] = bestCluster;
    }
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (assignments[i] !== oldAssignments[i]) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      break;
    }
    oldAssignments = [...assignments];
    const counts = Array(k).fill(0);
    const sums = Array.from({ length: k }, () => Array(d).fill(0));
    for (let i = 0; i < n; i++) {
      const cluster = assignments[i] ?? 0;
      const dataPoint = data[i];
      if (!dataPoint) {
        continue;
      }
      const sumsCluster = sums[cluster];
      if (sumsCluster !== void 0) {
        const countVal = counts[cluster];
        if (countVal !== void 0) {
          counts[cluster] = countVal + 1;
        }
        for (let j = 0; j < d; j++) {
          const dpVal = dataPoint[j];
          if (dpVal !== void 0) {
            const sumVal = sumsCluster[j];
            if (sumVal !== void 0) {
              sumsCluster[j] = sumVal + dpVal;
            }
          }
        }
      }
    }
    for (let i = 0; i < k; i++) {
      const countVal = counts[i];
      if (countVal !== void 0 && countVal > 0) {
        const sumsRow = sums[i];
        const centroidsRow = centroids[i];
        if (sumsRow !== void 0 && centroidsRow !== void 0) {
          for (let j = 0; j < d; j++) {
            const sumVal = sumsRow[j];
            if (sumVal !== void 0) {
              const countVal2 = counts[i];
              if (countVal2 !== void 0) {
                centroidsRow[j] = sumVal / countVal2;
              }
            }
          }
        }
      }
    }
  }
  return { assignments, centroids };
}
function euclideanDistance$1(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
function computeSmallestEigenvectorsSimple(matrix, k, n) {
  const eigenvectors = [];
  const eigenvalues = [];
  const firstVector = Array(n).fill(1 / Math.sqrt(n));
  eigenvectors.push(firstVector);
  eigenvalues.push(0);
  if (k >= 2) {
    const maxEig = 2;
    let vector = Array(n).fill(0).map(() => Math.random() - 0.5);
    const dot1 = vector.reduce((sum, val) => sum + val / Math.sqrt(n), 0);
    vector = vector.map((val) => val - dot1 / Math.sqrt(n));
    for (let iter = 0; iter < 100; iter++) {
      const newVector = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        newVector[i] = vector[i] ?? 0;
      }
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const matrixVal = matrix[i]?.[j] ?? 0;
          const vecVal = vector[j] ?? 0;
          newVector[i] = (newVector[i] ?? 0) - matrixVal * vecVal / maxEig;
        }
      }
      const dot = newVector.reduce((sum, val) => sum + val / Math.sqrt(n), 0);
      for (let i = 0; i < n; i++) {
        newVector[i] = (newVector[i] ?? 0) - dot / Math.sqrt(n);
      }
      const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      if (norm > 1e-10) {
        vector = newVector.map((val) => val / norm);
      }
    }
    eigenvectors.push(vector);
    eigenvalues.push(0.1);
  }
  if (k >= 3) {
    let vector = Array(n).fill(0).map(() => Math.random() - 0.5);
    for (const prev of eigenvectors) {
      const dot = vector.reduce((sum, val, idx) => sum + val * (prev[idx] ?? 0), 0);
      vector = vector.map((val, idx) => val - dot * (prev[idx] ?? 0));
    }
    for (let iter = 0; iter < 50; iter++) {
      const newVector = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        newVector[i] = vector[i] ?? 0;
      }
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const matrixVal = matrix[i]?.[j] ?? 0;
          const vecVal = vector[j] ?? 0;
          newVector[i] = (newVector[i] ?? 0) - matrixVal * vecVal / 2;
        }
      }
      for (const prev of eigenvectors) {
        const dot = newVector.reduce((sum, val, idx) => sum + val * (prev[idx] ?? 0), 0);
        for (let i = 0; i < n; i++) {
          newVector[i] = (newVector[i] ?? 0) - dot * (prev[i] ?? 0);
        }
      }
      const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      if (norm > 1e-10) {
        vector = newVector.map((val) => val / norm);
      }
    }
    eigenvectors.push(vector);
    eigenvalues.push(0.2);
  }
  return { eigenvalues: eigenvalues.slice(0, k), eigenvectors: eigenvectors.slice(0, k) };
}
function maximumBipartiteMatching(graph, options = {}) {
  let { leftNodes, rightNodes } = options;
  if (!leftNodes || !rightNodes) {
    const partition = bipartitePartition(graph);
    if (!partition) {
      throw new Error("Graph is not bipartite");
    }
    leftNodes = partition.left;
    rightNodes = partition.right;
  }
  const matching = /* @__PURE__ */ new Map();
  const matchRight = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const dfs = (u) => {
    const neighbors = Array.from(graph.neighbors(u));
    for (const v of neighbors) {
      if (!rightNodes.has(v) || visited.has(v)) {
        continue;
      }
      visited.add(v);
      const matchedNode = matchRight.get(v);
      if (!matchRight.has(v) || matchedNode !== void 0 && dfs(matchedNode)) {
        matching.set(u, v);
        matchRight.set(v, u);
        return true;
      }
    }
    return false;
  };
  let matchingSize = 0;
  for (const u of leftNodes) {
    visited.clear();
    if (dfs(u)) {
      matchingSize++;
    }
  }
  return {
    matching,
    size: matchingSize
  };
}
function bipartitePartition(graph) {
  const color = /* @__PURE__ */ new Map();
  const left = /* @__PURE__ */ new Set();
  const right = /* @__PURE__ */ new Set();
  const nodes = Array.from(graph.nodes());
  for (const startNode of nodes) {
    if (color.has(startNode.id)) {
      continue;
    }
    const queue = [startNode.id];
    color.set(startNode.id, true);
    left.add(startNode.id);
    while (queue.length > 0) {
      const u = queue.shift();
      if (u === void 0) {
        continue;
      }
      const uColor = color.get(u);
      if (uColor === void 0) {
        continue;
      }
      const neighbors = Array.from(graph.neighbors(u));
      for (const v of neighbors) {
        if (!color.has(v)) {
          color.set(v, !uColor);
          if (!uColor) {
            left.add(v);
          } else {
            right.add(v);
          }
          queue.push(v);
        } else if (color.get(v) === uColor) {
          return null;
        }
      }
    }
  }
  return { left, right };
}
function greedyBipartiteMatching(graph, options = {}) {
  let { leftNodes, rightNodes } = options;
  if (!leftNodes || !rightNodes) {
    const partition = bipartitePartition(graph);
    if (!partition) {
      throw new Error("Graph is not bipartite");
    }
    leftNodes = partition.left;
    rightNodes = partition.right;
  }
  const matching = /* @__PURE__ */ new Map();
  const matched = /* @__PURE__ */ new Set();
  for (const u of leftNodes) {
    const neighbors = Array.from(graph.neighbors(u));
    for (const v of neighbors) {
      if (rightNodes.has(v) && !matched.has(v)) {
        matching.set(u, v);
        matched.add(v);
        break;
      }
    }
  }
  return {
    matching,
    size: matching.size
  };
}
function isGraphIsomorphic(graph1, graph2, options = {}) {
  if (graph1.nodeCount !== graph2.nodeCount || graph1.totalEdgeCount !== graph2.totalEdgeCount) {
    return { isIsomorphic: false };
  }
  if (graph1.isDirected !== graph2.isDirected) {
    return { isIsomorphic: false };
  }
  const nodes1 = Array.from(graph1.nodes()).map((n) => n.id);
  const nodes2 = Array.from(graph2.nodes()).map((n) => n.id);
  const degrees1 = nodes1.map((n) => graph1.degree(n)).sort((a, b) => a - b);
  const degrees2 = nodes2.map((n) => graph2.degree(n)).sort((a, b) => a - b);
  for (let i = 0; i < degrees1.length; i++) {
    if (degrees1[i] !== degrees2[i]) {
      return { isIsomorphic: false };
    }
  }
  const state = {
    core1: /* @__PURE__ */ new Map(),
    core2: /* @__PURE__ */ new Map(),
    in1: /* @__PURE__ */ new Map(),
    in2: /* @__PURE__ */ new Map(),
    out1: /* @__PURE__ */ new Map(),
    out2: /* @__PURE__ */ new Map(),
    depth: 0
  };
  const mappings = [];
  const found = vf2Recurse(graph1, graph2, state, nodes1, nodes2, options, mappings);
  if (found && mappings.length > 0) {
    return {
      isIsomorphic: true,
      mapping: mappings[0] ?? /* @__PURE__ */ new Map()
    };
  }
  return { isIsomorphic: false };
}
function vf2Recurse(g1, g2, state, nodes1, nodes2, options, mappings) {
  if (state.core1.size === nodes1.length) {
    mappings.push(new Map(state.core1));
    return !options.findAllMappings;
  }
  const candidates = getCandidatePairs(g1, g2, state, nodes1, nodes2);
  for (const [node1, node2] of candidates) {
    if (isFeasible(g1, g2, state, node1, node2, options)) {
      const newState = addPair(g1, g2, state, node1, node2);
      if (vf2Recurse(g1, g2, newState, nodes1, nodes2, options, mappings)) {
        return true;
      }
    }
  }
  return false;
}
function getCandidatePairs(g1, g2, state, nodes1, nodes2) {
  const pairs = [];
  let node1 = null;
  for (const [n] of state.out1) {
    if (!state.core1.has(n)) {
      node1 = n;
      break;
    }
  }
  if (!node1) {
    for (const [n] of state.in1) {
      if (!state.core1.has(n)) {
        node1 = n;
        break;
      }
    }
  }
  if (!node1) {
    for (const n of nodes1) {
      if (!state.core1.has(n)) {
        node1 = n;
        break;
      }
    }
  }
  if (!node1) {
    return pairs;
  }
  for (const node2 of nodes2) {
    if (!state.core2.has(node2)) {
      if (g1.degree(node1) === g2.degree(node2)) {
        pairs.push([node1, node2]);
      }
    }
  }
  return pairs;
}
function isFeasible(g1, g2, state, node1, node2, options) {
  if (options.nodeMatch && !options.nodeMatch(node1, node2, g1, g2)) {
    return false;
  }
  const neighbors1 = new Set(g1.neighbors(node1));
  const neighbors2 = new Set(g2.neighbors(node2));
  for (const [n1, n2] of state.core1) {
    if (neighbors1.has(n1)) {
      if (!neighbors2.has(n2)) {
        return false;
      }
      if (options.edgeMatch && !options.edgeMatch([node1, n1], [node2, n2], g1, g2)) {
        return false;
      }
    } else if (neighbors2.has(n2)) {
      return false;
    }
  }
  let new1In = 0;
  let new1Out = 0;
  let term1In = 0;
  let term1Out = 0;
  let new2In = 0;
  let new2Out = 0;
  let term2In = 0;
  let term2Out = 0;
  for (const neighbor of neighbors1) {
    if (state.core1.has(neighbor)) ;
    else if (state.in1.has(neighbor)) {
      term1In++;
    } else if (state.out1.has(neighbor)) {
      term1Out++;
    } else {
      if (g1.isDirected) {
        if (g1.hasEdge(neighbor, node1)) {
          new1In++;
        }
        if (g1.hasEdge(node1, neighbor)) {
          new1Out++;
        }
      } else {
        new1In++;
        new1Out++;
      }
    }
  }
  for (const neighbor of neighbors2) {
    if (state.core2.has(neighbor)) ;
    else if (state.in2.has(neighbor)) {
      term2In++;
    } else if (state.out2.has(neighbor)) {
      term2Out++;
    } else {
      if (g2.isDirected) {
        if (g2.hasEdge(neighbor, node2)) {
          new2In++;
        }
        if (g2.hasEdge(node2, neighbor)) {
          new2Out++;
        }
      } else {
        new2In++;
        new2Out++;
      }
    }
  }
  return term1In === term2In && term1Out === term2Out && new1In === new2In && new1Out === new2Out;
}
function addPair(g1, g2, state, node1, node2) {
  const newState = {
    core1: new Map(state.core1),
    core2: new Map(state.core2),
    in1: new Map(state.in1),
    in2: new Map(state.in2),
    out1: new Map(state.out1),
    out2: new Map(state.out2),
    depth: state.depth + 1
  };
  newState.core1.set(node1, node2);
  newState.core2.set(node2, node1);
  const neighbors1 = g1.neighbors(node1);
  for (const neighbor of neighbors1) {
    if (!newState.core1.has(neighbor) && !newState.in1.has(neighbor) && !newState.out1.has(neighbor)) {
      if (g1.isDirected) {
        if (g1.hasEdge(neighbor, node1)) {
          newState.in1.set(neighbor, newState.depth);
        }
        if (g1.hasEdge(node1, neighbor)) {
          newState.out1.set(neighbor, newState.depth);
        }
      } else {
        newState.in1.set(neighbor, newState.depth);
        newState.out1.set(neighbor, newState.depth);
      }
    }
  }
  const neighbors2 = g2.neighbors(node2);
  for (const neighbor of neighbors2) {
    if (!newState.core2.has(neighbor) && !newState.in2.has(neighbor) && !newState.out2.has(neighbor)) {
      if (g2.isDirected) {
        if (g2.hasEdge(neighbor, node2)) {
          newState.in2.set(neighbor, newState.depth);
        }
        if (g2.hasEdge(node2, neighbor)) {
          newState.out2.set(neighbor, newState.depth);
        }
      } else {
        newState.in2.set(neighbor, newState.depth);
        newState.out2.set(neighbor, newState.depth);
      }
    }
  }
  return newState;
}
function findAllIsomorphisms(graph1, graph2, options = {}) {
  if (graph1.nodeCount !== graph2.nodeCount || graph1.totalEdgeCount !== graph2.totalEdgeCount) {
    return [];
  }
  if (graph1.isDirected !== graph2.isDirected) {
    return [];
  }
  const nodes1 = Array.from(graph1.nodes()).map((n) => n.id);
  const nodes2 = Array.from(graph2.nodes()).map((n) => n.id);
  const degrees1 = nodes1.map((n) => graph1.degree(n)).sort((a, b) => a - b);
  const degrees2 = nodes2.map((n) => graph2.degree(n)).sort((a, b) => a - b);
  for (let i = 0; i < degrees1.length; i++) {
    if (degrees1[i] !== degrees2[i]) {
      return [];
    }
  }
  if (nodes1.length === 0) {
    return [/* @__PURE__ */ new Map()];
  }
  const state = {
    core1: /* @__PURE__ */ new Map(),
    core2: /* @__PURE__ */ new Map(),
    in1: /* @__PURE__ */ new Map(),
    in2: /* @__PURE__ */ new Map(),
    out1: /* @__PURE__ */ new Map(),
    out2: /* @__PURE__ */ new Map(),
    depth: 0
  };
  const mappings = [];
  vf2Recurse(graph1, graph2, state, nodes1, nodes2, { ...options, findAllMappings: true }, mappings);
  return mappings;
}
function adamicAdarScore(graph, source, target, options = {}) {
  if (!graph.hasNode(source) || !graph.hasNode(target)) {
    return 0;
  }
  const { directed = false } = options;
  const sourceNeighbors = new Set(
    directed ? Array.from(graph.outNeighbors(source)) : Array.from(graph.neighbors(source))
  );
  const targetNeighbors = new Set(
    directed ? Array.from(graph.inNeighbors(target)) : Array.from(graph.neighbors(target))
  );
  let score = 0;
  for (const neighbor of sourceNeighbors) {
    if (targetNeighbors.has(neighbor)) {
      const degree = directed ? graph.outDegree(neighbor) : (
        // Use out-degree for directed graphs
        graph.degree(neighbor)
      );
      if (degree > 1) {
        score += 1 / Math.log(degree);
      } else if (degree === 1) {
        score += 1;
      }
    }
  }
  return score;
}
function adamicAdarPrediction(graph, options = {}) {
  const {
    directed = false,
    includeExisting = false,
    topK
  } = options;
  const scores = [];
  const nodes = Array.from(graph.nodes()).map((n) => n.id);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const source = nodes[i];
      const target = nodes[j];
      if (!source || !target) {
        continue;
      }
      if (!includeExisting && graph.hasEdge(source, target)) {
        continue;
      }
      const score = adamicAdarScore(graph, source, target, { directed });
      if (score > 0) {
        scores.push({ source, target, score });
        if (!directed && source !== target) {
          scores.push({ source: target, target: source, score });
        }
      }
    }
  }
  scores.sort((a, b) => b.score - a.score);
  if (topK && topK > 0) {
    return scores.slice(0, topK);
  }
  return scores;
}
function adamicAdarForPairs(graph, pairs, options = {}) {
  return pairs.map(([source, target]) => ({
    source,
    target,
    score: adamicAdarScore(graph, source, target, options)
  }));
}
function getTopAdamicAdarCandidatesForNode(graph, node, options = {}) {
  if (!graph.hasNode(node)) {
    return [];
  }
  const {
    directed = false,
    includeExisting = false,
    topK = 10,
    candidates
  } = options;
  const scores = [];
  const targetNodes = candidates ?? Array.from(graph.nodes()).map((n) => n.id);
  for (const target of targetNodes) {
    if (target === node) {
      continue;
    }
    if (!includeExisting && graph.hasEdge(node, target)) {
      continue;
    }
    const score = adamicAdarScore(graph, node, target, { directed });
    if (score > 0) {
      scores.push({ source: node, target, score });
    }
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}
function evaluateAdamicAdar(trainingGraph, testEdges, nonEdges, options = {}) {
  const testScores = adamicAdarForPairs(trainingGraph, testEdges, options);
  const nonEdgeScores = adamicAdarForPairs(trainingGraph, nonEdges, options);
  const allScores = [
    ...testScores.map((s) => ({ ...s, isActualEdge: true })),
    ...nonEdgeScores.map((s) => ({ ...s, isActualEdge: false }))
  ].sort((a, b) => b.score - a.score);
  let truePositives = 0;
  let falsePositives = 0;
  let bestF1 = 0;
  let bestPrecision = 0;
  let bestRecall = 0;
  const totalPositives = testEdges.length;
  for (const scoreItem of allScores) {
    if (scoreItem.isActualEdge) {
      truePositives++;
    } else {
      falsePositives++;
    }
    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / totalPositives;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    if (f1 > bestF1) {
      bestF1 = f1;
      bestPrecision = precision;
      bestRecall = recall;
    }
  }
  let auc = 0;
  let tpCount = 0;
  let fpCount = 0;
  for (const item of allScores) {
    if (item.isActualEdge) {
      tpCount++;
    } else {
      auc += tpCount;
      fpCount++;
    }
  }
  if (tpCount > 0 && fpCount > 0) {
    auc = auc / (tpCount * fpCount);
  } else {
    auc = 0.5;
  }
  return {
    precision: bestPrecision,
    recall: bestRecall,
    f1Score: bestF1,
    auc
  };
}
function compareAdamicAdarWithCommonNeighbors(graph, testEdges, nonEdges, options = {}) {
  const commonNeighborsPairs = (pairs) => pairs.map(([source, target]) => ({
    source,
    target,
    score: (() => {
      const sourceNeighbors = new Set(Array.from(graph.neighbors(source)));
      const targetNeighbors = new Set(Array.from(graph.neighbors(target)));
      let count = 0;
      for (const n of sourceNeighbors) {
        if (targetNeighbors.has(n)) {
          count++;
        }
      }
      return count;
    })()
  }));
  const testScores = commonNeighborsPairs(testEdges);
  const nonEdgeScores = commonNeighborsPairs(nonEdges);
  const allScores = [
    ...testScores.map((s) => ({ ...s, isActualEdge: true })),
    ...nonEdgeScores.map((s) => ({ ...s, isActualEdge: false }))
  ].sort((a, b) => b.score - a.score);
  let truePositives = 0;
  let falsePositives = 0;
  let bestF1 = 0;
  let bestPrecision = 0;
  let bestRecall = 0;
  const totalPositives = testEdges.length;
  for (const scoreItem of allScores) {
    if (scoreItem.isActualEdge) {
      truePositives++;
    } else {
      falsePositives++;
    }
    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / totalPositives;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    if (f1 > bestF1) {
      bestF1 = f1;
      bestPrecision = precision;
      bestRecall = recall;
    }
  }
  let auc = 0;
  let tpCount = 0;
  let fpCount = 0;
  for (const item of allScores) {
    if (item.isActualEdge) {
      tpCount++;
    } else {
      auc += tpCount;
      fpCount++;
    }
  }
  if (tpCount > 0 && fpCount > 0) {
    auc = auc / (tpCount * fpCount);
  } else {
    auc = 0.5;
  }
  const commonNeighborsResults = {
    precision: bestPrecision,
    recall: bestRecall,
    f1Score: bestF1,
    auc
  };
  const adamicAdarResults = evaluateAdamicAdar(graph, testEdges, nonEdges, options);
  return {
    adamicAdar: adamicAdarResults,
    commonNeighbors: commonNeighborsResults
  };
}
function commonNeighborsScore(graph, source, target, options = {}) {
  if (!graph.hasNode(source) || !graph.hasNode(target)) {
    return 0;
  }
  const { directed = false } = options;
  const sourceNeighbors = new Set(
    directed ? Array.from(graph.outNeighbors(source)) : Array.from(graph.neighbors(source))
  );
  const targetNeighbors = new Set(
    directed ? Array.from(graph.inNeighbors(target)) : Array.from(graph.neighbors(target))
  );
  let commonCount = 0;
  for (const neighbor of sourceNeighbors) {
    if (targetNeighbors.has(neighbor)) {
      commonCount++;
    }
  }
  return commonCount;
}
function commonNeighborsPrediction(graph, options = {}) {
  const {
    directed = false,
    includeExisting = false,
    topK
  } = options;
  const scores = [];
  const nodes = Array.from(graph.nodes()).map((n) => n.id);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const source = nodes[i];
      const target = nodes[j];
      if (!source || !target) {
        continue;
      }
      if (!includeExisting && graph.hasEdge(source, target)) {
        continue;
      }
      const score = commonNeighborsScore(graph, source, target, { directed });
      if (score > 0) {
        scores.push({ source, target, score });
        if (!directed && source !== target) {
          scores.push({ source: target, target: source, score });
        }
      }
    }
  }
  scores.sort((a, b) => b.score - a.score);
  if (topK && topK > 0) {
    return scores.slice(0, topK);
  }
  return scores;
}
function commonNeighborsForPairs(graph, pairs, options = {}) {
  return pairs.map(([source, target]) => ({
    source,
    target,
    score: commonNeighborsScore(graph, source, target, options)
  }));
}
function getTopCandidatesForNode(graph, node, options = {}) {
  if (!graph.hasNode(node)) {
    return [];
  }
  const {
    directed = false,
    includeExisting = false,
    topK = 10,
    candidates
  } = options;
  const scores = [];
  const targetNodes = candidates ?? Array.from(graph.nodes()).map((n) => n.id);
  for (const target of targetNodes) {
    if (target === node) {
      continue;
    }
    if (!includeExisting && graph.hasEdge(node, target)) {
      continue;
    }
    const score = commonNeighborsScore(graph, node, target, { directed });
    if (score > 0) {
      scores.push({ source: node, target, score });
    }
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}
function evaluateCommonNeighbors(trainingGraph, testEdges, nonEdges, options = {}) {
  const testScores = commonNeighborsForPairs(trainingGraph, testEdges, options);
  const nonEdgeScores = commonNeighborsForPairs(trainingGraph, nonEdges, options);
  const allScores = [
    ...testScores.map((s) => ({ ...s, isActualEdge: true })),
    ...nonEdgeScores.map((s) => ({ ...s, isActualEdge: false }))
  ].sort((a, b) => b.score - a.score);
  let truePositives = 0;
  let falsePositives = 0;
  let bestF1 = 0;
  let bestPrecision = 0;
  let bestRecall = 0;
  const totalPositives = testEdges.length;
  for (const scoreItem of allScores) {
    if (scoreItem.isActualEdge) {
      truePositives++;
    } else {
      falsePositives++;
    }
    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / totalPositives;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    if (f1 > bestF1) {
      bestF1 = f1;
      bestPrecision = precision;
      bestRecall = recall;
    }
  }
  let auc = 0;
  let tpCount = 0;
  let fpCount = 0;
  for (const item of allScores) {
    if (item.isActualEdge) {
      tpCount++;
    } else {
      auc += tpCount;
      fpCount++;
    }
  }
  if (tpCount > 0 && fpCount > 0) {
    auc = auc / (tpCount * fpCount);
  } else {
    auc = 0.5;
  }
  return {
    precision: bestPrecision,
    recall: bestRecall,
    f1Score: bestF1,
    auc
  };
}
function syncClustering(graph, config) {
  const {
    numClusters,
    maxIterations = 100,
    tolerance = 1e-6,
    seed = 42,
    learningRate = 0.01,
    lambda = 0.1
  } = config;
  const originalRandom = Math.random;
  Math.random = seedRandom$1(seed);
  const nodes = Array.from(graph.nodes());
  const nodeCount = nodes.length;
  if (nodeCount === 0) {
    return {
      clusters: /* @__PURE__ */ new Map(),
      loss: 0,
      iterations: 0,
      embeddings: /* @__PURE__ */ new Map(),
      converged: true
    };
  }
  if (numClusters <= 0 || numClusters > nodeCount) {
    throw new Error(`Invalid number of clusters: ${String(numClusters)}. Must be between 1 and ${String(nodeCount)}`);
  }
  const embeddingDim = Math.min(64, nodeCount);
  const embeddings = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    const embedding = initializeNodeEmbedding(graph, node.id, embeddingDim);
    embeddings.set(node.id, embedding);
  }
  const clusterCenters = initializeClusterCenters(embeddings, numClusters);
  let previousLoss = Infinity;
  let iterations = 0;
  let converged = false;
  for (iterations = 0; iterations < maxIterations; iterations++) {
    const clusters = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      const nodeEmbedding = embeddings.get(node.id);
      if (!nodeEmbedding) {
        continue;
      }
      let bestCluster = 0;
      let minDistance = Infinity;
      for (let k = 0; k < numClusters; k++) {
        const center = clusterCenters[k];
        if (!center) continue;
        const distance = euclideanDistance(nodeEmbedding, center);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = k;
        }
      }
      clusters.set(node.id, bestCluster);
    }
    updateEmbeddings(graph, embeddings, clusters, learningRate, lambda);
    updateClusterCenters(embeddings, clusters, clusterCenters, numClusters);
    const currentLoss = calculateLoss(graph, embeddings, clusters, clusterCenters, lambda);
    if (Math.abs(previousLoss - currentLoss) < tolerance) {
      converged = true;
      break;
    }
    previousLoss = currentLoss;
  }
  const finalClusters = /* @__PURE__ */ new Map();
  for (const node of nodes) {
    const nodeEmbedding = embeddings.get(node.id);
    if (!nodeEmbedding) {
      continue;
    }
    let bestCluster = 0;
    let minDistance = Infinity;
    for (let k = 0; k < numClusters; k++) {
      const center = clusterCenters[k];
      if (!center) continue;
      const distance = euclideanDistance(nodeEmbedding, center);
      if (distance < minDistance) {
        minDistance = distance;
        bestCluster = k;
      }
    }
    finalClusters.set(node.id, bestCluster);
  }
  Math.random = originalRandom;
  return {
    clusters: finalClusters,
    loss: previousLoss,
    iterations: iterations + 1,
    embeddings,
    converged
  };
}
function initializeNodeEmbedding(graph, nodeId, dim) {
  const embedding = new Array(dim).fill(0);
  const degree = graph.degree(nodeId);
  const normalizedDegree = degree / Math.max(1, graph.nodeCount - 1);
  for (let i = 0; i < dim; i++) {
    embedding[i] = (Math.random() - 0.5) * 0.1 + normalizedDegree * 0.1;
  }
  return embedding;
}
function initializeClusterCenters(embeddings, numClusters) {
  const embeddingArray = Array.from(embeddings.values());
  const centers = [];
  const firstCenter = embeddingArray[Math.floor(Math.random() * embeddingArray.length)];
  if (firstCenter) {
    centers.push([...firstCenter]);
  }
  for (let k = 1; k < numClusters; k++) {
    const distances = [];
    let totalDistance = 0;
    for (const embedding of embeddingArray) {
      let minDistance = Infinity;
      for (const center of centers) {
        const distance = euclideanDistance(embedding, center);
        minDistance = Math.min(minDistance, distance);
      }
      distances.push(minDistance * minDistance);
      totalDistance += minDistance * minDistance;
    }
    let randomValue = Math.random() * totalDistance;
    for (let i = 0; i < embeddingArray.length; i++) {
      const distanceValue = distances[i];
      if (distanceValue !== void 0) {
        randomValue -= distanceValue;
      }
      if (randomValue <= 0) {
        const newCenter = embeddingArray[i];
        if (newCenter) {
          centers.push([...newCenter]);
        }
        break;
      }
    }
  }
  return centers;
}
function updateEmbeddings(graph, embeddings, clusters, learningRate, lambda) {
  const gradients = /* @__PURE__ */ new Map();
  for (const [nodeId, embedding] of embeddings) {
    gradients.set(nodeId, new Array(embedding.length).fill(0));
  }
  for (const node of graph.nodes()) {
    const nodeId = node.id;
    const nodeEmbedding = embeddings.get(nodeId);
    if (!nodeEmbedding) {
      continue;
    }
    const gradient = gradients.get(nodeId);
    if (!gradient) {
      continue;
    }
    for (const neighborId of graph.neighbors(nodeId)) {
      const neighborEmbedding = embeddings.get(neighborId);
      if (!neighborEmbedding) {
        continue;
      }
      const diff = nodeEmbedding.map((val, i) => val - (neighborEmbedding[i] ?? 0));
      for (let i = 0; i < gradient.length; i++) {
        const gradVal = gradient[i];
        const diffVal = diff[i];
        if (gradVal !== void 0 && diffVal !== void 0) {
          gradient[i] = gradVal + lambda * diffVal;
        }
      }
    }
    for (let i = 0; i < gradient.length; i++) {
      const gradVal = gradient[i];
      const nodeVal = nodeEmbedding[i];
      if (gradVal !== void 0 && nodeVal !== void 0) {
        gradient[i] = gradVal + lambda * nodeVal;
      }
    }
  }
  for (const [nodeId, embedding] of embeddings) {
    const gradient = gradients.get(nodeId);
    if (!gradient) {
      continue;
    }
    for (let i = 0; i < embedding.length; i++) {
      const embVal = embedding[i];
      const gradVal = gradient[i];
      if (embVal !== void 0 && gradVal !== void 0) {
        embedding[i] = embVal - learningRate * gradVal;
      }
    }
  }
}
function updateClusterCenters(embeddings, clusters, clusterCenters, numClusters) {
  const dimensions = clusterCenters[0]?.length ?? 0;
  const clusterSums = Array.from(
    { length: numClusters },
    () => new Array(dimensions).fill(0)
  );
  const clusterCounts = new Array(numClusters).fill(0);
  for (const [nodeId, clusterIdx] of clusters) {
    const embedding = embeddings.get(nodeId);
    if (!embedding) {
      continue;
    }
    for (let i = 0; i < embedding.length; i++) {
      const clusterSum = clusterSums[clusterIdx];
      if (!clusterSum) continue;
      const sumVal = clusterSum[i];
      const embVal = embedding[i];
      if (sumVal !== void 0 && embVal !== void 0) {
        clusterSum[i] = sumVal + embVal;
      }
    }
    const count = clusterCounts[clusterIdx];
    if (count !== void 0) {
      clusterCounts[clusterIdx] = count + 1;
    }
  }
  for (let k = 0; k < numClusters; k++) {
    const count = clusterCounts[k];
    const center = clusterCenters[k];
    const sum = clusterSums[k];
    if (count !== void 0 && count > 0 && center && sum) {
      for (let i = 0; i < center.length; i++) {
        const sumVal = sum[i];
        if (sumVal !== void 0) {
          center[i] = sumVal / count;
        }
      }
    }
  }
}
function calculateLoss(graph, embeddings, clusters, clusterCenters, lambda) {
  let clusteringLoss = 0;
  let reconstructionLoss = 0;
  let regularizationLoss = 0;
  for (const [nodeId, clusterIdx] of clusters) {
    const embedding = embeddings.get(nodeId);
    if (!embedding) {
      continue;
    }
    const center = clusterCenters[clusterIdx];
    if (!center) continue;
    clusteringLoss += euclideanDistance(embedding, center) ** 2;
  }
  for (const node of graph.nodes()) {
    const nodeId = node.id;
    const nodeEmbedding = embeddings.get(nodeId);
    if (!nodeEmbedding) {
      continue;
    }
    for (const neighborId of graph.neighbors(nodeId)) {
      const neighborEmbedding = embeddings.get(neighborId);
      if (!neighborEmbedding) {
        continue;
      }
      const distance = euclideanDistance(nodeEmbedding, neighborEmbedding);
      reconstructionLoss += distance ** 2;
    }
  }
  for (const embedding of embeddings.values()) {
    for (const value of embedding) {
      regularizationLoss += value ** 2;
    }
  }
  return clusteringLoss + lambda * reconstructionLoss + lambda * regularizationLoss;
}
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    if (aVal !== void 0 && bVal !== void 0) {
      const diff = aVal - bVal;
      sum += diff * diff;
    }
  }
  return Math.sqrt(sum);
}
function seedRandom$1(seed) {
  const m = 2147483648;
  const a = 1103515245;
  const c = 12345;
  seed = seed % m;
  return function() {
    seed = (a * seed + c) % m;
    return seed / (m - 1);
  };
}
function teraHAC(graph, config = {}) {
  const {
    linkage = "average",
    numClusters,
    distanceThreshold,
    maxNodes = 1e4,
    useGraphDistance = true
  } = config;
  const nodes = Array.from(graph.nodes());
  const nodeCount = nodes.length;
  if (nodeCount === 0) {
    throw new Error("Cannot cluster empty graph");
  }
  if (nodeCount > maxNodes) {
    console.warn(`Graph has ${String(nodeCount)} nodes, which exceeds maxNodes (${String(maxNodes)}). Performance may be degraded.`);
  }
  const clusters = /* @__PURE__ */ new Map();
  let nextClusterId = nodeCount;
  for (let i = 0; i < nodeCount; i++) {
    const node = nodes[i];
    if (!node) continue;
    const clusterId = i.toString();
    clusters.set(clusterId, {
      id: clusterId,
      members: /* @__PURE__ */ new Set([node.id]),
      distance: 0,
      size: 1
    });
  }
  const distanceMatrix = calculateDistanceMatrix(graph, nodes, useGraphDistance);
  const mergeDistances = [];
  const mergeCandidates = initializeMergeCandidates(clusters, distanceMatrix);
  let dendrogram;
  while (clusters.size > 1) {
    const { cluster1Id, cluster2Id, distance } = findClosestPair(mergeCandidates);
    if (numClusters && clusters.size <= numClusters) {
      break;
    }
    if (distanceThreshold && distance > distanceThreshold) {
      break;
    }
    const cluster1 = clusters.get(cluster1Id);
    const cluster2 = clusters.get(cluster2Id);
    if (!cluster1 || !cluster2) {
      continue;
    }
    const newClusterId = (nextClusterId++).toString();
    const mergedMembers = /* @__PURE__ */ new Set([...cluster1.members, ...cluster2.members]);
    const newCluster = {
      id: newClusterId,
      members: mergedMembers,
      left: cluster1,
      right: cluster2,
      distance,
      size: cluster1.size + cluster2.size
    };
    clusters.delete(cluster1Id);
    clusters.delete(cluster2Id);
    clusters.set(newClusterId, newCluster);
    mergeDistances.push(distance);
    updateMergeCandidates(mergeCandidates, cluster1Id, cluster2Id, newClusterId, clusters, distanceMatrix, linkage);
    dendrogram = newCluster;
  }
  if (clusters.size > 1) {
    const remainingClusters = Array.from(clusters.values());
    let root = remainingClusters[0];
    if (!root) {
      dendrogram = void 0;
    } else {
      for (let i = 1; i < remainingClusters.length; i++) {
        const currentCluster = remainingClusters[i];
        if (!currentCluster) continue;
        const newRoot = {
          id: (nextClusterId++).toString(),
          members: /* @__PURE__ */ new Set([...root.members, ...currentCluster.members]),
          left: root,
          right: currentCluster,
          distance: Infinity,
          size: root.size + currentCluster.size
        };
        root = newRoot;
      }
    }
    dendrogram = root;
  }
  dendrogram ??= Array.from(clusters.values())[0];
  const finalNumClusters = numClusters ?? clusters.size;
  const flatClusters = dendrogram ? extractFlatClustering(dendrogram, finalNumClusters) : /* @__PURE__ */ new Map();
  if (!dendrogram) {
    throw new Error("Failed to create dendrogram");
  }
  return {
    dendrogram,
    clusters: flatClusters,
    distances: mergeDistances,
    numClusters: finalNumClusters
  };
}
function calculateDistanceMatrix(graph, nodes, useGraphDistance) {
  const n = nodes.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  if (useGraphDistance) {
    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      if (!node) continue;
      const distances = bfsShortestPaths(graph, node.id);
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const targetNode = nodes[j];
          if (targetNode) {
            const distance = distances.get(targetNode.id);
            matrix[i][j] = distance ?? Infinity;
          }
        } else {
          matrix[i][j] = 0;
        }
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        if (node1 && node2) {
          const hasEdge = graph.hasEdge(node1.id, node2.id);
          const distance = hasEdge ? 1 : 2;
          matrix[i][j] = distance;
          matrix[j][i] = distance;
        }
      }
      matrix[i][i] = 0;
    }
  }
  return matrix;
}
function bfsShortestPaths(graph, source) {
  const distances = /* @__PURE__ */ new Map();
  const queue = [[source, 0]];
  const visited = /* @__PURE__ */ new Set();
  visited.add(source);
  distances.set(source, 0);
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      break;
    }
    const [current, distance] = item;
    for (const neighbor of graph.neighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        distances.set(neighbor, distance + 1);
        queue.push([neighbor, distance + 1]);
      }
    }
  }
  return distances;
}
function initializeMergeCandidates(clusters, distanceMatrix) {
  const candidates = [];
  const clusterIds = Array.from(clusters.keys());
  for (let i = 0; i < clusterIds.length; i++) {
    for (let j = i + 1; j < clusterIds.length; j++) {
      const id1 = clusterIds[i];
      const id2 = clusterIds[j];
      if (!id1 || !id2) continue;
      const row = distanceMatrix[parseInt(id1)];
      if (!row) continue;
      const distance = row[parseInt(id2)] ?? Infinity;
      candidates.push({
        cluster1Id: id1,
        cluster2Id: id2,
        distance: distance === Infinity ? 100 : distance
      });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates;
}
function findClosestPair(mergeCandidates) {
  const candidate = mergeCandidates.shift();
  if (!candidate) {
    throw new Error("No merge candidates available");
  }
  return candidate;
}
function updateMergeCandidates(mergeCandidates, oldCluster1Id, oldCluster2Id, newClusterId, clusters, distanceMatrix, linkage) {
  for (let i = mergeCandidates.length - 1; i >= 0; i--) {
    const candidate = mergeCandidates[i];
    if (!candidate) continue;
    if (candidate.cluster1Id === oldCluster1Id || candidate.cluster1Id === oldCluster2Id || candidate.cluster2Id === oldCluster1Id || candidate.cluster2Id === oldCluster2Id) {
      mergeCandidates.splice(i, 1);
    }
  }
  const newCluster = clusters.get(newClusterId);
  if (!newCluster) {
    return;
  }
  for (const [clusterId, cluster] of clusters) {
    if (clusterId !== newClusterId) {
      const distance = calculateClusterDistance(newCluster, cluster, distanceMatrix, linkage);
      mergeCandidates.push({
        cluster1Id: newClusterId,
        cluster2Id: clusterId,
        distance: distance === Infinity ? 100 : distance
      });
    }
  }
  mergeCandidates.sort((a, b) => a.distance - b.distance);
}
function calculateClusterDistance(cluster1, cluster2, distanceMatrix, linkage) {
  const members1 = Array.from(cluster1.members);
  const members2 = Array.from(cluster2.members);
  const distances = [];
  for (const member1 of members1) {
    for (const member2 of members2) {
      const idx1 = parseInt(member1.toString());
      const idx2 = parseInt(member2.toString());
      if (idx1 < distanceMatrix.length && idx2 < distanceMatrix.length) {
        const row = distanceMatrix[idx1];
        if (row) {
          const distance = row[idx2];
          if (distance !== void 0) {
            distances.push(distance);
          }
        }
      }
    }
  }
  if (distances.length === 0) {
    return Infinity;
  }
  switch (linkage) {
    case "single":
      return Math.min(...distances);
    case "complete":
      return Math.max(...distances);
    case "average":
      return distances.reduce((sum, d) => sum + d, 0) / distances.length;
    case "ward":
      return distances.reduce((sum, d) => sum + d * d, 0) / distances.length;
    default:
      return distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }
}
function extractFlatClustering(dendrogram, numClusters) {
  const clusters = /* @__PURE__ */ new Map();
  if (numClusters === 1) {
    const clusterId = 0;
    for (const member of dendrogram.members) {
      clusters.set(member, clusterId);
    }
    return clusters;
  }
  const clusterNodes = [];
  const queue = [dendrogram];
  while (queue.length > 0 && clusterNodes.length < numClusters) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (!current.left || !current.right || clusterNodes.length + queue.length + 1 >= numClusters) {
      clusterNodes.push(current);
    } else {
      queue.push(current.left, current.right);
    }
  }
  for (let i = 0; i < clusterNodes.length; i++) {
    const cluster = clusterNodes[i];
    if (!cluster) continue;
    for (const member of cluster.members) {
      clusters.set(member, i);
    }
  }
  return clusters;
}
function grsbm(graph, config = {}) {
  const {
    maxDepth = 10,
    minClusterSize = 2,
    // Reduced default to allow more splits
    numEigenvectors = 2,
    tolerance = 1e-6,
    maxIterations = 100,
    seed = 42
  } = config;
  Math.random = seedRandom(seed);
  const nodes = Array.from(graph.nodes());
  const nodeCount = nodes.length;
  if (nodeCount === 0) {
    throw new Error("Cannot cluster empty graph");
  }
  const rootMembers = new Set(nodes.map((node) => node.id));
  const initialModularity = calculateModularity(graph, new Map([...rootMembers].map((id) => [id, 0])));
  const root = {
    id: "root",
    members: rootMembers,
    modularity: initialModularity,
    depth: 0,
    spectralScore: 0
  };
  const explanations = [];
  const modularityScores = [initialModularity];
  const clusterQueue = [root];
  let nextClusterId = 1;
  while (clusterQueue.length > 0) {
    const currentCluster = clusterQueue.shift();
    if (!currentCluster) {
      continue;
    }
    if (currentCluster.depth >= maxDepth || currentCluster.members.size < minClusterSize * 2) {
      continue;
    }
    const bisectionResult = spectralBisection(
      graph,
      currentCluster,
      numEigenvectors,
      tolerance,
      maxIterations
    );
    if (!bisectionResult) {
      continue;
    }
    const { leftMembers, rightMembers, spectralScore, keyNodes, spectralValues, reason } = bisectionResult;
    const leftCluster = {
      id: `cluster_${String(nextClusterId++)}`,
      members: leftMembers,
      modularity: 0,
      // Will be calculated below
      depth: currentCluster.depth + 1,
      spectralScore
    };
    const rightCluster = {
      id: `cluster_${String(nextClusterId++)}`,
      members: rightMembers,
      modularity: 0,
      // Will be calculated below
      depth: currentCluster.depth + 1,
      spectralScore
    };
    const newAssignment = /* @__PURE__ */ new Map();
    for (const nodeId of leftMembers) {
      newAssignment.set(nodeId, 0);
    }
    for (const nodeId of rightMembers) {
      newAssignment.set(nodeId, 1);
    }
    const newModularity = calculateModularity(graph, newAssignment);
    const modularityImprovement = newModularity - currentCluster.modularity;
    if (modularityImprovement >= -0.01) {
      leftCluster.modularity = newModularity;
      rightCluster.modularity = newModularity;
      currentCluster.left = leftCluster;
      currentCluster.right = rightCluster;
      explanations.push({
        clusterId: currentCluster.id,
        reason,
        modularityImprovement,
        keyNodes,
        spectralValues
      });
      modularityScores.push(newModularity);
      clusterQueue.push(leftCluster, rightCluster);
    }
  }
  const clusters = /* @__PURE__ */ new Map();
  let clusterId = 0;
  function assignClusterIds(cluster) {
    if (!cluster.left && !cluster.right) {
      for (const nodeId of cluster.members) {
        clusters.set(nodeId, clusterId);
      }
      clusterId++;
    } else {
      if (cluster.left) {
        assignClusterIds(cluster.left);
      }
      if (cluster.right) {
        assignClusterIds(cluster.right);
      }
    }
  }
  assignClusterIds(root);
  return {
    root,
    clusters,
    numClusters: clusterId,
    modularityScores,
    explanation: explanations
  };
}
function spectralBisection(graph, cluster, numEigenvectors, tolerance, maxIterations) {
  const members = Array.from(cluster.members);
  const n = members.length;
  if (n < 4) {
    return null;
  }
  const laplacian = createLaplacianMatrix(graph, members);
  const eigenvector = computeFiedlerVector(laplacian, tolerance, maxIterations);
  if (!eigenvector) {
    return null;
  }
  const sortedIndices = eigenvector.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  let bestSplitIndex = Math.floor(n / 2);
  let bestModularity = -Infinity;
  for (let splitIndex = Math.floor(n * 0.2); splitIndex <= Math.floor(n * 0.8); splitIndex++) {
    const leftIndices2 = sortedIndices.slice(0, splitIndex).map((item) => item.index);
    const rightIndices2 = sortedIndices.slice(splitIndex).map((item) => item.index);
    const assignment = /* @__PURE__ */ new Map();
    for (const idx of leftIndices2) {
      const nodeId = members[idx];
      if (nodeId !== void 0) {
        assignment.set(nodeId, 0);
      }
    }
    for (const idx of rightIndices2) {
      const nodeId = members[idx];
      if (nodeId !== void 0) {
        assignment.set(nodeId, 1);
      }
    }
    const modularity = calculateModularity(graph, assignment);
    if (modularity > bestModularity) {
      bestModularity = modularity;
      bestSplitIndex = splitIndex;
    }
  }
  const leftIndices = sortedIndices.slice(0, bestSplitIndex).map((item) => item.index);
  const rightIndices = sortedIndices.slice(bestSplitIndex).map((item) => item.index);
  const leftMembers = /* @__PURE__ */ new Set();
  const rightMembers = /* @__PURE__ */ new Set();
  for (const idx of leftIndices) {
    const nodeId = members[idx];
    if (nodeId !== void 0) {
      leftMembers.add(nodeId);
    }
  }
  for (const idx of rightIndices) {
    const nodeId = members[idx];
    if (nodeId !== void 0) {
      rightMembers.add(nodeId);
    }
  }
  const extremeThreshold = 0.1;
  const sortedValues = [...eigenvector].sort((a, b) => Math.abs(b) - Math.abs(a));
  const threshold = sortedValues[Math.floor(sortedValues.length * extremeThreshold)] ?? 0;
  const keyNodes = [];
  for (let i = 0; i < eigenvector.length; i++) {
    const eigenValue = eigenvector[i];
    if (eigenValue !== void 0 && Math.abs(eigenValue) >= Math.abs(threshold)) {
      const nodeId = members[i];
      if (nodeId !== void 0) {
        keyNodes.push(nodeId);
      }
    }
  }
  const firstValue = sortedValues[0] ?? 0;
  const lastValue = sortedValues[sortedValues.length - 1] ?? 0;
  const spectralScore = Math.abs(firstValue - lastValue);
  const reason = `Spectral bisection based on Fiedler vector with modularity ${bestModularity.toFixed(3)}. Split creates clusters of sizes ${String(leftMembers.size)} and ${String(rightMembers.size)}.`;
  return {
    leftMembers,
    rightMembers,
    spectralScore,
    keyNodes: keyNodes.slice(0, 5),
    // Top 5 key nodes
    spectralValues: eigenvector,
    reason
  };
}
function createLaplacianMatrix(graph, nodes) {
  const n = nodes.length;
  const nodeIndex = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    if (node !== void 0) {
      nodeIndex.set(node, i);
    }
  }
  const laplacian = Array.from({ length: n }, () => new Array(n).fill(0));
  const degrees = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const nodeId = nodes[i];
    if (nodeId === void 0) continue;
    for (const neighbor of graph.neighbors(nodeId)) {
      const neighborIdx = nodeIndex.get(neighbor);
      if (neighborIdx !== void 0) {
        laplacian[i][neighborIdx] = -1;
        degrees[i]++;
      }
    }
  }
  for (let i = 0; i < n; i++) {
    laplacian[i][i] = degrees[i];
  }
  return laplacian;
}
function computeFiedlerVector(laplacian, tolerance, maxIterations) {
  const n = laplacian.length;
  if (n < 2) {
    return null;
  }
  let vector = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    vector[i] = Math.random() - 0.5;
  }
  const mean = vector.reduce((sum, val) => sum + val, 0) / n;
  for (let i = 0; i < n; i++) {
    vector[i] -= mean;
  }
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < n; i++) {
      vector[i] /= norm;
    }
  }
  for (let iter = 0; iter < maxIterations; iter++) {
    const newVector = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += laplacian[i][j] * vector[j];
      }
      newVector[i] = sum;
    }
    for (let i = 0; i < n; i++) {
      newVector[i] = -newVector[i];
    }
    const newMean = newVector.reduce((sum, val) => sum + val, 0) / n;
    for (let i = 0; i < n; i++) {
      newVector[i] -= newMean;
    }
    const newNorm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
    if (newNorm < tolerance) {
      break;
    }
    for (let i = 0; i < n; i++) {
      newVector[i] /= newNorm;
    }
    let diff = 0;
    for (let i = 0; i < n; i++) {
      const newVal = newVector[i];
      const oldVal = vector[i];
      if (newVal !== void 0 && oldVal !== void 0) {
        diff += Math.abs(newVal - oldVal);
      }
    }
    vector = newVector;
    if (diff < tolerance) {
      break;
    }
  }
  return vector;
}
function calculateModularity(graph, assignment) {
  const totalEdges = graph.uniqueEdgeCount;
  if (totalEdges === 0) {
    return 0;
  }
  let modularity = 0;
  const communities = /* @__PURE__ */ new Map();
  for (const [nodeId, communityId] of assignment) {
    if (!communities.has(communityId)) {
      communities.set(communityId, /* @__PURE__ */ new Set());
    }
    const community = communities.get(communityId);
    if (community) {
      community.add(nodeId);
    }
  }
  for (const [, members] of communities) {
    let internalEdges = 0;
    let totalDegree = 0;
    for (const nodeId of members) {
      const nodeDegree = graph.degree(nodeId);
      totalDegree += nodeDegree;
      for (const neighbor of graph.neighbors(nodeId)) {
        if (members.has(neighbor)) {
          internalEdges++;
        }
      }
    }
    internalEdges /= 2;
    const expectedEdges = totalDegree * totalDegree / (4 * totalEdges);
    modularity += (internalEdges - expectedEdges) / totalEdges;
  }
  return modularity;
}
function seedRandom(seed) {
  const m = 2147483648;
  const a = 1103515245;
  const c = 12345;
  seed = seed % m;
  return function() {
    seed = (a * seed + c) % m;
    return seed / (m - 1);
  };
}
export {
  Graph,
  PriorityQueue,
  UnionFind,
  adamicAdarForPairs,
  adamicAdarPrediction,
  adamicAdarScore,
  allPairsShortestPath,
  astar,
  astarWithDetails,
  bellmanFord,
  bellmanFordPath,
  betweennessCentrality,
  bipartitePartition,
  breadthFirstSearch,
  calculateMCLModularity,
  closenessCentrality,
  commonNeighborsForPairs,
  commonNeighborsPrediction,
  commonNeighborsScore,
  compareAdamicAdarWithCommonNeighbors,
  condensationGraph,
  connectedComponents,
  connectedComponentsDFS,
  createBipartiteFlowNetwork,
  cutDendrogram,
  cutDendrogramKClusters,
  degeneracyOrdering,
  degreeCentrality,
  depthFirstSearch,
  dijkstra,
  dijkstraPath,
  edgeBetweennessCentrality,
  edmondsKarp,
  eigenvectorCentrality,
  evaluateAdamicAdar,
  evaluateCommonNeighbors,
  findAllIsomorphisms,
  findStronglyConnectedComponents,
  floydWarshall,
  floydWarshallPath,
  fordFulkerson,
  getConnectedComponent,
  getKCore,
  getKCoreSubgraph,
  getTopAdamicAdarCandidatesForNode,
  getTopCandidatesForNode,
  girvanNewman,
  greedyBipartiteMatching,
  grsbm,
  hasCycleDFS,
  hasNegativeCycle,
  heuristics,
  hierarchicalClustering,
  hits,
  isBipartite,
  isConnected,
  isGraphIsomorphic,
  isStronglyConnected,
  isWeaklyConnected,
  kCoreDecomposition,
  kTruss,
  kargerMinCut,
  katzCentrality,
  kruskalMST,
  labelPropagation,
  labelPropagationAsync,
  labelPropagationSemiSupervised,
  largestConnectedComponent,
  leiden,
  louvain,
  markovClustering,
  maximumBipartiteMatching,
  minSTCut,
  minimumSpanningTree,
  modularityHierarchicalClustering,
  nodeBetweennessCentrality,
  nodeClosenessCentrality,
  nodeDegreeCentrality,
  nodeEigenvectorCentrality,
  nodeHITS,
  nodeKatzCentrality,
  nodeWeightedClosenessCentrality,
  numberOfConnectedComponents,
  pageRank,
  pageRankCentrality,
  pathfindingUtils,
  personalizedPageRank,
  primMST,
  shortestPathBFS,
  singleSourceShortestPath,
  singleSourceShortestPathBFS,
  spectralClustering,
  stoerWagner,
  stronglyConnectedComponents,
  syncClustering,
  teraHAC,
  toUndirected,
  topPageRankNodes,
  topologicalSort,
  transitiveClosure,
  weaklyConnectedComponents,
  weightedClosenessCentrality
};
//# sourceMappingURL=algorithms.js.map
