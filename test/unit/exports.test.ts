import {describe, expect, it} from "vitest";

import type {
    ClosenessCentralityOptions,
    FlowEdge,
    FlowNetwork,
    LeidenOptions,
    LeidenResult,
    MaxFlowResult,
    SpectralClusteringOptions,
    SpectralClusteringResult,
    TeraHACClusterNode,
    TeraHACConfig,
    TeraHACResult,
} from "../../src/index.js";

describe("Type exports", () => {
    it("should export all algorithm option types", () => {
        // These tests verify TypeScript compilation succeeds
        const closeOptions: ClosenessCentralityOptions = {normalized: true};
        const spectralOptions: SpectralClusteringOptions = {k: 3};
        const terahacConfig: TeraHACConfig = {numClusters: 5};
        const leidenOptions: LeidenOptions = {resolution: 1.0};

        expect(closeOptions).toBeDefined();
        expect(spectralOptions).toBeDefined();
        expect(terahacConfig).toBeDefined();
        expect(leidenOptions).toBeDefined();
    });

    it("should export all result types", () => {
        // Type assertion tests
        const spectralResult = {} as SpectralClusteringResult;
        const terahacResult = {} as TeraHACResult;
        const leidenResult = {} as LeidenResult;
        const flowResult = {} as MaxFlowResult;

        expect(spectralResult).toBeDefined();
        expect(terahacResult).toBeDefined();
        expect(leidenResult).toBeDefined();
        expect(flowResult).toBeDefined();
    });

    it("should export flow network types", () => {
        const flowEdge: FlowEdge = {
            from: "a",
            to: "b",
            capacity: 10,
            flow: 5,
        };
        const flowNetwork: FlowNetwork = {
            nodes: new Set(["a", "b"]),
            edges: new Map(),
        };

        expect(flowEdge).toBeDefined();
        expect(flowNetwork).toBeDefined();
    });

    it("should export clustering types", () => {
        const clusterNode: TeraHACClusterNode = {
            id: "cluster-1",
            members: new Set(["a", "b"]),
            distance: 0.5,
            size: 2,
        };

        expect(clusterNode).toBeDefined();
    });
});
