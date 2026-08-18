# Changelog

## 2.4.0

### Minor Changes

- 8c8306d: Add `dbmux update` to upgrade dbmux in place.

    The command detects how dbmux was installed. Standalone binaries are downloaded from
    the matching GitHub release, verified against `checksums.txt`, and replaced with the
    previous binary kept as a rollback until the new one reports the expected version.
    Global npm, bun and pnpm installs re-run their own install command. `--check` reports
    whether an update exists without installing anything.

    This also fixes `--version` in standalone binaries, which reported a hardcoded `2.2.0`
    regardless of the real version because the compiled binary cannot read `package.json`
    off disk. The version is now embedded at build time.

## 2.3.1

### Patch Changes

- bec9bdf: Fix three PostgreSQL connection-lifecycle faults that could crash or hang the CLI.

    Deleting the database dbmux is currently connected to could die with an uncaught `Unhandled 'error' event` instead of reporting success, because dropping it terminates the backends of the pools dbmux itself holds and the pool had no error listener. `dbmux connect` could hang when the connection check passed but the validation query that followed failed: the pooled client was never released, and its live socket kept Node's event loop running. A connection that failed partway through opening was never closed at all, leaving its pool behind.

- 72386d0: Fix `restore run` dying with an uncaught `ENOENT` when `pg_restore` or `psql` cannot be spawned. The runner never listened for the child process `error` event, and an unhandled `error` is rethrown as an uncaught exception, so the CLI died before the failure could be reported or recorded in history. The spawn failure now travels the normal error path and names the binary it could not run.
- 80529a4: Fix `dump create`, `restore run` and `db delete` hanging for roughly 30 seconds after printing their final line. Each opened the shared connection pool without closing it, and pg-pool keeps the idle socket and its idle timer referenced, so Node could not exit until the pool timed out. All three now close the connection on every path, including cancellation, early exits and failure.

    `dump create` and `restore run` now exit non-zero whenever they report a failure. Cases such as a missing `pg_dump`, an unknown database or no saved connection previously printed an error and exited 0, which scripts could not detect. Cancelling at a prompt still exits 0, because that is not a failure.

    Commands that fail now set an exit status and return rather than terminating the process outright, so cleanup runs and buffered output is not truncated. A connection that cannot be closed is reported as a warning that says the command itself completed, so a finished dump or delete is no longer reported as a failure.

## 2.3.0

### Minor Changes

- 4aaaa6e: Use the `pg_dump`/`pg_restore` binary matching the connected server's major version.

    Restoring into a PostgreSQL server older than the local client failed outright, because `pg_restore` 17 opens every restore with `SET transaction_timeout = 0` — a parameter that only exists from PostgreSQL 17 on. dbmux now reads the server version and prefers a client of the same major version from the usual install locations (Homebrew, Postgres.app, Debian, RHEL, Windows), falling back to the one on `PATH` with a warning.

    A restore whose `PATH` client is newer than the server, with no matching client installed, now aborts with install instructions rather than failing partway through. The check runs before the drop-and-recreate step, so the target database is left intact.

## [2.2.3] - 2026-01-13

### Added

- **Dump Progress Indicator**: Live spinner with file size during `dump create` command
    - Shows animated spinner with growing file size (e.g., "Dumping... 45.2 MB")
    - Displays checkmark on success with final file size
    - Supports both file and directory format dumps
- **Dump Output Info**: Shows file name and directory path after dump completion

## [2.2.2] - 2026-01-07

### Fixed

- **npm Package**: Fixed broken install by moving workspace dependencies to devDependencies (they are bundled at build time)
- **npm Package**: Now includes README and LICENSE files
- **Release Script**: CI check now specifically checks ci.yml workflow, ignoring release workflow failures
- **Release Script**: Handles pending/missing CI runs with user prompts instead of blocking

### Changed

- **Package Metadata**: Updated keywords and added author information

## [2.2.0] - 2026-01-07

### Fixed

- **Disconnect Command**: Now correctly handles case when no default connection is configured
- **Config Rename**: Validates that new connection name doesn't already exist before renaming
- **Connection Prompt**: Fixed SSL default logic when parsing database URLs
- **Connection Prompt**: Added port validation (1-65535) in interactive mode

### Security

- **Install Script**: Added SHA256 checksum verification for downloaded binaries
- **Release Workflow**: Fixed sha256sum option parsing vulnerability with `--` separator

### Changed

- **Release Workflow**: GitHub release now created before npm publish to ensure binaries are available even if npm fails
- **Release Workflow**: Enabled npm Trusted Publishing with OIDC (no stored tokens)
- **Release Script**: Improved directory navigation to be location-independent
- **TypeScript Config**: Disabled `exactOptionalPropertyTypes` for simpler optional type handling

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
