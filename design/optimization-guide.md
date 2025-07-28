# Optimization Guide

The @graphty/algorithms library includes several performance optimizations for large graphs. This guide explains how to enable and configure these optimizations.

## Quick Start

### Automatic Optimization

Most algorithms automatically detect when to use optimizations based on graph size:

```typescript
import { betweennessCentrality } from '@graphty/algorithms';

// Automatically uses optimizations for large graphs (>10k nodes)
const centrality = betweennessCentrality(largeGraph);
```

### Manual Optimization Control

You can explicitly enable or disable optimizations:

```typescript
// Force optimizations on
const centrality = betweennessCentrality(graph, {
  optimized: true
});

// Disable optimizations
const centrality = closenessCentrality(graph, {
  optimized: false
});
```

### Global Configuration

Configure optimizations globally for all algorithms:

```typescript
import { configureGlobalOptimizations, OPTIMIZATION_PRESETS } from '@graphty/algorithms';

// Use high-performance preset
configureGlobalOptimizations('performance');

// Or use custom configuration
configureGlobalOptimizations({
  useDirectionOptimizedBFS: true,
  useCSRFormat: true,
  bfsAlpha: 15.0,
  bfsBeta: 20.0
});
```

## Optimization Presets

### Default
Balanced configuration suitable for most use cases.

### Performance
Maximum performance for very large graphs (>1M nodes):
- Direction-Optimized BFS enabled
- CSR graph format enabled
- Bit-packed structures enabled
- Large memory pre-allocation

### Memory
Memory-efficient configuration for constrained environments:
- All optimizations disabled
- Minimal memory pre-allocation
- No caching

### Balanced
Optimized for medium-sized graphs (10k-1M nodes):
- Direction-Optimized BFS enabled
- CSR format enabled
- Moderate memory usage

## Environment Variables

### Node.js
Configure optimizations via environment variables:

- `GRAPHTY_USE_OPTIMIZED_BFS=true` - Enable optimized BFS implementations
- `GRAPHTY_BFS_ALPHA=15.0` - Bottom-up BFS threshold
- `GRAPHTY_BFS_BETA=20.0` - Top-down BFS threshold
- `GRAPHTY_DISABLE_CACHE=true` - Disable CSR caching

### Browser
In browser environments, set configuration before loading the library:

```html
<script>
// Configure optimizations before loading the library
window.__GRAPHTY_CONFIG__ = {
  GRAPHTY_USE_OPTIMIZED_BFS: 'true',
  GRAPHTY_BFS_ALPHA: '15.0',
  GRAPHTY_BFS_BETA: '20.0'
};
</script>
<script src="path/to/graphty-algorithms.js"></script>
```

Or configure programmatically:

```javascript
import { configureGlobalOptimizations } from '@graphty/algorithms';

// Use async function to configure
await configureGlobalOptimizations('performance');
```

## Supported Algorithms

The following algorithms support optimization options:

### Centrality Algorithms
- Betweenness Centrality - Uses optimized BFS for path counting
- Closeness Centrality - Uses optimized distance calculations

### Traversal Algorithms
- BFS variants - Automatic CSR conversion and Direction-Optimized BFS
- Shortest path algorithms - Optimized distance calculations

## Performance Guidelines

### When to Use Optimizations

Enable optimizations when:
- Graph has >10,000 nodes
- Graph has >100,000 edges
- Running algorithms multiple times on the same graph
- Memory is not severely constrained

### When to Avoid Optimizations

Disable optimizations when:
- Graph is small (<1,000 nodes)
- Memory is very limited
- Graph structure changes frequently
- One-time algorithm execution

## Benchmarks

Performance improvements with optimizations enabled:

| Graph Size | Algorithm | Standard | Optimized | Speedup |
|------------|-----------|----------|-----------|---------|
| 10k nodes | BFS | 12ms | 8ms | 1.5x |
| 100k nodes | BFS | 450ms | 95ms | 4.7x |
| 1M nodes | BFS | 8.5s | 0.7s | 12x |
| 100k nodes | Betweenness | 52s | 14s | 3.7x |

## Advanced Usage

### Custom Optimization Logic

```typescript
import { shouldUseOptimizations, getRecommendedPreset } from '@graphty/algorithms';

// Check if graph should use optimizations
if (shouldUseOptimizations(graph.nodeCount, graph.edgeCount)) {
  const preset = getRecommendedPreset(graph.nodeCount, graph.edgeCount);
  configureGlobalOptimizations(preset);
}
```

### Algorithm-Specific Optimization

```typescript
// Different optimization settings per algorithm
const centrality = betweennessCentrality(graph, {
  optimized: true,
  normalized: true
});

const closeness = closenessCentrality(graph, {
  optimized: false,  // Disable for this specific call
  harmonic: true
});
```

## Implementation Details

### Direction-Optimized BFS
Switches between top-down and bottom-up traversal based on frontier size, achieving up to 40x speedup on scale-free graphs.

### CSR (Compressed Sparse Row) Format
Memory-efficient graph representation with cache-friendly access patterns, reducing memory bandwidth by up to 10x.

### Bit-Packed Structures
Uses bit vectors for visited sets and other boolean data, reducing memory usage by 8x for large graphs.