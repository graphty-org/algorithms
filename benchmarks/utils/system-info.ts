import os from 'os'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface SystemInfo {
  platform: string
  arch: string
  nodeVersion: string
  v8Version: string
  libraryVersion: string
  cpu: {
    model: string
    cores: number
    speed: number // MHz
  }
  memory: {
    total: number // bytes
    totalGB: number
  }
  os: {
    type: string
    release: string
    version: string
  }
}

/**
 * Collects system information for benchmark reproducibility
 */
export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  const totalMemory = os.totalmem()
  
  // Get library version from package.json
  let libraryVersion = 'unknown'
  try {
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    libraryVersion = packageJson.version || 'unknown'
  } catch {}
  
  // Get more detailed CPU info if available
  let cpuModel = cpus[0]?.model || 'Unknown'
  let cpuSpeed = cpus[0]?.speed || 0
  
  // Try to get more accurate CPU info on Linux
  if (process.platform === 'linux') {
    try {
      const cpuInfo = execSync('cat /proc/cpuinfo | grep "model name" | head -1', { encoding: 'utf8' })
      const modelMatch = cpuInfo.match(/model name\s*:\s*(.+)/)
      if (modelMatch) {
        cpuModel = modelMatch[1].trim()
      }
      
      // Get max CPU frequency if available
      try {
        const maxFreq = execSync('cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq', { encoding: 'utf8' })
        const freqKHz = parseInt(maxFreq.trim())
        if (!isNaN(freqKHz)) {
          cpuSpeed = Math.round(freqKHz / 1000) // Convert KHz to MHz
        }
      } catch {}
    } catch {}
  }
  
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    v8Version: process.versions.v8,
    libraryVersion,
    cpu: {
      model: cpuModel,
      cores: cpus.length,
      speed: cpuSpeed
    },
    memory: {
      total: totalMemory,
      totalGB: Math.round(totalMemory / (1024 * 1024 * 1024) * 10) / 10
    },
    os: {
      type: os.type(),
      release: os.release(),
      version: os.version ? os.version() : os.release()
    }
  }
}

/**
 * Formats system info as a readable string
 */
export function formatSystemInfo(info: SystemInfo): string {
  return `
System Information:
  Platform: ${info.platform} (${info.arch})
  OS: ${info.os.type} ${info.os.release}
  Node.js: ${info.nodeVersion}
  V8: ${info.v8Version}
  Library: @graphty/algorithms v${info.libraryVersion}
  CPU: ${info.cpu.model}
  CPU Cores: ${info.cpu.cores}
  CPU Speed: ${info.cpu.speed} MHz
  Memory: ${info.memory.totalGB} GB
`.trim()
}