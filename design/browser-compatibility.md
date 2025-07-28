# Browser Compatibility Guide

The @graphty/algorithms library is designed to work in both Node.js and browser environments. This guide explains how the library handles platform differences.

## Environment Detection

The library automatically detects the runtime environment and adjusts behavior accordingly:

```javascript
import { isNodeEnvironment, isBrowserEnvironment } from '@graphty/algorithms';

if (isNodeEnvironment()) {
  // Node.js specific code
} else if (isBrowserEnvironment()) {
  // Browser specific code
}
```

## Configuration

### Node.js
Use environment variables:
```bash
export GRAPHTY_USE_OPTIMIZED_BFS=true
export GRAPHTY_BFS_ALPHA=15.0
node your-script.js
```

### Browser
Configure before loading the library:
```html
<script>
window.__GRAPHTY_CONFIG__ = {
  GRAPHTY_USE_OPTIMIZED_BFS: 'true',
  GRAPHTY_BFS_ALPHA: '15.0'
};
</script>
<script type="module">
import { Graph, betweennessCentrality } from './graphty-algorithms.js';
// Your code here
</script>
```

## Bundle Usage

For browser environments, use the bundled version:

```html
<!-- ES Module -->
<script type="module">
import * as graphty from 'https://unpkg.com/@graphty/algorithms/dist/algorithms.js';
</script>

<!-- Or with a bundler -->
<script src="your-bundled-app.js"></script>
```

## Performance Considerations

### Browser Optimizations
- Automatic detection of large graphs
- Memory-efficient data structures
- Progressive computation with Web Workers (planned)

### Node.js Optimizations
- Full access to system memory
- Native BigInt support
- Process-based parallelization (planned)

## API Differences

All APIs work identically in both environments. The only differences are:

1. **Configuration**: Environment variables (Node.js) vs window config (Browser)
2. **Memory limits**: Browsers have stricter memory constraints
3. **File I/O**: Not available in browsers (use fetch for remote data)

## Example: Cross-Platform Code

```javascript
import { 
  Graph, 
  betweennessCentrality,
  configureGlobalOptimizations,
  getEnvVar
} from '@graphty/algorithms';

// Works in both environments
async function runAnalysis() {
  // Check for configuration
  const useOptimized = getEnvVar('GRAPHTY_USE_OPTIMIZED_BFS') === 'true';
  
  // Configure if needed
  if (useOptimized) {
    await configureGlobalOptimizations('performance');
  }
  
  // Create and analyze graph
  const graph = new Graph();
  // ... add nodes and edges ...
  
  const centrality = betweennessCentrality(graph, {
    optimized: true,
    normalized: true
  });
  
  return centrality;
}
```

## Testing

The library is tested in both environments:
- Node.js: Full test suite with Vitest
- Browser: Browser-specific tests via Playwright

## Troubleshooting

### Common Issues

1. **"process is not defined"** - This should not happen with the latest version. If it does, ensure you're using the bundled version for browsers.

2. **Memory errors in browser** - Large graphs may exceed browser memory limits. Consider:
   - Using the memory-efficient preset
   - Processing smaller subgraphs
   - Using Web Workers for parallel processing

3. **Configuration not working** - Ensure configuration is set before importing the library.

## Future Enhancements

- Web Worker support for parallel algorithms
- WASM modules for performance-critical sections
- Streaming APIs for large graph processing
- IndexedDB integration for persistence