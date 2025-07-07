import { confirm, input, password, select } from "@inquirer/prompts";
import { getDriverDefaults } from "../db-drivers/driver-factory.js";
import type { ConnectionConfig, DatabaseType } from "../types/database.js";

export async function promptForConnectionDetails(): Promise<ConnectionConfig> {
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
