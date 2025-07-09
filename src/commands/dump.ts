import { confirm, input, select } from "@inquirer/prompts";
import type { DatabaseInfo } from "../types/database.js";
import { ensureCommandsExist } from "../utils/command-check.js";
import { getConnection } from "../utils/config.js";
import { connectToDatabase, getDatabases } from "../utils/database.js";
import {
    createDatabaseDump,
    generateDumpFilename,
} from "../utils/dump-restore.js";
import { logger } from "../utils/logger.js";

export type DumpOptions = {
    database?: string;
    connection?: string;
    format?: "custom" | "plain" | "directory" | "tar";
    output?: string;
    verbose?: boolean;
};

export async function executeDumpCommand(options: DumpOptions): Promise<void> {
    try {
        if (!ensureCommandsExist(["pg_dump"])) {
            return;
        }

        logger.info("Starting database dump process...");

        // Get connection config
        let connection;
        try {
            connection = getConnection(options.connection);
        } catch {
            logger.fail(
                "No database connection found. Run 'dbmux connect' first."
            );
            return;
        }

        if (connection.type !== "postgresql") {
            logger.fail(
                "Dump command is currently only supported for PostgreSQL databases."
            );
            return;
        }

        // Test connection first
        logger.info("Testing database connection...");
        await connectToDatabase(connection);

        // Get available databases
        logger.info("Fetching available databases...");
        const databases: DatabaseInfo[] = await getDatabases();

        if (databases.length === 0) {
            logger.fail("No databases found");
            return;
        }

        // Select database to dump
        let selectedDatabase: string;
        if (options.database) {
            selectedDatabase = options.database;
            const dbExists = databases.some(
                (db) => db.name === selectedDatabase
            );
            if (!dbExists) {
                logger.fail(`Database '${selectedDatabase}' not found`);
                return;
            }
        } else {
            selectedDatabase = await select({
                message: "Select database to dump:",
                choices: databases.map((db: DatabaseInfo) => ({
                    name: `${db.name} (${db.size || "N/A"})`,
                    value: db.name,
                    description: `Owner: ${db.owner || "N/A"} | Tables: ${db.tables || "N/A"} | Encoding: ${db.encoding || "N/A"}`,
                })),
            });
        }

        // Get output filename
        let outputFile: string;
        if (options.output) {
            outputFile = options.output;
        } else {
            const defaultName = generateDumpFilename(selectedDatabase);
            logger.info(`Default filename: ${defaultName}`);

            const customName = await input({
                message: "Enter custom filename (or press Enter for default):",
                default: "",
            });

            outputFile = customName || defaultName;
        }

        // Confirm dump operation
        const shouldProceed = await confirm({
            message: `Create dump of '${selectedDatabase}' as '${outputFile}'?`,
            default: true,
        });

        if (!shouldProceed) {
            logger.info("Dump operation cancelled");
            return;
        }

        // Perform dump
        const dumpPath = await createDatabaseDump(connection, {
            database: selectedDatabase,
            outputFile,
            format: options.format || "custom",
            verbose: options.verbose || false,
        });

        logger.success("Dump completed successfully!");
        logger.info(`File location: ${dumpPath}`);
    } catch (error) {
        logger.fail(`Dump failed: ${error}`);
        process.exit(1);
    }
}
