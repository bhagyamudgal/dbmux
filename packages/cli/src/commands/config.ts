import { logger } from "../utils/logger.js";
import { executeAddCommand } from "./config/add.js";
import { executeDefaultCommand } from "./config/default.js";
import { executeListCommand } from "./config/list.js";
import { executeManageCommand } from "./config/manage.js";
import { executePathCommand } from "./config/path.js";
import { executeRemoveCommand } from "./config/remove.js";
import { executeRenameCommand } from "./config/rename.js";
import { executeShowCommand } from "./config/show.js";

export type ConfigOptions = {
    action:
        | "list"
        | "remove"
        | "default"
        | "show"
        | "add"
        | "path"
        | "rename"
        | "manage";
    name?: string;
    newName?: string;
};

export async function executeConfigCommand(
    options: ConfigOptions
): Promise<void> {
    try {
        switch (options.action) {
            case "add":
                await executeAddCommand();
                break;
            case "list":
                await executeListCommand();
                break;
            case "remove":
                await executeRemoveCommand(options.name);
                break;
            case "default":
                await executeDefaultCommand(options.name);
                break;
            case "show":
                await executeShowCommand();
                break;
            case "path":
                executePathCommand();
                break;
            case "rename":
                await executeRenameCommand(options.name, options.newName);
                break;
            case "manage":
                await executeManageCommand();
                break;
            default:
                logger.fail(`Unknown config action: ${options.action}`);
                process.exit(1);
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(`Config command failed: ${errorMessage}`);
        process.exit(1);
    }
}
