import { SystemInfo } from '../benchmarks/utils/system-info'

export interface BenchmarkResult {
  algorithm: string
  graphType: string
  graphGenerationAlgorithm?: string // Algorithm used to generate the test graph
  graphSize: number
  edges: number
  executionTime: number // milliseconds
  memoryUsage: number // bytes
  memoryPerVertex: number // bytes per vertex
  timestamp: string
  systemInfo?: SystemInfo // System information for reproducibility
  metrics?: {
    [key: string]: number // Algorithm-specific metrics
  }
}

export interface BenchmarkSession {
  sessionId: string
  timestamp: string
  systemInfo: SystemInfo
  testType: 'quick' | 'comprehensive'
  results: BenchmarkResult[]
}