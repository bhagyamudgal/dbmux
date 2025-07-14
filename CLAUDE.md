# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Package Management

- **Package Manager**: Always use `pnpm` (v10.0.0+)
- **Install dependencies**: `pnpm install`
- **Development**: `pnpm dev` (one-time run) or `pnpm dev:watch` (watch mode)
- **Build**: `pnpm build` (builds to `dist/`)
- **Test**: `pnpm test` (run once), `pnpm test:watch` (watch mode), `pnpm coverage` (with coverage)

### Code Quality

- **Type checking**: `pnpm typecheck` (required before commits)
- **Linting**: `pnpm lint` (ESLint with TypeScript)
- **Formatting**: `pnpm format` (write) or `pnpm format:check` (check only)

### Build & Distribution

- **Clean build**: `pnpm clean && pnpm build`
- **Production start**: `pnpm start` (runs built CLI)
- **Link for testing**: `npm link` (after building)

## Architecture Overview

DBMux is a TypeScript CLI tool built with a driver-based architecture for multi-database support:

### Core Architecture

- **CLI Framework**: Built with `@drizzle-team/brocli` for type-safe command parsing
- **Driver Pattern**: `DatabaseDriver` interface (`src/db-drivers/database-driver.ts`) enables multi-database support
- **Configuration**: JSON-based config stored in `~/.dbmux/config.json`
- **Session Management**: Active connections tracked in `~/.dbmux/session.json`

### Key Components

- **Entry Point**: `src/index.ts` - defines all commands using brocli
- **Database Drivers**: `src/db-drivers/` - currently PostgreSQL, designed for MySQL/SQLite expansion
- **Commands**: `src/commands/` - individual command implementations
- **Configuration**: `src/utils/config.ts` - config file management
- **Session**: `src/utils/session.ts` - active connection tracking
- **Types**: `src/types/database.ts` - core type definitions

### Driver Factory Pattern

New database drivers are added through:

1. Implement `DatabaseDriver` interface
2. Add to `createDriver()` in `src/db-drivers/driver-factory.ts`
3. Update `DatabaseType` in `src/types/database.ts`

## Testing Strategy

Tests use **Vitest** with complete isolation and mocking:

- **Location**: `tests/` directory
- **Philosophy**: Mock all external dependencies (filesystem, databases, logger)
- **Setup**: `tests/setup.ts` - global test configuration
- **Coverage**: Excludes `src/index.ts`, `src/types/`, and `src/commands/default.ts`
- **Timeout**: 10 seconds per test

## Key Development Patterns

### Configuration Management

- Config loaded from `~/.dbmux/config.json` with defaults
- Connections stored with `type`, `host`, `port`, `user`, `database`, etc.
- Session-based active connection overrides default connection

### Error Handling

- Commands should handle missing configurations gracefully
- Use `logger.fail()` for user-facing errors
- Throw descriptive errors for developer issues

### Command Structure

All commands follow similar patterns:

- Options defined in `src/index.ts` with brocli
- Handler functions in `src/commands/`
- Use `getConnection()` for database config resolution
- Interactive prompts when required options missing

### Database Operations

- Commands use `createDriver()` to get appropriate database driver
- All SQL operations go through driver interface
- Connection management handled by individual drivers

## Code Style (from .cursorrules)

### TypeScript Guidelines

- Always declare types for variables and functions
- Use `type` instead of `interface`
- No `any` types - create proper types
- Use 4-space indentation
- Use double quotes for strings
- Always use `===` instead of `==`
- Use camelCase for variables/functions, PascalCase for classes
- Use kebab-case for files/directories

### Function Guidelines

- Start function names with verbs
- Use boolean prefixes: `is`, `has`, `can`
- Write short functions (<20 instructions)
- Use early returns to avoid nesting
- Prefer single level of abstraction

### Error Handling

- Handle errors at beginning of functions
- Use early returns for error conditions
- Implement proper error logging
- Model expected errors as return values

## External Dependencies

### Runtime Dependencies

- `@drizzle-team/brocli` - CLI framework
- `pg` - PostgreSQL client
- `cli-table3` - Table formatting
- `@inquirer/prompts` - Interactive prompts
- `chalk` - Color output
- `command-exists` - Check external commands

### Development Dependencies

- `typescript` - Type checking
- `tsx` - TypeScript execution
- `vitest` - Testing framework
- `eslint` + `@typescript-eslint/*` - Linting
- `prettier` - Code formatting
- `husky` + `lint-staged` - Git hooks

## Special Considerations

### Database Backup/Restore

- Requires external `pg_dump` and `pg_restore` commands
- Check command availability with `command-exists`
- Only supports PostgreSQL currently

### Multi-Database Support

- Currently only PostgreSQL is fully implemented
- MySQL and SQLite drivers throw "not implemented" errors
- Framework ready for easy extension

### CLI Distribution

- Built as global npm package with `bin` entry
- ESM modules throughout
- Requires Node.js 22+ and pnpm 10+
