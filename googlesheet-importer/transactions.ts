import { sheets } from "./utils";

// Types
type Consolidation = {
  time: string;
  amount: number;
  description: string;
  category: string;
  tags: string;
  project: string;
};

type CashTransaction = {
  time: string;
  amount: number;
  description: string;
  aggregation: number;
  consolidations: Consolidation[];
};

type BankTransaction = {
  time: string;
  amount: number;
  description: string;
  category: string;
  tags: string;
  project: string;
  consolidation: Consolidation; // Always exactly one consolidation
};

// Helper to parse currency strings like "$1,200.00" or "$(600.00)" or "(600.00)"
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[$,\s]/g, "");
  const isNegative = cleaned.includes("(") && cleaned.includes(")");
  const numStr = cleaned.replace(/[()]/g, "");
  const value = parseFloat(numStr) || 0;
  return isNegative ? -value : value;
}

// Normalize date for comparison
function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr.trim().toLowerCase();
  return date.toISOString().split("T")[0];
}

// Calculate description similarity (simple word overlap)
function descriptionSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

// Find all subsets of consolidations that sum to target amount
function findSubsetsWithSum(
  items: Array<Consolidation & { normalizedDate: string; matched: boolean }>,
  targetSum: number,
  tolerance: number = 0.01
): Array<Array<Consolidation & { normalizedDate: string; matched: boolean }>> {
  const results: Array<
    Array<Consolidation & { normalizedDate: string; matched: boolean }>
  > = [];

  function backtrack(
    index: number,
    currentSum: number,
    subset: Array<Consolidation & { normalizedDate: string; matched: boolean }>
  ) {
    if (Math.abs(currentSum - targetSum) <= tolerance) {
      results.push([...subset]);
      return;
    }
    if (index >= items.length) return;
    if (subset.length > 10) return; // Limit subset size for performance

    // Include current item
    subset.push(items[index]);
    backtrack(index + 1, currentSum + items[index].amount, subset);
    subset.pop();

    // Skip current item
    backtrack(index + 1, currentSum, subset);
  }

  backtrack(0, 0, []);
  return results;
}

