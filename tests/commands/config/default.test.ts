import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeDefaultCommand } from "../../../src/commands/config/default";

const { listConnections, setDefaultConnection } = vi.hoisted(() => ({
    listConnections: vi.fn(),
    setDefaultConnection: vi.fn(),
}));

const { input } = vi.hoisted(() => ({ input: vi.fn() }));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock("../../../src/utils/config.js", () => ({
    listConnections,
    setDefaultConnection,
}));
vi.mock("@inquirer/prompts", () => ({ input }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executeDefaultCommand", () => {
    const mockConnections = {
        "test-1": {},
        "test-2": {},
    };

    beforeEach(() => {
        vi.resetAllMocks();
        listConnections.mockReturnValue(mockConnections);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should inform the user when no connections exist", async () => {
        listConnections.mockReturnValue({});
        await executeDefaultCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "No saved connections to set as default."
        );
        expect(setDefaultConnection).not.toHaveBeenCalled();
    });

    it("should set the default connection in non-interactive mode", async () => {
        await executeDefaultCommand("test-1");
        expect(setDefaultConnection).toHaveBeenCalledWith("test-1");
        expect(logger.success).toHaveBeenCalledWith(
            "'test-1' is now the default connection."
        );
    });

    it("should prompt for a name if an invalid one is provided non-interactively", async () => {
        input.mockResolvedValue("test-2");
        await executeDefaultCommand("non-existent");
        expect(input).toHaveBeenCalledOnce();
        expect(setDefaultConnection).toHaveBeenCalledWith("test-2");
    });

    it("should set the default connection in interactive mode", async () => {
        input.mockResolvedValue("test-2");
        await executeDefaultCommand();
        expect(input).toHaveBeenCalledOnce();
        expect(setDefaultConnection).toHaveBeenCalledWith("test-2");
        expect(logger.success).toHaveBeenCalledWith(
            "'test-2' is now the default connection."
        );
    });

    it("should handle errors when setting the default connection", async () => {
        const error = new Error("Config file is read-only");
        setDefaultConnection.mockImplementation(() => {
            throw error;
        });
        const processExit = vi
            .spyOn(process, "exit")
            .mockImplementation((() => {}) as () => never);

        await executeDefaultCommand("test-1");

        expect(logger.fail).toHaveBeenCalledWith("Config file is read-only");
        expect(processExit).toHaveBeenCalledWith(1);
    });
});
