import type {Graph} from "../core/graph.js";

/**
 * Common interface for algorithm options with optimization support
 */
export interface OptimizableOptions {
    /**
     * Whether to use optimized implementations
     * - true: Force use of optimizations
     * - false: Disable optimizations
     * - "auto": Automatically decide based on graph size (default)
     */
    optimized?: boolean | "auto";
}

/**
 * Check if a graph should use optimizations based on its size
 */
function shouldUseOptimizations(nodeCount: number, edgeCount: number): boolean {
    // Use optimizations for graphs with more than 10k nodes or 100k edges
    return nodeCount > 10000 || edgeCount > 100000;
}

/**
 * Determine if optimizations should be used for a given graph
 */
export function shouldOptimize(
    graph: Graph,
    options: OptimizableOptions = {},
): boolean {
    const {optimized = "auto"} = options;

    if (optimized === "auto") {
        // Check graph size
        return shouldUseOptimizations(graph.nodeCount, graph.totalEdgeCount);
    }

    return optimized;
}

/**
 * Merge optimization options with algorithm-specific options
 */
export function mergeOptimizationOptions<T extends Record<string, unknown>>(
    graph: Graph,
    options: T & OptimizableOptions,
): T & {optimized?: boolean} {
    const {optimized: userOptimized, ... rest} = options;

    return {
        ... rest,
        optimized: shouldOptimize(graph, userOptimized !== undefined ? {optimized: userOptimized} : {}),
    } as T & {optimized?: boolean};
}

/**
 * Create an optimized version of an algorithm
 * @example
 * const optimizedBetweenness = createOptimizedAlgorithm(
 *     betweennessCentrality,
 *     (graph, options) => ({...options, optimized: true})
 * );
 */
export function createOptimizedAlgorithm<
    TArgs extends [Graph, ...unknown[]],
    TResult,
>(
    algorithm: (... args: TArgs) => TResult,
    optionsTransformer?: (graph: Graph, options: unknown) => unknown,
): (... args: TArgs) => TResult {
    return (... args: TArgs): TResult => {
        const [graph, options, ... rest] = args;

        if (optionsTransformer && options !== undefined) {
            const transformedOptions = optionsTransformer(graph, options);
            return algorithm(... ([graph, transformedOptions, ... rest] as unknown as TArgs));
        }

        return algorithm(... args);
    };
}
