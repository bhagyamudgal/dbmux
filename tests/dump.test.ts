import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeDumpCommand } from "../src/commands/dump";

const { ensureCommandsExist } = vi.hoisted(() => ({
    ensureCommandsExist: vi.fn(),
}));
const { getConnection } = vi.hoisted(() => ({ getConnection: vi.fn() }));
const { connectToDatabase, getDatabases } = vi.hoisted(() => ({
    connectToDatabase: vi.fn(),
    getDatabases: vi.fn(),
}));
const { createDatabaseDump, generateDumpFilename } = vi.hoisted(() => ({
    createDatabaseDump: vi.fn(),
    generateDumpFilename: vi.fn(),
}));
const { confirm, input, select } = vi.hoisted(() => ({
    confirm: vi.fn(),
    input: vi.fn(),
    select: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock("../src/utils/command-check.js", () => ({ ensureCommandsExist }));
vi.mock("../src/utils/config.js", () => ({ getConnection }));
vi.mock("../src/utils/database.js", () => ({
    connectToDatabase,
    getDatabases,
}));
vi.mock("../src/utils/dump-restore.js", () => ({
    createDatabaseDump,
    generateDumpFilename,
}));
vi.mock("@inquirer/prompts", () => ({ confirm, input, select }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

describe("executeDumpCommand", () => {
    const mockConnection = { type: "postgresql" };
    const mockDatabases = [{ name: "db1" }, { name: "db2" }];

    beforeEach(() => {
        vi.resetAllMocks();
        ensureCommandsExist.mockReturnValue(true);
        getConnection.mockReturnValue(mockConnection);
        getDatabases.mockResolvedValue(mockDatabases);
        generateDumpFilename.mockReturnValue("default_dump.sql");
        createDatabaseDump.mockResolvedValue("/path/to/dump.sql");
        confirm.mockResolvedValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should fail if pg_dump is not found", async () => {
        ensureCommandsExist.mockReturnValue(false);
        await executeDumpCommand({});
        expect(logger.fail).not.toHaveBeenCalled(); // The util handles logging
    });

    it("should fail for non-postgresql connections", async () => {
        getConnection.mockReturnValue({ type: "sqlite" });
        await executeDumpCommand({});
        expect(logger.fail).toHaveBeenCalledWith(
            "Dump command is currently only supported for PostgreSQL databases."
        );
    });

    it("should run non-interactively with all options", async () => {
        await executeDumpCommand({ database: "db1", output: "custom.sql" });
        expect(createDatabaseDump).toHaveBeenCalledWith(
            mockConnection,
            expect.objectContaining({
                database: "db1",
                outputFile: "custom.sql",
            })
        );
        expect(logger.success).toHaveBeenCalledWith(
            "Dump completed successfully!"
        );
    });

    it("should run interactively to select a database", async () => {
        select.mockResolvedValue("db2");
        input.mockResolvedValue(""); // use default filename
        await executeDumpCommand({});
        expect(select).toHaveBeenCalledOnce();
        expect(createDatabaseDump).toHaveBeenCalledWith(
            mockConnection,
            expect.objectContaining({ database: "db2" })
        );
    });

    it("should fail if specified database does not exist", async () => {
        await executeDumpCommand({ database: "non-existent" });
        expect(logger.fail).toHaveBeenCalledWith(
            "Database 'non-existent' not found"
        );
    });

    it("should allow user to cancel the dump", async () => {
        confirm.mockResolvedValue(false);
        await executeDumpCommand({ database: "db1" });
        expect(logger.info).toHaveBeenCalledWith("Dump operation cancelled");
        expect(createDatabaseDump).not.toHaveBeenCalled();
    });

    it("should handle errors from createDatabaseDump", async () => {
        const dumpError = new Error("Disk full");
        createDatabaseDump.mockRejectedValue(dumpError);
        const processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);

        await executeDumpCommand({ database: "db1" });

        expect(logger.fail).toHaveBeenCalledWith(`Dump failed: ${dumpError}`);
        expect(processExit).toHaveBeenCalledWith(1);
    });

    it("should fail if no databases are found", async () => {
        getDatabases.mockResolvedValue([]);
        await executeDumpCommand({});
        expect(logger.fail).toHaveBeenCalledWith("No databases found");
    });

    it("should use a custom filename when provided interactively", async () => {
        select.mockResolvedValue("db1");
        input.mockResolvedValue("my_special_dump.sql"); // Custom filename
        await executeDumpCommand({});
        expect(createDatabaseDump).toHaveBeenCalledWith(
            mockConnection,
            expect.objectContaining({
                outputFile: "my_special_dump.sql",
            })
        );
    });

    it("should fail if getting the connection fails", async () => {
        const connectionError = new Error("No connections found");
        getConnection.mockImplementation(() => {
            throw connectionError;
        });
        await executeDumpCommand({});
        expect(logger.fail).toHaveBeenCalledWith(
            "No database connection found. Run 'dbmux connect' first."
        );
    });
});
