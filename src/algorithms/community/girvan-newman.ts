import {Graph} from "../../core/graph.js";
import type {CommunityResult, GirvanNewmanOptions, NodeId, ComponentResult} from "../../types/index.js";
import {connectedComponents} from "../components/connected.js";

/**
 * Girvan-Newman community detection algorithm
 *
 * Implements the Girvan-Newman method for community detection by iteratively
 * removing edges with the highest betweenness centrality until the graph
 * splits into disconnected components.
 *
 * This is a divisive hierarchical clustering algorithm that produces a
 * dendrogram of community structures.
 *
 * References:
 * - Girvan, M., & Newman, M. E. J. (2002). Community structure in social
 *   and biological networks. Proceedings of the National Academy of Sciences,
 *   99(12), 7821-7826.
 *
 * @param graph - The input graph
 * @param options - Algorithm options
 * @returns Array of community detection results representing the dendrogram
 */
export function girvanNewman(
    graph: Graph,
    options: GirvanNewmanOptions = {}
): CommunityResult[] {
    const maxCommunities = options.maxCommunities;
    const minCommunitySize = options.minCommunitySize ?? 1;
    
    const dendrogram: CommunityResult[] = [];
    const workingGraph = cloneGraph(graph);
    
    // Initial state: one large component
    let components = getConnectedComponentsResult(workingGraph);
    dendrogram.push({
        communities: components.components.filter(community => community.length >= minCommunitySize),
        modularity: calculateModularity(graph, components.componentMap)
    });

    while (Array.from(workingGraph.edges()).length > 0) {
        // Calculate edge betweenness centrality
        const edgeBetweenness = calculateEdgeBetweenness(workingGraph);
        
        if (edgeBetweenness.size === 0) {
            break;
        }

        // Find edges with maximum betweenness
        const maxBetweenness = Math.max(...edgeBetweenness.values());
        const edgesToRemove: Array<{source: NodeId; target: NodeId}> = [];
        
        for (const [edgeKey, centrality] of edgeBetweenness) {
            if (Math.abs(centrality - maxBetweenness) < 1e-10) {
                const [source, target] = edgeKey.split('|');
                if (source && target) {
                    edgesToRemove.push({source, target});
                }
            }
        }

        // Remove edges with highest betweenness
        for (const {source, target} of edgesToRemove) {
            workingGraph.removeEdge(source, target);
        }

        // Find new connected components (communities)
        components = getConnectedComponentsResult(workingGraph);
        
        // Filter communities by minimum size
        const validCommunities = components.components.filter(
            community => community.length >= minCommunitySize
        );

        // Calculate modularity for the new community structure
        const modularity = calculateModularity(graph, components.componentMap);
        
        dendrogram.push({
            communities: validCommunities,
            modularity
        });

        // Stop if desired number of communities reached
        if (maxCommunities && validCommunities.length >= maxCommunities) {
            break;
        }

        // Stop if no more meaningful communities can be formed
        if (validCommunities.length === workingGraph.nodeCount) {
            break;
        }
    }

    return dendrogram;
}

/**
 * Calculate edge betweenness centrality for all edges in the graph
 * 
 * Edge betweenness is the fraction of shortest paths that pass through the edge.
 * We adapt node betweenness centrality calculation to work with edges.
 */
function calculateEdgeBetweenness(graph: Graph): Map<string, number> {
    const edgeBetweenness = new Map<string, number>();
    
    // Initialize all edges with 0 betweenness
    for (const edge of graph.edges()) {
        const edgeKey = getEdgeKey(edge.source, edge.target);
        edgeBetweenness.set(edgeKey, 0);
    }

    // For each node as source, calculate shortest paths and accumulate edge betweenness
    for (const sourceNode of graph.nodes()) {
        const source = sourceNode.id;
        
        // Run BFS to find all shortest paths from source
        const {distances, predecessors, pathCounts} = findAllShortestPaths(graph, source);
        
        // Calculate dependency for each node and accumulate edge betweenness
        const dependency = new Map<NodeId, number>();
        
        // Initialize dependency
        for (const node of graph.nodes()) {
            dependency.set(node.id, 0);
        }

        // Process nodes in order of decreasing distance
        const sortedNodes = Array.from(distances.keys())
            .filter(node => distances.get(node)! < Infinity)
            .sort((a, b) => distances.get(b)! - distances.get(a)!);

        for (const node of sortedNodes) {
            if (node === source) continue;
            
            const nodeDependency = dependency.get(node)!;
            const nodePathCount = pathCounts.get(node)!;
            
            // Distribute dependency to predecessors
            const nodePredecessors = predecessors.get(node) || [];
            for (const predecessor of nodePredecessors) {
                const predPathCount = pathCounts.get(predecessor)!;
                const edgeDependency = (predPathCount / nodePathCount) * (1 + nodeDependency);
                
                // Update predecessor dependency
                dependency.set(predecessor, dependency.get(predecessor)! + edgeDependency);
                
                // Update edge betweenness
                const edgeKey = getEdgeKey(predecessor, node);
                const currentBetweenness = edgeBetweenness.get(edgeKey) || 0;
                edgeBetweenness.set(edgeKey, currentBetweenness + edgeDependency);
            }
        }
    }

    // Normalize: divide by 2 for undirected graphs (each edge counted twice)
    if (!graph.isDirected) {
        for (const [edgeKey, betweenness] of edgeBetweenness) {
            edgeBetweenness.set(edgeKey, betweenness / 2);
        }
    }

    return edgeBetweenness;
}

