import {describe, expect, it} from "vitest";

import {Graph} from "../../../src/core/graph.js";
import {
    getCommonNeighbors,
    getEdgeKey,
    getIntermediateNodes,
    getNodeDegree,
    getTotalEdgeWeight,
    makeUndirected,
    reconstructPath,
    renumberCommunities,
} from "../../../src/utils/graph-utilities.js";

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

describe("getCommonNeighbors", () => {
    it("should find common neighbors in undirected graph", () => {
        const graph = new Graph();
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "C");
        graph.addEdge("B", "D");
        graph.addEdge("C", "D");

        const common = getCommonNeighbors(graph, "A", "B");
        expect(common).toEqual(new Set(["C"]));
    });

    it("should find common neighbors in directed graph", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("A", "C");
        graph.addEdge("B", "C");
        graph.addEdge("A", "D");
        graph.addEdge("B", "D");
        graph.addEdge("C", "E");

        const common = getCommonNeighbors(graph, "A", "B", true);
        expect(common).toEqual(new Set(["C", "D"]));
    });

    it("should return empty set when no common neighbors", () => {
        const graph = new Graph();
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("D", "E");

        const common = getCommonNeighbors(graph, "A", "D");
        expect(common).toEqual(new Set());
    });

    it("should handle nodes with no neighbors", () => {
        const graph = new Graph();
        graph.addNode("A");
        graph.addNode("B");

        const common = getCommonNeighbors(graph, "A", "B");
        expect(common).toEqual(new Set());
    });

    it("should handle self-loops correctly", () => {
        const graph = new Graph();
        graph.addEdge("A", "A");
        graph.addEdge("A", "B");
        graph.addEdge("B", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "C");

        const common = getCommonNeighbors(graph, "A", "B");
        // Both A and B have edges to A, B, and C, so all are common neighbors
        expect(common).toEqual(new Set(["A", "B", "C"]));
    });

    it("should work with numeric node IDs", () => {
        const graph = new Graph();
        graph.addEdge(1, 2);
        graph.addEdge(1, 3);
        graph.addEdge(2, 3);
        graph.addEdge(2, 4);
        graph.addEdge(3, 4);

        const common = getCommonNeighbors(graph, 1, 2);
        expect(common).toEqual(new Set([3]));
    });
});

describe("getIntermediateNodes", () => {
    it("should find intermediate nodes in directed path", () => {
        const graph = new Graph({directed: true});
        // Path: A -> B -> C and A -> D -> C
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("A", "D");
        graph.addEdge("D", "C");

        const intermediate = getIntermediateNodes(graph, "A", "C");
        expect(intermediate).toEqual(new Set(["B", "D"]));
    });

    it("should return empty set when no intermediate nodes exist", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("A", "B");
        graph.addEdge("C", "D");

        const intermediate = getIntermediateNodes(graph, "A", "D");
        expect(intermediate).toEqual(new Set());
    });

    it("should handle direct edges", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("B", "C");

        const intermediate = getIntermediateNodes(graph, "A", "C");
        expect(intermediate).toEqual(new Set(["B"])); // Only B forms A->B->C
    });

    it("should work with numeric node IDs", () => {
        const graph = new Graph({directed: true});
        graph.addEdge(1, 2);
        graph.addEdge(2, 3);
        graph.addEdge(1, 4);
        graph.addEdge(4, 3);

        const intermediate = getIntermediateNodes(graph, 1, 3);
        expect(intermediate).toEqual(new Set([2, 4]));
    });

    it("should handle nodes with no outgoing or incoming edges", () => {
        const graph = new Graph({directed: true});
        graph.addNode("A");
        graph.addNode("B");

        const intermediate = getIntermediateNodes(graph, "A", "B");
        expect(intermediate).toEqual(new Set());
    });
});

describe("getEdgeKey", () => {
    it("should generate consistent keys for undirected edges", () => {
        const key1 = getEdgeKey("A", "B", false);
        const key2 = getEdgeKey("B", "A", false);
        expect(key1).toBe(key2);
        expect(key1).toBe("A-B");
    });

    it("should generate directional keys for directed edges", () => {
        const key1 = getEdgeKey("A", "B", true);
        const key2 = getEdgeKey("B", "A", true);
        expect(key1).not.toBe(key2);
        expect(key1).toBe("A->B");
        expect(key2).toBe("B->A");
    });

    it("should handle numeric node IDs", () => {
        expect(getEdgeKey(1, 2, false)).toBe("1-2");
        expect(getEdgeKey(2, 1, false)).toBe("1-2");
        expect(getEdgeKey(1, 2, true)).toBe("1->2");
        expect(getEdgeKey(2, 1, true)).toBe("2->1");
    });

    it("should handle string comparison correctly", () => {
        // Test lexicographic ordering
        expect(getEdgeKey("B", "A", false)).toBe("A-B");
        expect(getEdgeKey("10", "2", false)).toBe("10-2"); // String comparison
        expect(getEdgeKey("Z", "A", false)).toBe("A-Z");
    });

    it("should handle self-loops", () => {
        expect(getEdgeKey("A", "A", false)).toBe("A-A");
        expect(getEdgeKey("A", "A", true)).toBe("A->A");
    });
});

