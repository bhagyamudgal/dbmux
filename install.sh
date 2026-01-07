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
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

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

get_latest_version() {
    local version
    version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

    if [[ -z "$version" ]]; then
        error "Failed to fetch latest version"
    fi

    echo "$version"
}

compute_sha256() {
    local file="$1"
    if command -v sha256sum &> /dev/null; then
        sha256sum "$file" | awk '{print $1}'
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$file" | awk '{print $1}'
    else
        error "No SHA256 tool available. Please install sha256sum or shasum."
    fi
}

download_binary() {
    local platform="$1"
    local version="$2"
    local tmp_dir
    local binary_name
    local download_url
    local checksums_url

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
    checksums_url="https://github.com/${REPO}/releases/download/${version}/checksums.txt"

    info "Downloading ${binary_name} from ${version}..."

    if ! curl -fL --progress-bar "$download_url" -o "${tmp_dir}/${binary_name}"; then
        rm -rf "$tmp_dir"
        error "Failed to download binary. Please check if the release exists."
    fi

    info "Verifying checksum..."

    if ! curl -fsSL "$checksums_url" -o "${tmp_dir}/checksums.txt"; then
        rm -rf "$tmp_dir"
        error "Failed to download checksums file. Cannot verify binary integrity."
    fi

    local expected_checksum
    expected_checksum=$(grep -E "^[a-f0-9]+[[:space:]]+${binary_name}$" "${tmp_dir}/checksums.txt" | awk '{print $1}')

    if [[ -z "$expected_checksum" ]]; then
        rm -rf "$tmp_dir"
        error "Checksum for ${binary_name} not found in checksums.txt"
    fi

    local actual_checksum
    actual_checksum=$(compute_sha256 "${tmp_dir}/${binary_name}")

    if [[ "$actual_checksum" != "$expected_checksum" ]]; then
        rm -rf "$tmp_dir"
        error "Checksum verification failed. Expected: ${expected_checksum}, Got: ${actual_checksum}"
    fi

    success "Checksum verified"

    echo "${tmp_dir}/${binary_name}"
}

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

check_prerequisites() {
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed. Please install curl first."
    fi
}

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
