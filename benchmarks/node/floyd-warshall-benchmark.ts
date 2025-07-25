#!/usr/bin/env tsx

// Node.js Floyd-Warshall Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { floydWarshall } from '../../src/algorithms/shortest-path/floyd-warshall'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Store test data globally for Benchmark.js
const globalTestData = new Map()

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [10, 25, 50], // O(V³) algorithm, very small graphs
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [10, 25, 50, 75, 100],
    iterations: 20
  }
}

async function runFloydWarshallBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Floyd-Warshall benchmarks in Node.js`)
  console.log('='.repeat(51))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  console.log('⚠️  Note: Floyd-Warshall has O(V³) complexity, using smaller graphs')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Floyd-Warshall ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('\nPre-generating test graphs...')
  const testGraphs = new Map()
  
  // Generate complete graphs (worst case for Floyd-Warshall)
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex complete graph...`)
      const benchmarkGraph = generateTestGraphs.complete(size)
      
      // Add weights to edges
      benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
        const weight = Math.floor(Math.random() * 20) + 1 // 1 to 20
        return [from, to, weight]
      })
      benchmarkGraph.weighted = true
      
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      const testKey = `complete-${size}`
      testGraphs.set(testKey, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Floyd-Warshall',
        graphType: 'complete',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      // Store globally for benchmark
      globalTestData.set(testKey, graph)
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (weighted)`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const [key, testData] of testGraphs.entries()) {
    // Create a function that accesses the global store
    const testFn = new Function('return function() { const graph = globalTestData.get("' + key + '"); const result = floydWarshall(graph); if (!result.distances || result.distances.size === 0) { throw new Error("Floyd-Warshall returned empty result"); } }')()
    
    // Make sure global references are available
    ;(globalThis as any).globalTestData = globalTestData
    ;(globalThis as any).floydWarshall = floydWarshall
    
    benchmark.addTest(
      `Floyd-Warshall ${testData.graphSize} vertices (${testData.graphType})`,
      testFn,
      testData,
      {
        minSamples: config.iterations,
        initCount: 1,
        minTime: 0.1 // minimum 100ms per test
      }
    )
  }

  // For comprehensive tests, also test sparse graphs (more realistic)
  if (configType === 'comprehensive') {
    const sparseSizes = config.sizes.filter(s => s <= 100) // Even smaller for sparse
    
    console.log('\nGenerating sparse graphs for comprehensive testing...')
    for (const size of sparseSizes) {
      try {
        console.log(`  Generating ${size} vertex sparse graph...`)
        const benchmarkGraph = generateTestGraphs.sparse(size)
        
        // Add weights
        benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
          const weight = Math.floor(Math.random() * 10) + 1
          return [from, to, weight]
        })
        benchmarkGraph.weighted = true
        
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testKey = `sparse-${size}`
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Floyd-Warshall',
          graphType: 'sparse',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        // Store globally
        globalTestData.set(testKey, graph)
        
        const testFn = new Function('return function() { const graph = globalTestData.get("' + testKey + '"); const result = floydWarshall(graph); if (!result.distances || result.distances.size === 0) { throw new Error("Floyd-Warshall returned empty result"); } }')()
        
        benchmark.addTest(
          `Floyd-Warshall ${size} vertices (sparse)`,
          testFn,
          testData,
          {
            minSamples: Math.floor(config.iterations * 0.7),
            initCount: 1,
            minTime: 0.1
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (weighted sparse)`)
      } catch (error) {
        console.error(`    ✗ Failed to generate sparse ${size} vertex graph:`, error)
      }
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  console.log('⏰ This may take a while due to O(V³) complexity...')
  
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
      const type = result.graphType.padEnd(8)
      
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
    await runFloydWarshallBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}