import { createParser } from "nuqs";
import { calendarDateSchema, toDateString } from "@/lib/date";

/**
 * nuqs parser for a calendar-date (`YYYY-MM-DD`) URL param.
 *
 * Accepts a bare calendar date as-is, or recovers the calendar day from a
 * legacy ISO datetime (from the previous `parseAsIsoDateTime`-based links) by
 * parsing it and reading its LOCAL day — matching how those dates were created,
 * so a range doesn't shift by a day. Anything that isn't a real calendar date
 * parses to `null` so `.withDefault(...)` supplies the fallback, keeping
 * stale/invalid URLs from erroring the strict tRPC date inputs.
 */
export const parseAsCalendarDate = createParser({
  parse(value: string) {
    if (calendarDateSchema.safeParse(value).success) {
      return value;
    }

    // Only recover a calendar day from non-bare shapes (e.g. legacy ISO). A
    // bare-but-impossible date like 2026-02-31 falls back rather than silently
    // rolling over to March.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        const normalized = toDateString(date);
        if (calendarDateSchema.safeParse(normalized).success) {
          return normalized;
        }
      }
    }

    return null;
  },
  serialize(value: string) {
    return value;
  },
});
