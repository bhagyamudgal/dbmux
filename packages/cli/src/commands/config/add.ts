import { input } from "@inquirer/prompts";
import { addConnection } from "../../utils/config.js";
import { testConnection } from "../../utils/database.js";
import { logger } from "../../utils/logger.js";
import { promptForConnectionDetails } from "../../utils/prompt.js";
import type { ConnectionConfig } from "@dbmux/types/database";

export async function executeAddCommand(): Promise<void> {
    logger.info("Adding a new database connection interactively.");

    const config = await promptForConnectionDetails();

    logger.info("Testing connection...");
    const isConnected = await testConnection(config);

    if (!isConnected) {
        logger.fail(
            "Connection test failed. The connection was not saved. Please check the details and try again."
        );
        return;
    }
    logger.success("Connection test successful!");

    const defaultName =
        config.type === "sqlite"
            ? `sqlite-${config.filePath?.split("/").pop()?.split(".")[0]}`
            : `${config.user}@${config.host}/${config.database}`;

    const connectionName = await input({
        message:
            "Enter a name for this connection (or press Enter for default):",
        default: defaultName,
    });

    addConnection(connectionName || defaultName, config as ConnectionConfig);
    logger.success(
        `Connection '${
            connectionName || defaultName
        }' added and saved successfully.`
    );
}
