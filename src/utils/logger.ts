import chalk from "chalk";

const LOG_PREFIX = "[dbman]";

export const logger = {
    info: (message: string) => {
        console.log(chalk.blue(`${LOG_PREFIX} ${message}`));
    },
    success: (message: string) => {
        console.log(chalk.green(`${LOG_PREFIX} ${message}`));
    },
    warn: (message: string) => {
        console.warn(chalk.yellow(`${LOG_PREFIX} ${message}`));
    },
    fail: (message: string) => {
        console.error(chalk.red(`${LOG_PREFIX} ${message}`));
    },
    error: (message: string) => {
        console.error(chalk.bold.red(`${LOG_PREFIX} ${message}`));
    },
    raw: (...args: unknown[]) => {
        console.log(...args);
    },
};
