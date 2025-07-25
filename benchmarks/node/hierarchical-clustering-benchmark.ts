#!/usr/bin/env tsx

// Hierarchical Clustering Benchmark
import Benchmark from 'benchmark'
import { hierarchicalClustering, modularityHierarchicalClustering } from '../../src/clustering/hierarchical.js'
import { saveBenchmarkResult, initBenchmarkSession } from '../utils/benchmark-result.js'
import { BenchmarkResult } from '../benchmark-result.js'

// Make functions available globally for Benchmark.js
;(globalThis as any).hierarchicalClustering = hierarchicalClustering
;(globalThis as any).modularityHierarchicalClustering = modularityHierarchicalClustering

// Store test data globally for Benchmark.js
const globalTestData = new Map()

function createAdjacencySetGraph(size: number): Map<number, Set<number>> {
  const graph = new Map<number, Set<number>>()
  
  // Create hierarchical cluster structure
  const numLevels = Math.floor(Math.log2(size)) + 1
  const clusterSize = Math.max(4, Math.floor(size / (numLevels * 2)))
  
  // Initialize nodes
  for (let i = 0; i < size; i++) {
    graph.set(i, new Set())
  }
  
  // Create hierarchical structure: tight clusters with looser inter-cluster connections
  for (let level = 0; level < numLevels; level++) {
    const start = level * clusterSize
    const end = Math.min(start + clusterSize, size)
    
    // Dense intra-cluster connections
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.7) { // High intra-cluster connectivity
          graph.get(i)?.add(j)
          graph.get(j)?.add(i)
        }
      }
    }
    
    // Sparse inter-cluster connections to next level
    if (level < numLevels - 1) {
      const nextStart = (level + 1) * clusterSize
      const nextEnd = Math.min(nextStart + clusterSize, size)
      
      for (let i = start; i < end; i++) {
        for (let j = nextStart; j < nextEnd; j++) {
          if (Math.random() < 0.2) { // Low inter-cluster connectivity
            graph.get(i)?.add(j)
            graph.get(j)?.add(i)
          }
        }
      }
    }
  }
  
  return graph
}

function countEdges(graph: Map<number, Set<number>>): number {
  let edgeCount = 0
  for (const neighbors of graph.values()) {
    edgeCount += neighbors.size
  }
  return edgeCount / 2 // Undirected graph, each edge counted twice
}

function createTestGraphs(isQuick: boolean) {
  const configs = {
    quick: {
      testType: 'quick' as const,
      platform: 'node' as const,
      sizes: [20, 30, 50], // Small graphs for O(n³) hierarchical clustering
      iterations: 3
    },
    comprehensive: {
      testType: 'comprehensive' as const,
      platform: 'node' as const,
      sizes: [20, 30, 50, 80], // Hierarchical clustering is computationally expensive
      iterations: 2
    }
  }
  
  const config = isQuick ? configs.quick : configs.comprehensive
  
  config.sizes.forEach(size => {
    const graph = createAdjacencySetGraph(size)
    const edgeCount = countEdges(graph)
    
    globalTestData.set(`hierarchical-${size}`, {
      graph,
      size,
      edges: edgeCount,
      graphType: 'hierarchical-structured',
      algorithm: 'Hierarchical Clustering'
    })
    
    console.log(`📊 Created hierarchical-structured graph: ${size} nodes, ${edgeCount} edges`)
  })
  
  return config
}

function runBenchmarks(config: ReturnType<typeof createTestGraphs>) {
  const suite = new Benchmark.Suite()
  const results: BenchmarkResult[] = []

  config.sizes.forEach(size => {
    const testData = globalTestData.get(`hierarchical-${size}`)
    if (!testData) return

    // Test standard hierarchical clustering with single linkage
    const testName1 = `Hierarchical Clustering (Single) - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName1, () => {
      hierarchicalClustering(testData.graph, 'single')
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        hierarchicalClustering(testData.graph, 'single')
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: 'Hierarchical Clustering (Single)',
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Hierarchical-Structured Graph',
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

    // Test modularity-based hierarchical clustering
    const testName2 = `Hierarchical Clustering (Modularity) - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName2, () => {
      modularityHierarchicalClustering(testData.graph)
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        modularityHierarchicalClustering(testData.graph)
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: 'Hierarchical Clustering (Modularity)',
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Hierarchical-Structured Graph',
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
  console.log('🚀 Starting Hierarchical Clustering Benchmark...')
  
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const mode = isQuick ? 'quick' : 'comprehensive'
  
  console.log(`📊 Running ${mode} benchmark suite for Hierarchical Clustering`)
  
  // Initialize benchmark session
  initBenchmarkSession(mode)
  
  // Create test graphs
  const config = createTestGraphs(isQuick)
  
  console.log('\n⚡ Running benchmarks...\n')
  
  // Run benchmarks
  const results = await runBenchmarks(config)
  
  // Save results
  saveBenchmarkResult(results)
  
  console.log(`\n✨ Hierarchical Clustering benchmark completed! Tested ${results.length} configurations.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}