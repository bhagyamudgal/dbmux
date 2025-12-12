import { spawn } from "child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { basename, extname, join } from "path";
import type { ConnectionConfig } from "../types/database.js";
import { DUMPS_DIR } from "./constants.js";
import { logger } from "./logger.js";

export type DumpOptions = {
    database: string;
    outputFile?: string;
    format?: "custom" | "plain" | "directory" | "tar";
    compress?: boolean;
    verbose?: boolean;
};

export type RestoreOptions = {
    inputFile: string;
    targetDatabase: string;
    createDatabase?: boolean;
    dropExisting?: boolean;
    verbose?: boolean;
    isCustomFormat?: boolean;
};

export type DumpFileInfo = {
    name: string;
    path: string;
    size: string;
    modified: Date;
    isValid: boolean;
};

export type DumpResult = {
    path: string;
    size: number;
};

export function ensureDumpsDir(): string {
    if (!existsSync(DUMPS_DIR)) {
        mkdirSync(DUMPS_DIR, { recursive: true });
    }
    return DUMPS_DIR;
}

export function getDumpOutputPath(filename: string): string {
    ensureDumpsDir();
    return join(DUMPS_DIR, filename);
}

function generateTimestamp(): string {
    const now = new Date();
    return now
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .slice(0, -5); // Remove milliseconds and Z
}

export function generateDumpFilename(
    database: string,
    customName?: string
): string {
    const timestamp = generateTimestamp();

    if (customName) {
        const ext = extname(customName);
        const nameWithoutExt = basename(customName, ext);
        const finalExt = ext || ".dump";
        return `${nameWithoutExt}_${timestamp}${finalExt}`;
    }

    return `${database}_backup_${timestamp}.dump`;
}

