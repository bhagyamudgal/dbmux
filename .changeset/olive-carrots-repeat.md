---
"dbmux": minor
---

Add `dbmux update` to upgrade dbmux in place.

The command detects how dbmux was installed. Standalone binaries are downloaded from
the matching GitHub release, verified against `checksums.txt`, and replaced with the
previous binary kept as a rollback until the new one reports the expected version.
Global npm, bun and pnpm installs re-run their own install command. `--check` reports
whether an update exists without installing anything.

This also fixes `--version` in standalone binaries, which reported a hardcoded `2.2.0`
regardless of the real version because the compiled binary cannot read `package.json`
off disk. The version is now embedded at build time.
