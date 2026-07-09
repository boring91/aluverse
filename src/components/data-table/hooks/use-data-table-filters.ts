import {
  useQueryStates,
  parseAsString,
  parseAsIsoDateTime,
  parseAsFloat,
} from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { calendarDateSchema } from "@/lib/date";
import { parseAsCalendarDate } from "@/lib/calendar-date-param";
import type { FilterControl } from "@/components/data-table/types";

// Re-export FilterControl for convenience
export type { FilterControl } from "@/components/data-table/types";

type UnwrapZodType<T> =
  T extends z.ZodOptional<infer U>
    ? UnwrapZodType<U>
    : T extends z.ZodNullable<infer U>
      ? UnwrapZodType<U>
      : T extends z.ZodDefault<infer U>
        ? UnwrapZodType<U>
        : T extends z.ZodPipe<infer U>
          ? UnwrapZodType<U>
          : T;

// Type definitions
type DateRange = {
  from?: Date;
  to?: Date;
};

type BooleanFilterValue = "true" | "false" | "all" | undefined;

// Type for nuqs parsers
type NuqsParser =
  | typeof parseAsString
  | typeof parseAsIsoDateTime
  | typeof parseAsFloat
  | typeof parseAsCalendarDate;

// Type for filter runtime values (union of all possible filter value types)
type FilterRuntimeValue =
  | DateRange
  | BooleanFilterValue
  | string
  | number
  | Date
  | undefined;

type FilterRuntimeValueForSchema<TSchema> =
  UnwrapZodType<TSchema> extends z.ZodObject<{
    from: z.ZodTypeAny;
    to: z.ZodTypeAny;
  }>
    ? DateRange
    : UnwrapZodType<TSchema> extends z.ZodEnum<
          Record<string, "true" | "false" | "all">
        >
      ? BooleanFilterValue
      : UnwrapZodType<TSchema> extends z.ZodString
        ? string
        : UnwrapZodType<TSchema> extends z.ZodNumber
          ? number
          : UnwrapZodType<TSchema> extends z.ZodDate
            ? Date
            : UnwrapZodType<TSchema> extends z.ZodEnum<infer U>
              ? U extends Record<string, infer E>
                ? E
                : unknown
              : unknown;

// Map filter values to their runtime types (before transforms)
type FilterRuntimeValues<T extends z.ZodObject<z.ZodRawShape>> = {
  [K in keyof z.input<T>]-?: K extends keyof T["shape"]
    ? FilterRuntimeValueForSchema<T["shape"][K]> | undefined
    : unknown;
};

// Filter controls type
type FilterControls<T extends z.ZodObject<z.ZodRawShape>> = {
  [K in keyof FilterRuntimeValues<T>]: FilterControl<FilterRuntimeValues<T>[K]>;
};

// URL keys configuration type - allows both formats for flexibility
type UrlKeysConfig<T extends z.ZodObject<z.ZodRawShape>> = {
  [K in keyof z.input<T>]?: K extends keyof T["shape"]
    ? UnwrapZodType<T["shape"][K]> extends z.ZodObject<{
        from: z.ZodTypeAny;
        to: z.ZodTypeAny;
      }>
      ? { from: string; to: string }
      : string
    : unknown;
};

// Return type of the hook
export type FilterResult<T extends z.ZodObject<z.ZodRawShape>> = {
  filter: FilterControls<T>;
  raw: FilterRuntimeValues<T>;
  reset: () => void;
  isActive: boolean;
};

// Helper to check if a schema is a date range filter
function isDateRangeFilter(
  schema: z.ZodTypeAny,
): schema is z.ZodObject<{ from: z.ZodTypeAny; to: z.ZodTypeAny }> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    if (shape.from instanceof z.ZodType && shape.to instanceof z.ZodType) {
      // Check if from is a date (directly or wrapped)
      const fromDef = shape.from._def;
      const isFromDate =
        shape.from instanceof z.ZodDate ||
        shape.from instanceof z.ZodOptional ||
        (typeof fromDef === "object" &&
          "schema" in fromDef &&
          (fromDef as { schema: z.ZodTypeAny }).schema instanceof z.ZodDate);

      return isFromDate;
    }
  }
  return false;
}

// Helper to check if a schema is a number filter
function isNumberFilter(schema: z.ZodTypeAny): boolean {
  const baseSchema = getBaseSchema(schema);
  return baseSchema instanceof z.ZodNumber;
}

// Helper to check if a schema is a calendar-date (YYYY-MM-DD string) filter
function isCalendarDateFilter(schema: z.ZodTypeAny): boolean {
  return getBaseSchema(schema) === calendarDateSchema;
}

