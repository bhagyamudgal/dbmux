import type { DumpHistoryEntry } from "@dbmux/types/database";
import { DUMPS_DIR } from "@dbmux/utils/constants";
import { extractMessageFromError } from "@dbmux/utils/general";
import { confirm, input, select } from "@inquirer/prompts";
import fs from "fs";
import { basename, dirname, isAbsolute, join } from "path";
import { ensureCommandsExist } from "../utils/command-check.js";
import {
    addDumpHistory,
    getConnection,
    getSuccessfulDumps,
    loadConfig,
} from "../utils/config.js";
import { connectToDatabase, getDatabases } from "../utils/database.js";
import {
    listDumpFiles,
    restoreDatabase,
    verifyDumpFile,
    type DumpFileInfo,
} from "../utils/dump-restore.js";
import { logger } from "../utils/logger.js";
import { getActiveConnection } from "../utils/session.js";

export type RestoreOptions = {
    file?: string;
    database?: string;
    connection?: string;
    create?: boolean;
    drop?: boolean;
    verbose?: boolean;
    fromHistory?: boolean;
};

function formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
}

function resolveDumpFilePath(filePath: string): string | null {
    if (isAbsolute(filePath)) {
        return fs.existsSync(filePath) ? filePath : null;
    }

    const dumpsPath = join(DUMPS_DIR, filePath);
    if (fs.existsSync(dumpsPath)) {
        return dumpsPath;
    }

    const cwdPath = join(process.cwd(), filePath);
    if (fs.existsSync(cwdPath)) {
        return cwdPath;
    }

    return null;
}

/**
 * Run the interactive restore workflow to restore a database from a dump file.
 *
 * Validates required external commands and connection configuration, resolves or prompts for a dump file (from path, dumps directory, or history), verifies the dump format, selects or creates the target database (optionally dropping an existing database), prompts for final confirmation, executes the restore, and records the outcome in dump history while logging progress. On critical failures or when the operation is cancelled, the process may be terminated.
 *
 * @param options - Restore options that control behavior and non-interactive overrides:
 *   - file: optional path to a dump file to restore
 *   - database: optional target database name
 *   - connection: optional connection name to use
 *   - create: if true, create the target database before restoring
 *   - drop: if true, drop the existing target database before restoring
 *   - verbose: enable verbose restore output
 *   - fromHistory: if true, select the dump from recent successful dump history
 */
