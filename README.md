# DBMux - Database Management CLI

A flexible, modern database management CLI tool built with TypeScript. It supports multiple database systems through a driver-based architecture, with PostgreSQL as the primary implementation.

## Features

- 🔮 **Multi-Database Support**: Easily extendable to support MySQL, SQLite, and more.
- 🔗 **Connection Management**: Save and reuse database connections for any supported DB.
- 🛡️ **Type-safe CLI**: Built with [brocli](https://github.com/drizzle-team/brocli) for robust argument parsing and validation.
- 🗃️ **Persistent Config**: Connections saved to `~/.dbmux/config.json`.
- 💾 **Database Backup & Restore**: Production-ready pg_dump and pg_restore (PostgreSQL only).
- 🚀 **Modern Architecture**: ESM modules, strict TypeScript, and a clean, driver-based design.

## Architecture

DBMux is built on a driver-based architecture that makes it easy to extend and support multiple database systems. The core logic is decoupled from any specific database implementation, allowing for a flexible and scalable design.

- **`DatabaseDriver` Interface**: The contract for all database operations is defined in `src/db-drivers/database-driver.ts`. Any new database driver must implement this interface.
- **Driver Implementations**: Each supported database has its own driver class (e.g., `PostgresDriver`) that contains the specific logic for that database.
- **Driver Factory**: The `createDriver` function in `src/db-drivers/driver-factory.ts` is responsible for instantiating the correct driver based on the connection's `type`.

### Extending DBMux (Adding a New Database)

To add support for a new database (e.g., MySQL), follow these steps:

1.  **Create the Driver**: Create a new file, `src/db-drivers/mysql-driver.ts`, and implement the `DatabaseDriver` interface.

    ```typescript
    // src/db-drivers/mysql-driver.ts
    import type { DatabaseDriver } from "./database-driver.js";
    // ... other imports

    export class MySqlDriver implements DatabaseDriver {
        // Implement all required methods:
        // connect, disconnect, testConnection, getDatabases, etc.
    }
    ```

2.  **Update the Factory**: Add the new driver to `src/db-drivers/driver-factory.ts`.

    ```typescript
    // src/db-drivers/driver-factory.ts
    import { MySqlDriver } from "./mysql-driver.js";
    // ...

    export function createDriver(type: DatabaseType): DatabaseDriver {
        switch (type) {
            // ...
            case "mysql":
                return new MySqlDriver();
            // ...
        }
    }
    ```

3.  **Update Types**: If needed, add the new database type to `DatabaseType` in `src/types/database.ts` and adjust `ConnectionConfig` for any specific connection options.

4.  **Install Dependencies**: Install the required Node.js package for the new database.

    ```bash
    pnpm add mysql2
    ```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: `v22.0.0` or higher
- **pnpm**: `v10.0.0` or higher

This project uses specific versions of Node.js and pnpm, which are defined in the `engines` field of the `package.json` file.

## Installation

### From npm (when published)

```bash
npm install -g dbmux
# or
pnpm add -g dbmux
```

### From source

```bash
git clone https://github.com/bhagyamudgal/dbmux.git
cd dbmux
pnpm install
pnpm build
npm link
```

## Development

The development setup includes TypeScript, ESLint for code quality, and Prettier for formatting. To add support for a new database, you would create a new class that implements the `DatabaseDriver` interface in the `src/db-drivers` directory.

```bash
# Install dependencies
pnpm install

# Run in development mode (with hot reload)
pnpm dev:watch

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format
pnpm format:check
```

## Usage

### Connect to a Database

You can connect to any supported database by specifying the flags, or run the command without flags for an interactive setup.

```bash
# Interactive mode
dbmux connect

# Flag-based mode
dbmux connect --type postgresql -n my-postgres -u postgres -d myapp_production
```

### List Operations

```bash
# List saved connections
dbmux list --connections
dbmux config list

# List all databases
dbmux list --databases

# List tables in current database
dbmux list --tables

# List tables in specific schema
dbmux list --tables --schema public

# Use specific saved connection
dbmux list --tables -n production
```

### Execute Queries

```bash
# Execute a simple query
dbmux query -q "SELECT * FROM users LIMIT 5"

# Execute with specific output format
dbmux query -q "SELECT name, email FROM users" --format json
dbmux query -q "SELECT * FROM orders" --format csv

# Execute from file
dbmux query -f queries.sql

# Use saved connection
dbmux query -n production -q "SELECT version()"

# Limit results
dbmux query -q "SELECT * FROM logs" --limit 100
```

### Database Backup & Restore (PostgreSQL Only)

```bash
# Create a database dump (interactive mode)
dbmux dump

# Create dump with specific database and output file
dbmux dump -d myapp_production -o backup

# Create dump with custom format
dbmux dump -d myapp_db --format plain

# Create dump with verbose output
dbmux dump -d myapp_db --verbose

# Restore from a dump file (interactive mode)
dbmux restore

# Restore specific file to new database
dbmux restore -f backup.dump --create

# Restore and drop existing database
dbmux restore -f backup.dump -d myapp_dev --drop

# Restore with verbose output
dbmux restore -f backup.dump --verbose
```

### Configuration Management

Run commands with flags, or use the interactive prompts for adding and removing connections.

```bash
# Add a new connection interactively
dbmux config add

# Remove a connection interactively
dbmux config remove

# List all saved connections
dbmux config list

# Set default connection
dbmux config default -n production

# Show configuration file location and contents
dbmux config show
```

## Commands Reference

### `dbmux connect [options]`

Connect to a database. If required flags (like `--user` or `--file`) are omitted, it starts an interactive setup.

| Option       | Alias | Description                              | Default        | Required (non-interactive) |
| ------------ | ----- | ---------------------------------------- | -------------- | -------------------------- |
| `--type`     |       | Database type (e.g., `postgresql`)       | `postgresql`   | No                         |
| `--name`     | `-n`  | Connection name for saving               | auto-generated | No                         |
| `--host`     | `-H`  | Database host (not for SQLite)           | `localhost`    | No                         |
| `--port`     | `-p`  | Database port (not for SQLite)           | `5432`         | No                         |
| `--user`     | `-u`  | Database username (not for SQLite)       | -              | **Yes**                    |
| `--password` | `-w`  | Database password                        | prompt         | No                         |
| `--database` | `-d`  | Database name (not for SQLite)           | -              | **Yes**                    |
| `--file`     |       | File path for SQLite connection          | -              | **Yes**                    |
| `--ssl`      |       | Use SSL connection (PostgreSQL only)     | `false`        | No                         |
| `--save`     |       | Save connection configuration            | `true`         | No                         |
| `--test`     |       | Test connection without saving           | `false`        | No                         |
| `--verbose`  |       | Enable verbose logging from `pg_restore` | `false`        | No                         |

### `dbmux list [options]`

List databases, tables, or saved connections.

| Option          | Alias  | Description              |
| --------------- | ------ | ------------------------ |
| `--databases`   | `--db` | List all databases       |
| `--tables`      | `-t`   | List tables in database  |
| `--connections` | `-c`   | List saved connections   |
| `--connection`  | `-n`   | Use specific connection  |
| `--schema`      |        | Schema for table listing |
| `--limit`       | `-l`   | Limit number of rows     |

### `dbmux query [options]`

Execute SQL queries with flexible output.

| Option         | Alias | Description                    | Default |
| -------------- | ----- | ------------------------------ | ------- |
| `--sql`        | `-q`  | SQL query to execute           |         |
| `--file`       | `-f`  | Execute SQL from file          |         |
| `--connection` | `-n`  | Use saved connection           |         |
| `--format`     |       | Output format (table/json/csv) | table   |
| `--limit`      | `-l`  | Limit number of rows           |         |

### `dbmux dump [options]`

Create a backup of a PostgreSQL database. This command requires `pg_dump` to be installed and available in your system's PATH.

| Option         | Alias      | Description                                   | Default  |
| -------------- | ---------- | --------------------------------------------- | -------- |
| `--connection` | `-c`, `-n` | Use a specific saved connection               | default  |
| `--database`   | `-d`       | The database to dump (interactive if not set) | -        |
| `--output`     | `-o`       | The output file path (e.g., `backup.dump`)    | auto-gen |
| `--format`     | `-F`       | Dump format (`custom`, `plain`, `tar`, `dir`) | `custom` |
| `--verbose`    |            | Enable verbose logging from `pg_dump`         | `false`  |

### `dbmux restore [options]`

Restore a PostgreSQL database from a dump file. This command requires `pg_restore` and `psql` to be installed and available in your system's PATH.

| Option         | Alias      | Description                                       | Default |
| -------------- | ---------- | ------------------------------------------------- | ------- |
| `--connection` | `-c`, `-n` | Use a specific saved connection                   | default |
| `--file`       | `-f`       | The dump file to restore (interactive if not set) | -       |
| `--database`   | `-d`       | The target database name (interactive if not set) | -       |
| `--create`     |            | Create the target database before restoring       | `false` |
| `--drop`       |            | Drop the database before recreating and restoring | `false` |
| `--verbose`    |            | Enable verbose logging from `pg_restore`          | `false` |

### `dbmux config <subcommand>`

Manage configuration and connections.

- `dbmux config add` - Add a new connection interactively
- `dbmux config list` - List all saved connections
- `dbmux config remove [name]` - Remove a connection (interactive if name is omitted)
- `dbmux config default -n <name>` - Set default connection
- `dbmux config show` - Show config file and settings

## Configuration

DBMux stores configuration in `~/.dbmux/config.json`. Each connection now has a `type` field.

```json
{
    "connections": {
        "my-postgres": {
            "type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "user": "postgres",
            "database": "myapp_dev",
            "ssl": false
        },
        "my-sqlite": {
            "type": "sqlite",
            "filePath": "./db.sqlite"
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

## Project Structure

```
src/
├── commands/          # Command implementations
│   ├── connect.ts     # Database connection logic
│   ├── dump.ts        # Database dump operations (pg_dump)
│   ├── restore.ts     # Database restore operations (pg_restore)
│   ├── list.ts        # List databases/tables/connections
│   ├── query.ts       # SQL query execution
│   └── config.ts      # Configuration management
├── db-drivers/        # Database-specific implementations
│   ├── database-driver.ts
│   └── postgres-driver.ts
├── types/             # TypeScript type definitions
│   └── database.ts    # Database-related types
├── utils/             # Utility functions
│   ├── config.ts      # Configuration file management
│   ├── database.ts    # PostgreSQL connection utilities
│   ├── dump-restore.ts # Dump & restore utility functions
│   └── logger.ts      # Colored logging utilities
└── index.ts           # Main CLI entry point (BroCLI)
.
├── .cursorules        # Your custom rules for the assistant
├── .prettierrc.json   # Prettier formatting rules
└── eslint.config.js   # ESLint configuration
```

## Dependencies

**Runtime:**

- `@drizzle-team/brocli` - Modern CLI framework
- `pg` - PostgreSQL client for Node.js
- `cli-table3` - For displaying tabular data
- `@inquirer/prompts` - For interactive prompts

**Development:**

- `typescript` - Type safety and modern JavaScript features
- `tsx` - TypeScript execution for development
- `eslint` - Code quality linter
- `@typescript-eslint/parser` - ESLint parser for TypeScript
- `@typescript-eslint/eslint-plugin` - ESLint rules for TypeScript
- `prettier` - Code formatter
- `eslint-config-prettier` - Disables ESLint formatting rules
- `globals` - ESLint global variables

## npm Publishing

The package is configured for npm publishing with:

- Proper `bin` entry for global installation
- `prepublishOnly` script for automatic building
- Comprehensive `files` array for package inclusion
- Rich metadata and keywords for discoverability

```

```
