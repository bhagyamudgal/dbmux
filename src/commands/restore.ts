import { confirm, input, select } from "@inquirer/prompts";
import fs from "fs";
import { ensureCommandsExist } from "../utils/command-check.js";
import { getConnection } from "../utils/config.js";
import { connectToDatabase, getDatabases } from "../utils/database.js";
import {
    listDumpFiles,
    restoreDatabase,
    verifyDumpFile,
    type DumpFileInfo,
} from "../utils/dump-restore.js";
import { extractMessageFromError } from "../utils/general.js";
import { logger } from "../utils/logger.js";

export type RestoreOptions = {
    file?: string;
    database?: string;
    connection?: string;
    create?: boolean;
    drop?: boolean;
    verbose?: boolean;
};

export async function executeRestoreCommand(
    options: RestoreOptions
): Promise<void> {
    try {
        if (!ensureCommandsExist(["pg_restore", "psql"])) {
            return;
        }

        logger.info("Starting database restore process...");

        // Validate options
        if (options.file && !fs.existsSync(options.file)) {
            logger.fail(`Dump file not found: ${options.file}`);
            return;
        }

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
                "Restore command is currently only supported for PostgreSQL databases."
            );
            return;
        }

        // Test connection first
        logger.info("Testing database connection...");
        await connectToDatabase(connection);

        // Select dump file to restore
        let dumpFile: string;
        if (options.file) {
            dumpFile = options.file;
        } else {
            const dumpFiles = listDumpFiles();

            if (dumpFiles.length === 0) {
                logger.fail("No dump files found in current directory");
                logger.info(
                    "Dump files should have extensions: .dump, .sql, .gz, .tar"
                );
                return;
            }

            dumpFile = await select({
                message: "Select dump file to restore:",
                choices: dumpFiles.map((file: DumpFileInfo) => ({
                    name: `${file.name} (${
                        file.size
                    }) - ${file.modified.toLocaleDateString()}`,
                    value: file.name,
                    description: `Modified: ${file.modified.toLocaleString()}`,
                })),
            });
        }

        // Verify dump file
        logger.info("Verifying dump file...");
        try {
            await verifyDumpFile(dumpFile);
        } catch {
            logger.fail(`Dump file verification failed.`);
            return;
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
                // Get available databases
                logger.info("Fetching available databases...");
                const databases = await getDatabases();

                if (databases.length === 0) {
                    logger.fail("No databases found");
                    return;
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

        // Perform restore
        await restoreDatabase(connection, {
            inputFile: dumpFile,
            targetDatabase,
            createDatabase,
            dropExisting,
            verbose: options.verbose || false,
        });

        logger.success("Restore completed successfully!");
        logger.info(
            `Database '${targetDatabase}' has been restored from '${dumpFile}'`
        );
    } catch (error) {
        logger.fail(
            `Restore failed: ${extractMessageFromError(error, "Unknown error")}`
        );
        process.exit(1);
    }
}
