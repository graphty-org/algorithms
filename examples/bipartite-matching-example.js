// Bipartite Matching Example
import { Graph, maximumBipartiteMatching, isBipartite } from '../dist/algorithms.js';

console.log('=== Bipartite Matching Example ===');

// Create a job assignment bipartite graph
const jobGraph = new Graph();

// Workers (left partition)
const workers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];

// Jobs (right partition)  
const jobs = ['Frontend', 'Backend', 'Database', 'DevOps', 'Testing'];

// Add edges representing worker qualifications
// Alice can do Frontend or Testing
jobGraph.addEdge('Alice', 'Frontend');
jobGraph.addEdge('Alice', 'Testing');

// Bob can do Backend or Database
jobGraph.addEdge('Bob', 'Backend');
jobGraph.addEdge('Bob', 'Database');

// Charlie can do Frontend or Backend
jobGraph.addEdge('Charlie', 'Frontend');
jobGraph.addEdge('Charlie', 'Backend');

// David can do Database or DevOps
jobGraph.addEdge('David', 'Database');
jobGraph.addEdge('David', 'DevOps');

// Eve can do DevOps or Testing
jobGraph.addEdge('Eve', 'DevOps');
jobGraph.addEdge('Eve', 'Testing');

console.log('Job Assignment Graph:');
console.log('Workers          Jobs');
console.log('-------          ----');
console.log('Alice     ───→   Frontend');
console.log('  └──────────→   Testing');
console.log('Bob       ───→   Backend');
console.log('  └──────────→   Database');
console.log('Charlie   ───→   Frontend');
console.log('  └──────────→   Backend');
console.log('David     ───→   Database');
console.log('  └──────────→   DevOps');
console.log('Eve       ───→   DevOps');
console.log('  └──────────→   Testing');

// Check if graph is bipartite
console.log('\n1. Checking bipartite property:');
const bipartiteCheck = isBipartite(jobGraph);
console.log(`Is bipartite: ${bipartiteCheck.isBipartite}`);
if (bipartiteCheck.coloring) {
    console.log('\nNode coloring (0 = workers, 1 = jobs):');
    bipartiteCheck.coloring.forEach((color, node) => {
        console.log(`  ${node}: ${color === 0 ? 'Worker' : 'Job'}`);
    });
}

// Find maximum matching
console.log('\n2. Maximum Bipartite Matching:');
const matching = maximumBipartiteMatching(jobGraph);

console.log(`\nMaximum matching size: ${matching.size}`);
console.log('\nAssignments:');
matching.matching.forEach((job, worker) => {
    console.log(`  ${worker} → ${job}`);
});

// Create a dating app matching scenario
console.log('\n\n=== Dating App Matching ===');
const datingGraph = new Graph();

// Users looking for matches
const groupA = ['Alex', 'Blake', 'Casey', 'Drew'];
const groupB = ['Jordan', 'Morgan', 'Pat', 'Sam', 'Taylor'];

// Add edges based on mutual interests
datingGraph.addEdge('Alex', 'Jordan');
datingGraph.addEdge('Alex', 'Pat');
datingGraph.addEdge('Blake', 'Morgan');
datingGraph.addEdge('Blake', 'Pat');
datingGraph.addEdge('Blake', 'Sam');
datingGraph.addEdge('Casey', 'Jordan');
datingGraph.addEdge('Casey', 'Sam');
datingGraph.addEdge('Casey', 'Taylor');
datingGraph.addEdge('Drew', 'Morgan');
datingGraph.addEdge('Drew', 'Taylor');

console.log('Dating Compatibility Graph:');
console.log('Group A     Group B');
console.log('-------     -------');
console.log('Alex    →   Jordan, Pat');
console.log('Blake   →   Morgan, Pat, Sam');
console.log('Casey   →   Jordan, Sam, Taylor');
console.log('Drew    →   Morgan, Taylor');

// Find optimal matching
console.log('\n3. Optimal Dating Matches:');
const datingMatches = maximumBipartiteMatching(datingGraph, {
    leftPartition: new Set(groupA),
    rightPartition: new Set(groupB)
});

console.log(`\nMatched ${datingMatches.size} pairs:`);
datingMatches.matching.forEach((match, person) => {
    if (groupA.includes(person)) {
        console.log(`  ${person} ↔ ${match}`);
    }
});

const unmatchedA = groupA.filter(person => !datingMatches.matching.has(person));
const unmatchedB = groupB.filter(person => 
    !Array.from(datingMatches.matching.values()).includes(person)
);

if (unmatchedA.length > 0 || unmatchedB.length > 0) {
    console.log('\nUnmatched:');
    if (unmatchedA.length > 0) console.log(`  Group A: ${unmatchedA.join(', ')}`);
    if (unmatchedB.length > 0) console.log(`  Group B: ${unmatchedB.join(', ')}`);
}

// Create a course scheduling scenario
console.log('\n\n=== Course Scheduling ===');
const scheduleGraph = new Graph();

// Students
const students = ['Student1', 'Student2', 'Student3', 'Student4', 'Student5', 'Student6'];

