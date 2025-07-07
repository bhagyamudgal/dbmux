import type { ConnectionConfig, DatabaseType } from "../types/database.js";
import type { DatabaseDriver } from "./database-driver.js";
import { PostgresDriver } from "./postgres-driver.js";

export function createDriver(type: DatabaseType): DatabaseDriver {
    switch (type) {
        case "postgresql":
            return new PostgresDriver();
        case "mysql":
            throw new Error("MySQL driver not yet implemented.");
        case "sqlite":
            throw new Error("SQLite driver not yet implemented.");
        default:
            throw new Error(`Unsupported database type: ${type}`);
    }
}

export function getDriverDefaults(
    type: DatabaseType
): Partial<ConnectionConfig> {
    switch (type) {
        case "postgresql":
            return {
                host: "localhost",
                port: 5432,
                ssl: false,
            };
        case "mysql":
            return {
                host: "localhost",
                port: 3306,
                ssl: false,
            };
        case "sqlite":
            return {};
        default:
            return {};
    }
}
