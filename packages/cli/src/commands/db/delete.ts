import { confirm, select } from "@inquirer/prompts";
import { createDriver } from "../../db-drivers/driver-factory.js";
import { getConnection } from "../../utils/config.js";
import { connectToDatabase, getDatabases } from "../../utils/database.js";
import { logger } from "../../utils/logger.js";
import type { ConnectionConfig, DatabaseInfo } from "@dbmux/types/database";

export type DbDeleteOptions = {
    database?: string;
    connection?: string;
    force?: boolean;
};

export class DbDeleteError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DbDeleteError";
    }
}

/**
 * Delete a PostgreSQL database, prompting for selection and confirmations when needed.
 *
 * Attempts to resolve the named connection, ensures it is PostgreSQL, selects or verifies
 * the target database, optionally prompts for two confirmations (unless `force` is set),
 * terminates active connections to the target database and then drops it.
 *
 * @param options - Operation options:
 *   - `database`: optional database name to delete (if omitted, the user is prompted);
 *   - `connection`: optional connection name to use (if omitted, the default/current connection is used);
 *   - `force`: if `true`, skip confirmation prompts and proceed with deletion.
 * @throws {DbDeleteError} When no connection is found, the connection type is unsupported,
 *                         the specified database does not exist, no databases exist, or only system
 *                         databases exist (making selection impossible).
 */
export async function executeDbDeleteCommand(
    options: DbDeleteOptions
): Promise<void> {
    logger.info("Starting database delete process...");

    let connection: ConnectionConfig;
    try {
        connection = getConnection(options.connection);
    } catch {
        throw new DbDeleteError(
            "No database connection found. Run 'dbmux connect' first."
        );
    }

    if (connection.type !== "postgresql") {
        throw new DbDeleteError(
            "Database delete is currently only supported for PostgreSQL."
        );
    }

    await connectToDatabase(connection);

    let selectedDatabase: string;
    if (options.database) {
        selectedDatabase = options.database;

        logger.info("Verifying database exists...");
        const databases: DatabaseInfo[] = await getDatabases();
        const dbExists = databases.some((db) => db.name === selectedDatabase);
        if (!dbExists) {
            throw new DbDeleteError(`Database '${selectedDatabase}' not found`);
        }
    } else {
        logger.info("Fetching available databases...");
        const databases: DatabaseInfo[] = await getDatabases();

        if (databases.length === 0) {
            throw new DbDeleteError("No databases found");
        }

        const systemDbs = ["postgres", "template0", "template1"];
        const userDatabases = databases.filter(
            (db) => !systemDbs.includes(db.name)
        );

        if (userDatabases.length === 0) {
            throw new DbDeleteError(
                "No user databases found (only system databases exist)"
            );
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
            message: `Final confirmation: Delete '${selectedDatabase}'? This cannot be undone.`,
            default: false,
        });

        if (!doubleConfirm) {
            logger.info("Delete operation cancelled");
            return;
        }
    }

    const driver = createDriver(connection.type);
    await driver.connect(connection);

    try {
        logger.info("Terminating active connections...");
        await driver.terminateConnections(selectedDatabase);

        logger.info(`Dropping database '${selectedDatabase}'...`);
        await driver.dropDatabase(selectedDatabase);

        logger.success(`Database '${selectedDatabase}' has been deleted`);
    } finally {
        await driver.disconnect();
    }
}