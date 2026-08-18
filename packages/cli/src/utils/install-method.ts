import { fileURLToPath } from "url";
import { PACKAGE_NAME } from "./package-info.js";

// process.argv[0] is "bun" inside a compiled binary rather than the executable path,
// so this virtual-filesystem marker is the only reliable signal that we are one.
const BUN_COMPILED_BINARY_MARKER = "/$bunfs/root/";

const BUN_GLOBAL_INSTALL_MARKER = "/.bun/install/global/";
const PNPM_INSTALL_MARKERS = ["/pnpm/", "/.pnpm/"];

type PackageManager = "npm" | "bun" | "pnpm";

type InstallMethod =
    | { kind: "binary"; executablePath: string }
    | { kind: "package-manager"; manager: PackageManager }
    | { kind: "source" };

function detectPackageManager(modulePath: string): PackageManager {
    if (modulePath.includes(BUN_GLOBAL_INSTALL_MARKER)) {
        return "bun";
    }
    if (PNPM_INSTALL_MARKERS.some((marker) => modulePath.includes(marker))) {
        return "pnpm";
    }
    return "npm";
}

export function resolveInstallMethod(
    moduleUrl: string,
    executablePath: string
): InstallMethod {
    if (moduleUrl.includes(BUN_COMPILED_BINARY_MARKER)) {
        return { kind: "binary", executablePath };
    }

    const modulePath = moduleUrl.startsWith("file://")
        ? fileURLToPath(moduleUrl)
        : moduleUrl;
    const normalizedPath = modulePath.replace(/\\/g, "/");

    if (!normalizedPath.includes(`/node_modules/${PACKAGE_NAME}/`)) {
        return { kind: "source" };
    }

    return {
        kind: "package-manager",
        manager: detectPackageManager(normalizedPath),
    };
}

export function detectInstallMethod(): InstallMethod {
    return resolveInstallMethod(import.meta.url, process.execPath);
}

export type { InstallMethod, PackageManager };
