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

export const employmentTypes = ["FullTime", "PartTime", "Casual"] as const;

export const employmentTypeLabels: Record<
  (typeof employmentTypes)[number],
  string
> = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Casual: "Casual",
};

export const GST_RATE = 0.1;
export const BUDGET_UNITS_PER_MONTH = 10;
