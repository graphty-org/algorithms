#!/usr/bin/env tsx

// Node.js BFS Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { breadthFirstSearch } from '../../src/algorithms/traversal/bfs'
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

async function runBFSBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} BFS benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `BFS ${configType} Performance`)

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
        algorithm: 'BFS',
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
      
      benchmark.addTest(
        `BFS ${size} vertices (sparse)`,
        () => {
          const result = breadthFirstSearch(testData.graph, 0)
          // Verify result to prevent dead code elimination
          if (result.visited.size === 0) {
            throw new Error('BFS returned empty result')
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

  // For comprehensive tests, also add dense graphs (smaller sizes only)
  if (configType === 'comprehensive') {
    const denseSizes = config.sizes.filter(s => s <= 5000) // Avoid memory issues
    
    console.log('Generating dense graphs for comprehensive testing...')
    for (const size of denseSizes) {
      try {
        console.log(`  Generating ${size} vertex dense graph...`)
        const benchmarkGraph = generateTestGraphs.dense(size)
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'BFS',
          graphType: 'dense',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        benchmark.addTest(
          `BFS ${size} vertices (dense)`,
          () => {
            const result = breadthFirstSearch(testData.graph, 0)
            if (result.visited.size === 0) {
              throw new Error('BFS returned empty result')
            }
          },
          testData,
          {
            minSamples: Math.floor(config.iterations * 0.5), // Fewer iterations for dense
            initCount: 1,
            minTime: 0.1
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
      } catch (error) {
        console.error(`    ✗ Failed to generate dense ${size} vertex graph:`, error)
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
    console.log('Size\tType\tTime(ms)\tOps/sec\tTEPS\t\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const teps = result.metrics?.teps || 0
      const margin = result.metrics?.marginOfError || 0
      console.log(
        `${result.graphSize}\t${result.graphType}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${teps.toFixed(0)}\t\t±${margin.toFixed(1)}%`
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
  const jsonOnly = args.includes('--json')
  
  try {
    const session = await runBFSBenchmark(configType)
    
    // If --json flag is provided, output only JSON
    if (jsonOnly) {
      console.log(JSON.stringify(session, null, 2))
    }
  } catch (error) {
    if (jsonOnly) {
      console.log(JSON.stringify({ error: error.message }, null, 2))
    } else {
      console.error('Benchmark execution failed:', error)
    }
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}