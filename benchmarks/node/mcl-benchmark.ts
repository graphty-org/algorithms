#!/usr/bin/env tsx

// MCL (Markov Clustering) Benchmark
import Benchmark from 'benchmark'
import { Graph } from '../../src/core/graph.js'
import { markovClustering } from '../../src/clustering/mcl.js'
import { saveBenchmarkResult, initBenchmarkSession } from '../utils/benchmark-result.js'
import { BenchmarkResult } from '../benchmark-result.js'
import { getGraphSizes, getMaxIterations, getAlgorithmConfig } from '../algorithm-complexity.js'

// Make markovClustering available globally for Benchmark.js
;(globalThis as any).markovClustering = markovClustering

// Store test data globally for Benchmark.js
const globalTestData = new Map()

function createTestGraphs(isQuick: boolean) {
  const configs = {
    quick: {
      testType: 'quick' as const,
      platform: 'node' as const,
      sizes: getGraphSizes('MCL', true), // Adaptive sizing
      iterations: 1 // Minimal iterations for O(V³) algorithm
    },
    comprehensive: {
      testType: 'comprehensive' as const,
      platform: 'node' as const,
      sizes: getGraphSizes('MCL', false), // Adaptive sizing
      iterations: 1 // Minimal iterations for expensive algorithm
    }
  }
  
  const config = isQuick ? configs.quick : configs.comprehensive
  
  config.sizes.forEach(size => {
    // Create clustered graph suitable for MCL
    const graph = new Graph({ directed: false })
    const numClusters = Math.max(2, Math.floor(size / 8))
    const clusterSize = Math.floor(size / numClusters)
    
    // Add nodes
    for (let i = 0; i < size; i++) {
      graph.addNode(i)
    }
    
    // Create dense intra-cluster connections
    for (let cluster = 0; cluster < numClusters; cluster++) {
      const start = cluster * clusterSize
      const end = Math.min(start + clusterSize, size)
      
      // High density within clusters
      for (let i = start; i < end; i++) {
        for (let j = i + 1; j < end; j++) {
          if (Math.random() < 0.8) { // Very high intra-cluster density
            graph.addEdge(i, j, 1.0)
          }
        }
      }
    }
    
    // Add sparse inter-cluster connections  
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        const clusterI = Math.floor(i / clusterSize)
        const clusterJ = Math.floor(j / clusterSize)
        
        if (clusterI !== clusterJ && Math.random() < 0.05) { // Very low inter-cluster density
          graph.addEdge(i, j, 0.5) // Lower weight for inter-cluster edges
        }
      }
    }
    
    const edgeCount = Array.from(graph.edges()).length
    
    globalTestData.set(`mcl-${size}`, {
      graph,
      size,
      edges: edgeCount,
      graphType: 'clustered',
      algorithm: 'MCL'
    })
    
    console.log(`📊 Created clustered graph: ${size} nodes, ${edgeCount} edges`)
  })
  
  const algConfig = getAlgorithmConfig('MCL', isQuick)
  const maxIter = getMaxIterations('MCL') || 50
  console.log(`\n⚠️  Note: MCL has O(V³) complexity`)
  console.log(`   Using adaptive sizing: ${config.sizes.join(', ')} vertices`)
  console.log(`   Max iterations limited to: ${maxIter} (from ${50})`)
  
  return config
}

function runBenchmarks(config: ReturnType<typeof createTestGraphs>) {
  const suite = new Benchmark.Suite()
  const results: BenchmarkResult[] = []

  config.sizes.forEach(size => {
    const testData = globalTestData.get(`mcl-${size}`)
    if (!testData) return

    // Test MCL with standard parameters
    const testName1 = `MCL (Standard) - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName1, () => {
      markovClustering(testData.graph, {
        expansion: 2,
        inflation: 2,
        maxIterations: getMaxIterations('MCL') || 50,
        tolerance: 1e-6,
        pruningThreshold: 1e-5
      })
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        markovClustering(testData.graph, {
          expansion: 2,
          inflation: 2,
          maxIterations: getMaxIterations('MCL') || 50,
          tolerance: 1e-6,
          pruningThreshold: 1e-5
        })
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: 'MCL (Standard)',
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Clustered Graph',
          graphSize: testData.size,
          edges: testData.edges,
          executionTime: stats.mean * 1000,
          memoryUsage: Math.max(memoryUsed, 0),
          memoryPerVertex: Math.max(memoryUsed, 0) / testData.size,
          timestamp: new Date().toISOString(),
          metrics: {
            opsPerSecond: hz,
            samples: stats.sample.length,
            marginOfError: stats.rme,
            standardDeviation: stats.deviation,
            variance: stats.variance,
            platform: config.platform,
            testType: config.testType,
            teps: hz * testData.edges // Traversed Edges Per Second
          }
        }
        
        results.push(result)
        console.log(`✅ ${testName1}: ${hz.toFixed(2)} ops/sec (±${stats.rme.toFixed(2)}%)`)
      }
    })

    // Test MCL with higher inflation (creates more, smaller clusters)
    const testName2 = `MCL (High Inflation) - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName2, () => {
      markovClustering(testData.graph, {
        expansion: 2,
        inflation: 3,
        maxIterations: getMaxIterations('MCL') || 50,
        tolerance: 1e-6,
        pruningThreshold: 1e-5
      })
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        markovClustering(testData.graph, {
          expansion: 2,
          inflation: 3,
          maxIterations: getMaxIterations('MCL') || 50,
          tolerance: 1e-6,
          pruningThreshold: 1e-5
        })
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: 'MCL (High Inflation)',
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Clustered Graph',
          graphSize: testData.size,
          edges: testData.edges,
          executionTime: stats.mean * 1000,
          memoryUsage: Math.max(memoryUsed, 0),
          memoryPerVertex: Math.max(memoryUsed, 0) / testData.size,
          timestamp: new Date().toISOString(),
          metrics: {
            opsPerSecond: hz,
            samples: stats.sample.length,
            marginOfError: stats.rme,
            standardDeviation: stats.deviation,
            variance: stats.variance,
            platform: config.platform,
            testType: config.testType,
            teps: hz * testData.edges // Traversed Edges Per Second
          }
        }
        
        results.push(result)
        console.log(`✅ ${testName2}: ${hz.toFixed(2)} ops/sec (±${stats.rme.toFixed(2)}%)`)
      }
    })
  })

  return new Promise<BenchmarkResult[]>((resolve) => {
    suite
      .on('complete', () => {
        resolve(results)
      })
      .run({ async: true })
  })
}

async function main() {
  console.log('🚀 Starting MCL (Markov Clustering) Benchmark...')
  
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const mode = isQuick ? 'quick' : 'comprehensive'
  
  console.log(`📊 Running ${mode} benchmark suite for MCL`)
  
  // Initialize benchmark session
  initBenchmarkSession(mode)
  
  // Create test graphs
  const config = createTestGraphs(isQuick)
  
  console.log('\n⚡ Running benchmarks...\n')
  
  // Run benchmarks
  const results = await runBenchmarks(config)
  
  // Save results
  saveBenchmarkResult(results)
  
  console.log(`\n✨ MCL benchmark completed! Tested ${results.length} configurations.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}