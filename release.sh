#!/bin/bash

# Release script for DBMux
# Usage: ./release.sh [version]
# Example: ./release.sh 1.0.6

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./release.sh [version]"
    echo "Example: ./release.sh 1.0.6"
    exit 1
fi

echo "🚀 Preparing release for version $VERSION"

# Check for uncommitted changes
echo "🔍 Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes!"
    echo "Please commit or stash your changes before creating a release:"
    echo ""
    git status --porcelain
    echo ""
    echo "Run: git add . && git commit -m 'your message'"
    exit 1
fi

if ! git diff --cached --quiet; then
    echo "❌ Error: You have staged but uncommitted changes!"
    echo "Please commit your staged changes before creating a release:"
    echo ""
    git status --porcelain
    echo ""
    echo "Run: git commit -m 'your message'"
    exit 1
fi

echo "✅ Working directory is clean"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the main branch to create a release!"
    echo "Current branch: $CURRENT_BRANCH"
    echo "Run: git checkout main"
    exit 1
fi

# Check if main branch is up to date with remote
echo "🔄 Checking if main branch is up to date..."
git fetch origin main
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "❌ Error: Your main branch is not up to date with origin/main!"
    echo "Run: git pull origin main"
    exit 1
fi

# Check GitHub CI status for the latest commit
echo "🔍 Checking CI status for latest commit..."
LATEST_COMMIT=$(git rev-parse HEAD)

# Use GitHub CLI if available to check CI status
if command -v gh >/dev/null 2>&1; then
    echo "Checking CI status using GitHub CLI..."
    CI_STATUS=$(gh run list --commit="$LATEST_COMMIT" --limit=1 --json conclusion --jq '.[0].conclusion // "pending"')
    
    if [ "$CI_STATUS" != "success" ]; then
        echo "❌ Error: CI has not passed for the latest commit!"
        echo "CI Status: $CI_STATUS"
        echo "Please wait for CI to pass or fix any failing tests before releasing."
        echo "Check: https://github.com/bhagyamudgal/dbmux/actions"
        exit 1
    fi
    
    echo "✅ CI has passed for the latest commit"
else
    echo "⚠️  Warning: GitHub CLI not found. Cannot verify CI status automatically."
    echo "Please manually verify CI has passed at: https://github.com/bhagyamudgal/dbmux/actions"
    echo ""
    read -p "Have you confirmed that CI is passing on main? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Release cancelled. Please ensure CI is passing first."
        exit 1
    fi
fi

# Update package.json version
echo "📝 Updating package.json version to $VERSION"
# Use node to update version since bun doesn't have version command
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 4) + '\n');
console.log('✅ Version updated to $VERSION');
"

# Run tests and build
echo "🧪 Running tests..."
bun run test

echo "🔍 Running type check and linting..."
bun run typecheck
bun run lint

echo "📦 Building binaries..."
bun run build:binaries

echo "📊 Creating checksums..."
cd binaries
sha256sum * > checksums.txt
echo "Checksums created:"
cat checksums.txt
cd ..

echo "📋 Git operations..."
git add package.json
git commit -m "chore: bump version to $VERSION"
git tag "v$VERSION"

echo "✅ Release $VERSION prepared!"
echo ""
echo "To complete the release:"
echo "1. Push the changes: git push origin main"
echo "2. Push the tag: git push origin v$VERSION"
echo ""
echo "The GitHub Action will automatically create the release with binaries."