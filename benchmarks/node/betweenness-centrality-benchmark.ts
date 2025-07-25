#!/usr/bin/env tsx

// Node.js Betweenness Centrality Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { betweennessCentrality } from '../../src/algorithms/centrality/betweenness'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
// Betweenness centrality is O(V*E) for unweighted graphs, O(V*E + V^2 log V) for weighted
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200], // Smaller sizes due to O(V*E) complexity
    iterations: 5 // Fewer iterations due to longer runtime
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 500, 1000],
    iterations: 10
  }
}

async function runBetweennessCentralityBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Betweenness Centrality benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  console.log('⚠️  Note: Betweenness Centrality has O(V*E) complexity, using smaller graphs')
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Betweenness Centrality ${configType} Performance`)

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
        algorithm: 'Betweenness Centrality',
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
        `Betweenness Centrality ${size} vertices (sparse)`,
        () => {
          const result = betweennessCentrality(testData.graph)
          // Verify result to prevent dead code elimination
          if (Object.keys(result).length === 0) {
            throw new Error('Betweenness Centrality returned empty result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.1 // 100ms minimum
        }
      )
    }
  }

  // For comprehensive tests, also test with small-world graphs
  if (configType === 'comprehensive') {
    const smallWorldSizes = config.sizes.filter(s => s <= 200) // Even smaller for small-world
    
    console.log('\nGenerating small-world graphs for comprehensive testing...')
    for (const size of smallWorldSizes) {
      try {
        console.log(`  Generating ${size} vertex small-world graph...`)
        const benchmarkGraph = generateTestGraphs.smallWorld(size)
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Betweenness Centrality',
          graphType: 'smallWorld',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        benchmark.addTest(
          `Betweenness Centrality ${size} vertices (small-world)`,
          () => {
            const result = betweennessCentrality(testData.graph)
            if (Object.keys(result).length === 0) {
              throw new Error('Betweenness Centrality returned empty result')
            }
          },
          testData,
          {
            minSamples: Math.floor(config.iterations * 0.7),
            initCount: 1,
            minTime: 0.1
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
      } catch (error) {
        console.error(`    ✗ Failed to generate small-world ${size} vertex graph:`, error)
      }
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  console.log('⏰ This may take a while due to O(V*E) complexity...')
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(70))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(70))
    console.log('Size\tType\t\tTime(ms)\tOps/sec\tComplexity\t\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const complexity = `O(V*E)=${result.graphSize}*${result.edges}`
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
    await runBetweennessCentralityBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}