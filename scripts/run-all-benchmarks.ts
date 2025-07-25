#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

// List of all working benchmarks in order
const benchmarks = [
  'bfs',
  'dfs',
  'dijkstra',
  'pagerank',
  'bellman-ford',
  'floyd-warshall',
  'degree-centrality',
  'betweenness-centrality',
  'closeness-centrality',
  'eigenvector-centrality',
  'hits',
  'katz-centrality',
  'connected-components',
  'kruskal',
  'k-core',
  'common-neighbors',
  'bipartite-matching'
]

async function runBenchmarks(isQuick: boolean) {
  const mode = isQuick ? 'quick' : 'comprehensive'
  console.log(`🚀 Running ${mode} benchmarks for all algorithms...`)
  console.log('=' + '='.repeat(60))
  
  const results = {
    successful: [] as string[],
    failed: [] as string[]
  }
  
  for (const benchmark of benchmarks) {
    console.log(`\n📊 Running ${benchmark} benchmark...`)
    console.log('-'.repeat(60))
    
    try {
      const command = `npm run benchmark:${benchmark} -- ${isQuick ? '--quick' : '--comprehensive'}`
      execSync(command, { 
        stdio: 'inherit',
        encoding: 'utf-8'
      })
      results.successful.push(benchmark)
      console.log(`✅ ${benchmark} completed successfully`)
    } catch (error) {
      results.failed.push(benchmark)
      console.error(`❌ ${benchmark} failed`)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 BENCHMARK SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total algorithms: ${benchmarks.length}`)
  console.log(`✅ Successful: ${results.successful.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  
  if (results.failed.length > 0) {
    console.log('\nFailed benchmarks:')
    results.failed.forEach(b => console.log(`  - ${b}`))
  }
  
  // Generate report
  console.log('\n📈 Generating performance report...')
  try {
    execSync('npm run benchmark:report', { stdio: 'inherit' })
    console.log('✅ Report generated successfully')
  } catch (error) {
    console.error('❌ Failed to generate report')
  }
  
  console.log('\n✨ All benchmarks completed!')
}

// Main execution
const args = process.argv.slice(2)
const isQuick = args.includes('--quick')

runBenchmarks(isQuick).catch(error => {
  console.error('Benchmark execution failed:', error)
  process.exit(1)
})