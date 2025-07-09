import { beforeEach, describe, expect, it, vi } from "vitest";
import { executePathCommand } from "../../../src/commands/config/path";

const { getConfigPath } = vi.hoisted(() => ({
    getConfigPath: vi.fn(),
}));

const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
    },
}));

vi.mock("../../../src/utils/config.js", () => ({ getConfigPath }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executePathCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should display the configuration file path", () => {
        const fakePath = "/home/user/.dbmux/config.json";
        getConfigPath.mockReturnValue(fakePath);

        executePathCommand();

        expect(logger.info).toHaveBeenCalledWith(
            `Configuration file location: ${fakePath}`
        );
    });
});
