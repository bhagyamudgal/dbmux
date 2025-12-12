import Table from "cli-table3";
import { basename } from "path";
import type { DumpHistoryEntry, OperationType } from "../../types/database.js";
import { getDumpHistory } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export type HistoryListOptions = {
    limit?: number | undefined;
    type?: OperationType | undefined;
    format?: "table" | "json" | undefined;
};

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
}

function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
}

function formatStatus(entry: DumpHistoryEntry): string {
    if (entry.deleted) {
        return "DELETED";
    }
    return entry.status === "success" ? "OK" : "FAILED";
}

export async function executeHistoryListCommand(
    options: HistoryListOptions
): Promise<void> {
    const historyOptions: { limit?: number; operationType?: OperationType } =
        {};
    if (options.limit !== undefined) {
        historyOptions.limit = options.limit;
    }
    if (options.type !== undefined) {
        historyOptions.operationType = options.type;
    }

    const history = getDumpHistory(
        Object.keys(historyOptions).length > 0 ? historyOptions : undefined
    );

    if (history.length === 0) {
        logger.info("No history entries found");
        if (options.type) {
            logger.info(`Filter: ${options.type} operations only`);
        }
        return;
    }

    if (options.format === "json") {
        logger.raw(JSON.stringify(history, null, 2));
        return;
    }

    const table = new Table({
        head: [
            "ID",
            "Type",
            "Database",
            "Connection",
            "File",
            "Size",
            "Status",
            "Timestamp",
        ],
        style: { head: ["cyan"] },
    });

    for (const entry of history) {
        table.push([
            entry.id.substring(0, 8),
            entry.operationType,
            entry.database,
            entry.connectionName,
            basename(entry.filePath),
            formatFileSize(entry.fileSize),
            formatStatus(entry),
            formatTimestamp(entry.timestamp),
        ]);
    }

    logger.info(`\nDump/Restore History (${history.length} entries):`);
    logger.raw(table.toString());
}
