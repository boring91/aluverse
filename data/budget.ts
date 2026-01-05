export const monthlyBudgetAllocation = {
  subscription: 120607,
  consumable: 30000,
  toll: 30000,
  tool: 200000,
  food: 30000,
  salary: 866600,
  fuel: 65000,
} as const;

export const dailyBudgetAllocation = Object.fromEntries(
  Object.entries(monthlyBudgetAllocation).map(([key, value]) => [
    key,
    Math.round((value * 12) / 365.25),
  ])
) as Record<keyof typeof monthlyBudgetAllocation, number>;
