import { logger } from "../utils/logger.js";
import { executeDbDeleteCommand, type DbDeleteOptions } from "./db/delete.js";

export type DbOptions = {
    action: "delete";
    database?: string;
    connection?: string;
    force?: boolean;
};

export async function executeDbCommand(options: DbOptions): Promise<void> {
    try {
        switch (options.action) {
            case "delete":
                await executeDbDeleteCommand({
                    database: options.database,
                    connection: options.connection,
                    force: options.force,
                } as DbDeleteOptions);
                break;
            default:
                logger.fail(`Unknown db action: ${options.action}`);
                process.exit(1);
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(`Database command failed: ${errorMessage}`);
        process.exit(1);
    }
}
