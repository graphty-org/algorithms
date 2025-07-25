import { Graph, maximumBipartiteMatching, greedyBipartiteMatching, bipartitePartition } from './algorithms.js';

// Create a comprehensive bipartite matching demonstration
const jobGraph = new Graph();

// Workers (left partition) with different skill sets
const workers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];

// Jobs (right partition) requiring specific skills
const jobs = ['Frontend', 'Backend', 'Database', 'DevOps', 'Testing', 'Mobile'];

// Add all nodes
workers.forEach(worker => jobGraph.addNode(worker));
jobs.forEach(job => jobGraph.addNode(job));

// Add edges representing worker qualifications for jobs
const qualifications = [
    // Alice: Full-stack developer
    ['Alice', 'Frontend'], ['Alice', 'Backend'], ['Alice', 'Testing'],
    
    // Bob: Backend specialist
    ['Bob', 'Backend'], ['Bob', 'Database'], ['Bob', 'DevOps'],
    
    // Charlie: Frontend focused
    ['Charlie', 'Frontend'], ['Charlie', 'Mobile'], ['Charlie', 'Testing'],
    
    // David: Infrastructure expert
    ['David', 'Database'], ['David', 'DevOps'],
    
    // Eve: QA specialist
    ['Eve', 'Testing'], ['Eve', 'Mobile'],
    
    // Frank: Mobile developer
    ['Frank', 'Mobile'], ['Frank', 'Frontend']
];

qualifications.forEach(([worker, job]) => {
    jobGraph.addEdge(worker, job);
});

// Comprehensive bipartite matching analysis
export function runBipartiteMatching() {
    console.log('=== Bipartite Matching Comprehensive Analysis ===\n');
    
    // 1. Verify graph is bipartite
    console.log('1. Bipartite Verification:');
    const partition = bipartitePartition(jobGraph);
    
    if (partition) {
        console.log('✓ Graph is bipartite');
        console.log(`Left partition (${partition.left.size}): [${Array.from(partition.left).join(', ')}]`);
        console.log(`Right partition (${partition.right.size}): [${Array.from(partition.right).join(', ')}]`);
    } else {
        console.log('✗ Graph is not bipartite');
        return;
    }
    
    // 2. Compare Maximum vs Greedy matching
    console.log('\n2. Algorithm Comparison:');
    
    const maxMatching = maximumBipartiteMatching(jobGraph);
    const greedyMatching = greedyBipartiteMatching(jobGraph);
    
    console.log('\nMaximum Bipartite Matching:');
    console.log(`Size: ${maxMatching.size}`);
    console.log('Assignments:');
    maxMatching.matching.forEach((job, worker) => {
        console.log(`  ${worker} → ${job}`);
    });
    
    console.log('\nGreedy Bipartite Matching:');
    console.log(`Size: ${greedyMatching.size}`);
    console.log('Assignments:');
    greedyMatching.matching.forEach((job, worker) => {
        console.log(`  ${worker} → ${job}`);
    });
    
    console.log(`\nEfficiency comparison:`);
    console.log(`Maximum: ${maxMatching.size}/${Math.min(workers.length, jobs.length)} = ${(maxMatching.size / Math.min(workers.length, jobs.length) * 100).toFixed(1)}%`);
    console.log(`Greedy: ${greedyMatching.size}/${Math.min(workers.length, jobs.length)} = ${(greedyMatching.size / Math.min(workers.length, jobs.length) * 100).toFixed(1)}%`);
    
    // 3. Analyze unmatched elements
    console.log('\n3. Unmatched Analysis:');
    
    const unmatchedWorkers = workers.filter(w => !maxMatching.matching.has(w));
    const matchedJobs = new Set(maxMatching.matching.values());
    const unmatchedJobs = jobs.filter(j => !matchedJobs.has(j));
    
    if (unmatchedWorkers.length > 0) {
        console.log(`Unmatched workers: [${unmatchedWorkers.join(', ')}]`);
        unmatchedWorkers.forEach(worker => {
            const qualifiedJobs = jobs.filter(job => jobGraph.hasEdge(worker, job));
            console.log(`  ${worker} qualified for: [${qualifiedJobs.join(', ')}]`);
        });
    }
    
    if (unmatchedJobs.length > 0) {
        console.log(`Unfilled jobs: [${unmatchedJobs.join(', ')}]`);
        unmatchedJobs.forEach(job => {
            const qualifiedWorkers = workers.filter(worker => jobGraph.hasEdge(worker, job));
            console.log(`  ${job} can be done by: [${qualifiedWorkers.join(', ')}]`);
        });
    }
    
    return { maxMatching, greedyMatching, partition };
}

