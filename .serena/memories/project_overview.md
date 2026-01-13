# DBMux Project Overview

## Purpose

DBMux is a TypeScript CLI tool for database management with persistent configuration. It provides a unified interface for connecting to, querying, and managing databases with support for backup/restore operations.

## Tech Stack

- **Runtime**: Bun (v1.1.0+)
- **Language**: TypeScript (strict mode)
- **CLI Framework**: @drizzle-team/brocli (type-safe command parsing)
- **Database Client**: pg (PostgreSQL)
- **UI Components**:
    - chalk (colored output)
    - cli-table3 (table formatting)
    - @inquirer/prompts (interactive prompts)
- **Testing**: Vitest
- **Build Tool**: Bun bundler + Turbo (monorepo)

## Monorepo Structure

This is a **Turborepo monorepo** with:

- `packages/cli` - Main CLI tool
- `packages/types` - Shared type definitions
- `packages/utils` - Shared utilities
- `packages/eslint-config` - ESLint configurations
- `packages/typescript-config` - TypeScript configurations
- `apps/landing` - Marketing landing page

## Key Features

- Multiple database connection management
- Session-based active connection tracking
- URL-based connection support (postgresql://, postgres://)
- Database dump and restore (via pg_dump/pg_restore)
- Query execution with formatted output
- Configuration stored in `~/.dbmux/config.json`

## Currently Supported Databases

- PostgreSQL (fully implemented)
- MySQL, SQLite (framework ready, not implemented)

## Package Manager

Always use `bun` - never npm, yarn, or pnpm.
