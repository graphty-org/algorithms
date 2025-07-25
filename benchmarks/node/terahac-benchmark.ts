#!/usr/bin/env tsx

// Node.js TeraHAC (Hierarchical Agglomerative Clustering) Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { teraHAC } from '../../src/research/terahac'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200], // TeraHAC is designed for large graphs but test on smaller ones
    iterations: 5
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [50, 100, 200, 500, 1000],
    iterations: 10
  }
}

// Generate test graphs suitable for hierarchical clustering
function generateHierarchicalGraph(size: number) {
  // Create a graph with hierarchical structure (multiple levels of clusters)
  const topLevelClusters = Math.max(2, Math.floor(Math.sqrt(size / 10)))
  const midLevelClusters = topLevelClusters * 2
  const leafClusters = midLevelClusters * 2
  
  const edges: Array<[number, number]> = []
  const adjacencyList: Record<number, number[]> = {}
  
  // Initialize adjacency list
  for (let i = 0; i < size; i++) {
    adjacencyList[i] = []
  }
  
  // Assign nodes to leaf clusters
  const leafClusterSize = Math.floor(size / leafClusters)
  
  // Create tight connections within leaf clusters (90% probability)
  for (let cluster = 0; cluster < leafClusters; cluster++) {
    const start = cluster * leafClusterSize
    const end = Math.min((cluster + 1) * leafClusterSize, size)
    
    for (let i = start; i < end; i++) {
      for (let j = i + 1; j < end; j++) {
        if (Math.random() < 0.9) {
          edges.push([i, j])
          adjacencyList[i].push(j)
          adjacencyList[j].push(i)
        }
      }
    }
  }
  
  // Connect leaf clusters within mid-level clusters (40% probability)
  for (let midCluster = 0; midCluster < midLevelClusters; midCluster++) {
    const leafStart = midCluster * 2
    const leafEnd = Math.min(leafStart + 2, leafClusters)
    
    for (let leaf1 = leafStart; leaf1 < leafEnd; leaf1++) {
      for (let leaf2 = leaf1 + 1; leaf2 < leafEnd; leaf2++) {
        const start1 = leaf1 * leafClusterSize
        const end1 = Math.min((leaf1 + 1) * leafClusterSize, size)
        const start2 = leaf2 * leafClusterSize
        const end2 = Math.min((leaf2 + 1) * leafClusterSize, size)
        
        for (let i = start1; i < end1; i++) {
          for (let j = start2; j < end2; j++) {
            if (Math.random() < 0.4) {
              edges.push([i, j])
              adjacencyList[i].push(j)
              adjacencyList[j].push(i)
            }
          }
        }
      }
    }
  }
  
  // Connect mid-level clusters within top-level clusters (15% probability)
  for (let topCluster = 0; topCluster < topLevelClusters; topCluster++) {
    const midStart = topCluster * 2
    const midEnd = Math.min(midStart + 2, midLevelClusters)
    
    for (let mid1 = midStart; mid1 < midEnd; mid1++) {
      for (let mid2 = mid1 + 1; mid2 < midEnd; mid2++) {
        // Connect some nodes between these mid-level clusters
        const leaf1Start = mid1 * 2
        const leaf1End = Math.min(leaf1Start + 2, leafClusters)
        const leaf2Start = mid2 * 2
        const leaf2End = Math.min(leaf2Start + 2, leafClusters)
        
        for (let leaf1 = leaf1Start; leaf1 < leaf1End; leaf1++) {
          for (let leaf2 = leaf2Start; leaf2 < leaf2End; leaf2++) {
            const start1 = leaf1 * leafClusterSize
            const end1 = Math.min((leaf1 + 1) * leafClusterSize, size)
            const start2 = leaf2 * leafClusterSize
            const end2 = Math.min((leaf2 + 1) * leafClusterSize, size)
            
            for (let i = start1; i < end1; i++) {
              for (let j = start2; j < end2; j++) {
                if (Math.random() < 0.15) {
                  edges.push([i, j])
                  adjacencyList[i].push(j)
                  adjacencyList[j].push(i)
                }
              }
            }
          }
        }
      }
    }
  }
  
  return {
    vertices: Array.from({ length: size }, (_, i) => i),
    edges,
    adjacencyList,
    metadata: {
      generationAlgorithm: 'Hierarchical Graph',
      parameters: {
        vertices: size,
        edges: edges.length,
        topLevelClusters,
        midLevelClusters,
        leafClusters,
        avgDegree: (edges.length * 2) / size,
        leafClusterDensity: 0.9,
        midClusterDensity: 0.4,
        topClusterDensity: 0.15
      }
    },
    directed: false,
    weighted: false
  }
}

