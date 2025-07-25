#!/usr/bin/env tsx

// Node.js Louvain Community Detection Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { louvain } from '../../src/algorithms/community/louvain'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [100, 500, 1000], // Louvain is relatively efficient
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [100, 500, 1000, 5000, 10000],
    iterations: 20
  }
}

async function runLouvainBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Louvain Community Detection benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Louvain ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  // Test with different graph types that have community structure
  const graphTypes = ['smallWorld', 'rmat'] // Both have natural community structure
  
  for (const size of config.sizes) {
    for (const graphType of graphTypes) {
      try {
        console.log(`  Generating ${size} vertex ${graphType} graph...`)
        const benchmarkGraph = generateTestGraphs[graphType](size)
        const graph = convertToLibraryGraph(benchmarkGraph)
        
        testGraphs.set(`${graphType}-${size}`, {
          graph,
          metadata: benchmarkGraph.metadata,
          edges: benchmarkGraph.edges.length,
          algorithm: 'Louvain',
          graphType,
          graphSize: size,
          graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
        })
        
        console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
      } catch (error) {
        console.error(`    ✗ Failed to generate ${size} vertex ${graphType} graph:`, error)
      }
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const [key, testData] of testGraphs.entries()) {
    benchmark.addTest(
      `Louvain ${testData.graphSize} vertices (${testData.graphType})`,
      () => {
        const result = louvain(testData.graph)
        // Verify result to prevent dead code elimination
        if (!result.communities || result.communities.size === 0) {
          throw new Error('Louvain returned empty result')
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
    console.log('\n' + '='.repeat(70))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(70))
    console.log('Size\tType\t\tTime(ms)\tOps/sec\tCommunities\tModularity\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      const typeStr = result.graphType.padEnd(10)
      // Run once more to get community count
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let communities = 'N/A'
      let modularity = 'N/A'
      
      if (testData) {
        try {
          const res = louvain(testData.graph)
          communities = new Set(res.communities.values()).size.toString()
          modularity = res.modularity.toFixed(3)
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${typeStr}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${communities}\t\t${modularity}\t\t±${margin.toFixed(1)}%`
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
    await runLouvainBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}