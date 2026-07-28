#!/bin/bash
# Build CRX for self-hosted update
# Usage: ./build-crx.sh [version]

VERSION=${1:-$(node -e "console.log(require('./manifest.json').version)")}
echo "🔧 Building CRX v${VERSION}..."

# Clean old CRX files
rm -f docs/*.crx docs/*.pem

# Create zip
cd "$(dirname "$0")"
zip -r "docs/autofill-pro.zip" manifest.json background/ content/ popup/ lib/ icons/ utils/ -x "*.DS_Store" -x "*.tar.gz"

echo "✅ ZIP created: docs/autofill-pro.zip ($(du -h docs/autofill-pro.zip | cut -f1))"

# Update version in updates.xml
cat > docs/updates.xml << EOF
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="kjnllflmljbcgjbmfpnlgmkphjmkddhi">
    <updatecheck codebase="https://arefmtl.github.io/autofill-pro/autofill-pro.zip" version="${VERSION}" />
  </app>
</gupdate>
EOF

echo "✅ updates.xml updated to v${VERSION}"
echo ""
echo "📦 Upload to GitHub Pages:"
echo "   git add docs/ && git commit -m 'v${VERSION} update' && git push"
