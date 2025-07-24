/**
 * Vite Plugin: Algorithms Redirect
 * 
 * During development, this plugin intercepts imports of './algorithms.js' from examples
 * and serves the content of 'dist/algorithms.js' instead.
 * 
 * This allows us to:
 * - Keep only one build artifact (dist/algorithms.js)
 * - Have examples work in development without a copy
 * - Deploy examples to GitHub Pages with a proper build step
 */

import fs from 'fs';
import path from 'path';

export function algorithmsRedirectPlugin() {
  return {
    name: 'algorithms-redirect',
    enforce: 'pre',
    
    resolveId(source, importer) {
      // Intercept './algorithms.js' imports from files anywhere in the examples/html directory
      if (source === './algorithms.js' && importer && importer.includes('/examples/html/')) {
        // Return a virtual module ID
        return '\0virtual:algorithms.js';
      }
    },
    
    load(id) {
      // Serve the content of dist/algorithms.js for our virtual module
      if (id === '\0virtual:algorithms.js') {
        const distAlgorithmsPath = path.resolve(process.cwd(), 'dist/algorithms.js');
        
        if (!fs.existsSync(distAlgorithmsPath)) {
          throw new Error('dist/algorithms.js not found. Run "npm run build:bundle" first.');
        }
        
        return fs.readFileSync(distAlgorithmsPath, 'utf-8');
      }
    }
  };
}