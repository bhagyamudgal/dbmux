// @ts-check

import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: true,
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-floating-promises": "error",
        },
    },
    {
        ignores: ["dist/", "node_modules/", "eslint.config.js"],
    },
];
