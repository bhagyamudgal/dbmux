import { DUMPS_DIR } from "@dbmux/utils/constants";
import { confirm, select } from "@inquirer/prompts";
import { existsSync, statSync, unlinkSync } from "fs";
import { basename, isAbsolute, join } from "path";
import { markDumpAsDeletedByFilePath } from "../utils/config.js";
import { listDumpFiles, type DumpFileInfo } from "../utils/dump-restore.js";
import { logger } from "../utils/logger.js";

export type DumpDeleteOptions = {
    file?: string;
    force?: boolean;
};

function formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
}

export async function executeDumpDeleteCommand(
    options: DumpDeleteOptions
): Promise<void> {
    try {
        let filePath: string;

        if (options.file) {
            if (isAbsolute(options.file)) {
                filePath = options.file;
            } else {
                const inDumpsDir = join(DUMPS_DIR, options.file);
                if (existsSync(inDumpsDir)) {
                    filePath = inDumpsDir;
                } else if (existsSync(options.file)) {
                    filePath = options.file;
                } else {
                    logger.fail(`Dump file not found: ${options.file}`);
                    logger.info(`Checked: ${inDumpsDir}`);
                    process.exit(1);
                }
            }

            if (!existsSync(filePath)) {
                logger.fail(`Dump file not found: ${filePath}`);
                process.exit(1);
            }
        } else {
            const dumpFiles = listDumpFiles();

            if (dumpFiles.length === 0) {
                logger.fail("No dump files found");
                logger.info(`Checked: ${DUMPS_DIR}`);
                logger.info(
                    "Dump files should have extensions: .dump, .dmp, .sql, .gz, .tar"
                );
                process.exit(1);
            }

            filePath = await select({
                message: "Select dump file to delete:",
                choices: dumpFiles.map((file: DumpFileInfo) => ({
                    name: `${file.name} (${file.size}) - ${file.modified.toLocaleDateString()}`,
                    value: file.path,
                    description: `Modified: ${file.modified.toLocaleString()}`,
                })),
            });
        }

        const stats = statSync(filePath);
        const fileName = basename(filePath);

        logger.info(`File: ${fileName}`);
        logger.info(`Size: ${formatFileSize(stats.size)}`);
        logger.info(`Location: ${filePath}`);

        if (!options.force) {
            const shouldDelete = await confirm({
                message: `Are you sure you want to delete '${fileName}'?`,
                default: false,
            });

            if (!shouldDelete) {
                logger.info("Delete operation cancelled");
                return;
            }
        }

        unlinkSync(filePath);

        markDumpAsDeletedByFilePath(filePath);

        logger.success(`Deleted: ${fileName}`);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        logger.fail(`Dump delete failed: ${errorMessage}`);
        process.exit(1);
    }
}
