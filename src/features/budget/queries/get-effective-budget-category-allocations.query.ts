import { db } from "@/db";
import { parseUtcDate } from "@/lib/date";

type BudgetCategoryAllocation = {
  budgetCategoryId: string;
  amount: number;
  // `YYYY-MM-DD` calendar date.
  effectiveDate: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfNextMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

const daysInMonth = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / DAY_MS);

async function listBudgetCategoriesQuery() {
  return await db
    .selectFrom("budgetCategories")
    .select(["id", "name", "includingGst"])
    .orderBy("name")
    .execute();
}

async function listBudgetCategoryAllocationsBeforeQuery(date: string) {
  return await db
    .selectFrom("budgetCategoryAllocations")
    .where("effectiveDate", "<=", date)
    .select(["budgetCategoryId", "amount", "effectiveDate"])
    .orderBy("budgetCategoryId", "asc")
    .orderBy("effectiveDate", "desc")
    .execute();
}

async function listBudgetCategoryAllocationsWithinRangeQuery(date: string) {
  return await db
    .selectFrom("budgetCategoryAllocations")
    .where("effectiveDate", "<", date)
    .select(["budgetCategoryId", "amount", "effectiveDate"])
    .orderBy("budgetCategoryId", "asc")
    .orderBy("effectiveDate", "asc")
    .execute();
}

export async function getEffectiveBudgetCategoryAllocationsByDateQuery(
  date: string,
) {
  const categories = await listBudgetCategoriesQuery();
  const allocations = await listBudgetCategoryAllocationsBeforeQuery(date);

  const latestAllocationByCategoryId = new Map<string, number>();

  for (const allocation of allocations) {
    if (latestAllocationByCategoryId.has(allocation.budgetCategoryId)) {
      continue;
    }

    latestAllocationByCategoryId.set(
      allocation.budgetCategoryId,
      allocation.amount,
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
  categoryAllocations: BudgetCategoryAllocation[],
) {
  // Parse the DB calendar dates to UTC-midnight Dates to match the range
  // boundaries (which are also UTC midnight).
  const normalized = categoryAllocations.map((a) => ({
    ...a,
    effectiveDate: parseUtcDate(a.effectiveDate),
  }));

  let allocatedAmount = 0;
  let cursor = new Date(rangeStart);

  // Find initial allocation: latest with effectiveDate <= rangeStart
  let allocationIndex = -1;
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i].effectiveDate <= rangeStart) {
      allocationIndex = i;
    }
  }

  while (cursor < rangeEnd) {
    // Advance allocation index to cover current cursor position
    while (
      allocationIndex + 1 < normalized.length &&
      normalized[allocationIndex + 1].effectiveDate <= cursor
    ) {
      allocationIndex++;
    }

    const monthlyAmount =
      allocationIndex >= 0 ? normalized[allocationIndex].amount : 0;
    const currentMonthDays = daysInMonth(cursor);
    const monthEnd = startOfNextMonth(cursor);

    // Next boundary: earliest of rangeEnd, monthEnd, or next allocation change
    let segmentEnd = rangeEnd < monthEnd ? rangeEnd : monthEnd;

    if (allocationIndex + 1 < normalized.length) {
      const nextEffective = normalized[allocationIndex + 1].effectiveDate;
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
  from: string,
  to: string,
) {
  const rangeStart = parseUtcDate(from);
  const rangeEnd = parseUtcDate(to);

  if (rangeStart >= rangeEnd) {
    return {
      categories: [],
      allocatedByCategoryId: {},
      totalAllocated: 0,
    };
  }

  const [categories, allocations] = await Promise.all([
    listBudgetCategoriesQuery(),
    listBudgetCategoryAllocationsWithinRangeQuery(to),
  ]);

  const allocationsByCategory = groupAllocationsByCategory(allocations);
  const allocatedByCategoryMap = new Map<string, number>();

  for (const category of categories) {
    const categoryAllocations = allocationsByCategory.get(category.id) ?? [];
    const allocatedAmount = calculateProRatedAllocation(
      rangeStart,
      rangeEnd,
      categoryAllocations,
    );
    allocatedByCategoryMap.set(category.id, allocatedAmount);
  }

  const allocatedByCategoryId = Object.fromEntries(allocatedByCategoryMap);
  const totalAllocated = Array.from(allocatedByCategoryMap.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return { categories, allocatedByCategoryId, totalAllocated };
}
