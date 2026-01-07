#!/usr/bin/env node

import { boolean, command, number, run, string } from "@drizzle-team/brocli";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";

// Import commands
import { executeConfigCommand } from "./commands/config.js";
import { executeConnectCommand } from "./commands/connect.js";
import { executeDbCommand } from "./commands/db.js";
import { executeDisconnectCommand } from "./commands/disconnect.js";
import { executeDumpDeleteCommand } from "./commands/dump-delete.js";
import { executeDumpCommand } from "./commands/dump.js";
import { executeHistoryCommand } from "./commands/history.js";
import { executeHistoryListCommand } from "./commands/history/list.js";
import { executeListCommand } from "./commands/list.js";
import { executeQueryCommand } from "./commands/query.js";
import { executeRestoreCommand } from "./commands/restore.js";
import { executeStatusCommand } from "./commands/status.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type PackageJson = {
    name: string;
    version: string;
    description: string;
};

function getPackageInfo(): PackageJson {
    try {
        const packagePath = join(__dirname, "..", "package.json");
        const packageContent = readFileSync(packagePath, "utf-8");
        return JSON.parse(packageContent) as PackageJson;
    } catch (error) {
        // Fallback for compiled binaries where file system paths don't work
        return {
            name: "dbmux",
            version: "2.0.0",
            description:
                "A flexible database management CLI tool with persistent configuration",
        };
    }
}

// Define commands
const connectCommand = command({
    name: "connect",
    desc: "Connect to a PostgreSQL database and save configuration",
    options: {
        name: string().alias("n"),
        url: string().alias("U"),
        host: string().alias("H"),
        port: number().min(1).max(65535).alias("p"),
        user: string().alias("u"),
        password: string().alias("w"),
        database: string().alias("d"),
        ssl: boolean(),
        save: boolean().default(true),
        test: boolean().default(false),
        type: string().enum("postgresql", "sqlite"),
    },
    handler: executeConnectCommand,
});

const listCommand = command({
    name: "list",
    desc: "List databases, tables, or saved connections",
    options: {
        databases: boolean().alias("db"),
        tables: boolean().alias("t"),
        connections: boolean().alias("c"),
        connection: string().alias("n"),
        schema: string().default("public"),
        database: string().alias("d"),
    },
    handler: executeListCommand,
});

const queryCommand = command({
    name: "query",
    desc: "Execute SQL queries",
    options: {
        sql: string().alias("q"),
        file: string().alias("f"),
        connection: string().alias("n"),
        database: string().alias("d"),
        format: string().enum("table", "json", "csv").default("table"),
        limit: number().min(1).alias("l"),
    },
    handler: executeQueryCommand,
});

const dumpCommand = command({
    name: "dump",
    desc: "Database dump operations",
    subcommands: [
        command({
            name: "create",
            desc: "Create a database dump from PostgreSQL",
            options: {
                database: string().alias("d"),
                connection: string().alias("n"),
                format: string()
                    .enum("custom", "plain", "directory", "tar")
                    .default("custom")
                    .alias("f"),
                output: string().alias("o"),
                verbose: boolean(),
            },
            handler: executeDumpCommand,
        }),
        command({
            name: "delete",
            desc: "Delete dump files from ~/.dbmux/dumps/",
            options: {
                file: string().alias("f"),
                force: boolean().alias("F"),
            },
            handler: executeDumpDeleteCommand,
        }),
        command({
            name: "history",
            desc: "Show dump history",
            options: {
                limit: number().alias("l"),
                format: string().enum("table", "json").alias("f"),
            },
            handler: (options) =>
                executeHistoryListCommand({
                    limit: options.limit,
                    format: options.format as "table" | "json" | undefined,
                    type: "dump",
                }),
        }),
    ],
});

const restoreCommand = command({
    name: "restore",
    desc: "Database restore operations",
    subcommands: [
        command({
            name: "run",
            desc: "Restore a database from a dump file",
            options: {
                file: string().alias("f"),
                database: string().alias("d"),
                connection: string().alias("n"),
                create: boolean().alias("c"),
                drop: boolean(),
                verbose: boolean(),
                fromHistory: boolean().alias("H"),
            },
            handler: executeRestoreCommand,
        }),
        command({
            name: "history",
            desc: "Show restore history",
            options: {
                limit: number().alias("l"),
                format: string().enum("table", "json").alias("f"),
            },
            handler: (options) =>
                executeHistoryListCommand({
                    limit: options.limit,
                    format: options.format as "table" | "json" | undefined,
                    type: "restore",
                }),
        }),
    ],
});

