import { dsaConcepts } from "../data/dsaGraph";
import { osConcepts } from "../data/osGraph";
import { dbmsConcepts } from "../data/dbmsGraph";

function getGraph(subject, dynamicConcepts = null) {
  // If dynamic concepts are provided (custom subject), use them
  if (dynamicConcepts && Array.isArray(dynamicConcepts) && dynamicConcepts.length > 0) {
    return dynamicConcepts;
  }
  // Otherwise fall back to hardcoded graphs
  switch (subject) {
    case "DSA": return dsaConcepts;
    case "OS": return osConcepts;
    case "DBMS": return dbmsConcepts;
    default: return [];
  }
}

/**
 * Build adjacency map: concept → list of concepts that depend on it
 */
function buildDependentsMap(graph) {
  const dependents = {};
  graph.forEach(node => {
    dependents[node.id] = dependents[node.id] || [];
    node.prerequisites.forEach(prereq => {
      if (!dependents[prereq]) dependents[prereq] = [];
      dependents[prereq].push(node.id);
    });
  });
  return dependents;
}

/**
 * Get all ancestors (transitive prerequisites) of a concept
 */
function getAncestors(conceptId, graph, visited = new Set()) {
  if (visited.has(conceptId)) return [];
  visited.add(conceptId);
  const node = graph.find(n => n.id === conceptId);
  if (!node) return [];
  let ancestors = [...node.prerequisites];
  node.prerequisites.forEach(prereq => {
    ancestors = ancestors.concat(getAncestors(prereq, graph, visited));
  });
  return [...new Set(ancestors)];
}

/**
 * Graph-based root cause detection
 * Traverses backward through prerequisites to find the deepest weak concept
 * that affects the most downstream weak concepts
 *
 * @param {string} subject - Subject ID
 * @param {Array} weakConcepts - List of weak concept names
 * @param {Object} conceptScores - Map of concept → score
 * @param {Array|null} dynamicConcepts - AI-generated concept graph (for custom subjects)
 */
export function analyzeGraph(subject, weakConcepts, conceptScores, dynamicConcepts = null) {
  const graph = getGraph(subject, dynamicConcepts);
  if (graph.length === 0 || weakConcepts.length === 0) {
    return { rootCause: null, learningPath: weakConcepts, graphData: graph };
  }

  const dependentsMap = buildDependentsMap(graph);

  // Score each weak concept as a potential root cause
  const candidates = [];

  weakConcepts.forEach(weakConcept => {
    // How many other weak concepts depend on this one (directly or transitively)?
    const allDependents = getAllDependents(weakConcept, dependentsMap);
    const weakDependents = allDependents.filter(d => weakConcepts.includes(d));

    // Check if this concept is a prerequisite for other weak concepts
    const isPrereq = weakDependents.length > 0;

    // Depth: how deep in the prerequisite chain is this concept?
    const ancestors = getAncestors(weakConcept, graph);
    const depth = ancestors.length;

    // Score = (number of weak dependents * 3) + (100 - concept score) + (is prereq * 20) - depth
    const score = conceptScores[weakConcept] || 0;
    const impactScore =
      weakDependents.length * 30 +
      (100 - score) +
      (isPrereq ? 20 : 0);

    candidates.push({
      concept: weakConcept,
      score,
      weakDependents,
      impactScore,
      depth,
      isPrereq,
    });
  });

  // Sort by impact score descending — highest impact = best root cause
  candidates.sort((a, b) => b.impactScore - a.impactScore);

  const rootCandidate = candidates[0];
  if (!rootCandidate) {
    return { rootCause: null, learningPath: weakConcepts, graphData: graph };
  }

  // Calculate confidence based on how much this concept explains
  const totalWeak = weakConcepts.length;
  const explained = rootCandidate.weakDependents.length + 1; // +1 for itself
  const confidence = Math.min(0.99, Math.round((explained / totalWeak) * 100) / 100 + 0.1);

  // Generate learning path: start from root cause, follow prerequisite order
  const rawPath = generateLearningPath(rootCandidate.concept, weakConcepts, graph);
  
  const learningPath = rawPath.map(conceptId => {
    const node = graph.find(n => n.id === conceptId);
    let prereqsToCover = [];
    if (node && node.prerequisites) {
      // Find prerequisites of this concept that the user is weak at
      prereqsToCover = node.prerequisites.filter(p => weakConcepts.includes(p) || (conceptScores[p] !== undefined && conceptScores[p] < 50));
    }
    return {
      concept: conceptId,
      prereqsToCover
    };
  });
  const rootCause = {
    concept: rootCandidate.concept,
    confidence,
    reason: buildReason(rootCandidate, conceptScores),
    supportingWeakConcepts: rootCandidate.weakDependents,
  };

  return { rootCause, learningPath, graphData: graph };
}

function getAllDependents(conceptId, dependentsMap, visited = new Set()) {
  if (visited.has(conceptId)) return [];
  visited.add(conceptId);
  const direct = dependentsMap[conceptId] || [];
  let all = [...direct];
  direct.forEach(dep => {
    all = all.concat(getAllDependents(dep, dependentsMap, visited));
  });
  return [...new Set(all)];
}

function generateLearningPath(rootCause, weakConcepts, graph) {
  // Topological order of weak concepts, starting from root cause
  const visited = new Set();
  const path = [];

  function visit(conceptId) {
    if (visited.has(conceptId)) return;
    visited.add(conceptId);
    const node = graph.find(n => n.id === conceptId);
    if (!node) return;
    // Visit prerequisites first
    node.prerequisites.forEach(prereq => {
      if (weakConcepts.includes(prereq)) visit(prereq);
    });
    path.push(conceptId);
  }

  // Start with root cause
  visit(rootCause);
  // Then add remaining weak concepts
  weakConcepts.forEach(c => visit(c));

  return path;
}

function buildReason(candidate, conceptScores) {
  const score = conceptScores[candidate.concept] || 0;
  const deps = candidate.weakDependents;

  if (deps.length > 0) {
    return `${candidate.concept} has a mastery score of only ${score}% and is a prerequisite for ${deps.join(", ")}. Strengthening ${candidate.concept} first will help improve understanding of these dependent topics.`;
  }
  return `${candidate.concept} has the lowest mastery score (${score}%) among weak concepts and represents a fundamental gap in understanding.`;
}
