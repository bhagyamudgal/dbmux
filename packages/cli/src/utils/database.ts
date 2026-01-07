import type {
    ConnectionConfig,
    DatabaseInfo,
    QueryResult,
    TableDetail,
} from "@dbmux/types/database";
import type { DatabaseDriver } from "../db-drivers/database-driver.js";
import { createDriver } from "../db-drivers/driver-factory.js";
import { logger } from "./logger.js";

let currentDriver: DatabaseDriver | null = null;
let currentConfig: ConnectionConfig | null = null;

export async function connectToDatabase(config: ConnectionConfig) {
    if (currentDriver) {
        await currentDriver.disconnect();
    }
    const driver = createDriver(config.type);
    await driver.connect(config);
    currentDriver = driver;
    currentConfig = config;
    logger.success(
        `Connected to ${config.type} database: ${config.database || config.filePath}`
    );
}

export async function closeConnection() {
    if (currentDriver) {
        await currentDriver.disconnect();
        currentDriver = null;
        currentConfig = null;
        logger.info("Database connection closed.");
    }
}

export async function testConnection(config: ConnectionConfig) {
    const driver = createDriver(config.type);
    return driver.testConnection(config);
}

export function getCurrentConnection() {
    return currentConfig;
}

function getDriver(): DatabaseDriver {
    if (!currentDriver) {
        throw new Error("No database connection. Use 'dbmux connect' first.");
    }
    return currentDriver;
}

export async function executeQuery(sql: string): Promise<QueryResult> {
    return getDriver().executeQuery(sql);
}

export async function getDatabases(): Promise<DatabaseInfo[]> {
    return getDriver().getDatabases();
}

export async function getTables(schema?: string): Promise<string[]> {
    return getDriver().getTables(schema);
}

export async function getTableInfo(
    tableName: string,
    schema?: string
): Promise<TableDetail> {
    return getDriver().getTableInfo(tableName, schema);
}