// Demonstrate different real-world scenarios
export function demonstrateScenarios() {
    console.log('\n=== Real-World Bipartite Matching Scenarios ===');
    
    // Scenario 1: Dating App Matching
    console.log('\n1. Dating App Matching:');
    const datingGraph = createDatingGraph();
    const datingResult = maximumBipartiteMatching(datingGraph);
    
    console.log(`Found ${datingResult.size} compatible pairs:`);
    datingResult.matching.forEach((match, person) => {
        console.log(`  ${person} ↔ ${match}`);
    });
    
    // Scenario 2: Course Scheduling
    console.log('\n2. Course Scheduling:');
    const scheduleGraph = createScheduleGraph();
    const scheduleResult = maximumBipartiteMatching(scheduleGraph);
    
    console.log(`Scheduled ${scheduleResult.size} students:`);
    scheduleResult.matching.forEach((timeSlot, student) => {
        console.log(`  ${student} → ${timeSlot}`);
    });
    
    // Scenario 3: Resource Allocation
    console.log('\n3. Server-Task Allocation:');
    const serverGraph = createServerTaskGraph();
    const serverResult = maximumBipartiteMatching(serverGraph);
    
    console.log(`Allocated ${serverResult.size} tasks:`);
    serverResult.matching.forEach((server, task) => {
        console.log(`  ${task} → ${server}`);
    });
    
    // Scenario 4: Hall's Marriage Theorem Demonstration
    console.log('\n4. Hall\'s Marriage Theorem Example:');
    demonstrateHallsTheorem();
}

// Create dating app bipartite graph
function createDatingGraph() {
    const graph = new Graph();
    
    const groupA = ['Alex', 'Blake', 'Casey', 'Drew'];
    const groupB = ['Jordan', 'Morgan', 'Pat', 'Sam', 'Taylor'];
    
    groupA.forEach(person => graph.addNode(person));
    groupB.forEach(person => graph.addNode(person));
    
    // Add compatibility edges
    const compatibilities = [
        ['Alex', 'Jordan'], ['Alex', 'Pat'],
        ['Blake', 'Morgan'], ['Blake', 'Pat'], ['Blake', 'Sam'],
        ['Casey', 'Jordan'], ['Casey', 'Sam'], ['Casey', 'Taylor'],
        ['Drew', 'Morgan'], ['Drew', 'Taylor']
    ];
    
    compatibilities.forEach(([personA, personB]) => {
        graph.addEdge(personA, personB);
    });
    
    return graph;
}

// Create course scheduling bipartite graph
function createScheduleGraph() {
    const graph = new Graph();
    
    const students = ['Student1', 'Student2', 'Student3', 'Student4', 'Student5'];
    const timeSlots = ['Mon9AM', 'Mon2PM', 'Tue9AM', 'Tue2PM', 'Wed9AM'];
    
    students.forEach(student => graph.addNode(student));
    timeSlots.forEach(slot => graph.addNode(slot));
    
    // Student availability
    const availability = [
        ['Student1', 'Mon9AM'], ['Student1', 'Tue9AM'], ['Student1', 'Wed9AM'],
        ['Student2', 'Mon9AM'], ['Student2', 'Mon2PM'], ['Student2', 'Tue2PM'],
        ['Student3', 'Tue9AM'], ['Student3', 'Tue2PM'],
        ['Student4', 'Mon2PM'], ['Student4', 'Wed9AM'],
        ['Student5', 'Mon9AM'], ['Student5', 'Tue2PM'], ['Student5', 'Wed9AM']
    ];
    
    availability.forEach(([student, slot]) => {
        graph.addEdge(student, slot);
    });
    
    return graph;
}

