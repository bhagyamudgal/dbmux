import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeListCommand } from "../../../src/commands/config/list";
import type { ConnectionConfig, DBmuxConfig } from "@dbmux/types/database";

const { listConnections, loadConfig } = vi.hoisted(() => {
    return {
        listConnections: vi.fn(),
        loadConfig: vi.fn(),
    };
});

const { logger } = vi.hoisted(() => {
    return {
        logger: {
            info: vi.fn(),
            raw: vi.fn(),
            error: vi.fn(),
            success: vi.fn(),
            warn: vi.fn(),
        },
    };
});

vi.mock("../../../src/utils/config.js", () => ({
    listConnections,
    loadConfig,
}));

vi.mock("../../../src/utils/logger.js", () => ({
    logger,
}));

describe("executeListCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should inform the user when no connections are saved", async () => {
        listConnections.mockReturnValue({});
        loadConfig.mockReturnValue({
            connections: {},
            defaultConnection: undefined,
            settings: {
                autoConnect: false,
                logLevel: "info",
                queryTimeout: 30000,
            },
        });
        await executeListCommand();

        expect(logger.info).toHaveBeenCalledWith("No saved connections found");
        expect(logger.info).toHaveBeenCalledWith(
            "Use 'dbmux connect' to create a connection"
        );
        expect(logger.raw).not.toHaveBeenCalled();
    });

    it("should list all saved connections and identify the default", async () => {
        const connections: Record<string, ConnectionConfig> = {
            "test-pg": {
                type: "postgresql",
                host: "localhost",
                port: 5432,
                user: "test",
                database: "testdb",
                ssl: false,
            },
            "test-sqlite": {
                type: "sqlite",
                filePath: "test.db",
            },
        };

        const config: DBmuxConfig = {
            connections,
            defaultConnection: "test-pg",
            settings: {
                autoConnect: false,
                logLevel: "info",
                queryTimeout: 30000,
            },
            dumpHistory: [],
        };

        listConnections.mockReturnValue(connections);
        loadConfig.mockReturnValue(config);
        await executeListCommand();

        expect(logger.info).toHaveBeenCalledWith("\nSaved connections:");

        const rawCalls = logger.raw.mock.calls.flat();
        expect(rawCalls).toEqual([
            "\n  test-pg (default)",
            "    Type: postgresql",
            "    Host: localhost",
            "    Port: 5432",
            "    User: test",
            "    Database: testdb",
            "    SSL: Disabled",
            "\n  test-sqlite",
            "    Type: sqlite",
            "    File: test.db",
            "",
        ]);
    });
});
