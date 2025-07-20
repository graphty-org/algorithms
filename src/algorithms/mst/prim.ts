import {Graph} from "../../core/graph.js";
import {PriorityQueue} from "../../data-structures/priority-queue.js";
import type {Edge, NodeId} from "../../types/index.js";
import type {MSTResult} from "./kruskal.js";

export function primMST(graph: Graph, startNode?: NodeId): MSTResult {
    if (graph.isDirected) {
        throw new Error("Prim's algorithm requires an undirected graph");
    }

    const nodes = Array.from(graph.nodes());
    if (nodes.length === 0) {
        return {
            edges: [],
            totalWeight: 0,
        };
    }

    const start = startNode ?? nodes[0]?.id;
    if (!start) {
        return {
            edges: [],
            totalWeight: 0,
        };
    }

    if (!graph.hasNode(start)) {
        throw new Error(`Start node ${String(start)} not found in graph`);
    }

    const visited = new Set<NodeId>();
    const mstEdges: Edge[] = [];
    let totalWeight = 0;

    const pq = new PriorityQueue<Edge>();

    visited.add(start);

    for (const neighbor of Array.from(graph.neighbors(start))) {
        const edge = graph.getEdge(start, neighbor);
        if (edge) {
            pq.enqueue(edge, edge.weight ?? 0);
        }
    }

    while (!pq.isEmpty() && mstEdges.length < graph.nodeCount - 1) {
        const edge = pq.dequeue();
        if (!edge) {
            continue;
        }

        const unvisitedNode = visited.has(edge.source) ? edge.target : edge.source;

        if (visited.has(unvisitedNode)) {
            continue;
        }

        visited.add(unvisitedNode);
        mstEdges.push(edge);
        totalWeight += edge.weight ?? 0;

        for (const neighbor of Array.from(graph.neighbors(unvisitedNode))) {
            if (!visited.has(neighbor)) {
                const neighborEdge = graph.getEdge(unvisitedNode, neighbor);
                if (neighborEdge) {
                    pq.enqueue(neighborEdge, neighborEdge.weight ?? 0);
                }
            }
        }
    }

    if (mstEdges.length !== graph.nodeCount - 1) {
        throw new Error("Graph is not connected");
    }

    return {
        edges: mstEdges,
        totalWeight,
    };
}
