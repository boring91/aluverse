import { db } from "@/db";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import { cost, projectPaid } from "@/db/expressions";

export async function getProjectsInOutStats(input: DashboardDateRange) {
  const { from, to } = input;
  return await db
    .selectFrom("projects")
    .select((eb) => [
      eb.fn.sum<number>(projectPaid(eb, from, to)).as("in"),
      eb.fn.sum<number>(cost(eb, from, to)).as("out"),
    ])
    .executeTakeFirstOrThrow();
}