// Create server-task allocation bipartite graph
function createServerTaskGraph() {
    const graph = new Graph();
    
    const tasks = ['WebServer', 'Database', 'Cache', 'Analytics', 'Backup'];
    const servers = ['Server1', 'Server2', 'Server3', 'Server4'];
    
    tasks.forEach(task => graph.addNode(task));
    servers.forEach(server => graph.addNode(server));
    
    // Server capabilities
    const capabilities = [
        ['WebServer', 'Server1'], ['WebServer', 'Server2'], ['WebServer', 'Server3'],
        ['Database', 'Server2'], ['Database', 'Server4'],
        ['Cache', 'Server1'], ['Cache', 'Server3'],
        ['Analytics', 'Server3'], ['Analytics', 'Server4'],
        ['Backup', 'Server1'], ['Backup', 'Server4']
    ];
    
    capabilities.forEach(([task, server]) => {
        graph.addEdge(task, server);
    });
    
    return graph;
}

// Demonstrate Hall's Marriage Theorem
function demonstrateHallsTheorem() {
    console.log('\nHall\'s Marriage Theorem: A perfect matching exists if and only if');
    console.log('for every subset S of the left partition, |N(S)| ≥ |S|');
    console.log('where N(S) is the neighborhood of S in the right partition.');
    
    // Create a graph that satisfies Hall's condition
    const hallGraph = new Graph();
    const leftNodes = ['L1', 'L2', 'L3'];
    const rightNodes = ['R1', 'R2', 'R3', 'R4'];
    
    leftNodes.forEach(node => hallGraph.addNode(node));
    rightNodes.forEach(node => hallGraph.addNode(node));
    
    // Edges that satisfy Hall's condition
    const hallEdges = [
        ['L1', 'R1'], ['L1', 'R2'],
        ['L2', 'R2'], ['L2', 'R3'],
        ['L3', 'R3'], ['L3', 'R4']
    ];
    
    hallEdges.forEach(([left, right]) => {
        hallGraph.addEdge(left, right);
    });
    
    console.log('\nExample graph:');
    console.log('L1 → [R1, R2]');
    console.log('L2 → [R2, R3]');
    console.log('L3 → [R3, R4]');
    
    // Check Hall's condition for all subsets
    console.log('\nVerifying Hall\'s condition:');
    const subsets = [
        [['L1'], ['R1', 'R2']],
        [['L2'], ['R2', 'R3']],
        [['L3'], ['R3', 'R4']],
        [['L1', 'L2'], ['R1', 'R2', 'R3']],
        [['L1', 'L3'], ['R1', 'R2', 'R3', 'R4']],
        [['L2', 'L3'], ['R2', 'R3', 'R4']],
        [['L1', 'L2', 'L3'], ['R1', 'R2', 'R3', 'R4']]
    ];
    
    subsets.forEach(([subset, neighborhood]) => {
        const satisfies = neighborhood.length >= subset.length;
        console.log(`  S = [${subset.join(', ')}], N(S) = [${neighborhood.join(', ')}]: |N(S)| = ${neighborhood.length} ${satisfies ? '≥' : '<'} |S| = ${subset.length} ${satisfies ? '✓' : '✗'}`);
    });
    
    const hallResult = maximumBipartiteMatching(hallGraph);
    console.log(`\nResult: Maximum matching size = ${hallResult.size} (perfect matching: ${hallResult.size === leftNodes.length ? 'Yes' : 'No'})`);
}

// Analyze algorithm complexity and performance
export function analyzeComplexity() {
    console.log('\n=== Algorithm Complexity Analysis ===');
    
    console.log('\nMaximum Bipartite Matching:');
    console.log('• Time Complexity: O(V × E) using augmenting paths');
    console.log('• Space Complexity: O(V)');
    console.log('• Optimal: Finds the maximum possible matching');
    console.log('• Use case: When you need the best possible assignment');
    
    console.log('\nGreedy Bipartite Matching:');
    console.log('• Time Complexity: O(V + E)');
    console.log('• Space Complexity: O(V)');
    console.log('• Optimal: No, may miss better solutions');
    console.log('• Use case: When speed matters more than optimality');
    
    // Performance comparison on different graph sizes
    console.log('\n=== Performance Comparison ===');
    const sizes = [10, 20, 30];
    
    sizes.forEach(size => {
        console.log(`\nGraph size: ${size}×${size} nodes`);
        
        // Create random bipartite graph
        const graph = createRandomBipartiteGraph(size);
        
        // Time both algorithms
        const startMax = performance.now();
        const maxResult = maximumBipartiteMatching(graph);
        const timeMax = performance.now() - startMax;
        
        const startGreedy = performance.now();
        const greedyResult = greedyBipartiteMatching(graph);
        const timeGreedy = performance.now() - startGreedy;
        
        console.log(`  Maximum Matching: ${maxResult.size} matches in ${timeMax.toFixed(2)}ms`);
        console.log(`  Greedy Matching: ${greedyResult.size} matches in ${timeGreedy.toFixed(2)}ms`);
        console.log(`  Efficiency difference: ${((maxResult.size - greedyResult.size) / maxResult.size * 100).toFixed(1)}%`);
        console.log(`  Speed difference: ${(timeMax / timeGreedy).toFixed(1)}x`);
    });
}

