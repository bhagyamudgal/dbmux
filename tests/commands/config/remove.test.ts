import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRemoveCommand } from "../../../src/commands/config/remove";

const { listConnections, removeConnection } = vi.hoisted(() => ({
    listConnections: vi.fn(),
    removeConnection: vi.fn(),
}));

const { checkbox, confirm } = vi.hoisted(() => ({
    checkbox: vi.fn(),
    confirm: vi.fn(),
}));

const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock("../../../src/utils/config.js", () => ({
    listConnections,
    removeConnection,
}));
vi.mock("@inquirer/prompts", () => ({ checkbox, confirm }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executeRemoveCommand", () => {
    const mockConnections = {
        "test-1": {},
        "test-2": {},
        "test-3": {},
    };

    beforeEach(() => {
        vi.resetAllMocks();
        listConnections.mockReturnValue(mockConnections);
    });

    it("should inform the user when no connections exist", async () => {
        listConnections.mockReturnValue({});
        await executeRemoveCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "No saved connections to remove."
        );
        expect(removeConnection).not.toHaveBeenCalled();
    });

    it("should remove a specified connection in non-interactive mode", async () => {
        confirm.mockResolvedValue(true);
        await executeRemoveCommand("test-1");
        expect(removeConnection).toHaveBeenCalledWith("test-1");
        expect(logger.success).toHaveBeenCalledWith(
            "Connection 'test-1' removed successfully."
        );
    });

    it("should fail if a specified connection does not exist", async () => {
        await executeRemoveCommand("non-existent");
        expect(logger.fail).toHaveBeenCalledWith(
            "Connection 'non-existent' not found."
        );
        expect(removeConnection).not.toHaveBeenCalled();
    });

    it("should remove selected connections in interactive mode", async () => {
        checkbox.mockResolvedValue(["test-2", "test-3"]);
        confirm.mockResolvedValue(true);
        await executeRemoveCommand();
        expect(removeConnection).toHaveBeenCalledWith("test-2");
        expect(removeConnection).toHaveBeenCalledWith("test-3");
        expect(logger.success).toHaveBeenCalledTimes(2);
    });

    it("should cancel removal if user does not confirm", async () => {
        checkbox.mockResolvedValue(["test-1"]);
        confirm.mockResolvedValue(false);
        await executeRemoveCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "Removal operation cancelled."
        );
        expect(removeConnection).not.toHaveBeenCalled();
    });

    it("should handle no connections being selected in interactive mode", async () => {
        checkbox.mockResolvedValue([]);
        await executeRemoveCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "No connections selected for removal."
        );
        expect(removeConnection).not.toHaveBeenCalled();
    });

    it("should handle errors during connection removal", async () => {
        const error = new Error("Filesystem error");
        removeConnection.mockImplementation((name: string) => {
            if (name === "test-1") {
                throw error;
            }
        });
        confirm.mockResolvedValue(true);
        await executeRemoveCommand("test-1");
        expect(logger.fail).toHaveBeenCalledWith(
            "Failed to remove connection 'test-1': Filesystem error"
        );
    });
});
