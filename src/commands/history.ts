import type { OperationType } from "../types/database.js";
import { executeHistoryClearCommand } from "./history/clear.js";
import { executeHistoryListCommand } from "./history/list.js";
import { logger } from "../utils/logger.js";

export type HistoryOptions = {
    action: "list" | "clear";
    limit?: number | undefined;
    type?: OperationType | undefined;
    format?: "table" | "json" | undefined;
};

export async function executeHistoryCommand(
    options: HistoryOptions
): Promise<void> {
    try {
        switch (options.action) {
            case "list":
                await executeHistoryListCommand({
                    limit: options.limit,
                    type: options.type,
                    format: options.format,
                });
                break;
            case "clear":
                await executeHistoryClearCommand(options.type);
                break;
            default:
                logger.fail(`Unknown history action: ${options.action}`);
                process.exit(1);
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(`History command failed: ${errorMessage}`);
        process.exit(1);
    }
}