export async function executeRestoreCommand(
    options: RestoreOptions
): Promise<void> {
    try {
        if (!ensureCommandsExist(["pg_restore", "psql"])) {
            return;
        }

        logger.info("Starting database restore process...");

        // Validate and resolve file path
        if (options.file) {
            const resolved = resolveDumpFilePath(options.file);
            if (!resolved) {
                logger.fail(`Dump file not found: ${options.file}`);
                logger.info(`Checked: ${DUMPS_DIR} and ${process.cwd()}`);
                process.exit(1);
            }
            options.file = resolved;
        }

        // Get connection config
        let connection;
        try {
            connection = getConnection(options.connection);
        } catch {
            logger.fail(
                "No database connection found. Run 'dbmux connect' first."
            );
            process.exit(1);
        }

        if (connection.type !== "postgresql") {
            logger.fail(
                "Restore command is currently only supported for PostgreSQL databases."
            );
            process.exit(1);
        }

        // Connect to database for operations
        await connectToDatabase(connection);

        // Select dump file to restore
        let dumpFile: string;
        let selectedHistoryEntry: DumpHistoryEntry | undefined;

        if (options.fromHistory) {
            const successfulDumps = getSuccessfulDumps(20);

            if (successfulDumps.length === 0) {
                logger.fail("No successful dumps found in history");
                logger.info(
                    "Run 'dbmux dump' to create a database backup first"
                );
                process.exit(1);
            }

            const selectedId = await select({
                message: "Select dump from history:",
                choices: successfulDumps.map((entry) => ({
                    name: `${entry.database} - ${new Date(entry.timestamp).toLocaleString()} (${formatFileSize(entry.fileSize)})`,
                    value: entry.id,
                    description: `Connection: ${entry.connectionName} | File: ${basename(entry.filePath)}`,
                })),
            });

            selectedHistoryEntry = successfulDumps.find(
                (e) => e.id === selectedId
            );
            if (!selectedHistoryEntry) {
                logger.fail("Selected history entry not found");
                process.exit(1);
            }

            if (!fs.existsSync(selectedHistoryEntry.filePath)) {
                logger.fail(
                    `Dump file no longer exists: ${selectedHistoryEntry.filePath}`
                );
                process.exit(1);
            }

            dumpFile = selectedHistoryEntry.filePath;
        } else if (options.file) {
            dumpFile = options.file;
        } else {
            const allDumps = listDumpFiles(DUMPS_DIR);

            if (allDumps.length === 0) {
                logger.fail("No dump files found");
                logger.info(`Checked: ${DUMPS_DIR}`);
                logger.info(
                    "Dump files should have extensions: .dump, .dmp, .sql, .gz, .tar"
                );
                logger.info(
                    "Use --file <path> to specify a file from another location"
                );
                process.exit(1);
            }

            dumpFile = await select({
                message: "Select dump file to restore:",
                choices: allDumps.map((file: DumpFileInfo) => ({
                    name: `${file.name} (${file.size}) - ${file.modified.toLocaleDateString()}`,
                    value: file.path,
                    description: `Location: ${dirname(file.path)}`,
                })),
            });
        }

        // Verify dump file
        logger.info("Verifying dump file...");
        let isCustomFormat: boolean;
        try {
            isCustomFormat = await verifyDumpFile(dumpFile);
        } catch {
            logger.fail("Dump file verification failed.");
            process.exit(1);
        }

        // Select restore target
        let targetDatabase: string;
        let createDatabase = false;
        let dropExisting = false;

        if (options.database) {
            targetDatabase = options.database;
            if (options.create) {
                createDatabase = true;
            } else if (options.drop) {
                dropExisting = true;
            } else {
                // Ask what to do
                const action = await select({
                    message: `Database '${targetDatabase}' - what should we do?`,
                    choices: [
                        {
                            name: "Drop and recreate (WARNING: All data will be lost)",
                            value: "drop",
                            description:
                                "Delete existing database and create fresh one",
                        },
                        {
                            name: "Restore to existing database",
                            value: "existing",
                            description:
                                "Restore into current database (may cause conflicts)",
                        },
                    ],
                });

                dropExisting = action === "drop";
            }
        } else {
            const restoreAction = await select({
                message: "How do you want to restore?",
                choices: [
                    {
                        name: "Restore to existing database",
                        value: "existing",
                        description:
                            "Select from available databases (will drop and recreate)",
                    },
                    {
                        name: "Create new database",
                        value: "new",
                        description: "Create a new database for the restore",
                    },
                ],
            });

            if (restoreAction === "existing") {
                // Get available databases (cached for performance)
                logger.info("Fetching available databases...");
                const databases = await getDatabases();

                if (databases.length === 0) {
                    logger.fail("No databases found");
                    process.exit(1);
                }

                targetDatabase = await select({
                    message:
                        "Select database to restore to (will be dropped and recreated):",
                    choices: databases.map((db) => ({
                        name: `${db.name} (${db.size || "N/A"})`,
                        value: db.name,
                        description: `Owner: ${db.owner || "N/A"} | Tables: ${db.tables || "N/A"} | WARNING: Will be deleted!`,
                    })),
                });

                // Confirm dangerous operation
                const confirmed = await confirm({
                    message: `⚠️  DANGER: This will DELETE all data in '${targetDatabase}' and replace it. Continue?`,
                    default: false,
                });

                if (!confirmed) {
                    logger.info("Restore operation cancelled");
                    return;
                }

                dropExisting = true;
            } else {
                // Create new database
                targetDatabase = await input({
                    message: "Enter name for new database:",
                    validate: (value: string) => {
                        if (!value.trim()) {
                            return "Database name cannot be empty";
                        }
                        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                            return "Database name must start with a letter and contain only letters, numbers, and underscores";
                        }
                        return true;
                    },
                });

                createDatabase = true;
            }
        }

        // Final confirmation
        const action = createDatabase
            ? "create new"
            : dropExisting
              ? "drop and recreate"
              : "restore to existing";
        const shouldProceed = await confirm({
            message: `Restore '${dumpFile}' to database '${targetDatabase}' (${action})?`,
            default: true,
        });

        if (!shouldProceed) {
            logger.info("Restore operation cancelled");
            return;
        }

        // Get connection name for history tracking
        const config = loadConfig();
        const activeConnectionName = getActiveConnection();
        const connectionName =
            options.connection ??
            activeConnectionName ??
            config.defaultConnection ??
            "unknown";

        // Perform restore
        try {
            await restoreDatabase(connection, {
                inputFile: dumpFile,
                targetDatabase,
                createDatabase,
                dropExisting,
                verbose: options.verbose || false,
                isCustomFormat,
            });

            const fileStats = fs.statSync(dumpFile);
            addDumpHistory({
                operationType: "restore",
                timestamp: new Date().toISOString(),
                database: targetDatabase,
                connectionName,
                filePath: dumpFile,
                fileSize: fileStats.size,
                status: "success",
            });

            logger.success("Restore completed successfully!");
            logger.info(
                `Database '${targetDatabase}' has been restored from '${basename(dumpFile)}'`
            );
        } catch (restoreError) {
            addDumpHistory({
                operationType: "restore",
                timestamp: new Date().toISOString(),
                database: targetDatabase,
                connectionName,
                filePath: dumpFile,
                fileSize: 0,
                status: "failed",
                errorMessage:
                    restoreError instanceof Error
                        ? restoreError.message
                        : String(restoreError),
            });
            throw restoreError;
        }
    } catch (error) {
        logger.fail(
            `Restore failed: ${extractMessageFromError(error, "Unknown error")}`
        );
        process.exit(1);
    }
}