describe("getTotalEdgeWeight", () => {
    it("should calculate total weight for undirected graph", () => {
        const graph = new Graph({directed: false});
        graph.addEdge("A", "B", 2);
        graph.addEdge("B", "C", 3);
        graph.addEdge("C", "A", 4);

        expect(getTotalEdgeWeight(graph)).toBe(4.5); // (2 + 3 + 4) / 2 for undirected
    });

    it("should calculate total weight for directed graph", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("A", "B", 2);
        graph.addEdge("B", "C", 3);
        graph.addEdge("C", "A", 4);

        expect(getTotalEdgeWeight(graph)).toBe(9); // All edges counted once
    });

    it("should use weight 1 for unweighted edges", () => {
        const graph = new Graph();
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");
        graph.addEdge("C", "A");

        expect(getTotalEdgeWeight(graph)).toBe(1.5); // 3 / 2 for undirected
    });

    it("should handle mixed weighted and unweighted edges", () => {
        const graph = new Graph();
        graph.addEdge("A", "B", 5);
        graph.addEdge("B", "C"); // Default weight 1
        graph.addEdge("C", "A", 3);

        expect(getTotalEdgeWeight(graph)).toBe(4.5); // (5 + 1 + 3) / 2 for undirected
    });

    it("should return 0 for empty graph", () => {
        const graph = new Graph();
        expect(getTotalEdgeWeight(graph)).toBe(0);
    });

    it("should handle graph with only nodes", () => {
        const graph = new Graph();
        graph.addNode("A");
        graph.addNode("B");
        expect(getTotalEdgeWeight(graph)).toBe(0);
    });
});

describe("getNodeDegree", () => {
    it("should return total degree for undirected graph", () => {
        const graph = new Graph({directed: false});
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("A", "D");

        expect(getNodeDegree(graph, "A")).toBe(3);
        expect(getNodeDegree(graph, "B")).toBe(1);
    });

    it("should return total degree for directed graph with default mode", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("D", "A");

        expect(getNodeDegree(graph, "A")).toBe(3); // 2 out + 1 in
        expect(getNodeDegree(graph, "A", "total")).toBe(3);
    });

    it("should return in-degree for directed graph", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("B", "A");
        graph.addEdge("C", "A");
        graph.addEdge("A", "D");

        expect(getNodeDegree(graph, "A", "in")).toBe(2);
    });

    it("should return out-degree for directed graph", () => {
        const graph = new Graph({directed: true});
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");
        graph.addEdge("D", "A");

        expect(getNodeDegree(graph, "A", "out")).toBe(2);
    });

    it("should ignore mode for undirected graphs", () => {
        const graph = new Graph({directed: false});
        graph.addEdge("A", "B");
        graph.addEdge("A", "C");

        expect(getNodeDegree(graph, "A", "in")).toBe(2);
        expect(getNodeDegree(graph, "A", "out")).toBe(2);
        expect(getNodeDegree(graph, "A", "total")).toBe(2);
    });

    it("should handle isolated nodes", () => {
        const graph = new Graph();
        graph.addNode("A");

        expect(getNodeDegree(graph, "A")).toBe(0);
        expect(getNodeDegree(graph, "A", "in")).toBe(0);
        expect(getNodeDegree(graph, "A", "out")).toBe(0);
    });
});

