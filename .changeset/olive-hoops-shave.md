---
"dbmux": patch
---

Fix `restore run` dying with an uncaught `ENOENT` when `pg_restore` or `psql` cannot be spawned. The runner never listened for the child process `error` event, and an unhandled `error` is rethrown as an uncaught exception, so the CLI died before the failure could be reported or recorded in history. The spawn failure now travels the normal error path and names the binary it could not run.
