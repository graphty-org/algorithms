import type {Graph} from "../../core/graph.js";
import type {CentralityOptions, CentralityResult} from "../../types/index.js";

/**
 * Degree centrality implementation
 *
 * Measures the importance of a node based on the number of connections it has.
 * The most basic centrality measure that simply counts incident edges.
 */

/**
 * Calculate degree centrality for all nodes in the graph
 */
export function degreeCentrality(
    graph: Graph,
    options: CentralityOptions = {},
): CentralityResult {
    const centrality: CentralityResult = {};
    const {nodeCount} = graph;

    // Calculate normalization factor (same for both directed and undirected graphs)
    const maxPossibleDegree = nodeCount - 1;

    for (const node of graph.nodes()) {
        let degree: number;

        if (graph.isDirected && options.mode) {
            // For directed graphs, calculate specific degree type
            switch (options.mode) {
                case "in": {
                    degree = graph.inDegree(node.id);
                    break;
                }
                case "out": {
                    degree = graph.outDegree(node.id);
                    break;
                }
                case "total": {
                    degree = graph.degree(node.id);
                    break;
                }
                default: {
                    degree = graph.degree(node.id);
                }
            }
        } else {
            // For undirected graphs or default case
            degree = graph.degree(node.id);
        }

        // Apply normalization if requested
        const normalizedDegree = options.normalized && maxPossibleDegree > 0 ?
            degree / maxPossibleDegree :
            degree;

        centrality[node.id.toString()] = normalizedDegree;
    }

    return centrality;
}

/**
 * Calculate degree centrality for a specific node
 */
export function nodeDegreeCentrality(
    graph: Graph,
    nodeId: string | number,
    options: CentralityOptions = {},
): number {
    if (!graph.hasNode(nodeId)) {
        throw new Error(`Node ${String(nodeId)} not found in graph`);
    }

    const {nodeCount} = graph;
    let degree: number;

    if (graph.isDirected && options.mode) {
        switch (options.mode) {
            case "in": {
                degree = graph.inDegree(nodeId);
                break;
            }
            case "out": {
                degree = graph.outDegree(nodeId);
                break;
            }
            case "total": {
                degree = graph.degree(nodeId);
                break;
            }
            default: {
                degree = graph.degree(nodeId);
            }
        }
    } else {
        degree = graph.degree(nodeId);
    }

    // Apply normalization if requested
    const maxPossibleDegree = nodeCount - 1;

    return options.normalized && maxPossibleDegree > 0 ?
        degree / maxPossibleDegree :
        degree;
}
