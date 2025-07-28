import type {GraphAlgorithmConfig} from "../optimized/graph-adapter.js";
import {getEnvVar} from "./environment.js";

/**
 * Default optimization configuration
 */
const DEFAULT_CONFIG: GraphAlgorithmConfig = {
    // Enable optimizations
    useDirectionOptimizedBFS: true,
    useCSRFormat: true,
    useBitPackedStructures: true,

    // Algorithm-specific parameters
    bfsAlpha: 15.0, // Threshold for switching to bottom-up
    bfsBeta: 20.0, // Threshold for switching back to top-down

    // Memory vs speed tradeoffs
    preallocateSize: 1000000, // Pre-allocate arrays up to 1M elements
    enableCaching: true, // Cache CSR conversions
};

/**
 * Environment-based configuration
 */
function getEnvironmentConfig(): Partial<GraphAlgorithmConfig> {
    const config: Partial<GraphAlgorithmConfig> = {};

    // Use cross-platform environment variable access
    if (getEnvVar("GRAPHTY_USE_OPTIMIZED_BFS") === "true") {
        config.useDirectionOptimizedBFS = true;
        config.useCSRFormat = true;
    }

    const bfsAlpha = getEnvVar("GRAPHTY_BFS_ALPHA");
    if (bfsAlpha) {
        config.bfsAlpha = parseFloat(bfsAlpha);
    }

    const bfsBeta = getEnvVar("GRAPHTY_BFS_BETA");
    if (bfsBeta) {
        config.bfsBeta = parseFloat(bfsBeta);
    }

    if (getEnvVar("GRAPHTY_DISABLE_CACHE") === "true") {
        config.enableCaching = false;
    }

    return config;
}

/**
 * Performance presets for common use cases
 */
export const OPTIMIZATION_PRESETS = {
    /**
     * Default configuration - balanced for most use cases
     */
    default: DEFAULT_CONFIG,

    /**
     * High performance configuration for large graphs
     */
    performance: {
        useDirectionOptimizedBFS: true,
        useCSRFormat: true,
        useBitPackedStructures: true,
        bfsAlpha: 15.0,
        bfsBeta: 20.0,
        preallocateSize: 10000000,
        enableCaching: true,
    } satisfies GraphAlgorithmConfig,

    /**
     * Memory-efficient configuration for constrained environments
     */
    memory: {
        useDirectionOptimizedBFS: false,
        useCSRFormat: false,
        useBitPackedStructures: false,
        bfsAlpha: 15.0,
        bfsBeta: 20.0,
        preallocateSize: 100000,
        enableCaching: false,
    } satisfies GraphAlgorithmConfig,

    /**
     * Balanced configuration for medium-sized graphs
     */
    balanced: {
        useDirectionOptimizedBFS: true,
        useCSRFormat: true,
        useBitPackedStructures: false,
        bfsAlpha: 20.0,
        bfsBeta: 25.0,
        preallocateSize: 1000000,
        enableCaching: true,
    } satisfies GraphAlgorithmConfig,
};

/**
 * Get optimization configuration with environment overrides
 */
export function getOptimizationConfiguration(
    preset: keyof typeof OPTIMIZATION_PRESETS = "default",
): GraphAlgorithmConfig {
    const baseConfig = OPTIMIZATION_PRESETS[preset];
    const envConfig = getEnvironmentConfig();

    return {
        ... baseConfig,
        ... envConfig,
    };
}

/**
 * Configure optimizations globally
 * @example
 * // Enable all optimizations
 * configureGlobalOptimizations("performance");
 *
 * // Custom configuration
 * configureGlobalOptimizations({
 *     useDirectionOptimizedBFS: true,
 *     useCSRFormat: true,
 *     bfsAlpha: 10.0
 * });
 */
export async function configureGlobalOptimizations(
    configOrPreset: GraphAlgorithmConfig | keyof typeof OPTIMIZATION_PRESETS,
): Promise<void> {
    const {configureOptimizations} = await import("../optimized/graph-adapter.js");

    if (typeof configOrPreset === "string") {
        const config = getOptimizationConfiguration(configOrPreset);
        configureOptimizations(config);
    } else {
        configureOptimizations(configOrPreset);
    }
}

/**
 * Check if a graph should use optimizations based on its size
 */
export function shouldUseOptimizations(nodeCount: number, edgeCount: number): boolean {
    // Use optimizations for graphs with more than 10k nodes or 100k edges
    return nodeCount > 10000 || edgeCount > 100000;
}

/**
 * Get recommended preset based on graph size
 */
export function getRecommendedPreset(
    nodeCount: number,
    edgeCount: number,
): keyof typeof OPTIMIZATION_PRESETS {
    if (nodeCount > 1000000 || edgeCount > 10000000) {
        return "performance";
    } else if (nodeCount > 10000 || edgeCount > 100000) {
        return "balanced";
    }

    return "default";
}
