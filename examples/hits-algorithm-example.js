// HITS Algorithm Example (Hyperlink-Induced Topic Search)
import { Graph, hits } from '../dist/algorithms.js';

console.log('=== HITS Algorithm Example ===');

// Create a web graph
const webGraph = new Graph({ directed: true });

// Hub pages (link to many authorities)
webGraph.addNode('TechNewsHub');
webGraph.addNode('SciencePortal');
webGraph.addNode('AcademicDirectory');

// Authority pages (linked by many hubs)
webGraph.addNode('MIT_AI_Lab');
webGraph.addNode('Stanford_ML');
webGraph.addNode('DeepMind');
webGraph.addNode('OpenAI');

// Mixed pages (both hub and authority characteristics)
webGraph.addNode('Wikipedia_AI');
webGraph.addNode('ArXiv');

// Regular pages
webGraph.addNode('Blog1');
webGraph.addNode('Blog2');
webGraph.addNode('ResearchPaper1');
webGraph.addNode('ResearchPaper2');

// Hub pages linking to authorities
webGraph.addEdge('TechNewsHub', 'MIT_AI_Lab');
webGraph.addEdge('TechNewsHub', 'Stanford_ML');
webGraph.addEdge('TechNewsHub', 'DeepMind');
webGraph.addEdge('TechNewsHub', 'OpenAI');
webGraph.addEdge('TechNewsHub', 'Wikipedia_AI');

webGraph.addEdge('SciencePortal', 'MIT_AI_Lab');
webGraph.addEdge('SciencePortal', 'Stanford_ML');
webGraph.addEdge('SciencePortal', 'ArXiv');

webGraph.addEdge('AcademicDirectory', 'MIT_AI_Lab');
webGraph.addEdge('AcademicDirectory', 'Stanford_ML');
webGraph.addEdge('AcademicDirectory', 'DeepMind');
webGraph.addEdge('AcademicDirectory', 'ArXiv');

// Mixed pages behavior
webGraph.addEdge('Wikipedia_AI', 'MIT_AI_Lab');
webGraph.addEdge('Wikipedia_AI', 'DeepMind');
webGraph.addEdge('ArXiv', 'ResearchPaper1');
webGraph.addEdge('ArXiv', 'ResearchPaper2');

// Blog references
webGraph.addEdge('Blog1', 'Wikipedia_AI');
webGraph.addEdge('Blog1', 'OpenAI');
webGraph.addEdge('Blog2', 'Stanford_ML');
webGraph.addEdge('Blog2', 'Wikipedia_AI');

// Authority pages linking to each other
webGraph.addEdge('MIT_AI_Lab', 'Stanford_ML');
webGraph.addEdge('Stanford_ML', 'MIT_AI_Lab');
webGraph.addEdge('DeepMind', 'OpenAI');

// Research papers citing authorities
webGraph.addEdge('ResearchPaper1', 'MIT_AI_Lab');
webGraph.addEdge('ResearchPaper2', 'Stanford_ML');

console.log('Web Graph Structure:');
console.log('');
console.log('HUBS (link aggregators):        AUTHORITIES (content sources):');
console.log('  TechNewsHub ─────────────┬───→ MIT_AI_Lab');
console.log('  SciencePortal ──────────┼───→ Stanford_ML');
console.log('  AcademicDirectory ──────┼───→ DeepMind');
console.log('                          └───→ OpenAI');
console.log('');
console.log('MIXED (both hub & authority):');
console.log('  Wikipedia_AI ←→ ArXiv');
console.log('');
console.log('Plus: Blog1, Blog2, ResearchPaper1, ResearchPaper2');

// Calculate HITS scores
console.log('\n1. HITS Algorithm Results:');
const hitsScores = hits(webGraph);

console.log('\nHub Scores (good at pointing to authorities):');
Object.entries(hitsScores.hubs)
    .sort((a, b) => b[1] - a[1])
    .forEach(([page, score]) => {
        const outDegree = webGraph.outDegree(page);
        console.log(`  ${page.padEnd(20)} ${score.toFixed(4)} (links to ${outDegree} pages)`);
    });

console.log('\nAuthority Scores (good content that hubs point to):');
Object.entries(hitsScores.authorities)
    .sort((a, b) => b[1] - a[1])
    .forEach(([page, score]) => {
        const inDegree = webGraph.inDegree(page);
        console.log(`  ${page.padEnd(20)} ${score.toFixed(4)} (linked by ${inDegree} pages)`);
    });

// Create a scientific citation network
console.log('\n\n=== Scientific Citation Network ===');
const citationNetwork = new Graph({ directed: true });

// Review papers (potential hubs)
citationNetwork.addNode('Review_ML_2020');
citationNetwork.addNode('Review_DL_2021');
citationNetwork.addNode('Survey_NLP_2022');

// Foundational papers (potential authorities)
citationNetwork.addNode('Turing_1950');
citationNetwork.addNode('Rosenblatt_1958');
citationNetwork.addNode('Hinton_2006');
citationNetwork.addNode('LeCun_1998');
citationNetwork.addNode('Vaswani_2017');

// Regular papers
citationNetwork.addNode('Paper_A');
citationNetwork.addNode('Paper_B');
citationNetwork.addNode('Paper_C');

