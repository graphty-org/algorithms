#!/usr/bin/env tsx

// Unified Benchmark Runner - Runs all algorithm benchmarks concurrently
import { Worker } from 'worker_threads'
import { cpus } from 'os'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { getSystemInfo, formatSystemInfo } from './utils/system-info'
import type { BenchmarkSession, BenchmarkResult } from './utils/benchmark-types'

const __dirname = dirname(fileURLToPath(import.meta.url))

// List of all working algorithm benchmarks
const algorithms = [
  { name: 'BFS', file: 'bfs-benchmark.ts' },
  { name: 'DFS', file: 'dfs-benchmark.ts' },
  { name: 'Dijkstra', file: 'dijkstra-benchmark.ts' },
  { name: 'PageRank', file: 'pagerank-benchmark.ts' },
  { name: 'Bellman-Ford', file: 'bellman-ford-benchmark.ts' },
  { name: 'Floyd-Warshall', file: 'floyd-warshall-benchmark.ts' },
  { name: 'Degree Centrality', file: 'degree-centrality-benchmark.ts' },
  { name: 'Betweenness Centrality', file: 'betweenness-centrality-benchmark.ts' },
  { name: 'Closeness Centrality', file: 'closeness-centrality-benchmark.ts' },
  { name: 'Eigenvector Centrality', file: 'eigenvector-centrality-benchmark.ts' },
  { name: 'HITS', file: 'hits-benchmark.ts' },
  { name: 'Katz Centrality', file: 'katz-centrality-benchmark.ts' },
  { name: 'Connected Components', file: 'connected-components-benchmark.ts' },
  { name: 'Kruskal MST', file: 'kruskal-benchmark.ts' },
  { name: 'K-Core', file: 'k-core-benchmark.ts' },
  { name: 'Common Neighbors', file: 'common-neighbors-benchmark.ts' },
  { name: 'Bipartite Matching', file: 'bipartite-matching-benchmark.ts' },
  { name: 'Girvan-Newman', file: 'girvan-newman-benchmark.ts' },
  { name: 'Leiden', file: 'leiden-benchmark.ts' },
  { name: 'Hierarchical Clustering', file: 'hierarchical-clustering-benchmark.ts' },
  { name: 'MCL', file: 'mcl-benchmark.ts' },
  { name: 'Min-Cut', file: 'min-cut-benchmark.ts' },
  { name: 'Adamic-Adar', file: 'adamic-adar-benchmark.ts' }
]

interface WorkerResult {
  algorithm: string
  results: BenchmarkResult[]
  error?: string
}

function runBenchmarkInWorker(algorithm: { name: string; file: string }, isQuick: boolean): Promise<WorkerResult> {
  return new Promise((resolve, reject) => {
    const workerPath = join(__dirname, 'worker-benchmark.js')
    const worker = new Worker(workerPath, {
      workerData: {
        algorithm,
        isQuick,
        benchmarkPath: join(__dirname, 'node', algorithm.file)
      }
    })

    worker.on('message', (result: WorkerResult) => {
      resolve(result)
    })

    worker.on('error', (error) => {
      resolve({
        algorithm: algorithm.name,
        results: [],
        error: error.message
      })
    })

    worker.on('exit', (code) => {
      if (code !== 0) {
        resolve({
          algorithm: algorithm.name,
          results: [],
          error: `Worker stopped with exit code ${code}`
        })
      }
    })
  })
}

async function runUnifiedBenchmarks(isQuick: boolean): Promise<void> {
  const mode = isQuick ? 'quick' : 'comprehensive'
  const startTime = Date.now()
  
  console.log(`🚀 Running unified ${mode} benchmarks for all algorithms...`)
  console.log('=' + '='.repeat(60))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  console.log(`📊 Algorithms to benchmark: ${algorithms.length}`)
  console.log(`🖥️  CPU cores available: ${cpus().length}`)
  console.log(`⚡ Running benchmarks in parallel...\n`)

  // Run benchmarks in parallel with a limit based on CPU cores
  const maxConcurrent = Math.min(cpus().length, algorithms.length)
  const results: BenchmarkResult[] = []
  const errors: { algorithm: string; error: string }[] = []

  // Process algorithms in chunks
  for (let i = 0; i < algorithms.length; i += maxConcurrent) {
    const chunk = algorithms.slice(i, i + maxConcurrent)
    const promises = chunk.map(algo => runBenchmarkInWorker(algo, isQuick))
    
    console.log(`Processing algorithms ${i + 1}-${Math.min(i + chunk.length, algorithms.length)} of ${algorithms.length}...`)
    
    const chunkResults = await Promise.all(promises)
    
    for (const result of chunkResults) {
      if (result.error) {
        console.log(`❌ ${result.algorithm}: Failed - ${result.error}`)
        errors.push({ algorithm: result.algorithm, error: result.error })
      } else {
        console.log(`✅ ${result.algorithm}: ${result.results.length} benchmarks completed`)
        results.push(...result.results)
      }
    }
  }

  // Create unified session
  const session: BenchmarkSession = {
    sessionId: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    systemInfo: getSystemInfo(),
    testType: mode,
    results: results
  }

  // Save unified results
  const resultsDir = join(__dirname, '..', 'benchmark-results')
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true })
  }
  const filename = `benchmark-unified-${mode}-${Date.now()}.json`
  const filepath = join(resultsDir, filename)
  writeFileSync(filepath, JSON.stringify(session, null, 2))

  // Summary
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 UNIFIED BENCHMARK SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total algorithms tested: ${algorithms.length}`)
  console.log(`✅ Successful: ${algorithms.length - errors.length}`)
  console.log(`❌ Failed: ${errors.length}`)
  console.log(`📈 Total benchmark results: ${results.length}`)
  console.log(`⏱️  Total time: ${duration} seconds`)
  console.log(`📁 Results saved to: ${filename}`)
  
  if (errors.length > 0) {
    console.log('\nFailed algorithms:')
    errors.forEach(e => console.log(`  - ${e.algorithm}: ${e.error}`))
  }

  // Generate report
  console.log('\n📈 Generating performance report...')
  try {
    const { execSync } = await import('child_process')
    execSync('npm run benchmark:report', { stdio: 'inherit' })
    console.log('✅ Report generated successfully')
  } catch (error) {
    console.error('❌ Failed to generate report')
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  
  try {
    await runUnifiedBenchmarks(isQuick)
  } catch (error) {
    console.error('Unified benchmark execution failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}