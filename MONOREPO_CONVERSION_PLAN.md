# DBMux Turborepo Monorepo Conversion Plan

## Status: COMPLETED

All phases have been successfully completed.

## Overview

Convert the standalone dbmux CLI project into a Turborepo monorepo with Bun package manager, adding a Next.js website for landing page + documentation.

## Final Structure (Implemented)

```
dbmux/
├── apps/
│   └── web/                          # Next.js website (landing + docs)
├── packages/
│   ├── cli/                          # Main CLI (publishes as 'dbmux' on npm)
│   ├── types/                        # @dbmux/types - shared type definitions
│   ├── utils/                        # @dbmux/utils - shared utilities
│   ├── typescript-config/            # @dbmux/typescript-config
│   └── eslint-config/                # @dbmux/eslint-config
├── turbo.json
├── package.json                      # Root with workspaces (name: "dbmux", private: true)
├── bun.lock
├── .prettierrc
└── .github/workflows/
```

**Note:** CLI package folder was renamed from `dbmux-cli` to `cli` (common pattern used by Next.js, Turborepo, etc.) while still publishing to npm as `dbmux`.

---

## Phase 1: Create Root Monorepo Configuration - COMPLETED

### 1.1 Create directory structure - DONE

```bash
mkdir -p apps/web packages/{cli,types,utils,typescript-config,eslint-config}
```

### 1.2 Create root package.json - DONE

**File: `/package.json`**

```json
{
    "name": "dbmux",
    "private": true,
    "workspaces": ["apps/*", "packages/*"],
    "scripts": {
        "build": "turbo build",
        "build:cli": "turbo build --filter=dbmux",
        "build:web": "turbo build --filter=@dbmux/web",
        "dev": "turbo dev",
        "dev:cli": "turbo dev --filter=dbmux",
        "dev:web": "turbo dev --filter=@dbmux/web",
        "test": "turbo test",
        "test:cli": "turbo test --filter=dbmux",
        "lint": "turbo lint",
        "format": "prettier --write .",
        "format:check": "prettier --check .",
        "typecheck": "turbo typecheck",
        "clean": "turbo clean",
        "build:binaries": "turbo build:binaries --filter=dbmux",
        "release": "./release.sh",
        "prepare": "husky"
    },
    "devDependencies": {
        "turbo": "^2.3.0",
        "prettier": "^3.6.2",
        "husky": "^9.1.7",
        "lint-staged": "^16.1.2"
    },
    "engines": {
        "node": ">=22.0.0"
    },
    "packageManager": "bun@1.1.0",
    "lint-staged": {
        "**/*": "prettier --write --ignore-unknown"
    }
}
```

### 1.3 Create turbo.json - DONE

**File: `/turbo.json`** - Created with build/test/lint/typecheck tasks

---

## Phase 2: Create Config Packages - COMPLETED

### 2.1 packages/typescript-config - DONE

- Created `package.json` with exports for all config files
- Created `base.json`, `bun-cli.json`, `nextjs.json`, `library.json`

### 2.2 packages/eslint-config - DONE

- Created `package.json` with exports
- Created `base.js` (ESM flat config)
- Created `next.js` for Next.js projects

---

## Phase 3: Create Shared Packages - COMPLETED

### 3.1 packages/types (@dbmux/types) - DONE

- Created `package.json` with exports
- Created `src/database.ts` with all database types
- Created `src/index.ts` re-exporting all types

### 3.2 packages/utils (@dbmux/utils) - DONE

- Created `package.json` with exports
- Created `src/constants.ts` with CONFIG_DIR, DUMPS_DIR
- Created `src/general.ts` with extractMessageFromError
- Created `src/index.ts` re-exporting all utilities

---

## Phase 4: Migrate CLI Package - COMPLETED

### 4.1 Move CLI files to packages/cli - DONE

- Moved `src/` -> `packages/cli/src/`
- Moved `tests/` -> `packages/cli/tests/`
- Moved `vitest.config.ts` -> `packages/cli/vitest.config.ts`

### 4.2 Create packages/cli/package.json - DONE

- Package name: "dbmux" (for npm publishing)
- Added workspace dependencies: `@dbmux/types`, `@dbmux/utils`
- Added devDependencies: `@dbmux/eslint-config`, `@dbmux/typescript-config`
- Repository directory: "packages/cli"

### 4.3 Update CLI imports - DONE

- Updated all imports from `../types/database.js` to `@dbmux/types/database`
- Updated imports from `./constants.js` to `@dbmux/utils/constants`
- Updated test files to use `@dbmux/types/database`

---

## Phase 5: Create Next.js Web App - COMPLETED

### 5.1 Create apps/web structure - DONE

- Created `package.json` with Next.js 15, React 19, Tailwind CSS 4
- Created `tsconfig.json` extending `@dbmux/typescript-config/nextjs.json`
- Created `next.config.ts`
- Created `postcss.config.mjs` for Tailwind CSS 4
- Created `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

---

## Phase 6: Update CI/CD - COMPLETED

### 6.1 Update .github/workflows/ci.yml - DONE

- Updated to use `turbo` commands
- Uses `bun install` and `bun run build/test/lint/typecheck`

### 6.2 Update .github/workflows/release.yml - DONE

- Updated binary build paths to `packages/cli/binaries/`
- Updated files section for release artifacts

### 6.3 Update release.sh - DONE

- Updated all paths from `packages/dbmux-cli` to `packages/cli`
- Updated version bump path
- Updated git add path
- Updated npm publish path

---

## Phase 7: Cleanup - COMPLETED

### 7.1 Remove old files from root - DONE

- Deleted old `src/`, `tests/`, `dist/`, `binaries/` directories
- Deleted old `tsconfig.json`, `tsconfig.build.json`
- Deleted old `.eslintrc.json`, `eslint.config.js`
- Deleted old `vitest.config.ts`
- Kept `.prettierrc`, `.gitignore`, `.husky/`

### 7.2 Update .gitignore - DONE

Added monorepo-specific ignores:

```
.turbo/
apps/*/dist/
packages/*/dist/
packages/cli/binaries/
```

---

## Verification - COMPLETED

All verification steps passed:

1. `bun install` - Installs all workspace dependencies
2. `bun run build` - Builds all packages (CLI + Web)
3. `bun run test` - Runs 106 CLI tests (all passing)
4. `bun run typecheck` - Typechecks all packages
5. `bun run lint` - Lints all packages
6. `cd packages/cli && bun run dev -- --help` - CLI works correctly

---

## Changes from Original Plan

1. **Folder rename**: `packages/dbmux-cli` -> `packages/cli` (npm package still named `dbmux`)
2. **Root name**: Changed from `dbmux-monorepo` to `dbmux` (private: true)
3. **build:binaries script**: Changed from `bun --filter` to `turbo build:binaries --filter=dbmux`
4. **typescript-config exports**: Added explicit exports in package.json for proper resolution

---

## Summary

The monorepo conversion is complete. The project now uses:

- **Turborepo** for monorepo orchestration
- **Bun** as the package manager with workspaces
- **Shared packages** for types, utilities, and configurations
- **Next.js 15** web app ready for landing page and documentation
- **Updated CI/CD** for monorepo structure

All 106 tests pass and both CLI and web builds succeed.
