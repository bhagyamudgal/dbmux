import type { QueryResult } from "@dbmux/types/database";
import Table from "cli-table3";
import { readFileSync } from "fs";
import { withDatabaseConnection } from "../utils/command-runner.js";
import { executeQuery } from "../utils/database.js";
import { logger } from "../utils/logger.js";

export type QueryOptions = {
    sql?: string;
    file?: string;
    connection?: string;
    database?: string;
    format?: "table" | "json" | "csv";
    limit?: number;
};

export async function executeQueryCommand(
    options: QueryOptions
): Promise<void> {
    await withDatabaseConnection(
        options.connection,
        async () => {
            const sql = getQuery(options);
            if (!sql) {
                logger.fail("No SQL query provided. Use --sql or --file.");
                return;
            }

            const result = await executeQuery(sql);
            displayResults(result, options.format || "table");
        },
        options.database
    );
}

function getQuery(options: QueryOptions): string | null {
    if (!options.sql && !options.file) {
        logger.fail(
            "Please provide either a SQL query with -q or a file with -f"
        );
        process.exit(1);
    }

    if (options.sql && options.file) {
        logger.fail(
            "Please provide either SQL query (-q) or file (-f), not both"
        );
        process.exit(1);
    }

    let sql: string;
    if (options.file) {
        try {
            sql = readFileSync(options.file, "utf-8").trim();
        } catch (error) {
            logger.fail(`Failed to read file '${options.file}': ${error}`);
            process.exit(1);
        }
    } else {
        sql = options.sql!;
    }

    if (!sql) {
        logger.fail("SQL query is empty");
        process.exit(1);
    }

    if (options.limit && !sql.toLowerCase().includes("limit")) {
        sql = `${sql.replace(/;?\s*$/, "")} LIMIT ${options.limit}`;
    }

    return sql;
}

function displayResults(result: QueryResult, format: "table" | "json" | "csv") {
    if (result.rowCount === 0) {
        logger.info("Query returned 0 rows.");
        return;
    }

    switch (format) {
        case "json":
            logger.raw(JSON.stringify(result.rows, null, 2));
            break;
        case "csv":
            printCsv(result);
            break;
        case "table":
        default:
            printTable(result);
            break;
    }

    logger.success(
        `Query successful: ${result.rowCount} rows in ${result.executionTime}ms`
    );
}

function printTable(result: QueryResult) {
    const { fields, rows } = result;
    const table = new Table({
        head: fields,
        colWidths: fields.map(() => 20),
        wordWrap: true,
    });

    if (rows.length > 0) {
        table.push(...rows.map((row) => Object.values(row).map(String)));
    }
    logger.raw(table.toString());
}

function printCsv(result: QueryResult) {
    const { fields, rows } = result;
    const csvRows: string[] = [];

    // Header
    csvRows.push(fields.join(","));

    // Data rows
    for (const row of rows) {
        csvRows.push(
            fields
                .map(
                    (field) =>
                        `"${String(row[field] ?? "").replace(/"/g, '""')}"`
                )
                .join(",")
        );
    }

    logger.raw(csvRows.join("\n"));
}
