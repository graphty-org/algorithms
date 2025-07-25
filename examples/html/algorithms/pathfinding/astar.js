// Import A* pathfinding from the bundled algorithms
import { astar, astarWithDetails } from './algorithms.js';

export function runAStarPathfinding(startId, goalId, obstacles) {
    // Create a graph from the grid
    const graph = new Map();
    const GRID_SIZE = 10;
    
    // Helper to get neighbors in a grid (8-directional movement)
    function getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            [-1, -1], [0, -1], [1, -1],  // top row
            [-1, 0],           [1, 0],    // middle row
            [-1, 1],  [0, 1],  [1, 1]     // bottom row
        ];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check bounds
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const neighborId = `${nx},${ny}`;
                // Check if not an obstacle
                if (!obstacles.has(neighborId)) {
                    // Diagonal movement costs sqrt(2), straight movement costs 1
                    const cost = (dx !== 0 && dy !== 0) ? Math.sqrt(2) : 1;
                    neighbors.push([neighborId, cost]);
                }
            }
        }
        
        return neighbors;
    }
    
    // Build the graph
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const nodeId = `${x},${y}`;
            if (!obstacles.has(nodeId)) {
                const neighbors = getNeighbors(x, y);
                graph.set(nodeId, new Map(neighbors));
            }
        }
    }
    
    console.log('Graph created with', graph.size, 'nodes');
    
    // Heuristic function - Euclidean distance
    function heuristic(nodeA, nodeB) {
        const [ax, ay] = nodeA.split(',').map(Number);
        const [bx, by] = nodeB.split(',').map(Number);
        return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
    }
    
    // Use the actual A* algorithm from the package with details
    const result = astarWithDetails(graph, startId, goalId, heuristic);
    
    console.log('A* algorithm result:', result);
    console.log('Path found:', result.path);
    console.log('Total cost:', result.cost);
    console.log('Nodes visited:', result.visited.size);
    
    // Convert visited set to ordered array for animation
    // Since the package doesn't provide visit order, we'll approximate it
    const visitedOrder = Array.from(result.visited);
    
    return {
        path: result.path,
        cost: result.cost,
        visited: result.visited,
        visitedOrder,
        gScores: result.gScores,
        fScores: result.fScores
    };
}