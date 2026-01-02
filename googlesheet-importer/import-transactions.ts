import { getTransactions } from "./transactions";
import { createTransaction } from "@/features/financial-accounts/mutations/create-transaction";
import { createConsolidation } from "@/features/consolidations/mutations/create-consolidation";
import { createProjectMisc } from "@/features/projects/mutations/create-project-misc";
import { db } from "@/db";
import {
  transactionConsolidationGroups,
  transactionBudgetCategories,
  projectStreams,
} from "@/lib/constants";
import z from "zod";
import { createConsolidationWithTransactionIdSchema } from "@/features/consolidations";

// Account IDs
const BANK_ACCOUNT_ID = "ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d";
const CASH_ACCOUNT_ID = "1585ae15-8217-40f9-81d9-de856f31e4dc";

// Helper to parse date strings from Google Sheets format
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Determine consolidation group from category
function getConsolidationGroup(category: string): string {
  const cat = category.toLowerCase().trim();
  if (cat === "project") return "project";
  if (cat === "unspecified") return "unclassified";
  if (cat === "asset" || cat === "contingency") return "budget";
  if (cat === "tax") return "tax";
  if (cat === "refund") return "refund";
  if (cat === "refunded") return "refunded";
  return "unclassified";
}

// Get budget category from tags
function getBudgetCategory(
  originalCategory: string,
  tags: string
): (typeof transactionBudgetCategories)[number] | undefined {
  if (originalCategory === "asset") return "tool";
  if ((originalCategory === "contingency" && !tags) || tags === "gst")
    return "consumable";

  if (!tags) return undefined;
  const tagLower = tags.toLowerCase();
  if (tagLower.includes("toll")) return "toll";
  if (tagLower.includes("insurance") || tagLower.includes("subscription"))
    return "subscription";
  if (
    tagLower.includes("marketing") ||
    tagLower.includes("car") ||
    tagLower.includes("consumable")
  )
    return "consumable";
  if (tagLower.includes("food")) return "food";
  if (tagLower.includes("salary")) return "salary";
  if (tagLower.includes("fuel")) return "fuel";
  if (tagLower.includes("tool")) return "tool";
  return undefined;
}

// Check if GST is in category (multi-value column)
function isGst(category: string): boolean {
  if (!category) return false;
  const catLower = category.toLowerCase();
  return catLower.includes("gst");
}

// Determine transaction type from amount
function getTransactionType(amount: number): "income" | "expense" {
  return amount >= 0 ? "income" : "expense";
}

// Find project item that matches consolidation amount
async function findMatchingProjectItem(
  projectId: string,
  consolidationAmount: number,
  consolidationDate: string
): Promise<{
  stream: (typeof projectStreams)[number] | null;
  itemId: string | null;
}> {
  const amountCents = Math.round(Math.abs(consolidationAmount) * 100);
  const tolerance = 1; // 1 cent tolerance

  // Check supplies
  const supplies = await db
    .selectFrom("projectSupplies")
    .where("projectId", "=", projectId)
    .where("consolidationId", "is", null) // Only unmatched items
    .select(["id", "quantity", "unitPrice"])
    .execute();

  for (const supply of supplies) {
    const totalCost = supply.quantity * supply.unitPrice;
    if (Math.abs(totalCost - amountCents) <= tolerance) {
      return { stream: "supplies", itemId: supply.id };
    }
  }

  // Check labors
  const labors = await db
    .selectFrom("projectLabors")
    .where("projectId", "=", projectId)
    .where("consolidationId", "is", null)
    .select(["id", "hours", "rate"])
    .execute();

  for (const labor of labors) {
    const totalCost = labor.hours * labor.rate;
    if (Math.abs(totalCost - amountCents) <= tolerance) {
      return { stream: "labors", itemId: labor.id };
    }
  }

  // Check misc
  const misc = await db
    .selectFrom("projectMisc")
    .where("projectId", "=", projectId)
    .where("consolidationId", "is", null)
    .select(["id", "amount"])
    .execute();

  for (const miscItem of misc) {
    if (Math.abs(miscItem.amount - amountCents) <= tolerance) {
      return { stream: "misc", itemId: miscItem.id };
    }
  }

  // Check payments
  const payments = await db
    .selectFrom("projectPayments")
    .where("projectId", "=", projectId)
    .where("consolidationId", "is", null)
    .select(["id", "amount", "date"])
    .execute();

  // For payments, also check date proximity
  const consolidationDateObj = parseDate(consolidationDate);
  for (const payment of payments) {
    if (Math.abs(payment.amount - amountCents) <= tolerance) {
      // If dates are close (within 7 days), consider it a match
      if (consolidationDateObj && payment.date) {
        const dateDiff = Math.abs(
          consolidationDateObj.getTime() - payment.date.getTime()
        );
        const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
        if (daysDiff <= 7) {
          return { stream: "payments", itemId: payment.id };
        }
      } else {
        // If no date info, match by amount only
        return { stream: "payments", itemId: payment.id };
      }
    }
  }

  return { stream: null, itemId: null };
}

