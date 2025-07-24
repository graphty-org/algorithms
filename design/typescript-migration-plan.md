# TypeScript Migration Plan for @graphty/algorithms

## Overview

This document outlines a plan to incrementally migrate the @graphty/algorithms project to TypeScript. While the core algorithm implementations are already in TypeScript, several supporting files and examples remain in JavaScript. This migration will improve type safety, developer experience, and maintainability across the entire project.

## Current State Analysis

### Already TypeScript
- ✅ Core algorithm implementations (`src/**/*.ts`)
- ✅ Type definitions (`src/types/*.ts`)
- ✅ Test files (`src/__tests__/*.ts`)

### Still JavaScript
- ❌ Build scripts (`scripts/*.js`)
- ❌ Node.js examples (`examples/*.js`)
- ❌ HTML example files (`examples/html/**/*.js`)
- ❌ Configuration files (`vite.config.js`, `eslint.config.js`)
- ❌ Vite plugin (`vite-plugin-algorithms-redirect.js`)

## Migration Strategy

### Phase 1: Build Infrastructure (Week 1)
Convert build-critical files first to ensure the build process remains stable.

1. **Build Scripts**
   - `scripts/build-bundle.js` → `scripts/build-bundle.ts`
   - `scripts/build-gh-pages.js` → `scripts/build-gh-pages.ts`
   - `scripts/bundle-types.js` → `scripts/bundle-types.ts`
   - Add `tsx` or `ts-node` for running TypeScript scripts
   - Update package.json scripts to use TypeScript runner

2. **Vite Plugin**
   - `vite-plugin-algorithms-redirect.js` → `vite-plugin-algorithms-redirect.ts`
   - Add proper Vite plugin types
   - Ensure compatibility with vite.config

### Phase 2: Configuration Files (Week 2)
Migrate configuration files carefully to avoid breaking the development environment.

1. **Vite Configuration**
   - `vite.config.js` → `vite.config.ts`
   - Add `@types/node` for Node.js types
   - Properly type the configuration object

2. **ESLint Configuration** (Optional - ESLint flat config has limited TS support)
   - Keep as `.js` if TypeScript support is problematic
   - Or migrate to `eslint.config.mjs` with JSDoc type annotations

### Phase 3: Node.js Examples (Week 3-4)
Convert command-line examples to demonstrate TypeScript usage.

1. **Create shared example utilities**
   ```typescript
   // examples/utils/example-helpers.ts
   export function printSection(title: string): void
   export function printResult<T>(result: T): void
   ```

2. **Convert examples incrementally**
   - Start with simple examples (bfs, dfs, dijkstra)
   - Move to complex examples (pagerank, community detection)
   - Group similar examples to share types

3. **Update example runner**
   - `examples/run-all-examples.js` → `examples/run-all-examples.ts`
   - Add proper error handling with types

### Phase 4: HTML Examples (Week 5-6)
The most complex phase - requires careful handling of browser compatibility.

1. **Shared HTML utilities**
   ```typescript
   // examples/html/shared/types.ts
   export interface GraphNode {
     id: string;
     x: number;
     y: number;
     label: string;
   }
   
   export interface GraphEdge {
     source: string;
     target: string;
     weight?: number;
   }
   ```

2. **Convert shared modules first**
   - `graph-utils.js` → `graph-utils.ts`
   - `visualization.js` → `visualization.ts`
   - `ui-controls.js` → `ui-controls.ts`

3. **Convert algorithm examples**
   - `degree.js` → `degree.ts`
   - `dijkstra.js` → `dijkstra.ts`
   - `bfs.js` → `bfs.ts`
   - `dfs.js` → `dfs.ts`

4. **Build process updates**
   - Add TypeScript compilation for HTML examples
   - Update build-gh-pages script to handle TS files
   - Consider using esbuild or Vite for browser bundles

## Implementation Details

### 1. TypeScript Configuration Updates

Add a separate tsconfig for different parts:

```json
// tsconfig.scripts.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "types": ["node"]
  },
  "include": ["scripts/**/*.ts"]
}
```

```json
// tsconfig.examples.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ES2020",
    "target": "ES2020",
    "lib": ["ES2020", "DOM"]
  },
  "include": ["examples/**/*.ts"]
}
```

### 2. Package.json Updates

Add new dependencies:
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "esbuild": "^0.19.0"
  }
}
```

Update scripts:
```json
{
  "scripts": {
    "build:bundle": "tsx scripts/build-bundle.ts",
    "build:gh-pages": "tsx scripts/build-gh-pages.ts",
    "build:examples": "tsc -p tsconfig.examples.json",
    "examples": "tsx examples/run-all-examples.ts"
  }
}
```

### 3. Type Definition Strategy

Create type definition files for better organization:

```typescript
// examples/html/shared/types/visualization.ts
export interface SVGElementOptions {
  className?: string;
  id?: string;
  attributes?: Record<string, string>;
}

export interface AnimationStep {
  action: 'init' | 'select' | 'update' | 'finish' | 'complete';
  message: string;
  current?: string;
  distances?: Record<string, number>;
  highlight?: string[];
}
```

### 4. Migration Best Practices

1. **Use strict mode gradually**
   - Start with `"strict": false` for migrated files
   - Enable strict checks one at a time
   - Fix issues incrementally

2. **Maintain backward compatibility**
   - Keep `.js` extension in imports initially
   - Use `allowJs: true` during migration
   - Test both old and new files work together

3. **Add types incrementally**
   - Start with `any` types where needed
   - Refine types in subsequent passes
   - Document complex types thoroughly

4. **Test continuously**
   - Run tests after each file migration
   - Verify examples still work
   - Check build outputs are identical

## Benefits of Migration

1. **Type Safety**
   - Catch errors at compile time
   - Better refactoring support
   - Self-documenting code

2. **Developer Experience**
   - Enhanced IDE support
   - Autocomplete for all modules
   - Inline documentation

3. **Maintainability**
   - Easier to understand code structure
   - Prevent type-related bugs
   - Consistent coding patterns

4. **Example Quality**
   - Examples demonstrate TypeScript usage
   - Users can learn from typed examples
   - Better error messages

## Risk Mitigation

1. **Build Process**
   - Test each build step thoroughly
   - Keep rollback plan ready
   - Monitor bundle sizes

2. **Browser Compatibility**
   - Ensure TypeScript compiles to ES5/ES6
   - Test in multiple browsers
   - Keep polyfills if needed

3. **Development Workflow**
   - Document new build commands
   - Update contributing guidelines
   - Provide migration examples

## Success Criteria

- [ ] All build scripts work with TypeScript
- [ ] Examples run without errors
- [ ] Bundle size remains reasonable (< 10% increase)
- [ ] No breaking changes for library users
- [ ] CI/CD pipeline passes all checks
- [ ] Documentation updated for TypeScript usage

## Timeline

- **Week 1**: Build infrastructure
- **Week 2**: Configuration files
- **Week 3-4**: Node.js examples
- **Week 5-6**: HTML examples
- **Week 7**: Testing and documentation
- **Week 8**: Final review and deployment

## Conclusion

This incremental migration plan allows us to improve the codebase systematically while maintaining stability. By converting files in order of importance and complexity, we can ensure the project continues to function throughout the migration process.