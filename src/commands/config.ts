import { checkbox, confirm, input } from "@inquirer/prompts";
import type { ConnectionConfig } from "../types/database.js";
import {
    addConnection,
    getConfigPath,
    listConnections,
    loadConfig,
    removeConnection,
    setDefaultConnection,
} from "../utils/config.js";
import { testConnection } from "../utils/database.js";
import { logger } from "../utils/logger.js";
import { promptForConnectionDetails } from "../utils/prompt.js";

export type ConfigOptions = {
    action: "list" | "remove" | "default" | "show" | "add";
    name?: string;
};

export async function executeConfigCommand(
    options: ConfigOptions
): Promise<void> {
    try {
        switch (options.action) {
            case "add":
                await addConnectionCommand();
                break;

            case "list":
                await listConnectionsCommand();
                break;

            case "remove":
                await removeConnectionCommand(options.name);
                break;

            case "default":
                if (!options.name) {
                    logger.fail(
                        "Connection name is required for default action"
                    );
                    process.exit(1);
                }
                await setDefaultConnectionCommand(options.name);
                break;

            case "show":
                await showConfigCommand();
                break;

            default:
                logger.fail(`Unknown config action: ${options.action}`);
                process.exit(1);
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(`Config command failed: ${errorMessage}`);
        process.exit(1);
    }
}

async function addConnectionCommand(): Promise<void> {
    logger.info("Adding a new database connection interactively.");

    const config = await promptForConnectionDetails();

    logger.info("Testing connection...");
    const isConnected = await testConnection(config);

    if (!isConnected) {
        logger.fail(
            "Connection test failed. The connection was not saved. Please check the details and try again."
        );
        return;
    }
    logger.success("Connection test successful!");

    const defaultName =
        config.type === "sqlite"
            ? `sqlite-${config.filePath?.split("/").pop()?.split(".")[0]}`
            : `${config.user}@${config.host}/${config.database}`;

    const connectionName = await input({
        message:
            "Enter a name for this connection (or press Enter for default):",
        default: defaultName,
    });

    addConnection(connectionName || defaultName, config as ConnectionConfig);
    logger.success(
        `Connection '${
            connectionName || defaultName
        }' added and saved successfully.`
    );
}

async function listConnectionsCommand(): Promise<void> {
    const connections = listConnections();
    const config = loadConfig();

    if (Object.keys(connections).length === 0) {
        logger.info("No saved connections found");
        logger.info("Use 'dbmux connect' to create a connection");
        return;
    }

    logger.info("\nSaved connections:");
    Object.entries(connections).forEach(([name, conn]) => {
        const isDefault = config.defaultConnection === name;
        const marker = isDefault ? " (default)" : "";
        logger.raw(`\n  ${name}${marker}`);
        logger.raw(`    Type: ${conn.type}`);
        if (conn.type === "sqlite") {
            logger.raw(`    File: ${conn.filePath}`);
        } else {
            logger.raw(`    Host: ${conn.host}`);
            logger.raw(`    Port: ${conn.port}`);
            logger.raw(`    User: ${conn.user}`);
            logger.raw(`    Database: ${conn.database}`);
            logger.raw(`    SSL: ${conn.ssl ? "Enabled" : "Disabled"}`);
        }
    });
    logger.raw("");
}

async function removeConnectionCommand(name?: string): Promise<void> {
    const connections = listConnections();
    const connectionNames = Object.keys(connections);

    if (connectionNames.length === 0) {
        logger.info("No saved connections to remove.");
        return;
    }

    const connectionsToRemove: string[] = [];

    if (name) {
        if (!connectionNames.includes(name)) {
            logger.fail(`Connection '${name}' not found.`);
            return;
        }
        connectionsToRemove.push(name);
    } else {
        const selectedNames = await checkbox({
            message:
                "Select connections to remove (space to select, enter to confirm):",
            choices: connectionNames.map((n) => ({
                name: n,
                value: n,
            })),
            validate: (value) =>
                value.length > 0 || "Please select at least one connection.",
        });
        connectionsToRemove.push(...selectedNames);
    }

    if (connectionsToRemove.length === 0) {
        logger.info("No connections selected for removal.");
        return;
    }

    const shouldProceed = await confirm({
        message: `Are you sure you want to remove the following connection(s)?\n- ${connectionsToRemove.join("\n- ")}`,
        default: false,
    });

    if (!shouldProceed) {
        logger.info("Removal operation cancelled.");
        return;
    }

    for (const n of connectionsToRemove) {
        try {
            removeConnection(n);
            logger.success(`Connection '${n}' removed successfully.`);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            logger.fail(`Failed to remove connection '${n}': ${errorMessage}`);
        }
    }
}

async function setDefaultConnectionCommand(name: string): Promise<void> {
    try {
        setDefaultConnection(name);
        logger.success(`'${name}' is now the default connection.`);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(errorMessage);
        process.exit(1);
    }
}

async function showConfigCommand(): Promise<void> {
    const configPath = getConfigPath();
    const config = loadConfig();

    logger.info(`\nConfiguration file: ${configPath}`);
    logger.info("\nCurrent configuration:");
    logger.raw(JSON.stringify(config, null, 2));
    logger.raw("");

    logger.info("Settings:");
    logger.raw(`  Log level: ${config.settings.logLevel}`);
    logger.raw(`  Auto connect: ${config.settings.autoConnect}`);
    logger.raw(`  Query timeout: ${config.settings.queryTimeout}ms`);

    if (config.defaultConnection) {
        logger.raw(`  Default connection: ${config.defaultConnection}`);
    } else {
        logger.info("  Default connection: none");
    }

    logger.info(`\nConnections: ${Object.keys(config.connections).length}`);
    logger.raw("");
}
