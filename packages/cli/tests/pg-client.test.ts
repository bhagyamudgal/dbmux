import { existsSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolvePgClient } from "../src/utils/pg-client";

const { executeQuery, closeConnection } = vi.hoisted(() => ({
    executeQuery: vi.fn(),
    closeConnection: vi.fn(),
}));
const { executeCommand } = vi.hoisted(() => ({ executeCommand: vi.fn() }));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        fail: vi.fn(),
    },
}));

vi.mock("fs");
vi.mock("../src/utils/database.js", () => ({ executeQuery, closeConnection }));
vi.mock("../src/utils/process-runner.js", () => ({ executeCommand }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

const SERVER_VERSION_COLUMN = "server_version_num";

function mockServerVersion(versionNumber: number): void {
    executeQuery.mockResolvedValue({
        rows: [{ [SERVER_VERSION_COLUMN]: String(versionNumber) }],
        rowCount: 1,
        fields: [SERVER_VERSION_COLUMN],
        executionTime: 1,
    });
}

function mockToolVersion(version: string): void {
    executeCommand.mockResolvedValue({
        success: true,
        output: `pg_restore (PostgreSQL) ${version}\n`,
        error: "",
    });
}

describe("resolvePgClient", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(existsSync).mockReturnValue(false);
    });

    it("uses the tool on PATH when its major version matches the server", async () => {
        mockServerVersion(170010);
        mockToolVersion("17.10");

        const client = await resolvePgClient("pg_restore");

        expect(client).toEqual({
            command: "pg_restore",
            clientMajorVersion: 17,
            serverMajorVersion: 17,
        });
        expect(existsSync).not.toHaveBeenCalled();
    });

    it("switches to a version-matched binary when PATH is newer than the server", async () => {
        mockServerVersion(160004);
        mockToolVersion("17.10");
        const matchedPath = "/opt/homebrew/opt/postgresql@16/bin/pg_restore";
        vi.mocked(existsSync).mockImplementation(
            (path) => path === matchedPath
        );

        const client = await resolvePgClient("pg_restore");

        expect(client).toEqual({
            command: matchedPath,
            clientMajorVersion: 16,
            serverMajorVersion: 16,
        });
    });

    it("warns and falls back to PATH when no matching binary is installed", async () => {
        mockServerVersion(150006);
        mockToolVersion("17.10");

        const client = await resolvePgClient("pg_restore");

        expect(client).toEqual({
            command: "pg_restore",
            clientMajorVersion: 17,
            serverMajorVersion: 15,
        });
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("PostgreSQL 15")
        );
    });

    it("falls back to PATH when the server version cannot be read", async () => {
        executeQuery.mockRejectedValue(new Error("no connection"));
        mockToolVersion("17.10");

        const client = await resolvePgClient("pg_restore");

        expect(client).toEqual({
            command: "pg_restore",
            clientMajorVersion: 17,
            serverMajorVersion: null,
        });
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("no connection")
        );
    });

    it("still finds a matching binary when the PATH client version is unreadable", async () => {
        mockServerVersion(160004);
        executeCommand.mockResolvedValue({
            success: false,
            output: "",
            error: "command not found",
        });
        const matchedPath = "/usr/lib/postgresql/16/bin/pg_restore";
        vi.mocked(existsSync).mockImplementation(
            (path) => path === matchedPath
        );

        const client = await resolvePgClient("pg_restore");

        expect(client).toEqual({
            command: matchedPath,
            clientMajorVersion: 16,
            serverMajorVersion: 16,
        });
    });

    it("reads the major version of a pre-release client build", async () => {
        mockServerVersion(180000);
        mockToolVersion("18beta1");

        const client = await resolvePgClient("pg_restore");

        expect(client.clientMajorVersion).toBe(18);
    });
});
