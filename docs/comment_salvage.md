# Comment salvage

Facts removed from code comments during the no-comments cleanup.
Each entry names the file and symbol it came from. Prune or promote
anything here to a real ADR; do not paste entries back into code.

## packages/cli/src/db-drivers/postgres-driver.ts — connect(), pool "error" listener

pg re-emits an idle client's error on the pool, and an unlistened
"error" event is an uncaught exception. `db delete` terminates the
backends of its own pools, so this fires on a delete that succeeded.

## packages/cli/src/db-drivers/postgres-driver.ts — connect(), client release

pool.end() waits for every checked-out client to come back, so a
client left out here hangs the CLI indefinitely rather than for
the 30s an idle client costs.

## packages/cli/src/db-drivers/postgres-driver.ts — isValidUnquotedName()

Accept any non-empty string up to 63 bytes without NUL characters.
This allows names like "my-db" returned by pg_database.datname.

## packages/cli/src/db-drivers/postgres-driver.ts — disconnect()

Retaining a half-ended pool makes the next end() reject with
"Called end on pool more than once".

## packages/cli/src/db-drivers/postgres-driver.ts — dropDatabase()

DROP DATABASE cannot use parameterized queries for the db name,
but we've validated and properly escaped the identifier.

## packages/cli/src/utils/binary-installer.ts — ASSET_NAMES

Mirrors detect_platform() in install.sh and the build:\* scripts in package.json.

## packages/cli/src/utils/binary-installer.ts — installDownloadedBinary()

Moving the current executable aside before moving the new one in is what makes
this work on Windows, where a running .exe cannot be overwritten in place.

## packages/cli/src/utils/binary-installer.ts — installDownloadedBinary(), backup removal

Windows lets us rename a running image but not delete one, so the backup can
outlive a successful update. The new binary is already in place either way.

## packages/cli/src/utils/binary-installer.ts — replaceBinary(), staging directory

Staging inside the target directory keeps the final move on one filesystem, so
rename() is atomic. Falling back to a temp dir gives that up, but an unwritable
target needs a privileged move anyway.

## packages/cli/src/utils/dump-restore.ts — executeCommandWithProgress(), "error" handler

An unhandled "error" event is rethrown as an uncaught exception, and
the "close" that follows a spawn failure carries no stderr — so the
ENOENT only reaches the caller through this handler.

## packages/cli/src/utils/dump-restore.ts — restoreDatabase(), client resolution order

Resolved before the drop/create step so a version mismatch aborts while
the target database is still intact.

## packages/cli/src/utils/dump-restore.ts — restoreDatabase(), "unsupported version" hint

The custom-format archive version is bumped by major releases, and
pg_restore refuses archives newer than itself — so a dump taken
with a newer pg_dump is unreadable by the version-matched client.

## packages/cli/src/utils/dump-restore.ts — verifyDumpFile(), client choice

Verifying with the same client the restore will use, since a client
older than the archive rejects it outright.

## packages/cli/src/utils/version-check.ts — REQUEST_TIMEOUT_MS scope

A registry that accepts the connection but never answers would otherwise hang the
update check forever. Only these small metadata reads are bounded; the release
download is not, because a slow link legitimately takes minutes for a 59 MB binary.

## packages/cli/src/utils/version-check.ts — fetchLatestVersion(), per-channel registries

Each channel asks its own registry: release.yml tags the GitHub release before
npm publish runs, so the two genuinely disagree during a release window.

## packages/cli/src/utils/install-method.ts and package-info.ts — Bun compiled-binary detection

process.argv[0] is "bun" inside a compiled binary rather than the executable path,
so this virtual-filesystem marker (/$bunfs/root/) is the only reliable signal that
we are one. `bun build --compile` serves the bundle from a virtual filesystem at
/$bunfs/root, where no package.json exists to read back.

## packages/cli/src/utils/process-runner.ts — executeCommandInteractive(), stdio "inherit"

Inherits stdio so `sudo` can reach the terminal for its password prompt; the piped
variant above would leave the user staring at a hung process.

## packages/cli/src/utils/pg-client.ts — TOOL_VERSION_PATTERN

`pg_restore --version` prints "pg_restore (PostgreSQL) 17.10"; pre-release
builds print "18beta1", so read digits after the parenthesised product name.

## packages/cli/src/utils/pg-client.ts — resolvePgClient(), precondition

Requires an active connection (see `connectToDatabase`) to read the server version.

## packages/cli/src/utils/database.ts — connectToDatabase(), failure cleanup

A driver that fails partway through connect() is never stored, so
closeConnection() cannot reach the pool it already opened.

## packages/cli/src/utils/database.ts — closeConnection(), warn instead of throw

Every caller closes from a finally, where a throw would replace the
command's real outcome with a cleanup failure.

## packages/cli/src/commands/db/delete.ts — executeDbDeleteCommand(), admin driver cleanup

See connectToDatabase: a driver that fails partway through
connect() still holds the pool it opened.

## packages/cli/src/utils/command-runner.ts, commands/dump.ts, commands/restore.ts — exit code over exit()

process.exit() would skip the finally below and strand the pool.

## packages/cli/tests/dump-restore.test.ts — stubSpawn()

Only the three members the command runners touch are stubbed; the
real ChildProcess surface is far too large to construct here.

## packages/cli/tests/dump-restore.test.ts — stubSpawnFailure()

Node 24 emits "error" then "close" with code -2 and no stderr for a failed
spawn, so a runner that reads only "close" reports an empty reason. Emission
is sequenced here rather than at registration, because the runner subscribes
to "close" first and the order is what decides which reason the caller gets.

## packages/cli/tests/connection-cleanup.test.ts — mock factory seam

The factory is the seam because these tests are about which commands close
what, not about pg itself; faking it keeps the pg client out of the graph so
nothing here can open a socket. PostgresDriver has its own suite.

## packages/cli/tests/connection-cleanup.test.ts — beforeAll, vi.resetModules()

tests/setup.ts imports src/utils/database eagerly, which evaluates the
real driver factory before any test file registers its mocks. Without
this reset the commands keep that cached factory and open real sockets.

## packages/cli/tests/connection-cleanup.test.ts — expectEverythingClosed(), driverCount guard

`driverCount` guards the assertion itself: when the factory mock stops
applying, no fake driver is built and `openDrivers()` passes vacuously while
the real driver opens sockets.

## packages/cli/tests/connection-cleanup.test.ts — beforeEach, process.exitCode reset

The commands under test set process.exitCode on failure, which would
otherwise leak out and fail the vitest run itself.

## packages/cli/tests/connection-cleanup.test.ts — connectToDatabase failure case

The pool is live once connect() opens it; only the
validation query that follows fails.

connectToDatabase never stores a driver that threw, so closing it
there is the only chance to end the pool it already opened.

## packages/cli/tests/postgres-driver.test.ts — beforeAll, vi.resetModules()

See connection-cleanup.test.ts: tests/setup.ts pre-loads this graph.

## apps/video/src/design/colors.ts — palette source

Matched from apps/landing dark mode: oklch with hue 250 (cool blue undertone).
Per-color oklch source values were recorded on each line (e.g. background
oklh(0.12 0.005 250), primary oklch(0.72 0.19 145)); the hex values in code
are derived from them.
