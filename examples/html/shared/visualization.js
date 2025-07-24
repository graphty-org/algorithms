/**
 * SVG-based graph visualization utilities
 * Handles rendering and animation of graph algorithms
 */

export class GraphVisualizer {
  constructor(svgElement, width = 500, height = 500) {
    this.svg = svgElement;
    this.width = width;
    this.height = height;
    this.graph = null;
    this.nodeElements = new Map();
    this.edgeElements = new Map();
    this.labelElements = new Map();
    
    // Set up SVG
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Create groups for layering
    this.edgeGroup = this.createGroup('edges');
    this.nodeGroup = this.createGroup('nodes');
    this.labelGroup = this.createGroup('labels');
    
    // Event handlers
    this.onNodeClick = null;
    this.onNodeHover = null;
  }
  
  createGroup(className) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', className);
    this.svg.appendChild(group);
    return group;
  }
  
  /**
   * Render a graph
   * @param {Object} graph - Graph object with nodes and edges
   */
  render(graph) {
    this.graph = graph;
    this.clear();
    
    // Render edges first (so they appear behind nodes)
    graph.edges.forEach((edge, index) => {
      this.renderEdge(edge, index);
    });
    
    // Render nodes
    graph.nodes.forEach(node => {
      this.renderNode(node);
      this.renderNodeLabel(node);
    });
  }
  
  /**
   * Clear the visualization
   */
  clear() {
    this.edgeGroup.innerHTML = '';
    this.nodeGroup.innerHTML = '';
    this.labelGroup.innerHTML = '';
    this.nodeElements.clear();
    this.edgeElements.clear();
    this.labelElements.clear();
  }
  
  /**
   * Render a single node
   * @param {Object} node - Node object
   */
  renderNode(node) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.radius || 20);
    circle.setAttribute('class', 'node');
    circle.setAttribute('data-id', node.id);
    
    // Add event listeners
    circle.addEventListener('click', (e) => {
      if (this.onNodeClick) {
        this.onNodeClick(node, e);
      }
    });
    
    circle.addEventListener('mouseenter', (e) => {
      if (this.onNodeHover) {
        this.onNodeHover(node, e, true);
      }
    });
    
    circle.addEventListener('mouseleave', (e) => {
      if (this.onNodeHover) {
        this.onNodeHover(node, e, false);
      }
    });
    
    this.nodeGroup.appendChild(circle);
    this.nodeElements.set(node.id, circle);
  }
  
  /**
   * Render a node label
   * @param {Object} node - Node object
   */
  renderNodeLabel(node) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y);
    text.setAttribute('class', 'node-label');
    text.textContent = node.label || node.id;
    
    this.labelGroup.appendChild(text);
    this.labelElements.set(node.id, text);
  }
  
  /**
   * Render a single edge
   * @param {Object} edge - Edge object
   * @param {number} index - Edge index
   */
  renderEdge(edge, index) {
    const sourceNode = this.graph.nodes.find(n => n.id === edge.source);
    const targetNode = this.graph.nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sourceNode.x);
    line.setAttribute('y1', sourceNode.y);
    line.setAttribute('x2', targetNode.x);
    line.setAttribute('y2', targetNode.y);
    line.setAttribute('class', 'edge');
    line.setAttribute('data-source', edge.source);
    line.setAttribute('data-target', edge.target);
    
    this.edgeGroup.appendChild(line);
    
    const edgeKey = `${edge.source}-${edge.target}`;
    this.edgeElements.set(edgeKey, line);
    
    // Add weight label if specified
    if (edge.weight !== undefined) {
      this.renderEdgeWeight(edge, sourceNode, targetNode);
    }
  }
  
  /**
   * Render edge weight label
   * @param {Object} edge - Edge object
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   */
  renderEdgeWeight(edge, sourceNode, targetNode) {
    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midX);
    text.setAttribute('y', midY - 5);
    text.setAttribute('class', 'edge-weight');
    text.setAttribute('text-anchor', 'middle');
    text.style.fontSize = '10px';
    text.style.fill = '#666';
    text.textContent = edge.weight;
    
    this.labelGroup.appendChild(text);
  }
  
  /**
   * Highlight a node with a specific state
   * @param {number} nodeId - Node ID
   * @param {string} state - State class (visited, current, selected, etc.)
   */
  highlightNode(nodeId, state) {
    const element = this.nodeElements.get(nodeId);
    if (element) {
      element.classList.add(state);
    }
  }
  
  /**
   * Remove highlight from a node
   * @param {number} nodeId - Node ID
   * @param {string} state - State class to remove
   */
  unhighlightNode(nodeId, state) {
    const element = this.nodeElements.get(nodeId);
    if (element) {
      element.classList.remove(state);
    }
  }
  
  /**
   * Highlight an edge
   * @param {number} sourceId - Source node ID
   * @param {number} targetId - Target node ID
   * @param {string} state - State class
   */
  highlightEdge(sourceId, targetId, state) {
    const edgeKey = `${sourceId}-${targetId}`;
    let element = this.edgeElements.get(edgeKey);
    
    // Try reverse direction for undirected graphs
    if (!element) {
      const reverseKey = `${targetId}-${sourceId}`;
      element = this.edgeElements.get(reverseKey);
    }
    
    if (element) {
      element.classList.add(state);
    }
  }
  
  /**
   * Remove highlight from an edge
   * @param {number} sourceId - Source node ID
   * @param {number} targetId - Target node ID
   * @param {string} state - State class to remove
   */
  unhighlightEdge(sourceId, targetId, state) {
    const edgeKey = `${sourceId}-${targetId}`;
    let element = this.edgeElements.get(edgeKey);
    
    // Try reverse direction for undirected graphs
    if (!element) {
      const reverseKey = `${targetId}-${sourceId}`;
      element = this.edgeElements.get(reverseKey);
    }
    
    if (element) {
      element.classList.remove(state);
    }
  }
  
  /**
   * Clear all highlights
   */
  clearHighlights() {
    // Clear node highlights
    this.nodeElements.forEach(element => {
      element.setAttribute('class', 'node');
    });
    
    // Clear edge highlights
    this.edgeElements.forEach(element => {
      element.setAttribute('class', 'edge');
    });
  }
  
  /**
   * Add distance label to a node
   * @param {number} nodeId - Node ID
   * @param {number|string} distance - Distance value
   */
  addDistanceLabel(nodeId, distance) {
    const node = this.graph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y + 35);
    text.setAttribute('class', 'distance-label');
    text.textContent = distance === Infinity ? '∞' : distance;
    
    this.labelGroup.appendChild(text);
    
    // Store for later removal
    const existingLabel = this.labelGroup.querySelector(`[data-node-id="${nodeId}"].distance-label`);
    if (existingLabel) {
      existingLabel.remove();
    }
    
    text.setAttribute('data-node-id', nodeId);
  }
  
  /**
   * Update distance label
   * @param {number} nodeId - Node ID
   * @param {number|string} distance - New distance value
   */
  updateDistanceLabel(nodeId, distance) {
    const label = this.labelGroup.querySelector(`[data-node-id="${nodeId}"].distance-label`);
    if (label) {
      label.textContent = distance === Infinity ? '∞' : distance;
    } else {
      this.addDistanceLabel(nodeId, distance);
    }
  }
  
  /**
   * Remove distance labels
   */
  clearDistanceLabels() {
    const labels = this.labelGroup.querySelectorAll('.distance-label');
    labels.forEach(label => label.remove());
  }
  
  /**
   * Animate node size change
   * @param {number} nodeId - Node ID
   * @param {number} newRadius - New radius
   * @param {number} duration - Animation duration in ms
   */
  animateNodeSize(nodeId, newRadius, duration = 300) {
    const element = this.nodeElements.get(nodeId);
    if (!element) return;
    
    const currentRadius = parseFloat(element.getAttribute('r'));
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const radius = currentRadius + (newRadius - currentRadius) * progress;
      element.setAttribute('r', radius);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Get node element by ID
   * @param {number} nodeId - Node ID
   * @returns {Element|null} SVG circle element
   */
  getNodeElement(nodeId) {
    return this.nodeElements.get(nodeId) || null;
  }
  
  /**
   * Get edge element by source and target
   * @param {number} sourceId - Source node ID
   * @param {number} targetId - Target node ID
   * @returns {Element|null} SVG line element
   */
  getEdgeElement(sourceId, targetId) {
    const edgeKey = `${sourceId}-${targetId}`;
    let element = this.edgeElements.get(edgeKey);
    
    if (!element) {
      const reverseKey = `${targetId}-${sourceId}`;
      element = this.edgeElements.get(reverseKey);
    }
    
    return element || null;
  }
}

