/**
 * Label Propagation Algorithm for Community Detection
 *
 * A fast, near-linear time algorithm that detects communities by
 * propagating labels through the network. Each node adopts the label
 * that most of its neighbors have.
 *
 * Reference: Raghavan et al. (2007) "Near linear time algorithm to
 * detect community structures in large-scale networks"
 */

export interface LabelPropagationOptions {
    maxIterations?: number;
    randomSeed?: number;
}

export interface LabelPropagationResult {
    communities: Map<string, number>;
    iterations: number;
    converged: boolean;
}

/**
 * Label Propagation Algorithm
 * Each node adopts the most frequent label among its neighbors
 *
 * @param graph - Undirected graph (can be weighted)
 * @param options - Algorithm options
 * @returns Community assignments
 *
 * Time Complexity: O(m) per iteration, typically O(km) for k iterations
 * Space Complexity: O(n)
 */
export function labelPropagation(
    graph: Map<string, Map<string, number>>,
    options: LabelPropagationOptions = {},
): LabelPropagationResult {
    const {
        maxIterations = 100,
        randomSeed = 42,
    } = options;

    if (graph.size === 0) {
        return {
            communities: new Map(),
            iterations: 0,
            converged: true,
        };
    }

    // Initialize random number generator
    let seed = randomSeed;
    const random = (): number => {
        seed = ((seed * 1664525) + 1013904223) % 2147483647;
        return seed / 2147483647;
    };

    // Initialize labels - each node gets its own label
    const labels = new Map<string, number>();
    const nodes = Array.from(graph.keys());
    nodes.forEach((node, i) => labels.set(node, i));

    let iterations = 0;
    let converged = false;

    // Main loop
    while (iterations < maxIterations && !converged) {
        iterations++;
        converged = true;

        // Create random order for node updates
        const nodeOrder = [... nodes];
        shuffle(nodeOrder, random);

        // Update each node's label
        for (const node of nodeOrder) {
            const neighbors = graph.get(node);
            if (!neighbors || neighbors.size === 0) {
                continue;
            }

            // Count label frequencies among neighbors
            const labelCounts = new Map<number, number>();
            let maxCount = 0;
            const candidateLabels: number[] = [];

            for (const [neighbor, weight] of neighbors) {
                const neighborLabel = labels.get(neighbor);
                if (neighborLabel === undefined) {
                    continue;
                }

                const count = (labelCounts.get(neighborLabel) ?? 0) + weight;
                labelCounts.set(neighborLabel, count);

                if (count > maxCount) {
                    maxCount = count;
                    candidateLabels.length = 0;
                    candidateLabels.push(neighborLabel);
                } else if (count === maxCount) {
                    candidateLabels.push(neighborLabel);
                }
            }

            // Choose label (break ties randomly)
            const currentLabel = labels.get(node);
            if (currentLabel === undefined) {
                continue;
            }

            let newLabel = currentLabel;

            if (candidateLabels.length > 0) {
                // Include current label if it has max count
                if (labelCounts.get(currentLabel) === maxCount) {
                    candidateLabels.push(currentLabel);
                }

                // Random selection from candidates
                const index = Math.floor(random() * candidateLabels.length);
                const selectedLabel = candidateLabels[index];
                if (selectedLabel !== undefined) {
                    newLabel = selectedLabel;
                }
            }

            // Update label if changed
            if (newLabel !== currentLabel) {
                labels.set(node, newLabel);
                converged = false;
            }
        }
    }

    // Renumber communities consecutively
    const uniqueLabels = new Set(labels.values());
    const labelMap = new Map<number, number>();
    let communityId = 0;

    for (const label of uniqueLabels) {
        labelMap.set(label, communityId++);
    }

    const communities = new Map<string, number>();
    for (const [node, label] of labels) {
        const mappedLabel = labelMap.get(label);
        if (mappedLabel !== undefined) {
            communities.set(node, mappedLabel);
        }
    }

    return {
        communities,
        iterations,
        converged,
    };
}

/**
 * Asynchronous Label Propagation
 * Updates all nodes simultaneously (can lead to oscillations)
 */
