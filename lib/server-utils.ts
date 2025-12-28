// projection-utils.ts
import {
    and,
    count,
    countDistinct,
    SelectedFieldsFlat,
    type ColumnBaseConfig,
    type ColumnDataType,
    type SQL,
    type Subquery,
} from "drizzle-orm";
import type {
    PgColumn,
    PgTable,
    SelectedFields,
    TableConfig,
} from "drizzle-orm/pg-core";
import { db } from "@/db";

// ============================================
// Types
// ============================================

// PgColumn has default type parameters, so we can use it without generics
type ColumnLike =
    | PgColumn
    | SelectedFieldsFlat<PgColumn>[string]
    | PgTable
    | SelectedFieldsFlat<PgColumn>;

interface ManyRelation<T extends ProjectionDef> {
    __type: "many";
    key: keyof T & string;
    fields: T;
}

interface OneRelation<T extends ProjectionDef> {
    __type: "one";
    key: keyof T & string;
    fields: T;
}

interface OneRequiredRelation<T extends ProjectionDef> {
    __type: "oneRequired";
    key: keyof T & string;
    fields: T;
}

interface ManyThroughRelation<T extends ProjectionDef> {
    __type: "manyThrough";
    through: ColumnLike;
    fields: T;
}

type Relation =
    | ManyRelation<ProjectionDef>
    | OneRelation<ProjectionDef>
    | OneRequiredRelation<ProjectionDef>
    | ManyThroughRelation<ProjectionDef>;

interface ProjectionDef {
    [key: string]: ColumnLike | Relation;
}

// Use constrained inference for PgColumn's config type parameter
type InferFieldType<T> = T extends ManyRelation<infer F>
    ? InferProjectionResult<F>[]
    : T extends ManyThroughRelation<infer F>
    ? InferProjectionResult<F>[]
    : T extends OneRequiredRelation<infer F>
    ? InferProjectionResult<F>
    : T extends OneRelation<infer F>
    ? InferProjectionResult<F> | null
    : T extends PgColumn<
          infer C extends ColumnBaseConfig<ColumnDataType, string>,
          object,
          object
      >
    ? C["data"] | (C["notNull"] extends true ? never : null)
    : T extends SQL.Aliased<infer D>
    ? D
    : T extends SQL<infer D>
    ? D
    : unknown;

type InferProjectionResult<T extends ProjectionDef> = {
    [K in keyof T]: InferFieldType<T[K]>;
};

interface ProjectionWithKey<T extends ProjectionDef> {
    key: keyof T & string;
    fields: T;
}

// ============================================
// Helper functions to define projections
// ============================================

export function many<T extends ProjectionDef>(config: {
    key: keyof T & string;
    fields: T;
}): ManyRelation<T> {
    return { __type: "many", ...config };
}

export function one<T extends ProjectionDef>(config: {
    key: keyof T & string;
    fields: T;
}): OneRelation<T> {
    return { __type: "one", ...config };
}

export function oneRequired<T extends ProjectionDef>(config: {
    key: keyof T & string;
    fields: T;
}): OneRequiredRelation<T> {
    return { __type: "oneRequired", ...config };
}

export function manyThrough<T extends ProjectionDef>(config: {
    through: ColumnLike;
    fields: T;
}): ManyThroughRelation<T> {
    return { __type: "manyThrough", ...config };
}

// ============================================
// Type guards
// ============================================

function isRelation(value: ColumnLike | Relation): value is Relation {
    return (
        value !== null &&
        typeof value === "object" &&
        "__type" in value &&
        (value.__type === "many" ||
            value.__type === "one" ||
            value.__type === "oneRequired" ||
            value.__type === "manyThrough")
    );
}

function isManyThroughRelation(
    value: Relation
): value is ManyThroughRelation<ProjectionDef> {
    return value.__type === "manyThrough";
}

function isArrayRelation(
    value: Relation
): value is ManyRelation<ProjectionDef> | ManyThroughRelation<ProjectionDef> {
    return value.__type === "many" || value.__type === "manyThrough";
}

function isOneRelation(
    value: Relation
): value is OneRelation<ProjectionDef> | OneRequiredRelation<ProjectionDef> {
    return value.__type === "one" || value.__type === "oneRequired";
}

// ============================================
// Flatten projection for Drizzle select()
// ============================================

