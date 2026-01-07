import { loadConfig } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import {
    clearActiveConnection,
    getActiveConnection,
} from "../utils/session.js";

/**
 * Disconnects the currently active session, clears it from session storage, and logs the outcome.
 *
 * If no session is active, logs an informational message and returns without making changes.
 * After clearing the active session, loads the configuration and logs a success message that
 * includes the previously active connection; if a default connection is configured the message
 * indicates the default will be used.
 */
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