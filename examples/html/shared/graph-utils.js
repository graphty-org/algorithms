/**
 * Graph generation utilities for HTML examples
 * Provides various graph types for testing algorithms
 */

export class GraphGenerator {
  /**
   * Generate a random graph using Erdős–Rényi model
   * @param {number} nodeCount - Number of nodes
   * @param {number} probability - Edge probability (0-1)
   * @returns {Object} Graph object with nodes and edges
   */
  static randomGraph(nodeCount = 10, probability = 0.3) {
    const nodes = [];
    const edges = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        label: i.toString(),
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50
      });
    }
    
    // Create edges based on probability
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (Math.random() < probability) {
          edges.push({
            source: i,
            target: j,
            weight: Math.floor(Math.random() * 10) + 1
          });
        }
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a complete graph
   * @param {number} nodeCount - Number of nodes
   * @returns {Object} Graph object with nodes and edges
   */
  static completeGraph(nodeCount = 6) {
    const nodes = [];
    const edges = [];
    
    // Arrange nodes in a circle
    const centerX = 250;
    const centerY = 250;
    const radius = 150;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount;
      nodes.push({
        id: i,
        label: i.toString(),
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    
    // Connect all pairs of nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        edges.push({
          source: i,
          target: j,
          weight: Math.floor(Math.random() * 10) + 1
        });
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a cycle graph
   * @param {number} nodeCount - Number of nodes
   * @returns {Object} Graph object with nodes and edges
   */
  static cycleGraph(nodeCount = 8) {
    const nodes = [];
    const edges = [];
    
    // Arrange nodes in a circle
    const centerX = 250;
    const centerY = 250;
    const radius = 150;
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount;
      nodes.push({
        id: i,
        label: i.toString(),
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    
    // Connect consecutive nodes in a cycle
    for (let i = 0; i < nodeCount; i++) {
      edges.push({
        source: i,
        target: (i + 1) % nodeCount,
        weight: Math.floor(Math.random() * 10) + 1
      });
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a star graph
   * @param {number} nodeCount - Number of nodes (including center)
   * @returns {Object} Graph object with nodes and edges
   */
  static starGraph(nodeCount = 8) {
    const nodes = [];
    const edges = [];
    
    // Center node
    nodes.push({
      id: 0,
      label: '0',
      x: 250,
      y: 250
    });
    
    // Surrounding nodes
    const radius = 120;
    for (let i = 1; i < nodeCount; i++) {
      const angle = (2 * Math.PI * (i - 1)) / (nodeCount - 1);
      nodes.push({
        id: i,
        label: i.toString(),
        x: 250 + radius * Math.cos(angle),
        y: 250 + radius * Math.sin(angle)
      });
      
      // Connect to center
      edges.push({
        source: 0,
        target: i,
        weight: Math.floor(Math.random() * 10) + 1
      });
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a grid graph
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @returns {Object} Graph object with nodes and edges
   */
  static gridGraph(width = 4, height = 4) {
    const nodes = [];
    const edges = [];
    
    const cellWidth = 400 / (width + 1);
    const cellHeight = 400 / (height + 1);
    
    // Create nodes in grid formation
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const id = row * width + col;
        nodes.push({
          id,
          label: id.toString(),
          x: (col + 1) * cellWidth + 50,
          y: (row + 1) * cellHeight + 50
        });
      }
    }
    
    // Create edges (4-connected grid)
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const id = row * width + col;
        
        // Connect to right neighbor
        if (col < width - 1) {
          edges.push({
            source: id,
            target: id + 1,
            weight: Math.floor(Math.random() * 10) + 1
          });
        }
        
        // Connect to bottom neighbor
        if (row < height - 1) {
          edges.push({
            source: id,
            target: id + width,
            weight: Math.floor(Math.random() * 10) + 1
          });
        }
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a path graph
   * @param {number} nodeCount - Number of nodes
   * @returns {Object} Graph object with nodes and edges
   */
  static pathGraph(nodeCount = 8) {
    const nodes = [];
    const edges = [];
    
    // Arrange nodes in a line
    const spacing = 400 / (nodeCount + 1);
    
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        label: i.toString(),
        x: (i + 1) * spacing + 50,
        y: 250
      });
      
      // Connect to next node
      if (i < nodeCount - 1) {
        edges.push({
          source: i,
          target: i + 1,
          weight: Math.floor(Math.random() * 10) + 1
        });
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a bipartite graph
   * @param {number} leftNodes - Number of nodes in left partition
   * @param {number} rightNodes - Number of nodes in right partition
   * @param {number} probability - Edge probability between partitions
   * @returns {Object} Graph object with nodes and edges
   */
  static bipartiteGraph(leftNodes = 4, rightNodes = 4, probability = 0.5) {
    const nodes = [];
    const edges = [];
    
    // Left partition
    for (let i = 0; i < leftNodes; i++) {
      nodes.push({
        id: i,
        label: i.toString(),
        x: 150,
        y: (i + 1) * (400 / (leftNodes + 1)) + 50,
        partition: 'left'
      });
    }
    
    // Right partition
    for (let i = 0; i < rightNodes; i++) {
      const id = leftNodes + i;
      nodes.push({
        id,
        label: id.toString(),
        x: 350,
        y: (i + 1) * (400 / (rightNodes + 1)) + 50,
        partition: 'right'
      });
    }
    
    // Connect between partitions
    for (let i = 0; i < leftNodes; i++) {
      for (let j = leftNodes; j < leftNodes + rightNodes; j++) {
        if (Math.random() < probability) {
          edges.push({
            source: i,
            target: j,
            weight: Math.floor(Math.random() * 10) + 1
          });
        }
      }
    }
    
    return { nodes, edges };
  }
  
  /**
   * Generate a tree graph
   * @param {number} depth - Tree depth
   * @param {number} branchingFactor - Number of children per node
   * @returns {Object} Graph object with nodes and edges
   */
  static treeGraph(depth = 3, branchingFactor = 2) {
    const nodes = [];
    const edges = [];
    let nodeId = 0;
    
    // Calculate total width needed
    const maxWidth = Math.pow(branchingFactor, depth - 1);
    const levelHeight = 400 / (depth + 1);
    
    function addNode(level, position, totalAtLevel) {
      const id = nodeId++;
      const x = 50 + (position + 1) * (400 / (totalAtLevel + 1));
      const y = 50 + (level + 1) * levelHeight;
      
      nodes.push({
        id,
        label: id.toString(),
        x,
        y
      });
      
      return id;
    }
    
    function buildTree(level, position, totalAtLevel, parentId = null) {
      if (level >= depth) return;
      
      const nodeId = addNode(level, position, totalAtLevel);
      
      if (parentId !== null) {
        edges.push({
          source: parentId,
          target: nodeId,
          weight: Math.floor(Math.random() * 10) + 1
        });
      }
      
      if (level < depth - 1) {
        const childrenAtNextLevel = Math.pow(branchingFactor, level + 1);
        const startPos = position * branchingFactor;
        
        for (let i = 0; i < branchingFactor; i++) {
          buildTree(level + 1, startPos + i, childrenAtNextLevel, nodeId);
        }
      }
    }
    
    buildTree(0, 0, 1);
    
    return { nodes, edges };
  }
}

/**
 * Graph format converters and utilities
 */
export class GraphUtils {
  /**
   * Convert graph to adjacency list format
   * @param {Object} graph - Graph object with nodes and edges
   * @returns {Map} Adjacency list representation
   */
  static toAdjacencyList(graph) {
    const adjList = new Map();
    
    // Initialize with all nodes
    graph.nodes.forEach(node => {
      adjList.set(node.id, []);
    });
    
    // Add edges
    graph.edges.forEach(edge => {
      adjList.get(edge.source).push({
        target: edge.target,
        weight: edge.weight || 1
      });
      
      // For undirected graphs, add reverse edge
      adjList.get(edge.target).push({
        target: edge.source,
        weight: edge.weight || 1
      });
    });
    
    return adjList;
  }
  
  /**
   * Convert graph to adjacency matrix format
   * @param {Object} graph - Graph object with nodes and edges
   * @returns {Array} 2D adjacency matrix
   */
  static toAdjacencyMatrix(graph) {
    const n = graph.nodes.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(Infinity));
    
    // Set diagonal to 0
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
    }
    
    // Fill in edges
    graph.edges.forEach(edge => {
      const weight = edge.weight || 1;
      matrix[edge.source][edge.target] = weight;
      matrix[edge.target][edge.source] = weight; // Undirected
    });
    
    return matrix;
  }
  
  /**
   * Get node by ID
   * @param {Object} graph - Graph object
   * @param {number} id - Node ID
   * @returns {Object|null} Node object or null
   */
  static getNode(graph, id) {
    return graph.nodes.find(node => node.id === id) || null;
  }
  
  /**
   * Get neighbors of a node
   * @param {Object} graph - Graph object
   * @param {number} nodeId - Node ID
   * @returns {Array} Array of neighbor node IDs
   */
  static getNeighbors(graph, nodeId) {
    const neighbors = [];
    
    graph.edges.forEach(edge => {
      if (edge.source === nodeId) {
        neighbors.push(edge.target);
      } else if (edge.target === nodeId) {
        neighbors.push(edge.source);
      }
    });
    
    return neighbors;
  }
  
  /**
   * Calculate graph statistics
   * @param {Object} graph - Graph object
   * @returns {Object} Graph statistics
   */
  static getGraphStats(graph) {
    const nodeCount = graph.nodes.length;
    const edgeCount = graph.edges.length;
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
    
    // Calculate degree distribution
    const degrees = new Array(nodeCount).fill(0);
    graph.edges.forEach(edge => {
      degrees[edge.source]++;
      degrees[edge.target]++;
    });
    
    const avgDegree = degrees.reduce((sum, deg) => sum + deg, 0) / nodeCount;
    const maxDegree = Math.max(...degrees);
    const minDegree = Math.min(...degrees);
    
    return {
      nodeCount,
      edgeCount,
      density: Math.round(density * 1000) / 1000,
      avgDegree: Math.round(avgDegree * 100) / 100,
      maxDegree,
      minDegree
    };
  }
}