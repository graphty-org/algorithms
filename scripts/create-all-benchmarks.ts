#!/usr/bin/env tsx

import { writeFileSync } from 'fs'
import { join } from 'path'

// Template for creating benchmarks
const createBenchmarkTemplate = (
  algorithmName: string,
  importPath: string,
  functionName: string,
  complexity: string,
  sizes: { quick: number[], comprehensive: number[] },
  options: {
    needsWeights?: boolean
    needsDirected?: boolean
    graphTypes?: string[]
    extraParams?: string
    resultCheck?: string
    minIterations?: { quick: number, comprehensive: number }
    additionalInfo?: string
  } = {}
) => {
  const {
    needsWeights = false,
    needsDirected = false,
    graphTypes = ['sparse'],
    extraParams = '',
    resultCheck = 'if (!result) { throw new Error(\'' + algorithmName + ' returned empty result\') }',
    minIterations = { quick: 10, comprehensive: 20 },
    additionalInfo = ''
  } = options

  const filename = algorithmName.toLowerCase().replace(/[^a-z0-9]/g, '-')

  return `#!/usr/bin/env tsx

// Node.js ${algorithmName} Performance Benchmark using Benchmark.js
import { CrossPlatformBenchmark } from '../utils/benchmark-runner'
import { generateTestGraphs } from '../utils/test-data-generator'
import { convertToLibraryGraph } from '../utils/graph-adapter'
import { ${functionName} } from '${importPath}'
import { saveBenchmarkSession } from '../utils/benchmark-result'
import { formatSystemInfo, getSystemInfo } from '../utils/system-info'

// Configuration for Node.js benchmarks
// ${algorithmName} complexity: ${complexity}
const configs = {
  quick: {
    testType: 'quick' as const,
    platform: 'node' as const,
    sizes: [${sizes.quick.join(', ')}],
    iterations: ${minIterations.quick}
  },
  comprehensive: {
    testType: 'comprehensive' as const,
    platform: 'node' as const,
    sizes: [${sizes.comprehensive.join(', ')}],
    iterations: ${minIterations.comprehensive}
  }
}

async function run${algorithmName.replace(/[^a-zA-Z0-9]/g, '')}Benchmark(configType: 'quick' | 'comprehensive') {
  console.log(\`🚀 Running \${configType} ${algorithmName} benchmarks in Node.js\`)
  console.log('=' + '='.repeat(50))
  console.log(formatSystemInfo(getSystemInfo()))
  console.log('')
  ${additionalInfo ? `console.log('${additionalInfo}')\n  console.log('')` : ''}

  const config = configs[configType]
  const benchmark = new CrossPlatformBenchmark(config, \`${algorithmName} \${configType} Performance\`)

  // Pre-generate test graphs to avoid memory issues
  console.log('Pre-generating test graphs...')
  const testGraphs = new Map()
  
  for (const size of config.sizes) {
    ${graphTypes.map(graphType => `
    try {
      console.log(\`  Generating \${size} vertex ${graphType} graph...\`)
      const benchmarkGraph = generateTestGraphs.${graphType}(size)
      ${needsWeights ? `
      // Add weights to edges
      benchmarkGraph.edges = benchmarkGraph.edges.map(([from, to]) => {
        const weight = Math.floor(Math.random() * 100) + 1 // 1 to 100
        return [from, to, weight]
      })
      benchmarkGraph.weighted = true
      ` : ''}
      ${needsDirected ? `benchmarkGraph.directed = true` : ''}
      
      const graph = convertToLibraryGraph(benchmarkGraph)
      
      testGraphs.set(\`${graphType}-\${size}\`, {
        graph,
        metadata: benchmarkGraph.metadata,
        edges: benchmarkGraph.edges.length,
        algorithm: '${algorithmName}',
        graphType: '${graphType}',
        graphSize: size,
        graphGenerationAlgorithm: benchmarkGraph.metadata?.generationAlgorithm
      })
      
      console.log(\`    ✓ \${size} vertices, \${benchmarkGraph.edges.length} edges${needsWeights ? ' (weighted)' : ''}\`)
    } catch (error) {
      console.error(\`    ✗ Failed to generate \${size} vertex graph:\`, error)
    }`).join('')}
  }

  // Add benchmark tests
  console.log('\\nAdding benchmark tests...')
  for (const [key, testData] of testGraphs.entries()) {
    benchmark.addTest(
      \`${algorithmName} \${testData.graphSize} vertices (\${testData.graphType})\`,
      () => {
        const result = ${functionName}(testData.graph${extraParams})
        // Verify result to prevent dead code elimination
        ${resultCheck}
      },
      testData,
      {
        minSamples: config.iterations,
        initCount: 1,
        minTime: 0.1
      }
    )
  }

  // Run benchmarks
  console.log(\`\\nRunning \${configType} benchmarks...\\n\`)
  
  try {
    const session = await benchmark.run()
    
    // Display summary
    console.log('\\n' + '='.repeat(60))
    console.log('BENCHMARK RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log('Size\\tType\\tTime(ms)\\tOps/sec\\tComplexity\\tMargin')
    console.log('-'.repeat(60))
    
    session.results.forEach(result => {
      const complexity = \`${complexity}\`
      const margin = result.metrics?.marginOfError || 0
      console.log(
        \`\${result.graphSize}\\t\${result.graphType}\\t\${result.executionTime.toFixed(2)}\\t\\t\${result.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}\\t\${complexity}\\t±\${margin.toFixed(1)}%\`
      )
    })
    
    // Save results
    const filename = await saveBenchmarkSession(session)
    console.log(\`\\n✅ Results saved to \${filename}\`)
    
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
    await run${algorithmName.replace(/[^a-zA-Z0-9]/g, '')}Benchmark(configType)
  } catch (error) {
    console.error('Benchmark execution failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  main()
}`
}

// Define all remaining algorithms to benchmark
const algorithms = [
  // Remaining Centrality algorithms
  {
    name: 'Eigenvector Centrality',
    import: '../../src/algorithms/centrality/eigenvector',
    function: 'eigenvectorCentrality',
    complexity: 'O(V*E*iterations)',
    sizes: { quick: [50, 100, 200], comprehensive: [50, 100, 200, 500, 1000] },
    options: { minIterations: { quick: 5, comprehensive: 10 } }
  },
  {
    name: 'HITS',
    import: '../../src/algorithms/centrality/hits',
    function: 'hits',
    complexity: 'O(V*E*iterations)',
    sizes: { quick: [100, 500, 1000], comprehensive: [100, 500, 1000, 5000, 10000] }
  },
  {
    name: 'Katz Centrality',
    import: '../../src/algorithms/centrality/katz',
    function: 'katzCentrality',
    complexity: 'O(V*E*iterations)',
    sizes: { quick: [100, 500, 1000], comprehensive: [100, 500, 1000, 5000] },
    options: { 
      extraParams: ', { alpha: 0.1, beta: 1.0 }',
      resultCheck: 'if (!result || Object.keys(result).length === 0) { throw new Error(\'Katz Centrality returned empty result\') }'
    }
  },
  
  // MST algorithms
  {
    name: "Prim's MST",
    import: '../../src/algorithms/mst/prim',
    function: 'prim',
    complexity: 'O(E log V)',
    sizes: { quick: [100, 500, 1000], comprehensive: [100, 500, 1000, 5000, 10000] },
    options: { 
      needsWeights: true,
      resultCheck: 'if (!result.edges || result.edges.length === 0) { throw new Error("Prim\'s returned empty MST") }'
    }
  },
  
  // Flow algorithms
  {
    name: 'Ford-Fulkerson',
    import: '../../src/flow/ford-fulkerson',
    function: 'fordFulkerson',
    complexity: 'O(E*max_flow)',
    sizes: { quick: [50, 100, 200], comprehensive: [50, 100, 200, 500] },
    options: { 
      needsWeights: true,
      needsDirected: true,
      extraParams: ', 0, testData.graphSize - 1', // source to sink
      resultCheck: 'if (result.maxFlow === undefined) { throw new Error("Ford-Fulkerson returned invalid result") }',
      additionalInfo: '⚠️  Note: Ford-Fulkerson requires directed weighted graphs'
    }
  },
  
  // Link Prediction
  {
    name: 'Common Neighbors',
    import: '../../src/link-prediction/common-neighbors',
    function: 'commonNeighbors',
    complexity: 'O(V²*avg_degree)',
    sizes: { quick: [50, 100, 200], comprehensive: [50, 100, 200, 500, 1000] },
    options: {
      resultCheck: 'if (!result || result.length === 0) { throw new Error("Common Neighbors returned empty result") }'
    }
  },
  
  // Pathfinding
  {
    name: 'A* Pathfinding',
    import: '../../src/pathfinding/astar',
    function: 'astar',
    complexity: 'O(E)',
    sizes: { quick: [100, 400, 900], comprehensive: [100, 400, 900, 2500, 10000] },
    options: {
      graphTypes: ['grid'],
      needsWeights: true,
      extraParams: ', 0, testData.graphSize - 1, () => 1', // Simple heuristic
      resultCheck: 'if (!result || !result.path) { throw new Error("A* returned invalid result") }'
    }
  },
  
  // Community Detection
  {
    name: 'Label Propagation',
    import: '../../src/algorithms/community/label-propagation',
    function: 'labelPropagation',
    complexity: 'O(V*E*iterations)',
    sizes: { quick: [100, 500, 1000], comprehensive: [100, 500, 1000, 5000] },
    options: {
      graphTypes: ['smallWorld', 'rmat'],
      resultCheck: 'if (!result || Object.keys(result).length === 0) { throw new Error("Label Propagation returned empty result") }'
    }
  },
  
  // Clustering
  {
    name: 'Spectral Clustering',
    import: '../../src/clustering/spectral',
    function: 'spectralClustering',
    complexity: 'O(V³)',
    sizes: { quick: [20, 50, 100], comprehensive: [20, 50, 100, 200] },
    options: {
      extraParams: ', 3', // k=3 clusters
      resultCheck: 'if (!result || !result.clusters) { throw new Error("Spectral Clustering returned invalid result") }',
      minIterations: { quick: 5, comprehensive: 10 },
      additionalInfo: '⚠️  Note: Spectral Clustering has O(V³) complexity due to eigenvalue computation'
    }
  }
]

// Generate all benchmark files
console.log('🚀 Generating benchmark files for remaining algorithms...\n')

algorithms.forEach(algo => {
  const filename = algo.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-benchmark.ts'
  const filepath = join(process.cwd(), 'benchmarks', 'node', filename)
  const content = createBenchmarkTemplate(
    algo.name,
    algo.import,
    algo.function,
    algo.complexity,
    algo.sizes,
    algo.options
  )
  
  writeFileSync(filepath, content)
  console.log(`✅ Created ${filename}`)
})

console.log('\n📝 Benchmark files generated successfully!')
console.log('\nDon\'t forget to update package.json with the new benchmark scripts!')