export function flattenProjection<T extends ProjectionDef>(
    projection: T,
    prefix = ""
): SelectedFields {
    const result: SelectedFields = {};

    for (const key of Object.keys(projection)) {
        const value = projection[key];
        const fullKey = prefix ? `${prefix}$$${key}` : key;

        if (isRelation(value)) {
            if (isManyThroughRelation(value)) {
                result[`${fullKey}$$__through`] = value.through;
            }
            Object.assign(result, flattenProjection(value.fields, fullKey));
        } else {
            result[fullKey] = value;
        }
    }

    return result;
}

// ============================================
// Nest flat results back into structured data
// ============================================

function buildKeyPath(prefix: string, key: string): string {
    return prefix ? `${prefix}$$${key}` : key;
}

function getRelationKeyValue(
    row: Record<string, unknown>,
    value: Relation,
    fullKey: string
): unknown {
    if (isManyThroughRelation(value)) {
        return row[`${fullKey}$$__through`];
    }
    return row[buildKeyPath(fullKey, value.key)];
}

function extractObject(
    row: Record<string, unknown>,
    projection: ProjectionDef,
    prefix: string
): Record<string, unknown> | null {
    const result: Record<string, unknown> = {};
    let hasNonNullValue = false;

    for (const key of Object.keys(projection)) {
        const value = projection[key];
        const fullKey = buildKeyPath(prefix, key);

        if (isRelation(value)) {
            result[key] = isArrayRelation(value) ? [] : null;
        } else {
            const colValue = row[fullKey];
            result[key] = colValue;
            if (colValue !== null && colValue !== undefined) {
                hasNonNullValue = true;
            }
        }
    }

    return hasNonNullValue ? result : null;
}

function processRelations(
    row: Record<string, unknown>,
    projection: ProjectionDef,
    prefix: string,
    target: Record<string, unknown>,
    seenKeys: Map<string, Set<unknown>>
): void {
    for (const key of Object.keys(projection)) {
        const value = projection[key];
        if (!isRelation(value)) continue;

        const fullKey = buildKeyPath(prefix, key);
        const relationKeyValue = getRelationKeyValue(row, value, fullKey);

        if (relationKeyValue === null || relationKeyValue === undefined) {
            continue;
        }

        if (!seenKeys.has(fullKey)) {
            seenKeys.set(fullKey, new Set());
        }
        const seen = seenKeys.get(fullKey)!;

        if (isArrayRelation(value)) {
            if (!Array.isArray(target[key])) {
                target[key] = [];
            }

            const targetArray = target[key] as Record<string, unknown>[];

            if (!seen.has(relationKeyValue)) {
                seen.add(relationKeyValue);
                const nested = extractObject(row, value.fields, fullKey);
                if (nested) {
                    if (isManyThroughRelation(value)) {
                        nested["__through"] = relationKeyValue;
                    }
                    targetArray.push(nested);
                    processRelations(
                        row,
                        value.fields,
                        fullKey,
                        nested,
                        seenKeys
                    );
                }
            } else {
                const existingKey = isManyThroughRelation(value)
                    ? "__through"
                    : value.key;
                const existing = targetArray.find(
                    item => item[existingKey] === relationKeyValue
                );
                if (existing) {
                    processRelations(
                        row,
                        value.fields,
                        fullKey,
                        existing,
                        seenKeys
                    );
                }
            }
        } else if (isOneRelation(value)) {
            if (target[key] === null || target[key] === undefined) {
                const nested = extractObject(row, value.fields, fullKey);
                if (nested) {
                    target[key] = nested;
                    processRelations(
                        row,
                        value.fields,
                        fullKey,
                        nested,
                        seenKeys
                    );
                }
            }
        }
    }
}

function cleanupThroughKeys(obj: unknown): void {
    if (Array.isArray(obj)) {
        for (const item of obj) {
            cleanupThroughKeys(item);
        }
    } else if (obj !== null && typeof obj === "object") {
        const record = obj as Record<string, unknown>;
        delete record["__through"];
        for (const value of Object.values(record)) {
            cleanupThroughKeys(value);
        }
    }
}

