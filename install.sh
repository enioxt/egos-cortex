#!/bin/bash
# Cortex Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/enioxt/EGOSv3/main/apps/dashboard_ideas/cortex/install.sh | bash

set -e

echo "🧠 Installing Cortex..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check dependencies
check_dep() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}❌ $1 is required but not installed.${NC}"
    exit 1
  fi
}

echo "Checking dependencies..."
check_dep node
check_dep npm
check_dep git

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js 20+ required (found v$NODE_VERSION)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Dependencies OK${NC}"

# Create directories
INSTALL_DIR="$HOME/.local/share/cortex"
CONFIG_DIR="$HOME/.config/cortex"
BIN_DIR="$HOME/.local/bin"

mkdir -p "$INSTALL_DIR" "$CONFIG_DIR" "$BIN_DIR"

# Clone or update
if [ -d "$INSTALL_DIR/src" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR"
  git pull
else
  echo "Cloning Cortex..."
  git clone --depth 1 https://github.com/enioxt/egos-cortex.git "$INSTALL_DIR"
fi

# Install dependencies
cd "$INSTALL_DIR"
echo "Installing npm packages..."
npm install --production

# Generate Prisma client
npx prisma generate --schema=./prisma/schema.prisma

# Initialize database if not exists
if [ ! -f "$INSTALL_DIR/cortex.db" ]; then
  echo "Initializing database..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma
fi

# Create config if not exists
if [ ! -f "$CONFIG_DIR/config.json" ]; then
  echo "Creating default config..."
  cat > "$CONFIG_DIR/config.json" << 'EOF'
{
  "version": "1.0.0",
  "dataDir": "~/.local/share/cortex",
  "watchSources": [
    {
      "id": "documents",
      "path": "~/Documents",
      "lens": "general",
      "recursive": true,
      "extensions": [".md", ".txt", ".pdf"]
    }
  ],
  "privacy": {
    "redactSecrets": true,
    "redactPII": false
  },
  "llm": {
    "provider": "openrouter",
    "model": "google/gemini-2.0-flash-001"
  }
}
EOF
fi

# Create cx symlink
cat > "$BIN_DIR/cx" << EOF
#!/bin/bash
node "$INSTALL_DIR/dist/cli/index.js" "\$@"
EOF
chmod +x "$BIN_DIR/cx"

# Build TypeScript
echo "Building..."
npm run build 2>/dev/null || npx tsc

# Install systemd service (optional)
if [ -d "$HOME/.config/systemd/user" ]; then
  cp "$INSTALL_DIR/config/cortexd.service" "$HOME/.config/systemd/user/"
  systemctl --user daemon-reload
  echo -e "${BLUE}ℹ Systemd service installed. Enable with: systemctl --user enable cortexd${NC}"
fi

# Add shell integration hint
echo ""
echo -e "${GREEN}✅ Cortex installed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Add your OpenRouter API key:"
echo "   echo 'OPENROUTER_API_KEY=sk-or-v1-...' >> ~/.config/cortex/.env"
echo ""
echo "2. Add ~/.local/bin to PATH (if not already):"
echo "   echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
echo ""
echo "3. (Optional) Add shell integration:"
echo "   echo 'source ~/.local/share/cortex/config/cortex.bash' >> ~/.bashrc"
echo ""
echo "4. Start using Cortex:"
echo "   cx status"
echo "   cx ask 'What do I know about X?'"
echo ""
