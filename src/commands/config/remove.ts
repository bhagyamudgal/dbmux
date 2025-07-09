import { checkbox, confirm } from "@inquirer/prompts";
import { listConnections, removeConnection } from "../../utils/config.js";
import { logger } from "../../utils/logger.js";

export async function executeRemoveCommand(name?: string): Promise<void> {
    const connections = listConnections();
    const connectionNames = Object.keys(connections);

    if (connectionNames.length === 0) {
        logger.info("No saved connections to remove.");
        return;
    }

    const connectionsToRemove: string[] = [];

    if (name) {
        if (!connectionNames.includes(name)) {
            logger.fail(`Connection '${name}' not found.`);
            return;
        }
        connectionsToRemove.push(name);
    } else {
        const selectedNames = await checkbox({
            message:
                "Select connections to remove (space to select, enter to confirm):",
            choices: connectionNames.map((n) => ({
                name: n,
                value: n,
            })),
            validate: (value) =>
                value.length > 0 || "Please select at least one connection.",
        });
        connectionsToRemove.push(...selectedNames);
    }

    if (connectionsToRemove.length === 0) {
        logger.info("No connections selected for removal.");
        return;
    }

    const shouldProceed = await confirm({
        message: `Are you sure you want to remove the following connection(s)?\n- ${connectionsToRemove.join("\n- ")}`,
        default: false,
    });

    if (!shouldProceed) {
        logger.info("Removal operation cancelled.");
        return;
    }

    for (const n of connectionsToRemove) {
        try {
            removeConnection(n);
            logger.success(`Connection '${n}' removed successfully.`);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            logger.fail(`Failed to remove connection '${n}': ${errorMessage}`);
        }
    }
}
