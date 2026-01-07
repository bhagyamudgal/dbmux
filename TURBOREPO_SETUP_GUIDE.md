# Turborepo Monorepo Setup Guide

This document provides step-by-step instructions for creating a production-ready Turborepo monorepo with Next.js frontend and Hono.js API backend.

## Overview

**Stack:**

- Package Manager: pnpm 10+
- Node.js: 22+
- Build System: Turborepo
- Frontend: Next.js 15 with React 19, Tailwind CSS, shadcn/ui
- Backend: Hono.js with Node.js server
- Database: PostgreSQL with Drizzle ORM
- Authentication: Better Auth with magic links
- Job Queue: pg-boss
- Email: Resend with React Email

---

## Project Structure

```
project-root/
├── apps/
│   ├── web/                    # Next.js frontend
│   └── api/                    # Hono.js backend
├── packages/
│   ├── typescript-config/      # Shared TS configs
│   ├── eslint-config/          # Shared ESLint configs
│   ├── env/                    # Environment variable validation
│   ├── constants/              # Shared constants
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Utility functions
│   ├── db/                     # Drizzle ORM schemas
│   ├── validators/             # Zod validation schemas
│   ├── emails/                 # Email templates
│   ├── ui/                     # React component library
│   ├── auth/                   # Authentication setup
│   ├── services/               # Storage, queue services
│   └── routes/                 # API route handlers
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .prettierrc.json
├── docker-compose.yml
└── .gitignore
```

---

## Step 1: Initialize Root Project

### 1.1 Create package.json

```json
{
    "name": "my-project",
    "private": true,
    "packageManager": "pnpm@10.0.0",
    "engines": {
        "node": ">=22"
    },
    "scripts": {
        "build": "turbo build",
        "build:api": "turbo build --filter=@my-project/api",
        "build:web": "turbo build --filter=@my-project/web",
        "dev": "turbo dev",
        "dev:api": "turbo dev --filter=@my-project/api",
        "dev:web": "turbo dev --filter=@my-project/web",
        "start": "turbo start",
        "lint": "turbo lint",
        "format": "prettier --write .",
        "format:check": "prettier --check .",
        "check-types": "turbo check-types",
        "db:generate": "pnpm --filter @my-project/db db:generate",
        "db:migrate": "pnpm --filter @my-project/db db:migrate",
        "db:studio": "pnpm --filter @my-project/db db:studio",
        "db:push": "pnpm --filter @my-project/db db:push",
        "docker:up": "docker compose up -d",
        "docker:down": "docker compose down",
        "shadcn:add": "pnpm --filter @my-project/web dlx shadcn@latest add",
        "prepare": "husky"
    },
    "devDependencies": {
        "turbo": "^2.7.2",
        "typescript": "5.9.2",
        "prettier": "^3.7.4",
        "prettier-plugin-tailwindcss": "^0.6.14",
        "husky": "^9.1.7",
        "lint-staged": "^16.2.7"
    },
    "dependencies": {
        "@dotenvx/dotenvx": "^1.51.2"
    },
    "lint-staged": {
        "*": "prettier --write --ignore-unknown"
    }
}
```

### 1.2 Create pnpm-workspace.yaml

```yaml
packages:
    - "apps/*"
    - "packages/*"
```

### 1.3 Create turbo.json

```json
{
    "$schema": "https://turbo.build/schema.json",
    "ui": "tui",
    "globalEnv": [
        "NODE_ENV",
        "DATABASE_URL",
        "API_PORT",
        "BETTER_AUTH_SECRET",
        "NEXT_PUBLIC_API_URL",
        "RESEND_API_KEY",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
        "S3_ENDPOINT",
        "S3_BUCKET",
        "S3_REGION",
        "S3_PUBLIC_URL"
    ],
    "tasks": {
        "build": {
            "dependsOn": ["^build"],
            "inputs": ["$TURBO_DEFAULT$", ".env*"],
            "outputs": [".next/**", "!.next/cache/**", "dist/**"]
        },
        "lint": {
            "dependsOn": ["^lint"]
        },
        "check-types": {
            "dependsOn": ["^build"]
        },
        "dev": {
            "cache": false
        },
        "start": {
            "cache": false
        }
    }
}
```

