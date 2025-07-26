#!/usr/bin/env tsx

// Script to generate HTML performance report from benchmark JSON data
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { loadBenchmarkSessions } from '../benchmarks/utils/benchmark-result'
import { BenchmarkSession } from '../benchmarks/benchmark-result'

// HTML template for the performance report
function generateHTML(sessions: BenchmarkSession[]): string {
  // Get the latest session for summary
  const latestSession = sessions[sessions.length - 1]
  const allResults = sessions.flatMap(s => s.results)
  
  // Group results by algorithm
  const algorithmGroups = new Map<string, typeof allResults>()
  allResults.forEach(result => {
    if (!algorithmGroups.has(result.algorithm)) {
      algorithmGroups.set(result.algorithm, [])
    }
    algorithmGroups.get(result.algorithm)!.push(result)
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graph Algorithm Performance Report</title>
    <link rel="stylesheet" href="../shared/design-system.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script>
    <style>
        /* Page-specific styles */
        .nav {
            background: var(--bg-primary);
            box-shadow: var(--shadow-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-xl);
        }
        
        .nav .container {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .subtitle {
            text-align: center;
            color: var(--text-muted);
            margin-bottom: var(--spacing-xl);
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-2xl);
        }
        
        .summary-card {
            background-color: var(--bg-secondary);
            padding: var(--spacing-lg);
            border-radius: var(--radius-lg);
            border-left: 4px solid var(--primary-blue);
        }
        
        .summary-card h3 {
            margin: 0 0 var(--spacing-sm) 0;
            color: var(--primary-blue);
            font-size: var(--font-size-lg);
        }
        
        .summary-card p {
            margin: var(--spacing-xs) 0;
            color: var(--text-secondary);
        }
        
        .summary-card p strong {
            color: var(--text-primary);
            font-size: var(--font-size-xl);
        }
        
        .chart-container {
            margin: var(--spacing-lg) 0;
            position: relative;
            height: 400px;
            padding-bottom: var(--spacing-lg);
        }
        
        .algorithm-summary {
            margin: var(--spacing-xl) 0;
        }
        
        .algorithm-summary h2 {
            color: var(--primary-blue);
            margin-bottom: var(--spacing-lg);
        }
        
        .summary-table {
            width: 100%;
            margin: var(--spacing-lg) 0;
            overflow-x: auto;
        }
        
        .summary-table th {
            background-color: var(--primary-blue);
            color: var(--white);
            font-weight: var(--font-weight-semibold);
            white-space: nowrap;
        }
        
        .summary-table .best-group {
            background-color: #e3f2fd;
            border-left: 3px solid var(--primary-green);
        }
        
        .summary-table .largest-group {
            background-color: #f3e5f5;
            border-left: 3px solid var(--primary-purple);
        }
        
        .summary-table th.best-group {
            background-color: var(--primary-green);
            color: var(--white);
        }
        
        .summary-table th.largest-group {
            background-color: var(--primary-purple);
            color: var(--white);
        }
        
        .algorithm-link {
            color: var(--primary-blue);
            text-decoration: none;
            font-weight: var(--font-weight-semibold);
        }
        
        .algorithm-link:hover {
            color: var(--primary-green);
            text-decoration: underline;
        }
        
        .algorithm-section {
            margin: var(--spacing-xl) 0;
            padding: var(--spacing-xl);
            background-color: var(--bg-secondary);
            border-radius: var(--radius-lg);
        }
        
        .algorithm-charts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-lg);
            margin: var(--spacing-lg) 0;
        }
        
        .algorithm-charts .chart-container {
            height: 300px;
        }
        
        .algorithm-section h2 {
            color: var(--primary-blue);
            margin-bottom: var(--spacing-lg);
        }
        
        .footer {
            text-align: center;
            margin-top: var(--spacing-2xl);
            padding-top: var(--spacing-xl);
            border-top: 1px solid var(--border-color-light);
            color: var(--text-muted);
            font-size: var(--font-size-sm);
        }
        
        .system-info {
            background-color: var(--gray-100);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            margin-bottom: var(--spacing-xl);
            font-family: var(--font-mono);
            font-size: var(--font-size-sm);
            border: 1px solid var(--border-color-light);
        }
        
        @media (max-width: 768px) {
            .algorithm-charts {
                grid-template-columns: 1fr;
            }
            
            .summary-table {
                font-size: var(--font-size-sm);
            }
        }
    </style>
</head>
<body>
    <nav class="nav">
        <div class="container">
            <a href="../" class="nav-brand">🌐 Graphty Algorithms</a>
            <div class="nav-links">
                <a href="../" class="nav-link">Home</a>
                <a href="../examples/" class="nav-link">Examples</a>
                <a href="./" class="nav-link active">Benchmarks</a>
            </div>
        </div>
    </nav>
    
    <div class="container">
        <h1>📊 Graph Algorithm Performance Report</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
        
        <div class="system-info">
            <strong>System Information:</strong><br>
            Platform: ${latestSession.systemInfo.platform} (${latestSession.systemInfo.arch})<br>
            Node.js: ${latestSession.systemInfo.nodeVersion}<br>
            CPU: ${latestSession.systemInfo.cpu.model} (${latestSession.systemInfo.cpu.cores} cores @ ${latestSession.systemInfo.cpu.speed} MHz)<br>
            Memory: ${latestSession.systemInfo.memory.totalGB} GB<br>
            Library: @graphty/algorithms v${latestSession.systemInfo.libraryVersion}
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>📈 Algorithms Tested</h3>
                <p><strong>${algorithmGroups.size}</strong> algorithms</p>
                <p>${Array.from(algorithmGroups.keys()).join(', ')}</p>
            </div>
            <div class="summary-card">
                <h3>📊 Total Benchmarks</h3>
                <p><strong>${allResults.length}</strong> benchmark runs</p>
                <p>Across ${sessions.length} sessions</p>
            </div>
            <div class="summary-card">
                <h3>⚡ Performance Range</h3>
                <p>From <strong>${Math.min(...allResults.map(r => r.executionTime)).toFixed(2)}ms</strong></p>
                <p>To <strong>${Math.max(...allResults.map(r => r.executionTime)).toFixed(2)}ms</strong></p>
            </div>
        </div>

        <div class="algorithm-summary">
            <h2>📊 Algorithm Performance Summary</h2>
            <table class="table summary-table">
                <thead>
                    <tr>
                        <th>Algorithm</th>
                        <th>Avg Time (ms)</th>
                        <th>Avg Memory (MB)</th>
                        <th>Test Count</th>
                        <th class="best-group">Best TEPS</th>
                        <th class="best-group">Best Graph Size</th>
                        <th class="largest-group">Largest Graph</th>
                        <th class="largest-group">Largest Graph TEPS</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(algorithmGroups.entries())
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([algorithm, results]) => {
                      const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
                      const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length
                      
                      // Find best TEPS run
                      const bestTepsResult = results.reduce((best, r) => 
                        (r.metrics?.teps || 0) > (best.metrics?.teps || 0) ? r : best
                      )
                      
                      // Find largest graph run
                      const largestGraphResult = results.reduce((largest, r) => 
                        r.graphSize > largest.graphSize ? r : largest
                      )
                      
                      const algorithmId = algorithm.toLowerCase().replace(/[^a-z0-9]/g, '-')
                      
                      return `
                    <tr>
                        <td><a href="#${algorithmId}" class="algorithm-link">${algorithm}</a></td>
                        <td>${avgTime.toFixed(2)}</td>
                        <td>${(avgMemory / 1024 / 1024).toFixed(2)}</td>
                        <td>${results.length}</td>
                        <td class="best-group">${(bestTepsResult.metrics?.teps || 0).toFixed(0)}</td>
                        <td class="best-group">${bestTepsResult.graphSize.toLocaleString()}</td>
                        <td class="largest-group">${largestGraphResult.graphSize.toLocaleString()}</td>
                        <td class="largest-group">${(largestGraphResult.metrics?.teps || 0).toFixed(0)}</td>
                    </tr>`
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${Array.from(algorithmGroups.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([algorithm, results]) => {
          const sortedResults = results.sort((a, b) => a.graphSize - b.graphSize)
          const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
          const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length
          const algorithmId = algorithm.toLowerCase().replace(/[^a-z0-9]/g, '-')
          
          return `
        <div class="algorithm-section" id="${algorithmId}">
            <h2>🔍 ${algorithm}</h2>
            <p><strong>Average Execution Time:</strong> ${avgTime.toFixed(2)}ms</p>
            <p><strong>Average Memory Usage:</strong> ${(avgMemory / 1024 / 1024).toFixed(2)}MB</p>
            
            <div class="algorithm-charts">
                <div class="chart-container">
                    <h4>📈 Performance vs Graph Size</h4>
                    <canvas id="perf-${algorithmId}"></canvas>
                </div>
                <div class="chart-container">
                    <h4>💾 Memory vs Graph Size</h4>
                    <canvas id="mem-${algorithmId}"></canvas>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Graph Size</th>
                        <th>Graph Type</th>
                        <th>Edges</th>
                        <th>Time (ms)</th>
                        <th>Ops/sec</th>
                        <th>Memory (MB)</th>
                        <th>TEPS</th>
                        <th>Margin</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedResults.map(r => `
                    <tr>
                        <td>${r.graphSize}</td>
                        <td>${r.graphType}</td>
                        <td>${r.edges}</td>
                        <td>${r.executionTime.toFixed(2)}</td>
                        <td>${r.metrics?.opsPerSecond?.toFixed(0) || 'N/A'}</td>
                        <td>${(r.memoryUsage / 1024 / 1024).toFixed(2)}</td>
                        <td>${r.metrics?.teps?.toFixed(0) || 'N/A'}</td>
                        <td>±${r.metrics?.marginOfError?.toFixed(1) || '0'}%</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
          `
        }).join('')}

        <div class="footer">
            <p>Generated with ❤️ by @graphty/algorithms performance benchmarking suite</p>
            <p>Using Benchmark.js for accurate performance measurements</p>
        </div>
    </div>

    <script>

        // Create individual charts for each algorithm
        ${Array.from(algorithmGroups.entries()).map(([algorithm, results]) => {
          const algorithmId = algorithm.toLowerCase().replace(/[^a-z0-9]/g, '-')
          const sortedResults = results.sort((a, b) => a.graphSize - b.graphSize)
          const graphSizes = sortedResults.map(r => r.graphSize)
          const executionTimes = sortedResults.map(r => r.executionTime)
          const memoryUsages = sortedResults.map(r => r.memoryUsage / 1024 / 1024)
          
          return `
        // ${algorithm} Performance Chart
        const perfCtx_${algorithmId.replace(/-/g, '_')} = document.getElementById('perf-${algorithmId}').getContext('2d');
        new Chart(perfCtx_${algorithmId.replace(/-/g, '_')}, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(graphSizes)},
                datasets: [{
                    label: 'Execution Time (ms)',
                    data: ${JSON.stringify(executionTimes)},
                    borderColor: '#007bff',
                    backgroundColor: '#007bff20',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 20
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Graph Size (vertices)',
                            padding: { top: 10 }
                        },
                        ticks: {
                            padding: 5
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Execution Time (ms)'
                        }
                    }
                }
            }
        });

        // ${algorithm} Memory Chart
        const memCtx_${algorithmId.replace(/-/g, '_')} = document.getElementById('mem-${algorithmId}').getContext('2d');
        new Chart(memCtx_${algorithmId.replace(/-/g, '_')}, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(graphSizes)},
                datasets: [{
                    label: 'Memory Usage (MB)',
                    data: ${JSON.stringify(memoryUsages)},
                    backgroundColor: '#28a745',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 20
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Graph Size (vertices)',
                            padding: { top: 10 }
                        },
                        ticks: {
                            padding: 5
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Memory Usage (MB)'
                        }
                    }
                }
            }
        });`
        }).join('\n')}
    </script>
    
    <footer class="footer">
        <p>Generated by @graphty/algorithms • <a href="https://github.com/graphty-org/algorithms">GitHub</a> • <a href="https://www.npmjs.com/package/@graphty/algorithms">npm</a></p>
    </footer>
</body>
</html>`
}

// Main function
async function main() {
  console.log('📊 Generating performance report...')
  
  // Load benchmark sessions
  const sessions = loadBenchmarkSessions()
  
  if (sessions.length === 0) {
    console.error('❌ No benchmark sessions found. Run benchmarks first!')
    process.exit(1)
  }
  
  console.log(`✅ Found ${sessions.length} benchmark sessions`)
  
  // Create benchmark-results directory if it doesn't exist
  const resultsDir = join(process.cwd(), 'benchmark-results')
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true })
  }
  
  // Generate HTML report
  const html = generateHTML(sessions)
  const reportPath = join(resultsDir, 'index.html')
  writeFileSync(reportPath, html)
  
  console.log(`✅ Report generated at: ${reportPath}`)
  console.log('📊 Benchmark results and report saved to ./benchmark-results/')
}

// Run the script
main().catch(console.error)