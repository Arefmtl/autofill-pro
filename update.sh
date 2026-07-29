#!/bin/bash
# AutoFill Pro Update Checker
# Checks GitHub for new version and downloads if available

EXTENSION_DIR="${HOME}/autofill-pro-extension"
CURRENT_VERSION_FILE="${EXTENSION_DIR}/version.txt"
GITHUB_API="https://api.github.com/repos/Arefmtl/autofill-pro/releases/latest"
ZIP_URL="https://arefmtl.github.io/autofill-pro/autofill-pro.zip"

echo "🔍 Checking for updates..."

# Get latest version from GitHub
LATEST_VERSION=$(curl -s "$GITHUB_API" | grep '"tag_name"' | cut -d'"' -f4)

if [ -z "$LATEST_VERSION" ]; then
  echo "❌ Could not check for updates"
  exit 1
fi

echo "📦 Latest version: $LATEST_VERSION"

# Get current version
if [ -f "$CURRENT_VERSION_FILE" ]; then
  CURRENT_VERSION=$(cat "$CURRENT_VERSION_FILE")
  echo "📋 Current version: $CURRENT_VERSION"
else
  echo "📋 No current version found"
  CURRENT_VERSION=""
fi

# Compare versions
if [ "$LATEST_VERSION" = "$CURRENT_VERSION" ]; then
  echo "✅ Already up to date!"
  exit 0
fi

echo "🔄 New version available: $LATEST_VERSION"

# Download and install
echo "📥 Downloading update..."
mkdir -p "$EXTENSION_DIR"
cd "$EXTENSION_DIR"

# Download ZIP
curl -sL "$ZIP_URL" -o autofill-pro.zip

if [ $? -ne 0 ]; then
  echo "❌ Download failed"
  exit 1
fi

# Extract
unzip -o autofill-pro.zip

if [ $? -ne 0 ]; then
  echo "❌ Extraction failed"
  exit 1
fi

# Save version
echo "$LATEST_VERSION" > version.txt

# Cleanup
rm -f autofill-pro.zip

echo "✅ Updated to $LATEST_VERSION"
echo "📂 Extension location: $EXTENSION_DIR"
echo ""
echo "📌 Next steps:"
echo "   1. Open brave://extensions"
echo "   2. Remove old AutoFill Pro"
echo "   3. Click 'Load unpacked'"
echo "   4. Select: $EXTENSION_DIR"
