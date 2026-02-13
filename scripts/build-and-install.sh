#!/bin/bash

# Build and Install Local Extension Script
# This script compiles, packages, and installs the extension locally

set -e  # Exit on error

echo "🔨 Starting build and install process..."
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
EXTENSION_NAME="clawdbot-extension"
VSIX_FILE="${EXTENSION_NAME}-${VERSION}.vsix"

echo "📦 Extension: $EXTENSION_NAME"
echo "📌 Version: $VERSION"
echo ""

# Step 1: Install dependencies (if needed)
echo "📥 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Compile TypeScript
echo "🔧 Compiling TypeScript..."
npm run compile
echo "✅ Compilation complete"
echo ""

# Step 3: Package extension
echo "📦 Packaging extension..."
npx @vscode/vsce package
echo "✅ Packaged: $VSIX_FILE"
echo ""

# Step 4: Install extension locally
echo "🚀 Installing extension locally..."
code --install-extension "./$VSIX_FILE"
echo "✅ Extension installed"
echo ""

echo "🎉 Build and install complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Reload VS Code window (Cmd/Ctrl + Shift + P → 'Developer: Reload Window')"
echo "   2. Test your extension"
echo ""
