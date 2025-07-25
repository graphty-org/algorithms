#!/bin/bash

# Test all benchmarks with quick mode
echo "🧪 Testing all benchmarks in quick mode..."
echo "=========================================="

# Array of all benchmarks
benchmarks=(
  "bfs"
  "dfs"
  "dijkstra"
  "pagerank"
  "bellman-ford"
  "floyd-warshall"
  "degree-centrality"
  "betweenness-centrality"
  "closeness-centrality"
  "eigenvector-centrality"
  "hits"
  "katz-centrality"
  "louvain"
  "label-propagation"
  "connected-components"
  "kruskal"
  "prim"
  "k-core"
  "ford-fulkerson"
  "common-neighbors"
  "astar"
  "spectral-clustering"
)

# Track success/failure
successful=()
failed=()

# Test each benchmark
for benchmark in "${benchmarks[@]}"; do
  echo ""
  echo "📊 Testing $benchmark..."
  echo "------------------------"
  
  if npm run benchmark:$benchmark -- --quick > /tmp/benchmark-$benchmark.log 2>&1; then
    echo "✅ $benchmark passed"
    successful+=("$benchmark")
  else
    echo "❌ $benchmark failed"
    failed+=("$benchmark")
    echo "Error output:"
    tail -20 /tmp/benchmark-$benchmark.log
  fi
done

# Summary
echo ""
echo "=========================================="
echo "📈 BENCHMARK TEST SUMMARY"
echo "=========================================="
echo "✅ Successful: ${#successful[@]} benchmarks"
for b in "${successful[@]}"; do
  echo "   - $b"
done

echo ""
echo "❌ Failed: ${#failed[@]} benchmarks"
for b in "${failed[@]}"; do
  echo "   - $b"
done

echo ""
echo "Total: $((${#successful[@]} + ${#failed[@]})) benchmarks tested"