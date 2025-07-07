import { getDriverDefaults } from "../db-drivers/driver-factory.js";
import type { ConnectionConfig, DatabaseType } from "../types/database.js";
import { addConnection } from "../utils/config.js";
import {
    closeConnection,
    connectToDatabase,
    testConnection,
} from "../utils/database.js";
import { logger } from "../utils/logger.js";
import { promptForConnectionDetails } from "../utils/prompt.js";

export type ConnectOptions = {
    name?: string;
    type?: DatabaseType;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    file?: string;
    ssl?: boolean;
    save?: boolean;
    test?: boolean;
};

function isInteractive(options: ConnectOptions): boolean {
    if (options.type === "sqlite") {
        return !options.file;
    }
    return !options.user || !options.database;
}

export async function executeConnectCommand(options: ConnectOptions) {
    logger.info("Attempting to connect to database...");

    let config: ConnectionConfig;

    if (isInteractive(options)) {
        logger.info(
            "Required connection details not provided, starting interactive mode..."
        );
        config = await promptForConnectionDetails();
    } else {
        const type = options.type || "postgresql";
        if (type === "sqlite") {
            if (!options.file) {
                logger.fail(
                    "File path is required for SQLite connections (--file)"
                );
                return;
            }
            config = {
                type,
                filePath: options.file,
            };
        } else {
            const defaults = getDriverDefaults(type);
            config = {
                type,
                host: options.host ?? defaults.host ?? "localhost",
                port: options.port ?? defaults.port ?? 5432,
                ssl: options.ssl ?? defaults.ssl ?? false,
            };

            if (options.user) config.user = options.user;
            if (options.password) config.password = options.password;
            if (options.database) config.database = options.database;

            if (!config.user || !config.database) {
                logger.fail(
                    "User and database are required for this connection type"
                );
                return;
            }
        }
    }

    try {
        logger.info(
            `Testing connection to ${config.type} at ${
                config.type === "sqlite"
                    ? config.filePath
                    : `${config.host}:${config.port}`
            }`
        );
        const isConnected = await testConnection(config);

        if (!isConnected) {
            logger.fail(
                "Failed to connect. Please check credentials and settings."
            );
            return;
        }

        logger.success("Connection test successful!");

        if (options.test) {
            logger.info("Test mode - connection not saved or established.");
            return;
        }

        await connectToDatabase(config);

        if (options.save !== false) {
            const connectionName =
                options.name ||
                (config.type === "sqlite"
                    ? `sqlite-${config.filePath?.split("/").pop()?.split(".")[0]}`
                    : `${config.user}@${config.host}/${config.database}`);

            addConnection(connectionName, config);
            logger.success(`Connection saved as '${connectionName}'`);
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.fail(`Connection failed: ${error.message}`);
        } else {
            logger.fail("An unknown error occurred during connection.");
        }
    } finally {
        if (!options.test) {
            await closeConnection();
        }
    }
}
