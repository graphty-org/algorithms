import {Graph} from "../../core/graph.js";
import type {NodeId} from "../../types/index.js";

export interface FloydWarshallResult {
    distances: Map<NodeId, Map<NodeId, number>>;
    predecessors: Map<NodeId, Map<NodeId, NodeId | null>>;
    hasNegativeCycle: boolean;
}

export function floydWarshall(graph: Graph): FloydWarshallResult {
    const nodes = Array.from(graph.nodes()).map((n) => n.id);
    const distances = new Map<NodeId, Map<NodeId, number>>();
    const predecessors = new Map<NodeId, Map<NodeId, NodeId | null>>();

    for (const node of nodes) {
        distances.set(node, new Map());
        predecessors.set(node, new Map());

        const nodeDistances = distances.get(node);
        const nodePredecessors = predecessors.get(node);

        if (!nodeDistances || !nodePredecessors) {
            continue;
        }

        for (const other of nodes) {
            if (node === other) {
                nodeDistances.set(other, 0);
                nodePredecessors.set(other, null);
            } else {
                nodeDistances.set(other, Infinity);
                nodePredecessors.set(other, null);
            }
        }
    }

    for (const edge of Array.from(graph.edges())) {
        const weight = edge.weight ?? 1;
        const sourceDistances = distances.get(edge.source);
        const sourcePredecessors = predecessors.get(edge.source);

        if (sourceDistances && sourcePredecessors) {
            sourceDistances.set(edge.target, weight);
            sourcePredecessors.set(edge.target, edge.source);
        }

        if (!graph.isDirected) {
            const targetDistances = distances.get(edge.target);
            const targetPredecessors = predecessors.get(edge.target);

            if (targetDistances && targetPredecessors) {
                targetDistances.set(edge.source, weight);
                targetPredecessors.set(edge.source, edge.target);
            }
        }
    }

    for (const k of nodes) {
        for (const i of nodes) {
            for (const j of nodes) {
                const distancesI = distances.get(i);
                const distancesK = distances.get(k);
                const predecessorsI = predecessors.get(i);
                const predecessorsK = predecessors.get(k);

                if (!distancesI || !distancesK || !predecessorsI || !predecessorsK) {
                    continue;
                }

                const distIK = distancesI.get(k);
                const distKJ = distancesK.get(j);
                const distIJ = distancesI.get(j);

                if (distIK === undefined || distKJ === undefined || distIJ === undefined) {
                    continue;
                }

                if (distIK + distKJ < distIJ) {
                    distancesI.set(j, distIK + distKJ);
                    const predKJ = predecessorsK.get(j);
                    predecessorsI.set(j, predKJ ?? null);
                }
            }
        }
    }

    let hasNegativeCycle = false;
    for (const node of nodes) {
        const nodeDistances = distances.get(node);
        if (!nodeDistances) {
            continue;
        }

        const selfDistance = nodeDistances.get(node);
        if (selfDistance !== undefined && selfDistance < 0) {
            hasNegativeCycle = true;
            break;
        }
    }

    return {
        distances,
        predecessors,
        hasNegativeCycle,
    };
}

export function floydWarshallPath(
    graph: Graph,
    source: NodeId,
    target: NodeId,
): {path: NodeId[], distance: number} | null {
    const result = floydWarshall(graph);

    if (!graph.hasNode(source) || !graph.hasNode(target)) {
        return null;
    }

    const sourceDistances = result.distances.get(source);
    if (!sourceDistances) {
        return null;
    }

    const distance = sourceDistances.get(target);
    if (distance === undefined || distance === Infinity) {
        return null;
    }

    const path: NodeId[] = [];
    let current: NodeId | null = target;

    while (current !== null && current !== source) {
        path.unshift(current);

        const sourcePredecessors = result.predecessors.get(source);
        if (!sourcePredecessors) {
            return null;
        }

        current = sourcePredecessors.get(current) ?? null;

        if (path.length > graph.nodeCount) {
            return null;
        }
    }

    if (current === source) {
        path.unshift(source);
        return {path, distance};
    }

    return null;
}

export function transitiveClosure(graph: Graph): Map<NodeId, Set<NodeId>> {
    const result = floydWarshall(graph);
    const closure = new Map<NodeId, Set<NodeId>>();

    for (const [source, distances] of Array.from(result.distances)) {
        const reachable = new Set<NodeId>();
        for (const [target, distance] of Array.from(distances)) {
            if (distance < Infinity) {
                reachable.add(target);
            }
        }
        closure.set(source, reachable);
    }

    return closure;
}
