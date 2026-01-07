import base from "@dbmux/eslint-config/base";

export default [
    ...base,
    {
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
    },
];
