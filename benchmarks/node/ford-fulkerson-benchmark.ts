#!/usr/bin/env tsx

// Node.js Ford-Fulkerson Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { fordFulkerson } from '../../src/flow/ford-fulkerson'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
// Ford-Fulkerson complexity: O(E*max_flow)
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200],
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 500],
    iterations: 20
  }
}

async function runFordFulkersonBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Ford-Fulkerson benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  console.log('⚠️  Note: Ford-Fulkerson requires directed weighted graphs')
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Ford-Fulkerson ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    
    try {
      console.log(`  Generating ${size} vertex sparse graph...`)
      const benchmarkGraph = generateTestGraphs.sparse(size)
      
      // Add weights to edges
      benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
        const weight = Math.floor(Math.random() * 100) + 1 // 1 to 100
        return [from, to, weight]
      })
      benchmarkGraph.weighted = true
      
      benchmarkGraph.directed = true
      
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`sparse-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Ford-Fulkerson',
        graphType: 'sparse',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (weighted)`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const [key, testData] of testGraphs.entries()) {
    benchmark.addTest(
      `Ford-Fulkerson ${testData.graphSize} vertices (${testData.graphType})`,
      () => {
        const result = fordFulkerson(testData.graph, 0, testData.graphSize - 1)
        // Verify result to prevent dead code elimination
        if (result.maxFlow === undefined) { throw new Error("Ford-Fulkerson returned invalid result") }
      },
      testData,
      {
        minSamples: config.iterations,
        initCount: 1,
        minTime: 0.1
      }
    )
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(60))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log('Size\tType\tTime(ms)\tOps/sec\tComplexity\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const complexity = `O(E*max_flow)`
      const margin = result.metrics?.marginOfError || 0
      console.log(
        `${result.graphSize}\t${result.graphType}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${complexity}\t±${margin.toFixed(1)}%`
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
    await runFordFulkersonBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}