#!/usr/bin/env tsx

// Node.js DFS Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { depthFirstSearch } from '../../src/algorithms/traversal/dfs'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [100, 1000, 5000],
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [100, 1000, 5000, 10000, 50000],
    iterations: 20
  }
}

async function runDFSBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} DFS benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `DFS ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex sparse graph...`)
      const benchmarkGraph = generateTestGraphs.sparse(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`sparse-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'DFS',
        graphType: 'sparse',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const size of config.sizes) {
    const testKey = `sparse-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      // Test iterative DFS (default)
      benchmark.addTest(
        `DFS ${size} vertices (sparse, iterative)`,
        () => {
          const result = depthFirstSearch(testData.graph, 0, { recursive: false })
          // Verify result to prevent dead code elimination
          if (result.visited.size === 0) {
            throw new Error('DFS returned empty result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.1 // minimum 100ms per test
        }
      )
    }
  }

  // For comprehensive tests, also test recursive implementation
  if (configType === 'comprehensive') {
    const recursiveSizes = config.sizes.filter(s => s <= 10000) // Avoid stack overflow
    
    console.log('Adding recursive DFS tests...')
    for (const size of recursiveSizes) {
      const testKey = `sparse-${size}`
      if (testGraphs.has(testKey)) {
        const testData = testGraphs.get(testKey)
        
        benchmark.addTest(
          `DFS ${size} vertices (sparse, recursive)`,
          () => {
            const result = depthFirstSearch(testData.graph, 0, { recursive: true })
            if (result.visited.size === 0) {
              throw new Error('DFS returned empty result')
            }
          },
          {
            ...testData,
            algorithm: 'DFS (recursive)'
          },
          {
            minSamples: Math.floor(config.iterations * 0.7), // Fewer iterations for recursive
            initCount: 1,
            minTime: 0.1
          }
        )
      }
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(60))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log('Size\tImpl\t\tTime(ms)\tOps/sec\tTEPS\t\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const impl = result.algorithm.includes('recursive') ? 'recursive' : 'iterative'
      const teps = result.metrics?.teps || 0
      const margin = result.metrics?.marginOfError || 0
      console.log(
        `${result.graphSize}\t${impl}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${teps.toFixed(0)}\t\t±${margin.toFixed(1)}%`
      )
    })
    
    // Save results
    const filename = await saveBenchmarkSession(session)
    console.log(`\n✅ Results saved to ${filename}`)
    
    return session
  } catch (error) {
    console.error('❌ Benchmark failed:', error)
    throw error
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const configType = args.includes('--comprehensive') ? 'comprehensive' : 'quick'
  
  try {
    await runDFSBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}