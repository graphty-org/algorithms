import {Graph} from "../../src/core/graph";

/**
 * Helper function to create Graph from Map representation
 * Used in tests that were previously using Map directly
 */
export function createGraphFromMap(
    map: Map<string, Map<string, number>>,
    directed = true,
): Graph {
    const graph = new Graph({directed});

    // Add all nodes
    for (const node of map.keys()) {
        graph.addNode(node);
    }

    // Add all edges
    for (const [source, neighbors] of map) {
        for (const [target, weight] of neighbors) {
            graph.addEdge(source, target, weight);
        }
    }

    return graph;
}

/**
 * Helper function to create Graph from adjacency set representation
 * Used for clustering algorithm tests
 */
export function createGraphFromAdjacencySet<T extends string | number>(
    adjacencySet: Map<T, Set<T>>,
    directed = false,
): Graph {
    const graph = new Graph({directed});

    // Add all nodes
    for (const node of adjacencySet.keys()) {
        graph.addNode(node);
    }

    // Add all edges
    const addedEdges = new Set<string>();
    for (const [source, neighbors] of adjacencySet) {
        for (const target of neighbors) {
            if (!directed) {
                // For undirected graphs, only add each edge once
                const edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`;
                if (!addedEdges.has(edgeKey)) {
                    graph.addEdge(source, target);
                    addedEdges.add(edgeKey);
                }
            } else {
                graph.addEdge(source, target);
            }
        }
    }

    return graph;
}
