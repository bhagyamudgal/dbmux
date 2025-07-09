import { select } from "@inquirer/prompts";
import { logger } from "../../utils/logger.js";
import { executeAddCommand } from "./add.js";
import { executeDefaultCommand } from "./default.js";
import { executeListCommand } from "./list.js";
import { executeRemoveCommand } from "./remove.js";
import { executeRenameCommand } from "./rename.js";

export async function executeManageCommand(): Promise<void> {
    let running = true;
    while (running) {
        const choice = await select({
            message: "Manage Connections",
            choices: [
                { name: "List connections", value: "list" },
                { name: "Add a new connection", value: "add" },
                { name: "Remove a connection", value: "remove" },
                { name: "Rename a connection", value: "rename" },
                { name: "Set default connection", value: "default" },
                { name: "Exit", value: "exit" },
            ],
        });

        switch (choice) {
            case "list":
                await executeListCommand();
                break;
            case "add":
                await executeAddCommand();
                break;
            case "remove":
                await executeRemoveCommand();
                break;
            case "rename":
                await executeRenameCommand();
                break;
            case "default":
                await executeDefaultCommand();
                break;
            case "exit":
                running = false;
                break;
        }

        if (running) {
            await select({
                message: "Press Enter to continue...",
                choices: [{ name: "Continue", value: "continue" }],
            });
        }
    }
    logger.info("Exiting connection manager.");
}
