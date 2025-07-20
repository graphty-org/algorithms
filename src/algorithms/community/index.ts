/**
 * Community Detection Algorithms
 * 
 * This module provides algorithms for detecting community structure in graphs.
 * Communities are groups of nodes that are more densely connected internally
 * than with the rest of the network.
 */

export {louvain} from "./louvain.js";
export {girvanNewman} from "./girvan-newman.js";