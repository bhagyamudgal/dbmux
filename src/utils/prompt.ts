import { confirm, input, password, select } from "@inquirer/prompts";
import { getDriverDefaults } from "../db-drivers/driver-factory.js";
import type { ConnectionConfig, DatabaseType } from "../types/database.js";

type ParsedDatabaseUrl = {
    type: DatabaseType;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    ssl?: boolean;
    filePath?: string;
};

function parseDatabaseUrl(url: string): ParsedDatabaseUrl {
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

        const result: ParsedDatabaseUrl = { type };

        if (parsed.hostname) {
            result.host = parsed.hostname;
        } else {
            result.host = "localhost";
        }

        if (parsed.port) {
            result.port = parseInt(parsed.port);
        }

        if (parsed.username) {
            result.user = parsed.username;
        }

        if (parsed.password) {
            result.password = parsed.password;
        }

        if (parsed.pathname.slice(1)) {
            result.database = parsed.pathname.slice(1);
        }

        result.ssl = ssl;

        return result;
    } catch (error) {
        throw new Error(
            `Invalid database URL: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

export async function promptForConnectionDetails(): Promise<ConnectionConfig> {
    const connectionMethod = await select({
        message: "How would you like to provide connection details?",
        choices: [
            {
                name: "Database URL (e.g., postgresql://user:password@host:port/database)",
                value: "url",
            },
            {
                name: "Individual fields (host, port, user, etc.)",
                value: "fields",
            },
        ],
    });

    if (connectionMethod === "url") {
        return await promptForUrlConnection();
    } else {
        return await promptForFieldConnection();
    }
}

async function promptForUrlConnection(): Promise<ConnectionConfig> {
    const url = await input({
        message: "Enter database URL:",
        validate: (value) => {
            if (value.length === 0) {
                return "URL cannot be empty.";
            }
            try {
                parseDatabaseUrl(value);
                return true;
            } catch (error) {
                return error instanceof Error
                    ? error.message
                    : "Invalid URL format.";
            }
        },
    });

    const parsed = parseDatabaseUrl(url);
    const defaults =
        parsed.type !== "sqlite" ? getDriverDefaults(parsed.type) : null;

    const config: ConnectionConfig = {
        type: parsed.type,
        ...(parsed.host && { host: parsed.host }),
        ...(parsed.port && { port: parsed.port }),
        ...(parsed.user && { user: parsed.user }),
        ...(parsed.password && { password: parsed.password }),
        ...(parsed.database && { database: parsed.database }),
        ...(parsed.filePath && { filePath: parsed.filePath }),
        ssl: parsed.ssl !== undefined ? parsed.ssl : defaults?.ssl || false,
    };

    if (!config.host && defaults?.host) {
        config.host = defaults.host;
    }
    if (!config.port && defaults?.port) {
        config.port = defaults.port;
    }

    return config;
}

async function promptForFieldConnection(): Promise<ConnectionConfig> {
    const type = (await select({
        message: "Select database type:",
        choices: [
            {
                name: "PostgreSQL",
                value: "postgresql",
            },
            {
                name: "SQLite",
                value: "sqlite",
            },
        ],
    })) as DatabaseType;

    const config: Partial<ConnectionConfig> = {
        type,
    };

    if (type === "sqlite") {
        config.filePath = await input({
            message: "Enter the path to the SQLite database file:",
            validate: (value) =>
                value.length > 0 || "File path cannot be empty.",
        });
    } else {
        const defaults = getDriverDefaults(type);
        config.host = await input({
            message: "Host:",
            default: defaults.host || "localhost",
        });
        config.port = Number(
            await input({
                message: "Port:",
                default: String(defaults.port),
            })
        );
        config.user = await input({
            message: "User:",
            validate: (value) => value.length > 0 || "User cannot be empty.",
        });
        config.password = await password({
            message: "Password (leave blank for none):",
        });

        const dbInputOptions: {
            message: string;
            validate: (value: string) => boolean | string;
            default?: string;
        } = {
            message: "Database:",
            validate: (value) =>
                value.length > 0 || "Database cannot be empty.",
        };

        if (type === "postgresql") {
            dbInputOptions.default = "postgres";
        }

        config.database = await input(dbInputOptions);

        config.ssl = await confirm({
            message: "Use SSL?",
            default: defaults.ssl || false,
        });
    }

    return config as ConnectionConfig;
}
