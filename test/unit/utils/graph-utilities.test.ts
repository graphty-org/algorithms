import {describe, expect, it} from "vitest";

import {reconstructPath} from "../../../src/utils/graph-utilities.js";

describe("reconstructPath", () => {
    it("should reconstruct simple path", () => {
        const predecessor = new Map([
            ["D", "C"],
            ["C", "B"],
            ["B", "A"],
            ["A", null],
        ]);

        expect(reconstructPath("D", predecessor)).toEqual(["A", "B", "C", "D"]);
    });

    it("should return empty array for unreachable target", () => {
        const predecessor = new Map([
            ["A", null],
            ["B", "A"],
        ]);

        expect(reconstructPath("C", predecessor)).toEqual([]);
    });

    it("should handle single node path", () => {
        const predecessor = new Map([["A", null]]);
        expect(reconstructPath("A", predecessor)).toEqual(["A"]);
    });

    it("should work with numeric node IDs", () => {
        const predecessor = new Map([
            [4, 3],
            [3, 2],
            [2, 1],
            [1, null],
        ]);

        expect(reconstructPath(4, predecessor)).toEqual([1, 2, 3, 4]);
    });

    it("should handle complex object node IDs", () => {
        interface Node {
            id: string;
            value: number;
        }

        const nodeA: Node = {id: "A", value: 1};
        const nodeB: Node = {id: "B", value: 2};
        const nodeC: Node = {id: "C", value: 3};

        const predecessor = new Map<Node, Node | null>([
            [nodeC, nodeB],
            [nodeB, nodeA],
            [nodeA, null],
        ]);

        expect(reconstructPath(nodeC, predecessor)).toEqual([nodeA, nodeB, nodeC]);
    });

    it("should handle empty predecessor map", () => {
        const predecessor = new Map<string, string | null>();
        expect(reconstructPath("A", predecessor)).toEqual([]);
    });

    it("should handle disconnected path gracefully", () => {
        // Path that doesn't lead to source (no null predecessor)
        const predecessor = new Map([
            ["A", "B"],
            ["B", "C"],
            // C has no predecessor, creating a disconnected path
        ]);

        // Should return empty array since there's no complete path to source
        expect(reconstructPath("A", predecessor)).toEqual([]);
    });
});
