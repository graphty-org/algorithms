# Layout Project Build System Analysis

## Overview

The `@graphty/layout` project implements a sophisticated 3-purpose build system that handles:
1. **NPM Package Distribution** - TypeScript compilation + bundled ES module
2. **GitHub Pages Deployment** - Static site with bundled library  
3. **Local Development** - Vite dev server with import redirection

## Core Architecture

### 1. Package.json Configuration

**Key Build Scripts:**
```json
{
  "main": "dist/layout.js",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/layout.js", 
      "types": "./dist/layout.d.ts"
    }
  },
  "types": "dist/layout.d.ts",
  "files": ["dist/", "src/", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc",                                    // TypeScript compilation
    "build:bundle": "node scripts/build-bundle.js",   // Single ES module bundle
    "build:gh-pages": "npm run build:bundle && node scripts/build-gh-pages.js",
    "serve": "npm run build:bundle && vite",          // Local development
    "examples": "npm run build:bundle && vite"
  }
}
```

**Critical Details:**
- `"type": "module"` - Pure ES modules
- Main entry point is bundled `dist/layout.js` (not compiled TypeScript)
- Files distributed to NPM include both `dist/` and `src/`
- All development commands require `build:bundle` first

### 2. TypeScript Compilation (`npm run build`)

**Purpose:** Compile TypeScript source to individual JS modules
**Output:** `dist/src/` directory with compiled modules
**Used by:** Bundle creation and type bundling

**Entry Point:** `src/index.ts`
```typescript
// Re-export all types
export * from './types';
// Re-export utilities that are part of the public API
export { rescaleLayout, rescaleLayoutDict } from './utils/rescale';
// Re-export all layout algorithms
export * from './layouts';
// Re-export all graph generation functions
export * from './generators';
```

### 3. Bundle Creation (`scripts/build-bundle.js`)

**Purpose:** Create single-file ES module bundle for distribution and examples

**Process:**
1. Uses Vite to bundle `src/index.ts` into single `dist/layout.js`
2. Calls `bundle-types.js` to create unified type declarations

**Vite Configuration:**
```javascript
await build({
  configFile: false,
  build: {
    lib: {
      entry: path.resolve(__dirname, '../src/index.ts'),
      name: 'GraphLayout',
      formats: ['es'],           // ES module only
      fileName: () => 'layout.js'
    },
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: false,
    rollupOptions: {
      external: [],              // Bundle everything
      output: {
        preserveModules: false,  // Single file output
        inlineDynamicImports: true
      }
    },
    minify: false,              // Keep readable for debugging
    sourcemap: true
  }
});
```

**Output:** 
- `dist/layout.js` - Single bundled ES module (~3400 lines)
- `dist/layout.js.map` - Source map

### 4. Type Declaration Bundling (`scripts/bundle-types.js`)

**Purpose:** Create unified type declarations matching the bundle structure

**Process:**
```javascript
const content = `/**
 * TypeScript declarations for @graphty/layout
 * 
 * This file provides type information for the bundled dist/layout.js module.
 */

// Re-export all types
export * from './src/types/index';
// Re-export utilities that are part of the public API  
export { rescaleLayout, rescaleLayoutDict } from './src/utils/rescale';
// Re-export all layout algorithms
export * from './src/layouts/index';
// Re-export all graph generation functions
export * from './src/generators/index';
`;
```

**Output:** `dist/layout.d.ts` - Unified type declarations

### 5. Local Development Server

**Command:** `npm run serve` or `npm run examples`

**Process:**
1. Run `npm run build:bundle` to create `dist/layout.js`
2. Start Vite dev server with custom plugin

**Vite Configuration (`vite.config.js`):**
```javascript
export default defineConfig(({ mode }) => {
  const config = {
    plugins: [layoutRedirectPlugin()],
    server: {
      port: 3000,
      open: '/examples/',
      host: true,
      fs: {
        allow: ['..']  // Allow serving dist files
      }
    },
    build: {
      outDir: 'dist'
    },
    publicDir: false
  };
```

**Custom Vite Plugin (`vite-plugin-layout-redirect.js`):**
```javascript
export function layoutRedirectPlugin() {
  return {
    name: 'layout-redirect',
    enforce: 'pre',
    
    resolveId(source, importer) {
      // Intercept './layout.js' imports from examples
      if (source === './layout.js' && importer && importer.includes('/examples/')) {
        return '\0virtual:layout.js';
      }
    },
    
    load(id) {
      // Serve dist/layout.js content for virtual module
      if (id === '\0virtual:layout.js') {
        const distLayoutPath = path.resolve(process.cwd(), 'dist/layout.js');
        return fs.readFileSync(distLayoutPath, 'utf-8');
      }
    }
  };
}
```

