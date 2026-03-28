// OS Concept Dependency Graph
export const osConcepts = [
  { id: "Processes", name: "Processes", prerequisites: [], description: "Program in execution with its own memory space" },
  { id: "Threads", name: "Threads", prerequisites: ["Processes"], description: "Lightweight units of execution within a process" },
  { id: "CPU Scheduling", name: "CPU Scheduling", prerequisites: ["Processes", "Threads"], description: "Algorithms to allocate CPU time to processes" },
  { id: "Synchronization", name: "Synchronization", prerequisites: ["Threads", "Processes"], description: "Coordinating concurrent access to shared resources" },
  { id: "Deadlocks", name: "Deadlocks", prerequisites: ["Synchronization", "CPU Scheduling"], description: "Circular wait among processes for resources" },
  { id: "Memory Management", name: "Memory Management", prerequisites: ["Processes"], description: "Allocation and tracking of main memory" },
  { id: "Paging", name: "Paging", prerequisites: ["Memory Management"], description: "Dividing memory into fixed-size pages" },
  { id: "Virtual Memory", name: "Virtual Memory", prerequisites: ["Paging", "Memory Management"], description: "Abstraction giving each process its own address space" },
  { id: "File Systems", name: "File Systems", prerequisites: ["Memory Management"], description: "Organization and storage of data on disk" },
];

export const osConceptNames = osConcepts.map(c => c.name);
