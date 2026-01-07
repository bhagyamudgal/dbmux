import { table } from "table";
import { withDatabaseConnection } from "../utils/command-runner.js";
import { listConnections } from "../utils/config.js";
import { getDatabases, getTables } from "../utils/database.js";
import { logger } from "../utils/logger.js";

export type ListOptions = {
    databases?: boolean;
    tables?: boolean;
    connections?: boolean;
    connection?: string;
    schema?: string;
    database?: string;
};

export async function executeListCommand(options: ListOptions) {
    if (options.connections) {
        listSavedConnections();
    } else if (options.databases) {
        await listDatabases(options.connection, options.database);
    } else if (options.tables) {
        await listTables(options.connection, options.schema, options.database);
    } else {
        logger.info(
            "No list option specified. Use --databases, --tables, or --connections."
        );
    }
}

function listSavedConnections() {
    try {
        const connections = listConnections();
        const connectionNames = Object.keys(connections);

        if (connectionNames.length === 0) {
            logger.info(
                "No saved connections found. Use 'dbmux connect' to add one."
            );
            return;
        }

        logger.info("Saved Connections:");
        for (const name of connectionNames) {
            logger.raw(`- ${name}`);
        }
    } catch {
        logger.fail("Failed to list connections.");
    }
}

async function listDatabases(connectionName?: string, database?: string) {
    await withDatabaseConnection(
        connectionName,
        async () => {
            const databases = await getDatabases();

            if (databases.length === 0) {
                logger.info("No databases found.");
                return;
            }

            const tableData = [
                ["Name", "Owner", "Encoding", "Size"],
                ...databases.map((db) => [
                    db.name,
                    db.owner || "-",
                    db.encoding || "-",
                    db.size || "-",
                ]),
            ];

            logger.raw(table(tableData));
        },
        database
    );
}

async function listTables(
    connectionName?: string,
    schema?: string,
    database?: string
) {
    await withDatabaseConnection(
        connectionName,
        async () => {
            const tables = await getTables(schema);

            if (tables.length === 0) {
                logger.info("No tables found in the current database.");
                return;
            }

            logger.info("Tables:");
            for (const tableName of tables) {
                logger.raw(`- ${tableName}`);
            }
        },
        database
    );
}
