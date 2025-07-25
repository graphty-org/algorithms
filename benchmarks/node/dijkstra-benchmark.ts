#!/usr/bin/env tsx

// Node.js Dijkstra Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { dijkstraPath } from '../../src/algorithms/shortest-path/dijkstra'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
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
    sizes: [100, 500, 1000, 2000, 5000],
    iterations: 20
  }
}

async function runDijkstraBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Dijkstra benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Dijkstra ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      // Use grid graphs for Dijkstra - more realistic for pathfinding
      console.log(`  Generating ${size} vertex grid graph...`)
      const gridSize = Math.floor(Math.sqrt(size))
      const benchmarkGraph = generateTestGraphs.grid(gridSize)
      
      // Add weights to edges for Dijkstra
      benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
        return [from, to, 1 + Math.random() * 9] // Random weights 1-10
      })
      benchmarkGraph.weighted = true
      
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      // Choose source and target for pathfinding (opposite corners)
      const source = 0
      const target = benchmarkGraph.vertices.length - 1
      
      testGraphs.set(`grid-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Dijkstra',
        graphType: 'grid',
        graphSize: benchmarkGraph.vertices.length,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm,
        source,
        target
      })
      
      console.log(`    ✓ ${benchmarkGraph.vertices.length} vertices, ${benchmarkGraph.edges.length} edges`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const size of config.sizes) {
    const testKey = `grid-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `Dijkstra ${size} vertices (grid)`,
        () => {
          const result = dijkstraPath(testData.graph, testData.source, testData.target)
          // Verify result to prevent dead code elimination
          if (!result || result.distance === 0) {
            throw new Error('Dijkstra returned invalid result')
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

  // For comprehensive tests, also add sparse graphs
  if (configType === 'comprehensive') {
    const sparseSizes = config.sizes.filter(s => s <= 2000) // Smaller sizes for sparse
    
    console.log('Generating sparse graphs for comprehensive testing...')
    for (const size of sparseSizes) {
      try {
        console.log(`  Generating ${size} vertex sparse graph...`)
        const benchmarkGraph = generateTestGraphs.sparse(size)
        
        // Add weights
        benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
          return [from, to, 1 + Math.random() * 9]
        })
        benchmarkGraph.weighted = true
        
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Dijkstra',
          graphType: 'sparse',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm,
          source: 0,
          target: size - 1
        }
        
        benchmark.addTest(
          `Dijkstra ${size} vertices (sparse)`,
          () => {
            const result = dijkstraPath(testData.graph, testData.source, testData.target)
            if (!result || result.distance === 0) {
              throw new Error('Dijkstra returned invalid result')
            }
          },
          testData,
          {
            minSamples: Math.floor(config.iterations * 0.7), // Fewer iterations for sparse
            initCount: 1,
            minTime: 0.1
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
      } catch (error) {
        console.error(`    ✗ Failed to generate sparse ${size} vertex graph:`, error)
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
    console.log('Size\tType\tTime(ms)\tOps/sec\tPath Length\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const pathLength = result.metrics?.pathLength || 'N/A'
      const margin = result.metrics?.marginOfError || 0
      console.log(
        `${result.graphSize}\t${result.graphType}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${pathLength}\t\t±${margin.toFixed(1)}%`
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
    await runDijkstraBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}