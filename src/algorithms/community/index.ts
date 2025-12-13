/**
 * Community Detection Algorithms
 *
 * This module provides algorithms for detecting community structure in graphs.
 * Communities are groups of nodes that are more densely connected internally
 * than with the rest of the network.
 */

export {girvanNewman} from "./girvan-newman.js";
export type {LabelPropagationOptions, LabelPropagationResult} from "./label-propagation.js";
export {labelPropagation, labelPropagationAsync, labelPropagationSemiSupervised} from "./label-propagation.js";
export type {LeidenOptions, LeidenResult} from "./leiden.js";
export {leiden} from "./leiden.js";
export {louvain} from "./louvain.js";