const configCommand = command({
    name: "config",
    desc: "Manage configuration and saved connections",
    subcommands: [
        command({
            name: "add",
            desc: "Add a new connection interactively",
            options: {},
            handler: () => executeConfigCommand({ action: "add" }),
        }),
        command({
            name: "list",
            desc: "List all saved connections",
            options: {},
            handler: () => executeConfigCommand({ action: "list" }),
        }),
        command({
            name: "remove",
            desc: "Remove a saved connection",
            options: {
                name: string().alias("n"),
            },
            handler: (options) =>
                executeConfigCommand({ action: "remove", name: options.name }),
        }),
        command({
            name: "default",
            desc: "Set default connection",
            options: {
                name: string().required().alias("n"),
            },
            handler: (options) =>
                executeConfigCommand({ action: "default", name: options.name }),
        }),
        command({
            name: "show",
            desc: "Show configuration file location and contents",
            options: {},
            handler: () => executeConfigCommand({ action: "show" }),
        }),
        command({
            name: "path",
            desc: "Show the configuration file path",
            options: {},
            handler: () => executeConfigCommand({ action: "path" }),
        }),
        command({
            name: "rename",
            desc: "Rename a connection",
            options: {
                name: string().alias("n"),
                newName: string().alias("nn"),
            },
            handler: (options) =>
                executeConfigCommand({
                    action: "rename",
                    name: options.name,
                    newName: options.newName,
                }),
        }),
        command({
            name: "manage",
            desc: "Manage connections interactively",
            options: {},
            handler: () => executeConfigCommand({ action: "manage" }),
        }),
    ],
});

const statusCommand = command({
    name: "status",
    desc: "Show the current default connection",
    options: {},
    handler: executeStatusCommand,
});

const disconnectCommand = command({
    name: "disconnect",
    desc: "Clear the active connection session",
    options: {},
    handler: executeDisconnectCommand,
});

const historyCommand = command({
    name: "history",
    desc: "View and manage dump/restore history",
    subcommands: [
        command({
            name: "list",
            desc: "List dump/restore history",
            options: {
                limit: number().alias("l"),
                type: string().enum("dump", "restore").alias("t"),
                format: string()
                    .enum("table", "json")
                    .default("table")
                    .alias("f"),
            },
            handler: (options) =>
                executeHistoryCommand({
                    action: "list",
                    limit: options.limit,
                    type: options.type as "dump" | "restore" | undefined,
                    format: options.format as "table" | "json",
                }),
        }),
        command({
            name: "clear",
            desc: "Clear dump/restore history",
            options: {
                type: string().enum("dump", "restore").alias("t"),
            },
            handler: (options) =>
                executeHistoryCommand({
                    action: "clear",
                    type: options.type as "dump" | "restore" | undefined,
                }),
        }),
    ],
});

const dbCommand = command({
    name: "db",
    desc: "Database management commands",
    subcommands: [
        command({
            name: "delete",
            desc: "Delete (DROP) a database from the server",
            options: {
                database: string().alias("d"),
                connection: string().alias("n"),
                force: boolean().alias("F"),
            },
            handler: (options) =>
                executeDbCommand({
                    action: "delete",
                    database: options.database,
                    connection: options.connection,
                    force: options.force,
                }),
        }),
    ],
});

async function main(): Promise<void> {
    const packageInfo = getPackageInfo();
    const commands = [
        connectCommand,
        listCommand,
        queryCommand,
        dumpCommand,
        restoreCommand,
        configCommand,
        statusCommand,
        disconnectCommand,
        historyCommand,
        dbCommand,
    ];
    await run(commands, {
        name: packageInfo.name,
        description: packageInfo.description,
        version: packageInfo.version,
    });
}

function isCliInvocation(): boolean {
    if (!import.meta.url.startsWith("file://")) {
        return false;
    }
    const scriptPath = fileURLToPath(import.meta.url);
    if (!process.argv[1]) {
        return false;
    }
    const normalizedArg = process.argv[1].replace(/\\/g, "/");
    const isDirectExecution = process.argv[1] === scriptPath;
    const isGlobalShim =
        normalizedArg.endsWith("/dbmux") ||
        normalizedArg.endsWith("/dbmux.cmd");
    const isBunBundle =
        normalizedArg.includes("/$bunfs/root/") ||
        scriptPath.includes("/$bunfs/root/");
    return isDirectExecution || isGlobalShim || isBunBundle;
}

if (isCliInvocation()) {
    main().catch((error) => {
        logger.fail(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
