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
import { getDriverDefaults } from "../db-drivers/driver-factory.js";

function parseDatabaseUrl(url: string): Partial<ConnectionConfig> {
    try {
        const parsed = new URL(url);

        let type: DatabaseType;
        switch (parsed.protocol.slice(0, -1)) {
            case "postgresql":
            case "postgres":
                type = "postgresql";
                break;
            case "sqlite":
                type = "sqlite";
                break;
            default:
                throw new Error(
                    `Unsupported database type: ${parsed.protocol.slice(0, -1)}`
                );
        }

        if (type === "sqlite") {
            return {
                type,
                filePath: parsed.pathname,
            };
        }

        const ssl =
            parsed.searchParams.get("ssl") === "true" ||
            parsed.searchParams.get("sslmode") === "require";

        const config: Partial<ConnectionConfig> = {
            type,
        };

        if (parsed.hostname) config.host = parsed.hostname;
        if (parsed.port) config.port = parseInt(parsed.port);
        if (parsed.username) config.user = parsed.username;
        if (parsed.password) config.password = parsed.password;
        if (parsed.pathname.slice(1))
            config.database = parsed.pathname.slice(1);
        config.ssl = ssl;

        return config;
    } catch (error) {
        throw new Error(
            `Invalid database URL: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

function createConfigFromOptions(
    options: ConnectOptions
): ConnectionConfig | null {
    if (options.url) {
        const parsedUrl = parseDatabaseUrl(options.url);
        const defaults =
            parsedUrl.type !== "sqlite"
                ? getDriverDefaults(parsedUrl.type as DatabaseType)
                : null;

        const config: ConnectionConfig = {
            type: parsedUrl.type as DatabaseType,
            ssl:
                parsedUrl.ssl !== undefined
                    ? parsedUrl.ssl
                    : defaults?.ssl || false,
        };

        if (parsedUrl.host) {
            config.host = parsedUrl.host;
        } else if (defaults?.host) {
            config.host = defaults.host;
        }

        if (parsedUrl.port) {
            config.port = parsedUrl.port;
        } else if (defaults?.port) {
            config.port = defaults.port;
        }

        if (parsedUrl.user) {
            config.user = parsedUrl.user;
        }

        if (parsedUrl.password) {
            config.password = parsedUrl.password;
        }

        if (parsedUrl.database) {
            config.database = parsedUrl.database;
        }

        if (parsedUrl.filePath) {
            config.filePath = parsedUrl.filePath;
        }

        return config;
    }

    if (options.type || options.host || options.user || options.database) {
        const type = options.type || "postgresql";
        const defaults =
            type !== "sqlite" ? getDriverDefaults(type as DatabaseType) : null;

        const config: ConnectionConfig = {
            type: type as DatabaseType,
            ssl:
                options.ssl !== undefined
                    ? options.ssl
                    : defaults?.ssl || false,
        };

        if (options.host) {
            config.host = options.host;
        } else if (defaults?.host) {
            config.host = defaults.host;
        }

        if (options.port) {
            config.port = options.port;
        } else if (defaults?.port) {
            config.port = defaults.port;
        }

        if (options.user) {
            config.user = options.user;
        }

        if (options.password) {
            config.password = options.password;
        }

        if (options.database) {
            config.database = options.database;
        }

        if (options.file) {
            config.filePath = options.file;
        }

        return config;
    }

    return null;
}

export type ConnectOptions = {
    name?: string;
    url?: string;
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
        config = createConfigFromOptions(options);

        if (
            config &&
            (options.url || options.host || options.user || options.database)
        ) {
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
