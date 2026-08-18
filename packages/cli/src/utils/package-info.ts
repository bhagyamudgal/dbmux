import packageJson from "../../package.json";

// Read at build time, not runtime: `bun build --compile` serves the bundle from a
// virtual filesystem at /$bunfs/root, where no package.json exists to read back.
export const PACKAGE_NAME = packageJson.name;
export const PACKAGE_VERSION = packageJson.version;
export const PACKAGE_DESCRIPTION = packageJson.description;

function parseGitHubRepository(repositoryUrl: string): string {
    const cleanedUrl = repositoryUrl
        .replace(/^git\+/, "")
        .replace(/\.git$/, "");
    const { pathname } = new URL(cleanedUrl);
    return pathname.replace(/^\//, "");
}

export const GITHUB_REPOSITORY = parseGitHubRepository(
    packageJson.repository.url
);
