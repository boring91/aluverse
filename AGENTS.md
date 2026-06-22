# Rules

- Never run bun dev, the process is already running, if not let me know and I will run it.
- Never set return types to function unless in recursions.
- Never throw inside server side components except for TRPC routes, use neverthrow instead to propagate the error correctly.
- When creating zod schemas for trpc inputs, if the input is a single value like courseId, keyword, etc, no need to create a schema, just inline the input with validations in the route itself.
- Do not export types/functions/constants/etc. if they are not going to be used outside the file.
- With drizzle, never use the `sql` operator unless you cannot create the query with drizzle functions
- Use `type Props = {...}` for exported components when it makes sense.
- When a component prop mirrors a tRPC route's output (or a slice of it), infer it via `inferRouterOutputs<AppRouter>[...]` instead of re-declaring the fields by hand.
- If a function should be only used on server (no client/worker), it needs to be wrapped in `createServerOnlyFn`. Inversely, if a function should be only used on client (no server/worker), it needs to be wrapped in `createClientOnlyFn`.
- Never co-locate pure/client-safe logic with server-only data-access (`@/db`/`@/jobs`) in one module: pure helpers stay in `lib/`, DB reads go in `queries/*.query.ts`, DB writes in `mutations/*.mutation.ts`.
- Reuse zod schemas whenever possible: type a function's params as `z.infer<typeof schema>` spread flat (intersect extra context like `& { userId: string }`), never re-declaring fields nor nesting the schema under a `data` key.
- In zod schemas, always pass Paraglide messages lazily as `{ error: () => m.x() }` (never eagerly as `m.x()`), so they resolve in the request locale and don't read cookies at module import.
