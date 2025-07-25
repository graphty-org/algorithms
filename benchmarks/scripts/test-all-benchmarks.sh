#!/bin/bash

# Test all quick benchmarks
echo "Testing all quick benchmarks..."
echo "================================"

# Array of benchmark scripts
benchmarks=(
    "benchmark:bfs"
    "benchmark:dfs"
    "benchmark:dijkstra"
    "benchmark:pagerank"
    "benchmark:bellman-ford"
    "benchmark:floyd-warshall"
    "benchmark:degree-centrality"
    "benchmark:betweenness-centrality"
    "benchmark:closeness-centrality"
    "benchmark:eigenvector-centrality"
    "benchmark:hits"
    "benchmark:katz-centrality"
    "benchmark:louvain"
    "benchmark:label-propagation"
    "benchmark:connected-components"
    "benchmark:kruskal"
    "benchmark:prim"
    "benchmark:k-core"
    "benchmark:ford-fulkerson"
    "benchmark:common-neighbors"
    "benchmark:astar"
    "benchmark:spectral-clustering"
    "benchmark:bipartite-matching"
    "benchmark:graph-isomorphism"
)

# Track results
passed=0
failed=0
failed_benchmarks=()

# Test each benchmark
for benchmark in "${benchmarks[@]}"; do
    echo ""
    echo "Testing $benchmark..."
    echo "-------------------"
    
    # Run the benchmark with a timeout of 30 seconds
    if timeout 30s npm run "$benchmark" -- --quick > /dev/null 2>&1; then
        echo "✓ $benchmark passed"
        ((passed++))
    else
        echo "✗ $benchmark failed"
        ((failed++))
        failed_benchmarks+=("$benchmark")
    fi
done

# Summary
echo ""
echo "================================"
echo "SUMMARY"
echo "================================"
echo "Total benchmarks: ${#benchmarks[@]}"
echo "Passed: $passed"
echo "Failed: $failed"

if [ ${#failed_benchmarks[@]} -gt 0 ]; then
    echo ""
    echo "Failed benchmarks:"
    for failed_benchmark in "${failed_benchmarks[@]}"; do
        echo "  - $failed_benchmark"
    done
fi

echo ""
echo "Test completed!"