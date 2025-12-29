# 🧠 Cortex

**Your Personal Second Brain — Local-First AI Knowledge System**

> *"The computer is not just a tool, it is a bicycle for the mind."* — Steve Jobs

Cortex watches your files, extracts insights using AI, and lets you query your personal knowledge base using natural language.

**Key Features:**
- 🔒 **Privacy-First** — All data stays on YOUR machine
- 🧠 **Semantic Search** — Find by meaning, not keywords
- 🔄 **Real-time Indexing** — File changes detected instantly
- 💡 **Multi-Lens Analysis** — Philosopher, Architect, Analyst perspectives
- 💰 **Cheap** — ~$3-6/month using OpenRouter

## 🚀 Quick Start

### Option 1: One-liner Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/enioxt/egos-cortex/main/install.sh | bash
```

### Option 2: Manual Install

```bash
# Clone
git clone https://github.com/enioxt/egos-cortex.git
cd egos-cortex

# Install
npm install
npx prisma migrate dev

# Configure
echo "OPENROUTER_API_KEY=your-key" > .env

# Run
npm run dev
```

## 📖 Usage

```bash
# Check status
cx status

# Ask a question (uses your indexed knowledge)
cx ask "What do I know about productivity?"

# Semantic search
cx search "architecture patterns"

# Start daemon (watches files in real-time)
cx daemon start
```

## Features

- ✅ **Semantic Search** - Find related content by meaning, not keywords
- ✅ **Multi-Lens Analysis** - Philosopher, Architect, Analyst perspectives
- ✅ **Privacy First** - 15+ secret patterns detected and redacted
- ✅ **Cloud LLM** - OpenRouter (Gemini Flash) ~$3-6/month
- ✅ **Real-time Indexing** - Chokidar watcher with inode tracking

## CLI Commands

| Command | Description |
|---------|-------------|
| `cx status` | Show system status and statistics |
| `cx ask <query>` | Ask a question using your knowledge base |
| `cx search <query>` | Semantic search across indexed content |
| `cx config` | Show current configuration |

## Configuration

Config is stored at `~/.config/cortex/config.json`:

```json
{
  "version": "1.0.0",
  "dataDir": "~/.local/share/cortex",
  "watchSources": [
    {
      "id": "documents",
      "path": "/home/user/Documents",
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
```

## Architecture

```
cortex/
├── src/
│   ├── lib/
│   │   ├── llm-bridge.ts    # OpenRouter integration
│   │   ├── config.ts        # Zod schema + cosmiconfig
│   │   ├── watcher.ts       # Chokidar file watching
│   │   ├── privacy.ts       # Secret/PII redaction
│   │   ├── analyzer.ts      # LLM analysis pipeline
│   │   └── db.ts            # Prisma + vector search
│   ├── cli/index.ts         # Commander.js CLI
│   └── daemon/index.ts      # Background service
├── prisma/schema.prisma     # Database schema
└── config/
    ├── cortexd.service      # Systemd unit file
    └── cortex.bash          # Shell integration
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `SourceFile` | Tracked files with status |
| `Insight` | Extracted knowledge |
| `InsightLink` | Relationships between insights |
| `CommandHistory` | Shell command history |
| `ProcessingQueue` | Async job queue |
| `vec_insights` | Vector embeddings (raw SQL) |

## Cost Estimation

| Component | Cost |
|-----------|------|
| Gemini Flash | ~$0.10/1M tokens |
| Embeddings | ~$0.02/1M tokens |
| **Monthly estimate** | **~$3-6** |

## Shell Integration

Add to `~/.bashrc`:

```bash
source ~/.local/share/cortex/cortex.bash
```

This enables:
- Command history tracking
- `cxa` alias for `cx ask`
- `cxs` alias for `cx search`
- `cx-suggest` for smart suggestions

## Systemd Service

```bash
# Install service
cp config/cortexd.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable cortexd
systemctl --user start cortexd

# Check status
systemctl --user status cortexd
journalctl --user -u cortexd -f
```

## Development

```bash
# Run tests
npm test

# Type check
npx tsc --noEmit

# Watch mode
npm run dev
```

## License

AGPL-3.0 — See [LICENSE](./LICENSE)
