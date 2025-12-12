import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeConnectCommand } from "../src/commands/connect";

const {
    getConnection,
    addConnection,
    getConnectionsSortedByLastUsed,
    updateConnectionLastUsed,
} = vi.hoisted(() => ({
    getConnection: vi.fn(),
    addConnection: vi.fn(),
    getConnectionsSortedByLastUsed: vi.fn(),
    updateConnectionLastUsed: vi.fn(),
}));
const { connectToDatabase, testConnection, closeConnection } = vi.hoisted(
    () => ({
        connectToDatabase: vi.fn(),
        testConnection: vi.fn(),
        closeConnection: vi.fn(),
    })
);
const { promptForConnectionDetails } = vi.hoisted(() => ({
    promptForConnectionDetails: vi.fn(),
}));
const { setActiveConnection } = vi.hoisted(() => ({
    setActiveConnection: vi.fn(),
}));
const { confirm, input, select } = vi.hoisted(() => ({
    confirm: vi.fn(),
    input: vi.fn(),
    select: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        fail: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock("../src/utils/config.js", () => ({
    getConnection,
    addConnection,
    getConnectionsSortedByLastUsed,
    updateConnectionLastUsed,
}));
vi.mock("../src/utils/database.js", () => ({
    connectToDatabase,
    testConnection,
    closeConnection,
}));
vi.mock("../src/utils/prompt.js", () => ({
    promptForConnectionDetails,
}));
vi.mock("../src/utils/session.js", () => ({ setActiveConnection }));
vi.mock("@inquirer/prompts", () => ({ confirm, input, select }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

describe("executeConnectCommand", () => {
    const mockSavedConfig = { type: "postgresql", user: "saved" };
    const mockNewConfig = { type: "postgresql", user: "new" };

    beforeEach(() => {
        vi.resetAllMocks();
        testConnection.mockResolvedValue(true);
        getConnectionsSortedByLastUsed.mockReturnValue([
            { name: "saved", config: mockSavedConfig },
        ]);
        getConnection.mockReturnValue(mockSavedConfig);
        promptForConnectionDetails.mockResolvedValue(mockNewConfig);
    });

    it("should connect using a named connection", async () => {
        await executeConnectCommand({ name: "saved" });
        expect(getConnection).toHaveBeenCalledWith("saved");
        expect(setActiveConnection).toHaveBeenCalledWith("saved");
        expect(connectToDatabase).toHaveBeenCalledWith(mockSavedConfig);
        expect(logger.success).toHaveBeenCalledWith(
            "Connection test successful!"
        );
    });

    it("should fall through to interactive if named connection not found", async () => {
        getConnection.mockImplementation(() => {
            throw new Error("not found");
        });
        select.mockResolvedValue("new");
        confirm.mockResolvedValue(false); // Don't save
        await executeConnectCommand({ name: "not-found" });
        expect(logger.warn).toHaveBeenCalledWith(
            "Connection 'not-found' not found.  Proceeding to create a new one."
        );
        expect(connectToDatabase).toHaveBeenCalledWith(mockNewConfig);
    });

    it("should allow selecting a saved connection interactively", async () => {
        select.mockResolvedValue("saved");
        await executeConnectCommand({});
        expect(setActiveConnection).toHaveBeenCalledWith("saved");
        expect(connectToDatabase).toHaveBeenCalledWith(mockSavedConfig);
    });

    it("should create, save, and connect to a new connection", async () => {
        select.mockResolvedValue("new");
        confirm.mockResolvedValue(true);
        input.mockResolvedValue("my-new-conn");
        await executeConnectCommand({});
        expect(addConnection).toHaveBeenCalledWith(
            "my-new-conn",
            mockNewConfig
        );
        expect(setActiveConnection).toHaveBeenCalledWith("my-new-conn");
        expect(connectToDatabase).toHaveBeenCalledWith(mockNewConfig);
    });

    it("should create but not save a new connection", async () => {
        select.mockResolvedValue("new");
        confirm.mockResolvedValue(false); // Don't save
        await executeConnectCommand({});
        expect(addConnection).not.toHaveBeenCalled();
        expect(setActiveConnection).not.toHaveBeenCalled(); // Should not be set if not saved
        expect(connectToDatabase).toHaveBeenCalledWith(mockNewConfig);
    });

    it("should stop if connection test fails", async () => {
        testConnection.mockResolvedValue(false);
        await executeConnectCommand({ name: "saved" });
        expect(logger.fail).toHaveBeenCalledWith(
            "Failed to connect. Please check credentials and settings."
        );
        expect(connectToDatabase).not.toHaveBeenCalled();
    });

    it("should not establish connection in test mode", async () => {
        await executeConnectCommand({ name: "saved", test: true });
        expect(logger.info).toHaveBeenCalledWith(
            "Test mode - connection not established."
        );
        expect(connectToDatabase).not.toHaveBeenCalled();
        expect(closeConnection).not.toHaveBeenCalled();
    });

    describe("URL connection support", () => {
        it("should connect using a valid PostgreSQL URL", async () => {
            const url = "postgresql://user:pass@localhost:5432/mydb";
            await executeConnectCommand({ url });

            // Should call testConnection with parsed config
            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "localhost",
                port: 5432,
                user: "user",
                password: "pass",
                database: "mydb",
                ssl: false,
            });
            expect(connectToDatabase).toHaveBeenCalled();
        });

        it("should connect using a postgres:// protocol URL", async () => {
            const url =
                "postgres://admin:secret@db.example.com:5433/production";
            await executeConnectCommand({ url });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "db.example.com",
                port: 5433,
                user: "admin",
                password: "secret",
                database: "production",
                ssl: false,
            });
        });

        it("should parse URL with SSL parameters", async () => {
            const url = "postgresql://user@host:5432/db?ssl=true";
            await executeConnectCommand({ url });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "host",
                port: 5432,
                user: "user",
                database: "db",
                ssl: true,
            });
        });

        it("should parse URL with sslmode=require", async () => {
            const url = "postgresql://user@host:5432/db?sslmode=require";
            await executeConnectCommand({ url });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "host",
                port: 5432,
                user: "user",
                database: "db",
                ssl: true,
            });
        });

        it("should handle SQLite URL", async () => {
            const url = "sqlite:///path/to/database.db";
            await executeConnectCommand({ url });

            expect(testConnection).toHaveBeenCalledWith({
                type: "sqlite",
                filePath: "/path/to/database.db",
                ssl: false,
            });
        });

        it("should use default host and port when missing from URL", async () => {
            const url = "postgresql://user@localhost/mydb";
            await executeConnectCommand({ url });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "localhost",
                port: 5432, // Should default to 5432 for PostgreSQL
                user: "user",
                database: "mydb",
                ssl: false,
            });
        });

        it("should handle URL without password", async () => {
            const url = "postgresql://user@localhost/mydb";
            await executeConnectCommand({ url });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "localhost",
                port: 5432,
                user: "user",
                database: "mydb",
                ssl: false,
            });
        });

        it("should prompt to save URL connection", async () => {
            const url = "postgresql://user:pass@localhost:5432/mydb";
            confirm.mockResolvedValue(true);
            input.mockResolvedValue("my-url-connection");

            await executeConnectCommand({ url });

            expect(confirm).toHaveBeenCalledWith({
                message: "Do you want to save this new connection?",
                default: true,
            });
            expect(input).toHaveBeenCalledWith({
                message:
                    "Enter a name for this connection (or press Enter for default):",
                default: "user@localhost/mydb",
            });
            expect(addConnection).toHaveBeenCalledWith("my-url-connection", {
                type: "postgresql",
                host: "localhost",
                port: 5432,
                user: "user",
                password: "pass",
                database: "mydb",
                ssl: false,
            });
        });

        it("should use default name for SQLite URL connection", async () => {
            const url = "sqlite:///data/app.db";
            confirm.mockResolvedValue(true);
            input.mockResolvedValue(""); // User presses Enter for default

            await executeConnectCommand({ url });

            expect(input).toHaveBeenCalledWith({
                message:
                    "Enter a name for this connection (or press Enter for default):",
                default: "sqlite-app",
            });
            expect(addConnection).toHaveBeenCalledWith("sqlite-app", {
                type: "sqlite",
                filePath: "/data/app.db",
                ssl: false,
            });
        });

        it("should not save URL connection if user declines", async () => {
            const url = "postgresql://user@localhost/mydb";
            confirm.mockResolvedValue(false);

            await executeConnectCommand({ url });

            expect(addConnection).not.toHaveBeenCalled();
            expect(setActiveConnection).not.toHaveBeenCalled();
            expect(connectToDatabase).toHaveBeenCalled(); // But should still connect
        });
    });

    describe("Individual connection options", () => {
        it("should connect using individual host/user/database options", async () => {
            await executeConnectCommand({
                host: "myhost",
                user: "myuser",
                database: "mydb",
                port: 5433,
                ssl: true,
            });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql", // Should default to postgresql
                host: "myhost",
                port: 5433,
                user: "myuser",
                database: "mydb",
                ssl: true,
            });
        });

        it("should prompt to save individual options connection", async () => {
            confirm.mockResolvedValue(true);
            input.mockResolvedValue("individual-connection");

            await executeConnectCommand({
                host: "myhost",
                user: "myuser",
                database: "mydb",
            });

            expect(confirm).toHaveBeenCalledWith({
                message: "Do you want to save this new connection?",
                default: true,
            });
            expect(addConnection).toHaveBeenCalled();
        });

        it("should use default values for missing individual options", async () => {
            await executeConnectCommand({ user: "myuser" });

            expect(testConnection).toHaveBeenCalledWith({
                type: "postgresql",
                host: "localhost", // Should default
                port: 5432, // Should default
                user: "myuser",
                ssl: false, // Should default
            });
        });
    });
});
