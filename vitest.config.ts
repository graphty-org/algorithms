import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: "default",
                    globals: true,
                    environment: "happy-dom",
                    pool: "forks",
                    testTimeout: 30000,
                    exclude: [
                        // Browser-specific tests
                        "test/browser/**/*.test.ts",
                        // Standard vitest excludes
                        "**/node_modules/**",
                        "**/dist/**",
                        "**/.{idea,git,cache,output,temp}/**",
                        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
                    ],
                    include: [
                        "test/**/*.test.ts",
                        "src/**/*.test.ts",
                    ],
                },
            },
            {
                test: {
                    name: "browser",
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: "playwright",
                        instances: [{browser: "chromium"}],
                    },
                    include: [
                        "test/browser/**/*.test.ts",
                    ],
                    testTimeout: 60000,
                },
            },
        ],
        coverage: {
            all: true,
            provider: "v8",
            reporter: ["text", "json-summary", "json", "lcov", "html"],
            include: ["src/**/*.ts"],
            exclude: [
                "**/*.d.ts",
                "**/*.test.ts",
                "**/*.spec.ts",
                "**/types/**",
                "**/index.ts", // Usually just re-exports
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 75,
                statements: 80,
            },
        },
        reporters: ["verbose"],
        slowTestThreshold: 5000,
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
});
