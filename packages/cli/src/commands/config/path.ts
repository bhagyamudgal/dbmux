import { getConfigPath } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export function executePathCommand(): void {
    const configPath = getConfigPath();
    logger.info(`Configuration file location: ${configPath}`);
}
