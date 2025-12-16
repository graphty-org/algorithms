import {describe, expect, it} from "vitest";

import {spectralClustering} from "../../src/clustering/spectral.js";
import {Graph} from "../../src/core/graph.js";
import {teraHAC} from "../../src/research/terahac.js";

describe("Input validation", () => {
    describe("spectralClustering", () => {
        it("should throw for negative k", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            expect(() => {
                spectralClustering(graph, {k: -1});
            }).toThrow("k must be a positive integer");
        });

        it("should throw for k = 0", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            expect(() => {
                spectralClustering(graph, {k: 0});
            }).toThrow("k must be a positive integer");
        });

        it("should throw for non-integer k", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            expect(() => {
                spectralClustering(graph, {k: 2.5});
            }).toThrow("k must be a positive integer");
        });

        it("should accept valid k value", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");
            graph.addEdge("C", "A");

            // Should not throw
            const result = spectralClustering(graph, {k: 2});
            expect(result.communities.length).toBeGreaterThan(0);
        });
    });

    describe("teraHAC", () => {
        it("should throw for negative numClusters", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            expect(() => {
                teraHAC(graph, {numClusters: -1});
            }).toThrow("numClusters must be a positive integer");
        });

        it("should throw for numClusters = 0", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            expect(() => {
                teraHAC(graph, {numClusters: 0});
            }).toThrow("numClusters must be a positive integer");
        });

        it("should throw for non-integer numClusters", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            expect(() => {
                teraHAC(graph, {numClusters: 1.5});
            }).toThrow("numClusters must be a positive integer");
        });

        it("should accept valid numClusters value", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");
            graph.addEdge("B", "C");

            // Should not throw
            const result = teraHAC(graph, {numClusters: 2});
            expect(result.dendrogram).toBeDefined();
        });

        it("should accept undefined numClusters", () => {
            const graph = new Graph();
            graph.addEdge("A", "B");

            // Should not throw when numClusters is not specified
            const result = teraHAC(graph, {});
            expect(result.dendrogram).toBeDefined();
        });
    });
});
