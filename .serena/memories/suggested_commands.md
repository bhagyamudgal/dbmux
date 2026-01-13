# Development Commands

## Package Management

```bash
bun install          # Install all dependencies
```

## Development

```bash
bun run dev          # Run entire monorepo in dev mode (turbo)
bun run dev:cli      # Run CLI directly (packages/cli)
bun run dev:cli:watch # Run CLI in watch mode
bun run dev:landing  # Run landing page dev server
```

## Building

```bash
bun run build        # Build all packages (turbo)
bun run build:cli    # Build CLI only
bun run clean        # Clean all build outputs
```

## Testing

```bash
bun run test         # Run all tests (turbo)
bun run test:cli     # Run CLI tests only
# In packages/cli:
bun run test:watch   # Watch mode
bun run coverage     # With coverage
```

## Code Quality

```bash
bun run typecheck    # Type check all packages
bun run lint         # ESLint all packages
bun run format       # Format with Prettier
bun run format:check # Check formatting
```

## Binary Builds

```bash
bun run build:binaries # Build all platform binaries
# In packages/cli:
bun run build:binary   # Build for current platform
bun run build:linux    # Linux x64
bun run build:macos-arm # macOS ARM64
bun run build:macos-intel # macOS x64
bun run build:windows  # Windows x64
```

## Git/Release

```bash
bun run release      # Run release script
```

## System Utilities (macOS/Darwin)

```bash
ls -la               # List files
grep -r "pattern" .  # Search in files
find . -name "*.ts"  # Find files
git status           # Git status
git diff             # Show changes
```
