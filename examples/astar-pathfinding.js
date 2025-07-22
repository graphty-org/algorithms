// A* Pathfinding Algorithm Example
import { astar } from '../dist/algorithms.js';

console.log('=== A* Pathfinding Example ===');

// Create a weighted graph using Map structure (as required by A* implementation)
const map = new Map([
    ['A', new Map([['B', 4], ['C', 2]])],
    ['B', new Map([['A', 4], ['C', 1], ['D', 5]])],
    ['C', new Map([['A', 2], ['B', 1], ['D', 8], ['E', 10]])],
    ['D', new Map([['B', 5], ['C', 8], ['E', 2], ['F', 6]])],
    ['E', new Map([['C', 10], ['D', 2], ['F', 3]])],
    ['F', new Map([['D', 6], ['E', 3]])]
]);

console.log('Map structure (with distances):');
console.log('  A --- 4 --- B');
console.log('  |         / |');
console.log('  2       1   5');
console.log('  |     /     |');
console.log('  C -- 8 ---- D');
console.log('  |           |');
console.log(' 10           2');
console.log('  |           |');
console.log('  E --- 3 --- F');
console.log('              6');

// Define a simple heuristic function (Manhattan distance approximation)
const coordinates = {
    'A': { x: 0, y: 3 },
    'B': { x: 3, y: 3 },
    'C': { x: 0, y: 1 },
    'D': { x: 3, y: 1 },
    'E': { x: 0, y: 0 },
    'F': { x: 3, y: 0 }
};

const heuristic = (node, goal) => {
    const nodeCoord = coordinates[node];
    const goalCoord = coordinates[goal];
    // Manhattan distance
    return Math.abs(nodeCoord.x - goalCoord.x) + Math.abs(nodeCoord.y - goalCoord.y);
};

// Find shortest path using A*
console.log('\n1. A* Path from A to F:');
const result = astar(map, 'A', 'F', heuristic);
if (result) {
    console.log('Path found:', result.path.join(' → '));
    console.log('Total cost:', result.cost);
} else {
    console.log('No path found');
}

// Compare with different paths
console.log('\n2. A* Path from A to E:');
const resultAE = astar(map, 'A', 'E', heuristic);
if (resultAE) {
    console.log('Path found:', resultAE.path.join(' → '));
    console.log('Total cost:', resultAE.cost);
}

console.log('\n3. A* Path from B to E:');
const resultBE = astar(map, 'B', 'E', heuristic);
if (resultBE) {
    console.log('Path found:', resultBE.path.join(' → '));
    console.log('Total cost:', resultBE.cost);
}

// Example with grid-based pathfinding
console.log('\n\n=== Grid-based Pathfinding ===');

// Create a grid-like graph using Map structure
const gridGraph = new Map();

// Create a 5x5 grid
const gridSize = 5;
for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
        const current = `${x},${y}`;
        const neighbors = new Map();
        
        // Connect to right neighbor
        if (x < gridSize - 1) {
            neighbors.set(`${x + 1},${y}`, 1);
        }
        
        // Connect to bottom neighbor
        if (y < gridSize - 1) {
            neighbors.set(`${x},${y + 1}`, 1);
        }
        
        // Connect to left neighbor
        if (x > 0) {
            neighbors.set(`${x - 1},${y}`, 1);
        }
        
        // Connect to top neighbor
        if (y > 0) {
            neighbors.set(`${x},${y - 1}`, 1);
        }
        
        gridGraph.set(current, neighbors);
    }
}

// Remove edges for obstacles
const obstacles = ['1,1', '1,2', '2,1', '2,2'];
obstacles.forEach(obstacle => {
    // Remove all edges to/from obstacle
    gridGraph.delete(obstacle);
    // Remove edges pointing to obstacle from neighbors
    gridGraph.forEach((neighbors, node) => {
        neighbors.delete(obstacle);
    });
});

// Grid heuristic (Euclidean distance)
const gridHeuristic = (node, goal) => {
    const [x1, y1] = node.split(',').map(Number);
    const [x2, y2] = goal.split(',').map(Number);
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

console.log('5x5 Grid with obstacles:');
console.log('S - - - - ');
console.log('- # # - - ');
console.log('- # # - - ');
console.log('- - - - - ');
console.log('- - - - G ');
console.log('(# = obstacle)');

const gridResult = astar(gridGraph, '0,0', '4,4', gridHeuristic);
console.log('\nPath from S(0,0) to G(4,4):');
if (gridResult) {
    console.log('Path:', gridResult.path.join(' → '));
    console.log('Steps:', gridResult.cost);
    
    // Visualize the path
    console.log('\nPath visualization:');
    for (let y = 0; y < gridSize; y++) {
        let row = '';
        for (let x = 0; x < gridSize; x++) {
            const pos = `${x},${y}`;
            if (pos === '0,0') row += 'S ';
            else if (pos === '4,4') row += 'G ';
            else if (obstacles.includes(pos)) row += '# ';
            else if (gridResult.path.includes(pos)) row += '* ';
            else row += '- ';
        }
        console.log(row);
    }
}

// Example 3: Different heuristics comparison
console.log('\n\n=== Heuristic Comparison ===');

// Zero heuristic (Dijkstra's algorithm)
const zeroHeuristic = () => 0;

// Overestimating heuristic (may not find optimal path)
const overestimatingHeuristic = (node, goal) => {
    const nodeCoord = coordinates[node];
    const goalCoord = coordinates[goal];
    // Multiply Manhattan distance by 2
    return 2 * (Math.abs(nodeCoord.x - goalCoord.x) + Math.abs(nodeCoord.y - goalCoord.y));
};

console.log('Path from A to F with different heuristics:');

const resultZero = astar(map, 'A', 'F', zeroHeuristic);
console.log('\n1. Zero heuristic (Dijkstra):');
console.log('   Path:', resultZero?.path.join(' → '));
console.log('   Cost:', resultZero?.cost);

const resultManhattan = astar(map, 'A', 'F', heuristic);
console.log('\n2. Manhattan heuristic:');
console.log('   Path:', resultManhattan?.path.join(' → '));
console.log('   Cost:', resultManhattan?.cost);

const resultOver = astar(map, 'A', 'F', overestimatingHeuristic);
console.log('\n3. Overestimating heuristic:');
console.log('   Path:', resultOver?.path.join(' → '));
console.log('   Cost:', resultOver?.cost);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ A* should find optimal path from A to F:', result?.cost === 9);
console.log('✓ Path should use heuristic to guide search:', result?.path.includes('C'));
console.log('✓ Grid pathfinding should avoid obstacles:', 
    gridResult && !gridResult.path.some(node => obstacles.includes(node)));
console.log('✓ Zero heuristic should give same result as A* with good heuristic:', 
    resultZero?.cost === resultManhattan?.cost);