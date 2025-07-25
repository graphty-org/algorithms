#!/usr/bin/env tsx

// Node.js Closeness Centrality Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { closenessCentrality } from '../../src/algorithms/centrality/closeness'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
// Closeness centrality is O(V^2) for unconnected graphs, O(V*E) for connected
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 250], // Smaller sizes due to O(V^2) worst case
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 250, 500, 1000],
    iterations: 20
  }
}

async function runClosenessCentralityBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Closeness Centrality benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Closeness Centrality ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  // Use complete graphs for small sizes to ensure connectivity
  const smallSizes = config.sizes.filter(s => s <= 100)
  for (const size of smallSizes) {
    try {
      console.log(`  Generating ${size} vertex complete graph...`)
      const benchmarkGraph = generateTestGraphs.complete(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`complete-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Closeness Centrality',
        graphType: 'complete',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }
  
  // Use sparse graphs for larger sizes
  const largeSizes = config.sizes.filter(s => s > 100)
  for (const size of largeSizes) {
    try {
      console.log(`  Generating ${size} vertex sparse graph...`)
      const benchmarkGraph = generateTestGraphs.sparse(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`sparse-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Closeness Centrality',
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
  for (const [key, testData] of testGraphs.entries()) {
    benchmark.addTest(
      `Closeness Centrality ${testData.graphSize} vertices (${testData.graphType})`,
      () => {
        const result = closenessCentrality(testData.graph)
        // Verify result to prevent dead code elimination
        if (Object.keys(result).length === 0) {
          throw new Error('Closeness Centrality returned empty result')
        }
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
    console.log('Size\tType\t\tTime(ms)\tOps/sec\tComplexity\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const complexity = result.graphType === 'complete' ? `O(V²)=${result.graphSize}²` : `O(V*E)`
      const margin = result.metrics?.marginOfError || 0
      const typeStr = result.graphType.padEnd(10)
      console.log(
        `${result.graphSize}\t${typeStr}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${complexity}\t±${margin.toFixed(1)}%`
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
    await runClosenessCentralityBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}