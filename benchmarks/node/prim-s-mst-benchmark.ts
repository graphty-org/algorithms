#!/usr/bin/env tsx

// Node.js Prim's MST Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { primMST } from '../../src/algorithms/mst/prim'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
// Prim's MST complexity: O(E log V)
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [100, 500, 1000],
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [100, 500, 1000, 5000, 10000],
    iterations: 20
  }
}

async function runPrimsMSTBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Prim's MST benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Prim's MST ${configType} Performance`)

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
      
      
      
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`sparse-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Prim's MST',
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
      `Prim's MST ${testData.graphSize} vertices (${testData.graphType})`,
      () => {
        const result = primMST(testData.graph)
        // Verify result to prevent dead code elimination
        if (!result.edges || result.edges.length === 0) { throw new Error("Prim's returned empty MST") }
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
      const complexity = `O(E log V)`
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
    await runPrimsMSTBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}