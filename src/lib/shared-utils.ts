import { z } from "zod";

function getZodFieldDefault(schema: z.ZodType): unknown {
  const result = schema.safeParse(undefined);
  if (result.success) {
    if (result.data != null) return result.data;

    if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
      const inner = schema.unwrap() as z.ZodType;
      if (inner instanceof z.ZodBoolean) return false;
    }

    return result.data;
  }

  const issue = result.error.issues.at(0);
  if (issue && issue.code === "invalid_type") {
    switch (issue.expected) {
      case "string":
        return "";
      case "number":
      case "int":
        return 0;
      case "boolean":
        return false;
      case "bigint":
        return BigInt(0);
      case "array":
        return [];
      case "object":
        if (schema instanceof z.ZodObject) {
          return getFormDefaults(schema);
        }
        return {};
      default:
        return undefined;
    }
  }

  return undefined;
}

export function formatDateString(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  // Bare `YYYY-MM-DD` calendar dates must be rendered without a timezone shift;
  // parse them as local calendar days rather than UTC midnight.
  const calendarDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = calendarDateMatch
    ? new Date(
        Number(calendarDateMatch[1]),
        Number(calendarDateMatch[2]) - 1,
        Number(calendarDateMatch[3]),
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-AU");
}

export function getFormDefaults<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  data?: { [K in keyof z.input<T>]?: z.input<T>[K] | null },
) {
  const shape = schema.shape as Record<string, z.ZodType>;
  const defaults: Record<string, unknown> = {};

  for (const key in shape) {
    const value = data?.[key as keyof z.input<T>];
    defaults[key] = value != null ? value : getZodFieldDefault(shape[key]);
  }

  return defaults as z.input<T>;
}