### 1.4 Create .prettierrc.json

```json
{
    "printWidth": 80,
    "tabWidth": 4,
    "semi": true,
    "singleQuote": false,
    "trailingComma": "es5",
    "bracketSpacing": true,
    "arrowParens": "always",
    "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 1.5 Create docker-compose.yml

```yaml
version: "3.8"
services:
    postgres:
        image: postgres:16
        container_name: my-project-postgres
        environment:
            POSTGRES_USER: postgres
            POSTGRES_PASSWORD: postgres
            POSTGRES_DB: my_project
        ports:
            - "5432:5432"
        volumes:
            - my-project-postgres-data:/var/lib/postgresql/data
        restart: always

volumes:
    my-project-postgres-data:
```

### 1.6 Create .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.*.local

# Build outputs
.next/
out/
build/
dist/

# Turbo
.turbo/

# Vercel
.vercel/

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
*.pem

# Testing
coverage/
```

---

## Step 2: Create Configuration Packages

### 2.1 packages/typescript-config

**package.json:**

```json
{
    "name": "@my-project/typescript-config",
    "version": "0.0.0",
    "private": true,
    "license": "MIT",
    "files": ["*.json"]
}
```

**base.json:**

```json
{
    "$schema": "https://json.schemastore.org/tsconfig",
    "compilerOptions": {
        "target": "ES2022",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "lib": ["es2022", "DOM", "DOM.Iterable"],
        "declaration": true,
        "declarationMap": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "verbatimModuleSyntax": true
    }
}
```

**nextjs.json:**

```json
{
    "$schema": "https://json.schemastore.org/tsconfig",
    "extends": "./base.json",
    "compilerOptions": {
        "jsx": "preserve",
        "allowJs": true,
        "plugins": [{ "name": "next" }]
    }
}
```

**react-library.json:**

```json
{
    "$schema": "https://json.schemastore.org/tsconfig",
    "extends": "./base.json",
    "compilerOptions": {
        "jsx": "react-jsx"
    }
}
```

### 2.2 packages/eslint-config

**package.json:**

```json
{
    "name": "@my-project/eslint-config",
    "version": "0.0.0",
    "private": true,
    "exports": {
        "./base": "./base.js",
        "./next": "./next.js",
        "./react-internal": "./react-internal.js"
    },
    "dependencies": {
        "eslint": "^9.33.0",
        "eslint-config-prettier": "^10.1.0",
        "eslint-plugin-only-warn": "^1.1.0",
        "eslint-plugin-turbo": "^2.7.2",
        "typescript-eslint": "^8.0.0"
    }
}
```

**base.js:**

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import onlyWarn from "eslint-plugin-only-warn";

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        plugins: {
            turbo: turboPlugin,
            onlyWarn,
        },
        rules: {
            "turbo/no-undeclared-env-vars": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
        },
    }
);
```

**next.js:**

```javascript
import baseConfig from "./base.js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

