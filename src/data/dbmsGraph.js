// DBMS Concept Dependency Graph
export const dbmsConcepts = [
  { id: "Tables", name: "Tables", prerequisites: [], description: "Relations storing data in rows and columns" },
  { id: "Keys", name: "Keys", prerequisites: ["Tables"], description: "Primary, foreign, and candidate keys for identification" },
  { id: "Relationships", name: "Relationships", prerequisites: ["Keys", "Tables"], description: "Associations between entities / tables" },
  { id: "SQL Queries", name: "SQL Queries", prerequisites: ["Tables", "Keys"], description: "Structured query language for data manipulation" },
  { id: "Joins", name: "Joins", prerequisites: ["Relationships", "SQL Queries", "Keys"], description: "Combining rows from multiple tables" },
  { id: "Normalization", name: "Normalization", prerequisites: ["Relationships", "Keys", "Joins"], description: "Reducing redundancy through normal forms" },
  { id: "Transactions", name: "Transactions", prerequisites: ["SQL Queries"], description: "ACID-compliant units of work" },
  { id: "Concurrency Control", name: "Concurrency Control", prerequisites: ["Transactions"], description: "Managing simultaneous data access" },
  { id: "Indexing", name: "Indexing", prerequisites: ["Tables", "Keys", "SQL Queries"], description: "Data structures to speed up query lookups" },
];

export const dbmsConceptNames = dbmsConcepts.map(c => c.name);
