# Project Architecture

## Directory Structure

```
dbmux/
├── apps/
│   └── landing/              # Marketing landing page (Next.js)
├── packages/
│   ├── cli/                  # Main CLI application
│   │   ├── src/
│   │   │   ├── index.ts      # Entry point, command definitions
│   │   │   ├── commands/     # Command implementations
│   │   │   │   ├── config/   # Config subcommands
│   │   │   │   ├── history/  # History subcommands
│   │   │   │   └── db/       # DB subcommands
│   │   │   ├── db-drivers/   # Database driver implementations
│   │   │   └── utils/        # Utilities (config, session, logger)
│   │   └── tests/            # Test files
│   ├── types/                # Shared type definitions
│   ├── utils/                # Shared utilities
│   ├── eslint-config/        # ESLint configurations
│   └── typescript-config/    # TypeScript configurations
├── package.json              # Root package (workspaces)
└── turbo.json                # Turborepo config
```

## Core Architecture Patterns

### Driver Pattern

Database operations use the `DatabaseDriver` interface:

- `packages/cli/src/db-drivers/database-driver.ts` - Interface
- `packages/cli/src/db-drivers/postgres-driver.ts` - PostgreSQL impl
- `packages/cli/src/db-drivers/driver-factory.ts` - Factory function

Adding new database:

1. Implement DatabaseDriver interface
2. Add to createDriver() factory
3. Update DatabaseType in types

### Command Structure

Commands defined with brocli in `src/index.ts`:

- Options defined declaratively
- Handler functions in `src/commands/`
- Use `getConnection()` for config resolution
- Interactive prompts when options missing

### Configuration

- Config file: `~/.dbmux/config.json`
- Session file: `~/.dbmux/session.json`
- Managed via `src/utils/config.ts` and `src/utils/session.ts`

### Connection Methods

1. Named connections (from config)
2. URL-based (postgresql://user:pass@host:port/db)
3. Individual parameters (host, port, user, etc.)

## Key Files

- `packages/cli/src/index.ts` - CLI entry point
- `packages/cli/src/db-drivers/database-driver.ts` - Driver interface
- `packages/cli/src/utils/config.ts` - Config management
- `packages/cli/src/utils/session.ts` - Session management
- `packages/cli/src/utils/prompt.ts` - Interactive prompts
- `packages/types/src/database.ts` - Core type definitions

## Testing

- Framework: Vitest
- Location: `packages/cli/tests/`
- Philosophy: Mock all external dependencies
- Setup: `tests/setup.ts`
