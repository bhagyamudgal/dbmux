import { createHash } from "crypto";
import {
    access,
    chmod,
    constants,
    mkdtemp,
    rename,
    rm,
    writeFile,
} from "fs/promises";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { logger } from "./logger.js";
import { GITHUB_REPOSITORY } from "./package-info.js";
import { executeCommand, executeCommandInteractive } from "./process-runner.js";

const CHECKSUMS_FILE_NAME = "checksums.txt";
const EXECUTABLE_MODE = 0o755;
const BACKUP_SUFFIX = ".old";

// Mirrors detect_platform() in install.sh and the build:* scripts in package.json.
const ASSET_NAMES: Record<string, string> = {
    "linux-x64": "dbmux-linux-x64",
    "darwin-x64": "dbmux-darwin-x64",
    "darwin-arm64": "dbmux-darwin-arm64",
    "win32-x64": "dbmux-windows-x64.exe",
};

type FileMover = {
    move: (source: string, destination: string) => Promise<void>;
    remove: (target: string) => Promise<void>;
};

const directMover: FileMover = {
    move: (source, destination) => rename(source, destination),
    remove: (target) => rm(target, { force: true }),
};

async function runPrivileged(args: string[]): Promise<void> {
    const { success, error } = await executeCommandInteractive("sudo", args);
    if (!success) {
        throw new Error(`Privileged operation failed: ${error}`);
    }
}

const sudoMover: FileMover = {
    move: (source, destination) => runPrivileged(["mv", source, destination]),
    remove: (target) => runPrivileged(["rm", "-f", target]),
};

export function resolveAssetName(
    platform: string,
    architecture: string
): string {
    const assetName = ASSET_NAMES[`${platform}-${architecture}`];
    if (!assetName) {
        throw new Error(
            `No dbmux binary is published for ${platform}-${architecture}`
        );
    }
    return assetName;
}

export function findExpectedChecksum(
    checksumsFile: string,
    assetName: string
): string {
    for (const line of checksumsFile.split("\n")) {
        const [checksum, name] = line.trim().split(/\s+/);
        if (name === assetName && checksum) {
            return checksum;
        }
    }
    throw new Error(
        `Checksum for ${assetName} not found in ${CHECKSUMS_FILE_NAME}`
    );
}

function buildReleaseAssetUrl(version: string, assetName: string): string {
    return `https://github.com/${GITHUB_REPOSITORY}/releases/download/v${version}/${assetName}`;
}

async function fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Request failed with status ${response.status}: ${url}`
        );
    }
    return response.text();
}

async function downloadAsset(
    url: string,
    destination: string
): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Download failed with status ${response.status}: ${url}`
        );
    }
    const contents = Buffer.from(await response.arrayBuffer());
    await writeFile(destination, contents);
    return createHash("sha256").update(contents).digest("hex");
}

async function canWrite(directoryPath: string): Promise<boolean> {
    try {
        await access(directoryPath, constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

async function verifyInstalledVersion(
    executablePath: string,
    version: string
): Promise<void> {
    const { success, output } = await executeCommand(executablePath, [
        "--version",
    ]);
    if (!success || output.trim() !== version) {
        throw new Error(
            `Installed binary did not report version ${version}; rolling back`
        );
    }
}

async function installDownloadedBinary(
    mover: FileMover,
    downloadedPath: string,
    executablePath: string,
    version: string
): Promise<void> {
    const backupPath = `${executablePath}${BACKUP_SUFFIX}`;

    // Moving the current executable aside before moving the new one in is what makes
    // this work on Windows, where a running .exe cannot be overwritten in place.
    await mover.move(executablePath, backupPath);

    try {
        await mover.move(downloadedPath, executablePath);
        await verifyInstalledVersion(executablePath, version);
    } catch (error) {
        await mover.move(backupPath, executablePath);
        throw error;
    }

    // Windows lets us rename a running image but not delete one, so the backup can
    // outlive a successful update. The new binary is already in place either way.
    try {
        await mover.remove(backupPath);
    } catch {
        logger.warn(`Previous binary left behind at ${backupPath}`);
    }
}

export async function replaceBinary(
    executablePath: string,
    version: string
): Promise<void> {
    const assetName = resolveAssetName(process.platform, process.arch);
    const targetDirectory = dirname(executablePath);
    const isTargetWritable = await canWrite(targetDirectory);

    // Staging inside the target directory keeps the final move on one filesystem, so
    // rename() is atomic. Falling back to a temp dir gives that up, but an unwritable
    // target needs a privileged move anyway.
    const stagingDirectory = isTargetWritable
        ? targetDirectory
        : await mkdtemp(join(tmpdir(), "dbmux-update-"));
    const downloadedPath = join(
        stagingDirectory,
        `.dbmux-update-${process.pid}`
    );

    try {
        const actualChecksum = await downloadAsset(
            buildReleaseAssetUrl(version, assetName),
            downloadedPath
        );
        const checksumsFile = await fetchText(
            buildReleaseAssetUrl(version, CHECKSUMS_FILE_NAME)
        );
        const expectedChecksum = findExpectedChecksum(checksumsFile, assetName);

        if (actualChecksum !== expectedChecksum) {
            throw new Error(
                `Checksum verification failed. Expected ${expectedChecksum}, got ${actualChecksum}`
            );
        }

        await chmod(downloadedPath, EXECUTABLE_MODE);
        await installDownloadedBinary(
            isTargetWritable ? directMover : sudoMover,
            downloadedPath,
            executablePath,
            version
        );
    } finally {
        await rm(downloadedPath, { force: true });
        if (stagingDirectory !== targetDirectory) {
            await rm(stagingDirectory, { recursive: true, force: true });
        }
    }
}