export async function getTransactions() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // Fetch both sheets in a single batch request
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ["cash_account", "consolidations"],
    });

    const valueRanges = response.data.valueRanges;
    if (!valueRanges || valueRanges.length < 2) {
      throw new Error("Could not fetch both sheets");
    }

    const cashRows = valueRanges[0].values || [];
    const consolidationsRows = valueRanges[1].values || [];

    // Parse consolidations sheet first
    type ConsolidationWithMetadata = Consolidation & {
      normalizedDate: string;
      matched: boolean;
    };

    const allConsolidations: ConsolidationWithMetadata[] = [];
    if (consolidationsRows.length > 1) {
      const dataRows = consolidationsRows.slice(1);
      for (const row of dataRows) {
        const time = row[0] || "";
        allConsolidations.push({
          time,
          amount: parseAmount(row[1]),
          description: row[2] || "",
          category: row[3] || "",
          tags: row[4] || "",
          project: row[5] || "",
          normalizedDate: normalizeDate(time),
          matched: false,
        });
      }
    }

    // Parse cash_account sheet
    const cashTransactions: CashTransaction[] = [];
    if (cashRows.length > 1) {
      const dataRows = cashRows.slice(1);
      for (const row of dataRows) {
        cashTransactions.push({
          time: row[0] || "",
          amount: parseAmount(row[1]),
          description: row[2] || "",
          aggregation: parseAmount(row[3]),
          consolidations: [],
        });
      }
    }

    // Group consolidations by date for faster lookup
    const consolidationsByDate = new Map<string, ConsolidationWithMetadata[]>();
    for (const c of allConsolidations) {
      if (!consolidationsByDate.has(c.normalizedDate)) {
        consolidationsByDate.set(c.normalizedDate, []);
      }
      consolidationsByDate.get(c.normalizedDate)!.push(c);
    }

    // Match cash transactions to consolidations
    for (const cashTx of cashTransactions) {
      const cashDate = normalizeDate(cashTx.time);
      const candidatesForDate = consolidationsByDate.get(cashDate) || [];
      const unmatched = candidatesForDate.filter((c) => !c.matched);

      if (unmatched.length === 0) continue;

      // Strategy 1: Try exact amount match (1:1) - ONLY use this if found
      const exactMatch = unmatched.find(
        (c) => Math.abs(c.amount - cashTx.amount) < 0.01
      );
      if (exactMatch) {
        exactMatch.matched = true;
        const { normalizedDate, matched, ...consolidation } = exactMatch;
        cashTx.consolidations.push(consolidation);
        continue;
      }

      // Strategy 2: Try sum match (1:N) - ONLY if no exact match found
      const subsets = findSubsetsWithSum(unmatched, cashTx.amount);

      if (subsets.length > 0) {
        // Pick the best subset based on description similarity
        let bestSubset = subsets[0];
        let bestScore = 0;

        for (const subset of subsets) {
          const avgSimilarity =
            subset.reduce(
              (sum, c) =>
                sum + descriptionSimilarity(cashTx.description, c.description),
              0
            ) / subset.length;
          // Prefer smaller subsets with higher similarity
          const score = avgSimilarity + (1 / subset.length) * 0.5;
          if (score > bestScore) {
            bestScore = score;
            bestSubset = subset;
          }
        }

        for (const c of bestSubset) {
          c.matched = true;
          const { normalizedDate, matched, ...consolidation } = c;
          cashTx.consolidations.push(consolidation);
        }
      }
    }

    // Get remaining unmatched consolidations = Bank transactions
    // Each unmatched consolidation IS exactly 1 bank transaction
    const bankTransactions: BankTransaction[] = allConsolidations
      .filter((c) => !c.matched)
      .map((c) => {
        const { normalizedDate, matched, ...consolidation } = c;
        return {
          time: c.time,
          amount: c.amount, // Exact amount from sheet
          description: c.description,
          category: c.category,
          tags: c.tags,
          project: c.project,
          consolidation: consolidation, // Exactly 1 consolidation
        };
      });

    // Output results
    console.log("\n=== CASH TRANSACTIONS ===");
    console.log(`Total: ${cashTransactions.length}`);
    const cashDisplay = cashTransactions.map((tx) => ({
      time: tx.time,
      amount: tx.amount,
      description: tx.description,
      aggregation: tx.aggregation,
      consolidationsCount: tx.consolidations.length,
    }));
    console.table(cashDisplay);

    // Show unmatched cash transactions
    const unmatchedCash = cashTransactions.filter(
      (tx) => tx.consolidations.length === 0
    );
    if (unmatchedCash.length > 0) {
      console.log(
        "\n⚠️  UNMATCHED CASH TRANSACTIONS (no consolidation found):"
      );
      console.log(`Total: ${unmatchedCash.length}`);
      console.table(
        unmatchedCash.map((tx) => ({
          time: tx.time,
          amount: tx.amount,
          description: tx.description,
        }))
      );
    }

    console.log("\n=== BANK TRANSACTIONS ===");
    console.log(`Total: ${bankTransactions.length}`);
    const bankDisplay = bankTransactions.map((tx) => ({
      time: tx.time,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      tags: tx.tags,
      project: tx.project,
    }));
    console.table(bankDisplay);

    // Summary
    const matchedToCashCount = allConsolidations.filter(
      (c) => c.matched
    ).length;
    const unmatchedCount = allConsolidations.filter((c) => !c.matched).length;

    console.log("\n=== SUMMARY ===");
    console.log(`Cash transactions: ${cashTransactions.length}`);
    console.log(
      `  - With consolidations: ${cashTransactions.length - unmatchedCash.length}`
    );
    console.log(`  - Unmatched: ${unmatchedCash.length}`);
    console.log(`Bank transactions: ${bankTransactions.length}`);
    console.log(`Total consolidations: ${allConsolidations.length}`);
    console.log(`  - Matched to cash: ${matchedToCashCount}`);
    console.log(
      `  - Bank transactions (1:1 with unmatched): ${unmatchedCount}`
    );

    // Verify
    console.log(
      `\n✓ Verification: Bank transactions (${bankTransactions.length}) = Unmatched consolidations (${unmatchedCount})`
    );

    return {
      cashTransactions,
      bankTransactions,
    };
  } catch (err) {
    console.error("The API returned an error:", err);

    return {
      cashTransactions: [],
      bankTransactions: [],
    };
  }
}
