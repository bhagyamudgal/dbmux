import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { ConnectionConfig } from "../types/database.js";
import { logger } from "../utils/logger.js";
import { CONFIG_DIR } from "./constants.js";
import { getActiveConnection } from "./session.js";

const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export type DbmuxConfig = {
    connections: Record<string, ConnectionConfig>;
    defaultConnection?: string;
    settings: {
        logLevel: "debug" | "info" | "warn" | "error";
        autoConnect: boolean;
        queryTimeout: number;
    };
};

const DEFAULT_CONFIG: DbmuxConfig = {
    connections: {},
    settings: {
        logLevel: "info",
        autoConnect: false,
        queryTimeout: 30000,
    },
};

function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export function loadConfig(): DbmuxConfig {
    ensureConfigDir();

    if (!existsSync(CONFIG_FILE)) {
        return DEFAULT_CONFIG;
    }

    try {
        const configContent = readFileSync(CONFIG_FILE, "utf-8");
        const config = JSON.parse(configContent) as DbmuxConfig;

        // Merge with defaults to ensure all fields exist
        return {
            ...DEFAULT_CONFIG,
            ...config,
            settings: {
                ...DEFAULT_CONFIG.settings,
                ...config.settings,
            },
        };
    } catch (error) {
        logger.warn(
            `Warning: Could not parse config file. Using defaults. Error: ${error}`
        );
        return DEFAULT_CONFIG;
    }
}

export function saveConfig(config: DbmuxConfig): void {
    ensureConfigDir();

    try {
        const configContent = JSON.stringify(config, null, 2);
        writeFileSync(CONFIG_FILE, configContent, "utf-8");
    } catch (error) {
        throw new Error(
            `Failed to save config: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

export function addConnection(
    name: string,
    connection: ConnectionConfig
): void {
    const config = loadConfig();
    config.connections[name] = connection;

    // Set as default if it's the first connection
    if (!config.defaultConnection) {
        config.defaultConnection = name;
    }

    saveConfig(config);
}

export function removeConnection(name: string): void {
    const config = loadConfig();

    if (!config.connections[name]) {
        logger.warn(`Connection '${name}' does not exist.`);
        return;
    }

    delete config.connections[name];

    // Update default if needed
    if (config.defaultConnection === name) {
        const remainingConnections = Object.keys(config.connections);
        if (remainingConnections.length > 0) {
            config.defaultConnection = remainingConnections[0]!;
        } else {
            delete config.defaultConnection;
        }
    }

    saveConfig(config);
}

export function renameConnection(oldName: string, newName: string): void {
    const config = loadConfig();

    if (!config.connections[oldName]) {
        throw new Error(`Connection '${oldName}' does not exist`);
    }

    if (config.connections[newName]) {
        throw new Error(`Connection '${newName}' already exists`);
    }

    config.connections[newName] = config.connections[oldName]!;
    delete config.connections[oldName];

    if (config.defaultConnection === oldName) {
        config.defaultConnection = newName;
    }

    saveConfig(config);
}

export function getConnection(name?: string): ConnectionConfig {
    const config = loadConfig();
    const activeConnectionName = getActiveConnection();

    const connectionName =
        name ?? activeConnectionName ?? config.defaultConnection;

    if (!connectionName) {
        throw new Error(
            "No connection specified, no active session, and no default connection set."
        );
    }

    const connection = config.connections[connectionName];

    if (!connection) {
        throw new Error(`Connection '${connectionName}' not found`);
    }

    return connection;
}

export function listConnections(): Record<string, ConnectionConfig> {
    const config = loadConfig();
    return config.connections;
}

export function setDefaultConnection(name: string): void {
    const config = loadConfig();

    if (!config.connections[name]) {
        throw new Error(`Connection '${name}' does not exist`);
    }

    config.defaultConnection = name;
    saveConfig(config);
}

export function updateSettings(
    settings: Partial<DbmuxConfig["settings"]>
): void {
    const config = loadConfig();
    config.settings = { ...config.settings, ...settings };
    saveConfig(config);
}

export function getConfigPath(): string {
    return CONFIG_FILE;
}
