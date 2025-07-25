# HTML Examples Plan for @graphty/algorithms

## Overview

This document outlines the plan for creating interactive HTML examples for the @graphty/algorithms package, similar to the [graphty/layout examples](https://graphty-org.github.io/layout/examples/index.html). The examples will demonstrate each algorithm's functionality with interactive visualizations.

## Current Approach and Design Principles

Based on our existing HTML examples (particularly BFS and DFS), our approach emphasizes:

### **Educational Focus**
- **Simple, intuitive metaphors**: Algorithms explained with clear analogies (BFS as "ripples in water", DFS as "exploring a maze")
- **Visual progression**: Step-by-step animations with deliberate 1.5-2 second timing for comprehension
- **Color-coded states**: Consistent visual indicators (unvisited/current/visited) with legends
- **Progressive disclosure**: Context-appropriate explanations appear alongside visualizations

### **Package Integration**
- **Direct usage**: Examples must demonstrate actual usage of @graphty/algorithms package
- **Module pattern**: Each algorithm pairs `.html` with `.js` using clean ES6 imports/exports
- **Bundled dependencies**: Package bundled into category-specific files (e.g., `traversal-algorithms.js`)
- **Standard graph format**: Consistent nodes/edges array structure across all examples

### **Interactive Learning**
- **Single-button simplicity**: Clear "Start" button to initiate algorithm visualization
- **Real-time feedback**: Step-by-step status updates ("Starting at node A", "Visiting node B")
- **Algorithm mechanics**: Internal state visualization (BFS queue, DFS stack) for educational transparency
- **Code transparency**: Collapsible sections showing actual implementation with syntax highlighting

### **Consistency Standards** (Based on BFS/DFS Examples)
- **Visual timing**: 1.5-2 second intervals between algorithm steps
- **Color scheme**: Blue (#2c5aa0) headers, green (#4CAF50) actions, consistent state colors
- **SVG rendering**: Direct SVG manipulation for clarity and educational value
- **Mobile support**: Responsive design with Eruda console for debugging
- **Navigation**: Clear "Back to Index" links and disabled controls during animation
- **Educational enhancements**: Visit order numbers, complexity information, use case descriptions

## Strict HTML Structure Requirements

### **1. HTML Document Structure**
Each algorithm HTML file MUST follow this exact structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- MANDATORY: Eruda Mobile Console (exact code) -->
    <script src="https://cdn.jsdelivr.net/npm/eruda@3/eruda.min.js"></script>
    <script>
      if (typeof eruda !== "undefined") {
        eruda.init();
        if (/mobile|android|ios|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())) {
          eruda.show();
        }
      }
    </script>
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Algorithm Name] - Simple Visual Explanation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css">
    <style>
        /* MANDATORY STYLES - DO NOT MODIFY */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5; /* Light gray background */
        }
        
        h1 {
            color: #2c5aa0; /* Blue header */
            text-align: center;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        #graph {
            width: 100%;
            height: 400px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        button {
            background: #4CAF50; /* Green button */
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .explanation {
            background: #e8f0fe;
            border-left: 4px solid #2c5aa0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        /* Additional algorithm-specific styles here */
    </style>
</head>
<body>
    <a href="../../index.html" class="back-link">← Back to Examples</a>
    
    <h1>[Algorithm Name] Explained</h1>
    
    <div class="container">
        <div class="intro">
            <p><strong>[Simple one-line metaphor]</strong></p>
            <p>[Additional explanation in simple terms]</p>
        </div>
        
        <svg id="graph"></svg>
        
        <!-- Algorithm-specific info displays (queue, priority queue, etc.) -->
        
        <div class="step-info" id="step-info">Click "Start" to see how [Algorithm] works</div>
        
        <div class="legend">
            <!-- Legend items -->
        </div>
        
        <div class="controls">
            <button id="start-btn" onclick="startAlgorithm()">Start [Algorithm]</button>
        </div>
        
        <div class="explanation">
            <h3>Key Concept:</h3>
            <p>[Educational explanation]</p>
        </div>
        
        <div class="code-section">
            <div class="code-header">
                <h3>Code Example</h3>
                <button class="code-toggle" id="code-toggle">Hide Code ▲</button>
            </div>
            <div class="code-content" id="code-content">
                <pre><code class="language-javascript" id="code-display">Loading code...</code></pre>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    
    <script type="module">
        // EMBEDDED JavaScript code here
    </script>
</body>
</html>
```

### **2. Critical Style Requirements**
- **Background**: Body MUST have `background: #f5f5f5` (light gray)
- **Container**: White background with shadow: `background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1)`
- **Headers**: MUST use `color: #2c5aa0` (blue)
- **Buttons**: MUST use `background: #4CAF50` (green) with white text
- **Graph**: MUST have `border: 2px solid #e0e0e0` and `border-radius: 8px`
- **NO DARK COLORS**: Do not use dark backgrounds or themes

### **3. JavaScript Structure**
JavaScript MUST be embedded in the HTML file within a `<script type="module">` tag, NOT in a separate file for the main logic. The structure should be:

```javascript
// Import the algorithm function
import { runAlgorithmName } from './algorithm.js';

// Load and display the actual code
async function loadCodeExample() {
    // Fetch and display the .js file content
}

// Graph structure for visualization
const nodes = [...];
const edges = [...];

// Animation functions
window.startAlgorithm = function() {
    // Run algorithm
    const result = runAlgorithmName();
    console.log('[Algorithm] Result:', result);
    // Animate results
}

// Initialize on load
window.onload = initGraph;
```

### **4. Educational Requirements**
- **Simple metaphor**: Each algorithm MUST have a simple, relatable metaphor
- **Step-by-step messages**: Clear status messages during animation
- **Console logging**: Results MUST be logged for educational purposes
- **Code display**: The actual algorithm code MUST be loaded and displayed
- **Collapsible code section**: With toggle button functionality

### **5. Visual Requirements**
- **Node colors**: 
  - Unvisited: `#e0e0e0` (light gray)
  - Current/Active: `#ff9800` (orange)
  - Visited/Complete: `#4CAF50` (green)
  - Special states: Use light pastels, NOT dark colors
- **Animation timing**: 1500ms (1.5 seconds) between steps
- **SVG size**: `width="100%" height="400px"`

## Project Structure

```
examples/html/
├── index.html                    # Main index page listing all algorithms
├── shared/
│   ├── styles.css               # Common styles
│   ├── graph-utils.js           # Graph generation utilities
│   ├── visualization.js         # SVG visualization helpers
│   └── ui-controls.js           # Interactive control components
└── algorithms/
    ├── traversal/
    │   ├── bfs.html
    │   └── dfs.html
    ├── shortest-path/
    │   ├── dijkstra.html
    │   ├── bellman-ford.html
    │   └── floyd-warshall.html
    ├── centrality/
    │   ├── betweenness.html
    │   ├── closeness.html
    │   ├── degree.html
    │   ├── eigenvector.html
    │   ├── pagerank.html
    │   ├── katz.html
    │   └── hits.html
    ├── components/
    │   └── connected-components.html
    ├── mst/
    │   ├── kruskal.html
    │   └── prim.html
    ├── community/
    │   ├── louvain.html
    │   ├── leiden.html
    │   ├── girvan-newman.html
    │   └── label-propagation.html
    ├── pathfinding/
    │   └── astar.html
    ├── flow/
    │   ├── ford-fulkerson.html
    │   └── min-cut.html
    ├── clustering/
    │   ├── hierarchical.html
    │   ├── k-core.html
    │   ├── mcl.html
    │   └── spectral.html
    ├── matching/
    │   ├── bipartite-matching.html
    │   └── graph-isomorphism.html
    ├── link-prediction/
    │   ├── adamic-adar.html
    │   └── common-neighbors.html
    └── research/
        ├── grsbm.html
        ├── sync.html
        └── terahac.html
```

## Technical Implementation

### Rendering Framework
- **Primary**: SVG with vanilla JavaScript (following layout examples pattern)
- **Rationale**: Lightweight, browser-native, good for 2D graph visualization
- **Alternative**: Canvas for performance-critical algorithms or large graphs

### Architecture Components

#### 1. Main Index Page (`index.html`)
- Grid-based layout showcasing all algorithm categories
- Cards for each algorithm with brief descriptions
- Responsive design similar to layout examples
- Search/filter functionality for algorithms

#### 2. Shared Components (`shared/`)

**`styles.css`**
- Consistent design system matching layout examples
- Color scheme: Blue (#2c5aa0) headers, green (#4CAF50) buttons
- Responsive grid layouts and card components
- Interactive element styling (hover effects, transitions)

**`graph-utils.js`**
- Graph generation utilities:
  - Random graphs (Erdős–Rényi)
  - Complete graphs
  - Cycle graphs
  - Star graphs
  - Grid graphs
  - Scale-free networks (Barabási–Albert)
  - Bipartite graphs
- Graph format converters for algorithm input

**`visualization.js`**
- SVG-based graph rendering
- Node and edge drawing utilities
- Animation helpers for algorithm steps
- Layout positioning algorithms (force-directed, circular)
- Color coding for algorithm states

**`ui-controls.js`**
- Interactive parameter controls (sliders, dropdowns)
- Graph generation controls
- Algorithm execution controls (play, pause, step, reset)
- Real-time parameter updates

#### 3. Individual Algorithm Pages

Each algorithm page will include:

**Standard Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>[Algorithm Name] - Graph Algorithms Demo</title>
    <link rel="stylesheet" href="../shared/styles.css">
</head>
<body>
    <header>
        <h1>[Algorithm Name]</h1>
        <nav><a href="../index.html">← Back to Index</a></nav>
    </header>
    
    <main>
        <section class="controls">
            <!-- Algorithm-specific parameters -->
        </section>
        
        <section class="visualization">
            <svg id="graph-svg"></svg>
        </section>
        
        <section class="info">
            <!-- Algorithm description and results -->
        </section>
    </main>
    
    <script type="module" src="[algorithm-name].js"></script>
</body>
</html>
```

**Interactive Features:**
- Real-time algorithm visualization
- Step-by-step execution with pause/resume
- Parameter adjustment with immediate visual feedback
- Multiple graph types for testing
- Results display (numeric outputs, highlighted paths/components)
- Algorithm complexity information

## Algorithm Categories and Features

### 1. Traversal Algorithms
**BFS (`bfs.html`)**
- Animated breadth-first traversal
- Starting node selection
- Queue visualization
- Level-by-level coloring

**DFS (`dfs.html`)**
- Animated depth-first traversal
- Starting node selection
- Stack visualization
- Path highlighting

### 2. Shortest Path Algorithms
**Dijkstra (`dijkstra.html`)**
- Interactive source/target selection
- Distance table updates
- Priority queue visualization
- Shortest path highlighting

**Bellman-Ford (`bellman-ford.html`)**
- Handles negative weights
- Edge relaxation animation
- Negative cycle detection
- Distance convergence visualization

**Floyd-Warshall (`floyd-warshall.html`)**
- All-pairs shortest paths matrix
- Intermediate vertex selection
- Distance matrix updates
- Path reconstruction

### 3. Centrality Algorithms
**PageRank (`pagerank.html`)**
- Damping factor control
- Iterative value updates
- Node size based on PageRank scores
- Convergence visualization

**Betweenness Centrality (`betweenness.html`)**
- Shortest paths calculation
- Centrality score accumulation
- Node highlighting by centrality

### 4. Community Detection
**Louvain (`louvain.html`)**
- Community color coding
- Modularity score tracking
- Hierarchical community structure
- Interactive resolution parameter

### 5. Flow Algorithms
**Ford-Fulkerson (`ford-fulkerson.html`)**
- Source/sink selection
- Flow path animation
- Capacity constraints visualization
- Maximum flow calculation

## User Experience Features

### Interactive Controls
- **Graph Generation**: Dropdown for graph types, size controls
- **Algorithm Parameters**: Sliders, input fields, dropdowns
- **Execution Controls**: Play/pause, step-through, reset buttons
- **Visualization Options**: Node/edge styling, layout algorithms

### Educational Features
- **Algorithm Descriptions**: Brief explanations and use cases
- **Complexity Information**: Time/space complexity displays
- **Step-by-step Explanations**: What's happening at each step
- **Result Interpretation**: How to read the algorithm outputs

### Mobile Support
- Responsive design for tablet/mobile viewing
- Touch-friendly controls
- Simplified visualizations for smaller screens
- Optional Eruda console for mobile debugging

## Development Phases

### Phase 1: Core Infrastructure
1. Set up shared components and styling
2. Implement basic graph utilities and visualization
3. Create main index page structure
4. Develop UI control system

### Phase 2: Essential Algorithms
1. Traversal algorithms (BFS, DFS)
2. Basic shortest path (Dijkstra)
3. Simple centrality (Degree, PageRank)
4. Connected components

### Phase 3: Advanced Algorithms
1. Complex shortest path algorithms
2. Advanced centrality measures
3. Community detection algorithms
4. Flow and matching algorithms

### Phase 4: Specialized Algorithms
1. Clustering algorithms
2. Link prediction
3. Research algorithms
4. Performance optimizations

## Technical Considerations

### Performance
- Efficient SVG rendering for large graphs
- Debounced parameter updates
- Progressive enhancement for complex visualizations
- Canvas fallback for performance-critical cases

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Alternative text for visualizations

### Browser Compatibility
- ES6+ modules with fallbacks
- Modern browser features with polyfills
- Progressive enhancement approach
- Mobile browser optimization

## Publishing and Distribution

### GitHub Pages Integration
- Automated deployment via GitHub Actions
- Similar to layout examples at `graphty-org.github.io/algorithms/examples/`
- CDN delivery for optimal performance

### Documentation Integration
- Links from main package README
- Integration with existing documentation
- Cross-references with API documentation

## Success Metrics

### User Engagement
- Interactive exploration of algorithms
- Educational value for graph theory learning
- Developer adoption for algorithm selection
- Community feedback and contributions

### Technical Quality
- Fast loading times (<2s)
- Smooth animations (60fps)
- Cross-browser compatibility
- Mobile-responsive design

This plan provides a comprehensive framework for creating engaging, educational HTML examples that showcase the power and versatility of the @graphty/algorithms package while maintaining consistency with the existing graphty ecosystem.