export async function importTransactions(projectMapping: Map<string, string>) {
  console.log("Loading transactions from Google Sheets...\n");
  const { cashTransactions, bankTransactions } = await getTransactions();

  if (cashTransactions.length === 0 && bankTransactions.length === 0) {
    console.log("No transactions found to import.");
    return;
  }

  console.log(
    `\n=== IMPORTING TRANSACTIONS ===\nCash: ${cashTransactions.length}, Bank: ${bankTransactions.length}\n`
  );

  let transactionCount = 0;
  let consolidationCount = 0;
  let errorCount = 0;
  const errors: Array<{
    type: string;
    description: string;
    error: string;
  }> = [];
  const warnings: Array<{
    type: string;
    description: string;
    warning: string;
  }> = [];

  // Import cash transactions
  for (const cashTx of cashTransactions) {
    try {
      const txDate = parseDate(cashTx.time);
      if (!txDate) {
        warnings.push({
          type: "cash",
          description: cashTx.description,
          warning: "Invalid date, skipping transaction",
        });
        continue;
      }

      const txType = getTransactionType(cashTx.amount);
      const amountCents = Math.round(Math.abs(cashTx.amount) * 100);

      // Create transaction
      const transaction = await createTransaction({
        accountId: CASH_ACCOUNT_ID,
        date: txDate,
        description: cashTx.description,
        amount: amountCents,
        type: txType,
      });

      transactionCount++;
      console.log(
        `  ✓ Cash transaction: ${cashTx.description} (${amountCents} cents)`
      );

      // Create consolidations for this transaction
      for (const consolidation of cashTx.consolidations) {
        try {
          const consAmountCents = Math.round(
            Math.abs(consolidation.amount) * 100
          );
          let consolidationGroup = getConsolidationGroup(
            consolidation.category
          );
          const budgetCategory = getBudgetCategory(
            consolidation.category,
            consolidation.tags
          );
          const isGstValue = isGst(consolidation.tags);

          // Validate consolidation group
          if (
            !transactionConsolidationGroups.includes(
              consolidationGroup as (typeof transactionConsolidationGroups)[number]
            )
          ) {
            warnings.push({
              type: "consolidation",
              description: consolidation.description,
              warning: `Unknown consolidation group: ${consolidationGroup}, using unclassified`,
            });
            consolidationGroup = "unclassified";
          }

          // Find project if consolidation has project field
          let projectId: string | undefined;
          let projectStream: (typeof projectStreams)[number] | undefined;
          let projectItemId: string | undefined;

          if (consolidation.project) {
            const mappedProjectId = projectMapping.get(consolidation.project);
            if (mappedProjectId) {
              projectId = mappedProjectId;
              // Try to find matching project item
              const match = await findMatchingProjectItem(
                projectId,
                consolidation.amount,
                consolidation.time
              );
              if (match.stream && match.itemId) {
                projectStream = match.stream;
                projectItemId = match.itemId;
              } else {
                // No matching item found - create a new misc expense
                const miscName =
                  consolidation.description || "Imported expense";
                const miscAmount = Math.round(
                  Math.abs(consolidation.amount) * 100
                );
                try {
                  const createdMisc = await createProjectMisc({
                    projectId,
                    name: miscName,
                    amount: miscAmount,
                  });
                  projectStream = "misc";
                  projectItemId = createdMisc.id;
                  console.log(
                    `  ✓ Created misc expense for project ${consolidation.project}: ${miscName} (${miscAmount} cents)`
                  );
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);
                  warnings.push({
                    type: "consolidation",
                    description: consolidation.description,
                    warning: `Project ${consolidation.project} found but failed to create misc item: ${errorMessage}`,
                  });
                }
              }
            } else {
              warnings.push({
                type: "consolidation",
                description: consolidation.description,
                warning: `Project ${consolidation.project} not found in imported projects`,
              });
            }
          }

          // Determine final consolidation group
          let finalGroup: (typeof transactionConsolidationGroups)[number] =
            "unclassified";
          if (projectId && projectStream && projectItemId) {
            finalGroup = "project";
          } else if (consolidationGroup === "budget" && budgetCategory) {
            finalGroup = "budget";
          } else {
            finalGroup =
              consolidationGroup as (typeof transactionConsolidationGroups)[number];
          }

          // Create consolidation
          const consolidationData = {
            transactionId: transaction.id,
            amount: consAmountCents,
            description: consolidation.description || undefined,
            consolidationGroup: finalGroup,
            isGst: isGstValue,
          } as z.infer<typeof createConsolidationWithTransactionIdSchema>;

          if (finalGroup === "budget" && budgetCategory) {
            consolidationData.budgetCategory = budgetCategory;
          }

          if (
            finalGroup === "project" &&
            projectId &&
            projectStream &&
            projectItemId
          ) {
            consolidationData.projectId = projectId;
            consolidationData.projectStream = projectStream;
            consolidationData.projectItemId = projectItemId;
          }

          await createConsolidation(consolidationData);
          consolidationCount++;
        } catch (error) {
          errorCount++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push({
            type: "consolidation",
            description: consolidation.description || "Unknown",
            error: errorMessage,
          });
          console.error(`  ✗ Error creating consolidation: ${errorMessage}`);
        }
      }
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({
        type: "cash_transaction",
        description: cashTx.description,
        error: errorMessage,
      });
      console.error(`  ✗ Error importing cash transaction: ${errorMessage}`);
    }
  }

  // Import bank transactions
  for (const bankTx of bankTransactions) {
    try {
      const txDate = parseDate(bankTx.time);
      if (!txDate) {
        warnings.push({
          type: "bank",
          description: bankTx.description,
          warning: "Invalid date, skipping transaction",
        });
        continue;
      }

      const txType = getTransactionType(bankTx.amount);
      const amountCents = Math.round(Math.abs(bankTx.amount) * 100);

      // Create transaction
      const transaction = await createTransaction({
        accountId: BANK_ACCOUNT_ID,
        date: txDate,
        description: bankTx.description,
        amount: amountCents,
        type: txType,
      });

      transactionCount++;
      console.log(
        `  ✓ Bank transaction: ${bankTx.description} (${amountCents} cents)`
      );

      // Create consolidation for this transaction (1:1 relationship)
      try {
        const consolidation = bankTx.consolidation;
        const consAmountCents = Math.round(
          Math.abs(consolidation.amount) * 100
        );
        let consolidationGroup = getConsolidationGroup(consolidation.category);
        const budgetCategory = getBudgetCategory(
          consolidation.category,
          consolidation.tags
        );
        const isGstValue = isGst(consolidation.tags);

        // Validate consolidation group
        if (
          !transactionConsolidationGroups.includes(
            consolidationGroup as (typeof transactionConsolidationGroups)[number]
          )
        ) {
          warnings.push({
            type: "consolidation",
            description: consolidation.description,
            warning: `Unknown consolidation group: ${consolidationGroup}, using unclassified`,
          });
          consolidationGroup = "unclassified";
        }

        // Find project if consolidation has project field
        let projectId: string | undefined;
        let projectStream: (typeof projectStreams)[number] | undefined;
        let projectItemId: string | undefined;

        if (consolidation.project) {
          const mappedProjectId = projectMapping.get(consolidation.project);
          if (mappedProjectId) {
            projectId = mappedProjectId;
            // Try to find matching project item
            const match = await findMatchingProjectItem(
              projectId,
              consolidation.amount,
              consolidation.time
            );
            if (match.stream && match.itemId) {
              projectStream = match.stream;
              projectItemId = match.itemId;
            } else {
              // No matching item found - create a new misc expense
              const miscName = consolidation.description || "Imported expense";
              const miscAmount = Math.round(
                Math.abs(consolidation.amount) * 100
              );
              try {
                const createdMisc = await createProjectMisc({
                  projectId,
                  name: miscName,
                  amount: miscAmount,
                });
                projectStream = "misc";
                projectItemId = createdMisc.id;
                console.log(
                  `  ✓ Created misc expense for project ${consolidation.project}: ${miscName} (${miscAmount} cents)`
                );
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                warnings.push({
                  type: "consolidation",
                  description: consolidation.description,
                  warning: `Project ${consolidation.project} found but failed to create misc item: ${errorMessage}`,
                });
              }
            }
          } else {
            warnings.push({
              type: "consolidation",
              description: consolidation.description,
              warning: `Project ${consolidation.project} not found in imported projects`,
            });
          }
        }

        // Determine final consolidation group
        let finalGroup: (typeof transactionConsolidationGroups)[number] =
          "unclassified";
        if (projectId && projectStream && projectItemId) {
          finalGroup = "project";
        } else if (consolidationGroup === "budget" && budgetCategory) {
          finalGroup = "budget";
        } else {
          finalGroup =
            consolidationGroup as (typeof transactionConsolidationGroups)[number];
        }

        // Create consolidation
        const consolidationData: z.infer<
          typeof createConsolidationWithTransactionIdSchema
        > = {
          transactionId: transaction.id,
          amount: consAmountCents,
          description: consolidation.description || undefined,
          consolidationGroup: finalGroup,
          isGst: isGstValue,
        };

        if (finalGroup === "budget" && budgetCategory) {
          consolidationData.budgetCategory = budgetCategory;
        }

        if (
          finalGroup === "project" &&
          projectId &&
          projectStream &&
          projectItemId
        ) {
          consolidationData.projectId = projectId;
          consolidationData.projectStream = projectStream;
          consolidationData.projectItemId = projectItemId;
        }

        await createConsolidation(consolidationData);
        consolidationCount++;
      } catch (error) {
        errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({
          type: "consolidation",
          description: bankTx.consolidation.description || "Unknown",
          error: errorMessage,
        });
        console.error(`  ✗ Error creating consolidation: ${errorMessage}`);
      }
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push({
        type: "bank_transaction",
        description: bankTx.description,
        error: errorMessage,
      });
      console.error(`  ✗ Error importing bank transaction: ${errorMessage}`);
    }
  }

  // Summary
  console.log("\n=== IMPORT SUMMARY ===");
  console.log(`Transactions created: ${transactionCount}`);
  console.log(`Consolidations created: ${consolidationCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Warnings: ${warnings.length}`);

  if (warnings.length > 0) {
    console.log("\n=== WARNINGS (Please Review) ===");
    console.table(warnings);
  }

  if (errors.length > 0) {
    console.log("\n=== ERRORS ===");
    console.table(errors);
  }

  return {
    transactions: transactionCount,
    consolidations: consolidationCount,
    errors: errorCount,
    warnings: warnings.length,
    errorDetails: errors,
    warningDetails: warnings,
  };
}
