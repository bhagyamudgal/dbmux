import { beforeEach, describe, expect, it, vi } from "vitest";
import { promptForConnectionDetails } from "../src/utils/prompt";

const { select, input, password, confirm } = vi.hoisted(() => ({
    select: vi.fn(),
    input: vi.fn(),
    password: vi.fn(),
    confirm: vi.fn(),
}));

const { getDriverDefaults } = vi.hoisted(() => ({
    getDriverDefaults: vi.fn(),
}));

vi.mock("@inquirer/prompts", () => ({
    select,
    input,
    password,
    confirm,
}));

vi.mock("../src/db-drivers/driver-factory.js", () => ({
    getDriverDefaults,
}));

describe("promptForConnectionDetails", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        getDriverDefaults.mockReturnValue({
            host: "localhost",
            port: 5432,
            ssl: false,
        });
    });

    describe("Connection method selection", () => {
        it("should offer choice between URL and individual fields", async () => {
            select.mockResolvedValueOnce("url");
            input.mockResolvedValue("postgresql://user:pass@localhost/db");

            await promptForConnectionDetails();

            expect(select).toHaveBeenCalledWith({
                message: "How would you like to provide connection details?",
                choices: [
                    {
                        name: "Database URL (e.g., postgresql://user:password@host:port/database)",
                        value: "url",
                    },
                    {
                        name: "Individual fields (host, port, user, etc.)",
                        value: "fields",
                    },
                ],
            });
        });
    });

    describe("URL connection method", () => {
        beforeEach(() => {
            select.mockResolvedValueOnce("url");
        });

        it("should parse a complete PostgreSQL URL", async () => {
            const url =
                "postgresql://admin:secret@db.example.com:5433/production?ssl=true";
            input.mockResolvedValue(url);

            const result = await promptForConnectionDetails();

            expect(input).toHaveBeenCalledWith({
                message: "Enter database URL:",
                validate: expect.any(Function),
            });

            expect(result).toEqual({
                type: "postgresql",
                host: "db.example.com",
                port: 5433,
                user: "admin",
                password: "secret",
                database: "production",
                ssl: true,
            });
        });

        it("should parse a postgres:// protocol URL", async () => {
            const url = "postgres://user@localhost/mydb";
            input.mockResolvedValue(url);

            const result = await promptForConnectionDetails();

            expect(result).toEqual({
                type: "postgresql",
                host: "localhost",
                port: 5432,
                user: "user",
                database: "mydb",
                ssl: false,
            });
        });

        it("should parse SQLite URL", async () => {
            const url = "sqlite:///path/to/database.db";
            input.mockResolvedValue(url);

            const result = await promptForConnectionDetails();

            expect(result).toEqual({
                type: "sqlite",
                filePath: "/path/to/database.db",
                ssl: false,
            });
        });

        it("should handle URL with sslmode=require", async () => {
            const url = "postgresql://user@host/db?sslmode=require";
            input.mockResolvedValue(url);

            const result = await promptForConnectionDetails();

            expect(result.ssl).toBe(true);
        });

        it("should use driver defaults for missing components", async () => {
            const url = "postgresql://user@localhost/db";
            input.mockResolvedValue(url);

            const result = await promptForConnectionDetails();

            expect(result).toEqual({
                type: "postgresql",
                host: "localhost",
                port: 5432,
                user: "user",
                database: "db",
                ssl: false,
            });
        });

        it("should validate URL format", async () => {
            const url = "postgresql://valid@localhost/db";
            input.mockResolvedValue(url);

            await promptForConnectionDetails();

            const validateFn = input.mock.calls[0]?.[0]?.validate;

            expect(validateFn(url)).toBe(true);

            expect(validateFn("")).toBe("URL cannot be empty.");

            expect(validateFn("invalid-url")).toContain("Invalid database URL");

            expect(validateFn("mysql://user@host/db")).toContain(
                "Unsupported database type"
            );
        });
    });

    describe("Individual fields connection method", () => {
        beforeEach(() => {
            select.mockResolvedValueOnce("fields");
        });

        it("should prompt for PostgreSQL connection details", async () => {
            select.mockResolvedValueOnce("postgresql");
            input.mockResolvedValueOnce("myhost");
            input.mockResolvedValueOnce("5433");
            input.mockResolvedValueOnce("myuser");
            password.mockResolvedValueOnce("mypass");
            input.mockResolvedValueOnce("mydb");
            confirm.mockResolvedValueOnce(true);

            const result = await promptForConnectionDetails();

            expect(select).toHaveBeenCalledWith({
                message: "Select database type:",
                choices: [
                    { name: "PostgreSQL", value: "postgresql" },
                    { name: "SQLite", value: "sqlite" },
                ],
            });

            expect(input).toHaveBeenCalledWith({
                message: "Host:",
                default: "localhost",
            });

            expect(input).toHaveBeenCalledWith({
                message: "Port:",
                default: "5432",
                validate: expect.any(Function),
            });

            expect(input).toHaveBeenCalledWith({
                message: "User:",
                validate: expect.any(Function),
            });

            expect(password).toHaveBeenCalledWith({
                message: "Password (leave blank for none):",
            });

            expect(input).toHaveBeenCalledWith({
                message: "Database:",
                validate: expect.any(Function),
                default: "postgres",
            });

            expect(confirm).toHaveBeenCalledWith({
                message: "Use SSL?",
                default: false,
            });

            expect(result).toEqual({
                type: "postgresql",
                host: "myhost",
                port: 5433,
                user: "myuser",
                password: "mypass",
                database: "mydb",
                ssl: true,
            });
        });

        it("should prompt for SQLite connection details", async () => {
            select.mockResolvedValueOnce("sqlite");
            input.mockResolvedValueOnce("/path/to/db.sqlite");

            const result = await promptForConnectionDetails();

            expect(input).toHaveBeenCalledWith({
                message: "Enter the path to the SQLite database file:",
                validate: expect.any(Function),
            });

            expect(result).toEqual({
                type: "sqlite",
                filePath: "/path/to/db.sqlite",
            });
        });

        it("should validate required fields", async () => {
            select.mockResolvedValueOnce("postgresql");
            input.mockResolvedValueOnce("localhost");

            await promptForConnectionDetails();

            const userCall = input.mock.calls.find(
                (call) => call[0]?.message === "User:"
            );
            expect(userCall?.[0]?.validate?.("")).toBe("User cannot be empty.");
            expect(userCall?.[0]?.validate?.("validuser")).toBe(true);

            const dbCall = input.mock.calls.find(
                (call) => call[0]?.message === "Database:"
            );
            expect(dbCall?.[0]?.validate?.("")).toBe(
                "Database cannot be empty."
            );
            expect(dbCall?.[0]?.validate?.("validdb")).toBe(true);
        });

        it("should validate SQLite file path", async () => {
            select.mockResolvedValueOnce("sqlite");

            await promptForConnectionDetails();

            const filePathCall = input.mock.calls.find(
                (call) =>
                    call[0]?.message ===
                    "Enter the path to the SQLite database file:"
            );
            expect(filePathCall?.[0]?.validate?.("")).toBe(
                "File path cannot be empty."
            );
            expect(filePathCall?.[0]?.validate?.("/valid/path")).toBe(true);
        });

        it("should use driver defaults for PostgreSQL", async () => {
            getDriverDefaults.mockReturnValue({
                host: "pg-server",
                port: 5433,
                ssl: true,
            });

            select.mockResolvedValueOnce("postgresql");
            input.mockResolvedValueOnce("");
            input.mockResolvedValueOnce("");
            input.mockResolvedValueOnce("user");
            password.mockResolvedValueOnce("");
            input.mockResolvedValueOnce("db");
            confirm.mockResolvedValueOnce(false);

            await promptForConnectionDetails();

            expect(input).toHaveBeenCalledWith({
                message: "Host:",
                default: "pg-server",
            });

            expect(input).toHaveBeenCalledWith({
                message: "Port:",
                default: "5433",
                validate: expect.any(Function),
            });

            expect(confirm).toHaveBeenCalledWith({
                message: "Use SSL?",
                default: true,
            });
        });
    });
});
