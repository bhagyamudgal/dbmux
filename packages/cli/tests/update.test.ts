import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    findExpectedChecksum,
    resolveAssetName,
} from "../src/utils/binary-installer";
import { resolveInstallMethod } from "../src/utils/install-method";
import { isNewerVersion } from "../src/utils/version-check";

const { replaceBinary } = vi.hoisted(() => ({ replaceBinary: vi.fn() }));
const { detectInstallMethod } = vi.hoisted(() => ({
    detectInstallMethod: vi.fn(),
}));
const { fetchLatestVersion } = vi.hoisted(() => ({
    fetchLatestVersion: vi.fn(),
}));
const { executeCommandInteractive } = vi.hoisted(() => ({
    executeCommandInteractive: vi.fn(),
}));
const { logger } = vi.hoisted(() => ({
    logger: {
        info: vi.fn(),
        success: vi.fn(),
        fail: vi.fn(),
        warn: vi.fn(),
        raw: vi.fn(),
    },
}));
const { createSpinner } = vi.hoisted(() => ({
    createSpinner: vi.fn(() => ({
        update: vi.fn(),
        succeed: vi.fn(),
        fail: vi.fn(),
        stop: vi.fn(),
    })),
}));

vi.mock("../src/utils/binary-installer.js", async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import("../src/utils/binary-installer.js")
        >();
    return { ...actual, replaceBinary };
});
vi.mock("../src/utils/install-method.js", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("../src/utils/install-method.js")>();
    return { ...actual, detectInstallMethod };
});
vi.mock("../src/utils/version-check.js", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("../src/utils/version-check.js")>();
    return { ...actual, fetchLatestVersion };
});
vi.mock("../src/utils/process-runner.js", () => ({
    executeCommandInteractive,
    executeCommand: vi.fn(),
}));
vi.mock("../src/utils/logger.js", () => ({ logger }));
vi.mock("../src/utils/spinner.js", () => ({ createSpinner }));

const { executeUpdateCommand } = await import("../src/commands/update");
const { PACKAGE_VERSION } = await import("../src/utils/package-info");

describe("isNewerVersion", () => {
    it("reports a newer patch, minor and major release", () => {
        expect(isNewerVersion("2.3.2", "2.3.1")).toBe(true);
        expect(isNewerVersion("2.4.0", "2.3.9")).toBe(true);
        expect(isNewerVersion("3.0.0", "2.9.9")).toBe(true);
    });

    it("reports an identical or older release as not newer", () => {
        expect(isNewerVersion("2.3.1", "2.3.1")).toBe(false);
        expect(isNewerVersion("2.3.0", "2.3.1")).toBe(false);
        expect(isNewerVersion("1.9.9", "2.0.0")).toBe(false);
    });

    it("compares numerically rather than lexically", () => {
        expect(isNewerVersion("2.10.0", "2.9.0")).toBe(true);
        expect(isNewerVersion("2.9.0", "2.10.0")).toBe(false);
    });

    it("tolerates a leading v from a git tag", () => {
        expect(isNewerVersion("v2.4.0", "2.3.1")).toBe(true);
    });

    it("throws on an unparseable version rather than guessing", () => {
        expect(() => isNewerVersion("latest", "2.3.1")).toThrow(
            "Could not parse version: latest"
        );
    });
});

describe("resolveInstallMethod", () => {
    it("detects a compiled binary from the bun virtual filesystem path", () => {
        expect(
            resolveInstallMethod(
                "file:///$bunfs/root/dbmux",
                "/usr/local/bin/dbmux"
            )
        ).toEqual({ kind: "binary", executablePath: "/usr/local/bin/dbmux" });
    });

    it("detects an npm global install", () => {
        expect(
            resolveInstallMethod(
                "file:///usr/local/lib/node_modules/dbmux/dist/index.js",
                "/usr/local/bin/node"
            )
        ).toEqual({ kind: "package-manager", manager: "npm" });
    });

    it("detects a bun global install", () => {
        expect(
            resolveInstallMethod(
                "file:///Users/me/.bun/install/global/node_modules/dbmux/dist/index.js",
                "/Users/me/.bun/bin/bun"
            )
        ).toEqual({ kind: "package-manager", manager: "bun" });
    });

    it("detects a pnpm global install", () => {
        expect(
            resolveInstallMethod(
                "file:///Users/me/Library/pnpm/global/5/node_modules/dbmux/dist/index.js",
                "/usr/local/bin/node"
            )
        ).toEqual({ kind: "package-manager", manager: "pnpm" });
    });

    it("treats a source checkout as unmanaged", () => {
        expect(
            resolveInstallMethod(
                "file:///Users/me/code/dbmux/packages/cli/src/index.ts",
                "/usr/local/bin/bun"
            )
        ).toEqual({ kind: "source" });
    });
});

