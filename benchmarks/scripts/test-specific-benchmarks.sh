#!/bin/bash

# Test specific benchmarks that might be failing
echo "Testing specific quick benchmarks..."
echo "================================"

# Array of benchmark scripts to test
benchmarks=(
    "benchmark:betweenness-centrality"
    "benchmark:closeness-centrality"
    "benchmark:eigenvector-centrality"
    "benchmark:katz-centrality"
    "benchmark:louvain"
    "benchmark:label-propagation"
    "benchmark:k-core"
    "benchmark:ford-fulkerson"
    "benchmark:common-neighbors"
    "benchmark:astar"
    "benchmark:spectral-clustering"
    "benchmark:graph-isomorphism"
)

# Test each benchmark
for benchmark in "${benchmarks[@]}"; do
    echo ""
    echo "Testing $benchmark..."
    echo "-------------------"
    
    # Run the benchmark with a timeout of 60 seconds for slower algorithms
    if timeout 60s npm run "$benchmark" -- --quick > /tmp/benchmark_output.log 2>&1; then
        echo "✓ $benchmark passed"
        # Show summary if passed
        tail -20 /tmp/benchmark_output.log | grep -E "(Results saved|SUMMARY|vertices|Time\(ms\))" || true
    else
        echo "✗ $benchmark failed"
        # Show error details
        echo "Error details:"
        tail -50 /tmp/benchmark_output.log | grep -E "(Error|error|failed|Failed|TypeError|ReferenceError)" || true
    fi
done

echo ""
echo "Test completed!"