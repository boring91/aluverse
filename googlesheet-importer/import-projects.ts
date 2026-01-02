import { getProjects } from "./projects";
import { createProject } from "@/features/projects/mutations/create-project";
import { createProjectSupply } from "@/features/projects/mutations/create-project-supply";
import { createProjectLabor } from "@/features/projects/mutations/create-project-labor";
import { createProjectMisc } from "@/features/projects/mutations/create-project-misc";
import { createProjectPayment } from "@/features/projects/mutations/create-project-payment";

// Account IDs provided by user (for future use when linking to transactions/consolidations)
// const BANK_ACCOUNT_ID = "ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d";
// const CASH_ACCOUNT_ID = "1585ae15-8217-40f9-81d9-de856f31e4dc";

// Helper to parse date strings from Google Sheets format (e.g., "Mon, May 5, 2025")
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Helper to extract client name from title
// If title contains a dash or comma, use the part before it as client
// Otherwise, use the title as client
function extractClient(title: string): string {
  if (!title) return "Unknown";
  // Try to split by common separators
  const separators = [" - ", " – ", " — ", ", "];
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length > 1) {
      return parts[0].trim();
    }
  }
  // If no separator found, use title as client
  return title;
}

export async function importProjects() {
  console.log("Loading projects from Google Sheets...\n");
  const projects = await getProjects();

  if (projects.length === 0) {
    console.log("No projects found to import.");
    return {
      total: 0,
      success: 0,
      errors: 0,
      errorDetails: [],
      projectMapping: new Map<string, string>(), // old job ID -> new project UUID
    };
  }

  console.log(`\n=== IMPORTING ${projects.length} PROJECTS ===\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ projectId: string; title: string; error: string }> = [];
  // Map old job ID to new project UUID
  const projectMapping = new Map<string, string>();

  for (const project of projects) {
    try {
      console.log(`Importing ${project.id}: ${project.title}...`);

      // Parse dates
      const visitDate = parseDate(project.visitDate);
      const startDate = parseDate(project.startDate);
      const endDate = parseDate(project.endDate);

      // Extract client from title
      const client = extractClient(project.title);

      // Create project
      // Note: The schema expects dollars, but when calling the mutation directly,
      // we need to convert to cents since the DB stores cents and the API router
      // normally does this conversion. We'll pass cents and cast the type.
      const createdProject = await createProject({
        client,
        title: project.title,
        visitDate: visitDate || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        address: project.address || undefined,
        meters: project.meters || undefined,
        price: Math.round(project.price * 100), // Convert dollars to cents and round
      } as Parameters<typeof createProject>[0]);

      const projectId = createdProject.id;
      // Store mapping from old job ID to new project UUID
      projectMapping.set(project.id, projectId);
      console.log(`  ✓ Project created: ${projectId}`);

      // Import supplies
      for (const supply of project.supplies) {
        if (supply.name && supply.units > 0 && supply.cost > 0) {
          const unitPrice = supply.cost / supply.units; // Calculate unit price
          await createProjectSupply({
            projectId,
            name: supply.name,
            quantity: Math.round(supply.units), // Round to integer
            unitPrice: Math.round(unitPrice * 100), // Convert to cents and round
          });
        }
      }
      if (project.supplies.length > 0) {
        console.log(`  ✓ ${project.supplies.length} supplies imported`);
      }

      // Import labors
      for (const labor of project.labors) {
        if (labor.name && labor.hours > 0 && labor.ratePerHour > 0) {
          await createProjectLabor({
            projectId,
            name: labor.name,
            hours: Math.round(labor.hours), // Round to integer (DB column is integer)
            rate: Math.round(labor.ratePerHour * 100), // Convert to cents per hour and round
          });
        }
      }
      if (project.labors.length > 0) {
        console.log(`  ✓ ${project.labors.length} labors imported`);
      }

      // Import misc expenses
      for (const misc of project.misc) {
        if (misc.name && misc.cost > 0) {
          await createProjectMisc({
            projectId,
            name: misc.name,
            amount: Math.round(misc.cost * 100), // Convert to cents and round
          });
        }
      }
      if (project.misc.length > 0) {
        console.log(`  ✓ ${project.misc.length} misc expenses imported`);
      }

      // Import payments
      for (const payment of project.payments) {
        if (payment.amount !== 0) {
          const paymentDate = parseDate(payment.time);
          if (paymentDate) {
            await createProjectPayment({
              projectId,
              date: paymentDate,
              amount: Math.round(Math.abs(payment.amount) * 100), // Convert to cents, ensure positive, and round
            });
          }
        }
      }
      if (project.payments.length > 0) {
        console.log(`  ✓ ${project.payments.length} payments imported`);
      }

      successCount++;
      console.log(`  ✓ Completed ${project.id}\n`);
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({
        projectId: project.id,
        title: project.title,
        error: errorMessage,
      });
      console.error(`  ✗ Error importing ${project.id}: ${errorMessage}\n`);
    }
  }

  // Summary
  console.log("\n=== IMPORT SUMMARY ===");
  console.log(`Total projects: ${projects.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n=== ERRORS ===");
    console.table(errors);
  }

  return {
    total: projects.length,
    success: successCount,
    errors: errorCount,
    errorDetails: errors,
    projectMapping, // Return mapping for use in transactions import
  };
}
