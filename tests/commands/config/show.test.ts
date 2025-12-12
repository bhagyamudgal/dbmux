import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeShowCommand } from "../../../src/commands/config/show";
import type { DBmuxConfig } from "../../../src/types/database";

const { getConfigPath, loadConfig } = vi.hoisted(() => ({
    getConfigPath: vi.fn(),
    loadConfig: vi.fn(),
}));

const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        raw: vi.fn(),
    },
}));

vi.mock("../../../src/utils/config.js", () => ({ getConfigPath, loadConfig }));
vi.mock("../../../src/utils/logger.js", () => ({ logger }));

describe("executeShowCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should display the full configuration details", async () => {
        const mockConfig: DBmuxConfig = {
            connections: { "test-1": { type: "postgresql" } },
            defaultConnection: "test-1",
            settings: {
                logLevel: "debug",
                autoConnect: true,
                queryTimeout: 10000,
            },
            dumpHistory: [],
        };
        getConfigPath.mockReturnValue("/fake/path/to/config.json");
        loadConfig.mockReturnValue(mockConfig);

        await executeShowCommand();

        const infoCalls = logger.info.mock.calls.flat();
        expect(infoCalls).toEqual([
            "\nConfiguration file: /fake/path/to/config.json",
            "\nCurrent configuration:",
            "Settings:",
            "\nConnections: 1",
        ]);

        const rawCalls = logger.raw.mock.calls.flat();
        expect(rawCalls).toEqual([
            JSON.stringify(mockConfig, null, 2),
            "",
            "  Log level: debug",
            "  Auto connect: true",
            "  Query timeout: 10000ms",
            "  Default connection: test-1",
            "",
        ]);
    });

    it("should display correctly with a minimal configuration", async () => {
        const mockConfig: DBmuxConfig = {
            connections: {},
            settings: {
                logLevel: "info",
                autoConnect: false,
                queryTimeout: 30000,
            },
            dumpHistory: [],
        };
        getConfigPath.mockReturnValue("/fake/path/to/config.json");
        loadConfig.mockReturnValue(mockConfig);

        await executeShowCommand();

        expect(logger.info).toHaveBeenCalledWith("  Default connection: none");
        expect(logger.info).toHaveBeenCalledWith("\nConnections: 0");
    });
});
