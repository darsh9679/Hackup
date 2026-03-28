// DSA Concept Dependency Graph
export const dsaConcepts = [
  { id: "Arrays", name: "Arrays", prerequisites: [], description: "Linear data structure with indexed elements" },
  { id: "Linked Lists", name: "Linked Lists", prerequisites: ["Arrays"], description: "Sequential nodes connected via pointers" },
  { id: "Stacks", name: "Stacks", prerequisites: ["Arrays", "Linked Lists"], description: "LIFO data structure" },
  { id: "Queues", name: "Queues", prerequisites: ["Arrays", "Linked Lists"], description: "FIFO data structure" },
  { id: "Sorting", name: "Sorting", prerequisites: ["Arrays"], description: "Ordering elements using comparison algorithms" },
  { id: "Searching", name: "Searching", prerequisites: ["Arrays", "Sorting"], description: "Finding elements efficiently" },
  { id: "Recursion", name: "Recursion", prerequisites: ["Stacks"], description: "Functions calling themselves to solve subproblems" },
  { id: "Trees", name: "Trees", prerequisites: ["Recursion", "Linked Lists"], description: "Hierarchical node-based structure" },
  { id: "Graphs", name: "Graphs", prerequisites: ["Trees", "Linked Lists"], description: "Nodes connected by edges in arbitrary topology" },
  { id: "DFS", name: "DFS", prerequisites: ["Graphs", "Recursion", "Stacks"], description: "Depth-first graph traversal" },
  { id: "BFS", name: "BFS", prerequisites: ["Graphs", "Queues"], description: "Breadth-first graph traversal" },
  { id: "Dynamic Programming", name: "Dynamic Programming", prerequisites: ["Recursion", "Arrays"], description: "Optimization via overlapping subproblems" },
];

export const dsaConceptNames = dsaConcepts.map(c => c.name);
