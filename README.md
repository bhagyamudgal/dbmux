# dbmux

<p align="center">
  <img src="https://cdn.dbmux.com/gifs/github-banner.gif" alt="dbmux demo" />
</p>

A command line tool for PostgreSQL backups, restores, and queries, with saved connections and automatic history. Built with TypeScript and Bun.

Full command reference lives at [dbmux.com/docs](https://dbmux.com/docs).

## Quick start

```bash
# Install
npm install -g dbmux

# Connect (interactive, or pass a URL)
dbmux connect -U "postgresql://user:password@localhost:5432/mydb"

# Run a query against the active connection
dbmux query -q "SELECT * FROM users LIMIT 10"

# Back up a database
dbmux dump create -d mydb

# Restore it somewhere else
dbmux restore run -f backup.dump -d mydb_copy --create
```

## Commands

| Command                                                  | What it does                                                     | Docs                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `connect`                                                | Connect to a database and save it as a named connection          | [/docs/connect](https://dbmux.com/docs/connect)       |
| `query`                                                  | Execute SQL inline or from a file, output as table, JSON, or CSV | [/docs/query](https://dbmux.com/docs/query)           |
| `list`                                                   | List databases, tables, or saved connections                     | [/docs/list](https://dbmux.com/docs/list)             |
| `dump create` / `dump delete` / `dump history`           | Back up databases with pg_dump, manage dump files                | [/docs/dump](https://dbmux.com/docs/dump)             |
| `restore run` / `restore history`                        | Restore from dumps with pg_restore or psql                       | [/docs/restore](https://dbmux.com/docs/restore)       |
| `db delete`                                              | Drop a database, with confirmations                              | [/docs/db](https://dbmux.com/docs/db)                 |
| `config add/list/remove/default/show/path/rename/manage` | Manage saved connections                                         | [/docs/config](https://dbmux.com/docs/config)         |
| `history list` / `history clear`                         | View and clear dump/restore history                              | [/docs/history](https://dbmux.com/docs/history)       |
| `status`                                                 | Show the active and default connections                          | [/docs/status](https://dbmux.com/docs/status)         |
| `disconnect`                                             | Clear the active session connection                              | [/docs/disconnect](https://dbmux.com/docs/disconnect) |
| `update`                                                 | Self-update binaries or global installs                          | [/docs/update](https://dbmux.com/docs/update)         |

## Why dbmux

- **Saved connections.** Name a connection once, then `dbmux query -n production`. Every command resolves its target the same way: explicit `-n`, then the active session, then your configured default.
- **Backups without pg_dump archaeology.** Timestamped filenames, four dump formats, files organized under `~/.dbmux/dumps/`.
- **History by default.** Every dump and restore is recorded with status and file size. Failed operations leave a trace.
- **Safety rails where it counts.** Restores and drops ask for confirmation, sometimes twice. `--force` skips them when you mean it.
- **Self-updating.** Standalone binaries download release assets with SHA256 verification; npm/bun/pnpm installs re-run their own updater.

PostgreSQL is fully supported today. The driver layer is designed so other databases slot in behind the same interface (see [Architecture](#architecture)); SQLite shows up in prompts but is not usable yet.

## Prerequisites

- Bun 1.1.0+ if building from source (Node.js 22+ for npm distribution)
- `pg_dump` and `pg_restore` on PATH for dump/restore commands

## Installation

### Quick install

```bash
curl -fsSL https://raw.githubusercontent.com/bhagyamudgal/dbmux/main/install.sh | bash
```

Detects your platform and installs the latest binary. No Node.js needed.

### From npm

```bash
npm install -g dbmux
# or
bun add -g dbmux
```

### Pre-built binaries

Download from [GitHub Releases](https://github.com/bhagyamudgal/dbmux/releases):

| Platform              | Binary                  |
| --------------------- | ----------------------- |
| Linux (x64)           | `dbmux-linux-x64`       |
| macOS (Intel)         | `dbmux-darwin-x64`      |
| macOS (Apple Silicon) | `dbmux-darwin-arm64`    |
| Windows (x64)         | `dbmux-windows-x64.exe` |

### From source

```bash
git clone https://github.com/bhagyamudgal/dbmux.git
cd dbmux
bun install
bun run build
bun link
```

## Configuration

Everything lives under `~/.dbmux/`:

- `config.json` — saved connections, the default connection, settings, and operation history
- `session.json` — the active session connection (`connect` sets it, `disconnect` clears it)
- `dumps/` — dump files

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
            "lastConnectedAt": "2026-01-15T10:30:00Z"
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

See [/docs/configuration](https://dbmux.com/docs/configuration) for every field.

## Development

This is a Turborepo monorepo with Bun workspaces:

```
dbmux/
├── apps/
│   ├── landing/                  # Next.js landing page and docs
│   └── video/                    # Remotion video compositions
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

```bash
git clone https://github.com/bhagyamudgal/dbmux.git
cd dbmux
bun install

bun run build          # Build all packages
bun run dev:cli -- --help   # Run the CLI locally
bun run dev:landing    # Landing page + docs dev server
```

Other scripts:

```bash
bun run build:cli          # CLI only
bun run build:landing      # Landing only
bun run build:binaries     # Cross-platform binaries
bun run dev:cli:watch      # CLI watch mode
bun run test               # All tests
bun run test:cli           # CLI tests only
bun run lint               # Lint all packages
bun run typecheck          # TypeScript check all packages
bun run format             # Prettier
```

Tests use Vitest with all external dependencies (filesystem, databases, logger) mocked:

```bash
bun run test                          # from the root
cd packages/cli && bun run test:watch # watch mode
cd packages/cli && bun run coverage   # coverage report
```

Releases are driven by changesets. Record user-visible changes with `bun changeset` and commit the generated file; merging to `main` opens a version-packages PR, and merging that publishes to npm.

## Architecture

Database support sits behind a driver interface:

- **`DatabaseDriver`** (`packages/cli/src/db-drivers/database-driver.ts`) defines the contract: connect, query, list databases and tables, drop database, terminate connections.
- **Driver implementations** hold the database-specific logic. PostgreSQL lives in `postgres-driver.ts`.
- **The driver factory** instantiates the right driver from the connection's `type`.

Adding a database means implementing the interface, registering it in `driver-factory.ts`, and adding the type to `@dbmux/types`.

Commands are defined with [brocli](https://github.com/drizzle-team/brocli) in `packages/cli/src/index.ts`; handlers live in `packages/cli/src/commands/`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun run test` and `bun run typecheck`
5. Submit a pull request
