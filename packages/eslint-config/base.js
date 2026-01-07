import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            indent: ["error", 4],
            quotes: ["error", "double"],
            semi: ["error", "always"],
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
            "space-before-function-paren": ["error", "always"],
            "keyword-spacing": ["error", { before: true, after: true }],
            "arrow-spacing": ["error", { before: true, after: true }],
            "object-curly-spacing": ["error", "always"],
            "comma-spacing": ["error", { before: false, after: true }],
            "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
            "eol-last": ["error", "always"],
            camelcase: "error",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "no-empty-function": "off",
            "@typescript-eslint/no-empty-function": "off",
        },
    },
    {
        ignores: ["dist/", "node_modules/", ".next/", "coverage/"],
    },
];