**Key Mechanism:** Examples import `./layout.js` but vite plugin redirects to `dist/layout.js`

### 6. HTML Examples Structure

**Import Pattern:**
```html
<script type="module">
  import { springLayout } from "./layout.js";
  // ... rest of example code
</script>
```

**Critical Details:**
- Examples use direct ES module imports (no build step)
- Import path `./layout.js` is same-directory relative
- Vite plugin handles redirection during development
- For GitHub Pages, actual `layout.js` file is copied to each directory

### 7. GitHub Pages Build (`scripts/build-gh-pages.js`)  

**Purpose:** Create static site that works without Vite

**Process:**
1. Clean `gh-pages/` directory
2. Copy `dist/layout.js` to `gh-pages/examples/layout.js`
3. Copy all example HTML files (no modification needed)
4. Copy helper JS files (like `layout-helpers.js`)
5. Create redirect `index.html` and `.nojekyll`

**Key Insight:** Since examples already use `./layout.js`, copying the bundle to the same directory makes imports work without modification.

**File Structure Created:**
```
gh-pages/
├── index.html (redirect to examples/)
├── .nojekyll
├── DEPLOY.md
└── examples/
    ├── layout.js (copied from dist/)
    ├── layout-helpers.js
    ├── index.html
    ├── spring-layout.html
    └── ... (all other examples)
```

### 8. GitHub Actions Workflow

**File:** `.github/workflows/deploy-gh-pages.yml`

**Process:**
1. **Build Job:**
   - Checkout code
   - Setup Node.js 20.x
   - `npm ci` - Install dependencies
   - `npm run build` - Compile TypeScript
   - `npm run build:gh-pages` - Create static site
   - Upload `gh-pages/` as artifact

2. **Deploy Job:**
   - Deploy artifact to GitHub Pages

**Key Detail:** Runs both TypeScript compilation AND bundle creation before GitHub Pages build

## Critical Success Factors

### 1. Single Source of Truth
- `dist/layout.js` is the canonical bundle used by:
  - NPM package consumers
  - Local development (via vite plugin)
  - GitHub Pages deployment

### 2. Import Path Consistency
- Examples always import from `./layout.js`
- Vite plugin redirects during development
- GitHub Pages gets actual file copied to same location
- No HTML modification needed between environments

### 3. Bundle-First Development
- All development commands run `build:bundle` first
- Ensures examples always use latest code
- Prevents import resolution issues

### 4. ES Module Everything
- Pure ES modules throughout
- No CommonJS compatibility
- Modern bundling approach

## Recreating the System

### Prerequisites
```json
{
  "type": "module",
  "devDependencies": {
    "typescript": "^5.3.3",
    "vite": "^7.0.5"
  }
}
```

### Required Files
1. `vite.config.js` - Vite configuration with custom plugin
2. `vite-plugin-[name]-redirect.js` - Import redirection plugin
3. `scripts/build-bundle.js` - Single bundle creator
4. `scripts/bundle-types.js` - Type declaration bundler  
5. `scripts/build-gh-pages.js` - Static site generator
6. `.github/workflows/deploy-gh-pages.yml` - CI/CD pipeline

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "build:bundle": "node scripts/build-bundle.js", 
    "build:gh-pages": "npm run build:bundle && node scripts/build-gh-pages.js",
    "serve": "npm run build:bundle && vite"
  }
}
```

### Example HTML Pattern
```html
<script type="module">
  import { functionName } from "./bundle-name.js";
  // Implementation
</script>
```

## Potential Issues with Current Algorithms Implementation

Based on the error "Importing binding name 'dfs' is not found", the likely issues are:

1. **Export mismatch** - `dist/algorithms.js` may not export `dfs` function
2. **Bundle creation failure** - Bundle may not include traversal algorithms
3. **Import path issues** - Vite plugin may not be redirecting correctly
4. **TypeScript compilation** - Source may not be properly compiled before bundling

The layout system works because it has a complete build chain: TypeScript → Bundle → Examples. Each step must work correctly for the imports to resolve.