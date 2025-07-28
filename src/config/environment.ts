/**
 * Cross-platform environment variable access
 * Works in both Node.js and browser environments
 */

/**
 * Get environment variable value safely across platforms
 * @param key - Environment variable name
 * @returns Value if found, undefined otherwise
 */
export function getEnvVar(key: string): string | undefined {
    // Node.js environment
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof process !== "undefined" && process?.env) {
        return process.env[key];
    }

    // Browser environment - check for build-time injected values
    // Many bundlers (webpack, vite, etc.) inject process.env at build time
    // This block is intentionally duplicated to handle bundler transformations

    // Check for global window object (browser)
    if (typeof window !== "undefined") {
        // Check for custom global config object
        const config = (window as Window).__GRAPHTY_CONFIG__;
        if (config && typeof config === "object") {
            return config[key];
        }
    }

    return undefined;
}

/**
 * Check if running in Node.js environment
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain, eqeqeq */
export function isNodeEnvironment(): boolean {
    return typeof process !== "undefined" &&
           process.versions != null &&
           process.versions.node != null;
}
/* eslint-enable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain, eqeqeq */

/**
 * Check if running in browser environment
 */
export function isBrowserEnvironment(): boolean {
    return typeof window !== "undefined" &&
           typeof window.document !== "undefined";
}

/**
 * Configuration source for browser environments
 * Can be set by users before loading the library
 *
 * @example
 * window.__GRAPHTY_CONFIG__ = {
 *   GRAPHTY_USE_OPTIMIZED_BFS: 'true',
 *   GRAPHTY_BFS_ALPHA: '15.0'
 * };
 */
declare global {
    interface Window {
        __GRAPHTY_CONFIG__?: Record<string, string>;
    }
}
