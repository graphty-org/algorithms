#!/usr/bin/env tsx

// Node.js Degree Centrality Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { degreeCentrality } from '../../src/algorithms/centrality/degree'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [100, 1000, 5000], // O(V) algorithm, can handle larger graphs
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [100, 1000, 5000, 10000, 50000],
    iterations: 20
  }
}

async function runDegreeCentralityBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Degree Centrality benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Degree Centrality ${configType} Performance`)

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
        algorithm: 'Degree Centrality',
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
        `Degree Centrality ${size} vertices (sparse)`,
        () => {
          const result = degreeCentrality(testData.graph)
          // Verify result to prevent dead code elimination
          if (Object.keys(result).length === 0) {
            throw new Error('Degree Centrality returned empty result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.05 // 50ms minimum
        }
      )
    }
  }

  // For comprehensive tests, also test with scale-free graphs (more realistic degree distributions)
  if (configType === 'comprehensive') {
    const rmatSizes = config.sizes.filter(s => s <= 10000)
    
    console.log('\nGenerating RMAT graphs for comprehensive testing...')
    for (const size of rmatSizes) {
      try {
        console.log(`  Generating ${size} vertex RMAT graph...`)
        const benchmarkGraph = generateTestGraphs.rmat(size)
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Degree Centrality',
          graphType: 'rmat',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        benchmark.addTest(
          `Degree Centrality ${size} vertices (RMAT)`,
          () => {
            const result = degreeCentrality(testData.graph)
            if (Object.keys(result).length === 0) {
              throw new Error('Degree Centrality returned empty result')
            }
          },
          testData,
          {
            minSamples: config.iterations,
            initCount: 1,
            minTime: 0.05
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
      } catch (error) {
        console.error(`    ✗ Failed to generate RMAT ${size} vertex graph:`, error)
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
    console.log('Size\tType\tTime(ms)\tOps/sec\tComplexity\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const complexity = `O(V)=${result.graphSize}`
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
    await runDegreeCentralityBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}