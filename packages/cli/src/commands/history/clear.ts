import { confirm } from "@inquirer/prompts";
import { clearDumpHistory } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";
import type { OperationType } from "@dbmux/types/database";

/**
 * Prompts the user for confirmation and clears dump history, optionally scoped to a specific operation type.
 *
 * If the user declines confirmation the operation is cancelled. On success, logs the number of cleared entries.
 *
 * @param operationType - Optional operation type to restrict which history entries are cleared
 */
export async function executeHistoryClearCommand(
    operationType?: OperationType
): Promise<void> {
    const typeLabel = operationType ? `${operationType} ` : "";
    const confirmMessage = `Are you sure you want to clear all ${typeLabel}history?`;

    const shouldClear = await confirm({
        message: confirmMessage,
        default: false,
    });

    if (!shouldClear) {
        logger.info("Clear operation cancelled");
        return;
    }

    const clearedCount = clearDumpHistory(operationType);

    if (clearedCount === 0) {
        logger.info("No history entries to clear");
    } else {
        logger.success(
            `Cleared ${clearedCount} history ${clearedCount === 1 ? "entry" : "entries"}`
        );
    }
}