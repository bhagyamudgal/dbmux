import { extractMessageFromError } from "@dbmux/utils/general";
import { existsSync } from "fs";
import { join } from "path";
import { executeQuery } from "./database.js";
import { logger } from "./logger.js";
import { executeCommand } from "./process-runner.js";

export type PgClientTool = "pg_dump" | "pg_restore";

export type PgClientResolution = {
    /** Command to spawn: a bare tool name resolved via PATH, or an absolute path. */
    command: string;
    /** Major version of `command` itself, null when it could not be determined. */
    clientMajorVersion: number | null;
    serverMajorVersion: number | null;
};

// `pg_restore --version` prints "pg_restore (PostgreSQL) 17.10"; pre-release
// builds print "18beta1", so read digits after the parenthesised product name.
const TOOL_VERSION_PATTERN = /\)\s+(\d+)/;

const SERVER_VERSION_DIVISOR = 10000;

function candidateBinDirs(majorVersion: number): string[] {
    return [
        `/opt/homebrew/opt/postgresql@${majorVersion}/bin`,
        `/usr/local/opt/postgresql@${majorVersion}/bin`,
        `/Applications/Postgres.app/Contents/Versions/${majorVersion}/bin`,
        `/usr/lib/postgresql/${majorVersion}/bin`,
        `/usr/pgsql-${majorVersion}/bin`,
        join("C:\\Program Files\\PostgreSQL", String(majorVersion), "bin"),
    ];
}

async function getServerMajorVersion(): Promise<number | null> {
    try {
        const result = await executeQuery("SHOW server_version_num");
        const rawVersion = result.rows[0]?.server_version_num;
        const versionNumber = Number(rawVersion);

        if (!Number.isFinite(versionNumber) || versionNumber <= 0) {
            logger.warn(
                `Unexpected server_version_num from server: ${String(rawVersion)}`
            );
            return null;
        }

        return Math.floor(versionNumber / SERVER_VERSION_DIVISOR);
    } catch (error) {
        logger.warn(
            `Could not read the server version: ${extractMessageFromError(error, "unknown error")}`
        );
        return null;
    }
}

async function getToolMajorVersion(command: string): Promise<number | null> {
    const result = await executeCommand(command, ["--version"]);

    if (!result.success) {
        logger.warn(`Could not read the version of ${command}`);
        return null;
    }

    const match = TOOL_VERSION_PATTERN.exec(result.output);
    return match ? Number(match[1]) : null;
}

function findVersionMatchedBinary(
    tool: PgClientTool,
    majorVersion: number
): string | null {
    for (const binDir of candidateBinDirs(majorVersion)) {
        for (const fileName of [tool, `${tool}.exe`]) {
            const candidate = join(binDir, fileName);
            if (existsSync(candidate)) {
                return candidate;
            }
        }
    }

    return null;
}

/**
 * Picks the `pg_dump`/`pg_restore` binary whose major version matches the
 * connected server, falling back to the one on PATH when there is no match.
 *
 * Requires an active connection (see `connectToDatabase`) to read the server
 * version.
 */
export async function resolvePgClient(
    tool: PgClientTool
): Promise<PgClientResolution> {
    const serverMajorVersion = await getServerMajorVersion();
    const pathMajorVersion = await getToolMajorVersion(tool);

    if (
        serverMajorVersion === null ||
        pathMajorVersion === null ||
        pathMajorVersion === serverMajorVersion
    ) {
        return {
            command: tool,
            clientMajorVersion: pathMajorVersion,
            serverMajorVersion,
        };
    }

    const matchedBinary = findVersionMatchedBinary(tool, serverMajorVersion);

    if (matchedBinary) {
        logger.info(
            `Using ${matchedBinary} to match PostgreSQL ${serverMajorVersion} server`
        );
        return {
            command: matchedBinary,
            clientMajorVersion: serverMajorVersion,
            serverMajorVersion,
        };
    }

    logger.warn(
        `Local ${tool} is version ${pathMajorVersion} but the server is PostgreSQL ${serverMajorVersion}, and no matching client was found`
    );

    return {
        command: tool,
        clientMajorVersion: pathMajorVersion,
        serverMajorVersion,
    };
}

export function logClientInstallHint(majorVersion: number): void {
    logger.info("Install matching PostgreSQL client tools:");
    logger.info(
        `  - macOS (Homebrew): brew install postgresql@${majorVersion}`
    );
    logger.info(
        `  - Debian/Ubuntu: sudo apt-get install postgresql-client-${majorVersion}`
    );
}
