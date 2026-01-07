import { sync as commandExists } from "command-exists";
import { logger } from "./logger.js";

export function ensureCommandsExist(commands: string[]): boolean {
    const missingCommands = commands.filter((cmd) => !commandExists(cmd));

    if (missingCommands.length > 0) {
        logger.fail(
            `Required command(s) not found: ${missingCommands.join(", ")}`
        );
        logger.info(
            "Please ensure you have the PostgreSQL client tools installed and in your system's PATH."
        );
        logger.info(
            "Installing the PostgreSQL client library will provide all the necessary tools (psql, pg_dump, pg_restore)."
        );
        logger.info("\nInstallation instructions:");
        logger.info("  - macOS (Homebrew): brew install libpq");
        logger.info(
            "  - Debian/Ubuntu: sudo apt-get install postgresql-client"
        );
        logger.info(
            "  - Windows: Install the PostgreSQL interactive installer from the official website."
        );
        return false;
    }
    return true;
}