export function labelPropagationAsync(
    graph: Map<string, Map<string, number>>,
    options: LabelPropagationOptions = {},
): LabelPropagationResult {
    const {
        maxIterations = 100,
    } = options;

    if (graph.size === 0) {
        return {
            communities: new Map(),
            iterations: 0,
            converged: true,
        };
    }

    // Initialize labels
    const labels = new Map<string, number>();
    const nodes = Array.from(graph.keys());
    nodes.forEach((node, i) => labels.set(node, i));

    let iterations = 0;
    let converged = false;

    // Main loop
    while (iterations < maxIterations && !converged) {
        iterations++;
        converged = true;

        // Store new labels
        const newLabels = new Map<string, number>();

        // Update all nodes simultaneously
        for (const node of nodes) {
            const neighbors = graph.get(node);
            if (!neighbors || neighbors.size === 0) {
                const nodeLabel = labels.get(node);
                if (nodeLabel !== undefined) {
                    newLabels.set(node, nodeLabel);
                }

                continue;
            }

            // Count label frequencies
            const labelCounts = new Map<number, number>();
            let maxCount = 0;
            const nodeLabel = labels.get(node);
            if (nodeLabel === undefined) {
                continue;
            }

            let maxLabel = nodeLabel;

            for (const [neighbor, weight] of neighbors) {
                const neighborLabel = labels.get(neighbor);
                if (neighborLabel === undefined) {
                    continue;
                }

                const count = (labelCounts.get(neighborLabel) ?? 0) + weight;
                labelCounts.set(neighborLabel, count);

                if (count > maxCount || (count === maxCount && neighborLabel < maxLabel)) {
                    maxCount = count;
                    maxLabel = neighborLabel;
                }
            }

            newLabels.set(node, maxLabel);

            if (maxLabel !== labels.get(node)) {
                converged = false;
            }
        }

        // Apply new labels
        for (const [node, label] of newLabels) {
            labels.set(node, label);
        }
    }

    // Renumber communities
    const uniqueLabels = new Set(labels.values());
    const labelMap = new Map<number, number>();
    let communityId = 0;

    for (const label of uniqueLabels) {
        labelMap.set(label, communityId++);
    }

    const communities = new Map<string, number>();
    for (const [node, label] of labels) {
        const mappedLabel = labelMap.get(label);
        if (mappedLabel !== undefined) {
            communities.set(node, mappedLabel);
        }
    }

    return {
        communities,
        iterations,
        converged,
    };
}

/**
 * Semi-supervised Label Propagation
 * Some nodes have fixed labels that don't change
 */
export function labelPropagationSemiSupervised(
    graph: Map<string, Map<string, number>>,
    seedLabels: Map<string, number>,
    options: LabelPropagationOptions = {},
): LabelPropagationResult {
    const {
        maxIterations = 100,
        randomSeed = 42,
    } = options;

    // Initialize random number generator
    let seed = randomSeed;
    const random = (): number => {
        seed = ((seed * 1664525) + 1013904223) % 2147483647;
        return seed / 2147483647;
    };

    // Initialize labels
    const labels = new Map<string, number>();
    const nodes = Array.from(graph.keys());
    let labelCounter = Math.max(... Array.from(seedLabels.values())) + 1;

    for (const node of nodes) {
        if (seedLabels.has(node)) {
            const seedLabel = seedLabels.get(node);
            if (seedLabel !== undefined) {
                labels.set(node, seedLabel);
            }
        } else {
            labels.set(node, labelCounter++);
        }
    }

    let iterations = 0;
    let converged = false;

    // Main loop
    while (iterations < maxIterations && !converged) {
        iterations++;
        converged = true;

        // Create random order
        const nodeOrder = nodes.filter((n) => !seedLabels.has(n));
        shuffle(nodeOrder, random);

        // Update non-seed nodes
        for (const node of nodeOrder) {
            const neighbors = graph.get(node);
            if (!neighbors || neighbors.size === 0) {
                continue;
            }

            // Count label frequencies
            const labelCounts = new Map<number, number>();
            let maxCount = 0;
            const candidateLabels: number[] = [];

            for (const [neighbor, weight] of neighbors) {
                const neighborLabel = labels.get(neighbor);
                if (neighborLabel === undefined) {
                    continue;
                }

                const count = (labelCounts.get(neighborLabel) ?? 0) + weight;
                labelCounts.set(neighborLabel, count);

                if (count > maxCount) {
                    maxCount = count;
                    candidateLabels.length = 0;
                    candidateLabels.push(neighborLabel);
                } else if (count === maxCount) {
                    candidateLabels.push(neighborLabel);
                }
            }

            // Choose label
            const currentLabel = labels.get(node);
            if (currentLabel === undefined) {
                continue;
            }

            let newLabel = currentLabel;

            if (candidateLabels.length > 0) {
                const index = Math.floor(random() * candidateLabels.length);
                const selectedLabel = candidateLabels[index];
                if (selectedLabel !== undefined) {
                    newLabel = selectedLabel;
                }
            }

            if (newLabel !== currentLabel) {
                labels.set(node, newLabel);
                converged = false;
            }
        }
    }

    return {
        communities: labels,
        iterations,
        converged,
    };
}

/**
 * Fisher-Yates shuffle
 */
function shuffle(array: unknown[], random: () => number): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const temp = array[i];
        const swapItem = array[j];
        if (temp !== undefined && swapItem !== undefined) {
            array[i] = swapItem;
            array[j] = temp;
        }
    }
}

