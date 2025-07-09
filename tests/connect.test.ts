import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeConnectCommand } from "../src/commands/connect";

const { getConnection, listConnections, addConnection } = vi.hoisted(() => ({
    getConnection: vi.fn(),
    listConnections: vi.fn(),
    addConnection: vi.fn(),
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
    listConnections,
    addConnection,
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
        listConnections.mockReturnValue({ saved: mockSavedConfig });
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
});
