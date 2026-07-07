#!/bin/bash
set -e

echo "🍅 Pomodoro Timer - GitHub Release Script"
echo "========================================="
echo ""

# Config
OWNER="AndyHou111"
REPO="pomodoro-timer"
VERSION="1.0.0"
DMG_FILE="Pomodoro.dmg"
RELEASE_TITLE="Pomodoro Timer v${VERSION}"
RELEASE_NOTES="## 🍅 Pomodoro Timer v${VERSION}

### Features
- ⏱️ Customizable work/rest timer with circular progress ring
- 📋 6 quick presets + custom study plans
- 📝 Post-session task logging with notes
- 📅 Monthly calendar view with daily history
- 🌓 Dark/Light/System theme support
- 🪟 Floating always-on-top mini timer window
- 📝 In-session notes panel
- 🔔 Configurable repeated alarm (5s/10s/30s/1min)
- 🍅 Menu bar mini timer
- ⌨️ Keyboard shortcuts (Space to start/pause, Esc to stop)

### Install
1. Download \`Pomodoro.dmg\`
2. Double-click to mount
3. Drag 🍅 to Applications folder
4. **First launch**: Right-click → Open (one-time security bypass)
"

if [ ! -f "$DMG_FILE" ]; then
    echo "❌ $DMG_FILE not found. Run from project root."
    exit 1
fi

echo "📦 DMG file: $DMG_FILE ($(du -h "$DMG_FILE" | cut -f1))"
echo ""

# Try gh CLI first
GH_CMD=""
if command -v gh &> /dev/null; then
    GH_CMD="gh"
elif command -v ~/.local/bin/gh &> /dev/null; then
    GH_CMD="$HOME/.local/bin/gh"
fi

if [ -n "$GH_CMD" ]; then
    echo "✅ Using GitHub CLI"

    if ! $GH_CMD auth status &> /dev/null; then
        echo ""
        echo "🔑 Login required:"
        $GH_CMD auth login
    fi

    echo "🚀 Creating release..."
    $GH_CMD release create "v${VERSION}" \
        --repo "${OWNER}/${REPO}" \
        --title "$RELEASE_TITLE" \
        --notes "$RELEASE_NOTES" \
        "$DMG_FILE"

    echo ""
    echo "✅ Release published!"
    echo "🔗 https://github.com/${OWNER}/${REPO}/releases/tag/v${VERSION}"
else
    echo "⚠️  GitHub CLI (gh) not found."
    echo ""
    echo "To install gh CLI:"
    echo "  brew install gh"
    echo "  gh auth login"
    echo ""
    echo "Then re-run: ./release.sh"
    echo ""
    echo "--- Or create release manually ---"
    echo "1. Open: https://github.com/${OWNER}/${REPO}/releases/new"
    echo "2. Tag: v${VERSION}"
    echo "3. Title: ${RELEASE_TITLE}"
    echo "4. Drag $DMG_FILE into the binary box"
    echo "5. Click 'Publish release'"
fi
