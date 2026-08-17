---
"dbmux": patch
---

Fix three PostgreSQL connection-lifecycle faults that could crash or hang the CLI.

Deleting the database dbmux is currently connected to could die with an uncaught `Unhandled 'error' event` instead of reporting success, because dropping it terminates the backends of the pools dbmux itself holds and the pool had no error listener. `dbmux connect` could hang when the connection check passed but the validation query that followed failed: the pooled client was never released, and its live socket kept Node's event loop running. A connection that failed partway through opening was never closed at all, leaving its pool behind.
