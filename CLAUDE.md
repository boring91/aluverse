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
