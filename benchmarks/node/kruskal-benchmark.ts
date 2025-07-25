#!/usr/bin/env tsx

// Node.js Kruskal's MST Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { kruskalMST } from '../../src/algorithms/mst/kruskal'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
// Kruskal's is O(E log E) or O(E log V)
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

async function runKruskalBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Kruskal's MST benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Kruskal's MST ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex sparse graph...`)
      const benchmarkGraph = generateTestGraphs.sparse(size)
      
      // Add weights to edges for MST
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
        algorithm: "Kruskal's MST",
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
  for (const size of config.sizes) {
    const testKey = `sparse-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `Kruskal ${size} vertices (sparse)`,
        () => {
          const result = kruskalMST(testData.graph)
          // Verify result to prevent dead code elimination
          if (!result.edges || result.edges.length === 0) {
            throw new Error("Kruskal's returned empty MST")
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
  }

  // For comprehensive tests, also test with dense graphs
  if (configType === 'comprehensive') {
    const denseSizes = config.sizes.filter(s => s <= 1000) // Smaller for dense
    
    console.log('\nGenerating dense graphs for comprehensive testing...')
    for (const size of denseSizes) {
      try {
        console.log(`  Generating ${size} vertex dense graph...`)
        const benchmarkGraph = generateTestGraphs.dense(size)
        
        // Add weights
        benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
          const weight = Math.floor(Math.random() * 100) + 1
          return [from, to, weight]
        })
        benchmarkGraph.weighted = true
        
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: "Kruskal's MST",
          graphType: 'dense',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        benchmark.addTest(
          `Kruskal ${size} vertices (dense)`,
          () => {
            const result = kruskalMST(testData.graph)
            if (!result.edges || result.edges.length === 0) {
              throw new Error("Kruskal's returned empty MST")
            }
          },
          testData,
          {
            minSamples: Math.floor(config.iterations * 0.7),
            initCount: 1,
            minTime: 0.1
          }
        )
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (weighted)`)
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
    console.log('\n' + '='.repeat(70))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(70))
    console.log('Size\tType\tTime(ms)\tOps/sec\tEdges\tMST Weight\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      // Run once more to get MST weight
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let mstWeight = 'N/A'
      
      if (testData) {
        try {
          const mst = kruskalMST(testData.graph)
          mstWeight = mst.totalWeight.toFixed(0)
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${result.graphType}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${result.edges}\t${mstWeight}\t\t±${margin.toFixed(1)}%`
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
    await runKruskalBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}