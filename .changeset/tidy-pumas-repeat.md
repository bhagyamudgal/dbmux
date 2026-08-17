---
"dbmux": patch
---

Fix `dump create`, `restore run` and `db delete` hanging for roughly 30 seconds after printing their final line. Each opened the shared connection pool without closing it, and pg-pool keeps the idle socket and its idle timer referenced, so Node could not exit until the pool timed out. All three now close the connection on every path, including cancellation, early exits and failure.

Commands that fail now set an exit status and return rather than terminating the process outright, so cleanup runs and buffered output is not truncated. The exit code is unchanged. A connection that cannot be closed is reported as a warning that says the command itself completed, so a finished dump or delete is no longer reported as a failure.
