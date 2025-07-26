import Benchmark from 'benchmark'
import { BenchmarkResult, BenchmarkSession } from '../benchmark-result'
import { getSystemInfo } from './system-info'

export interface BenchmarkConfig {
  testType: 'quick' | 'comprehensive'
  platform: 'node' | 'browser'
  sizes: number[]
  iterations?: number
  async?: boolean
  warmup?: {
    enabled: boolean
    iterations: number
    minTime?: number // minimum warmup time in seconds
  }
}

export interface PlatformMemoryInfo {
  heapUsed?: number
  heapTotal?: number
  external?: number
  rss?: number
  usedJSHeapSize?: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
}

export class CrossPlatformBenchmark {
  private suite: Benchmark.Suite
  private results: BenchmarkResult[] = []
  private sessionId: string
  private testFunctions: Map<string, () => void | Promise<void>> = new Map()

  constructor(private config: BenchmarkConfig, suiteName?: string) {
    this.suite = new Benchmark.Suite(suiteName || `${config.testType} Performance Tests`)
    this.sessionId = Math.random().toString(36).substring(7)
    
    // Set default warmup configuration if not provided
    if (!this.config.warmup) {
      this.config.warmup = {
        enabled: true,
        iterations: 5,
        minTime: 0.1
      }
    }
  }

  private async performWarmup(name: string, testFn: () => void | Promise<void>): Promise<void> {
    if (!this.config.warmup?.enabled) {
      return
    }

    console.log(`  Warming up ${name}...`)
    const startTime = Date.now()
    const minTimeMs = (this.config.warmup.minTime || 0.1) * 1000

    // Run warmup iterations
    for (let i = 0; i < this.config.warmup.iterations; i++) {
      try {
        if (this.config.async) {
          await testFn()
        } else {
          testFn()
        }
      } catch (error) {
        console.warn(`  Warmup iteration ${i + 1} failed:`, error)
      }
    }

    // Ensure minimum warmup time
    const elapsedTime = Date.now() - startTime
    if (elapsedTime < minTimeMs) {
      const remainingTime = minTimeMs - elapsedTime
      console.log(`  Extending warmup for ${remainingTime}ms...`)
      
      const additionalStart = Date.now()
      while (Date.now() - additionalStart < remainingTime) {
        try {
          if (this.config.async) {
            await testFn()
          } else {
            testFn()
          }
        } catch (error) {
          // Continue warmup despite errors
        }
      }
    }

    // Force garbage collection after warmup
    this.setupFunction()
    console.log(`  Warmup completed for ${name}`)
  }

  addTest(
    name: string, 
    testFn: () => void | Promise<void>, 
    testData: any = {},
    options: Benchmark.Options = {}
  ) {
    const memoryBefore = this.getMemoryInfo()
    
    // Store test function for warmup
    this.testFunctions.set(name, testFn)
    
    this.suite.add(name, testFn, {
      async: this.config.async || false,
      setup: () => this.setupFunction(),
      onStart: () => {
        // Memory snapshot before test
      },
      onComplete: (event: Benchmark.Event) => {
        const memoryAfter = this.getMemoryInfo()
        this.collectResult(event, testData, memoryBefore, memoryAfter)
      },
      ...options
    })
  }

  private setupFunction() {
    // Force garbage collection if available
    if (this.config.platform === 'node') {
      if (typeof global !== 'undefined' && (global as any).gc) {
        ;(global as any).gc()
      }
    } else {
      // Browser memory pressure hint
      if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
        // Some browsers support gc() in development
        try {
          if ('gc' in window) {
            ;(window as any).gc()
          }
        } catch (e) {
          // Ignore if not available
        }
      }
    }
  }

  private getMemoryInfo(): PlatformMemoryInfo {
    if (this.config.platform === 'node') {
      // Node.js memory information
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const mem = process.memoryUsage()
        return {
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          external: mem.external,
          rss: mem.rss
        }
      }
    } else {
      // Browser memory information
      if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
        const mem = (window.performance as any).memory
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit
        }
      }
    }
    return {}
  }

  private collectResult(
    event: Benchmark.Event, 
    testData: any,
    memoryBefore: PlatformMemoryInfo,
    memoryAfter: PlatformMemoryInfo
  ) {
    const benchmark = event.target as Benchmark
    const memoryUsed = this.calculateMemoryDelta(memoryBefore, memoryAfter)

    const result: BenchmarkResult = {
      algorithm: testData.algorithm || 'Unknown',
      graphType: testData.graphType || 'unknown',
      graphGenerationAlgorithm: testData.graphGenerationAlgorithm,
      graphSize: testData.graphSize || 0,
      edges: testData.edges || 0,
      executionTime: benchmark.stats ? benchmark.stats.mean * 1000 : 0, // Convert to milliseconds
      memoryUsage: memoryUsed,
      memoryPerVertex: testData.graphSize ? memoryUsed / testData.graphSize : 0,
      timestamp: new Date().toISOString(),
      systemInfo: getSystemInfo(),
      metrics: {
        opsPerSecond: benchmark.hz || 0,
        samples: benchmark.stats?.sample.length || 0,
        marginOfError: benchmark.stats?.rme || 0,
        standardDeviation: benchmark.stats?.deviation || 0,
        variance: benchmark.stats?.variance || 0,
        platform: this.config.platform,
        testType: this.config.testType,
        teps: testData.edges && benchmark.stats ? testData.edges / benchmark.stats.mean : 0,
        ...testData.additionalMetrics
      }
    }

    this.results.push(result)
  }

  private calculateMemoryDelta(before: PlatformMemoryInfo, after: PlatformMemoryInfo): number {
    if (this.config.platform === 'node') {
      return (after.heapUsed || 0) - (before.heapUsed || 0)
    } else {
      return (after.usedJSHeapSize || 0) - (before.usedJSHeapSize || 0)
    }
  }

  async run(): Promise<BenchmarkSession> {
    // Perform warmup for all tests if enabled
    if (this.config.warmup?.enabled) {
      console.log('Starting warmup phase...')
      for (const [name, testFn] of this.testFunctions) {
        await this.performWarmup(name, testFn)
      }
      console.log('Warmup phase completed. Starting benchmarks...\n')
    }

    return new Promise((resolve, reject) => {
      this.suite
        .on('cycle', (event: Benchmark.Event) => {
          const benchmark = event.target as Benchmark
          console.log(`  ${benchmark.name}: ${benchmark.toString()}`)
        })
        .on('complete', () => {
          const session: BenchmarkSession = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            systemInfo: getSystemInfo(),
            testType: this.config.testType,
            results: this.results
          }
          resolve(session)
        })
        .on('error', (error: Error) => {
          reject(error)
        })
        .run({ async: true })
    })
  }

  // Get intermediate results
  getResults(): BenchmarkResult[] {
    return [...this.results]
  }

  // Get suite for advanced usage
  getSuite(): Benchmark.Suite {
    return this.suite
  }
}