async function runTeraHACBenchmark(configType: 'quick' | 'comprehensive') {
  console.log(`🚀 Running ${configType} TeraHAC benchmarks in Node.js`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, `TeraHAC ${configType} Performance`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating hierarchical test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    try {
      console.log(`  Generating ${size} vertex hierarchical graph...`)
      const benchmarkGraph = generateHierarchicalGraph(size)
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(`hierarchical-${size}`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: 'TeraHAC',
        graphType: 'hierarchical',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(`    ✓ ${size} vertices, ${benchmarkGraph.edges.length} edges`)
    } catch (error) {
      console.error(`    ✗ Failed to generate ${size} vertex graph:`, error)
    }
  }

  // Test different linkage criteria
  const linkageCriteria = ['single', 'complete', 'average', 'ward'] as const
  
  // Add benchmark tests for each linkage criterion
  console.log('\nAdding benchmark tests...')
  for (const size of config.sizes) {
    const testKey = `hierarchical-${size}`
    if (testGraphs.has(testKey)) {
      const testData = testGraphs.get(testKey)
      
      for (const linkage of linkageCriteria) {
        benchmark.addTest(
          `TeraHAC ${size} vertices (${linkage})`,
          () => {
            const result = teraHAC(testData.graph, {
              linkageCriterion: linkage,
              maxClusters: Math.max(2, Math.floor(size / 10)),
              minClusterSize: 2,
              useApproximation: size > 200, // Use approximation for larger graphs
              seed: 42
            })
            // Verify result to prevent dead code elimination
            if (!result.dendrogram || result.clusters.size === 0) {
              throw new Error('TeraHAC returned invalid result')
            }
          },
          { ...testData, linkage },
          {
            minSamples: config.iterations,
            initCount: 1,
            minTime: 0.2
          }
        )
      }
    }
  }

  // Run benchmarks
  console.log(`\nRunning ${configType} benchmarks...\n`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\n' + '='.repeat(85))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(85))
    console.log('Size\tLinkage\t\tEdges\tTime(ms)\tOps/sec\tClusters\tHeight\t\tMargin')
    console.log('-'.repeat(85))
    
    session.results.forEach(result => {
      const margin = result.metrics?.marginOfError || 0
      
      // Run once more to get clustering results
      const testData = testGraphs.get(`${result.graphType}-${result.graphSize}`)
      let numClusters = 'N/A'
      let treeHeight = 'N/A'
      const linkage = (result as any).linkage || 'unknown'
      
      if (testData) {
        try {
          const clusterResult = teraHAC(testData.graph, {
            linkageCriterion: linkage,
            maxClusters: Math.max(2, Math.floor(result.graphSize / 10)),
            minClusterSize: 2,
            useApproximation: result.graphSize > 200,
            seed: 42
          })
          numClusters = clusterResult.numClusters.toString()
          treeHeight = clusterResult.treeHeight.toFixed(3)
        } catch (e) {}
      }
      
      console.log(
        `${result.graphSize}\t${linkage.padEnd(8)}\t${result.edges}\t${result.executionTime.toFixed(2)}\t\t${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\t${numClusters}\t\t${treeHeight}\t±${margin.toFixed(1)}%`
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
    await runTeraHACBenchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}