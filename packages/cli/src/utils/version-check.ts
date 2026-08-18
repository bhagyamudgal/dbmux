import { GITHUB_REPOSITORY, PACKAGE_NAME } from "./package-info.js";

const NPM_REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE_NAME}/latest`;
const GITHUB_LATEST_RELEASE_URL = `https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/latest`;

// A registry that accepts the connection but never answers would otherwise hang the
// update check forever. Only these small metadata reads are bounded; the release
// download is not, because a slow link legitimately takes minutes for a 59 MB binary.
const REQUEST_TIMEOUT_MS = 10_000;

type VersionSource = "npm" | "github";

function parseVersion(version: string): [number, number, number] {
    const numbers = version
        .replace(/^v/, "")
        .split(".")
        .slice(0, 3)
        .map(Number);

    if (numbers.length < 3 || numbers.some(Number.isNaN)) {
        throw new Error(`Could not parse version: ${version}`);
    }

    const [major = 0, minor = 0, patch = 0] = numbers;
    return [major, minor, patch];
}

export function isNewerVersion(candidate: string, current: string): boolean {
    const [candidateMajor, candidateMinor, candidatePatch] =
        parseVersion(candidate);
    const [currentMajor, currentMinor, currentPatch] = parseVersion(current);

    if (candidateMajor !== currentMajor) {
        return candidateMajor > currentMajor;
    }
    if (candidateMinor !== currentMinor) {
        return candidateMinor > currentMinor;
    }
    return candidatePatch > currentPatch;
}

function isNpmPayload(payload: unknown): payload is { version: string } {
    return (
        typeof payload === "object" &&
        payload !== null &&
        "version" in payload &&
        typeof payload.version === "string"
    );
}

function isGitHubPayload(payload: unknown): payload is { tag_name: string } {
    return (
        typeof payload === "object" &&
        payload !== null &&
        "tag_name" in payload &&
        typeof payload.tag_name === "string"
    );
}

// Each channel asks its own registry: release.yml tags the GitHub release before
// npm publish runs, so the two genuinely disagree during a release window.
export async function fetchLatestVersion(
    source: VersionSource
): Promise<string> {
    if (source === "npm") {
        const response = await fetch(NPM_REGISTRY_URL, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(
                `npm registry request failed with status ${response.status}`
            );
        }
        const payload: unknown = await response.json();
        if (!isNpmPayload(payload)) {
            throw new Error("npm registry response did not include a version");
        }
        return payload.version;
    }

    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new Error(
            `GitHub release request failed with status ${response.status}`
        );
    }
    const payload: unknown = await response.json();
    if (!isGitHubPayload(payload)) {
        throw new Error("GitHub release response did not include a tag name");
    }
    return payload.tag_name.replace(/^v/, "");
}

export type { VersionSource };
