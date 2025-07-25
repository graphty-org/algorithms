#!/usr/bin/env tsx

// Leiden Community Detection Benchmark
import Benchmark from 'benchmark'
import { leiden } from '../../src/algorithms/community/leiden.js'
import { saveBenchmarkResult, initBenchmarkSession } from '../utils/benchmark-result.js'
import { BenchmarkResult } from '../benchmark-result.js'

// Make leiden available globally for Benchmark.js
;(globalThis as any).leiden = leiden

// Store test data globally for Benchmark.js
const globalTestData = new Map()

function createAdjacencyMapGraph(size: number): Map<string, Map<string, number>> {
  const graph = new Map<string, Map<string, number>>()
  
  // Create community-structured graph for Leiden algorithm
  const numCommunities = Math.max(2, Math.floor(size / 10))
  const communitySize = Math.floor(size / numCommunities)
  
  // Initialize nodes
  for (let i = 0; i < size; i++) {
    graph.set(String(i), new Map())
  }
  
  // Add intra-community edges (higher density)
  for (let community = 0; community < numCommunities; community++) {
    const start = community * communitySize
    const end = Math.min(start + communitySize, size)
    
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.6) { // High intra-community edge probability
          const nodeI = String(i)
          const nodeJ = String(j)
          const weight = 1.0
          
          graph.get(nodeI)?.set(nodeJ, weight)
          graph.get(nodeJ)?.set(nodeI, weight)
        }
      }
    }
  }
  
  // Add inter-community edges (lower density)
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const communityI = Math.floor(i / communitySize)
      const communityJ = Math.floor(j / communitySize)
      
      if (communityI !== communityJ && Math.random() < 0.1) { // Low inter-community edge probability
        const nodeI = String(i)
        const nodeJ = String(j)
        const weight = 1.0
        
        graph.get(nodeI)?.set(nodeJ, weight)
        graph.get(nodeJ)?.set(nodeI, weight)
      }
    }
  }
  
  return graph
}

function countEdges(graph: Map<string, Map<string, number>>): number {
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
      sizes: [50, 100, 200], // Leiden can handle larger graphs efficiently
      iterations: 5
    },
    comprehensive: {
      testType: 'comprehensive' as const,
      platform: 'node' as const,
      sizes: [50, 100, 200, 500], // Community detection scales well
      iterations: 3
    }
  }
  
  const config = isQuick ? configs.quick : configs.comprehensive
  
  config.sizes.forEach(size => {
    const graph = createAdjacencyMapGraph(size)
    const edgeCount = countEdges(graph)
    
    globalTestData.set(`leiden-${size}`, {
      graph,
      size,
      edges: edgeCount,
      graphType: 'community-structured',
      algorithm: 'Leiden'
    })
    
    console.log(`📊 Created community-structured graph: ${size} nodes, ${edgeCount} edges`)
  })
  
  return config
}

function runBenchmarks(config: ReturnType<typeof createTestGraphs>) {
  const suite = new Benchmark.Suite()
  const results: BenchmarkResult[] = []

  config.sizes.forEach(size => {
    const testData = globalTestData.get(`leiden-${size}`)
    if (!testData) return

    const testName = `Leiden Community Detection - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName, () => {
      // Run Leiden algorithm with default parameters
      leiden(testData.graph, { 
        resolution: 1.0,
        maxIterations: 50,
        threshold: 1e-7 
      })
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        leiden(testData.graph, { 
          resolution: 1.0,
          maxIterations: 50,
          threshold: 1e-7 
        })
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: testData.algorithm,
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Community-Structured Graph',
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
        console.log(`✅ ${testName}: ${hz.toFixed(2)} ops/sec (±${stats.rme.toFixed(2)}%)`)
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
  console.log('🚀 Starting Leiden Community Detection Benchmark...')
  
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const mode = isQuick ? 'quick' : 'comprehensive'
  
  console.log(`📊 Running ${mode} benchmark suite for Leiden`)
  
  // Initialize benchmark session
  initBenchmarkSession(mode)
  
  // Create test graphs
  const config = createTestGraphs(isQuick)
  
  console.log('\n⚡ Running benchmarks...\n')
  
  // Run benchmarks
  const results = await runBenchmarks(config)
  
  // Save results
  saveBenchmarkResult(results)
  
  console.log(`\n✨ Leiden benchmark completed! Tested ${results.length} configurations.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}