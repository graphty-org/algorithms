#!/usr/bin/env node

// Worker thread for running individual benchmarks
import { parentPort, workerData } from 'worker_threads'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function runBenchmark() {
  const { algorithm, isQuick, benchmarkPath } = workerData
  
  try {
    // Execute the benchmark using tsx
    const mode = isQuick ? '--quick' : '--comprehensive'
    const command = `tsx ${benchmarkPath} ${mode}`
    
    execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: isQuick ? 300000 : 600000 // 5 minutes for quick, 10 minutes for comprehensive
    })
    
    // Read the benchmark results from the most recent session file
    const sessionFile = isQuick 
      ? path.join(path.dirname(benchmarkPath), '..', '..', 'benchmark-results', 'benchmark-sessions-linux-quick.json')
      : path.join(path.dirname(benchmarkPath), '..', '..', 'benchmark-results', 'benchmark-sessions-linux.json')
    
    if (fs.existsSync(sessionFile)) {
      const sessions = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'))
      const lastSession = sessions[sessions.length - 1]
      
      // Filter results for this algorithm
      const algorithmResults = lastSession.results.filter(r => 
        r.algorithm.toLowerCase().includes(algorithm.name.toLowerCase()) ||
        algorithm.name.toLowerCase().includes(r.algorithm.toLowerCase())
      )
      
      parentPort.postMessage({
        algorithm: algorithm.name,
        results: algorithmResults
      })
    } else {
      throw new Error(`Session file not found: ${sessionFile}`)
    }
  } catch (error) {
    parentPort.postMessage({
      algorithm: algorithm.name,
      results: [],
      error: error.message
    })
  }
}

runBenchmark()