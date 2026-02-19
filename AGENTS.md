# CLAUDE.md

## Project Rules

### Package Manager

This is a Bun project. Always use `bun` for running scripts and installing packages:

- `bun install` for installing dependencies
- `bun run <script>` for running scripts
- `bun add <package>` for adding dependencies

### Code Quality

Before completing any code changes, ensure:

1. **Linting passes**: Run `bun run lint` and fix any errors
2. **Typecheck passes**: Run `bun run check` and fix any errors
3. **Build succeeds**: Run `bun run build` and resolve any build failures

### Type Inference

When working with entities, always infer types from existing sources rather than redefining them:

- Infer from tRPC route outputs using `RouterOutputs`
- Infer from Drizzle/Kysely schema definitions using `typeof` or `InferSelectModel`
- Never duplicate type definitions that can be derived from the source of truth

### TypeScript Conventions

- Always use `type` instead of `interface`
- Only export functions, types, constants, etc. if they are used in other files. Keep things unexported by default
- Never use `any`
- Never annotate function or method return types explicitly; rely on TypeScript return type inference

### Architectural Conventions

- Always follow existing patterns; do not invent new ones when a similar pattern already exists in the codebase
- Drizzle is used for schema definition/migrations and Kysely for runtime querying
- Shared schemas in features must use `*.shared-schema.ts`
- Shared list/filter schema utilities must live in `@/lib/shared-schemas.ts`
- All select expressions (columns, computed fields, subqueries) must live in mapper files, not inline query files
- Mappers must live under `@/shared/mappers/<feature>/` and follow `*-full.mapper.ts` / `*-list.mapper.ts`
- Query/filter/computed DB expressions must live under `@/shared/expressions/<feature>/` and use `*.expression.ts` files
- Import expressions directly from their feature expression file (avoid cross-feature expression barrels)
- Query files must use `*.query.ts` and export `...Query` functions
- Mutation files must use `*.mutation.ts` and export `...Mutation` functions
- API router files must use `*.router.ts`
- Derive update schemas from create schemas using `.omit().safeExtend()` where applicable instead of duplicating fields
- For related-table writes in mutations, return IDs from writes and re-query with full mapper after related writes complete
- Prefer spreading input data in mutations when schema shape matches table columns

### Utilities

- Utilities shared between server/client should be in `@/lib/shared-utils.ts`
- Server-only utilities should be in `@/lib/server-utils.ts`
- Client-only utilities should be in `@/lib/client-utils.ts`