export default [
    ...baseConfig,
    {
        plugins: {
            react: reactPlugin,
            "react-hooks": hooksPlugin,
            "@next/next": nextPlugin,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            "react/react-in-jsx-scope": "off",
        },
    },
];
```

---

## Step 3: Create Core Packages

### 3.1 packages/env

**package.json:**

```json
{
    "name": "@my-project/env",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./api": "./src/api.ts",
        "./db": "./src/db.ts"
    },
    "dependencies": {
        "zod": "^4.0.17"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/api.ts:**

```typescript
import { z } from "zod";

const apiEnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    API_PORT: z.coerce.number().default(8000),
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    RESEND_API_KEY: z.string(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),
});

export const API_ENV = apiEnvSchema.parse(process.env);
```

**src/db.ts:**

```typescript
import { z } from "zod";

const dbEnvSchema = z.object({
    DATABASE_URL: z.string(),
});

export const DB_ENV = dbEnvSchema.parse(process.env);
```

**tsconfig.json:**

```json
{
    "extends": "@my-project/typescript-config/base.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

### 3.2 packages/constants

**package.json:**

```json
{
    "name": "@my-project/constants",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./src/index.ts",
        "./db": "./src/db.ts",
        "./api": "./src/api.ts"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/db.ts:**

```typescript
export const USER_ROLES = ["admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_TYPES = ["internal", "external"] as const;
export type UserType = (typeof USER_TYPES)[number];
```

**src/api.ts:**

```typescript
export const DEFAULT_API_PAGINATION_LIMIT = 10;
export const MAX_API_PAGINATION_LIMIT = 100;
```

**src/index.ts:**

```typescript
export * from "./db";
export * from "./api";
```

### 3.3 packages/types

**package.json:**

```json
{
    "name": "@my-project/types",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./api": "./src/api.ts",
        "./db": "./src/db.ts"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/api.ts:**

```typescript
export type ApiResponseError = {
    success: false;
    error: string;
    code?: string;
};

export type ApiResponseSuccess<T> = {
    success: true;
    result: T;
    message?: string;
};

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export type ApiPaginationParams = {
    page?: number;
    limit?: number;
    offset?: number;
};

export type ApiPaginationMetadata = {
    totalItemsCount: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    totalPages: number;
};

export type Sort = {
    by: string;
    order: "asc" | "desc";
};

export type Search = {
    by: string;
    value: string;
};

export type FilterOperator =
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "between"
    | "in"
    | "notIn"
    | "like"
    | "ilike";

export type FilterCondition = {
    field: string;
    operator: FilterOperator;
    value: unknown;
};

export type Filter = {
    logic: "and" | "or";
    conditions: FilterCondition[];
};

export type ApiParams = ApiPaginationParams & {
    search?: Search;
    sort?: Sort;
    filter?: Filter;
};
```

### 3.4 packages/utils

**package.json:**

```json
{
    "name": "@my-project/utils",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./api": "./src/api.ts",
        "./general": "./src/general.ts",
        "./date": "./src/date.ts"
    },
    "dependencies": {
        "hono": "^4.9.1",
        "date-fns": "^4.1.0",
        "zod": "^4.0.17",
        "@my-project/types": "workspace:*",
        "@my-project/constants": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/api.ts:**

```typescript
import type { Context } from "hono";
import type { z } from "zod";
import type {
    ApiResponse,
    ApiResponseError,
    ApiResponseSuccess,
    ApiPaginationParams,
} from "@my-project/types/api";
import { DEFAULT_API_PAGINATION_LIMIT } from "@my-project/constants/api";

export function getSuccessApiResponse<T>(
    result: T,
    message?: string
): ApiResponseSuccess<T> {
    return { success: true, result, message };
}

export function getErrorApiResponse(
    error: unknown,
    code?: string
): ApiResponseError {
    let errorMessage = "An unexpected error occurred";

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "string") {
        errorMessage = error;
    }

    return { success: false, error: errorMessage, code };
}

export async function validateReqBody<T extends z.ZodTypeAny>(
    c: Context,
    schema: T
): Promise<z.infer<T>> {
    const body = await c.req.json();
    return schema.parse(body);
}

export function getPaginationParams(c: Context): ApiPaginationParams {
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = Math.min(
        parseInt(
            c.req.query("limit") || String(DEFAULT_API_PAGINATION_LIMIT),
            10
        ),
        100
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}
```

**src/general.ts:**

```typescript
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "An unexpected error occurred";
}
```

**src/date.ts:**

```typescript
import { format, parseISO, isValid } from "date-fns";

export function formatDate(
    date: Date | string,
    pattern = "yyyy-MM-dd"
): string {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, pattern);
}

export function isValidDate(date: unknown): boolean {
    if (date instanceof Date) return isValid(date);
    if (typeof date === "string") return isValid(parseISO(date));
    return false;
}
```

---

## Step 4: Create Database Package

### 4.1 packages/db

**package.json:**

```json
{
    "name": "@my-project/db",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./src/index.ts",
        "./schemas": "./src/schemas/index.ts",
        "./types": "./src/types.ts"
    },
    "scripts": {
        "db:generate": "drizzle-kit generate",
        "db:migrate": "drizzle-kit migrate",
        "db:studio": "drizzle-kit studio",
        "db:push": "drizzle-kit push"
    },
    "dependencies": {
        "drizzle-orm": "^0.44.4",
        "pg": "^8.16.3",
        "@my-project/env": "workspace:*",
        "@my-project/constants": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "@types/pg": "^8.15.2",
        "drizzle-kit": "^0.31.4",
        "typescript": "catalog:"
    }
}
```

**drizzle.config.ts:**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/schemas",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
```

**src/index.ts:**

```typescript
import { DB_ENV } from "@my-project/env/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schemas";

const pool = new Pool({ connectionString: DB_ENV.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
export { schema };
```

**src/schemas/index.ts:**

```typescript
export * from "./auth";
export * from "./user";
// Add more schema exports as needed
```

**src/schemas/auth.ts:**

```typescript
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**src/types.ts:**

```typescript
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { users, sessions, accounts, verifications } from "./schemas";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;
export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;
```

---

## Step 5: Create Validators Package

### 5.1 packages/validators

**package.json:**

```json
{
    "name": "@my-project/validators",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./login": "./src/login.ts",
        "./user": "./src/user.ts"
    },
    "dependencies": {
        "zod": "^4.0.17",
        "@my-project/constants": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/login.ts:**

```typescript
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

**src/user.ts:**

```typescript
import { z } from "zod";
import { USER_ROLES, USER_TYPES } from "@my-project/constants";

export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    role: z.enum(USER_ROLES).default("member"),
    type: z.enum(USER_TYPES).default("internal"),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

---

## Step 6: Create Email Package

### 6.1 packages/emails

**package.json:**

```json
{
    "name": "@my-project/emails",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./resend": "./src/resend.ts",
        "./templates": "./src/templates/index.ts"
    },
    "scripts": {
        "dev": "email dev -p 3050"
    },
    "dependencies": {
        "resend": "^6.0.1",
        "react": "^19.1.2",
        "react-dom": "^19.1.2",
        "@react-email/components": "^0.0.32",
        "@react-email/render": "^1.2.0",
        "@my-project/env": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "@types/react": "^19.0.0",
        "react-email": "^3.0.0",
        "typescript": "catalog:"
    }
}
```

**src/resend.ts:**

```typescript
import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailOptions = {
    to: string | string[];
    subject: string;
    react?: ReactElement;
    html?: string;
    from?: string;
};

export async function sendEmail({
    to,
    subject,
    react,
    html,
    from = "noreply@yourdomain.com",
}: SendEmailOptions) {
    const htmlContent = react ? await render(react) : html;

    return resend.emails.send({
        from,
        to,
        subject,
        html: htmlContent,
    });
}
```

**src/templates/index.ts:**

```typescript
export { MagicLinkEmail } from "./magic-link";
```

**src/templates/magic-link.tsx:**

```typescript
import { Html, Head, Body, Container, Text, Link, Button } from "@react-email/components";

type MagicLinkEmailProps = {
    url: string;
};

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={{ fontFamily: "sans-serif", padding: "20px" }}>
                <Container>
                    <Text>Click the link below to sign in:</Text>
                    <Button href={url} style={{ background: "#000", color: "#fff", padding: "12px 20px" }}>
                        Sign In
                    </Button>
                    <Text style={{ color: "#666", marginTop: "20px" }}>
                        Or copy this link: {url}
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
```

---

## Step 7: Create UI Package

### 7.1 packages/ui

**package.json:**

```json
{
    "name": "@my-project/ui",
    "version": "0.0.0",
    "private": true,
    "exports": {
        "./globals.css": "./src/styles/globals.css",
        "./postcss.config": "./postcss.config.mjs",
        "./lib/*": "./src/lib/*.ts",
        "./components/*": "./src/components/*.tsx",
        "./hooks/*": "./src/hooks/*.ts"
    },
    "dependencies": {
        "react": "^19.1.2",
        "react-dom": "^19.1.2",
        "@radix-ui/react-slot": "^1.1.0",
        "class-variance-authority": "^0.7.0",
        "clsx": "^2.1.0",
        "tailwind-merge": "^3.3.1",
        "lucide-react": "^0.539.0",
        "sonner": "^2.0.7"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "@types/react": "^19.0.0",
        "tailwindcss": "^4.1.0",
        "@tailwindcss/postcss": "^4.1.0",
        "typescript": "catalog:"
    }
}
```

**postcss.config.mjs:**

```javascript
export default {
    plugins: {
        "@tailwindcss/postcss": {},
    },
};
```

**src/styles/globals.css:**

```css
@import "tailwindcss";

@theme {
    --font-sans: ui-sans-serif, system-ui, sans-serif;
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
}

@layer base {
    * {
        @apply border-border;
    }
    body {
        @apply bg-background text-foreground;
    }
}
```

**src/lib/utils.ts:**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

**src/components/button.tsx:**

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

## Step 8: Create Auth Package

### 8.1 packages/auth

**package.json:**

```json
{
    "name": "@my-project/auth",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        ".": "./src/auth.ts"
    },
    "scripts": {
        "auth:generate": "npx @better-auth/cli generate --output ./src/auth-schema.ts"
    },
    "dependencies": {
        "better-auth": "^1.3.6",
        "drizzle-orm": "^0.44.4",
        "@my-project/db": "workspace:*",
        "@my-project/emails": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/auth.ts:**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db, schema } from "@my-project/db";
import { sendEmail } from "@my-project/emails/resend";
import { MagicLinkEmail } from "@my-project/emails/templates";

export const auth = betterAuth({
    basePath: "/v1/auth",
    trustedOrigins: [
        "http://localhost:3000",
        // Add production URLs
    ],
    database: drizzleAdapter(db, {
        schema,
        provider: "pg",
        usePlural: true,
    }),
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                await sendEmail({
                    to: email,
                    subject: "Sign in to your account",
                    react: MagicLinkEmail({ url }),
                });
            },
            disableSignUp: true,
        }),
    ],
});

