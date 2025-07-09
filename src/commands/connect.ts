import { confirm, input, select } from "@inquirer/prompts";
import type { ConnectionConfig, DatabaseType } from "../types/database.js";
import {
    addConnection,
    getConnection,
    listConnections,
} from "../utils/config.js";
import {
    closeConnection,
    connectToDatabase,
    testConnection,
} from "../utils/database.js";
import { logger } from "../utils/logger.js";
import { promptForConnectionDetails } from "../utils/prompt.js";
import { setActiveConnection } from "../utils/session.js";

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
    test?: boolean;
};

export async function executeConnectCommand(options: ConnectOptions) {
    logger.info("Attempting to connect to database...");

    let config: ConnectionConfig | null = null;

    if (options.name) {
        try {
            config = getConnection(options.name);
            logger.info(`Connecting to saved connection: ${options.name}`);
            setActiveConnection(options.name);
        } catch (error) {
            if (error instanceof Error) {
                logger.warn(
                    `Connection '${options.name}' not found.  Proceeding to create a new one.`
                );
            }
        }
    }

    if (!config) {
        const savedConnections = listConnections();
        const savedConnectionNames = Object.keys(savedConnections);

        if (savedConnectionNames.length > 0) {
            const choice = await select({
                message: "Choose a connection",
                choices: [
                    ...savedConnectionNames.map((name) => ({
                        name,
                        value: name,
                    })),
                    {
                        name: "Connect to a new, unsaved connection",
                        value: "new",
                    },
                ],
            });

            if (choice !== "new") {
                config = getConnection(choice);
                setActiveConnection(choice);
            }
        }
    }

    if (!config) {
        logger.info(
            "Required connection details not provided, starting interactive mode..."
        );
        config = await promptForConnectionDetails();

        const shouldSave = await confirm({
            message: "Do you want to save this new connection?",
            default: true,
        });

        if (shouldSave) {
            const defaultName =
                config.type === "sqlite"
                    ? `sqlite-${config.filePath?.split("/").pop()?.split(".")[0]}`
                    : `${config.user}@${config.host}/${config.database}`;

            const connectionName = await input({
                message:
                    "Enter a name for this connection (or press Enter for default):",
                default: defaultName,
            });

            const finalName = connectionName || defaultName;
            addConnection(finalName, config as ConnectionConfig);
            setActiveConnection(finalName);
            logger.success(
                `Connection '${finalName}' added and saved successfully.`
            );
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
            logger.info("Test mode - connection not established.");
            return;
        }

        await connectToDatabase(config);
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
