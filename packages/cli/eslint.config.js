import base from "@dbmux/eslint-config/base";

export default [
    {
        ignores: ["eslint.config.js"],
    },
    ...base,
    {
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
    },
];
