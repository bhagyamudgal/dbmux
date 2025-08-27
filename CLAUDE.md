# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Package Management

- **Package Manager**: Always use `bun` (v1.1.0+) - replaced pnpm for better performance and compatibility
- **Install dependencies**: `bun install`
- **Development**: `bun dev` (one-time run) or `bun dev:watch` (watch mode)
- **Build**: `bun build` (builds to `dist/`)
- **Test**: `bun run test` (run once), `bun run test:watch` (watch mode), `bun run coverage` (with coverage)
- **Binary Build**: `bun build:binary` (creates executable), `bun build:linux` (cross-platform)

### Code Quality

- **Type checking**: `bun typecheck` (required before commits)
- **Linting**: `bun lint` (ESLint with TypeScript)
- **Formatting**: `bun format` (write) or `bun format:check` (check only)

### Build & Distribution

- **Clean build**: `bun clean && bun build`
- **Production start**: `bun start` (runs built CLI)
- **Link for testing**: `bun link` (after building)
- **Binary compilation**: `bun build:binary` (single executable)
- **Cross-platform binaries**: `bun build:linux`, `bun build:macos-arm64`, `bun build:windows`

## Architecture Overview

DBMux is a TypeScript CLI tool built with Bun runtime and a driver-based architecture for multi-database support:

### Core Architecture

- **Runtime**: Bun runtime (replaces Node.js) for improved performance and compatibility
- **CLI Framework**: Built with `@drizzle-team/brocli` for type-safe command parsing
- **Driver Pattern**: `DatabaseDriver` interface (`src/db-drivers/database-driver.ts`) enables multi-database support
- **Configuration**: JSON-based config stored in `~/.dbmux/config.json`
- **Session Management**: Active connections tracked in `~/.dbmux/session.json`
- **Connection Methods**: Support for both database URLs (`postgresql://...`) and individual parameters

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
- URL-based connections: `postgresql://user:pass@host:port/db?ssl=true`
- Interactive prompts offer choice between URL input or individual fields

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
- URL parsing support in `src/utils/prompt.ts` for database URLs
- Connection method selection (URL vs individual fields) in interactive mode

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
- `vitest` - Testing framework (kept for compatibility with vi.hoisted())
- `eslint` + `@typescript-eslint/*` - Linting
- `prettier` - Code formatting
- `husky` + `lint-staged` - Git hooks
- **Note**: Bun handles TypeScript execution natively, no need for `tsx`

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
- Compiled to single executable binaries for distribution
- ESM modules throughout
- Requires Bun 1.1.0+ (replaces Node.js requirement)
- Cross-platform binaries via GitHub releases
- Binary execution detection with `/$bunfs/root/` path handling

## New Features (Latest Updates)

### Database URL Connection Support

- **URL Parsing**: Support for `postgresql://`, `postgres://`, and `sqlite://` URLs
- **SSL Detection**: Automatic SSL enablement from URL parameters (`?ssl=true`, `?sslmode=require`)
- **Interactive Choice**: Users can choose between URL input or individual field input
- **CLI Flag**: Direct URL usage via `--url` or `-U` flag
- **Validation**: Comprehensive URL format and protocol validation

### Bun Runtime Migration

- **Performance**: Faster startup and execution compared to Node.js
- **Compatibility**: Native TypeScript support, no transpilation needed
- **Binary Compilation**: Single executable generation for easy distribution
- **Package Management**: Unified toolchain (runtime + package manager)

### Testing Infrastructure

- **Framework**: Vitest (maintained for vi.hoisted() compatibility)
- **Coverage**: 106 tests passing with comprehensive URL feature coverage
- **Mocking Strategy**: Complete isolation using vi.hoisted() for predictable tests
- **Test Files**: `tests/connect.test.ts`, `tests/prompt.test.ts` for URL functionality

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
