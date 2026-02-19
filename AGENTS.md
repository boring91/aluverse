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
2. **Build succeeds**: Run `bun run build` and resolve any build failures

### Type Inference

When working with entities, always infer types from existing sources rather than redefining them:

- Infer from tRPC route outputs using `RouterOutputs`
- Infer from Drizzle/Kysely schema definitions using `typeof` or `InferSelectModel`
- Never duplicate type definitions that can be derived from the source of truth

### TypeScript Conventions

- Always use `type` instead of `interface`
- Only export functions, types, constants, etc. if they are used in other files. Keep things unexported by default
