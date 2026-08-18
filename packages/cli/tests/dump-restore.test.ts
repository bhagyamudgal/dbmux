import type { ConnectionConfig } from "@dbmux/types/database";
import { spawn } from "child_process";
import { existsSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreDatabase, verifyDumpFile } from "../src/utils/dump-restore";

const { resolvePgClient, logClientInstallHint } = vi.hoisted(() => ({
    resolvePgClient: vi.fn(),
    logClientInstallHint: vi.fn(),
}));
const { executeCommand } = vi.hoisted(() => ({ executeCommand: vi.fn() }));
const { closeConnection } = vi.hoisted(() => ({ closeConnection: vi.fn() }));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        fail: vi.fn(),
    },
}));

vi.mock("fs");
vi.mock("child_process", () => ({ spawn: vi.fn() }));
vi.mock("../src/utils/pg-client.js", () => ({
    resolvePgClient,
    logClientInstallHint,
}));
vi.mock("../src/utils/process-runner.js", () => ({ executeCommand }));
vi.mock("../src/utils/database.js", () => ({ closeConnection }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

const CONNECTION: ConnectionConfig = {
    type: "postgresql",
    host: "localhost",
    port: 5432,
    user: "postgres",
    database: "app",
};

const RESTORE_OPTIONS = {
    inputFile: "/mock/.dbmux/dumps/app.dump",
    targetDatabase: "app",
    isCustomFormat: true,
};

function stubSpawn(exitCode: number, stderrOutput = ""): void {
    vi.mocked(spawn).mockImplementation(() => {
        const childProcess = {
            stdout: { on: vi.fn() },
            stderr: {
                on: vi.fn((event: string, handler: (data: Buffer) => void) => {
                    if (event === "data" && stderrOutput) {
                        handler(Buffer.from(stderrOutput));
                    }
                }),
            },
            on: vi.fn(
                (event: string, handler: (code: number | null) => void) => {
                    if (event === "close") {
                        queueMicrotask(() => handler(exitCode));
                    }
                }
            ),
        };
        // Only the three members the command runners touch are stubbed; the
        // real ChildProcess surface is far too large to construct here.
        return childProcess as unknown as ReturnType<typeof spawn>;
    });
}

// Node 24 emits "error" then "close" with code -2 and no stderr for a failed
// spawn, so a runner that reads only "close" reports an empty reason. Emission
// is sequenced here rather than at registration, because the runner subscribes
// to "close" first and the order is what decides which reason the caller gets.
function stubSpawnFailure(errorMessage: string): void {
    vi.mocked(spawn).mockImplementation(() => {
        const handlers = new Map<string, (payload: never) => void>();

        queueMicrotask(() => {
            handlers.get("error")?.(new Error(errorMessage) as never);
            handlers.get("close")?.(-2 as never);
        });

        const childProcess = {
            stdout: { on: vi.fn() },
            stderr: { on: vi.fn() },
            on: vi.fn((event: string, handler: (payload: never) => void) => {
                handlers.set(event, handler);
            }),
        };
        return childProcess as unknown as ReturnType<typeof spawn>;
    });
}

describe("restoreDatabase client version guard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(existsSync).mockReturnValue(true);
        stubSpawn(0);
    });

    it("aborts without touching the database when the client is newer than the server", async () => {
        resolvePgClient.mockResolvedValue({
            command: "pg_restore",
            clientMajorVersion: 17,
            serverMajorVersion: 16,
        });

        await expect(
            restoreDatabase(CONNECTION, {
                ...RESTORE_OPTIONS,
                dropExisting: true,
            })
        ).rejects.toThrow(/PostgreSQL 16/);

        expect(logClientInstallHint).toHaveBeenCalledWith(16);
        expect(executeCommand).not.toHaveBeenCalled();
        expect(spawn).not.toHaveBeenCalled();
    });

    it("runs the version-matched binary that resolvePgClient picked", async () => {
        const matchedPath = "/opt/homebrew/opt/postgresql@16/bin/pg_restore";
        resolvePgClient.mockResolvedValue({
            command: matchedPath,
            clientMajorVersion: 16,
            serverMajorVersion: 16,
        });

        await restoreDatabase(CONNECTION, RESTORE_OPTIONS);

        expect(spawn).toHaveBeenCalledWith(
            matchedPath,
            expect.arrayContaining([RESTORE_OPTIONS.inputFile]),
            expect.any(Object)
        );
    });

    it("proceeds when the client is older than the server", async () => {
        resolvePgClient.mockResolvedValue({
            command: "pg_restore",
            clientMajorVersion: 15,
            serverMajorVersion: 16,
        });

        await restoreDatabase(CONNECTION, RESTORE_OPTIONS);

        expect(spawn).toHaveBeenCalledWith(
            "pg_restore",
            expect.any(Array),
            expect.any(Object)
        );
    });

    it("explains how to recover when the archive is newer than the client can read", async () => {
        resolvePgClient.mockResolvedValue({
            command: "/opt/homebrew/opt/postgresql@16/bin/pg_restore",
            clientMajorVersion: 16,
            serverMajorVersion: 16,
        });
        stubSpawn(1, "pg_restore: error: unsupported version (1.16)\n");

        await expect(
            restoreDatabase(CONNECTION, RESTORE_OPTIONS)
        ).rejects.toThrow(/pg_restore failed/);

        expect(logger.info).toHaveBeenCalledWith(
            expect.stringContaining("newer pg_dump")
        );
    });

    it("reports why pg_restore could not be spawned", async () => {
        resolvePgClient.mockResolvedValue({
            command: "/missing/bin/pg_restore",
            clientMajorVersion: 16,
            serverMajorVersion: 16,
        });
        stubSpawnFailure("spawn /missing/bin/pg_restore ENOENT");

        await expect(
            restoreDatabase(CONNECTION, RESTORE_OPTIONS)
        ).rejects.toThrow(
            "pg_restore failed: spawn /missing/bin/pg_restore ENOENT"
        );
    });
});

describe("verifyDumpFile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lists the archive with the same client the restore will use", async () => {
        const matchedPath = "/opt/homebrew/opt/postgresql@16/bin/pg_restore";
        resolvePgClient.mockResolvedValue({
            command: matchedPath,
            clientMajorVersion: 16,
            serverMajorVersion: 16,
        });
        executeCommand.mockResolvedValue({
            success: true,
            output: "",
            error: "",
        });

        await expect(verifyDumpFile(RESTORE_OPTIONS.inputFile)).resolves.toBe(
            true
        );

        expect(executeCommand).toHaveBeenCalledWith(matchedPath, [
            "--list",
            RESTORE_OPTIONS.inputFile,
        ]);
    });
});
