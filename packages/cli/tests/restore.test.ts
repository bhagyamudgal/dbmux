import { existsSync, statSync } from "fs";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";
import { executeRestoreCommand } from "../src/commands/restore";

// Hoisted Mocks
const { ensureCommandsExist } = vi.hoisted(() => ({
    ensureCommandsExist: vi.fn(),
}));
const { getConnection, addDumpHistory, getSuccessfulDumps, loadConfig } =
    vi.hoisted(() => ({
        getConnection: vi.fn(),
        addDumpHistory: vi.fn(),
        getSuccessfulDumps: vi.fn(),
        loadConfig: vi.fn(),
    }));
const { getActiveConnection } = vi.hoisted(() => ({
    getActiveConnection: vi.fn(),
}));
const { DUMPS_DIR } = vi.hoisted(() => ({
    DUMPS_DIR: "/mock/.dbmux/dumps",
}));
const { connectToDatabase, getDatabases } = vi.hoisted(() => ({
    connectToDatabase: vi.fn(),
    getDatabases: vi.fn(),
}));
const { listDumpFiles, verifyDumpFile, restoreDatabase } = vi.hoisted(() => ({
    listDumpFiles: vi.fn(),
    verifyDumpFile: vi.fn(),
    restoreDatabase: vi.fn(),
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

// Module Mocks
vi.mock("fs");
vi.mock("../src/utils/command-check.js", () => ({ ensureCommandsExist }));
vi.mock("../src/utils/config.js", () => ({
    getConnection,
    addDumpHistory,
    getSuccessfulDumps,
    loadConfig,
}));
vi.mock("../src/utils/session.js", () => ({ getActiveConnection }));
vi.mock("../src/utils/constants.js", () => ({ DUMPS_DIR }));
vi.mock("../src/utils/database.js", () => ({
    connectToDatabase,
    getDatabases,
}));
vi.mock("../src/utils/dump-restore.js", () => ({
    listDumpFiles,
    verifyDumpFile,
    restoreDatabase,
}));
vi.mock("@inquirer/prompts", () => ({ confirm, input, select }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

describe("executeRestoreCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        ensureCommandsExist.mockReturnValue(true);
        getConnection.mockReturnValue({ type: "postgresql" });
        listDumpFiles.mockReturnValue([
            {
                name: "test.dump",
                path: "/mock/.dbmux/dumps/test.dump",
                modified: new Date(),
            },
        ]);
        getDatabases.mockResolvedValue([{ name: "db1" }]);
        loadConfig.mockReturnValue({
            connections: {},
            defaultConnection: "test",
            settings: {},
            dumpHistory: [],
        });
        getActiveConnection.mockReturnValue(null);
        addDumpHistory.mockReturnValue({ id: "test-id" });
        getSuccessfulDumps.mockReturnValue([]);
        confirm.mockResolvedValue(true);
        select.mockResolvedValue("/mock/.dbmux/dumps/test.dump");
        (existsSync as Mock).mockReturnValue(true);
        (statSync as Mock).mockReturnValue({ size: 1024 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should fail if pg_restore is not found", async () => {
        ensureCommandsExist.mockReturnValue(false);
        await executeRestoreCommand({});
        expect(restoreDatabase).not.toHaveBeenCalled();
    });

    it("should fail if dump file does not exist", async () => {
        const processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);
        (existsSync as Mock).mockReturnValue(false);
        await executeRestoreCommand({ file: "bad.dump" });
        expect(logger.fail).toHaveBeenCalledWith(
            "Dump file not found: bad.dump"
        );
        expect(processExit).toHaveBeenCalledWith(1);
    });

    it("should restore to a new database interactively", async () => {
        select
            .mockResolvedValueOnce("test.dump") // select file
            .mockResolvedValueOnce("new"); // select action
        input.mockResolvedValue("new_db"); // enter db name
        confirm.mockResolvedValue(true); // final confirm

        await executeRestoreCommand({});

        expect(restoreDatabase).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                targetDatabase: "new_db",
                createDatabase: true,
            })
        );
        expect(logger.success).toHaveBeenCalledWith(
            "Restore completed successfully!"
        );
    });

    it("should restore to an existing database with drop confirmation", async () => {
        select
            .mockResolvedValueOnce("test.dump") // select file
            .mockResolvedValueOnce("existing") // select action
            .mockResolvedValueOnce("db1"); // select db
        confirm.mockResolvedValue(true); // confirm dangerous op and final confirm

        await executeRestoreCommand({});

        expect(confirm).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining(
                    "DANGER: This will DELETE all data"
                ),
            })
        );
        expect(restoreDatabase).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                targetDatabase: "db1",
                dropExisting: true,
            })
        );
    });

    it("should cancel if user rejects dangerous confirmation", async () => {
        select
            .mockResolvedValueOnce("test.dump")
            .mockResolvedValueOnce("existing")
            .mockResolvedValueOnce("db1");
        confirm.mockResolvedValueOnce(false); // REJECT dangerous op

        await executeRestoreCommand({});
        expect(logger.info).toHaveBeenCalledWith("Restore operation cancelled");
        expect(restoreDatabase).not.toHaveBeenCalled();
    });

    it("should handle restore failure", async () => {
        const restoreError = new Error("Restore failed");
        restoreDatabase.mockRejectedValue(restoreError);
        const processExitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);

        await executeRestoreCommand({ file: "test.dump", database: "db1" });
        expect(logger.fail).toHaveBeenCalledWith(
            expect.stringContaining("Restore failed: Restore failed")
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should fail if no dump files are found", async () => {
        const processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);
        listDumpFiles.mockReturnValue([]);
        await executeRestoreCommand({});
        expect(logger.fail).toHaveBeenCalledWith("No dump files found");
        expect(processExit).toHaveBeenCalledWith(1);
    });

    it("should fail if dump file verification fails", async () => {
        const processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);
        const verifyError = new Error("Bad dump file");
        verifyDumpFile.mockRejectedValue(verifyError);
        await executeRestoreCommand({ file: "test.dump" });
        expect(logger.fail).toHaveBeenCalledWith(
            "Dump file verification failed."
        );
        expect(processExit).toHaveBeenCalledWith(1);
    });

    it("should cancel if user rejects final confirmation", async () => {
        confirm.mockResolvedValue(false); // Reject final confirmation
        await executeRestoreCommand({
            file: "test.dump",
            database: "db1",
            drop: true,
        });
        expect(logger.info).toHaveBeenCalledWith("Restore operation cancelled");
        expect(restoreDatabase).not.toHaveBeenCalled();
    });

    it("should re-prompt for a valid database name", async () => {
        select.mockResolvedValueOnce("test.dump").mockResolvedValueOnce("new");
        input.mockResolvedValueOnce("valid_name");

        await executeRestoreCommand({});

        expect(input).toHaveBeenCalledTimes(1);
        expect(restoreDatabase).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ targetDatabase: "valid_name" })
        );
    });
});
