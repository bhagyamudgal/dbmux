#!/usr/bin/env bash
set -euo pipefail

# DBMux Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/bhagyamudgal/dbmux/main/install.sh | bash

REPO="bhagyamudgal/dbmux"
INSTALL_DIR="${DBMUX_INSTALL_DIR:-/usr/local/bin}"
BINARY_NAME="dbmux"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # info prints an informational message prefixed with a blue [INFO] tag.

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# success prints a green "[SUCCESS]" prefix followed by the provided message to stdout.
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# warn prints a yellow "[WARN]" prefixed warning message to stdout.
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# error prints an error message prefixed with `[ERROR]` (in red) and exits the script with status 1.
error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# detect_platform determines the host OS and CPU architecture, enforces supported combinations, and echoes a platform identifier in the form `os-arch` (e.g., `linux-x64`).
detect_platform() {
    local os arch

    os="$(uname -s)"
    arch="$(uname -m)"

    case "$os" in
        Linux)
            os="linux"
            ;;
        Darwin)
            os="darwin"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            os="windows"
            ;;
        *)
            error "Unsupported operating system: $os"
            ;;
    esac

    case "$arch" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        *)
            error "Unsupported architecture: $arch"
            ;;
    esac

    # Windows and Linux only support x64 currently
    if [[ "$os" == "windows" || "$os" == "linux" ]] && [[ "$arch" != "x64" ]]; then
        error "Only x64 architecture is supported for $os"
    fi

    echo "${os}-${arch}"
}

# get_latest_version retrieves the latest GitHub release tag for ${REPO} and echoes it.
# It calls error() and exits if the version cannot be determined.
get_latest_version() {
    local version
    version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

    if [[ -z "$version" ]]; then
        error "Failed to fetch latest version"
    fi

    echo "$version"
}

# download_binary downloads the release binary for the given platform and version into a temporary directory and echoes the downloaded file path.
# It accepts `platform` (e.g., linux-x64, darwin-arm64, windows-x64) and `version` (release tag like v1.2.3); on failure it removes the temp dir and calls error().
download_binary() {
    local platform="$1"
    local version="$2"
    local tmp_dir
    local binary_name
    local download_url

    tmp_dir=$(mktemp -d)

    # Construct binary name based on platform
    case "$platform" in
        linux-x64)
            binary_name="dbmux-linux-x64"
            ;;
        darwin-x64)
            binary_name="dbmux-darwin-x64"
            ;;
        darwin-arm64)
            binary_name="dbmux-darwin-arm64"
            ;;
        windows-x64)
            binary_name="dbmux-windows-x64.exe"
            ;;
        *)
            error "Unknown platform: $platform"
            ;;
    esac

    download_url="https://github.com/${REPO}/releases/download/${version}/${binary_name}"

    info "Downloading ${binary_name} from ${version}..."

    if ! curl -fsSL "$download_url" -o "${tmp_dir}/${binary_name}"; then
        rm -rf "$tmp_dir"
        error "Failed to download binary. Please check if the release exists."
    fi

    echo "${tmp_dir}/${binary_name}"
}

# install_binary moves the downloaded binary into INSTALL_DIR, appends `.exe` when the platform indicates Windows, makes the target executable, and uses sudo if the install directory is not writable.
install_binary() {
    local binary_path="$1"
    local platform="$2"
    local target_path="${INSTALL_DIR}/${BINARY_NAME}"

    # Add .exe extension on Windows
    if [[ "$platform" == windows-* ]]; then
        target_path="${target_path}.exe"
    fi

    # Check if we need sudo
    if [[ -w "$INSTALL_DIR" ]]; then
        mv "$binary_path" "$target_path"
        chmod +x "$target_path"
    else
        info "Requesting sudo access to install to ${INSTALL_DIR}..."
        sudo mv "$binary_path" "$target_path"
        sudo chmod +x "$target_path"
    fi

    success "Installed dbmux to ${target_path}"
}

# verify_installation checks whether `dbmux` is available on the user's PATH and reports readiness.
# If `dbmux` is found, prints the detected version and short usage hints. If not found, advises how
# to add INSTALL_DIR to the PATH or how to run the installed binary directly.
verify_installation() {
    if command -v dbmux &> /dev/null; then
        local version
        version=$(dbmux --version 2>/dev/null || echo "unknown")
        success "dbmux ${version} is ready to use!"
        echo ""
        echo "Get started:"
        echo "  dbmux --help"
        echo "  dbmux connect --url \"postgresql://user:pass@localhost:5432/mydb\""
    else
        warn "dbmux was installed but is not in your PATH."
        echo ""
        echo "Add ${INSTALL_DIR} to your PATH:"
        echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
        echo ""
        echo "Or run directly:"
        echo "  ${INSTALL_DIR}/${BINARY_NAME} --help"
    fi
}

# check_prerequisites checks that `curl` is installed and exits with an error if it is missing.
check_prerequisites() {
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed. Please install curl first."
    fi
}

# main runs the installer flow for the dbmux CLI: it checks prerequisites, detects the host platform and architecture, fetches the latest release tag, downloads the matching prebuilt binary, installs it into INSTALL_DIR, removes temporary files, and verifies the installation.
# On success the dbmux executable is placed in INSTALL_DIR and a readiness message is printed; the function exits with a non-zero status on failure.
main() {
    echo ""
    echo "  ____  ____  __  __ _   ___  __"
    echo " |  _ \| __ )|  \/  | | | \ \/ /"
    echo " | | | |  _ \| |\/| | | | |\  / "
    echo " | |_| | |_) | |  | | |_| |/  \ "
    echo " |____/|____/|_|  |_|\___//_/\_\\"
    echo ""
    echo " Database Management CLI Installer"
    echo ""

    check_prerequisites

    local platform version binary_path

    info "Detecting platform..."
    platform=$(detect_platform)
    success "Detected platform: ${platform}"

    info "Fetching latest version..."
    version=$(get_latest_version)
    success "Latest version: ${version}"

    binary_path=$(download_binary "$platform" "$version")

    info "Installing to ${INSTALL_DIR}..."
    install_binary "$binary_path" "$platform"

    # Cleanup
    rm -rf "$(dirname "$binary_path")"

    echo ""
    verify_installation
}

main "$@"