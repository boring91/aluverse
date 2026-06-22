import { db } from "@/db";
import type { DashboardDateRange } from "../schemas/dashboard.shared-schema";
import {
  projectCost,
  projectPaid,
} from "@/shared/expressions/projects/project.expression";

export async function getProjectsInOutStatsQuery(input: DashboardDateRange) {
  const { from, to } = input;
  return await db
    .selectFrom("projects")
    .select((eb) => [
      eb.fn.sum<number>(projectPaid(eb, from, to)).as("in"),
      eb.fn.sum<number>(projectCost(eb, from, to)).as("out"),
    ])
    .executeTakeFirstOrThrow();
}
