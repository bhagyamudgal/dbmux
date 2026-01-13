# Task Completion Checklist

## After Every Code Change

### 1. Type Checking

```bash
bun run typecheck
```

Or use IDE integration for smaller changes.

### 2. Linting

```bash
bun run lint
```

### 3. Formatting

```bash
bun run format
```

### 4. Testing (if applicable)

```bash
bun run test:cli
```

### 5. Code Review

Run `/code-review` command using the code-review plugin.

## Pre-Commit Checks

The project has husky + lint-staged configured. On commit:

- Prettier runs on staged files automatically

## Git Commit Convention

```
feat: add user authentication
fix: resolve payment timeout issue
refactor: extract validation logic
chore: update dependencies
docs: add API documentation
```

## Security Considerations

This is a CLI tool for personal/developer use:

- Basic input validation is acceptable
- Focus on functionality over defensive coding
- Trust user input for database names, queries, configs

## Important Notes

- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files over creating new ones
- NEVER create documentation files (\*.md) unless explicitly requested
- Do not push to remote without explicit permission
- Do not run db migrations without explicit permission
