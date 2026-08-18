import { createHash } from "crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { executeCommand } = vi.hoisted(() => ({ executeCommand: vi.fn() }));
const { executeCommandInteractive } = vi.hoisted(() => ({
    executeCommandInteractive: vi.fn(),
}));

vi.mock("../src/utils/process-runner.js", () => ({
    executeCommand,
    executeCommandInteractive,
}));

const { replaceBinary, resolveAssetName } =
    await import("../src/utils/binary-installer");

const ORIGINAL_CONTENT = "original-binary-contents";
const NEW_CONTENT = "new-binary-contents";
const NEW_VERSION = "9.9.9";

const assetName = resolveAssetName(process.platform, process.arch);

function sha256(contents: string): string {
    return createHash("sha256").update(Buffer.from(contents)).digest("hex");
}

function stubReleaseDownload(checksum: string): void {
    vi.stubGlobal(
        "fetch",
        vi.fn((url: string) => {
            if (url.endsWith("checksums.txt")) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    text: () => Promise.resolve(`${checksum}  ${assetName}\n`),
                });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                arrayBuffer: () =>
                    Promise.resolve(
                        Uint8Array.from(Buffer.from(NEW_CONTENT)).buffer
                    ),
            });
        })
    );
}

describe("replaceBinary", () => {
    let installDirectory: string;
    let executablePath: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        installDirectory = await mkdtemp(join(tmpdir(), "dbmux-test-"));
        executablePath = join(installDirectory, "dbmux");
        await writeFile(executablePath, ORIGINAL_CONTENT);
    });

    afterEach(async () => {
        vi.unstubAllGlobals();
        await rm(installDirectory, { recursive: true, force: true });
    });

    it("installs the downloaded binary and removes the backup once verified", async () => {
        stubReleaseDownload(sha256(NEW_CONTENT));
        executeCommand.mockResolvedValue({
            success: true,
            output: `${NEW_VERSION}\n`,
            error: "",
        });

        await replaceBinary(executablePath, NEW_VERSION);

        expect(await readFile(executablePath, "utf-8")).toBe(NEW_CONTENT);
        expect(await readdir(installDirectory)).toEqual(["dbmux"]);
    });

    it("restores the previous binary when the new one reports the wrong version", async () => {
        stubReleaseDownload(sha256(NEW_CONTENT));
        executeCommand.mockResolvedValue({
            success: true,
            output: "2.2.0\n",
            error: "",
        });

        await expect(
            replaceBinary(executablePath, NEW_VERSION)
        ).rejects.toThrow(
            `Installed binary did not report version ${NEW_VERSION}`
        );

        expect(await readFile(executablePath, "utf-8")).toBe(ORIGINAL_CONTENT);
        expect(await readdir(installDirectory)).toEqual(["dbmux"]);
    });

    it("rejects a reported version that merely contains the expected one", async () => {
        stubReleaseDownload(sha256(NEW_CONTENT));
        executeCommand.mockResolvedValue({
            success: true,
            output: `${NEW_VERSION}0\n`,
            error: "",
        });

        await expect(
            replaceBinary(executablePath, NEW_VERSION)
        ).rejects.toThrow(
            `Installed binary did not report version ${NEW_VERSION}`
        );

        expect(await readFile(executablePath, "utf-8")).toBe(ORIGINAL_CONTENT);
        expect(await readdir(installDirectory)).toEqual(["dbmux"]);
    });

    it("aborts before touching the installed binary when the checksum does not match", async () => {
        stubReleaseDownload(sha256("something-else-entirely"));

        await expect(
            replaceBinary(executablePath, NEW_VERSION)
        ).rejects.toThrow("Checksum verification failed");

        expect(await readFile(executablePath, "utf-8")).toBe(ORIGINAL_CONTENT);
        expect(await readdir(installDirectory)).toEqual(["dbmux"]);
        expect(executeCommand).not.toHaveBeenCalled();
    });

    it("aborts when the release asset cannot be downloaded", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(() => Promise.resolve({ ok: false, status: 404 }))
        );

        await expect(
            replaceBinary(executablePath, NEW_VERSION)
        ).rejects.toThrow("Download failed with status 404");

        expect(await readFile(executablePath, "utf-8")).toBe(ORIGINAL_CONTENT);
        expect(await readdir(installDirectory)).toEqual(["dbmux"]);
    });
});