// Helper to check if a schema is a single date filter (not a date range)
function isSingleDateFilter(schema: z.ZodTypeAny): boolean {
  const baseSchema = getBaseSchema(schema);
  return baseSchema instanceof z.ZodDate;
}

// Helper to check if a schema is a boolean filter
function isBooleanFilter(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodEnum) {
    const values = schema.options as readonly string[];
    return (
      values.includes("true") &&
      values.includes("false") &&
      values.includes("all")
    );
  }
  // Also check for optional boolean filters
  if (schema instanceof z.ZodOptional) {
    return isBooleanFilter(schema._def.innerType as z.ZodTypeAny);
  }
  // Check for transformed boolean filters - in Zod v4, transforms might be handled differently
  // Try to access the inner schema if it exists
  const innerSchema = (schema._def as { schema?: unknown }).schema;
  if (innerSchema instanceof z.ZodType) {
    return isBooleanFilter(innerSchema);
  }
  return false;
}

// Helper to get the base schema (unwrap optional and effects)
function getBaseSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional) {
    return getBaseSchema(schema._def.innerType as z.ZodTypeAny);
  }
  // Check for transformed schemas (effects) - in Zod v4, check _def.schema
  const innerSchema = (schema._def as { schema?: unknown }).schema;
  if (innerSchema instanceof z.ZodType) {
    return getBaseSchema(innerSchema);
  }
  return schema;
}

