export const transactionTypes = ["income", "expense"] as const;

export const transactionConsolidationGroups = [
  "budget",
  "project",
  "loan",
  "unclassified",
] as const;

export const transactionBudgetCategories = [
  "subscription",
  "consumable",
  "toll",
  "tool",
  "food",
  "salary",
  "fuel",
] as const;

export const projectStreams = [
  "supplies",
  "labors",
  "misc",
  "payments",
] as const;

export const loanTypes = ["lent", "borrowed"] as const;
