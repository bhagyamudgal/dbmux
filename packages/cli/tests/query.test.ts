import { readFileSync } from "fs";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type Mock,
} from "vitest";
import { executeQueryCommand } from "../src/commands/query";
import type { QueryResult } from "@dbmux/types/database";

// Mocks
const { withDatabaseConnection } = vi.hoisted(() => ({
    withDatabaseConnection: vi.fn(async (connection, callback, database) => {
        try {
            return await callback();
        } catch (error) {
            // This allows us to catch rejections from executeQuery
            // and simulate the behavior of the real implementation
            throw error;
        }
    }),
}));
const { executeQuery } = vi.hoisted(() => ({
    executeQuery: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        success: vi.fn(),
        raw: vi.fn(),
        table: vi.fn(), // Added table mock
    },
}));

vi.mock("fs", () => ({
    readFileSync: vi.fn(),
}));

vi.mock("../src/utils/command-runner.js", () => ({
    withDatabaseConnection,
}));
vi.mock("../src/utils/database.js", () => ({ executeQuery }));
vi.mock("../src/utils/logger.js", () => ({ logger }));
vi.mock("cli-table3", () => {
    const mTable = {
        push: vi.fn(),
        toString: vi.fn(() => "mock table"),
    };
    return { default: vi.fn(() => mTable) };
});

describe("executeQueryCommand", () => {
    const mockQueryResult: QueryResult = {
        rows: [{ id: 1, name: "test" }],
        rowCount: 1,
        fields: ["id", "name"],
        executionTime: 10,
    };

    beforeEach(() => {
        vi.resetAllMocks();
        (executeQuery as Mock).mockResolvedValue(mockQueryResult);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should execute a SQL query and display a table", async () => {
        await executeQueryCommand({
            connection: "test",
            sql: "SELECT * FROM users",
        });
        expect(executeQuery).toHaveBeenCalledWith("SELECT * FROM users");
        expect(logger.raw).toHaveBeenCalledWith("mock table");
        expect(logger.success).toHaveBeenCalledWith(
            "Query successful: 1 rows in 10ms"
        );
    });

    it("should read a query from a file", async () => {
        (readFileSync as Mock).mockReturnValue("SELECT * FROM file_users;");
        await executeQueryCommand({ connection: "test", file: "query.sql" });
        expect(readFileSync).toHaveBeenCalledWith("query.sql", "utf-8");
        expect(executeQuery).toHaveBeenCalledWith("SELECT * FROM file_users;");
    });

    it("should apply a limit to the query", async () => {
        await executeQueryCommand({
            connection: "test",
            sql: "SELECT * FROM users",
            limit: 50,
        });
        expect(executeQuery).toHaveBeenCalledWith(
            "SELECT * FROM users LIMIT 50"
        );
    });

    it("should display results in JSON format", async () => {
        await executeQueryCommand({
            connection: "test",
            sql: "SELECT * FROM users",
            format: "json",
        });
        expect(logger.raw).toHaveBeenCalledWith(
            JSON.stringify(mockQueryResult.rows, null, 2)
        );
    });

    it("should handle query execution failure", async () => {
        const error = new Error("Query failed");
        (executeQuery as Mock).mockRejectedValue(error);

        await expect(
            executeQueryCommand({
                connection: "test",
                sql: "SELECT * FROM users",
            })
        ).rejects.toThrow(error);
    });

    it("should handle zero rows returned", async () => {
        (executeQuery as Mock).mockResolvedValue({
            ...mockQueryResult,
            rowCount: 0,
            rows: [],
        });
        await executeQueryCommand({
            connection: "test",
            sql: "SELECT * FROM users",
        });
        expect(logger.info).toHaveBeenCalledWith("Query returned 0 rows.");
    });

    it("should fail if no query is provided", async () => {
        const processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);
        await executeQueryCommand({ connection: "test" });
        expect(logger.fail).toHaveBeenCalledWith(
            "Please provide either a SQL query with -q or a file with -f"
        );
        expect(processExit).toHaveBeenCalledWith(1);
    });
});
