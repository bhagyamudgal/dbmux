import {
    getConfigPath,
    listConnections,
    loadConfig,
    removeConnection,
    setDefaultConnection,
} from "../utils/config.js";
import { logger } from "../utils/logger.js";

export type ConfigOptions = {
    action: "list" | "remove" | "default" | "show";
    name?: string;
};

export async function executeConfigCommand(
    options: ConfigOptions
): Promise<void> {
    try {
        switch (options.action) {
            case "list":
                await listConnectionsCommand();
                break;

            case "remove":
                if (!options.name) {
                    logger.fail(
                        "Connection name is required for remove action"
                    );
                    process.exit(1);
                }
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

async function listConnectionsCommand(): Promise<void> {
    const connections = listConnections();
    const config = loadConfig();

    if (Object.keys(connections).length === 0) {
        logger.info("No saved connections found");
        logger.info("Use 'dbman connect' to create a connection");
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

async function removeConnectionCommand(name: string): Promise<void> {
    try {
        removeConnection(name);
        logger.success(`Connection '${name}' removed successfully`);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(errorMessage);
        process.exit(1);
    }
}

async function setDefaultConnectionCommand(name: string): Promise<void> {
    try {
        setDefaultConnection(name);
        logger.success(`Default connection set to '${name}'`);
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
