import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type {
    ConnectionConfig,
    DBmuxConfig,
    DumpHistoryEntry,
    OperationType,
} from "@dbmux/types/database";
import { CONFIG_DIR } from "@dbmux/utils/constants";
import { logger } from "./logger.js";
import { getActiveConnection } from "./session.js";

const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: DBmuxConfig = {
    connections: {},
    settings: {
        logLevel: "info",
        autoConnect: false,
        queryTimeout: 30000,
    },
    dumpHistory: [],
};

function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export function loadConfig(): DBmuxConfig {
    ensureConfigDir();

    if (!existsSync(CONFIG_FILE)) {
        return DEFAULT_CONFIG;
    }

    try {
        const configContent = readFileSync(CONFIG_FILE, "utf-8");
        const config = JSON.parse(configContent) as DBmuxConfig;

        // Merge with defaults to ensure all fields exist
        return {
            ...DEFAULT_CONFIG,
            ...config,
            settings: {
                ...DEFAULT_CONFIG.settings,
                ...config.settings,
            },
            dumpHistory: config.dumpHistory || [],
        };
    } catch (error) {
        logger.warn(
            `Warning: Could not parse config file. Using defaults. Error: ${error}`
        );
        return DEFAULT_CONFIG;
    }
}

export function saveConfig(config: DBmuxConfig): void {
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

export function updateConnectionLastUsed(name: string): void {
    const config = loadConfig();

    if (!config.connections[name]) {
        return;
    }

    config.connections[name]!.lastConnectedAt = new Date().toISOString();
    saveConfig(config);
}

export function getConnectionsSortedByLastUsed(): Array<{
    name: string;
    config: ConnectionConfig;
}> {
    const config = loadConfig();
    const connections = Object.entries(config.connections).map(
        ([name, connConfig]) => ({
            name,
            config: connConfig,
        })
    );

    return connections.sort((a, b) => {
        const aTime = a.config.lastConnectedAt
            ? new Date(a.config.lastConnectedAt).getTime()
            : 0;
        const bTime = b.config.lastConnectedAt
            ? new Date(b.config.lastConnectedAt).getTime()
            : 0;
        return bTime - aTime;
    });
}

export function updateSettings(
    settings: Partial<DBmuxConfig["settings"]>
): void {
    const config = loadConfig();
    config.settings = { ...config.settings, ...settings };
    saveConfig(config);
}

export function getConfigPath(): string {
    return CONFIG_FILE;
}

function generateHistoryId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function addDumpHistory(
    entry: Omit<DumpHistoryEntry, "id">
): DumpHistoryEntry {
    const config = loadConfig();
    const newEntry: DumpHistoryEntry = {
        ...entry,
        id: generateHistoryId(),
    };
    config.dumpHistory.unshift(newEntry);
    saveConfig(config);
    return newEntry;
}

export function getDumpHistory(options?: {
    limit?: number;
    operationType?: OperationType;
}): DumpHistoryEntry[] {
    const config = loadConfig();
    let history = config.dumpHistory;

    if (options?.operationType) {
        history = history.filter(
            (e) => e.operationType === options.operationType
        );
    }

    if (options?.limit && options.limit > 0) {
        history = history.slice(0, options.limit);
    }

    return history;
}

export function getDumpHistoryById(id: string): DumpHistoryEntry | undefined {
    const config = loadConfig();
    return config.dumpHistory.find((entry) => entry.id === id);
}

export function getDumpHistoryByFilePath(
    filePath: string
): DumpHistoryEntry | undefined {
    const config = loadConfig();
    return config.dumpHistory.find((entry) => entry.filePath === filePath);
}

export function clearDumpHistory(operationType?: OperationType): number {
    const config = loadConfig();
    const originalCount = config.dumpHistory.length;

    if (operationType) {
        config.dumpHistory = config.dumpHistory.filter(
            (e) => e.operationType !== operationType
        );
    } else {
        config.dumpHistory = [];
    }

    saveConfig(config);
    return originalCount - config.dumpHistory.length;
}

export function getSuccessfulDumps(limit?: number): DumpHistoryEntry[] {
    const allDumps = getDumpHistory({ operationType: "dump" });
    const successfulDumps = allDumps.filter(
        (e) => e.status === "success" && !e.deleted
    );

    if (limit !== undefined && limit > 0) {
        return successfulDumps.slice(0, limit);
    }

    return successfulDumps;
}

export function markDumpAsDeleted(id: string): boolean {
    const config = loadConfig();
    const entry = config.dumpHistory.find((e) => e.id === id);

    if (!entry) {
        return false;
    }

    entry.deleted = true;
    entry.deletedAt = new Date().toISOString();
    saveConfig(config);
    return true;
}

export function markDumpAsDeletedByFilePath(filePath: string): boolean {
    const config = loadConfig();
    const entry = config.dumpHistory.find((e) => e.filePath === filePath);

    if (!entry) {
        return false;
    }

    entry.deleted = true;
    entry.deletedAt = new Date().toISOString();
    saveConfig(config);
    return true;
}
