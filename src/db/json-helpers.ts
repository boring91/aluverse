import type { Expression, RawBuilder, Simplify } from "kysely";
import {
  jsonObjectFrom as kyselyJsonObjectFrom,
  jsonArrayFrom as kyselyJsonArrayFrom,
} from "kysely/helpers/postgres";

/**
 * Custom dehydration that preserves Date types.
 *
 * Kysely's ShallowDehydrateValue converts Date to string because that's what
 * JSON.stringify does. However, we use a custom JSON parser (jsonDateReviver
 * in db/index.ts) that converts ISO date strings back to Date objects.
 *
 * This type mirrors Kysely's ShallowDehydrateValue but keeps Date as Date.
 */
type DehydrateValuePreserveDates<T> = T extends null | undefined
  ? T
  : T extends (infer U)[] | null | undefined
    ? Array<DehydrateValuePreserveDates<U>> | Extract<T, null | undefined>
    : T extends Date
      ? Date // Keep Date as Date (Kysely converts to string)
      : T extends Uint8Array
        ? string // Binary data still becomes string
        : T extends bigint
          ? number
          : T;

/**
 * Recursively applies date-preserving dehydration to an object type.
 */
type DehydrateObjectPreserveDates<TObject> = {
  [K in keyof TObject]: DehydrateValuePreserveDates<TObject[K]>;
};

/**
 * A postgres helper for aggregating a subquery into a JSON object.
 *
 * This is a type-preserving wrapper around Kysely's jsonObjectFrom that
 * correctly types Date fields (which would otherwise be typed as string
 * due to JSON serialization). We use a custom JSON parser that converts
 * ISO date strings back to Date objects, so the types should reflect that.
 *
 * @example
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select(eb => [
 *     'id',
 *     jsonObjectFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id', 'pet.name'])
 *         .whereRef('pet.owner_id', '=', 'person.id')
 *     ).as('pet')
 *   ])
 *   .execute()
 * ```
 */
export function jsonObjectFrom<TObject>(
  expr: Expression<TObject>,
): RawBuilder<Simplify<DehydrateObjectPreserveDates<TObject>> | null> {
  return kyselyJsonObjectFrom(expr) as unknown as RawBuilder<Simplify<
    DehydrateObjectPreserveDates<TObject>
  > | null>;
}

/**
 * A postgres helper for aggregating a subquery into a JSON array.
 *
 * This is a type-preserving wrapper around Kysely's jsonArrayFrom that
 * correctly types Date fields (which would otherwise be typed as string
 * due to JSON serialization). We use a custom JSON parser that converts
 * ISO date strings back to Date objects, so the types should reflect that.
 *
 * @example
 * ```ts
 * const result = await db
 *   .selectFrom('person')
 *   .select(eb => [
 *     'id',
 *     jsonArrayFrom(
 *       eb.selectFrom('pet')
 *         .select(['pet.id', 'pet.name'])
 *         .whereRef('pet.owner_id', '=', 'person.id')
 *     ).as('pets')
 *   ])
 *   .execute()
 * ```
 */
export function jsonArrayFrom<TObject>(
  expr: Expression<TObject>,
): RawBuilder<Simplify<DehydrateObjectPreserveDates<TObject>>[]> {
  return kyselyJsonArrayFrom(expr) as unknown as RawBuilder<
    Simplify<DehydrateObjectPreserveDates<TObject>>[]
  >;
}

/**
 * Re-export jsonBuildObject from kysely as-is since it doesn't have
 * the same Date serialization issue (you control the types explicitly).
 */
export { jsonBuildObject } from "kysely/helpers/postgres";
