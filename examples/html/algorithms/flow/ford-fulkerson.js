// Import Ford-Fulkerson from @graphty/algorithms
import { fordFulkerson } from './algorithms.js';

export function runFordFulkerson() {
    // Create a flow network as adjacency list with capacities
    const graph = new Map();
    
    // Define the network structure
    graph.set('S', new Map([
        ['A', 16],
        ['B', 13]
    ]));
    
    graph.set('A', new Map([
        ['B', 10],
        ['C', 12]
    ]));
    
    graph.set('B', new Map([
        ['D', 14]
    ]));
    
    graph.set('C', new Map([
        ['B', 4],
        ['T', 20]
    ]));
    
    graph.set('D', new Map([
        ['C', 7],
        ['T', 4]
    ]));
    
    // Ensure all nodes exist in the graph (even if they have no outgoing edges)
    graph.set('T', new Map());
    
    console.log('Flow network created:', {
        nodes: Array.from(graph.keys()),
        edges: Array.from(graph.entries()).flatMap(([from, neighbors]) =>
            Array.from(neighbors.entries()).map(([to, capacity]) => ({
                from,
                to,
                capacity
            }))
        )
    });
    
    // Run the actual Ford-Fulkerson algorithm from the package
    const result = fordFulkerson(graph, 'S', 'T');
    
    console.log('Ford-Fulkerson Result:', result);
    console.log('Maximum flow:', result.maxFlow);
    console.log('Flow graph:', Array.from(result.flowGraph.entries()).map(([from, flows]) => ({
        from,
        flows: Array.from(flows.entries())
    })));
    
    // Display flow through each edge
    console.log('\nFlow through edges:');
    for (const [from, flows] of result.flowGraph) {
        for (const [to, flow] of flows) {
            if (flow > 0) {
                const capacity = graph.get(from)?.get(to) || 0;
                console.log(`${from} → ${to}: ${flow}/${capacity}`);
            }
        }
    }
    
    // Calculate and display some statistics
    let totalCapacityFromSource = 0;
    const sourceEdges = graph.get('S');
    if (sourceEdges) {
        for (const capacity of sourceEdges.values()) {
            totalCapacityFromSource += capacity;
        }
    }
    
    let totalCapacityToSink = 0;
    for (const [node, neighbors] of graph) {
        const sinkCapacity = neighbors.get('T');
        if (sinkCapacity !== undefined) {
            totalCapacityToSink += sinkCapacity;
        }
    }
    
    console.log('\nNetwork statistics:');
    console.log('Total capacity from source:', totalCapacityFromSource);
    console.log('Total capacity to sink:', totalCapacityToSink);
    console.log('Maximum flow achieved:', result.maxFlow);
    console.log('Flow utilization:', (result.maxFlow / Math.min(totalCapacityFromSource, totalCapacityToSink) * 100).toFixed(1) + '%');
    
    return result;
}