export function useDataTableFilters<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
  options?: {
    disableUrlKeys?: boolean;
    urlKeys?: UrlKeysConfig<TSchema>;
  },
) {
  const shape = schema.shape;
  const keys = Object.keys(shape) as Array<keyof typeof shape>;

  // Analyze schema to determine filter types and build parser config
  const filterConfig = useMemo(() => {
    const parsers: Record<string, NuqsParser> = {};
    const urlKeyMap: Record<string, string> = {};
    const filterTypes: Record<
      string,
      "dateRange" | "boolean" | "string" | "date" | "number"
    > = {};

    for (const key of keys) {
      const fieldSchema = shape[key];
      const baseSchema = getBaseSchema(fieldSchema as z.ZodTypeAny);

      if (isDateRangeFilter(baseSchema)) {
        // Date range filter - uses nested from/to keys
        const urlKeyConfig = options?.urlKeys?.[key] as
          | { from: string; to: string }
          | undefined;
        const keyStr = String(key);
        const fromKey = urlKeyConfig?.from ?? "from";
        const toKey = urlKeyConfig?.to ?? "to";

        // Use prefixed internal keys to avoid conflicts, but map to user's URL keys
        parsers[`${keyStr}From`] = parseAsIsoDateTime;
        parsers[`${keyStr}To`] = parseAsIsoDateTime;
        urlKeyMap[`${keyStr}From`] = fromKey;
        urlKeyMap[`${keyStr}To`] = toKey;
        filterTypes[keyStr] = "dateRange";
      } else if (isSingleDateFilter(fieldSchema as z.ZodTypeAny)) {
        // Single date filter
        const urlKey =
          (options?.urlKeys?.[key] as string | undefined) ?? String(key);
        parsers[String(key)] = parseAsIsoDateTime;
        urlKeyMap[String(key)] = urlKey;
        filterTypes[String(key)] = "date";
      } else if (isNumberFilter(fieldSchema as z.ZodTypeAny)) {
        // Number filter
        const urlKey =
          (options?.urlKeys?.[key] as string | undefined) ?? String(key);
        parsers[String(key)] = parseAsFloat;
        urlKeyMap[String(key)] = urlKey;
        filterTypes[String(key)] = "number";
      } else if (isBooleanFilter(fieldSchema as z.ZodTypeAny)) {
        // Boolean filter
        const urlKey =
          (options?.urlKeys?.[key] as string | undefined) ?? String(key);
        parsers[String(key)] = parseAsString;
        urlKeyMap[String(key)] = urlKey;
        filterTypes[String(key)] = "boolean";
      } else if (isCalendarDateFilter(fieldSchema as z.ZodTypeAny)) {
        // Calendar-date (YYYY-MM-DD) filter — normalize legacy ISO URL params
        // to a calendar day so old links don't fail the strict tRPC schema.
        const urlKey =
          (options?.urlKeys?.[key] as string | undefined) ?? String(key);
        parsers[String(key)] = parseAsCalendarDate;
        urlKeyMap[String(key)] = urlKey;
        filterTypes[String(key)] = "string";
      } else {
        // Unknown filter type - treat as string for now
        const urlKey =
          (options?.urlKeys?.[key] as string | undefined) ?? String(key);
        parsers[String(key)] = parseAsString;
        urlKeyMap[String(key)] = urlKey;
        filterTypes[String(key)] = "string";
      }
    }

    return { parsers, urlKeyMap, filterTypes };
  }, [options?.urlKeys, keys, shape]);

  // Single useQueryStates call with all parsers
  const [urlState, setUrlState] = useQueryStates(filterConfig.parsers, {
    urlKeys: filterConfig.urlKeyMap,
  });

  const [localState, setLocalState] = useState(() => {
    const initial: Record<string, unknown> = {};

    for (const key in filterConfig.parsers) {
      initial[key] = null;
    }

    return initial;
  });

  const state = options?.disableUrlKeys ? localState : urlState;
  const setState = options?.disableUrlKeys ? setLocalState : setUrlState;

  // Build filter values
  const filterValues = useMemo(() => {
    const result: Record<string, FilterRuntimeValue> = {};

    for (const key of keys) {
      const filterType = filterConfig.filterTypes[String(key)];

      if (filterType === "dateRange") {
        result[String(key)] = {
          from: state[`${String(key)}From`] ?? undefined,
          to: state[`${String(key)}To`] ?? undefined,
        } as DateRange;
      } else if (filterType === "date") {
        result[String(key)] =
          (state[String(key)] as Date | null | undefined) ?? undefined;
      } else if (filterType === "number") {
        result[String(key)] =
          (state[String(key)] as number | null | undefined) ?? undefined;
      } else {
        result[String(key)] =
          (state[String(key)] as string | null | undefined) ?? undefined;
      }
    }

    return result;
  }, [state, filterConfig.filterTypes, keys]);

  // Build setters
  const setters = useMemo(() => {
    type SetterFunction =
      | ((value: DateRange) => void)
      | ((value: Date | undefined) => void)
      | ((value: number | undefined) => void)
      | ((value: BooleanFilterValue) => void)
      | ((value: string | undefined) => void);
    const result: Record<string, SetterFunction> = {};

    for (const key of keys) {
      const filterType = filterConfig.filterTypes[String(key)];
      const keyStr = String(key);

      if (filterType === "dateRange") {
        result[keyStr] = (value: DateRange) => {
          setState({
            [`${keyStr}From`]: value.from ?? null,
            [`${keyStr}To`]: value.to ?? null,
          });
        };
      } else if (filterType === "date") {
        result[keyStr] = (value: Date | undefined) => {
          setState({
            [keyStr]: value ?? null,
          });
        };
      } else if (filterType === "number") {
        result[keyStr] = (value: number | undefined) => {
          setState({
            [keyStr]: value ?? null,
          });
        };
      } else if (filterType === "boolean") {
        result[keyStr] = (value: BooleanFilterValue) => {
          setState({
            [keyStr]: value === "all" ? null : (value ?? null),
          });
        };
      } else {
        result[keyStr] = (value: string | undefined) => {
          setState({
            [keyStr]: value ?? null,
          });
        };
      }
    }

    return result;
  }, [setState, filterConfig.filterTypes, keys]);

  // Build filter object with value and set
  const filter = useMemo(() => {
    const result: Record<string, FilterControl<FilterRuntimeValue>> = {};

    for (const key of keys) {
      result[String(key)] = {
        value: filterValues[String(key)],
        set: setters[String(key)] as (value: FilterRuntimeValue) => void,
      };
    }

    return result as unknown as FilterControls<TSchema>;
  }, [filterValues, setters, keys]);

  // Reset function
  const reset = useCallback(() => {
    const resetState: Record<string, null> = {};

    for (const key of keys) {
      const filterType = filterConfig.filterTypes[String(key)];

      if (filterType === "dateRange") {
        resetState[`${String(key)}From`] = null;
        resetState[`${String(key)}To`] = null;
      } else {
        resetState[String(key)] = null;
      }
    }

    setState(resetState);
  }, [setState, filterConfig.filterTypes, keys]);

  // Check if any filter is active
  const isActive = useMemo(() => {
    for (const key of keys) {
      const filterType = filterConfig.filterTypes[String(key)];

      if (filterType === "dateRange") {
        if (state[`${String(key)}From`] || state[`${String(key)}To`]) {
          return true;
        }
      } else {
        const value = state[String(key)];
        if (value !== null && value !== undefined) {
          return true;
        }
      }
    }
    return false;
  }, [state, filterConfig.filterTypes, keys]);

  // Build raw values object with proper typing
  const raw = useMemo(() => {
    return filterValues as unknown as FilterRuntimeValues<TSchema>;
  }, [filterValues]);

  return {
    filter,
    raw,
    reset,
    isActive,
  };
}