describe("resolveAssetName", () => {
    it("maps supported platforms to published release assets", () => {
        expect(resolveAssetName("darwin", "arm64")).toBe("dbmux-darwin-arm64");
        expect(resolveAssetName("linux", "x64")).toBe("dbmux-linux-x64");
        expect(resolveAssetName("win32", "x64")).toBe("dbmux-windows-x64.exe");
    });

    it("throws for a platform with no published binary", () => {
        expect(() => resolveAssetName("linux", "arm64")).toThrow(
            "No dbmux binary is published for linux-arm64"
        );
    });
});

describe("findExpectedChecksum", () => {
    const checksumsFile = [
        "aaa111  dbmux-darwin-arm64",
        "bbb222  dbmux-linux-x64",
        "",
    ].join("\n");

    it("finds the checksum for the requested asset", () => {
        expect(findExpectedChecksum(checksumsFile, "dbmux-linux-x64")).toBe(
            "bbb222"
        );
    });

    it("throws when the asset is absent rather than skipping verification", () => {
        expect(() =>
            findExpectedChecksum(checksumsFile, "dbmux-windows-x64.exe")
        ).toThrow("Checksum for dbmux-windows-x64.exe not found");
    });
});

describe("executeUpdateCommand", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.exitCode = undefined;
    });

    it("refuses to update a source checkout", async () => {
        detectInstallMethod.mockReturnValue({ kind: "source" });

        await executeUpdateCommand();

        expect(fetchLatestVersion).not.toHaveBeenCalled();
        expect(logger.fail).toHaveBeenCalledWith(
            "dbmux is running from a source checkout; update it with git instead."
        );
        expect(process.exitCode).toBe(1);
    });

    it("does nothing when already on the latest version", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "binary",
            executablePath: "/usr/local/bin/dbmux",
        });
        fetchLatestVersion.mockResolvedValue(PACKAGE_VERSION);

        await executeUpdateCommand();

        expect(replaceBinary).not.toHaveBeenCalled();
        expect(logger.success).toHaveBeenCalledWith(
            `Already on the latest version (${PACKAGE_VERSION})`
        );
    });

    it("reports an available update without installing it under --check", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "binary",
            executablePath: "/usr/local/bin/dbmux",
        });
        fetchLatestVersion.mockResolvedValue("99.0.0");

        await executeUpdateCommand({ check: true });

        expect(logger.info).toHaveBeenCalledWith("Update available: 99.0.0");
        expect(replaceBinary).not.toHaveBeenCalled();
    });

    it("replaces the binary for a standalone install", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "binary",
            executablePath: "/usr/local/bin/dbmux",
        });
        fetchLatestVersion.mockResolvedValue("99.0.0");
        replaceBinary.mockResolvedValue(undefined);

        await executeUpdateCommand();

        expect(replaceBinary).toHaveBeenCalledWith(
            "/usr/local/bin/dbmux",
            "99.0.0"
        );
        expect(process.exitCode).toBeUndefined();
    });

    it("queries npm and re-runs the manager for a global package install", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "package-manager",
            manager: "bun",
        });
        fetchLatestVersion.mockResolvedValue("99.0.0");
        executeCommandInteractive.mockResolvedValue({
            success: true,
            error: "",
        });

        await executeUpdateCommand();

        expect(fetchLatestVersion).toHaveBeenCalledWith("npm");
        expect(executeCommandInteractive).toHaveBeenCalledWith("bun", [
            "add",
            "-g",
            "dbmux@latest",
        ]);
        expect(replaceBinary).not.toHaveBeenCalled();
    });

    it("exits non-zero when the replacement fails", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "binary",
            executablePath: "/usr/local/bin/dbmux",
        });
        fetchLatestVersion.mockResolvedValue("99.0.0");
        replaceBinary.mockRejectedValue(
            new Error("Checksum verification failed")
        );

        await executeUpdateCommand();

        expect(logger.fail).toHaveBeenCalledWith(
            "Checksum verification failed"
        );
        expect(process.exitCode).toBe(1);
    });

    it("exits non-zero when the registry returns an unparseable version", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "binary",
            executablePath: "/usr/local/bin/dbmux",
        });
        fetchLatestVersion.mockResolvedValue("not-a-version");

        await executeUpdateCommand();

        expect(logger.fail).toHaveBeenCalledWith(
            "Could not parse version: not-a-version"
        );
        expect(replaceBinary).not.toHaveBeenCalled();
        expect(process.exitCode).toBe(1);
    });

    it("exits non-zero when the version check cannot reach the registry", async () => {
        detectInstallMethod.mockReturnValue({
            kind: "binary",
            executablePath: "/usr/local/bin/dbmux",
        });
        fetchLatestVersion.mockRejectedValue(new Error("network unreachable"));

        await executeUpdateCommand();

        expect(logger.fail).toHaveBeenCalledWith("network unreachable");
        expect(process.exitCode).toBe(1);
    });
});
