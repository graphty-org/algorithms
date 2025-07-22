/**
 * A* Pathfinding Algorithm Examples
 * 
 * This example demonstrates how to use the A* algorithm for finding
 * optimal paths in different types of graphs.
 */

import { astar, astarWithDetails, heuristics } from '../src/pathfinding/astar';
import { pathfindingUtils } from '../src/pathfinding/utils';

// Example 1: Pathfinding in a weighted graph (cities and distances)
console.log('=== Example 1: City Navigation ===\n');

const cityGraph = new Map([
  ['San Francisco', new Map([
    ['Oakland', 12],
    ['San Jose', 48]
  ])],
  ['Oakland', new Map([
    ['San Francisco', 12],
    ['Berkeley', 4],
    ['San Jose', 42]
  ])],
  ['Berkeley', new Map([
    ['Oakland', 4],
    ['Sacramento', 80]
  ])],
  ['San Jose', new Map([
    ['San Francisco', 48],
    ['Oakland', 42],
    ['Gilroy', 32]
  ])],
  ['Gilroy', new Map([
    ['San Jose', 32],
    ['Monterey', 45]
  ])],
  ['Monterey', new Map([
    ['Gilroy', 45]
  ])],
  ['Sacramento', new Map([
    ['Berkeley', 80]
  ])]
]);

// Simple heuristic based on approximate straight-line distances
const cityHeuristic = (city: string, goal: string): number => {
  const distances: Record<string, Record<string, number>> = {
    'San Francisco': { 'Monterey': 100, 'Sacramento': 75 },
    'Oakland': { 'Monterey': 95, 'Sacramento': 70 },
    'Berkeley': { 'Monterey': 98, 'Sacramento': 65 },
    'San Jose': { 'Monterey': 60, 'Sacramento': 110 },
    'Gilroy': { 'Monterey': 35, 'Sacramento': 140 },
    'Monterey': { 'Monterey': 0, 'Sacramento': 170 },
    'Sacramento': { 'Monterey': 170, 'Sacramento': 0 }
  };
  
  return distances[city]?.[goal] || 0;
};

const route = astar(cityGraph, 'San Francisco', 'Monterey', cityHeuristic);
console.log('Route from San Francisco to Monterey:');
console.log('Path:', route?.path.join(' → '));
console.log('Total distance:', route?.cost, 'miles\n');

// Example 2: Grid-based pathfinding (game/robotics scenario)
console.log('=== Example 2: Grid Navigation with Obstacles ===\n');

// Create a 10x10 grid with obstacles
const obstacles = new Set([
  '3,2', '3,3', '3,4', '3,5', '3,6', // Vertical wall
  '7,4', '7,5', '7,6', '7,7', // Another wall
  '5,8', '6,8' // Small obstacle
]);

const grid = pathfindingUtils.createGridGraph(10, 10, obstacles);

// Manhattan distance heuristic for grid
const gridHeuristic = (node: string, goal: string) => {
  const [x1, y1] = pathfindingUtils.parseGridCoordinate(node);
  const [x2, y2] = pathfindingUtils.parseGridCoordinate(goal);
  return heuristics.manhattan([x1, y1], [x2, y2]);
};

const gridPath = astarWithDetails(grid, '0,0', '9,9', gridHeuristic);

console.log('Grid path from (0,0) to (9,9):');
console.log('Path found:', gridPath.path !== null);
console.log('Path length:', gridPath.path?.length);
console.log('Total cost:', gridPath.cost);
console.log('Nodes visited:', gridPath.visited.size);

// Visualize the grid
console.log('\nGrid visualization:');
const gridViz: string[][] = Array(10).fill(null).map(() => Array(10).fill('·'));

// Mark obstacles
obstacles.forEach(obs => {
  const [x, y] = pathfindingUtils.parseGridCoordinate(obs);
  gridViz[y][x] = '█';
});

// Mark path
if (gridPath.path) {
  gridPath.path.forEach((node, index) => {
    const [x, y] = pathfindingUtils.parseGridCoordinate(node);
    if (index === 0) gridViz[y][x] = 'S';
    else if (index === gridPath.path!.length - 1) gridViz[y][x] = 'G';
    else gridViz[y][x] = '*';
  });
}

