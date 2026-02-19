import { db } from "@/db";

type BudgetCategoryAllocation = {
  budgetCategoryId: string;
  amount: number;
  effectiveDate: Date;
};

const monthlyToDailyAllocation = (monthlyAmount: number) =>
  Math.round((monthlyAmount * 12) / 365.25);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

async function listBudgetCategoriesQuery() {
  return await db
    .selectFrom("budgetCategories")
    .select(["id", "humanId", "name", "includingGst"])
    .orderBy("name")
    .execute();
}

async function listBudgetCategoryAllocationsBeforeQuery(date: Date) {
  return await db
    .selectFrom("budgetCategoryAllocations")
    .where("effectiveDate", "<=", date)
    .select(["budgetCategoryId", "amount", "effectiveDate"])
    .orderBy("budgetCategoryId", "asc")
    .orderBy("effectiveDate", "desc")
    .execute();
}

async function listBudgetCategoryAllocationsWithinRangeQuery(date: Date) {
  return await db
    .selectFrom("budgetCategoryAllocations")
    .where("effectiveDate", "<", date)
    .select(["budgetCategoryId", "amount", "effectiveDate"])
    .orderBy("budgetCategoryId", "asc")
    .orderBy("effectiveDate", "asc")
    .execute();
}

export async function getEffectiveBudgetCategoryAllocationsByDateQuery(
  date: Date
) {
  const normalizedDate = startOfDay(date);
  const categories = await listBudgetCategoriesQuery();
  const allocations =
    await listBudgetCategoryAllocationsBeforeQuery(normalizedDate);

  const latestAllocationByCategoryId = new Map<string, number>();

  for (const allocation of allocations) {
    if (latestAllocationByCategoryId.has(allocation.budgetCategoryId)) {
      continue;
    }

    latestAllocationByCategoryId.set(
      allocation.budgetCategoryId,
      allocation.amount
    );
  }

  return categories.map((category) => {
    const monthlyAmount = latestAllocationByCategoryId.get(category.id) ?? 0;
    return {
      ...category,
      monthlyAmount,
      dailyAmount: monthlyToDailyAllocation(monthlyAmount),
    };
  });
}

function groupAllocationsByCategory(allocations: BudgetCategoryAllocation[]) {
  const allocationsByCategory = new Map<string, BudgetCategoryAllocation[]>();

  for (const allocation of allocations) {
    const categoryAllocations =
      allocationsByCategory.get(allocation.budgetCategoryId) ?? [];
    categoryAllocations.push(allocation);
    allocationsByCategory.set(allocation.budgetCategoryId, categoryAllocations);
  }

  return allocationsByCategory;
}

export async function getBudgetAllocatedAmountByDateRangeQuery(
  from: Date,
  to: Date
) {
  const rangeStart = startOfDay(from);
  const rangeEnd = startOfDay(to);

  if (rangeStart >= rangeEnd) {
    return {
      categories: [],
      allocatedByCategoryId: {},
      totalAllocated: 0,
    };
  }

  const [categories, allocations] = await Promise.all([
    listBudgetCategoriesQuery(),
    listBudgetCategoryAllocationsWithinRangeQuery(rangeEnd),
  ]);

  const allocationsByCategory = groupAllocationsByCategory(allocations);
  const allocatedByCategoryMap = new Map<string, number>();

  for (const category of categories) {
    const categoryAllocations = allocationsByCategory.get(category.id) ?? [];
    let allocationIndex = -1;
    let allocatedAmount = 0;

    for (
      const day = new Date(rangeStart);
      day < rangeEnd;
      day.setDate(day.getDate() + 1)
    ) {
      while (
        allocationIndex + 1 < categoryAllocations.length &&
        categoryAllocations[allocationIndex + 1].effectiveDate <= day
      ) {
        allocationIndex++;
      }

      const monthlyAmount =
        allocationIndex >= 0 ? categoryAllocations[allocationIndex].amount : 0;
      allocatedAmount += monthlyToDailyAllocation(monthlyAmount);
    }

    allocatedByCategoryMap.set(category.id, allocatedAmount);
  }

  const allocatedByCategoryId = Object.fromEntries(allocatedByCategoryMap);
  const totalAllocated = Array.from(allocatedByCategoryMap.values()).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return { categories, allocatedByCategoryId, totalAllocated };
}
