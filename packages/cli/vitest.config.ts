/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        setupFiles: ["tests/setup.ts"],
        environment: "node",
        testTimeout: 10000, // 10 second timeout per test
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/**/*.ts"],
            exclude: [
                "src/index.ts",
                "src/types/**/*.ts",
                "src/commands/default.ts",
            ],
        },
    },
});
