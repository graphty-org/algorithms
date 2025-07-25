import { BenchmarkResult, BenchmarkSession } from '../benchmark-result'
import { getSystemInfo, formatSystemInfo } from './system-info'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

const BENCHMARK_DIR = join(process.cwd(), 'benchmark-results')
const RESULTS_FILE = join(BENCHMARK_DIR, 'benchmark-results.json')
const SESSIONS_FILE = join(BENCHMARK_DIR, 'benchmark-sessions.json')

// Ensure benchmark-results directory exists
if (!existsSync(BENCHMARK_DIR)) {
  mkdirSync(BENCHMARK_DIR, { recursive: true })
}

// Store current session info
let currentSession: BenchmarkSession | null = null

export function initBenchmarkSession(testType: 'quick' | 'comprehensive' = 'comprehensive'): BenchmarkSession {
  const systemInfo = getSystemInfo()
  currentSession = {
    sessionId: crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
    systemInfo,
    testType,
    results: []
  }
  
  console.log('\n📊 Benchmark Session Started')
  console.log(`Session ID: ${currentSession.sessionId}`)
  console.log(`Test Type: ${testType}`)
  console.log(formatSystemInfo(systemInfo))
  console.log('')
  
  return currentSession
}

export function saveBenchmarkResult(results: BenchmarkResult[]) {
  // Ensure we have a session
  if (!currentSession) {
    initBenchmarkSession()
  }
  
  // Add system info to each result
  const resultsWithSystem = results.map(r => ({
    ...r,
    systemInfo: currentSession!.systemInfo
  }))
  
  // Save individual results (backward compatible)
  let existingResults: BenchmarkResult[] = []
  
  if (existsSync(RESULTS_FILE)) {
    try {
      existingResults = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8'))
    } catch (e) {
      console.warn('Could not read existing results, starting fresh')
    }
  }
  
  const allResults = [...existingResults, ...resultsWithSystem]
  writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2))
  
  // Save session data
  currentSession!.results.push(...resultsWithSystem)
  saveBenchmarkSession(currentSession!)
  
  console.log(`✅ Saved ${results.length} benchmark results`)
}

export async function saveBenchmarkSession(session: BenchmarkSession): Promise<string> {
  let existingSessions: BenchmarkSession[] = []
  
  if (existsSync(SESSIONS_FILE)) {
    try {
      existingSessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'))
    } catch (e) {
      console.warn('Could not read existing sessions, starting fresh')
    }
  }
  
  // Update or add session
  const sessionIndex = existingSessions.findIndex(s => s.sessionId === session.sessionId)
  if (sessionIndex >= 0) {
    existingSessions[sessionIndex] = session
  } else {
    existingSessions.push(session)
  }
  
  writeFileSync(SESSIONS_FILE, JSON.stringify(existingSessions, null, 2))
  
  // Also save platform-specific file
  const platformFile = join(BENCHMARK_DIR, `benchmark-sessions-${session.systemInfo.platform}-${session.testType}.json`)
  writeFileSync(platformFile, JSON.stringify([session], null, 2))
  
  return platformFile
}


export function loadBenchmarkResults(): BenchmarkResult[] {
  if (!existsSync(RESULTS_FILE)) {
    return []
  }
  
  try {
    return JSON.parse(readFileSync(RESULTS_FILE, 'utf-8'))
  } catch (e) {
    console.error('Error loading benchmark results:', e)
    return []
  }
}

export function loadBenchmarkSessions(): BenchmarkSession[] {
  if (!existsSync(SESSIONS_FILE)) {
    return []
  }
  
  try {
    return JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'))
  } catch (e) {
    console.error('Error loading benchmark sessions:', e)
    return []
  }
}