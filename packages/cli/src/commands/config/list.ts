import { listConnections, loadConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export async function executeListCommand(): Promise<void> {
    const connections = listConnections();
    const config = loadConfig();

    if (Object.keys(connections).length === 0) {
        logger.info("No saved connections found");
        logger.info("Use 'dbmux connect' to create a connection");
        return;
    }

    logger.info("\nSaved connections:");
    Object.entries(connections).forEach(([name, conn]) => {
        const isDefault = config.defaultConnection === name;
        const marker = isDefault ? " (default)" : "";
        logger.raw(`\n  ${name}${marker}`);
        logger.raw(`    Type: ${conn.type}`);
        if (conn.type === "sqlite") {
            logger.raw(`    File: ${conn.filePath}`);
        } else {
            logger.raw(`    Host: ${conn.host}`);
            logger.raw(`    Port: ${conn.port}`);
            logger.raw(`    User: ${conn.user}`);
            logger.raw(`    Database: ${conn.database}`);
            logger.raw(`    SSL: ${conn.ssl ? "Enabled" : "Disabled"}`);
        }
    });
    logger.raw("");
}
