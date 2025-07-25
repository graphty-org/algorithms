#!/usr/bin/env tsx

// Girvan-Newman Community Detection Benchmark
import Benchmark from 'benchmark'
import { Graph } from '../../src/core/graph.js'
import { girvanNewman } from '../../src/algorithms/community/girvan-newman.js'
import { generateGraph } from '../utils/graph-generator.js'
import { saveBenchmarkResult, initBenchmarkSession } from '../utils/benchmark-result.js'
import { BenchmarkResult } from '../benchmark-result.js'

// Make girvanNewman available globally for Benchmark.js
;(globalThis as any).girvanNewman = girvanNewman

// Store test data globally for Benchmark.js
const globalTestData = new Map()

function createTestGraphs(isQuick: boolean) {
  const configs = {
    quick: {
      testType: 'quick' as const,
      platform: 'node' as const,
      sizes: [20, 50, 100], // Small graphs for O(V³) community detection
      iterations: 5
    },
    comprehensive: {
      testType: 'comprehensive' as const,
      platform: 'node' as const,
      sizes: [20, 50, 100, 200], // Community detection is computationally expensive
      iterations: 3
    }
  }
  
  const config = isQuick ? configs.quick : configs.comprehensive
  const results: BenchmarkResult[] = []
  
  config.sizes.forEach(size => {
    // Create community-structured graph (better for community detection testing)
    const numCommunities = Math.max(2, Math.floor(size / 10))
    const communitySize = Math.floor(size / numCommunities)
    
    const graph = new Graph({ directed: false })
    
    // Add nodes
    for (let i = 0; i < size; i++) {
      graph.addNode(i)
    }
    
    // Add intra-community edges (higher density)
    for (let community = 0; community < numCommunities; community++) {
      const start = community * communitySize
      const end = Math.min(start + communitySize, size)
      
      // Dense connections within community
      for (let i = start; i < end; i++) {
        for (let j = i + 1; j < end; j++) {
          if (Math.random() < 0.6) { // High intra-community edge probability
            graph.addEdge(i, j)
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
          graph.addEdge(i, j)
        }
      }
    }
    
    const edgeCount = Array.from(graph.edges()).length
    
    globalTestData.set(`community-${size}`, {
      graph,
      size,
      edges: edgeCount,
      graphType: 'community-structured',
      algorithm: 'Girvan-Newman'
    })
    
    console.log(`📊 Created community-structured graph: ${size} nodes, ${edgeCount} edges`)
  })
  
  return config
}

function runBenchmarks(config: ReturnType<typeof createTestGraphs>) {
  const suite = new Benchmark.Suite()
  const results: BenchmarkResult[] = []

  config.sizes.forEach(size => {
    const testData = globalTestData.get(`community-${size}`)
    if (!testData) return

    const testName = `Girvan-Newman Community Detection - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName, () => {
      // Run Girvan-Newman with limited communities to prevent excessive computation
      girvanNewman(testData.graph, { maxCommunities: Math.min(10, Math.floor(size / 5)) })
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        girvanNewman(testData.graph, { maxCommunities: Math.min(10, Math.floor(size / 5)) })
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
  console.log('🚀 Starting Girvan-Newman Community Detection Benchmark...')
  
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const mode = isQuick ? 'quick' : 'comprehensive'
  
  console.log(`📊 Running ${mode} benchmark suite for Girvan-Newman`)
  
  // Initialize benchmark session
  initBenchmarkSession(mode)
  
  // Create test graphs
  const config = createTestGraphs(isQuick)
  
  console.log('\n⚡ Running benchmarks...\n')
  
  // Run benchmarks
  const results = await runBenchmarks(config)
  
  // Save results
  saveBenchmarkResult(results)
  
  console.log(`\n✨ Girvan-Newman benchmark completed! Tested ${results.length} configurations.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}