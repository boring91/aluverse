import { z } from "zod";

/**
 * Calendar dates in this app are stored and transported as plain `YYYY-MM-DD`
 * strings with NO time and NO timezone. "July 7" is July 7 for every viewer,
 * regardless of browser or server timezone. These helpers convert between that
 * string form and the `Date` objects the calendar UI needs, always using the
 * LOCAL calendar components (never `toISOString`, which would shift the day).
 *
 * True instants (createdAt/updatedAt/expiresAt) are a separate concern and are
 * stored as time-zone-aware timestamps + rendered with the browser locale.
 */

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Convert a `Date` to a `YYYY-MM-DD` string using its LOCAL calendar
 * components. The calendar picker returns a Date at local midnight, so this
 * preserves the day the user actually clicked.
 */
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Parse a `YYYY-MM-DD` string into a `Date` at LOCAL midnight, suitable for
 * feeding the calendar UI's `selected`/`defaultMonth`. Never parse calendar
 * dates with `new Date("YYYY-MM-DD")` — that is interpreted as UTC midnight and
 * shifts the day in local time.
 */
export function parseDateString(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => parseInt(part, 10));
  return new Date(year, month - 1, day);
}

/**
 * Shift a `YYYY-MM-DD` calendar date by `days` (may be negative), returning a
 * new `YYYY-MM-DD` string.
 */
export function shiftDateString(value: string, days: number): string {
  const date = parseDateString(value);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/**
 * Convert a date-range picker's INCLUSIVE end day into the exclusive
 * `YYYY-MM-DD` upper bound our half-open (`date < to`) calendar queries expect.
 * The picker's `to` is always the last day the user wants included — whether it
 * carries an end-of-day time from a preset or sits at local midnight from the
 * calendar or a manual edit — so we drop the time and advance one calendar day.
 * (Range helpers that feed the picker, e.g. month/quarter ranges, must likewise
 * yield the last included day, not the first excluded one.)
 */
export function toExclusiveDateString(date: Date): string {
  const next = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  );
  return toDateString(next);
}

/**
 * Format a `YYYY-MM-DD` calendar-date string for display, with no timezone
 * shift. Returns a placeholder for empty/invalid input.
 */
export function formatCalendarDate(
  value: string | null | undefined,
  locale = "en-AU",
): string {
  if (!value || !CALENDAR_DATE_PATTERN.test(value)) {
    return "—";
  }

  return parseDateString(value).toLocaleDateString(locale);
}

/**
 * Parse a `YYYY-MM-DD` calendar date into a `Date` at UTC midnight, for
 * server-side date arithmetic (day counts, month boundaries) that must be
 * timezone-stable. Use this instead of `new Date(value)` when you need to do
 * math on a calendar-date bound; use `parseDateString` for the calendar UI.
 */
export function parseUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/**
 * Whether a `YYYY-MM-DD` string is a real calendar date. Rejects values that
 * match the shape but don't exist (e.g. `2026-02-31`, `2026-13-40`) by checking
 * the parsed components round-trip without normalization.
 */
function isRealCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map((part) => parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Zod schema for a calendar-date tRPC input: a real `YYYY-MM-DD` calendar date.
 */
export const calendarDateSchema = z
  .string()
  .regex(CALENDAR_DATE_PATTERN, { message: "Invalid date" })
  .refine(isRealCalendarDate, { message: "Invalid date" });

export const nullableCalendarDateSchema = calendarDateSchema
  .nullable()
  .optional();
