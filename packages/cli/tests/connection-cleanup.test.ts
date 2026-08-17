import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";

// The factory is the seam because these tests are about which commands close
// what, not about pg itself; faking it keeps the pg client out of the graph so
// nothing here can open a socket. PostgresDriver has its own suite.
const {
    buildDriver,
    createDriver,
    openDrivers,
    driverCount,
    resetDrivers,
    failNextDisconnect,
} = vi.hoisted(() => {
    const drivers: { isConnected: boolean }[] = [];
    let shouldNextDisconnectFail = false;

    function buildDriver() {
        const state = { isConnected: false };
        drivers.push(state);

        return {
            connect: async () => {
                state.isConnected = true;
            },
            disconnect: async () => {
                if (shouldNextDisconnectFail) {
                    shouldNextDisconnectFail = false;
                    throw new Error("Connection terminated unexpectedly");
                }
                state.isConnected = false;
            },
            testConnection: async () => true,
            getDatabases: async () => [
                {
                    name: "app_db",
                    owner: "dummy_user",
                    encoding: "UTF8",
                    size: "1 MB",
                    tables: 3,
                },
            ],
            getTables: async () => ["users"],
            getTableInfo: async () => ({ columns: [], rowCount: 0 }),
            executeQuery: async () => ({
                rows: [],
                rowCount: 0,
                fields: [],
                executionTime: 0,
            }),
            terminateConnections: async () => {},
            dropDatabase: async () => {},
        };
    }

    return {
        buildDriver,
        createDriver: vi.fn(),
        openDrivers: () => drivers.filter((driver) => driver.isConnected),
        driverCount: () => drivers.length,
        resetDrivers: () => {
            drivers.length = 0;
            shouldNextDisconnectFail = false;
        },
        failNextDisconnect: () => {
            shouldNextDisconnectFail = true;
        },
    };
});

const { addDumpHistory, getConnection, getSuccessfulDumps, loadConfig } =
    vi.hoisted(() => ({
        addDumpHistory: vi.fn(),
        getConnection: vi.fn(),
        getSuccessfulDumps: vi.fn(),
        loadConfig: vi.fn(),
    }));
const { getActiveConnection } = vi.hoisted(() => ({
    getActiveConnection: vi.fn(),
}));
const { ensureCommandsExist } = vi.hoisted(() => ({
    ensureCommandsExist: vi.fn(),
}));
const {
    createDatabaseDump,
    generateDumpFilename,
    getDumpOutputPath,
    listDumpFiles,
    restoreDatabase,
    verifyDumpFile,
} = vi.hoisted(() => ({
    createDatabaseDump: vi.fn(),
    generateDumpFilename: vi.fn(),
    getDumpOutputPath: vi.fn(),
    listDumpFiles: vi.fn(),
    restoreDatabase: vi.fn(),
    verifyDumpFile: vi.fn(),
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
        warn: vi.fn(),
        error: vi.fn(),
        raw: vi.fn(),
    },
}));

