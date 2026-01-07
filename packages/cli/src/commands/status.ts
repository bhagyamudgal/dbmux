import { loadConfig } from "../utils/config.js";
import { logger } from "../utils/logger.js";
import { getActiveConnection } from "../utils/session.js";

export function executeStatusCommand(): void {
    const config = loadConfig();
    const defaultConnectionName = config.defaultConnection;
    const activeConnectionName = getActiveConnection();

    logger.info(
        `Default Connection (from config): ${defaultConnectionName || "Not set"}`
    );
    logger.info(
        `Active Connection (current session): ${activeConnectionName || "Not set"}`
    );

    const connectionToShow = activeConnectionName || defaultConnectionName;

    if (!connectionToShow) {
        logger.info("\nNo active or default connection.");
        return;
    }

    const conn = config.connections[connectionToShow];

    if (!conn) {
        logger.fail(
            `Connection '${connectionToShow}' not found in config file.`
        );
        return;
    }

    logger.info(`\nDetails for '${connectionToShow}':`);
    logger.raw(`  Type: ${conn.type}`);
    if (conn.type === "sqlite") {
        logger.raw(`  File: ${conn.filePath}`);
    } else {
        logger.raw(`  Host: ${conn.host}`);
        logger.raw(`  Port: ${conn.port}`);
        logger.raw(`  User: ${conn.user}`);
        logger.raw(`  Database: ${conn.database}`);
        logger.raw(`  SSL: ${conn.ssl ? "Enabled" : "Disabled"}`);
    }
}