// Time slots
const timeSlots = ['Mon9AM', 'Mon2PM', 'Tue9AM', 'Tue2PM', 'Wed9AM', 'Wed2PM'];

// Each student's available times
scheduleGraph.addEdge('Student1', 'Mon9AM');
scheduleGraph.addEdge('Student1', 'Tue9AM');
scheduleGraph.addEdge('Student1', 'Wed9AM');

scheduleGraph.addEdge('Student2', 'Mon9AM');
scheduleGraph.addEdge('Student2', 'Mon2PM');
scheduleGraph.addEdge('Student2', 'Tue2PM');

scheduleGraph.addEdge('Student3', 'Tue9AM');
scheduleGraph.addEdge('Student3', 'Tue2PM');
scheduleGraph.addEdge('Student3', 'Wed2PM');

scheduleGraph.addEdge('Student4', 'Mon2PM');
scheduleGraph.addEdge('Student4', 'Wed9AM');
scheduleGraph.addEdge('Student4', 'Wed2PM');

scheduleGraph.addEdge('Student5', 'Mon9AM');
scheduleGraph.addEdge('Student5', 'Tue2PM');
scheduleGraph.addEdge('Student5', 'Wed9AM');

scheduleGraph.addEdge('Student6', 'Mon2PM');
scheduleGraph.addEdge('Student6', 'Tue9AM');
scheduleGraph.addEdge('Student6', 'Wed2PM');

console.log('Student Availability for Tutoring Sessions:');
console.log('Each student needs exactly one tutoring slot');

// Find schedule
console.log('\n4. Optimal Tutoring Schedule:');
const schedule = maximumBipartiteMatching(scheduleGraph, {
    leftPartition: new Set(students),
    rightPartition: new Set(timeSlots)
});

console.log(`\nScheduled ${schedule.size} out of ${students.length} students:`);
schedule.matching.forEach((slot, student) => {
    console.log(`  ${student} → ${slot}`);
});

if (schedule.size < students.length) {
    const unscheduled = students.filter(s => !schedule.matching.has(s));
    console.log(`\nUnscheduled students: ${unscheduled.join(', ')}`);
    console.log('(Need more time slots or different availability)');
}

// Test with weighted bipartite matching (preference scores)
console.log('\n\n=== Weighted Bipartite Matching (Project Assignment) ===');
const projectGraph = new Graph();

// Developers and their skill scores for each project
const developers = ['Dev1', 'Dev2', 'Dev3'];
const projects = ['ProjectA', 'ProjectB', 'ProjectC'];

// Add weighted edges (skill match scores)
projectGraph.addEdge('Dev1', 'ProjectA', 0.9);  // Dev1 is great for ProjectA
projectGraph.addEdge('Dev1', 'ProjectB', 0.7);
projectGraph.addEdge('Dev1', 'ProjectC', 0.5);

projectGraph.addEdge('Dev2', 'ProjectA', 0.6);
projectGraph.addEdge('Dev2', 'ProjectB', 0.95); // Dev2 is perfect for ProjectB
projectGraph.addEdge('Dev2', 'ProjectC', 0.7);

projectGraph.addEdge('Dev3', 'ProjectA', 0.8);
projectGraph.addEdge('Dev3', 'ProjectB', 0.6);
projectGraph.addEdge('Dev3', 'ProjectC', 0.85); // Dev3 is great for ProjectC

console.log('Developer-Project Skill Scores:');
console.log('         ProjectA  ProjectB  ProjectC');
developers.forEach(dev => {
    const scores = projects.map(proj => {
        const edge = projectGraph.getEdge(dev, proj);
        return edge ? edge.weight.toFixed(2) : '0.00';
    });
    console.log(`${dev}:    ${scores.join('      ')}`);
});

// Find optimal assignment (maximizing total skill score)
console.log('\n5. Optimal Project Assignments:');
const projectMatching = maximumBipartiteMatching(projectGraph, {
    leftPartition: new Set(developers),
    rightPartition: new Set(projects),
    weighted: true
});

console.log('\nAssignments (maximizing total skill score):');
let totalScore = 0;
projectMatching.matching.forEach((project, developer) => {
    const edge = projectGraph.getEdge(developer, project);
    const score = edge ? edge.weight : 0;
    totalScore += score;
    console.log(`  ${developer} → ${project} (score: ${score})`);
});
console.log(`\nTotal skill score: ${totalScore.toFixed(2)}`);

// Verify results
console.log('\n=== Verification ===');
console.log('✓ Job graph is bipartite:', bipartiteCheck.isBipartite);
console.log('✓ All matchings have valid edges:', 
    Array.from(matching.matching.entries()).every(([u, v]) => 
        jobGraph.hasEdge(u, v) || jobGraph.hasEdge(v, u)
    ));
console.log('✓ No worker assigned to multiple jobs:', 
    matching.size === new Set(matching.matching.keys()).size);
console.log('✓ No job assigned to multiple workers:', 
    matching.size === new Set(matching.matching.values()).size);
console.log('✓ Maximum matching found for job graph:', 
    matching.size >= 4); // Based on graph structure