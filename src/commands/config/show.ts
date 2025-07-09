import { getConfigPath, loadConfig } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export async function executeShowCommand(): Promise<void> {
    const configPath = getConfigPath();
    const config = loadConfig();

    logger.info(`\nConfiguration file: ${configPath}`);
    logger.info("\nCurrent configuration:");
    logger.raw(JSON.stringify(config, null, 2));
    logger.raw("");

    logger.info("Settings:");
    logger.raw(`  Log level: ${config.settings.logLevel}`);
    logger.raw(`  Auto connect: ${config.settings.autoConnect}`);
    logger.raw(`  Query timeout: ${config.settings.queryTimeout}ms`);

    if (config.defaultConnection) {
        logger.raw(`  Default connection: ${config.defaultConnection}`);
    } else {
        logger.info("  Default connection: none");
    }

    logger.info(`\nConnections: ${Object.keys(config.connections).length}`);
    logger.raw("");
}
