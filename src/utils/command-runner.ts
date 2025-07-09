import { getConnection } from "./config.js";
import {
    closeConnection,
    connectToDatabase,
    getCurrentConnection,
} from "./database.js";
import { logger } from "./logger.js";

export async function withDatabaseConnection(
    connectionName: string | undefined,
    action: () => Promise<void>,
    databaseOverride?: string
) {
    try {
        let connection =
            getCurrentConnection() || getConnection(connectionName);
        if (databaseOverride) {
            connection = { ...connection, database: databaseOverride };
            logger.info(
                `Overriding connection to use database: ${databaseOverride}`
            );
        }
        await connectToDatabase(connection);
        await action();
    } catch (error) {
        if (error instanceof Error) {
            logger.fail(error.message);
        } else {
            logger.fail("An unknown error occurred.");
        }
        process.exit(1);
    } finally {
        await closeConnection();
    }
}