export async function executeCommand(
    command: string,
    args: string[],
    env?: Record<string, string>
): Promise<{ success: boolean; output: string; error: string }> {
    return new Promise((resolve) => {
        const childProcess = spawn(command, args, {
            env: { ...process.env, ...env },
            stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        childProcess.stdout?.on("data", (data: Buffer) => {
            stdout += data.toString();
        });

        childProcess.stderr?.on("data", (data: Buffer) => {
            stderr += data.toString();
        });

        childProcess.on("close", (code: number | null) => {
            resolve({
                success: code === 0,
                output: stdout,
                error: stderr,
            });
        });
    });
}

export async function executeCommandWithProgress(
    command: string,
    args: string[],
    env?: Record<string, string>,
    showProgress = false
): Promise<{ success: boolean; output: string; error: string }> {
    return new Promise((resolve) => {
        const childProcess = spawn(command, args, {
            env: { ...process.env, ...env },
            stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        childProcess.stdout?.on("data", (data: Buffer) => {
            const output = data.toString();
            stdout += output;
            if (showProgress) {
                // Show pg_restore progress output
                process.stdout.write(output);
            }
        });

        childProcess.stderr?.on("data", (data: Buffer) => {
            const error = data.toString();
            stderr += error;
            if (showProgress) {
                // pg_restore sends progress info to stderr
                process.stderr.write(error);
            }
        });

        childProcess.on("close", (code: number | null) => {
            resolve({
                success: code === 0,
                output: stdout,
                error: stderr,
            });
        });
    });
}

export async function createDatabaseDump(
    connection: ConnectionConfig,
    options: DumpOptions
): Promise<DumpResult> {
    const outputFile =
        options.outputFile || generateDumpFilename(options.database);
    const outputPath = getDumpOutputPath(outputFile);

    logger.info(`Creating database dump for '${options.database}'`);
    logger.info(`Output file: ${outputFile}`);

    const args = [
        "--host",
        connection.host || "localhost",
        "--port",
        String(connection.port || 5432),
        "--username",
        connection.user || "postgres",
        "--format",
        options.format || "custom",
        "--file",
        outputPath,
        "--no-privileges",
        "--no-owner",
    ];

    if (options.verbose) {
        args.push("--verbose");
    }

    if (options.compress && options.format === "plain") {
        args.push("--compress", "9");
    }

    args.push(options.database);

    const env: Record<string, string> = {};
    if (connection.password) {
        env.PGPASSWORD = connection.password;
    }

    const result = await executeCommand("pg_dump", args, env);

    if (!result.success) {
        throw new Error(`pg_dump failed: ${result.error}`);
    }

    if (!existsSync(outputPath)) {
        throw new Error("Dump file was not created");
    }

    const stats = statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    logger.success("Database dump completed successfully");
    logger.info(`File size: ${fileSizeMB} MB`);
    logger.info(`Location: ${outputPath}`);

    return {
        path: outputPath,
        size: stats.size,
    };
}

export async function restoreDatabase(
    connection: ConnectionConfig,
    options: RestoreOptions
): Promise<void> {
    const inputPath = join(process.cwd(), options.inputFile);

    if (!existsSync(inputPath)) {
        throw new Error(`Dump file not found: ${options.inputFile}`);
    }

    logger.info(`Restoring database from '${options.inputFile}'`);
    logger.info(`Target database: ${options.targetDatabase}`);

    // If we need to drop and recreate the database
    if (options.dropExisting) {
        await dropAndRecreateDatabase(connection, options.targetDatabase);
    } else if (options.createDatabase) {
        await createDatabase(connection, options.targetDatabase);
    }

    const args = [
        "--host",
        connection.host || "localhost",
        "--port",
        String(connection.port || 5432),
        "--username",
        connection.user || "postgres",
        "--dbname",
        options.targetDatabase,
        "--no-privileges",
        "--no-owner",
    ];

    // Always enable verbose mode for progress feedback
    args.push("--verbose");

    // Check if it's a custom format dump (use passed result if available)
    const isCustomFormat =
        options.isCustomFormat !== undefined
            ? options.isCustomFormat
            : await verifyDumpFile(inputPath);

    if (isCustomFormat) {
        args.push(inputPath);

        const env: Record<string, string> = {};
        if (connection.password) {
            env.PGPASSWORD = connection.password;
        }

        logger.info("Starting pg_restore operation...");
        logger.info("This may take a while for large databases...");

        const result = await executeCommandWithProgress(
            "pg_restore",
            args,
            env,
            true
        );

        if (!result.success) {
            throw new Error(`pg_restore failed: ${result.error}`);
        }
    } else {
        // Plain SQL file - use psql
        const psqlArgs = [
            "--host",
            connection.host || "localhost",
            "--port",
            String(connection.port || 5432),
            "--username",
            connection.user || "postgres",
            "--dbname",
            options.targetDatabase,
            "--file",
            inputPath,
        ];

        const env: Record<string, string> = {};
        if (connection.password) {
            env.PGPASSWORD = connection.password;
        }

        logger.info("Starting psql restore operation...");
        logger.info("This may take a while for large SQL files...");

        const result = await executeCommandWithProgress(
            "psql",
            psqlArgs,
            env,
            true
        );

        if (!result.success) {
            throw new Error(`psql restore failed: ${result.error}`);
        }
    }

    logger.success("Database restore completed successfully");
}

export async function verifyDumpFile(filePath: string): Promise<boolean> {
    try {
        logger.info(`Verifying dump file: ${basename(filePath)}`);

        const fileExt = extname(filePath).toLowerCase();

        // Fast path: Check if it's a plain SQL file first
        if (fileExt === ".sql") {
            logger.success("Dump file detected as plain SQL format");
            return false; // false means it's not custom format (but still valid)
        }

        // For other formats (.dump, .tar, .gz), try to list contents
        const result = await executeCommand("pg_restore", ["--list", filePath]);

        if (result.success) {
            logger.success("Dump file verification passed (custom format)");
            return true;
        }

        throw new Error("Invalid or corrupted dump file");
    } catch (error) {
        if (error instanceof Error) {
            logger.fail(`Dump file verification failed: ${error.message}`);
        } else {
            logger.fail(
                "An unknown error occurred during dump file verification."
            );
        }
        throw error;
    }
}

export async function createDatabase(
    connection: ConnectionConfig,
    databaseName: string
): Promise<void> {
    logger.info(`Creating database: ${databaseName}`);

    const args = [
        "--host",
        connection.host || "localhost",
        "--port",
        String(connection.port || 5432),
        "--username",
        connection.user || "postgres",
        "--dbname",
        "postgres",
        "--command",
        `CREATE DATABASE "${databaseName}";`,
    ];

    const env: Record<string, string> = {};
    if (connection.password) {
        env.PGPASSWORD = connection.password;
    }

    const result = await executeCommand("psql", args, env);

    if (!result.success) {
        throw new Error(
            `Failed to create database '${databaseName}': ${result.error}`
        );
    }

    logger.success(`Database '${databaseName}' created successfully`);
}

export async function dropAndRecreateDatabase(
    connection: ConnectionConfig,
    databaseName: string
): Promise<void> {
    logger.info(`Dropping and recreating database: ${databaseName}`);

    const env: Record<string, string> = {};
    if (connection.password) {
        env.PGPASSWORD = connection.password;
    }

    // First, terminate active connections
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
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();`,
    ];

    await executeCommand("psql", terminateArgs, env);

    // Drop the database (must be separate command)
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
        `DROP DATABASE IF EXISTS "${databaseName}";`,
    ];

    const dropResult = await executeCommand("psql", dropArgs, env);

    if (!dropResult.success) {
        throw new Error(
            `Failed to drop database '${databaseName}': ${dropResult.error}`
        );
    }

    // Create the database (must be separate command)
    logger.info(`Creating database '${databaseName}'...`);
    await createDatabase(connection, databaseName);
}

export function listDumpFiles(directory?: string): DumpFileInfo[] {
    const targetDir = directory || DUMPS_DIR;

    if (!existsSync(targetDir)) {
        if (targetDir === DUMPS_DIR) {
            ensureDumpsDir();
        } else {
            return [];
        }
    }

    try {
        const files = readdirSync(targetDir);
        const dumpFiles: DumpFileInfo[] = [];

        for (const file of files) {
            const filePath = join(targetDir, file);
            const stats = statSync(filePath);

            if (stats.isFile()) {
                const ext = extname(file).toLowerCase();
                if ([".dump", ".dmp", ".sql", ".gz", ".tar"].includes(ext)) {
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

                    dumpFiles.push({
                        name: file,
                        path: filePath,
                        size: `${sizeMB} MB`,
                        modified: stats.mtime,
                        isValid: true,
                    });
                }
            }
        }

        return dumpFiles.sort(
            (a, b) => b.modified.getTime() - a.modified.getTime()
        );
    } catch (error) {
        logger.error(`Failed to list dump files: ${error}`);
        return [];
    }
}
