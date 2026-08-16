# Changesets

This folder holds the pending release notes for `dbmux`. Every change that a
user would notice gets a changeset; the version number is then derived from
them rather than chosen by hand.

## Adding one

```bash
bun changeset
```

Pick the bump type and write a one-line summary. That writes a markdown file
here — commit it with the rest of your PR.

- **patch** — bug fix, no behaviour change for correct usage
- **minor** — new command, flag, or capability
- **major** — an existing command, flag, or output changes shape

A PR with no user-visible change (tests, CI, docs, refactors) needs no
changeset.

## What happens next

Merging to `main` makes a bot open a "chore: version packages" PR that collects
every pending changeset into a version bump and a `packages/cli/CHANGELOG.md`
entry. Merging **that** PR publishes to npm and cuts the GitHub release with
binaries.

See `.github/workflows/release.yml`.
