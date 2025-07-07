import { getDriverDefaults } from "../db-drivers/driver-factory.js";
import type { ConnectionConfig, DatabaseType } from "../types/database.js";
import { addConnection } from "../utils/config.js";
import {
    closeConnection,
    connectToDatabase,
    testConnection,
} from "../utils/database.js";
import { logger } from "../utils/logger.js";

export type ConnectOptions = {
    name?: string;
    type?: string;
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

export async function executeConnectCommand(options: ConnectOptions) {
    logger.info("Attempting to connect to database...");

    const type = (options.type || "postgresql") as DatabaseType;

    const config: ConnectionConfig = { type };

    if (type === "sqlite") {
        if (!options.file) {
            logger.fail(
                "File path is required for SQLite connections (--file)"
            );
            return;
        }
        config.filePath = options.file;
    } else {
        const defaults = getDriverDefaults(type);

        if (!options.user || !options.database) {
            logger.fail(
                "User and database are required for this connection type"
            );
            return;
        }

        const host = options.host || defaults.host;
        if (host) {
            config.host = host;
        }

        const port = options.port || defaults.port;
        if (port) {
            config.port = port;
        }

        config.user = options.user;
        if (options.password) {
            config.password = options.password;
        }
        config.database = options.database;
        const ssl = options.ssl ?? defaults.ssl;
        if (ssl !== undefined) {
            config.ssl = ssl;
        }
    }

    if (type !== "sqlite" && !options.user) {
        logger.fail("Database user is required (-u, --user)");
        return;
    }

    try {
        logger.info(
            `Testing connection to ${config.type} at ${config.host}:${config.port}`
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
                `${config.user}@${config.host}:${config.port}/${config.database}`;
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
        if (options.test) {
            await closeConnection();
        }
    }
}
