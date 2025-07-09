import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeAddCommand } from "../../../src/commands/config/add";
import type { ConnectionConfig } from "../../../src/types/database";

const { promptForConnectionDetails } = vi.hoisted(() => ({
    promptForConnectionDetails: vi.fn(),
}));
const { testConnection } = vi.hoisted(() => ({ testConnection: vi.fn() }));
const { input } = vi.hoisted(() => ({ input: vi.fn() }));
const { addConnection } = vi.hoisted(() => ({ addConnection: vi.fn() }));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock("../../../src/utils/prompt.js", () => ({ promptForConnectionDetails }));
vi.mock("../../../src/utils/database.js", () => ({ testConnection }));
vi.mock("@inquirer/prompts", () => ({ input }));
vi.mock("../../../src/utils/config.js", () => ({ addConnection }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executeAddCommand", () => {
    const mockPostgresConfig: ConnectionConfig = {
        type: "postgresql",
        host: "localhost",
        port: 5432,
        user: "test",
        database: "testdb",
    };

    beforeEach(() => {
        vi.resetAllMocks();
        promptForConnectionDetails.mockResolvedValue(mockPostgresConfig);
        testConnection.mockResolvedValue(true);
    });

    it("should add a new connection with a custom name", async () => {
        input.mockResolvedValue("my-custom-name");
        await executeAddCommand();

        expect(promptForConnectionDetails).toHaveBeenCalledOnce();
        expect(testConnection).toHaveBeenCalledWith(mockPostgresConfig);
        expect(input).toHaveBeenCalledOnce();
        expect(addConnection).toHaveBeenCalledWith(
            "my-custom-name",
            mockPostgresConfig
        );
        expect(logger.success).toHaveBeenCalledWith(
            "Connection 'my-custom-name' added and saved successfully."
        );
    });

    it("should add a new connection with the default name", async () => {
        input.mockResolvedValue(""); // User presses enter
        await executeAddCommand();

        const expectedDefaultName = "test@localhost/testdb";
        expect(addConnection).toHaveBeenCalledWith(
            expectedDefaultName,
            mockPostgresConfig
        );
        expect(logger.success).toHaveBeenCalledWith(
            `Connection '${expectedDefaultName}' added and saved successfully.`
        );
    });

    it("should fail and not save if the connection test fails", async () => {
        testConnection.mockResolvedValue(false);
        await executeAddCommand();

        expect(logger.fail).toHaveBeenCalledWith(
            "Connection test failed. The connection was not saved. Please check the details and try again."
        );
        expect(addConnection).not.toHaveBeenCalled();
    });

    it("should handle errors when saving the connection", async () => {
        const saveError = new Error("Disk is full");
        addConnection.mockImplementation(() => {
            throw saveError;
        });
        input.mockResolvedValue("bad-save");

        await expect(executeAddCommand()).rejects.toThrow(saveError);

        expect(logger.success).toHaveBeenCalledWith(
            "Connection test successful!"
        );
        expect(addConnection).toHaveBeenCalledWith(
            "bad-save",
            mockPostgresConfig
        );
    });
});