/**
 * Find all shortest paths from a source node using BFS
 */
function findAllShortestPaths(graph: Graph, source: NodeId) {
    const distances = new Map<NodeId, number>();
    const predecessors = new Map<NodeId, NodeId[]>();
    const pathCounts = new Map<NodeId, number>();
    const queue: NodeId[] = [];

    // Initialize
    for (const node of graph.nodes()) {
        distances.set(node.id, Infinity);
        predecessors.set(node.id, []);
        pathCounts.set(node.id, 0);
    }

    distances.set(source, 0);
    pathCounts.set(source, 1);
    queue.push(source);

    // BFS
    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentDistance = distances.get(current)!;

        for (const neighbor of graph.neighbors(current)) {
            const edge = graph.getEdge(current, neighbor);
            const edgeWeight = edge?.weight ?? 1;
            const newDistance = currentDistance + edgeWeight;
            const neighborDistance = distances.get(neighbor)!;

            if (newDistance < neighborDistance) {
                // Found shorter path
                distances.set(neighbor, newDistance);
                predecessors.set(neighbor, [current]);
                pathCounts.set(neighbor, pathCounts.get(current)!);
                queue.push(neighbor);
            } else if (Math.abs(newDistance - neighborDistance) < 1e-10) {
                // Found alternative shortest path
                predecessors.get(neighbor)!.push(current);
                pathCounts.set(neighbor, pathCounts.get(neighbor)! + pathCounts.get(current)!);
            }
        }
    }

    return {distances, predecessors, pathCounts};
}

/**
 * Generate a consistent edge key for undirected graphs
 */
function getEdgeKey(source: NodeId, target: NodeId): string {
    // For undirected graphs, ensure consistent ordering
    if (source <= target) {
        return `${source}|${target}`;
    } else {
        return `${target}|${source}`;
    }
}

/**
 * Calculate modularity for a given community structure
 */
function calculateModularity(
    graph: Graph,
    communityMap: Map<NodeId, number>
): number {
    const totalEdgeWeight = getTotalEdgeWeight(graph);
    if (totalEdgeWeight === 0) return 0;

    let modularity = 0;

    // Calculate modularity: Q = (1/2m) * Σ[A_ij - (k_i * k_j)/(2m)] * δ(c_i, c_j)
    for (const nodeI of graph.nodes()) {
        for (const nodeJ of graph.nodes()) {
            if (communityMap.get(nodeI.id) === communityMap.get(nodeJ.id)) {
                const edge = graph.getEdge(nodeI.id, nodeJ.id);
                const edgeWeight = edge?.weight ?? 0;
                
                const degreeI = getNodeDegree(graph, nodeI.id);
                const degreeJ = getNodeDegree(graph, nodeJ.id);
                
                modularity += edgeWeight - (degreeI * degreeJ) / (2 * totalEdgeWeight);
            }
        }
    }

    return modularity / (2 * totalEdgeWeight);
}

/**
 * Calculate total edge weight in the graph
 */
function getTotalEdgeWeight(graph: Graph): number {
    let totalWeight = 0;
    
    for (const edge of graph.edges()) {
        totalWeight += edge.weight ?? 1;
    }
    
    return totalWeight;
}

/**
 * Get the total degree (sum of edge weights) for a node
 */
function getNodeDegree(graph: Graph, nodeId: NodeId): number {
    let degree = 0;
    
    for (const neighbor of graph.neighbors(nodeId)) {
        const edge = graph.getEdge(nodeId, neighbor);
        degree += edge?.weight ?? 1;
    }
    
    return degree;
}

/**
 * Convert connected components result to ComponentResult format
 */
function getConnectedComponentsResult(graph: Graph): ComponentResult {
    const components = connectedComponents(graph);
    const componentMap = new Map<NodeId, number>();
    
    components.forEach((component, index) => {
        component.forEach(nodeId => {
            componentMap.set(nodeId, index);
        });
    });
    
    return { components, componentMap };
}

/**
 * Create a deep clone of the graph
 */
function cloneGraph(graph: Graph): Graph {
    const clone = new Graph({
        directed: graph.isDirected,
        allowSelfLoops: true,
        allowParallelEdges: false
    });

    // Add all nodes
    for (const node of graph.nodes()) {
        clone.addNode(node.id, node.data);
    }

    // Add all edges
    for (const edge of graph.edges()) {
        clone.addEdge(edge.source, edge.target, edge.weight, edge.data);
    }

    return clone;
}