import { loadConfig } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import {
    clearActiveConnection,
    getActiveConnection,
} from "../utils/session.js";

export function executeDisconnectCommand(): void {
    const activeConnection = getActiveConnection();

    if (!activeConnection) {
        logger.info("No active session to disconnect from.");
        return;
    }

    clearActiveConnection();

    const config = loadConfig();
    if (config.defaultConnection) {
        logger.success(
            `Disconnected from '${activeConnection}'. Using default connection now.`
        );
    } else {
        logger.success(`Disconnected from '${activeConnection}'.`);
    }
}
