# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Turborepo monorepo with Bun workspaces:

- `packages/cli/` — Main CLI, publishes as `dbmux` on npm
- `packages/types/` — `@dbmux/types` shared type definitions
- `packages/utils/` — `@dbmux/utils` shared utilities
- `packages/typescript-config/` — Shared TSConfig
- `packages/eslint-config/` — Shared ESLint config
- `apps/landing/` — Next.js 16 landing page
- `apps/video/` — Remotion video compositions

## Essential Commands

### Development

- `bun install` — Install all workspace dependencies
- `bun run dev:cli` — Run CLI once (from root)
- `bun run dev:cli:watch` — Run CLI in watch mode
- `bun run dev:landing` — Start landing page dev server

### Build & Test

- `bun run build` — Build all packages (via Turbo)
- `bun run build:cli` — Build CLI only
- `bun run build:binaries` — Cross-platform binaries (Linux, macOS Intel/ARM, Windows)
- `bun run test` — Run all tests
- `bun run test:cli` — CLI tests only
- `bun run typecheck` — TypeScript check all packages (required before commits)
- `bun run lint` — Lint all packages
- `bun run format` — Format code with Prettier

### Releasing

Versions are derived from changesets, never set by hand.

- `bun changeset` — record a user-visible change; commit the generated file with the PR
- Merging to `main` opens a "chore: version packages" PR; merging that PR publishes to npm and cuts the GitHub release

`dbmux` is the only published package — every other workspace is `private: true` and is excluded from versioning by `.changeset/config.json`.

## Architecture

dbmux is a TypeScript CLI built with Bun runtime and a driver-based architecture for multi-database support.

### Core Components (all under `packages/cli/src/`)

- **Entry Point**: `index.ts` — all commands defined with `@drizzle-team/brocli`
- **Database Drivers**: `db-drivers/` — `DatabaseDriver` interface + PostgreSQL implementation
- **Commands**: `commands/` — connect, list, query, dump, restore, db, config, history, status, disconnect
- **Utilities**: `utils/` — config, session, prompt, logger, command-runner, dump-restore
- **Types**: `@dbmux/types` package (`packages/types/src/database.ts`) — ConnectionConfig, QueryResult, DatabaseInfo, DumpHistoryEntry

### Driver Factory Pattern

1. Implement `DatabaseDriver` interface from `packages/cli/src/db-drivers/database-driver.ts`
2. Register in `packages/cli/src/db-drivers/driver-factory.ts`
3. Add type to `DatabaseType` in `packages/types/src/database.ts`

Currently only PostgreSQL is fully implemented. MySQL and SQLite throw "not implemented" in the driver factory switch.

### File Locations

- Config: `~/.dbmux/config.json`
- Session: `~/.dbmux/session.json`
- Dumps: `~/.dbmux/dumps/`
- History: `dumpHistory` array inside `~/.dbmux/config.json`

### Command Patterns

- Options defined in `packages/cli/src/index.ts` with brocli
- Handlers in `packages/cli/src/commands/`
- Use `getConnection()` for database config resolution
- Interactive prompts when required options are missing
- URL parsing in `packages/cli/src/utils/prompt.ts`

## Testing

Vitest with complete isolation and mocking:

- **Location**: `packages/cli/tests/`
- **Run**: `bun run test:cli` (from root) or `cd packages/cli && bun run test`
- **Watch**: `cd packages/cli && bun run test:watch`
- **Coverage**: `cd packages/cli && bun run coverage`
- **Philosophy**: Mock all external dependencies (filesystem, databases, logger)

## Project-Specific Code Style

Global rules from `~/.claude/CLAUDE.md` apply. Additional project conventions:

- 4-space indentation, double quotes
- kebab-case for files/directories
- Use `logger.fail()` for user-facing errors
- Use `getConnection()` to resolve database config (handles session, default, and named connections)

## Code comments

> **No comments in code. Rename or restructure instead.** Two exceptions, and each must fit on one line:
>
> 1. A `/** */` docstring on an exported symbol, stating a contract the signature cannot show.
> 2. A citation for a constraint the code cannot express: a URL, a spec section, an ADR or `docs/` path, or an issue number. The line carries the pointer, never the explanation.
>
> Everything else is banned. That includes any comment that explains what the code does, why it has its shape, what would break, or what you learned while writing it. Put that reasoning in the PR body, a test name, or an ADR.
>
> Existing comments in a file are not a style to match and not a license to add more. Leave them alone when you touch the file for another reason.
>
> Before reporting a code change done, print every added comment line that lacks a citation token and delete each comment it shows. The pattern is a net, not a parser: a printed line that is not a comment is a false positive to leave alone.
>
> ```bash
> CITED='https?://|docs/|ADR|#[0-9]+|§'
> git diff -U0 <base> -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.go' '*.rs' '*.java' '*.kt' '*.swift' '*.c' '*.h' '*.cpp' '*.cs' \
>   | grep -E '^\+([[:space:]]*(//|/\*|\* )|.*[[:space:]](//|/\*))' \
>   | grep -vE "$CITED|^\+[[:space:]]*/\*\*.*\*/[[:space:]]*\$"
> git diff -U0 <base> -- '*.py' '*.sh' '*.zsh' '*.rb' '*.toml' '*.yml' '*.yaml' \
>   | grep -E '^\+([[:space:]]*#|.*[[:space:]]#)' | grep -vE "$CITED|^\+#!"
> ```

Project tightening on top of the block above, which stays verbatim. The net misses `{/* */}` where `{` touches `/*` with no space between, and it exempts one-line `/** */` without checking for `export`. Run both before reporting done:

```bash
git diff -U0 <base> -- '*.tsx' '*.jsx' | grep -E '^\+.*\{/\*'
```

Confirm every added `/** */` line sits directly above an `export` line.

## Special Considerations

### Security

Personal/developer CLI tool — trust user input, prioritize functionality over defensive coding.

### Backup/Restore

Requires external `pg_dump` and `pg_restore` commands (PostgreSQL only). Check availability with `command-exists`.

### CLI Distribution

- Global npm package with `bin` entry
- Single executable binaries via `bun build --compile`
- ESM modules, requires Bun 1.1.0+
- Binary execution detection: `/$bunfs/root/` path handling

# important-instruction-reminders

After completing work, always run `bun run typecheck` to ensure type safety.
