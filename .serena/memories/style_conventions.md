# Code Style and Conventions

## TypeScript Rules

- Always use `type` instead of `interface`
- Always use `function` keyword for function declarations (arrows OK for callbacks)
- No `any` type - create proper types, use `unknown` and narrow
- No non-null assertions (`!.`) - refactor for type safety
- Strict mode always enabled
- Use `import type` for type-only imports

## Naming Conventions

- **Variables/Functions**: camelCase
- **Classes/Types**: PascalCase
- **Constants**: SNAKE_CASE
- **Files/Directories**: kebab-case
- **Boolean variables**: use `is`, `has`, `can`, `should` prefixes
- **Functions**: start with verbs

## Formatting

- 4-space indentation
- Double quotes for strings
- Use === not ==
- No unused variables
- Use const over let unless reassignment needed

## Error Handling

Use the `tryCatch` utility pattern (see lib/try-catch.ts):

```typescript
const { data, error } = await tryCatch(somePromise);
```

## Function Guidelines

- Keep functions short (< 20 instructions)
- One function = one job
- Use early returns over nested conditionals
- Prefer composition over large functions

## File Size Limits

| Type             | Max LOC |
| ---------------- | ------- |
| React Components | 150-200 |
| Custom Hooks     | 80-100  |
| API Routes       | 80-100  |
| Services         | 200-250 |
| Utilities        | 100-150 |
| Types            | 150-200 |

## Code Quality

- Follow DRY principle
- No magic numbers/strings - use named constants
- No comments unless logic is genuinely complex (explain WHY not WHAT)
- No emoji in logs or code
- Prefer async/await over .then() chains
- Prefer named exports over default exports
- No console.log in production - use proper logger

## Database Operations

- Use driver pattern (DatabaseDriver interface)
- All SQL goes through driver interface
- Never run db:push, db:migrate, db:generate without permission
