/**
 * Bundle TypeScript declarations into a single file
 * 
 * This script creates dist/algorithms.d.ts with all type declarations
 * bundled together, matching the structure of dist/algorithms.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function bundleTypes() {
  const indexPath = path.resolve(__dirname, '../dist/src/index.d.ts');
  
  if (!existsSync(indexPath)) {
    console.error('Error: dist/src/index.d.ts not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  try {
    // For now, we'll create a simple declaration file that re-exports everything
    // from the proper location. This works because all exports go through index.ts
    const content = `/**
 * TypeScript declarations for @graphty/algorithms
 * 
 * This file provides type information for the bundled dist/algorithms.js module.
 */

// Core exports
export { Graph } from './src/core/graph';

// Type exports
export type {
    BellmanFordResult,
    CentralityOptions,
    CentralityResult,
    CommunityResult,
    ComponentResult,
    DijkstraOptions,
    Edge,
    FloydWarshallResult,
    GirvanNewmanOptions,
    GraphConfig,
    LouvainOptions,
    MSTResult,
    Node,
    NodeId,
    PageRankOptions,
    ShortestPathResult,
    TraversalOptions,
    TraversalResult,
} from './src/types/index';

// Algorithm exports
export * from './src/algorithms/index';

// Research algorithms exports
export * from './src/research/index';

// Data structure exports
export * from './src/data-structures/index';
`;
    
    const outputPath = path.resolve(__dirname, '../dist/algorithms.d.ts');
    writeFileSync(outputPath, content, 'utf8');
    console.log('Successfully created dist/algorithms.d.ts');
    
  } catch (error) {
    console.error('Error bundling types:', error);
    process.exit(1);
  }
}

bundleTypes();