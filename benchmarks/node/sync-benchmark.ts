#!/usr/bin/env tsx

// Node.js Sync (Synergistic Deep Graph Clustering) Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { syncClustering } from '../../src/research/sync'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200], // Sync algorithm is computationally intensive
    iterations: 3
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 300],
    iterations: 5
  }
}

// Generate test graphs suitable for deep clustering
function generateDeepClusteringGraph(size: number) {
  const numClusters = Math.max(2, Math.floor(size / 20)) // Reasonable number of clusters
  const clusterSize = Math.floor(size / numClusters)
  
  const edges: Array<[number, number]> = []
  const adjacencyList: Record<number, number[]> = {}
  
  // Initialize adjacency list
  for (let i = 0; i < size; i++) {
    adjacencyList[i] = []
  }
  
  // Create dense connections within clusters
  for (let cluster = 0; cluster < numClusters; cluster++) {
    const start = cluster * clusterSize
    const end = Math.min((cluster + 1) * clusterSize, size)
    
    // Dense intra-cluster connections (80% probability)
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.8) {
          edges.push([i, j])
          adjacencyList[i].push(j)
          adjacencyList[j].push(i)
        }
      }
    }
  }
  
  // Add some inter-cluster connections (10% probability)
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const clusterI = Math.floor(i / clusterSize)
      const clusterJ = Math.floor(j / clusterSize)
      
      if (clusterI !== clusterJ && Math.random() < 0.1) {
        edges.push([i, j])
        adjacencyList[i].push(j)
        adjacencyList[j].push(i)
      }
    }
  }
  
  // Add some noise edges (5% probability)
  for (let i = 0; i < size * 0.05; i++) {
    const nodeA = Math.floor(Math.random() * size)
    const nodeB = Math.floor(Math.random() * size)
    if (nodeA !== nodeB && !adjacencyList[nodeA].includes(nodeB)) {
      edges.push([nodeA, nodeB])
      adjacencyList[nodeA].push(nodeB)
      adjacencyList[nodeB].push(nodeA)
    }
  }
  
  return {
    vertices: Array.from({ length: size }, (_, i) => i),
    edges,
    adjacencyList,
    metadata: {
      generationAlgorithm: 'Deep Clustering Graph',
      parameters: {
        vertices: size,
        edges: edges.length,
        clusters: numClusters,
        avgDegree: (edges.length * 2) / size,
        intraClusterDensity: 0.8,
        interClusterDensity: 0.1,
        noiseDensity: 0.05
      }
    },
    directed: false,
    weighted: false
  }
}

async function runSyncBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} Sync (Deep Graph Clustering) benchmarks in Node.js`)
  console.log('=' + '='.repeat(60))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `Sync ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating deep clustering test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex deep clustering graph...`)
      const benchmarkGraph = generateDeepClusteringGraph(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`deep-clustering-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'Sync Clustering',
        graphType: 'deep-clustering',
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
    const testKey = `deep-clustering-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `Sync Clustering ${size} vertices`,
        () => {
          const result = syncClustering(testData.graph, {
            numClusters: Math.max(2, Math.floor(size / 20)),
            embeddingDim: Math.min(32, size / 2),
            maxIterations: 50,
            learningRate: 0.01,
            augmentationStrength: 0.1,
            temperature: 0.5,
            seed: 42
          })
          // Verify result to prevent dead code elimination
          if (!result.clusters || result.clusters.size === 0) {
            throw new Error('Sync clustering returned invalid result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 1.0 // Longer min time due to algorithm complexity
        }
      )
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(80))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(80))
    console.log('Size\tEdges\tTime(ms)\tOps/sec\tClusters\tSilhouette\tLoss\t\tMargin')
    console.log('-'.repeat(80))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      
      // Run once more to get clustering results
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let numClusters = 'N/A'
      let silhouette = 'N/A'
      let finalLoss = 'N/A'
      
      if (testData) {
        try {
          const clusterResult = syncClustering(testData.graph, {
            numClusters: Math.max(2, Math.floor(result.graphSize / 20)),
            embeddingDim: Math.min(32, result.graphSize / 2),
            maxIterations: 50,
            learningRate: 0.01,
            augmentationStrength: 0.1,
            temperature: 0.5,
            seed: 42
          })
          numClusters = clusterResult.numClusters.toString()
          silhouette = clusterResult.silhouetteScore.toFixed(3)
          finalLoss = clusterResult.finalLoss.toFixed(4)
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${result.edges}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${numClusters}\t\t${silhouette}\t\t${finalLoss}\t±${margin.toFixed(1)}%`
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
    await runSyncBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}