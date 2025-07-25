#!/usr/bin/env tsx

// Node.js Connected Components Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { connectedComponents, stronglyConnectedComponents } from '../../src/algorithms/components/connected'
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

async function runConnectedComponentsBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Connected Components benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Connected Components ${configType} Performance`)

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
        algorithm: 'Connected Components',
        graphType: 'sparse',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests for undirected graphs
  console.log('\nAdding benchmark tests...')
  for (const size of config.sizes) {
    const testKey = `sparse-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `Connected Components ${size} vertices (sparse)`,
        () => {
          const result = connectedComponents(testData.graph)
          // Verify result to prevent dead code elimination
          if (!result || result.length === 0) {
            throw new Error('Connected Components returned empty result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.05
        }
      )
    }
  }

  // For comprehensive tests, also test directed graphs (strongly connected components)
  if (configType === 'comprehensive') {
    const directedSizes = config.sizes.filter(s => s <= 10000)
    
    console.log('\nGenerating directed graphs for SCC testing...')
    for (const size of directedSizes) {
      try {
        console.log(`  Generating ${size} vertex directed sparse graph...`)
        const benchmarkGraph = generateTestGraphs.sparse(size)
        benchmarkGraph.directed = true
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        const testData = {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Strongly Connected Components',
          graphType: 'sparse-directed',
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        }
        
        benchmark.addTest(
          `SCC ${size} vertices (sparse-directed)`,
          () => {
            const result = stronglyConnectedComponents(testData.graph)
            if (!result || result.length === 0) {
              throw new Error('SCC returned empty result')
            }
          },
          testData,
          {
            minSamples: config.iterations,
            initCount: 1,
            minTime: 0.05
          }
        )
        
        testGraphs.set(`sparse-directed-${size}`, testData)
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (directed)`)
      } catch (error) {
        console.error(`    ✗ Failed to generate directed ${size} vertex graph:`, error)
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
    console.log('Size\tType\t\t\tTime(ms)\tOps/sec\tComponents\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      const typeStr = result.graphType.padEnd(15)
      
      // Run once more to get component count
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let componentCount = 'N/A'
      
      if (testData) {
        try {
          if (result.algorithm === 'Connected Components') {
            const components = connectedComponents(testData.graph)
            componentCount = components.length.toString()
          } else {
            const components = stronglyConnectedComponents(testData.graph)
            componentCount = components.length.toString()
          }
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${typeStr}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${componentCount}\t\t±${margin.toFixed(1)}%`
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
    await runConnectedComponentsBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}