// Review papers cite foundational works
citationNetwork.addEdge('Review_ML_2020', 'Turing_1950');
citationNetwork.addEdge('Review_ML_2020', 'Rosenblatt_1958');
citationNetwork.addEdge('Review_ML_2020', 'Hinton_2006');
citationNetwork.addEdge('Review_ML_2020', 'LeCun_1998');

citationNetwork.addEdge('Review_DL_2021', 'Hinton_2006');
citationNetwork.addEdge('Review_DL_2021', 'LeCun_1998');
citationNetwork.addEdge('Review_DL_2021', 'Vaswani_2017');

citationNetwork.addEdge('Survey_NLP_2022', 'Vaswani_2017');
citationNetwork.addEdge('Survey_NLP_2022', 'Turing_1950');

// Regular papers cite both reviews and foundational works
citationNetwork.addEdge('Paper_A', 'Review_ML_2020');
citationNetwork.addEdge('Paper_A', 'Hinton_2006');
citationNetwork.addEdge('Paper_B', 'Review_DL_2021');
citationNetwork.addEdge('Paper_B', 'LeCun_1998');
citationNetwork.addEdge('Paper_C', 'Vaswani_2017');

console.log('Citation Network:');
console.log('Review Papers → Foundational Papers ← Regular Papers');

// Calculate HITS for citation network
console.log('\n2. HITS in Citation Network:');
const citationHits = hits(citationNetwork);

console.log('\nHub Scores (comprehensive citing papers):');
Object.entries(citationHits.hubs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([paper, score]) => {
        const citations = webGraph.outDegree(paper);
        console.log(`  ${paper.padEnd(20)} ${score.toFixed(4)}`);
    });

console.log('\nAuthority Scores (influential cited papers):');
Object.entries(citationHits.authorities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([paper, score]) => {
        console.log(`  ${paper.padEnd(20)} ${score.toFixed(4)}`);
    });

// Test convergence with different parameters
console.log('\n\n=== Convergence Analysis ===');
const testGraph = new Graph({ directed: true });

// Create a bipartite-like structure
const hubs = ['H1', 'H2', 'H3'];
const authorities = ['A1', 'A2', 'A3', 'A4'];

hubs.forEach(hub => {
    authorities.forEach(auth => {
        if (Math.random() > 0.3) {
            testGraph.addEdge(hub, auth);
        }
    });
});

console.log('\n3. Testing convergence with different tolerances:');
const tolerances = [1e-4, 1e-6, 1e-8];

for (const tol of tolerances) {
    const start = Date.now();
    const result = hits(testGraph, { tolerance: tol });
    const time = Date.now() - start;
    
    console.log(`\nTolerance ${tol}:`);
    console.log(`  Time: ${time}ms`);
    console.log(`  H1 hub score: ${result.hubs['H1']?.toFixed(8) || 'N/A'}`);
    console.log(`  A1 authority score: ${result.authorities['A1']?.toFixed(8) || 'N/A'}`);
}

// Compare HITS with PageRank
console.log('\n\n=== HITS vs PageRank Comparison ===');
const { pageRank } = await import('../dist/algorithms.js');

console.log('\n4. Comparing rankings on web graph:');
const prScores = pageRank(webGraph);

// Get top 5 by each metric
const topHubs = Object.entries(hitsScores.hubs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([node]) => node);

const topAuthorities = Object.entries(hitsScores.authorities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([node]) => node);

const topPageRank = Object.entries(prScores.ranks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([node]) => node);

console.log('\nTop 5 Rankings:');
console.log('Rank | HITS Hubs          | HITS Authorities   | PageRank');
console.log('-----|-------------------|-------------------|------------------');
for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}  | ${(topHubs[i] || '').padEnd(17)} | ${(topAuthorities[i] || '').padEnd(17)} | ${topPageRank[i] || ''}`);
}

// Test with different iteration limits
console.log('\n\n5. Testing with different iteration limits:');
const iterations = [10, 50, 100];
for (const maxIter of iterations) {
    const result = hits(webGraph, { maxIterations: maxIter });
    const topHub = Object.entries(result.hubs).sort((a, b) => b[1] - a[1])[0];
    const topAuth = Object.entries(result.authorities).sort((a, b) => b[1] - a[1])[0];
    
    console.log(`\nMax iterations: ${maxIter}`);
    console.log(`  Top hub: ${topHub[0]} (${topHub[1].toFixed(4)})`);
    console.log(`  Top authority: ${topAuth[0]} (${topAuth[1].toFixed(4)})`);
}

// Verify results
console.log('\n=== Verification ===');
console.log('✓ TechNewsHub should be a top hub:', 
    topHubs.includes('TechNewsHub'));
console.log('✓ MIT_AI_Lab should be a top authority:', 
    topAuthorities.includes('MIT_AI_Lab'));
console.log('✓ All scores should be between 0 and 1:', 
    Object.values(hitsScores.hubs).every(s => s >= 0 && s <= 1) &&
    Object.values(hitsScores.authorities).every(s => s >= 0 && s <= 1));
console.log('✓ Sum of squared hub scores should be ~1:', 
    Math.abs(Object.values(hitsScores.hubs).reduce((sum, s) => sum + s * s, 0) - 1) < 0.01);
console.log('✓ Sum of squared authority scores should be ~1:', 
    Math.abs(Object.values(hitsScores.authorities).reduce((sum, s) => sum + s * s, 0) - 1) < 0.01);