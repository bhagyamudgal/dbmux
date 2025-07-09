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
    logger.success(
        `Disconnected from '${activeConnection}'. Using default connection now.`
    );
}