/**
 * Animation controller for step-by-step algorithm visualization
 */
export class AnimationController {
  constructor(visualizer, speedMs = 1000) {
    this.visualizer = visualizer;
    this.speedMs = speedMs;
    this.isPlaying = false;
    this.isPaused = false;
    this.steps = [];
    this.currentStep = 0;
    this.timeoutId = null;
    
    // Callbacks
    this.onStepComplete = null;
    this.onAnimationComplete = null;
    this.onAnimationStart = null;
  }
  
  /**
   * Add an animation step
   * @param {Function} stepFunction - Function to execute for this step
   * @param {string} description - Step description
   */
  addStep(stepFunction, description = '') {
    this.steps.push({
      execute: stepFunction,
      description
    });
  }
  
  /**
   * Clear all steps
   */
  clearSteps() {
    this.steps = [];
    this.currentStep = 0;
  }
  
  /**
   * Start the animation
   */
  play() {
    if (this.isPlaying && !this.isPaused) return;
    
    this.isPlaying = true;
    this.isPaused = false;
    
    if (this.onAnimationStart) {
      this.onAnimationStart();
    }
    
    this.executeNextStep();
  }
  
  /**
   * Pause the animation
   */
  pause() {
    this.isPaused = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  /**
   * Stop the animation and reset
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentStep = 0;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    this.visualizer.clearHighlights();
    this.visualizer.clearDistanceLabels();
  }
  
  /**
   * Execute next step
   */
  executeNextStep() {
    if (!this.isPlaying || this.isPaused) return;
    
    if (this.currentStep >= this.steps.length) {
      this.isPlaying = false;
      if (this.onAnimationComplete) {
        this.onAnimationComplete();
      }
      return;
    }
    
    const step = this.steps[this.currentStep];
    step.execute();
    
    if (this.onStepComplete) {
      this.onStepComplete(this.currentStep, step);
    }
    
    this.currentStep++;
    
    this.timeoutId = setTimeout(() => {
      this.executeNextStep();
    }, this.speedMs);
  }
  
  /**
   * Execute single step (for manual stepping)
   */
  step() {
    if (this.currentStep >= this.steps.length) return;
    
    const step = this.steps[this.currentStep];
    step.execute();
    
    if (this.onStepComplete) {
      this.onStepComplete(this.currentStep, step);
    }
    
    this.currentStep++;
    
    if (this.currentStep >= this.steps.length && this.onAnimationComplete) {
      this.onAnimationComplete();
    }
  }
  
  /**
   * Reset to beginning
   */
  reset() {
    this.stop();
    this.visualizer.clearHighlights();
    this.visualizer.clearDistanceLabels();
  }
  
  /**
   * Set animation speed
   * @param {number} speedMs - Speed in milliseconds
   */
  setSpeed(speedMs) {
    this.speedMs = speedMs;
  }
  
  /**
   * Get current progress
   * @returns {number} Progress as percentage (0-100)
   */
  getProgress() {
    if (this.steps.length === 0) return 0;
    return Math.round((this.currentStep / this.steps.length) * 100);
  }
}

/**
 * Layout algorithms for positioning nodes
 */
export class LayoutAlgorithms {
  /**
   * Simple force-directed layout
   * @param {Object} graph - Graph object
   * @param {number} iterations - Number of iterations
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  static forceDirected(graph, iterations = 100, width = 500, height = 500) {
    const nodes = [...graph.nodes];
    const k = Math.sqrt((width * height) / nodes.length);
    
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate repulsive forces
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].dx = 0;
        nodes[i].dy = 0;
        
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const force = k * k / distance;
            nodes[i].dx += (dx / distance) * force;
            nodes[i].dy += (dy / distance) * force;
          }
        }
      }
      
      // Calculate attractive forces
      graph.edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = distance * distance / k;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.dx += fx;
          source.dy += fy;
          target.dx -= fx;
          target.dy -= fy;
        }
      });
      
      // Apply forces and constrain to bounds
      nodes.forEach(node => {
        const speed = Math.sqrt(node.dx * node.dx + node.dy * node.dy);
        if (speed > 0) {
          const factor = Math.min(speed, 5) / speed;
          node.x += node.dx * factor;
          node.y += node.dy * factor;
          
          // Keep within bounds
          node.x = Math.max(30, Math.min(width - 30, node.x));
          node.y = Math.max(30, Math.min(height - 30, node.y));
        }
      });
    }
    
    // Update original graph
    graph.nodes.forEach((node, i) => {
      node.x = nodes[i].x;
      node.y = nodes[i].y;
    });
  }
}