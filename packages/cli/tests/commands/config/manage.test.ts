import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeManageCommand } from "../../../src/commands/config/manage";

const { executeAddCommand } = vi.hoisted(() => ({
    executeAddCommand: vi.fn(),
}));
const { executeDefaultCommand } = vi.hoisted(() => ({
    executeDefaultCommand: vi.fn(),
}));
const { executeListCommand } = vi.hoisted(() => ({
    executeListCommand: vi.fn(),
}));
const { executeRemoveCommand } = vi.hoisted(() => ({
    executeRemoveCommand: vi.fn(),
}));
const { executeRenameCommand } = vi.hoisted(() => ({
    executeRenameCommand: vi.fn(),
}));

const { select } = vi.hoisted(() => ({ select: vi.fn() }));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
    },
}));

vi.mock("../../../src/commands/config/add.js", () => ({ executeAddCommand }));
vi.mock("../../../src/commands/config/default.js", () => ({
    executeDefaultCommand,
}));
vi.mock("../../../src/commands/config/list.js", () => ({ executeListCommand }));
vi.mock("../../../src/commands/config/remove.js", () => ({
    executeRemoveCommand,
}));
vi.mock("../../../src/commands/config/rename.js", () => ({
    executeRenameCommand,
}));
vi.mock("@inquirer/prompts", () => ({ select }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executeManageCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should call executeListCommand when 'list' is selected", async () => {
        select
            .mockResolvedValueOnce("list")
            .mockResolvedValueOnce("continue")
            .mockResolvedValueOnce("exit");

        await executeManageCommand();
        expect(executeListCommand).toHaveBeenCalledOnce();
    });

    it("should call executeAddCommand when 'add' is selected", async () => {
        select
            .mockResolvedValueOnce("add")
            .mockResolvedValueOnce("continue")
            .mockResolvedValueOnce("exit");

        await executeManageCommand();
        expect(executeAddCommand).toHaveBeenCalledOnce();
    });

    it("should call executeRemoveCommand when 'remove' is selected", async () => {
        select
            .mockResolvedValueOnce("remove")
            .mockResolvedValueOnce("continue")
            .mockResolvedValueOnce("exit");

        await executeManageCommand();
        expect(executeRemoveCommand).toHaveBeenCalledOnce();
    });

    it("should call executeRenameCommand when 'rename' is selected", async () => {
        select
            .mockResolvedValueOnce("rename")
            .mockResolvedValueOnce("continue")
            .mockResolvedValueOnce("exit");

        await executeManageCommand();
        expect(executeRenameCommand).toHaveBeenCalledOnce();
    });

    it("should call executeDefaultCommand when 'default' is selected", async () => {
        select
            .mockResolvedValueOnce("default")
            .mockResolvedValueOnce("continue")
            .mockResolvedValueOnce("exit");

        await executeManageCommand();
        expect(executeDefaultCommand).toHaveBeenCalledOnce();
    });

    it("should exit when 'exit' is selected", async () => {
        select.mockResolvedValueOnce("exit");

        await executeManageCommand();
        expect(logger.info).toHaveBeenCalledWith("Exiting connection manager.");
        // Ensure no action commands were called
        expect(executeListCommand).not.toHaveBeenCalled();
        expect(executeAddCommand).not.toHaveBeenCalled();
        // Check that the "continue" prompt was not shown
        expect(select).toHaveBeenCalledOnce();
    });
});