export function nestResults<T extends ProjectionDef>(
    rows: Record<string, unknown>[],
    projection: ProjectionWithKey<T>
): InferProjectionResult<T>[] {
    if (rows.length === 0) return [];

    const { key: rootKey, fields } = projection;
    const resultMap = new Map<unknown, Record<string, unknown>>();
    const resultOrder: unknown[] = [];
    const nestedSeenKeys = new Map<unknown, Map<string, Set<unknown>>>();

    for (const row of rows) {
        const rootKeyValue = row[rootKey];
        if (rootKeyValue === null || rootKeyValue === undefined) continue;

        let rootObj: Record<string, unknown>;

        if (!resultMap.has(rootKeyValue)) {
            rootObj = extractObject(row, fields, "") ?? {};
            resultMap.set(rootKeyValue, rootObj);
            resultOrder.push(rootKeyValue);
            nestedSeenKeys.set(rootKeyValue, new Map());
        } else {
            rootObj = resultMap.get(rootKeyValue)!;
        }

        processRelations(
            row,
            fields,
            "",
            rootObj,
            nestedSeenKeys.get(rootKeyValue)!
        );
    }

    const results = resultOrder.map(
        k => resultMap.get(k) as InferProjectionResult<T>
    );
    cleanupThroughKeys(results);
    return results;
}

// ============================================
// Convenience wrapper
// ============================================

export function createProjectedQuery<T extends ProjectionDef>(
    projection: ProjectionWithKey<T>
) {
    return {
        selection: flattenProjection(projection.fields),
        transform: (rows: Record<string, unknown>[]) =>
            nestResults(rows, projection),
    };
}

// ============================================
// Query Builder Types
// ============================================

// Type for tables and subqueries that can be joined
type JoinableTable =
    | PgTable<TableConfig>
    | Subquery<string, Record<string, unknown>>;

interface LeftJoinDef {
    __joinType: "left";
    table: JoinableTable;
    condition: SQL;
}

interface InnerJoinDef {
    __joinType: "inner";
    table: JoinableTable;
    condition: SQL;
}

type JoinDef = LeftJoinDef | InnerJoinDef;

interface QueryDefinition<
    TFrom extends PgTable<TableConfig>,
    TProjection extends ProjectionDef
> {
    from: TFrom;
    key: keyof TProjection & string;
    projection: TProjection;
    joins?: JoinDef[];
    groupBy?: PgColumn[];
}

interface ListParams {
    baseWhere?: SQL[];
    where?: SQL[];
    baseHaving?: SQL[];
    having?: SQL[];
    orderBy?: SQL[];
    pagination: {
        pageIndex: number;
        pageSize: number;
    };
}

interface GetParams {
    where?: SQL[];
    having?: SQL[];
}

interface ListResult<T> {
    items: T[];
    count: number;
    filteredCount: number;
}

// ============================================
// Join Helper Functions
// ============================================

export function leftJoin(table: JoinableTable, condition: SQL): LeftJoinDef {
    return {
        __joinType: "left",
        table,
        condition,
    };
}

export function innerJoin(table: JoinableTable, condition: SQL): InnerJoinDef {
    return {
        __joinType: "inner",
        table,
        condition,
    };
}

// ============================================
// Query Builder
// ============================================

// Internal interface for query-like objects that support chaining
interface ChainableQuery {
    leftJoin: (table: JoinableTable, condition: SQL) => ChainableQuery;
    innerJoin: (table: JoinableTable, condition: SQL) => ChainableQuery;
    where: (condition: SQL | undefined) => ChainableQuery;
    groupBy: (...columns: PgColumn[]) => ChainableQuery;
    having: (condition: SQL | undefined) => ChainableQuery;
    orderBy: (...columns: SQL[]) => ChainableQuery;
    offset: (offset: number) => ChainableQuery;
    limit: (limit: number) => ChainableQuery;
    then: <T>(onfulfilled?: (value: unknown[]) => T) => Promise<T>;
}

export function defineQuery<
    TFrom extends PgTable<TableConfig>,
    TProjection extends ProjectionDef
