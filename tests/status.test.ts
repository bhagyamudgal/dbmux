import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeStatusCommand } from "../src/commands/status";
import type { DBmuxConfig } from "../src/types/database";

const { loadConfig } = vi.hoisted(() => ({ loadConfig: vi.fn() }));
const { getActiveConnection } = vi.hoisted(() => ({
    getActiveConnection: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        fail: vi.fn(),
        raw: vi.fn(),
    },
}));

vi.mock("../src/utils/config.js", () => ({ loadConfig }));
vi.mock("../src/utils/session.js", () => ({ getActiveConnection }));
vi.mock("../src/utils/logger.js", () => ({ logger }));

describe("executeStatusCommand", () => {
    const mockConfig: DBmuxConfig = {
        connections: {
            default: { type: "postgresql", user: "default_user" },
            active: { type: "postgresql", user: "active_user" },
        },
        defaultConnection: "default",
        settings: {
            logLevel: "info",
            autoConnect: false,
            queryTimeout: 30000,
        },
        dumpHistory: [],
    };

    beforeEach(() => {
        vi.resetAllMocks();
        loadConfig.mockReturnValue(mockConfig);
    });

    it("should show active connection details when both active and default are set", () => {
        getActiveConnection.mockReturnValue("active");
        executeStatusCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "Active Connection (current session): active"
        );
        expect(logger.raw).toHaveBeenCalledWith("  User: active_user");
    });

    it("should show default connection details when only default is set", () => {
        getActiveConnection.mockReturnValue(undefined);
        executeStatusCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "Active Connection (current session): Not set"
        );
        expect(logger.raw).toHaveBeenCalledWith("  User: default_user");
    });

    it("should show a message when neither active nor default is set", () => {
        loadConfig.mockReturnValue({
            connections: {},
            settings: { ...mockConfig.settings },
        });
        getActiveConnection.mockReturnValue(undefined);
        executeStatusCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "Default Connection (from config): Not set"
        );
        expect(logger.info).toHaveBeenCalledWith(
            "\nNo active or default connection."
        );
    });

    it("should show an error if the connection details are not found", () => {
        loadConfig.mockReturnValue({
            ...mockConfig,
            connections: {}, // No connections in config
        });
        getActiveConnection.mockReturnValue("active"); // But an active one is set
        executeStatusCommand();
        expect(logger.fail).toHaveBeenCalledWith(
            "Connection 'active' not found in config file."
        );
    });
});
