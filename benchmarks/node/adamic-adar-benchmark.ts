#!/usr/bin/env tsx

// Adamic-Adar Link Prediction Benchmark
import Benchmark from 'benchmark'
import { Graph } from '../../src/core/graph.js'
import { adamicAdarPrediction } from '../../src/link-prediction/adamic-adar.js'
import { saveBenchmarkResult, initBenchmarkSession } from '../utils/benchmark-result.js'
import { BenchmarkResult } from '../benchmark-result.js'

// Make adamicAdarPrediction available globally for Benchmark.js
;(globalThis as any).adamicAdarPrediction = adamicAdarPrediction

// Store test data globally for Benchmark.js
const globalTestData = new Map()

function createTestGraphs(isQuick: boolean) {
  const configs = {
    quick: {
      testType: 'quick' as const,
      platform: 'node' as const,
      sizes: [50, 100, 200], // Link prediction scales well
      iterations: 5
    },
    comprehensive: {
      testType: 'comprehensive' as const,
      platform: 'node' as const,
      sizes: [50, 100, 200, 500], // Can handle larger graphs
      iterations: 3
    }
  }
  
  const config = isQuick ? configs.quick : configs.comprehensive
  
  config.sizes.forEach(size => {
    // Create social network-like graph for link prediction
    const graph = new Graph({ directed: false })
    
    // Add nodes
    for (let i = 0; i < size; i++) {
      graph.addNode(i)
    }
    
    // Create scale-free network structure (good for link prediction testing)
    const m = Math.max(2, Math.floor(Math.log2(size))) // Edges per new node
    
    // Start with complete graph of m+1 nodes
    for (let i = 0; i <= m; i++) {
      for (let j = i + 1; j <= m; j++) {
        graph.addEdge(i, j)
      }
    }
    
    // Add remaining nodes using preferential attachment
    for (let i = m + 1; i < size; i++) {
      const degrees = new Map<number, number>()
      let totalDegree = 0
      
      // Calculate degrees
      for (let j = 0; j < i; j++) {
        const degree = graph.degree(j)
        degrees.set(j, degree)
        totalDegree += degree
      }
      
      // Add m edges using preferential attachment
      const connected = new Set<number>()
      for (let k = 0; k < m && connected.size < i; k++) {
        let target = -1
        let attempts = 0
        
        // Preferential attachment with fallback to random
        while (target === -1 && attempts < 10) {
          if (totalDegree > 0) {
            let rand = Math.random() * totalDegree
            for (let j = 0; j < i; j++) {
              if (!connected.has(j)) {
                const degree = degrees.get(j) || 0
                rand -= degree
                if (rand <= 0) {
                  target = j
                  break
                }
              }
            }
          }
          
          if (target === -1) {
            // Fallback to random unconnected node
            const available = []
            for (let j = 0; j < i; j++) {
              if (!connected.has(j)) available.push(j)
            }
            if (available.length > 0) {
              target = available[Math.floor(Math.random() * available.length)]
            }
          }
          attempts++
        }
        
        if (target !== -1) {
          graph.addEdge(i, target)
          connected.add(target)
        }
      }
    }
    
    const edgeCount = Array.from(graph.edges()).length
    
    globalTestData.set(`adamic-adar-${size}`, {
      graph,
      size,
      edges: edgeCount,
      graphType: 'scale-free',
      algorithm: 'Adamic-Adar'
    })
    
    console.log(`📊 Created scale-free graph: ${size} nodes, ${edgeCount} edges`)
  })
  
  return config
}

function runBenchmarks(config: ReturnType<typeof createTestGraphs>) {
  const suite = new Benchmark.Suite()
  const results: BenchmarkResult[] = []

  config.sizes.forEach(size => {
    const testData = globalTestData.get(`adamic-adar-${size}`)
    if (!testData) return

    const testName = `Adamic-Adar Link Prediction - ${testData.graphType} (${size} nodes, ${testData.edges} edges)`
    
    suite.add(testName, () => {
      // Run Adamic-Adar prediction for a sample of node pairs
      const sampleSize = Math.min(100, size * (size - 1) / 2)
      adamicAdarPrediction(testData.graph, { 
        directed: false,
        topK: Math.min(50, sampleSize)
      })
    }, {
      onComplete: (event: Benchmark.Event) => {
        const benchmark = event.target as Benchmark
        const hz = benchmark.hz || 0
        const stats = benchmark.stats || { mean: 0, moe: 0, rme: 0, sem: 0, deviation: 0, variance: 0, sample: [] }
        
        // Memory measurement
        const beforeMemory = process.memoryUsage()
        const sampleSize = Math.min(100, size * (size - 1) / 2)
        adamicAdarPrediction(testData.graph, { 
          directed: false,
          topK: Math.min(50, sampleSize)
        })
        const afterMemory = process.memoryUsage()
        const memoryUsed = afterMemory.heapUsed - beforeMemory.heapUsed

        const result: BenchmarkResult = {
          algorithm: testData.algorithm,
          graphType: testData.graphType,
          graphGenerationAlgorithm: 'Scale-Free Network',
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
  console.log('🚀 Starting Adamic-Adar Link Prediction Benchmark...')
  
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const mode = isQuick ? 'quick' : 'comprehensive'
  
  console.log(`📊 Running ${mode} benchmark suite for Adamic-Adar`)
  
  // Initialize benchmark session
  initBenchmarkSession(mode)
  
  // Create test graphs
  const config = createTestGraphs(isQuick)
  
  console.log('\n⚡ Running benchmarks...\n')
  
  // Run benchmarks
  const results = await runBenchmarks(config)
  
  // Save results
  saveBenchmarkResult(results)
  
  console.log(`\n✨ Adamic-Adar benchmark completed! Tested ${results.length} configurations.`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}