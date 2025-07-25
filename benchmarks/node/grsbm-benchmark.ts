#!/usr/bin/env tsx

// Node.js GRSBM (Greedy Recursive Spectral Bisection) Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { grsbm } from '../../src/research/grsbm'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200], // GRSBM is computationally intensive
    iterations: 5
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 500],
    iterations: 10
  }
}

// Generate test graphs suitable for community detection
function generateCommunityGraph(size: number) {
  const communities = Math.floor(Math.sqrt(size / 10)) + 2 // 2-6 communities typically
  const communitySize = Math.floor(size / communities)
  
  const edges: Array<[number, number]> = []
  const adjacencyList: Record<number, number[]> = {}
  
  // Initialize adjacency list
  for (let i = 0; i < size; i++) {
    adjacencyList[i] = []
  }
  
  // Create dense connections within communities
  for (let comm = 0; comm < communities; comm++) {
    const start = comm * communitySize
    const end = Math.min((comm + 1) * communitySize, size)
    
    // Dense intra-community connections (70% probability)
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.7) {
          edges.push([i, j])
          adjacencyList[i].push(j)
          adjacencyList[j].push(i)
        }
      }
    }
  }
  
  // Sparse inter-community connections (5% probability)
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const commI = Math.floor(i / communitySize)
      const commJ = Math.floor(j / communitySize)
      
      if (commI !== commJ && Math.random() < 0.05) {
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
      generationAlgorithm: 'Community Graph',
      parameters: {
        vertices: size,
        edges: edges.length,
        communities,
        avgDegree: (edges.length * 2) / size,
        intraCommunityDensity: 0.7,
        interCommunityDensity: 0.05
      }
    },
    directed: false,
    weighted: false
  }
}

async function runGRSBMBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} GRSBM benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `GRSBM ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating community test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex community graph...`)
      const benchmarkGraph = generateCommunityGraph(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`community-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'GRSBM',
        graphType: 'community',
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
    const testKey = `community-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `GRSBM ${size} vertices`,
        () => {
          const result = grsbm(testData.graph, {
            maxDepth: 10,
            minClusterSize: 3,
            numEigenvectors: 2,
            tolerance: 1e-6,
            maxIterations: 100
          })
          // Verify result to prevent dead code elimination
          if (!result.root || result.numClusters < 1) {
            throw new Error('GRSBM returned invalid result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.5
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
    console.log('Size\tEdges\tTime(ms)\tOps/sec\tClusters\tModularity\tMargin')
    console.log('-'.repeat(70))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      
      // Run once more to get clustering results
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let numClusters = 'N/A'
      let modularity = 'N/A'
      
      if (testData) {
        try {
          const clusterResult = grsbm(testData.graph, {
            maxDepth: 10,
            minClusterSize: 3,
            numEigenvectors: 2,
            tolerance: 1e-6,
            maxIterations: 100
          })
          numClusters = clusterResult.numClusters.toString()
          modularity = clusterResult.totalModularity.toFixed(3)
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${result.edges}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${numClusters}\t\t${modularity}\t±${margin.toFixed(1)}%`
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
    await runGRSBMBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}