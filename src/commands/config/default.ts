import { input } from "@inquirer/prompts";
import { listConnections, setDefaultConnection } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export async function executeDefaultCommand(name?: string): Promise<void> {
    const connections = listConnections();
    const connectionNames = Object.keys(connections);

    if (connectionNames.length === 0) {
        logger.info("No saved connections to set as default.");
        return;
    }

    const connectionToSet =
        name && connectionNames.includes(name)
            ? name
            : await input({
                  message:
                      "Enter the name of the connection to set as default:",
                  validate: (value) =>
                      connectionNames.includes(value) ||
                      "Connection not found.",
              });

    try {
        setDefaultConnection(connectionToSet);
        logger.success(`'${connectionToSet}' is now the default connection.`);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(errorMessage);
        process.exit(1);
    }
}
