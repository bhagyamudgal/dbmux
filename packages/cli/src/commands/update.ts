import { replaceBinary } from "../utils/binary-installer.js";
import {
    detectInstallMethod,
    type InstallMethod,
    type PackageManager,
} from "../utils/install-method.js";
import { logger } from "../utils/logger.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "../utils/package-info.js";
import { executeCommandInteractive } from "../utils/process-runner.js";
import { createSpinner } from "../utils/spinner.js";
import { fetchLatestVersion, isNewerVersion } from "../utils/version-check.js";

type UpdateCommandOptions = {
    check?: boolean;
};

type UpdatableInstallMethod = Exclude<InstallMethod, { kind: "source" }>;

const GLOBAL_INSTALL_ARGUMENTS: Record<PackageManager, string[]> = {
    npm: ["install", "-g", `${PACKAGE_NAME}@latest`],
    bun: ["add", "-g", `${PACKAGE_NAME}@latest`],
    pnpm: ["add", "-g", `${PACKAGE_NAME}@latest`],
};

function describeInstallMethod(installMethod: InstallMethod): string {
    if (installMethod.kind === "binary") {
        return `standalone binary (${installMethod.executablePath})`;
    }
    if (installMethod.kind === "package-manager") {
        return `${installMethod.manager} global package`;
    }
    return "source checkout";
}

async function applyUpdate(
    installMethod: UpdatableInstallMethod,
    version: string
): Promise<void> {
    if (installMethod.kind === "binary") {
        const spinner = createSpinner({
            text: `Downloading ${PACKAGE_NAME} ${version}...`,
        });
        try {
            await replaceBinary(installMethod.executablePath, version);
            spinner.succeed(`Updated to ${version}`);
        } catch (error) {
            spinner.fail("Update failed");
            throw error;
        }
        return;
    }

    const args = GLOBAL_INSTALL_ARGUMENTS[installMethod.manager];
    logger.info(`Running: ${installMethod.manager} ${args.join(" ")}`);
    const { success, error } = await executeCommandInteractive(
        installMethod.manager,
        args
    );
    if (!success) {
        throw new Error(error);
    }
    logger.success(`Updated to ${version}`);
}

export async function executeUpdateCommand(
    options: UpdateCommandOptions = {}
): Promise<void> {
    const installMethod = detectInstallMethod();

    logger.info(`Current version: ${PACKAGE_VERSION}`);
    logger.info(`Install method: ${describeInstallMethod(installMethod)}`);

    if (installMethod.kind === "source") {
        logger.fail(
            "dbmux is running from a source checkout; update it with git instead."
        );
        process.exitCode = 1;
        return;
    }

    const spinner = createSpinner({ text: "Checking for updates..." });
    let latestVersion: string;

    try {
        latestVersion = await fetchLatestVersion(
            installMethod.kind === "binary" ? "github" : "npm"
        );
        spinner.stop();
    } catch (error) {
        spinner.fail("Could not check for updates");
        logger.fail(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
        return;
    }

    if (!isNewerVersion(latestVersion, PACKAGE_VERSION)) {
        logger.success(`Already on the latest version (${PACKAGE_VERSION})`);
        return;
    }

    logger.info(`Update available: ${latestVersion}`);

    if (options.check) {
        return;
    }

    try {
        await applyUpdate(installMethod, latestVersion);
    } catch (error) {
        logger.fail(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