export type AuthUser = typeof auth.$Infer.Session.user;
export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthVariables = {
    user: AuthUser;
    session: AuthSession;
};
```

---

## Step 9: Create Services Package

### 9.1 packages/services

**package.json:**

```json
{
    "name": "@my-project/services",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./storage": "./src/storage.ts",
        "./queue": "./src/queue/index.ts"
    },
    "dependencies": {
        "@aws-sdk/client-s3": "^3.864.0",
        "@aws-sdk/s3-request-presigner": "^3.864.0",
        "pg-boss": "^10.1.0",
        "@my-project/env": "workspace:*",
        "@my-project/db": "workspace:*",
        "@my-project/emails": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/storage.ts:**

```typescript
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.S3_BUCKET!;

export class Storage {
    async getUploadUrl(key: string, contentType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: contentType,
        });
        return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    async getFileUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }

    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key,
        });
        await s3Client.send(command);
    }
}

export const storage = new Storage();
```

**src/queue/index.ts:**

```typescript
import PgBoss from "pg-boss";

let boss: PgBoss | null = null;

export async function getQueueService(): Promise<PgBoss> {
    if (!boss) {
        boss = new PgBoss(process.env.DATABASE_URL!);
        await boss.start();
    }
    return boss;
}

export async function stopQueueService(): Promise<void> {
    if (boss) {
        await boss.stop();
        boss = null;
    }
}
```

---

## Step 10: Create Routes Package

### 10.1 packages/routes

**package.json:**

```json
{
    "name": "@my-project/routes",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "exports": {
        "./v1": "./src/v1/route.ts",
        "./types": "./src/types.ts"
    },
    "dependencies": {
        "hono": "^4.9.1",
        "drizzle-orm": "^0.44.4",
        "@my-project/db": "workspace:*",
        "@my-project/auth": "workspace:*",
        "@my-project/validators": "workspace:*",
        "@my-project/services": "workspace:*",
        "@my-project/types": "workspace:*",
        "@my-project/utils": "workspace:*",
        "@my-project/constants": "workspace:*"
    },
    "devDependencies": {
        "@my-project/typescript-config": "workspace:*",
        "typescript": "catalog:"
    }
}
```

**src/types.ts:**

```typescript
import type { AuthVariables } from "@my-project/auth";

export type HonoVariables = AuthVariables;
```

**src/v1/route.ts:**

```typescript
import { Hono } from "hono";
import type { HonoVariables } from "../types";
import { auth } from "@my-project/auth";
import { userRoutes } from "./users";

const app = new Hono<{ Variables: HonoVariables }>();

// Auth routes
app.all("/auth/*", (c) => auth.handler(c.req.raw));

// API routes
app.route("/users", userRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

export const v1Routes = app;
```

**src/v1/users/index.ts:**

```typescript
import { Hono } from "hono";
import type { HonoVariables } from "../../types";
import { db, schema } from "@my-project/db";
import {
    getSuccessApiResponse,
    getErrorApiResponse,
} from "@my-project/utils/api";

const app = new Hono<{ Variables: HonoVariables }>();

app.get("/", async (c) => {
    try {
        const users = await db.select().from(schema.users);
        return c.json(getSuccessApiResponse(users));
    } catch (error) {
        return c.json(getErrorApiResponse(error), 500);
    }
});

export const userRoutes = app;
```

---

## Step 11: Create API Application

### 11.1 apps/api

**package.json:**

```json
{
    "name": "@my-project/api",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "dotenvx run -- tsx watch src/index.ts",
        "dev:worker": "dotenvx run -- tsx watch src/workers/queue-worker.ts",
        "build": "dotenvx run -- node build.mjs",
        "start": "dotenvx run --ignore=MISSING_ENV_FILE -- node dist/index.js",
        "start:worker": "dotenvx run --ignore=MISSING_ENV_FILE -- node dist/workers/queue-worker.js",
        "lint": "eslint src --max-warnings 0",
        "check-types": "tsc --noEmit"
    },
    "dependencies": {
        "hono": "^4.9.1",
        "@hono/node-server": "^1.18.2",
        "pg-boss": "^10.1.0",
        "node-cron": "^4.2.1",
        "@my-project/routes": "workspace:*",
        "@my-project/db": "workspace:*",
        "@my-project/env": "workspace:*",
        "@my-project/services": "workspace:*"
    },
    "devDependencies": {
        "@my-project/eslint-config": "workspace:*",
        "@my-project/typescript-config": "workspace:*",
        "esbuild": "^0.25.9",
        "esbuild-node-externals": "^1.0.0",
        "tsx": "^4.20.4",
        "@types/node": "^22.0.0",
        "@types/node-cron": "^4.0.0",
        "typescript": "catalog:"
    }
}
```

**tsconfig.json:**

```json
{
    "extends": "@my-project/typescript-config/base.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src",
        "types": ["node"],
        "jsx": "react-jsx",
        "jsxImportSource": "react"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

**build.mjs:**

```javascript
import * as esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

const isProduction = process.env.NODE_ENV === "production";

const commonOptions = {
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    plugins: [nodeExternalsPlugin()],
    minify: isProduction,
    sourcemap: !isProduction,
    banner: {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
};

await Promise.all([
    esbuild.build({
        ...commonOptions,
        entryPoints: ["src/index.ts"],
        outfile: "dist/index.js",
    }),
    esbuild.build({
        ...commonOptions,
        entryPoints: ["src/workers/queue-worker.ts"],
        outfile: "dist/workers/queue-worker.js",
    }),
]);

console.log("Build complete");
```

**src/index.ts:**

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { requestId } from "hono/request-id";
import { trimTrailingSlash } from "hono/trailing-slash";
import { poweredBy } from "hono/powered-by";
import { API_ENV } from "@my-project/env/api";
import { v1Routes } from "@my-project/routes/v1";
import type { HonoVariables } from "@my-project/routes/types";
import { stopQueueService } from "@my-project/services/queue";

const app = new Hono<{ Variables: HonoVariables }>();

// Middleware
app.use(poweredBy());
app.use(trimTrailingSlash());
app.use(timing());
app.use(secureHeaders());
app.use(logger());
app.use(requestId());
app.use(
    cors({
        origin: ["http://localhost:3000"],
        credentials: true,
    })
);

// Routes
app.get("/", (c) => c.redirect("/v1"));
app.route("/v1", v1Routes);

// Error handling
app.onError((err, c) => {
    console.error(err);
    return c.json({ success: false, error: "Internal server error" }, 500);
});

// Start server
const port = API_ENV.API_PORT;
console.log(`Server starting on port ${port}`);

serve({ fetch: app.fetch, port });

// Graceful shutdown
async function shutdown() {
    console.log("Shutting down...");
    await stopQueueService();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
```

**src/workers/queue-worker.ts:**

```typescript
import { getQueueService, stopQueueService } from "@my-project/services/queue";

async function startWorker() {
    console.log("Starting queue worker...");
    const boss = await getQueueService();

    // Register job handlers
    await boss.work("send-email", async (job) => {
        console.log("Processing email job:", job.data);
        // Add email sending logic
    });

    console.log("Queue worker started");
}

async function shutdown() {
    console.log("Shutting down worker...");
    await stopQueueService();
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startWorker().catch(console.error);
```

---

## Step 12: Create Web Application

### 12.1 apps/web

**package.json:**

```json
{
    "name": "@my-project/web",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "dotenvx run -- next dev --turbopack --port 3000",
        "build": "dotenvx run -- next build",
        "start": "dotenvx run -- next start",
        "lint": "next lint --max-warnings 0",
        "check-types": "tsc --noEmit"
    },
    "dependencies": {
        "next": "15.5.7",
        "react": "^19.1.2",
        "react-dom": "^19.1.2",
        "@tanstack/react-query": "^5.85.3",
        "axios": "^1.11.0",
        "better-auth": "^1.3.6",
        "@my-project/ui": "workspace:*",
        "@my-project/types": "workspace:*",
        "@my-project/utils": "workspace:*",
        "@my-project/auth": "workspace:*"
    },
    "devDependencies": {
        "@my-project/eslint-config": "workspace:*",
        "@my-project/typescript-config": "workspace:*",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "typescript": "catalog:"
    }
}
```

**tsconfig.json:**

```json
{
    "extends": "@my-project/typescript-config/nextjs.json",
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["./*"],
            "@my-project/ui/*": ["../../packages/ui/src/*"]
        },
        "incremental": true
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

**postcss.config.mjs:**

```javascript
export { default } from "@my-project/ui/postcss.config";
```

**components.json:**

```json
{
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": true,
    "tsx": true,
    "tailwind": {
        "config": "",
        "css": "../../packages/ui/src/styles/globals.css",
        "baseColor": "neutral",
        "cssVariables": true
    },
    "iconLibrary": "lucide",
    "aliases": {
        "components": "@/components",
        "hooks": "@/hooks",
        "lib": "@/lib",
        "utils": "@my-project/ui/lib/utils",
        "ui": "@my-project/ui/components"
    }
}
```

**app/layout.tsx:**

```typescript
import type { Metadata } from "next";
import "@my-project/ui/globals.css";

export const metadata: Metadata = {
    title: "My Project",
    description: "My awesome project",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
```

**app/page.tsx:**

```typescript
export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold">Welcome to My Project</h1>
        </main>
    );
}
```

---

## Step 13: Setup Git Hooks

### 13.1 Configure Husky

```bash
# Initialize husky
pnpm prepare

# Create pre-commit hook
echo 'pnpm lint-staged' > .husky/pre-commit
```

---

## Step 14: Environment Variables

### 14.1 Create .env.example files

**Root .env.example:**

```
NODE_ENV=development
```

**apps/api/.env.example:**

```
NODE_ENV=development
API_PORT=8000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/my_project
BETTER_AUTH_SECRET=your-secret-key-here
RESEND_API_KEY=re_xxx
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_ENDPOINT=
S3_BUCKET=
S3_REGION=
S3_PUBLIC_URL=
```

**apps/web/.env.example:**

```
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
pnpm docker:up

# Generate database migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Start development servers
pnpm dev

# Build for production
pnpm build

# Start production servers
pnpm start
```

---

## Dependency Installation Order

When setting up from scratch, install packages in this order:

1. Root dependencies: `pnpm install`
2. TypeScript and ESLint configs (no deps)
3. Environment package
4. Constants package
5. Types package
6. Utils package
7. Database package
8. Validators package
9. Emails package
10. UI package
11. Auth package
12. Services package
13. Routes package
14. API app
15. Web app

---

## Key Patterns

1. **Workspace exports**: Use `"exports"` in package.json for granular imports
2. **Type inference**: Use Drizzle's `InferSelectModel` for database types
3. **Zod validation**: Validate all inputs with type inference
4. **Feature-based structure**: Organize by feature, not by type
5. **Shared config packages**: Centralize TypeScript and ESLint configs
6. **Environment validation**: Validate env vars with Zod at startup
