import { table } from "table";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeListCommand } from "../src/commands/list";

const { withDatabaseConnection } = vi.hoisted(() => ({
    withDatabaseConnection: vi.fn(async (conn, fn, _db) => await fn()),
}));
const { listConnections } = vi.hoisted(() => ({ listConnections: vi.fn() }));
const { getDatabases, getTables } = vi.hoisted(() => ({
    getDatabases: vi.fn(),
    getTables: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        raw: vi.fn(),
    },
}));
vi.mock("table", () => ({ table: vi.fn(() => "mock table") }));

vi.mock("../src/utils/command-runner.js", () => ({
    withDatabaseConnection,
}));
vi.mock("../src/utils/config.js", () => ({ listConnections }));
vi.mock("../src/utils/database.js", () => ({
    getDatabases,
    getTables,
}));
vi.mock("../src/utils/logger.js", () => ({ logger }));

describe("executeListCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should list saved connections", async () => {
        listConnections.mockReturnValue({ conn1: {}, conn2: {} });
        await executeListCommand({ connections: true });
        expect(logger.info).toHaveBeenCalledWith("Saved Connections:");
        expect(logger.raw).toHaveBeenCalledWith("- conn1");
        expect(logger.raw).toHaveBeenCalledWith("- conn2");
    });

    it("should list databases", async () => {
        getDatabases.mockResolvedValue([
            { name: "db1", owner: "user1" },
            { name: "db2", owner: "user2" },
        ]);
        await executeListCommand({ databases: true });
        expect(getDatabases).toHaveBeenCalledOnce();
        expect(table).toHaveBeenCalledOnce();
        expect(logger.raw).toHaveBeenCalledWith("mock table");
    });

    it("should list tables", async () => {
        getTables.mockResolvedValue(["table1", "table2"]);
        await executeListCommand({ tables: true });
        expect(getTables).toHaveBeenCalledOnce();
        expect(logger.info).toHaveBeenCalledWith("Tables:");
        expect(logger.raw).toHaveBeenCalledWith("- table1");
        expect(logger.raw).toHaveBeenCalledWith("- table2");
    });

    it("should pass schema to getTables", async () => {
        getTables.mockResolvedValue([]);
        await executeListCommand({ tables: true, schema: "custom" });
        expect(getTables).toHaveBeenCalledWith("custom");
    });

    it("should inform the user if no option is specified", async () => {
        await executeListCommand({});
        expect(logger.info).toHaveBeenCalledWith(
            "No list option specified. Use --databases, --tables, or --connections."
        );
    });

    it("should handle no connections found", async () => {
        listConnections.mockReturnValue({});
        await executeListCommand({ connections: true });
        expect(logger.info).toHaveBeenCalledWith(
            "No saved connections found. Use 'dbmux connect' to add one."
        );
    });

    it("should handle no databases found", async () => {
        getDatabases.mockResolvedValue([]);
        await executeListCommand({ databases: true });
        expect(logger.info).toHaveBeenCalledWith("No databases found.");
    });

    it("should handle no tables found", async () => {
        getTables.mockResolvedValue([]);
        await executeListCommand({ tables: true });
        expect(logger.info).toHaveBeenCalledWith(
            "No tables found in the current database."
        );
    });
});
