#!/usr/bin/env tsx

// Node.js Graph Isomorphism Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { isGraphIsomorphic } from '../../src/algorithms/matching/isomorphism'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Make isGraphIsomorphic available globally for Benchmark.js
;(globalThis as any).isGraphIsomorphic = isGraphIsomorphic

// Store test data globally for Benchmark.js
const globalTestData = new Map()

// Configuration for Node.js benchmarks
// Graph isomorphism is NP-complete, so we use very small graphs
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [5, 10, 15], // Very small graphs due to complexity
    iterations: 10
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [5, 10, 15, 20, 25],
    iterations: 20
  }
}

// Create an isomorphic graph by permuting vertices
function createIsomorphicGraph(originalGraph: any) {
  const n = originalGraph.vertices.length
  const permutation: number[] = []
  
  // Create random permutation
  for (let i = 0; i < n; i++) {
    permutation.push(i)
  }
  
  // Fisher-Yates shuffle
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]]
  }
  
  // Create inverse permutation map
  const inversePermutation: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    inversePermutation[permutation[i]] = i
  }
  
  // Create new edges with permuted vertices
  const newEdges = originalGraph.edges.map(([from, to]: [number, number]) => {
    return [inversePermutation[from], inversePermutation[to]]
  })
  
  // Rebuild adjacency list
  const newAdjacencyList: Record<number, number[]> = {}
  for (let i = 0; i < n; i++) {
    newAdjacencyList[i] = []
  }
  
  newEdges.forEach(([from, to]) => {
    newAdjacencyList[from].push(to)
    if (!originalGraph.directed) {
      newAdjacencyList[to].push(from)
    }
  })
  
  return {
    ...originalGraph,
    edges: newEdges,
    adjacencyList: newAdjacencyList,
    metadata: {
      ...originalGraph.metadata,
      permutation,
      isIsomorphicTo: 'original'
    }
  }
}

async function runGraphIsomorphismBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Graph Isomorphism benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  console.log('⚠️  Note: Graph Isomorphism is NP-complete, using very small graphs')
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Graph Isomorphism ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graph pairs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex graph pairs...`)
      
      // Generate original graph
      const originalGraph = size <= 10 ? generateTestGraphs.complete(size) : generateTestGraphs.dense(size)
      const graph1 = convertToLibraryGraph(originalGraph)
      
      // Create isomorphic graph
      const isomorphicGraph = createIsomorphicGraph(originalGraph)
      const graph2 = convertToLibraryGraph(isomorphicGraph)
      
      const testKey = `isomorphic-${size}`
      testGraphs.set(testKey, {
        graph1,
        graph2,
        metadata: originalGraph.metadata,
        edges: originalGraph.edges.length,
        algorithm: 'Graph Isomorphism',
        graphType: 'isomorphic-pair',
        graphSize: size,
        graphGenerationAlgorithm: originalGraph.metadata?.generationAlgorithm,
        expectedResult: true
      })
      
      // Store graphs globally
      globalTestData.set(testKey, { graph1, graph2, expectedResult: true })
      
      console.log(`    ✓ ${size} vertices, ${originalGraph.edges.length} edges (isomorphic pair)`)
      
      // Also test non-isomorphic pairs
      if (size > 5) {
        const differentGraph = generateTestGraphs.sparse(size)
        const graph3 = convertToLibraryGraph(differentGraph)
        
        const nonIsoKey = `non-isomorphic-${size}`
        testGraphs.set(nonIsoKey, {
          graph1,
          graph2: graph3,
          metadata: originalGraph.metadata,
          edges: originalGraph.edges.length,
          algorithm: 'Graph Isomorphism',
          graphType: 'non-isomorphic-pair',
          graphSize: size,
          graphGenerationAlgorithm: originalGraph.metadata?.generationAlgorithm,
          expectedResult: false
        })
        
        // Store graphs globally
        globalTestData.set(nonIsoKey, { graph1, graph2: graph3, expectedResult: false })
        
        console.log(`    ✓ ${size} vertices (non-isomorphic pair)`)
      }
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  ;(globalThis as any).globalTestData = globalTestData
  
  for (const [key, testData] of testGraphs.entries()) {
    const testFn = new Function('return function() { const data = globalTestData.get("' + key + '"); const result = isGraphIsomorphic(data.graph1, data.graph2); if (result.isIsomorphic !== data.expectedResult) { throw new Error("Graph Isomorphism returned unexpected result: " + result.isIsomorphic); } }')()
    
    benchmark.addTest(
      `Isomorphism ${testData.graphSize} vertices (${testData.graphType})`,
      testFn,
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
  console.log('⏰ This may take a while due to NP-complete complexity...')
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(70))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(70))
    console.log('Size\tType\t\t\tTime(ms)\tOps/sec\tResult\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      const typeStr = result.graphType.padEnd(20)
      const testData = testGraphs.get(`${result.graphType.split('-pair')[0]}-${result.graphSize}`)
      const expectedResult = testData?.expectedResult ? 'true' : 'false'
      
      console.log(
        `${result.graphSize}\t${typeStr}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${expectedResult}\t±${margin.toFixed(1)}%`
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
    await runGraphIsomorphismBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}