vi.mock("../src/db-drivers/driver-factory.js", () => ({ createDriver }));
vi.mock("fs");
vi.mock("../src/utils/command-check.js", () => ({ ensureCommandsExist }));
vi.mock("../src/utils/config.js", () => ({
    addDumpHistory,
    getConnection,
    getSuccessfulDumps,
    loadConfig,
}));
vi.mock("../src/utils/session.js", () => ({ getActiveConnection }));
vi.mock("../src/utils/dump-restore.js", () => ({
    createDatabaseDump,
    generateDumpFilename,
    getDumpOutputPath,
    listDumpFiles,
    restoreDatabase,
    verifyDumpFile,
}));
vi.mock("@inquirer/prompts", () => ({ confirm, input, select }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

const DUMMY_CONNECTION = {
    type: "postgresql",
    host: "dummy-host.invalid",
    port: 5432,
    user: "dummy_user",
    password: "dummy_password",
    database: "app_db",
    ssl: false,
};

const DUMMY_DUMP_FILE = "/dummy/dumps/app_db.dump";

let executeDbDeleteCommand: typeof import("../src/commands/db/delete").executeDbDeleteCommand;
let executeDumpCommand: typeof import("../src/commands/dump").executeDumpCommand;
let executeRestoreCommand: typeof import("../src/commands/restore").executeRestoreCommand;
let withDatabaseConnection: typeof import("../src/utils/command-runner").withDatabaseConnection;
let existsSync: Mock;
let statSync: Mock;
let originalExitCode: typeof process.exitCode;

beforeAll(async () => {
    originalExitCode = process.exitCode;

    // tests/setup.ts imports src/utils/database eagerly, which evaluates the
    // real driver factory before any test file registers its mocks. Without
    // this reset the commands keep that cached factory and open real sockets.
    vi.resetModules();

    const fs = await import("fs");
    existsSync = fs.existsSync as unknown as Mock;
    statSync = fs.statSync as unknown as Mock;

    ({ executeDbDeleteCommand } = await import("../src/commands/db/delete"));
    ({ executeDumpCommand } = await import("../src/commands/dump"));
    ({ executeRestoreCommand } = await import("../src/commands/restore"));
    ({ withDatabaseConnection } = await import("../src/utils/command-runner"));
});

// `driverCount` guards the assertion itself: when the factory mock stops
// applying, no fake driver is built and `openDrivers()` passes vacuously while
// the real driver opens sockets.
function expectEverythingClosed(): void {
    expect(driverCount()).toBeGreaterThan(0);
    expect(openDrivers()).toEqual([]);
}

describe("connection cleanup", () => {
    let processExit: Mock;

    beforeEach(() => {
        vi.resetAllMocks();
        resetDrivers();

        // The commands under test set process.exitCode on failure, which would
        // otherwise leak out and fail the vitest run itself.
        process.exitCode = undefined;

        processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never) as unknown as Mock;

        createDriver.mockImplementation(buildDriver);

        getConnection.mockReturnValue(DUMMY_CONNECTION);
        loadConfig.mockReturnValue({
            connections: { dummy: DUMMY_CONNECTION },
            defaultConnection: "dummy",
            settings: {},
            dumpHistory: [],
        });
        getActiveConnection.mockReturnValue("dummy");
        addDumpHistory.mockReturnValue({ id: "dummy-history-id" });
        getSuccessfulDumps.mockReturnValue([]);

        ensureCommandsExist.mockReturnValue(true);
        generateDumpFilename.mockReturnValue("app_db_backup.dump");
        getDumpOutputPath.mockReturnValue(DUMMY_DUMP_FILE);
        createDatabaseDump.mockResolvedValue({
            path: DUMMY_DUMP_FILE,
            size: 1024,
        });
        listDumpFiles.mockReturnValue([
            {
                name: "app_db.dump",
                path: DUMMY_DUMP_FILE,
                size: "1 MB",
                modified: new Date(0),
                isValid: true,
            },
        ]);
        verifyDumpFile.mockResolvedValue(true);
        restoreDatabase.mockResolvedValue(undefined);

        confirm.mockResolvedValue(true);
        existsSync.mockReturnValue(true);
        statSync.mockReturnValue({ size: 1024 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.exitCode = originalExitCode;
    });

    describe("dump create", () => {
        it("closes the connection after a successful dump", async () => {
            await executeDumpCommand({
                database: "app_db",
                output: "app_db_backup.dump",
            });

            expect(createDatabaseDump).toHaveBeenCalledOnce();
            expectEverythingClosed();
        });

        it("closes the connection and exits 1 when the dump fails", async () => {
            createDatabaseDump.mockRejectedValue(new Error("Disk full"));

            await executeDumpCommand({ database: "app_db" });

            expect(processExit).not.toHaveBeenCalled();
            expect(process.exitCode).toBe(1);
            expectEverythingClosed();
        });

        it("keeps a successful dump successful when the close fails", async () => {
            failNextDisconnect();

            await executeDumpCommand({ database: "app_db" });

            expect(logger.success).toHaveBeenCalledWith(
                "Dump completed successfully!"
            );
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("the command itself completed")
            );
            expect(process.exitCode).toBeUndefined();
        });

        it("closes the connection when the user cancels", async () => {
            confirm.mockResolvedValue(false);

            await executeDumpCommand({ database: "app_db" });

            expect(createDatabaseDump).not.toHaveBeenCalled();
            expectEverythingClosed();
        });

        it("closes the connection when the requested database is missing", async () => {
            await executeDumpCommand({ database: "no_such_db" });

            expect(logger.fail).toHaveBeenCalledWith(
                "Database 'no_such_db' not found"
            );
            expectEverythingClosed();
        });
    });

    describe("restore run", () => {
        it("closes the connection after a successful restore", async () => {
            await executeRestoreCommand({
                file: DUMMY_DUMP_FILE,
                database: "app_db",
                drop: true,
            });

            expect(restoreDatabase).toHaveBeenCalledOnce();
            expectEverythingClosed();
        });

        it("closes the connection and exits 1 when the restore fails", async () => {
            restoreDatabase.mockRejectedValue(new Error("pg_restore failed"));

            await executeRestoreCommand({
                file: DUMMY_DUMP_FILE,
                database: "app_db",
                drop: true,
            });

            expect(processExit).not.toHaveBeenCalled();
            expect(process.exitCode).toBe(1);
            expectEverythingClosed();
        });

        it("closes the connection when the user cancels", async () => {
            confirm.mockResolvedValue(false);

            await executeRestoreCommand({
                file: DUMMY_DUMP_FILE,
                database: "app_db",
                drop: true,
            });

            expect(restoreDatabase).not.toHaveBeenCalled();
            expectEverythingClosed();
        });
    });

    describe("db delete", () => {
        it("closes both the shared connection and the admin driver", async () => {
            await executeDbDeleteCommand({ database: "app_db", force: true });

            expect(logger.success).toHaveBeenCalledWith(
                "Database 'app_db' has been deleted"
            );
            expect(driverCount()).toBe(2);
            expectEverythingClosed();
        });

        it("closes the connection when the requested database is missing", async () => {
            await expect(
                executeDbDeleteCommand({ database: "no_such_db", force: true })
            ).rejects.toThrow("Database 'no_such_db' not found");

            expectEverythingClosed();
        });

        it("closes the connection when the user cancels", async () => {
            confirm.mockResolvedValue(false);

            await executeDbDeleteCommand({ database: "app_db" });

            expect(logger.info).toHaveBeenCalledWith(
                "Delete operation cancelled"
            );
            expectEverythingClosed();
        });

        it("still reports the delete when the close fails", async () => {
            failNextDisconnect();

            await expect(
                executeDbDeleteCommand({ database: "app_db", force: true })
            ).resolves.toBeUndefined();

            expect(logger.success).toHaveBeenCalledWith(
                "Database 'app_db' has been deleted"
            );
            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining("the delete itself completed")
            );
        });
    });

    describe("withDatabaseConnection", () => {
        it("closes the connection after the action resolves", async () => {
            await withDatabaseConnection("dummy", async () => {});

            expectEverythingClosed();
        });

        it("closes the connection after the action throws", async () => {
            await withDatabaseConnection("dummy", async () => {
                throw new Error("query failed");
            });

            expect(processExit).not.toHaveBeenCalled();
            expect(process.exitCode).toBe(1);
            expectEverythingClosed();
        });
    });

    describe("connectToDatabase", () => {
        it("closes a driver whose connect fails, so its pool is not orphaned", async () => {
            createDriver.mockImplementation(() => {
                const driver = buildDriver();
                return {
                    ...driver,
                    // The pool is live once connect() opens it; only the
                    // validation query that follows fails.
                    connect: async () => {
                        await driver.connect();
                        throw new Error("SELECT 1 failed");
                    },
                };
            });

            await withDatabaseConnection("dummy", async () => {});

            // connectToDatabase never stores a driver that threw, so closing it
            // there is the only chance to end the pool it already opened.
            expect(process.exitCode).toBe(1);
            expect(driverCount()).toBe(1);
            expect(openDrivers()).toEqual([]);
        });
    });
});