gridViz.forEach(row => console.log(row.join(' ')));

// Example 3: Comparing different heuristics
console.log('\n=== Example 3: Heuristic Comparison ===\n');

const start = '0,0';
const goal = '15,15';
const largeGrid = pathfindingUtils.createGridGraph(20, 20);

const heuristicTests = [
  { name: 'Manhattan', fn: (n: string, g: string) => {
    const [x1, y1] = pathfindingUtils.parseGridCoordinate(n);
    const [x2, y2] = pathfindingUtils.parseGridCoordinate(g);
    return heuristics.manhattan([x1, y1], [x2, y2]);
  }},
  { name: 'Euclidean', fn: (n: string, g: string) => {
    const [x1, y1] = pathfindingUtils.parseGridCoordinate(n);
    const [x2, y2] = pathfindingUtils.parseGridCoordinate(g);
    return heuristics.euclidean([x1, y1], [x2, y2]);
  }},
  { name: 'Chebyshev', fn: (n: string, g: string) => {
    const [x1, y1] = pathfindingUtils.parseGridCoordinate(n);
    const [x2, y2] = pathfindingUtils.parseGridCoordinate(g);
    return heuristics.chebyshev([x1, y1], [x2, y2]);
  }},
  { name: 'Zero (Dijkstra)', fn: heuristics.zero }
];

console.log('Performance comparison for 20x20 grid:');
heuristicTests.forEach(test => {
  const startTime = Date.now();
  const result = astarWithDetails(largeGrid, start, goal, test.fn);
  const endTime = Date.now();
  
  console.log(`\n${test.name} heuristic:`);
  console.log(`  Path cost: ${result.cost}`);
  console.log(`  Nodes visited: ${result.visited.size}`);
  console.log(`  Time: ${endTime - startTime}ms`);
});

// Example 4: Weighted grid with terrain costs
console.log('\n=== Example 4: Terrain-based Pathfinding ===\n');

// Create a weighted grid where different terrains have different costs
const terrainGraph = new Map<string, Map<string, number>>();

// Define terrain costs
const terrainCosts: Record<string, number> = {
  'grass': 1,
  'sand': 2,
  'water': 5,
  'mountain': 10
};

// Simple 5x5 terrain map
const terrainMap = [
  ['grass', 'grass', 'sand', 'sand', 'water'],
  ['grass', 'mountain', 'sand', 'water', 'water'],
  ['grass', 'grass', 'grass', 'water', 'water'],
  ['sand', 'sand', 'grass', 'grass', 'grass'],
  ['sand', 'sand', 'sand', 'grass', 'grass']
];

// Build weighted graph based on terrain
for (let y = 0; y < 5; y++) {
  for (let x = 0; x < 5; x++) {
    const node = `${x},${y}`;
    const neighbors = new Map<string, number>();
    
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5) {
        const neighbor = `${nx},${ny}`;
        const cost = terrainCosts[terrainMap[ny][nx]];
        neighbors.set(neighbor, cost);
      }
    }
    
    terrainGraph.set(node, neighbors);
  }
}

const terrainPath = astar(terrainGraph, '0,0', '4,4', gridHeuristic);

console.log('Terrain-aware path from (0,0) to (4,4):');
console.log('Path:', terrainPath?.path.join(' → '));
console.log('Total cost:', terrainPath?.cost);

// Visualize terrain and path
console.log('\nTerrain map with path:');
const terrainViz = terrainMap.map(row => [...row]);
if (terrainPath?.path) {
  terrainPath.path.forEach((node, index) => {
    const [x, y] = pathfindingUtils.parseGridCoordinate(node);
    if (index === 0) terrainViz[y][x] = 'START';
    else if (index === terrainPath.path.length - 1) terrainViz[y][x] = 'GOAL';
    else terrainViz[y][x] = 'PATH';
  });
}

terrainViz.forEach((row, y) => {
  console.log(row.map((cell, x) => {
    const padded = cell.padEnd(8);
    return padded;
  }).join(''));
});

console.log('\nTerrain costs:', terrainCosts);