#!/usr/bin/env tsx

// Node.js PageRank Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { pageRank } from '../../src/algorithms/centrality/pagerank'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'
import { Graph } from '../../src/core/graph'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [100, 300, 500],
    iterations: 5
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [100, 300, 500, 1000, 2000],
    iterations: 10
  }
}

// Convert undirected graph to directed for PageRank
function makeDirected(graph: Graph): Graph {
  const directedGraph = new Graph({ directed: true })
  
  // Add all nodes
  for (const node of graph.nodes()) {
    directedGraph.addNode(node.id)
  }
  
  // Add all edges (convert undirected to directed)
  for (const edge of graph.edges()) {
    directedGraph.addEdge(edge.source, edge.target, edge.weight)
    // For undirected graphs, add both directions
    if (!graph.isDirected) {
      directedGraph.addEdge(edge.target, edge.source, edge.weight)
    }
  }
  
  return directedGraph
}

async function runPageRankBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} PageRank benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `PageRank ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex sparse graph...`)
      const benchmarkGraph = generateTestGraphs.sparse(size)
      
      // PageRank needs directed graphs
      benchmarkGraph.directed = true
      
      const undirectedGraph = convertToLibraryGraph(benchmarkGraph)
      const graph = makeDirected(undirectedGraph)
      
      testGraphs.set(`sparse-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'PageRank',
        graphType: 'sparse',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (directed)`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Add benchmark tests
  console.log('\nAdding benchmark tests...')
  for (const size of config.sizes) {
    const testKey = `sparse-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      benchmark.addTest(
        `PageRank ${size} vertices (sparse)`,
        () => {
          const result = pageRank(testData.graph, {
            dampingFactor: 0.85,
            tolerance: 1e-4, // Relaxed tolerance for faster convergence
            maxIterations: 50 // Reduced iterations
          })
          // Verify result to prevent dead code elimination
          if (!result || Object.keys(result.ranks).length === 0) {
            throw new Error('PageRank returned invalid result')
          }
        },
        testData,
        {
          minSamples: config.iterations,
          initCount: 1,
          minTime: 0.05 // minimum 50ms per test
        }
      )
    }
  }

  // For comprehensive tests, also add dense, RMAT, and small-world graphs
  if (configType === 'comprehensive') {
    const additionalGraphTypes = [
      { type: 'dense', sizes: config.sizes.filter(s => s <= 1000) }, // Smaller sizes for dense
      { type: 'rmat', sizes: config.sizes }, // RMAT works well for all sizes
      { type: 'smallWorld', sizes: config.sizes } // Small-world works for all sizes
    ]
    
    for (const { type, sizes } of additionalGraphTypes) {
      console.log(`\nGenerating ${type} graphs for comprehensive testing...`)
      
      for (const size of sizes) {
        try {
          console.log(`  Generating ${size} vertex ${type} graph...`)
          const benchmarkGraph = generateTestGraphs[type](size)
          benchmarkGraph.directed = true
          
          const undirectedGraph = convertToLibraryGraph(benchmarkGraph)
          const graph = makeDirected(undirectedGraph)
          
          const testData = {
            graph,
            metadata: benchmarkGraph.metadata,
            edges: benchmarkGraph.edges.length,
            algorithm: 'PageRank',
            graphType: type,
            graphSize: size,
            graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
          }
          
          benchmark.addTest(
            `PageRank ${size} vertices (${type})`,
            () => {
              const result = pageRank(testData.graph, {
                dampingFactor: 0.85,
                tolerance: 1e-4,
                maxIterations: 50
              })
              if (!result || Object.keys(result.ranks).length === 0) {
                throw new Error('PageRank returned invalid result')
              }
            },
            testData,
            {
              minSamples: Math.floor(config.iterations * 0.7), // Adjust iterations based on graph type
              initCount: 1,
              minTime: 0.05
            }
          )
          
          console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges (directed)`)
        } catch (error) {
          console.error(`    ✗ Failed to generate ${type} ${size} vertex graph:`, error)
        }
      }
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(60))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log('Size\tType\tTime(ms)\tOps/sec\tIterations\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const iterations = result.metrics?.iterations || 'N/A'
      const margin = result.metrics?.marginOfError || 0
      console.log(
        `${result.graphSize}\t${result.graphType}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${iterations}\t\t±${margin.toFixed(1)}%`
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
    await runPageRankBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}