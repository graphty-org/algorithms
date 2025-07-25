/**
 * Build GitHub Pages Script
 * 
 * Creates a static site for GitHub Pages that:
 * - Uses the same dist/algorithms.js bundle created by build-bundle.js
 * - Transforms example HTML files to work without Vite
 * - Creates a gh-pages directory ready for deployment
 */

import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

async function copyFile(src, dest) {
  await pipeline(
    createReadStream(src),
    createWriteStream(dest)
  );
}

async function processExampleHtml(htmlPath, outputPath) {
  let content = await fs.readFile(htmlPath, 'utf-8');
  
  // The examples already use "./algorithms.js" which will work with our copied bundle
  // No changes needed to the imports
  
  await fs.writeFile(outputPath, content);
}

async function copyDirectory(src, dest) {
  await ensureDirectoryExists(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function buildGitHubPages() {
  const rootDir = path.resolve(__dirname, '..');
  const examplesDir = path.join(rootDir, 'examples', 'html');
  const benchmarkDir = path.join(rootDir, 'benchmark-results');
  const distDir = path.join(rootDir, 'dist');
  const ghPagesDir = path.join(rootDir, 'gh-pages');
  
  try {
    console.log('Building GitHub Pages site...');
    
    // 1. Clean and create gh-pages directory
    await fs.rm(ghPagesDir, { recursive: true, force: true });
    await ensureDirectoryExists(ghPagesDir);
    
    // 2. Ensure dist/algorithms.js exists
    const algorithmsJsPath = path.join(distDir, 'algorithms.js');
    try {
      await fs.access(algorithmsJsPath);
    } catch {
      console.error('dist/algorithms.js not found. Please run "npm run build:bundle" first.');
      process.exit(1);
    }
    
    // 3. Copy main landing page
    const mainIndexSrc = path.join(rootDir, 'gh-pages-index.html');
    const mainIndexDest = path.join(ghPagesDir, 'index.html');
    await copyFile(mainIndexSrc, mainIndexDest);
    console.log('Copied main landing page');
    
    // 4. Create examples subdirectory and copy examples
    const examplesDestDir = path.join(ghPagesDir, 'examples');
    await ensureDirectoryExists(examplesDestDir);
    
    // Copy shared directory to examples
    const sharedSrcDir = path.join(examplesDir, 'shared');
    const sharedDestDir = path.join(examplesDestDir, 'shared');
    await copyDirectory(sharedSrcDir, sharedDestDir);
    console.log('Copied examples/shared/ directory');
    
    // Copy examples index.html
    const examplesIndexSrc = path.join(examplesDir, 'index.html');
    const examplesIndexDest = path.join(examplesDestDir, 'index.html');
    await processExampleHtml(examplesIndexSrc, examplesIndexDest);
    console.log('Copied examples/index.html');
    
    // 5. Create benchmarks subdirectory and copy benchmark reports
    const benchmarksDestDir = path.join(ghPagesDir, 'benchmarks');
    await ensureDirectoryExists(benchmarksDestDir);
    
    // Copy all benchmark HTML files
    try {
      await copyDirectory(benchmarkDir, benchmarksDestDir);
      console.log('Copied benchmark reports to benchmarks/');
    } catch (error) {
      console.log('No benchmark results found, skipping benchmarks directory');
    }
    
    // 6. Copy algorithms.js to each algorithm directory in examples
    const algorithmsHtmlDir = path.join(examplesDir, 'algorithms');
    const algorithmsDestDir = path.join(examplesDestDir, 'algorithms');
    
    // Process traversal algorithms
    const traversalSrcDir = path.join(algorithmsHtmlDir, 'traversal');
    const traversalDestDir = path.join(algorithmsDestDir, 'traversal');
    await ensureDirectoryExists(traversalDestDir);
    
    // Copy algorithms.js to traversal directory
    await copyFile(algorithmsJsPath, path.join(traversalDestDir, 'algorithms.js'));
    console.log('Copied algorithms.js to algorithms/traversal/');
    
    // Copy HTML and JS files
    for (const file of ['bfs.html', 'dfs.html', 'bfs.js', 'dfs.js']) {
      const srcPath = path.join(traversalSrcDir, file);
      const destPath = path.join(traversalDestDir, file);
      if (file.endsWith('.html')) {
        await processExampleHtml(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
      console.log(`Copied algorithms/traversal/${file}`);
    }
    
    // Process shortest-path algorithms
    const shortestPathSrcDir = path.join(algorithmsHtmlDir, 'shortest-path');
    const shortestPathDestDir = path.join(algorithmsDestDir, 'shortest-path');
    await ensureDirectoryExists(shortestPathDestDir);
    
    // Copy algorithms.js to shortest-path directory
    await copyFile(algorithmsJsPath, path.join(shortestPathDestDir, 'algorithms.js'));
    console.log('Copied algorithms.js to algorithms/shortest-path/');
    
    // Copy HTML and JS files
    for (const file of ['dijkstra.html', 'dijkstra.js']) {
      const srcPath = path.join(shortestPathSrcDir, file);
      const destPath = path.join(shortestPathDestDir, file);
      if (file.endsWith('.html')) {
        await processExampleHtml(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
      console.log(`Copied algorithms/shortest-path/${file}`);
    }
    
    // Process centrality algorithms
    const centralitySrcDir = path.join(algorithmsHtmlDir, 'centrality');
    const centralityDestDir = path.join(algorithmsDestDir, 'centrality');
    await ensureDirectoryExists(centralityDestDir);
    
    // Copy algorithms.js to centrality directory
    await copyFile(algorithmsJsPath, path.join(centralityDestDir, 'algorithms.js'));
    console.log('Copied algorithms.js to algorithms/centrality/');
    
    // Copy HTML and JS files
    for (const file of ['degree.html', 'degree.js']) {
      const srcPath = path.join(centralitySrcDir, file);
      const destPath = path.join(centralityDestDir, file);
      
      // Check if file exists before copying
      try {
        await fs.access(srcPath);
        if (file.endsWith('.html')) {
          await processExampleHtml(srcPath, destPath);
        } else {
          await copyFile(srcPath, destPath);
        }
        console.log(`Copied algorithms/centrality/${file}`);
      } catch (error) {
        console.log(`Skipping ${file} (not found)`);
      }
    }
    
    // 7. Copy all other algorithm directories (with their HTML/JS files)
    const algorithmCategories = [
      'components', 'mst', 'community', 'pathfinding',
      'flow', 'clustering', 'matching', 'link-prediction', 'research'
    ];
    
    for (const category of algorithmCategories) {
      const categorySrcDir = path.join(algorithmsHtmlDir, category);
      const categoryDestDir = path.join(algorithmsDestDir, category);
      
      try {
        // Check if source directory exists
        await fs.access(categorySrcDir);
        await copyDirectory(categorySrcDir, categoryDestDir);
        // Copy algorithms.js to each category directory
        await copyFile(algorithmsJsPath, path.join(categoryDestDir, 'algorithms.js'));
        console.log(`Copied algorithms/${category}/ directory`);
      } catch (error) {
        // Create empty directory structure for future use
        await ensureDirectoryExists(categoryDestDir);
        await copyFile(algorithmsJsPath, path.join(categoryDestDir, 'algorithms.js'));
        console.log(`Created placeholder for algorithms/${category}/`);
      }
    }
    
    // 8. Create a .nojekyll file to prevent GitHub Pages from processing files
    await fs.writeFile(path.join(ghPagesDir, '.nojekyll'), '');
    
    // 9. Create a simple deployment instruction file
    const deployInstructions = `# GitHub Pages Deployment

This directory contains the built static site for GitHub Pages with:

- Main landing page (index.html)
- Interactive examples (/examples/)
- Performance benchmarks (/benchmarks/)

## Structure:
\`\`\`
/                    → Main landing page
/examples/           → Interactive algorithm examples  
/benchmarks/         → Performance reports and charts
\`\`\`

## To deploy:

1. Make sure you're on the main branch and everything is committed
2. Run: \`npm run build:gh-pages\`
3. Deploy the gh-pages directory to GitHub Pages

### Option 1: Using gh-pages npm package
\`\`\`bash
npx gh-pages -d gh-pages
\`\`\`

### Option 2: Manual deployment
\`\`\`bash
git subtree push --prefix gh-pages origin gh-pages
\`\`\`

### Option 3: GitHub Actions
Configure GitHub Actions to deploy the gh-pages directory on push to main.
`;
    
    await fs.writeFile(path.join(ghPagesDir, 'DEPLOY.md'), deployInstructions);
    
    console.log('\nSuccessfully built GitHub Pages site in gh-pages/');
    console.log('See gh-pages/DEPLOY.md for deployment instructions');
    
  } catch (error) {
    console.error('Error building GitHub Pages site:', error);
    process.exit(1);
  }
}

buildGitHubPages();