>(definition: QueryDefinition<TFrom, TProjection>) {
    const {
        from: fromTable,
        key,
        projection,
        joins = [],
        groupBy,
    } = definition;
    // Cast to satisfy Drizzle's complex conditional type for .from()
    const from = fromTable as PgTable<TableConfig>;

    // Check if projection has nested relations (many, one, etc.)
    const hasNestedRelations = Object.values(projection).some(isRelation);

    // Build the selection based on whether we have nested relations
    const projectionWithKey = { key, fields: projection };
    const selection = hasNestedRelations
        ? flattenProjection(projection)
        : (projection as unknown as SelectedFields);

    // Helper to apply joins to a query
    function applyJoins(query: ChainableQuery): ChainableQuery {
        let result = query;
        for (const join of joins) {
            if (join.__joinType === "left") {
                result = result.leftJoin(join.table, join.condition);
            } else {
                result = result.innerJoin(join.table, join.condition);
            }
        }
        return result;
    }

    // Transform function for nested relations
    function transformResults(rows: Record<string, unknown>[]) {
        if (hasNestedRelations) {
            return nestResults(rows, projectionWithKey);
        }
        // For simple projections without nested relations, dedupe by key
        const seen = new Set<unknown>();
        const result: Record<string, unknown>[] = [];
        for (const row of rows) {
            const keyValue = row[key];
            if (
                keyValue !== null &&
                keyValue !== undefined &&
                !seen.has(keyValue)
            ) {
                seen.add(keyValue);
                result.push(row);
            }
        }
        return result as InferProjectionResult<TProjection>[];
    }

    // Get the key column for counting
    const keyColumn = projection[key] as PgColumn;

    return {
        async list(
            params: ListParams
        ): Promise<ListResult<InferProjectionResult<TProjection>>> {
            const {
                baseWhere = [],
                where = [],
                baseHaving = [],
                having = [],
                orderBy = [],
                pagination,
            } = params;

            function buildBaseQuery(
                selection: SelectedFields,
                target: "list" | "count" | "filterCount"
            ) {
                const baseQuery = db
                    .select(selection)
                    .from(from) as unknown as ChainableQuery;
                const withJoins = applyJoins(baseQuery);

                const withWhere =
                    baseWhere.length > 0 ||
                    (target !== "count" && where.length > 0)
                        ? withJoins.where(
                              and(
                                  ...baseWhere,
                                  ...(target === "count" ? [] : where)
                              )
                          )
                        : withJoins;

                const withGroupBy =
                    groupBy && groupBy.length > 0
                        ? withWhere.groupBy(...groupBy)
                        : withWhere;

                const withHaving =
                    baseHaving.length > 0 ||
                    (target !== "count" && having.length > 0)
                        ? withGroupBy.having(
                              and(
                                  ...baseHaving,
                                  ...(target === "count" ? [] : having)
                              )
                          )
                        : withGroupBy;

                if (target === "count" || target === "filterCount")
                    return withHaving;

                const withOrderBy =
                    orderBy.length > 0
                        ? withHaving.orderBy(...orderBy)
                        : withHaving;

                return withOrderBy;
            }

            const { pageIndex, pageSize } = pagination;

            // Apply pagination (unless pageSize is -1 for "all")
            const baseQuery = buildBaseQuery(selection, "list");
            const paginatedQuery =
                pageSize === -1
                    ? baseQuery
                    : baseQuery.offset(pageIndex * pageSize).limit(pageSize);

            const rows = (await paginatedQuery) as Record<string, unknown>[];
            const items = transformResults(rows);

            // Count total (without any filters)
            const totalCountQuery = buildBaseQuery(
                {
                    total: countDistinct(keyColumn),
                },
                "count"
            );
            const totalCountResult = (await totalCountQuery) as {
                total: number;
            }[];
            const totalCount = totalCountResult[0].total;

            // Count filtered (with WHERE and HAVING, but no pagination)
            const totalFilterCount = (await buildBaseQuery(
                {
                    total: countDistinct(keyColumn),
                },
                "filterCount"
            )) as { total: number }[];
            const filteredCount = totalFilterCount[0].total;

            return {
                items,
                count: totalCount,
                filteredCount,
            };
        },

        async get(params: GetParams) {
            const { where = [], having = [] } = params;

            const baseQuery = db
                .select(selection)
                .from(from) as unknown as ChainableQuery;
            const withJoins = applyJoins(baseQuery);

            const withWhere =
                where.length > 0 ? withJoins.where(and(...where)) : withJoins;

            const withGroupBy =
                groupBy && groupBy.length > 0
                    ? withWhere.groupBy(...groupBy)
                    : withWhere;

            const withHaving =
                having.length > 0
                    ? withGroupBy.having(and(...having))
                    : withGroupBy;

            const withLimit = withHaving.limit(1);

            const rows = (await withLimit) as Record<string, unknown>[];
            const items = transformResults(rows);

            return items[0] ?? null;
        },
    };
}
