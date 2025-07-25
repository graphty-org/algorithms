#!/usr/bin/env tsx

// Node.js Bipartite Matching Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { maximumBipartiteMatching, bipartitePartition } from '../../src/algorithms/matching/bipartite'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200], // Bipartite matching can be expensive
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 500, 1000],
    iterations: 20
  }
}

// Generate a bipartite graph
function generateBipartiteGraph(size: number) {
  const leftSize = Math.floor(size / 2)
  const rightSize = size - leftSize
  const edges: Array<[number, number]> = []
  const adjacencyList: Record<number, number[]> = {}
  
  // Initialize adjacency list
  for (let i = 0; i < size; i++) {
    adjacencyList[i] = []
  }
  
  // Connect left partition to right partition with ~30% probability
  for (let i = 0; i < leftSize; i++) {
    for (let j = leftSize; j < size; j++) {
      if (Math.random() < 0.3) {
        edges.push([i, j])
        adjacencyList[i].push(j)
        adjacencyList[j].push(i)
      }
    }
  }
  
  return {
    vertices: Array.from({ length: size }, (_, i) => i),
    edges,
    adjacencyList,
    metadata: {
      generationAlgorithm: 'Bipartite Graph',
      parameters: {
        vertices: size,
        leftPartition: leftSize,
        rightPartition: rightSize,
        edges: edges.length,
        avgDegree: (edges.length * 2) / size
      }
    },
    directed: false,
    weighted: false
  }
}

async function runBipartiteMatchingBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Bipartite Matching benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Bipartite Matching ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating bipartite test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex bipartite graph...`)
      const benchmarkGraph = generateBipartiteGraph(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      // Verify it's bipartite and get partitions
      const partitions = bipartitePartition(graph)
      if (!partitions) {
        throw new Error('Generated graph is not bipartite!')
      }
      
      testGraphs.set(`bipartite-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Maximum Bipartite Matching',
        graphType: 'bipartite',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm,
        leftPartition: partitions.left,
        rightPartition: partitions.right
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const size of config.sizes) {
    const testKey = `bipartite-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `Bipartite Matching ${size} vertices`,
        () => {
          const result = maximumBipartiteMatching(
            testData.graph,
            { leftNodes: testData.leftPartition, rightNodes: testData.rightPartition }
          )
          // Verify result to prevent dead code elimination
          if (!result.matching) {
            throw new Error('Bipartite Matching returned invalid result')
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

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(70))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(70))
    console.log('Size\tEdges\tTime(ms)\tOps/sec\tMatching Size\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      
      // Run once more to get matching size
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let matchingSize = 'N/A'
      
      if (testData) {
        try {
          const matching = maximumBipartiteMatching(
            testData.graph,
            { leftNodes: testData.leftPartition, rightNodes: testData.rightPartition }
          )
          matchingSize = matching.size.toString()
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${result.edges}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${matchingSize}\t\t±${margin.toFixed(1)}%`
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
    await runBipartiteMatchingBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}