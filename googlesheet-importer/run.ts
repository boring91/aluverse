import { importProjects } from "./import-projects";
import { importTransactions } from "./import-transactions";

// Step 1: Import projects (this returns a mapping of old job IDs to new project UUIDs)
console.log("=== STEP 1: IMPORTING PROJECTS ===\n");
const projectResult = await importProjects();

if (!projectResult || !projectResult.projectMapping) {
  console.error("Failed to import projects or get project mapping");
  process.exit(1);
}

// Step 2: Import transactions and consolidations (using the project mapping)
console.log("\n\n=== STEP 2: IMPORTING TRANSACTIONS ===\n");
await importTransactions(projectResult.projectMapping);

console.log("\n\n=== IMPORT COMPLETE ===");
