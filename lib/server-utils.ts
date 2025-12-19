// projection-utils.ts
import type { SQL } from "drizzle-orm";
import type { PgColumn, SelectedFields } from "drizzle-orm/pg-core";

// ============================================
// Types
// ============================================

type ColumnLike = PgColumn<any, any, any> | SQL.Aliased<unknown>;

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

type InferFieldType<T> = T extends ManyRelation<infer F>
    ? InferProjectionResult<F>[]
    : T extends ManyThroughRelation<infer F>
    ? InferProjectionResult<F>[]
    : T extends OneRequiredRelation<infer F>
    ? InferProjectionResult<F>
    : T extends OneRelation<infer F>
    ? InferProjectionResult<F> | null
    : T extends PgColumn<infer C, any, any>
    ? C["data"] | (C["notNull"] extends true ? never : null)
    : T extends SQL.Aliased<infer D>
    ? D | null
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
