import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeDisconnectCommand } from "../src/commands/disconnect";

const { getActiveConnection, clearActiveConnection } = vi.hoisted(() => ({
    getActiveConnection: vi.fn(),
    clearActiveConnection: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        success: vi.fn(),
    },
}));
const { loadConfig } = vi.hoisted(() => ({
    loadConfig: vi.fn(),
}));

vi.mock("../src/utils/session.js", () => ({
    getActiveConnection,
    clearActiveConnection,
}));
vi.mock("../src/utils/logger.js", () => ({ logger }));
vi.mock("../src/utils/config.js", () => ({ loadConfig }));

describe("executeDisconnectCommand", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("should clear the active connection and show default message if default exists", () => {
        getActiveConnection.mockReturnValue("my-active-session");
        loadConfig.mockReturnValue({ defaultConnection: "my-default" });
        executeDisconnectCommand();
        expect(clearActiveConnection).toHaveBeenCalledOnce();
        expect(logger.success).toHaveBeenCalledWith(
            "Disconnected from 'my-active-session'. Using default connection now."
        );
    });

    it("should clear the active connection without default message if no default exists", () => {
        getActiveConnection.mockReturnValue("my-active-session");
        loadConfig.mockReturnValue({});
        executeDisconnectCommand();
        expect(clearActiveConnection).toHaveBeenCalledOnce();
        expect(logger.success).toHaveBeenCalledWith(
            "Disconnected from 'my-active-session'."
        );
    });

    it("should inform the user if no active connection exists", () => {
        getActiveConnection.mockReturnValue(undefined);
        executeDisconnectCommand();
        expect(logger.info).toHaveBeenCalledWith(
            "No active session to disconnect from."
        );
        expect(clearActiveConnection).not.toHaveBeenCalled();
    });
});
