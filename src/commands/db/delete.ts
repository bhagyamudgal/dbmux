import { confirm, select } from "@inquirer/prompts";
import type { DatabaseInfo } from "../../types/database.js";
import { ensureCommandsExist } from "../../utils/command-check.js";
import { getConnection } from "../../utils/config.js";
import { connectToDatabase, getDatabases } from "../../utils/database.js";
import { executeCommand } from "../../utils/dump-restore.js";
import { logger } from "../../utils/logger.js";

export type DbDeleteOptions = {
    database?: string;
    connection?: string;
    force?: boolean;
};

function isValidDatabaseName(name: string): boolean {
    // PostgreSQL identifiers: start with letter/underscore, contain only
    // letters, digits, underscores, dollar signs. Max 63 characters.
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_$]*$/;
    return name.length > 0 && name.length <= 63 && validPattern.test(name);
}

function escapeStringLiteral(value: string): string {
    return value.replace(/'/g, "''");
}

function escapeIdentifier(value: string): string {
    return value.replace(/"/g, '""');
}

async function dropDatabase(
    connection: {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
    },
    databaseName: string
): Promise<void> {
    if (!isValidDatabaseName(databaseName)) {
        throw new Error(
            `Invalid database name '${databaseName}'. Names must start with a letter or underscore, contain only letters, digits, underscores, or dollar signs, and be at most 63 characters.`
        );
    }

    const env: Record<string, string> = {};
    if (connection.password) {
        env.PGPASSWORD = connection.password;
    }

    const escapedLiteral = escapeStringLiteral(databaseName);
    const escapedIdentifier = escapeIdentifier(databaseName);

    logger.info("Terminating active connections...");
    const terminateArgs = [
        "--host",
        connection.host || "localhost",
        "--port",
        String(connection.port || 5432),
        "--username",
        connection.user || "postgres",
        "--dbname",
        "postgres",
        "--command",
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${escapedLiteral}' AND pid <> pg_backend_pid();`,
    ];

    await executeCommand("psql", terminateArgs, env);

    logger.info(`Dropping database '${databaseName}'...`);
    const dropArgs = [
        "--host",
        connection.host || "localhost",
        "--port",
        String(connection.port || 5432),
        "--username",
        connection.user || "postgres",
        "--dbname",
        "postgres",
        "--command",
        `DROP DATABASE IF EXISTS "${escapedIdentifier}";`,
    ];

    const dropResult = await executeCommand("psql", dropArgs, env);

    if (!dropResult.success) {
        throw new Error(
            `Failed to drop database '${databaseName}': ${dropResult.error}`
        );
    }
}

export async function executeDbDeleteCommand(
    options: DbDeleteOptions
): Promise<void> {
    try {
        if (!ensureCommandsExist(["psql"])) {
            return;
        }

        logger.info("Starting database delete process...");

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
                "Database delete is currently only supported for PostgreSQL."
            );
            process.exit(1);
        }

        await connectToDatabase(connection);

        let selectedDatabase: string;
        if (options.database) {
            selectedDatabase = options.database;

            logger.info("Verifying database exists...");
            const databases: DatabaseInfo[] = await getDatabases();
            const dbExists = databases.some(
                (db) => db.name === selectedDatabase
            );
            if (!dbExists) {
                logger.fail(`Database '${selectedDatabase}' not found`);
                process.exit(1);
            }
        } else {
            logger.info("Fetching available databases...");
            const databases: DatabaseInfo[] = await getDatabases();

            if (databases.length === 0) {
                logger.fail("No databases found");
                process.exit(1);
            }

            const systemDbs = ["postgres", "template0", "template1"];
            const userDatabases = databases.filter(
                (db) => !systemDbs.includes(db.name)
            );

            if (userDatabases.length === 0) {
                logger.fail(
                    "No user databases found (only system databases exist)"
                );
                process.exit(1);
            }

            selectedDatabase = await select({
                message: "Select database to delete:",
                choices: userDatabases.map((db: DatabaseInfo) => ({
                    name: `${db.name} (${db.size || "N/A"})`,
                    value: db.name,
                    description: `Owner: ${db.owner || "N/A"} | Tables: ${db.tables || "N/A"}`,
                })),
            });
        }

        if (!options.force) {
            logger.raw("");
            logger.raw(
                "WARNING: This will permanently delete the database and ALL its data!"
            );
            logger.raw(`Database: ${selectedDatabase}`);
            logger.raw("");

            const shouldProceed = await confirm({
                message: `Are you absolutely sure you want to DELETE '${selectedDatabase}'?`,
                default: false,
            });

            if (!shouldProceed) {
                logger.info("Delete operation cancelled");
                return;
            }

            const doubleConfirm = await confirm({
                message: `Type 'yes' to confirm deletion of '${selectedDatabase}'. This cannot be undone.`,
                default: false,
            });

            if (!doubleConfirm) {
                logger.info("Delete operation cancelled");
                return;
            }
        }

        await dropDatabase(connection, selectedDatabase);

        logger.success(`Database '${selectedDatabase}' has been deleted`);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(`Database delete failed: ${errorMessage}`);
        process.exit(1);
    }
}
