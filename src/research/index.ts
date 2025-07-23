/**
 * Priority 4 Research Algorithms (2023-2025)
 *
 * This module contains cutting-edge graph algorithms based on recent research
 * from 2023-2025, focusing on deep learning integration, scalable algorithms,
 * and explainable community detection.
 */

// Synergistic Deep Graph Clustering
export {syncClustering, type SynCConfig, type SynCResult} from "./sync.js";

// TeraHAC - Hierarchical Agglomerative Clustering
export {teraHAC, type TeraHACConfig, type TeraHACResult} from "./terahac.js";
export {type ClusterNode as TeraHACClusterNode} from "./terahac.js";

// GRSBM - Greedy Recursive Spectral Bisection with Modularity
export {type ClusterExplanation, grsbm, type GRSBMCluster, type GRSBMConfig, type GRSBMResult} from "./grsbm.js";
