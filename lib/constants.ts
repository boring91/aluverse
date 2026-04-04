export const transactionReconciliationGroups = [
  "budget",
  "project",
  "loan",
  "gst_payable",
  "tax",
  "refund",
  "refunded",
  "unclassified",
] as const;

export const projectStreams = [
  "supplies",
  "labors",
  "misc",
  "payments",
] as const;

export const loanTypes = ["lent", "borrowed"] as const;

export const GST_RATE = 0.1;
export const BUDGET_UNITS_PER_MONTH = 10;
