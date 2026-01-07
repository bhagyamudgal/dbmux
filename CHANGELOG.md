# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2025-01-07

### Fixed

- **Disconnect Command**: Now correctly handles case when no default connection is configured
- **Config Rename**: Validates that new connection name doesn't already exist before renaming
- **Connection Prompt**: Fixed SSL default logic when parsing database URLs
- **Connection Prompt**: Added port validation (1-65535) in interactive mode

## [2.1.2] - 2025-12-17

### Fixed

- **Restore Path Resolution**: Fixed bug where restore command failed with "Dump file not found" when using absolute paths. Bun's `path.join()` behaves differently from Node.js, appending absolute paths instead of resetting to them.

## [2.1.1] - 2025-12-12

### Fixed

- **Restore File Path Resolution**: `--file` flag now checks `~/.dbmux/dumps/` first, then falls back to current directory
- **Restore Interactive Mode**: Now only lists files from `~/.dbmux/dumps/` instead of mixing with current directory
- **Dump Custom Filename**: Custom names now correctly get timestamp and `.dump` extension appended (e.g., `mybackup` becomes `mybackup_2025-12-12_12-30-45.dump`)

## [2.1.0] - 2025-12-12

### Added

- **Dump/Restore History Tracking**: Automatically tracks all dump and restore operations with timestamps, database names, connection info, file paths, and status
- **History Commands**:
    - `dbmux history list` - View dump/restore history with table or JSON output
    - `dbmux history clear` - Clear history entries (all or by operation type)
    - `dbmux dump history` - Shortcut to view dump history
    - `dbmux restore history` - Shortcut to view restore history
- **Restore from History**: `dbmux restore run --from-history` flag to select from previous successful dumps
- **Database Delete Command**: `dbmux db delete` - Drop databases interactively or via CLI (`-d <name>`)
- **Dump File Management**: `dbmux dump delete` - Delete dump files interactively or via CLI (`-f <file>`)
- **Dedicated Dumps Directory**: All dumps now stored in `~/.dbmux/dumps/`
- **Connection Sorting**: Connections sorted by last used time in selection prompts
- **Last Connected Display**: Shows relative time (e.g., "2h ago", "3d ago") beside connection names

### Changed

- **Command Structure**: `dump` and `restore` now use subcommands:
    - `dbmux dump create` - Create a database dump
    - `dbmux dump delete` - Delete dump files
    - `dbmux dump history` - View dump history
    - `dbmux restore run` - Restore a database
    - `dbmux restore history` - View restore history
- Dump filenames now always include timestamps, even for custom names
- Dump files now support `.dmp` extension in addition to `.dump` and `.sql`
- Restore command searches `~/.dbmux/dumps/` first, then current directory

## [2.0.1] - 2025-11-XX

### Fixed

- Fixed CLI execution issues with binary distribution

## [2.0.0] - 2025-11-XX

### Added

- **Database URL Connection Support**: Connect using database URLs in addition to individual connection fields:
    - Command line: `dbmux connect --url "postgresql://user:password@host:port/database"`
    - Interactive mode offers choice between URL or individual fields
    - Supports PostgreSQL URLs: `postgresql://` or `postgres://`
    - Supports SQLite URLs: `sqlite:///path/to/database.db`
    - SSL parameter support: `?ssl=true` or `?sslmode=require`
- **Cross-platform Binary Distribution**: Automated binary releases for Linux, macOS (Intel/ARM), and Windows
- **Release Automation**: Added `release.sh` script with safety checks and automated npm publishing

### Changed

- **Bun Runtime Migration**: Migrated entire project from Node.js + pnpm to Bun runtime:
    - Faster startup times and better performance
    - Native TypeScript support without transpilation
    - Unified toolchain (runtime + package manager + bundler)
- All scripts migrated to Bun: `bun dev`, `bun build`, `bun run test`

## [1.0.4] - 2025-XX-XX

### Added

- **Real-time Progress Feedback**: Enhanced restore operations with live progress indicators
- Added `executeCommandWithProgress()` function for real-time command output streaming

### Changed

- Restore operations now run in verbose mode by default
- All pg_restore and psql operations now stream output in real-time

### Fixed

- **Database Recreation Error**: Fixed PostgreSQL transaction block error when dropping and recreating databases
- **Silent Restore Operations**: Resolved issue where large restore operations appeared to hang

## [1.0.3] - 2025-XX-XX

### Added

- Improved test coverage for dump and restore commands with edge case testing
- Added global test timeout to prevent hanging tests

### Fixed

- Resolved memory leaks and hanging processes in test suite
- Fixed improper mocking of ESM modules (`fs`, `@inquirer/prompts`)
- Stabilized test environment with proper `process.exit` handling
- Fixed child process stdin handling to prevent deadlocks

## [1.0.2] - 2025-XX-XX

### Added

- **Interactive Connection Management**: `config manage` command with user-friendly interactive menu
- **Session Management**: CLI tracks "active" connection for your session
- **Status Command**: Display default and active connection info
- **Disconnect Command**: Clear active session and revert to default connection
- **Database Override**: `--database` flag for `query` and `list` commands
- **Rename Connections**: `config rename` command for renaming existing connections
- **Config Path**: `config path` command to locate configuration file

### Fixed

- Resolved circular dependency between `config.ts` and `session.ts`
- Fixed duplicate save issue in `connect` command