// Create random bipartite graph for testing
function createRandomBipartiteGraph(size) {
    const graph = new Graph();
    
    // Create left and right partitions
    const leftNodes = Array.from({length: size}, (_, i) => `L${i}`);
    const rightNodes = Array.from({length: size}, (_, i) => `R${i}`);
    
    leftNodes.forEach(node => graph.addNode(node));
    rightNodes.forEach(node => graph.addNode(node));
    
    // Add random edges (about 30% density)
    leftNodes.forEach(leftNode => {
        rightNodes.forEach(rightNode => {
            if (Math.random() < 0.3) {
                graph.addEdge(leftNode, rightNode);
            }
        });
    });
    
    return graph;
}

// Educational examples showing when maximum matching matters
export function showEducationalExamples() {
    console.log('\n=== Educational Examples: When Maximum Matters ===');
    
    // Example 1: Suboptimal greedy vs optimal maximum
    console.log('\n1. Greedy Trap Example:');
    console.log('Sometimes greedy choices prevent optimal solutions...');
    
    const trapGraph = new Graph();
    const leftTrap = ['A', 'B'];
    const rightTrap = ['X', 'Y', 'Z'];
    
    [...leftTrap, ...rightTrap].forEach(node => trapGraph.addNode(node));
    
    // A can only go to X, but B can go to X, Y, or Z
    // Greedy might assign B→X, leaving A unmatched
    // Optimal assigns A→X, B→Y (or B→Z)
    trapGraph.addEdge('A', 'X');
    trapGraph.addEdge('B', 'X');
    trapGraph.addEdge('B', 'Y');
    trapGraph.addEdge('B', 'Z');
    
    console.log('Graph: A→[X], B→[X,Y,Z]');
    
    const trapGreedy = greedyBipartiteMatching(trapGraph);
    const trapMax = maximumBipartiteMatching(trapGraph);
    
    console.log(`Greedy result: ${trapGreedy.size} matches`);
    trapGreedy.matching.forEach((right, left) => console.log(`  ${left} → ${right}`));
    
    console.log(`Maximum result: ${trapMax.size} matches`);
    trapMax.matching.forEach((right, left) => console.log(`  ${left} → ${right}`));
    
    // Example 2: Augmenting path demonstration
    console.log('\n2. Augmenting Path Example:');
    console.log('Maximum matching uses augmenting paths to improve solutions...');
    
    const augmentGraph = new Graph();
    const leftAug = ['P', 'Q', 'R'];
    const rightAug = ['1', '2', '3'];
    
    [...leftAug, ...rightAug].forEach(node => augmentGraph.addNode(node));
    
    augmentGraph.addEdge('P', '1');
    augmentGraph.addEdge('P', '2');
    augmentGraph.addEdge('Q', '1');
    augmentGraph.addEdge('Q', '3');
    augmentGraph.addEdge('R', '2');
    
    console.log('Graph: P→[1,2], Q→[1,3], R→[2]');
    console.log('Initial matching: P→1, R→2 (Q unmatched)');
    console.log('Augmenting path: Q→1, then reassign P→2');
    console.log('Final matching: Q→1, P→2, no match for R');
    
    const augmentResult = maximumBipartiteMatching(augmentGraph);
    console.log(`\nActual maximum matching: ${augmentResult.size} matches`);
    augmentResult.matching.forEach((right, left) => console.log(`  ${left} → ${right}`));
}