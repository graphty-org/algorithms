export class MemoryProfiler {
  private startMemory: NodeJS.MemoryUsage
  private snapshots: Array<{name: string, memory: NodeJS.MemoryUsage}> = []

  start() {
    // Force garbage collection if available (run with --expose-gc flag)
    if (global.gc) {
      global.gc()
    }
    this.startMemory = process.memoryUsage()
  }

  snapshot(name: string) {
    this.snapshots.push({
      name,
      memory: process.memoryUsage()
    })
  }

  getReport() {
    return this.snapshots.map(snapshot => ({
      name: snapshot.name,
      heapUsed: snapshot.memory.heapUsed - this.startMemory.heapUsed,
      heapTotal: snapshot.memory.heapTotal - this.startMemory.heapTotal,
      external: snapshot.memory.external - this.startMemory.external,
      rss: snapshot.memory.rss - this.startMemory.rss
    }))
  }

  reset() {
    this.snapshots = []
    this.start()
  }
}