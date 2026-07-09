import { getCurrentTime } from "@/lib/utils";
import { timestamp } from "drizzle-orm/pg-core";

export const auditColumns = {
  createdAt: timestamp({ mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => getCurrentTime()),
};
