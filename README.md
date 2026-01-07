# dbmux - Database Management CLI

A flexible, modern database management CLI tool built with TypeScript and Bun. Supports multiple database systems through a driver-based architecture, with PostgreSQL as the primary implementation.

## Features

- **Multi-Database Support**: Easily extendable to support MySQL, SQLite, and more
- **Connection Management**: Save and reuse database connections with URL or field-based input
- **Type-safe CLI**: Built with [brocli](https://github.com/drizzle-team/brocli) for robust argument parsing
- **Persistent Config**: Connections saved to `~/.dbmux/config.json`
- **Database Backup & Restore**: Production-ready pg_dump and pg_restore with history tracking
- **Database Operations**: Delete databases directly from CLI with safety confirmations
- **Modern Architecture**: Turborepo monorepo, ESM modules, strict TypeScript

## Monorepo Structure

This project is organized as a Turborepo monorepo:

```
dbmux/
├── apps/
│   └── landing/                  # Next.js landing page + docs
├── packages/
│   ├── cli/                      # Main CLI (publishes as 'dbmux' on npm)
│   ├── types/                    # @dbmux/types - shared type definitions
│   ├── utils/                    # @dbmux/utils - shared utilities
│   ├── typescript-config/        # @dbmux/typescript-config
│   └── eslint-config/            # @dbmux/eslint-config
├── turbo.json                    # Turborepo configuration
├── package.json                  # Root workspace configuration
└── bun.lock                      # Bun lockfile
```

## Prerequisites

- **Bun**: `v1.1.0` or higher (primary runtime and package manager)
- **Node.js**: `v22.0.0` or higher (for npm distribution compatibility)
- **pg_dump/pg_restore**: Required for backup/restore operations (PostgreSQL only)

## Installation

### Quick Install (Recommended)

Install dbmux with a single command - no Node.js or npm required:

```bash
curl -fsSL https://raw.githubusercontent.com/bhagyamudgal/dbmux/main/install.sh | bash
```

This automatically detects your platform and installs the latest binary.

### From npm

```bash
npm install -g dbmux
# or
bun add -g dbmux
```

### Pre-built Binaries

Download platform-specific binaries from [GitHub Releases](https://github.com/bhagyamudgal/dbmux/releases):

| Platform              | Binary                  |
| --------------------- | ----------------------- |
| Linux (x64)           | `dbmux-linux-x64`       |
| macOS (Intel)         | `dbmux-darwin-x64`      |
| macOS (Apple Silicon) | `dbmux-darwin-arm64`    |
| Windows (x64)         | `dbmux-windows-x64.exe` |

### From Source

```bash
git clone https://github.com/bhagyamudgal/dbmux.git
cd dbmux
bun install
bun run build
bun link
```

## Quick Start

```bash
# Connect to a database using URL
dbmux connect --url "postgresql://user:password@localhost:5432/mydb"

# Or connect interactively
dbmux connect

# List databases
dbmux list --databases

# Execute a query
dbmux query -q "SELECT * FROM users LIMIT 10"

# Create a backup
dbmux dump create -d mydb

# Restore from backup
dbmux restore run -f backup.dump -d mydb_copy --create
```

## Commands Reference

### `connect` - Connect to Database

Connect to a database and optionally save the configuration.

```bash
# Interactive mode (choose between URL or individual fields)
dbmux connect

# Using a database URL
dbmux connect --url "postgresql://user:password@localhost:5432/mydb?ssl=true"

# Using individual parameters
dbmux connect --type postgresql -H localhost -p 5432 -u postgres -d myapp

# Connect to a saved connection
dbmux connect -n my-saved-connection

# Test connection without saving
dbmux connect --url "postgresql://..." --test
```

| Option       | Alias | Description                            | Default      |
| ------------ | ----- | -------------------------------------- | ------------ |
| `--url`      | `-U`  | Database URL                           | -            |
| `--type`     |       | Database type (`postgresql`, `sqlite`) | `postgresql` |
| `--name`     | `-n`  | Connection name for saving/loading     | auto-gen     |
| `--host`     | `-H`  | Database host                          | `localhost`  |
| `--port`     | `-p`  | Database port (1-65535)                | `5432`       |
| `--user`     | `-u`  | Database username                      | -            |
| `--password` | `-w`  | Database password                      | prompt       |
| `--database` | `-d`  | Database name                          | -            |
| `--ssl`      |       | Use SSL connection                     | `false`      |
| `--save`     |       | Save connection configuration          | `true`       |
| `--test`     |       | Test connection only (don't establish) | `false`      |

### `list` - List Resources

List databases, tables, or saved connections.

```bash
# List all databases
dbmux list --databases

# List tables in current database
dbmux list --tables

# List tables in specific schema
dbmux list --tables --schema public

# List saved connections
dbmux list --connections

# Use specific connection
dbmux list --databases -n production
```

| Option          | Alias  | Description                   | Default  |
| --------------- | ------ | ----------------------------- | -------- |
| `--databases`   | `--db` | List all databases            | -        |
| `--tables`      | `-t`   | List tables in database       | -        |
| `--connections` | `-c`   | List saved connections        | -        |
| `--connection`  | `-n`   | Use specific saved connection | default  |
| `--schema`      |        | Schema for table listing      | `public` |
| `--database`    | `-d`   | Target database               | -        |

### `query` - Execute SQL

Execute SQL queries with flexible output formats.

```bash
# Execute inline query
dbmux query -q "SELECT * FROM users LIMIT 5"

# Execute from file
dbmux query -f queries.sql

# Output as JSON
dbmux query -q "SELECT * FROM users" --format json

# Output as CSV
dbmux query -q "SELECT * FROM users" --format csv

# Limit results
dbmux query -q "SELECT * FROM logs" --limit 100

# Use specific connection
dbmux query -n production -q "SELECT version()"
```

| Option         | Alias | Description                    | Default |
| -------------- | ----- | ------------------------------ | ------- |
| `--sql`        | `-q`  | SQL query to execute           | -       |
| `--file`       | `-f`  | Execute SQL from file          | -       |
| `--connection` | `-n`  | Use saved connection           | default |
| `--database`   | `-d`  | Target database                | -       |
| `--format`     |       | Output format (table/json/csv) | `table` |
| `--limit`      | `-l`  | Limit number of rows           | -       |

### `dump` - Database Backup

Create database backups using pg_dump. Requires `pg_dump` in PATH.

#### `dump create` - Create a Backup

```bash
# Interactive mode
dbmux dump create

# Specify database
dbmux dump create -d myapp_production

# Custom output filename
dbmux dump create -d mydb -o my-backup

# Different format
dbmux dump create -d mydb --format plain

# Verbose output
dbmux dump create -d mydb --verbose
```

| Option         | Alias | Description                              | Default  |
| -------------- | ----- | ---------------------------------------- | -------- |
| `--database`   | `-d`  | Database to dump                         | prompt   |
| `--connection` | `-n`  | Use saved connection                     | default  |
| `--format`     | `-f`  | Dump format (custom/plain/directory/tar) | `custom` |
| `--output`     | `-o`  | Output filename (without extension)      | auto-gen |
| `--verbose`    |       | Enable verbose output                    | `false`  |

#### `dump delete` - Delete Dump Files

```bash
# Interactive selection
dbmux dump delete

# Delete specific file
dbmux dump delete -f backup.dump

# Force delete without confirmation
dbmux dump delete -f backup.dump -F
```

| Option    | Alias | Description             |
| --------- | ----- | ----------------------- |
| `--file`  | `-f`  | Specific file to delete |
| `--force` | `-F`  | Skip confirmation       |

#### `dump history` - View Dump History

```bash
# Show recent dumps
dbmux dump history

# Limit results
dbmux dump history -l 5

# Output as JSON
dbmux dump history -f json
```

| Option     | Alias | Description                | Default |
| ---------- | ----- | -------------------------- | ------- |
| `--limit`  | `-l`  | Number of entries          | 10      |
| `--format` | `-f`  | Output format (table/json) | `table` |

### `restore` - Database Restore

Restore databases from dump files. Requires `pg_restore` and `psql` in PATH.

#### `restore run` - Restore a Database

```bash
# Interactive mode
dbmux restore run

# Restore to existing database
dbmux restore run -f backup.dump -d mydb

# Create new database and restore
dbmux restore run -f backup.dump -d mydb_new --create

# Drop existing and restore
dbmux restore run -f backup.dump -d mydb --drop

# Restore from history
dbmux restore run --fromHistory

# Verbose output
dbmux restore run -f backup.dump -d mydb --verbose
```

| Option          | Alias | Description                      | Default |
| --------------- | ----- | -------------------------------- | ------- |
| `--file`        | `-f`  | Dump file to restore             | prompt  |
| `--database`    | `-d`  | Target database name             | prompt  |
| `--connection`  | `-n`  | Use saved connection             | default |
| `--create`      | `-c`  | Create database before restoring | `false` |
| `--drop`        |       | Drop database before restoring   | `false` |
| `--fromHistory` | `-H`  | Select from dump history         | `false` |
| `--verbose`     |       | Enable verbose output            | `false` |

#### `restore history` - View Restore History

```bash
# Show recent restores
dbmux restore history

# Limit and format
dbmux restore history -l 5 -f json
```

### `db` - Database Management

Direct database management operations.

#### `db delete` - Delete a Database

Delete (DROP) a database from the server. Includes safety confirmations.

```bash
# Interactive selection
dbmux db delete

# Delete specific database
dbmux db delete -d old_database

# Force delete (skip confirmations)
dbmux db delete -d old_database -F

# Use specific connection
dbmux db delete -n production -d test_db
```

| Option         | Alias | Description               |
| -------------- | ----- | ------------------------- |
| `--database`   | `-d`  | Database to delete        |
| `--connection` | `-n`  | Use saved connection      |
| `--force`      | `-F`  | Skip confirmation prompts |

### `config` - Configuration Management

Manage saved connections and configuration.

#### `config add` - Add Connection

```bash
dbmux config add
```

Interactively add a new connection (URL or individual fields).

#### `config list` - List Connections

```bash
dbmux config list
```

Display all saved connections with details.

#### `config remove` - Remove Connection

```bash
# Interactive selection
dbmux config remove

# Remove specific connection
dbmux config remove -n old-connection
```

#### `config default` - Set Default

```bash
dbmux config default -n production
```

Set the default connection used when no connection is specified.

#### `config show` - Show Configuration

```bash
dbmux config show
```

Display the full configuration file contents.

#### `config path` - Show Config Path

```bash
dbmux config path
```

Display the path to the configuration file (`~/.dbmux/config.json`).

#### `config rename` - Rename Connection

```bash
# Interactive
dbmux config rename

# Specify names
dbmux config rename -n old-name --newName new-name
```

#### `config manage` - Interactive Management

```bash
dbmux config manage
```

Open an interactive menu for connection management.

### `history` - Dump/Restore History

View and manage operation history.

#### `history list` - List History

```bash
# All history
dbmux history list

# Only dumps
dbmux history list -t dump

# Only restores
dbmux history list -t restore

# Limit and format
dbmux history list -l 10 -f json
```

| Option     | Alias | Description                   | Default |
| ---------- | ----- | ----------------------------- | ------- |
| `--type`   | `-t`  | Filter by type (dump/restore) | all     |
| `--limit`  | `-l`  | Number of entries             | 10      |
| `--format` | `-f`  | Output format (table/json)    | `table` |

#### `history clear` - Clear History

```bash
# Clear all history
dbmux history clear

# Clear only dump history
dbmux history clear -t dump

# Clear only restore history
dbmux history clear -t restore
```

### `status` - Connection Status

```bash
dbmux status
```

Show the current active session and default connection.

### `disconnect` - Clear Session

```bash
dbmux disconnect
```

Clear the active connection session, reverting to the default connection.

## Configuration

DBMux stores configuration in `~/.dbmux/config.json`:

```json
{
    "connections": {
        "production": {
            "type": "postgresql",
            "host": "db.example.com",
            "port": 5432,
            "user": "admin",
            "database": "myapp",
            "ssl": true,
            "lastConnectedAt": "2024-01-15T10:30:00Z"
        },
        "local": {
            "type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "user": "postgres",
            "database": "myapp_dev",
            "ssl": false
        }
    },
    "defaultConnection": "local",
    "settings": {
        "logLevel": "info",
        "autoConnect": false,
        "queryTimeout": 30000
    }
}
```

Dump files are stored in `~/.dbmux/dumps/` with operation history tracked in `~/.dbmux/history.json`.

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/bhagyamudgal/dbmux.git
cd dbmux

# Install dependencies
bun install

# Build all packages
bun run build

# Run CLI in development
bun run dev:cli -- --help
```

### Available Scripts

```bash
# Build
bun run build              # Build all packages
bun run build:cli          # Build CLI only
bun run build:landing      # Build landing page only
bun run build:binaries     # Build cross-platform binaries

# Development
bun run dev                # Start all in dev mode
bun run dev:cli            # CLI development (run once)
bun run dev:cli:watch      # CLI development (watch mode)
bun run dev:landing        # Landing page development

# Testing
bun run test               # Run all tests
bun run test:cli           # CLI tests only

# Code Quality
bun run lint               # Lint all packages
bun run typecheck          # TypeScript check
bun run format             # Format code
bun run format:check       # Check formatting
```

### Testing

Tests use Vitest with complete isolation:

```bash
# Run tests
bun run test

# Watch mode
cd packages/cli && bun run test:watch

# Coverage
cd packages/cli && bun run coverage
```

### CLI Package Structure

```
packages/cli/
├── src/
│   ├── commands/              # Command implementations
│   │   ├── config/            # Config subcommands
│   │   │   ├── add.ts
│   │   │   ├── default.ts
│   │   │   ├── list.ts
│   │   │   ├── manage.ts
│   │   │   ├── path.ts
│   │   │   ├── remove.ts
│   │   │   ├── rename.ts
│   │   │   └── show.ts
│   │   ├── db/                # Database subcommands
│   │   │   └── delete.ts
│   │   ├── history/           # History subcommands
│   │   │   ├── clear.ts
│   │   │   └── list.ts
│   │   ├── config.ts
│   │   ├── connect.ts
│   │   ├── db.ts
│   │   ├── disconnect.ts
│   │   ├── dump.ts
│   │   ├── dump-delete.ts
│   │   ├── history.ts
│   │   ├── list.ts
│   │   ├── query.ts
│   │   ├── restore.ts
│   │   └── status.ts
│   ├── db-drivers/            # Database drivers
│   │   ├── database-driver.ts # Driver interface
│   │   ├── driver-factory.ts  # Driver factory
│   │   └── postgres-driver.ts # PostgreSQL implementation
│   ├── utils/                 # Utilities
│   │   ├── command-check.ts
│   │   ├── command-runner.ts
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── dump-restore.ts
│   │   ├── logger.ts
│   │   ├── prompt.ts
│   │   └── session.ts
│   └── index.ts               # CLI entry point
├── tests/                     # Test files
├── package.json
└── tsconfig.json
```

## Architecture

DBMux uses a driver-based architecture for database operations:

- **`DatabaseDriver` Interface**: Contract for all database operations
- **Driver Implementations**: Database-specific logic (PostgreSQL, SQLite, etc.)
- **Driver Factory**: Instantiates the correct driver based on connection type

### Adding a New Database Driver

1. Create driver: `packages/cli/src/db-drivers/mysql-driver.ts`
2. Implement `DatabaseDriver` interface
3. Register in `driver-factory.ts`
4. Add type to `@dbmux/types`

## Dependencies

**Runtime:**

- `@drizzle-team/brocli` - CLI framework
- `pg` - PostgreSQL client
- `cli-table3` - Table formatting
- `@inquirer/prompts` - Interactive prompts
- `chalk` - Colored output
- `command-exists` - External command checking

**Development:**

- `typescript` - Type safety
- `vitest` - Testing framework
- `eslint` + `typescript-eslint` - Linting
- `prettier` - Code formatting
- `turbo` - Monorepo build system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test`
5. Submit a pull request
