#!/usr/bin/env tsx

// Node.js Bellman-Ford Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { bellmanFord } from '../../src/algorithms/shortest-path/bellman-ford'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Store test data globally for Benchmark.js
const globalTestData = new Map()

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200], // O(V×E) algorithm, medium graphs
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 500, 1000],
    iterations: 20
  }
}

async function runBellmanFordBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Bellman-Ford benchmarks in Node.js`)
  console.log('='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Bellman-Ford ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  // Generate sparse graphs (typical for shortest path)
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex sparse graph...`)
      const benchmarkGraph = generateTestGraphs.sparse(size)
      
      // Add weights (including negative for Bellman-Ford)
      benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
        const weight = Math.floor(Math.random() * 20) - 5 // -5 to 14
        return [from, to, weight]
      })
      benchmarkGraph.weighted = true
      
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      const testKey = `sparse-${size}`
      testGraphs.set(testKey, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Bellman-Ford',
        graphType: 'sparse',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      // Store globally
      globalTestData.set(testKey, graph)
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (weighted)`)
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
      
      // Create a function that accesses the global store
      const testFn = new Function('return function() { const graph = globalTestData.get("' + testKey + '"); const result = bellmanFord(graph, 0); if (!result.distances || result.distances.size === 0) { throw new Error("Bellman-Ford returned empty result"); } }')()
      
      // Make sure global references are available
      ;(globalThis as any).globalTestData = globalTestData
      ;(globalThis as any).bellmanFord = bellmanFord
      
      benchmark.addTest(
        `Bellman-Ford ${size} vertices (sparse)`,
        testFn,
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.1 // minimum 100ms per test
        }
      )
    }
  }

  // For comprehensive tests, also add small-world graphs
  if (configType === 'comprehensive') {
    const smallWorldSizes = config.sizes.filter(s => s <= 500) // Smaller sizes for small-world
    
    console.log('\nGenerating small-world graphs for comprehensive testing...')
    for (const size of smallWorldSizes) {
      try {
        console.log(`  Generating ${size} vertex small-world graph...`)
        const benchmarkGraph = generateTestGraphs.smallWorld(size)
        
        // Add weights
        benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
          const weight = Math.floor(Math.random() * 20) - 5
          return [from, to, weight]
        })
        benchmarkGraph.weighted = true
        
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testKey = `smallWorld-${size}`
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Bellman-Ford',
          graphType: 'smallWorld',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        // Store globally
        globalTestData.set(testKey, graph)
        
        const testFn = new Function('return function() { const graph = globalTestData.get("' + testKey + '"); const result = bellmanFord(graph, 0); if (!result.distances || result.distances.size === 0) { throw new Error("Bellman-Ford returned empty result"); } }')()
        
        benchmark.addTest(
          `Bellman-Ford ${size} vertices (small-world)`,
          testFn,
          testData,
          {
            minSamples: Math.floor(config.iterations * 0.7),
            initCount: 1,
            minTime: 0.1
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (weighted small-world)`)
      } catch (error) {
        console.error(`    ✗ Failed to generate small-world ${size} vertex graph:`, error)
      }
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(70))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(70))
    console.log('Size\tType\t\tEdges\tTime(ms)\tOps/sec\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      const type = result.graphType.padEnd(12)
      
      console.log(
        `${result.graphSize}\t${type}\t${result.edges}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t±${margin.toFixed(1)}%`
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
    await runBellmanFordBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}