import { db } from "@/db";

type BudgetCategoryAllocation = {
  budgetCategoryId: string;
  amount: number;
  effectiveDate: Date;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfNextMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 1);

const daysInMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

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

function calculateProRatedAllocation(
  rangeStart: Date,
  rangeEnd: Date,
  categoryAllocations: BudgetCategoryAllocation[]
) {
  let allocatedAmount = 0;
  let cursor = new Date(rangeStart);

  // Find initial allocation: latest with effectiveDate <= rangeStart
  let allocationIndex = -1;
  for (let i = 0; i < categoryAllocations.length; i++) {
    if (categoryAllocations[i].effectiveDate <= rangeStart) {
      allocationIndex = i;
    }
  }

  while (cursor < rangeEnd) {
    // Advance allocation index to cover current cursor position
    while (
      allocationIndex + 1 < categoryAllocations.length &&
      categoryAllocations[allocationIndex + 1].effectiveDate <= cursor
    ) {
      allocationIndex++;
    }

    const monthlyAmount =
      allocationIndex >= 0 ? categoryAllocations[allocationIndex].amount : 0;
    const currentMonthDays = daysInMonth(cursor);
    const monthEnd = startOfNextMonth(cursor);

    // Next boundary: earliest of rangeEnd, monthEnd, or next allocation change
    let segmentEnd = rangeEnd < monthEnd ? rangeEnd : monthEnd;

    if (allocationIndex + 1 < categoryAllocations.length) {
      const nextEffective =
        categoryAllocations[allocationIndex + 1].effectiveDate;
      if (nextEffective < segmentEnd) {
        segmentEnd = nextEffective;
      }
    }

    const days = daysBetween(cursor, segmentEnd);
    allocatedAmount += (days / currentMonthDays) * monthlyAmount;

    cursor = new Date(segmentEnd);
  }

  return Math.round(allocatedAmount);
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
    const allocatedAmount = calculateProRatedAllocation(
      rangeStart,
      rangeEnd,
      categoryAllocations
    );
    allocatedByCategoryMap.set(category.id, allocatedAmount);
  }

  const allocatedByCategoryId = Object.fromEntries(allocatedByCategoryMap);
  const totalAllocated = Array.from(allocatedByCategoryMap.values()).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return { categories, allocatedByCategoryId, totalAllocated };
}