describe("makeUndirected", () => {
    it("should return same graph if already undirected", () => {
        const graph = new Graph({directed: false});
        graph.addEdge("A", "B");
        graph.addEdge("B", "C");

        const result = makeUndirected(graph);
        expect(result).toBe(graph); // Same instance
    });

    it("should convert directed graph to undirected", () => {
        const directed = new Graph({directed: true});
        directed.addEdge("A", "B", 2);
        directed.addEdge("B", "C", 3);
        directed.addEdge("C", "A", 4);

        const undirected = makeUndirected(directed);
        expect(undirected.isDirected).toBe(false);
        expect(undirected.hasEdge("A", "B")).toBe(true);
        expect(undirected.hasEdge("B", "A")).toBe(true);
        expect(undirected.getEdge("A", "B")?.weight).toBe(2);
    });

    it("should preserve node data", () => {
        const directed = new Graph({directed: true});
        directed.addNode("A", {value: 1});
        directed.addNode("B", {value: 2});
        directed.addEdge("A", "B");

        const undirected = makeUndirected(directed);
        expect(undirected.getNode("A")?.data).toEqual({value: 1});
        expect(undirected.getNode("B")?.data).toEqual({value: 2});
    });

    it("should preserve edge data and weights", () => {
        const directed = new Graph({directed: true});
        directed.addEdge("A", "B", 5, {type: "strong"});
        directed.addEdge("B", "C", 3, {type: "weak"});

        const undirected = makeUndirected(directed);
        const edgeAB = Array.from(undirected.edges()).find(
            (e) => (e.source === "A" && e.target === "B") || (e.source === "B" && e.target === "A"),
        );
        expect(edgeAB?.weight).toBe(5);
        expect(edgeAB?.data).toEqual({type: "strong"});
    });

    it("should handle bidirectional edges correctly", () => {
        const directed = new Graph({directed: true});
        directed.addEdge("A", "B", 2);
        directed.addEdge("B", "A", 3); // Different weight in reverse

        const undirected = makeUndirected(directed);
        expect(undirected.hasEdge("A", "B")).toBe(true);
        expect(undirected.hasEdge("B", "A")).toBe(true);
        // Should keep first encountered edge weight
        expect(undirected.getEdge("A", "B")?.weight).toBe(2);
    });

    it("should handle isolated nodes", () => {
        const directed = new Graph({directed: true});
        directed.addNode("A");
        directed.addNode("B");
        directed.addEdge("C", "D");

        const undirected = makeUndirected(directed);
        expect(undirected.hasNode("A")).toBe(true);
        expect(undirected.hasNode("B")).toBe(true);
        expect(undirected.degree("A")).toBe(0);
    });
});

describe("renumberCommunities", () => {
    it("should renumber communities consecutively from 0", () => {
        const communities = new Map([
            ["A", 5],
            ["B", 5],
            ["C", 10],
            ["D", 10],
            ["E", 3],
        ]);

        const renumbered = renumberCommunities(communities);
        const uniqueValues = new Set(renumbered.values());
        expect(uniqueValues.size).toBe(3);
        expect(Array.from(uniqueValues).sort()).toEqual([0, 1, 2]);
    });

    it("should preserve community groupings", () => {
        const communities = new Map([
            ["A", 100],
            ["B", 100],
            ["C", 200],
            ["D", 200],
            ["E", 300],
        ]);

        const renumbered = renumberCommunities(communities);
        // Nodes in same original community should still be together
        expect(renumbered.get("A")).toBe(renumbered.get("B"));
        expect(renumbered.get("C")).toBe(renumbered.get("D"));
        expect(renumbered.get("E")).not.toBe(renumbered.get("A"));
        expect(renumbered.get("E")).not.toBe(renumbered.get("C"));
    });

    it("should handle single community", () => {
        const communities = new Map([
            ["A", 42],
            ["B", 42],
            ["C", 42],
        ]);

        const renumbered = renumberCommunities(communities);
        expect(renumbered.get("A")).toBe(0);
        expect(renumbered.get("B")).toBe(0);
        expect(renumbered.get("C")).toBe(0);
    });

    it("should handle empty map", () => {
        const communities = new Map();
        const renumbered = renumberCommunities(communities);
        expect(renumbered.size).toBe(0);
    });

    it("should handle negative community IDs", () => {
        const communities = new Map([
            ["A", -5],
            ["B", -5],
            ["C", 0],
            ["D", 10],
        ]);

        const renumbered = renumberCommunities(communities);
        expect(new Set(renumbered.values())).toEqual(new Set([0, 1, 2]));
    });

    it("should work with non-string node types", () => {
        const communities = new Map([
            [1, 100],
            [2, 100],
            [3, 200],
            [{id: "A"}, 200],
        ]);

        const renumbered = renumberCommunities(communities);
        expect(renumbered.get(1)).toBe(renumbered.get(2));
        // Can't use object literal as key - need the same object reference
        const objKey = {id: "A"};
        expect(renumbered.has(objKey)).toBe(false); // Different object reference
        expect(renumbered.size).toBe(4);
    });
});
