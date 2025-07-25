import * as fs from 'fs'
import * as path from 'path'
import { BenchmarkResult, BenchmarkSession } from './benchmark-result'

export interface HtmlReportOptions {
  title?: string
  outputDir?: string
  includeCharts?: boolean
  includeSummary?: boolean
}

export class HtmlReportGenerator {
  private readonly defaultOptions: Required<HtmlReportOptions> = {
    title: 'Graph Algorithm Performance Report',
    outputDir: './reports',
    includeCharts: true,
    includeSummary: true
  }

  constructor(private options: HtmlReportOptions = {}) {
    this.options = { ...this.defaultOptions, ...options }
  }

  generateReport(sessions: BenchmarkSession[]): void {
    if (!sessions || sessions.length === 0) {
      throw new Error('No benchmark sessions provided')
    }

    // Ensure output directory exists
    const outputDir = this.options.outputDir!
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generate main report
    const html = this.generateHtml(sessions)
    const outputPath = path.join(outputDir, 'index.html')
    fs.writeFileSync(outputPath, html)

    // Copy assets
    this.copyAssets(outputDir)

    console.log(`Report generated at: ${outputPath}`)
  }

  private generateHtml(sessions: BenchmarkSession[]): string {
    const latestSession = sessions[sessions.length - 1]
    const systemInfo = latestSession.systemInfo

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        ${this.generateStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${this.options.title}</h1>
            <div class="system-info">
                <h2>System Information</h2>
                <dl>
                    <dt>Test Type</dt>
                    <dd><span class="test-type ${latestSession.testType}">${latestSession.testType.toUpperCase()}</span></dd>
                    <dt>Library Version</dt>
                    <dd>@graphty/algorithms v${systemInfo.libraryVersion}</dd>
                    <dt>Node.js</dt>
                    <dd>${systemInfo.nodeVersion}</dd>
                    <dt>CPU</dt>
                    <dd>${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores @ ${systemInfo.cpu.speed}MHz)</dd>
                    <dt>Memory</dt>
                    <dd>${systemInfo.memory.totalGB}GB</dd>
                    <dt>Platform</dt>
                    <dd>${systemInfo.platform} ${systemInfo.arch}</dd>
                    <dt>Test Date</dt>
                    <dd>${new Date(latestSession.timestamp).toLocaleString()}</dd>
                </dl>
            </div>
        </header>

        ${this.options.includeSummary ? this.generateSummary(sessions) : ''}
        
        <section class="results">
            <h2>Performance Results</h2>
            ${this.generateResultsTables(sessions)}
        </section>

        ${this.options.includeCharts ? this.generateCharts(sessions) : ''}

        <section class="comparison">
            <h2>Algorithm Comparison</h2>
            ${this.generateComparisonTable(sessions)}
        </section>

        <footer>
            <p>Generated on ${new Date().toLocaleString()} by @graphty/algorithms performance test suite</p>
        </footer>
    </div>

    <script>
        ${this.generateScripts(sessions)}
    </script>
</body>
</html>`
  }

  private generateStyles(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }

        h2 {
            color: #34495e;
            margin: 20px 0 15px;
        }

        .system-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-top: 20px;
        }

        .system-info dl {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 10px;
        }

        .system-info dt {
            font-weight: bold;
            color: #555;
        }

        .system-info dd {
            color: #666;
        }

        section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #555;
        }

        tr:hover {
            background-color: #f5f5f5;
        }

        .metric {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
        }

        .summary-card h3 {
            color: #555;
            font-size: 1em;
            margin-bottom: 10px;
        }

        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }

        .summary-card .unit {
            font-size: 0.8em;
            color: #666;
        }

        .chart-container {
            position: relative;
            height: 400px;
            margin: 30px 0;
        }

        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-top: 20px;
        }

        footer {
            text-align: center;
            color: #666;
            margin-top: 50px;
            padding: 20px;
        }

        .performance-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }

        .good { background-color: #27ae60; }
        .medium { background-color: #f39c12; }
        .poor { background-color: #e74c3c; }

        .test-type {
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.9em;
        }

        .test-type.quick {
            background-color: #3498db;
            color: white;
        }

        .test-type.comprehensive {
            background-color: #27ae60;
            color: white;
        }
    `
  }

  private generateSummary(sessions: BenchmarkSession[]): string {
    const allResults = sessions.flatMap(s => s.results)
    
    // Calculate summary statistics
    const totalTests = allResults.length
    const algorithms = [...new Set(allResults.map(r => r.algorithm))]
    const avgExecutionTime = allResults.reduce((sum, r) => sum + r.executionTime, 0) / totalTests
    const totalMemoryUsed = allResults.reduce((sum, r) => sum + r.memoryUsage, 0)

    return `
        <section class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="value">${totalTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Algorithms Tested</h3>
                    <div class="value">${algorithms.length}</div>
                </div>
                <div class="summary-card">
                    <h3>Avg Execution Time</h3>
                    <div class="value">${avgExecutionTime.toFixed(2)}<span class="unit">ms</span></div>
                </div>
                <div class="summary-card">
                    <h3>Total Memory Used</h3>
                    <div class="value">${(totalMemoryUsed / 1024 / 1024).toFixed(2)}<span class="unit">MB</span></div>
                </div>
            </div>
        </section>
    `
  }

  private generateResultsTables(sessions: BenchmarkSession[]): string {
    const resultsByAlgorithm = this.groupResultsByAlgorithm(sessions)
    
    return Object.entries(resultsByAlgorithm).map(([algorithm, results]) => `
        <div class="algorithm-results">
            <h3>${algorithm} Performance</h3>
            <table>
                <thead>
                    <tr>
                        <th>Graph Type</th>
                        <th>Graph Generation</th>
                        <th>Vertices</th>
                        <th>Edges</th>
                        <th>Execution Time (ms)</th>
                        <th>Memory (MB)</th>
                        <th>Memory/Vertex (KB)</th>
                        <th>TEPS</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => `
                        <tr>
                            <td>${r.graphType}</td>
                            <td>${r.graphGenerationAlgorithm || 'Unknown'}</td>
                            <td class="metric">${r.graphSize.toLocaleString()}</td>
                            <td class="metric">${r.edges.toLocaleString()}</td>
                            <td class="metric">${r.executionTime.toFixed(2)}</td>
                            <td class="metric">${(r.memoryUsage / 1024 / 1024).toFixed(2)}</td>
                            <td class="metric">${(r.memoryPerVertex / 1024).toFixed(2)}</td>
                            <td class="metric">${r.metrics?.teps ? r.metrics.teps.toFixed(0) : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('')
  }

  private generateCharts(sessions: BenchmarkSession[]): string {
    return `
        <section class="charts">
            <h2>Performance Charts</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    <canvas id="executionTimeChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="memoryUsageChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="scalabilityChart"></canvas>
                </div>
                <div class="chart-container">
                    <canvas id="tepsChart"></canvas>
                </div>
            </div>
        </section>
    `
  }

  private generateComparisonTable(sessions: BenchmarkSession[]): string {
    const algorithms = this.getAlgorithmComparison(sessions)
    
    return `
        <table>
            <thead>
                <tr>
                    <th>Algorithm</th>
                    <th>Avg Execution Time (ms)</th>
                    <th>Avg Memory (MB)</th>
                    <th>Best Case TEPS</th>
                    <th>Scalability</th>
                </tr>
            </thead>
            <tbody>
                ${algorithms.map(a => `
                    <tr>
                        <td>${a.algorithm}</td>
                        <td class="metric">${a.avgExecutionTime.toFixed(2)}</td>
                        <td class="metric">${a.avgMemory.toFixed(2)}</td>
                        <td class="metric">${a.bestTeps.toFixed(0)}</td>
                        <td>
                            <span class="performance-indicator ${a.scalability}"></span>
                            ${a.scalability}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `
  }

  private generateScripts(sessions: BenchmarkSession[]): string {
    const resultsByAlgorithm = this.groupResultsByAlgorithm(sessions)
    
    return `
        // Execution Time Chart
        const executionCtx = document.getElementById('executionTimeChart').getContext('2d');
        new Chart(executionCtx, {
            type: 'line',
            data: {
                datasets: [
                    ${Object.entries(resultsByAlgorithm).map(([algorithm, results]) => `{
                        label: '${algorithm}',
                        data: ${JSON.stringify(results.map(r => ({
                            x: r.graphSize,
                            y: r.executionTime
                        })))},
                        borderColor: '${this.getColor(algorithm)}',
                        backgroundColor: '${this.getColor(algorithm)}33',
                        tension: 0.1
                    }`).join(',')}
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Execution Time vs Graph Size'
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Number of Vertices'
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

        // Memory Usage Chart
        const memoryCtx = document.getElementById('memoryUsageChart').getContext('2d');
        new Chart(memoryCtx, {
            type: 'line',
            data: {
                datasets: [
                    ${Object.entries(resultsByAlgorithm).map(([algorithm, results]) => `{
                        label: '${algorithm}',
                        data: ${JSON.stringify(results.map(r => ({
                            x: r.graphSize,
                            y: r.memoryUsage / 1024 / 1024
                        })))},
                        borderColor: '${this.getColor(algorithm)}',
                        backgroundColor: '${this.getColor(algorithm)}33',
                        tension: 0.1
                    }`).join(',')}
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Memory Usage vs Graph Size'
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Number of Vertices'
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
        });

        // Scalability Chart
        const scalabilityCtx = document.getElementById('scalabilityChart').getContext('2d');
        new Chart(scalabilityCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(resultsByAlgorithm))},
                datasets: [{
                    label: 'Time Complexity Growth Rate',
                    data: ${JSON.stringify(Object.entries(resultsByAlgorithm).map(([_, results]) => {
                        if (results.length < 2) return 0;
                        const first = results[0];
                        const last = results[results.length - 1];
                        return (last.executionTime / first.executionTime) / (last.graphSize / first.graphSize);
                    }))},
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Algorithm Scalability (Lower is Better)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Growth Rate'
                        }
                    }
                }
            }
        });

        // TEPS Chart
        const tepsCtx = document.getElementById('tepsChart').getContext('2d');
        new Chart(tepsCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    ${Object.entries(resultsByAlgorithm).map(([algorithm, results]) => `{
                        label: '${algorithm}',
                        data: ${JSON.stringify(results
                            .filter(r => r.metrics?.teps)
                            .map(r => ({
                                x: r.edges,
                                y: r.metrics.teps
                            })))},
                        backgroundColor: '${this.getColor(algorithm)}',
                        pointRadius: 6
                    }`).join(',')}
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Traversed Edges Per Second (TEPS)'
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Number of Edges'
                        }
                    },
                    y: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'TEPS'
                        }
                    }
                }
            }
        });
    `
  }

  private groupResultsByAlgorithm(sessions: BenchmarkSession[]): Record<string, BenchmarkResult[]> {
    const grouped: Record<string, BenchmarkResult[]> = {}
    
    sessions.forEach(session => {
      session.results.forEach(result => {
        if (!grouped[result.algorithm]) {
          grouped[result.algorithm] = []
        }
        grouped[result.algorithm].push(result)
      })
    })
    
    // Sort results by graph size
    Object.values(grouped).forEach(results => {
      results.sort((a, b) => a.graphSize - b.graphSize)
    })
    
    return grouped
  }

  private getAlgorithmComparison(sessions: BenchmarkSession[]) {
    const resultsByAlgorithm = this.groupResultsByAlgorithm(sessions)
    
    return Object.entries(resultsByAlgorithm).map(([algorithm, results]) => {
      const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
      const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length / 1024 / 1024
      const bestTeps = Math.max(...results.map(r => r.metrics?.teps || 0))
      
      // Calculate scalability
      let scalability = 'good'
      if (results.length >= 2) {
        const first = results[0]
        const last = results[results.length - 1]
        const growthRate = (last.executionTime / first.executionTime) / (last.graphSize / first.graphSize)
        
        if (growthRate > 2) scalability = 'poor'
        else if (growthRate > 1.5) scalability = 'medium'
      }
      
      return {
        algorithm,
        avgExecutionTime,
        avgMemory,
        bestTeps,
        scalability
      }
    })
  }

  private getColor(algorithm: string): string {
    const colors: Record<string, string> = {
      'BFS': '#3498db',
      'DFS': '#2ecc71',
      'Dijkstra': '#e74c3c',
      'PageRank': '#f39c12',
      'Bellman-Ford': '#9b59b6',
      'Floyd-Warshall': '#1abc9c'
    }
    return colors[algorithm] || '#95a5a6'
  }

  private copyAssets(outputDir: string): void {
    // Create a simple CSS file for additional styling if needed
    const cssContent = `
/* Additional styles for print media */
@media print {
    .chart-container {
        page-break-inside: avoid;
    }
}
`
    fs.writeFileSync(path.join(outputDir, 'styles.css'), cssContent)
  }
}

// Export convenience function
export function generateHtmlReport(
  sessionsFile: string = './benchmark-sessions.json',
  options?: HtmlReportOptions
): void {
  try {
    const sessionsData = fs.readFileSync(sessionsFile, 'utf-8')
    const sessions: BenchmarkSession[] = JSON.parse(sessionsData)
    
    const generator = new HtmlReportGenerator(options)
    generator.generateReport(sessions)
  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}