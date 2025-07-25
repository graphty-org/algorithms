#!/usr/bin/env tsx

// Min-Cut Algorithms Benchmark
import Benchmark from 'benchmark'
import { minSTCut, stoerWagner, kargerMinCut } from '../../src/flow/min-cut.js'
import { saveBenchmarkResult, initBenchmarkSession } from '../utils/benchmark-result.js'
import { BenchmarkResult } from '../benchmark-result.js'

// Make functions available globally for Benchmark.js
;(globalThis as any).minSTCut = minSTCut
;(globalThis as any).stoerWagner = stoerWagner
;(globalThis as any).kargerMinCut = kargerMinCut

// Store test data globally for Benchmark.js
const globalTestData = new Map()

function createAdjacencyMapGraph(size: number): Map<string, Map<string, number>> {
  const graph = new Map<string, Map<string, number>>()
  
  // Initialize nodes
  for (let i = 0; i < size; i++) {
    graph.set(String(i), new Map())
  }
  
  // Create network flow structure with natural bottlenecks
  const numLayers = Math.floor(Math.log2(size)) + 1
  const layerSize = Math.floor(size / numLayers)
  
  // Add edges within layers (high capacity)
  for (let layer = 0; layer < numLayers; layer++) {
    const start = layer * layerSize
    const end = Math.min(start + layerSize, size)
    
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.6) {
          const weight = Math.floor(Math.random() * 8) + 3 // High capacity within layer
          const nodeI = String(i)
          const nodeJ = String(j)
          
          graph.get(nodeI)?.set(nodeJ, weight)
          graph.get(nodeJ)?.set(nodeI, weight)
        }
      }
    }
  }
  
  // Add inter-layer edges (lower capacity, creates bottlenecks)
  for (let layer = 0; layer < numLayers - 1; layer++) {
    const currentStart = layer * layerSize
    const currentEnd = Math.min(currentStart + layerSize, size)
    const nextStart = (layer + 1) * layerSize
    const nextEnd = Math.min(nextStart + layerSize, size)
    
    // Create bottleneck between layers
    for (let i = currentStart; i < currentEnd; i++) {
      for (let j = nextStart; j < nextEnd; j++) {
        if (Math.random() < 0.3) {
          const weight = Math.floor(Math.random() * 3) + 1 // Low capacity between layers
          const nodeI = String(i)
          const nodeJ = String(j)
          
          graph.get(nodeI)?.set(nodeJ, weight)
          graph.get(nodeJ)?.set(nodeI, weight)
        }
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
      sizes: [20, 30, 50], // Min-cut algorithms can be expensive
      iterations: 3
    },
    comprehensive: {
      testType: 'comprehensive' as const,
      platform: 'node' as const,
      sizes: [20, 30, 50, 80], // Some min-cut algorithms are O(V³)
      iterations: 2
    }
  }
  
  const config = isQuick ? configs.quick : configs.comprehensive
  
  config.sizes.forEach(size => {
    const graph = createAdjacencyMapGraph(size)
    const edgeCount = countEdges(graph)
    
    globalTestData.set(`mincut-${size}`, {
      graph,
      size,
      edges: edgeCount,
      graphType: 'flow-network',
      algorithm: 'Min-Cut'
    })
    
    console.log(`📊 Created flow network graph: ${size} nodes, ${edgeCount} edges`)
  })
  
  return config
}

function runBenchmarks(config: ReturnType<typeof createTestGraphs>) {
  const suite = new Benchmark.Suite()
  const results: BenchmarkResult[] = []

  config.sizes.forEach(size => {
    const testData = globalTestData.get(`mincut-${size}`)
    if (!testData) return

    // Test S-T Min Cut (using Ford-Fulkerson)
    const testName1 = `Min S-T Cut - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName1, () => {
      // Use first and last nodes as source and sink
      const source = '0'
      const sink = String(size - 1)
      minSTCut(testData.graph, source, sink)
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        const source = '0'
        const sink = String(size - 1)
        minSTCut(testData.graph, source, sink)
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: 'Min S-T Cut',
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Flow Network Graph',
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

    // Test Stoer-Wagner Global Min Cut
    const testName2 = `Stoer-Wagner Global Min Cut - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName2, () => {
      stoerWagner(testData.graph)
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        stoerWagner(testData.graph)
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: 'Stoer-Wagner Global Min Cut',
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Flow Network Graph',
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

    // Test Karger's Randomized Min Cut (with limited iterations for benchmarking)
    if (size <= 50) { // Only test Karger on smaller graphs due to its randomized nature
      const testName3 = `Karger Min Cut - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
      
      suite.add(testName3, () => {
        kargerMinCut(testData.graph, 20) // Limited iterations for benchmark consistency
      }, {
        onComplete: (event: Benchmark.Event) => {
          const benchmark = event.target as Benchmark
          const hz = benchmark.hz || 0
          const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
          
          // Memory measurement
          const beforeMemory = process.memoryUsage()
          kargerMinCut(testData.graph, 20)
          const afterMemory = process.memoryUsage()
          const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

          const result: BenchmarkResult = {
            algorithm: 'Karger Min Cut',
            graphType: testData.graphType,
            graphGenerationAlgorithm: 'Flow Network Graph',
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
          console.log(`✅ ${testName3}: ${hz.toFixed(2)} ops/sec (±${stats.rme.toFixed(2)}%)`)
        }
      })
    }
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
  console.log('🚀 Starting Min-Cut Algorithms Benchmark...')
  
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const mode = isQuick ? 'quick' : 'comprehensive'
  
  console.log(`📊 Running ${mode} benchmark suite for Min-Cut algorithms`)
  
  // Initialize benchmark session
  initBenchmarkSession(mode)
  
  // Create test graphs
  const config = createTestGraphs(isQuick)
  
  console.log('\n⚡ Running benchmarks...\n')
  
  // Run benchmarks
  const results = await runBenchmarks(config)
  
  // Save results
  saveBenchmarkResult(results)
  
  console.log(`\n✨ Min-Cut benchmark completed! Tested ${results.length} configurations.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}