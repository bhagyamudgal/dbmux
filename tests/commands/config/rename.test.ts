import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeRenameCommand } from "../../../src/commands/config/rename";

const { listConnections, renameConnection } = vi.hoisted(() => ({
    listConnections: vi.fn(),
    renameConnection: vi.fn(),
}));

const { input, select } = vi.hoisted(() => ({
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

vi.mock("../../../src/utils/config.js", () => ({
    listConnections,
    renameConnection,
}));
vi.mock("@inquirer/prompts", () => ({ input, select }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executeRenameCommand", () => {
    const mockConnections = {
        "test-1": {},
        "test-2": {},
    };

    beforeEach(() => {
        vi.resetAllMocks();
        listConnections.mockReturnValue(mockConnections);
    });

    it("should inform the user when no connections exist", async () => {
        listConnections.mockReturnValue({});
        await executeRenameCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "No saved connections to rename."
        );
        expect(renameConnection).not.toHaveBeenCalled();
    });

    it("should rename in non-interactive mode", async () => {
        await executeRenameCommand("test-1", "test-renamed");
        expect(renameConnection).toHaveBeenCalledWith("test-1", "test-renamed");
        expect(logger.success).toHaveBeenCalledWith(
            "Connection 'test-1' renamed to 'test-renamed' successfully."
        );
        expect(select).not.toHaveBeenCalled();
        expect(input).not.toHaveBeenCalled();
    });

    it("should prompt for new name if only old name is provided", async () => {
        input.mockResolvedValue("test-renamed");
        await executeRenameCommand("test-1");
        expect(renameConnection).toHaveBeenCalledWith("test-1", "test-renamed");
        expect(select).not.toHaveBeenCalled();
        expect(input).toHaveBeenCalledOnce();
    });

    it("should prompt for old name if only new name is provided", async () => {
        select.mockResolvedValue("test-2");
        await executeRenameCommand(undefined, "test-renamed");
        expect(renameConnection).toHaveBeenCalledWith("test-2", "test-renamed");
        expect(select).toHaveBeenCalledOnce();
        expect(input).not.toHaveBeenCalled();
    });

    it("should prompt for both names in fully interactive mode", async () => {
        select.mockResolvedValue("test-1");
        input.mockResolvedValue("test-renamed");
        await executeRenameCommand();
        expect(renameConnection).toHaveBeenCalledWith("test-1", "test-renamed");
        expect(select).toHaveBeenCalledOnce();
        expect(input).toHaveBeenCalledOnce();
    });

    it("should handle errors during rename", async () => {
        const error = new Error("Permission denied");
        renameConnection.mockImplementation(() => {
            throw error;
        });
        await executeRenameCommand("test-1", "test-renamed");
        expect(logger.fail).toHaveBeenCalledWith(
            "Failed to rename connection: Permission denied"
        );
    });
});
