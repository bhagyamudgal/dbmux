---
"dbmux": minor
---

Use the `pg_dump`/`pg_restore` binary matching the connected server's major version.

Restoring into a PostgreSQL server older than the local client failed outright, because `pg_restore` 17 opens every restore with `SET transaction_timeout = 0` — a parameter that only exists from PostgreSQL 17 on. dbmux now reads the server version and prefers a client of the same major version from the usual install locations (Homebrew, Postgres.app, Debian, RHEL, Windows), falling back to the one on `PATH` with a warning.

A restore whose `PATH` client is newer than the server, with no matching client installed, now aborts with install instructions rather than failing partway through. The check runs before the drop-and-recreate step, so the target database is left intact.
