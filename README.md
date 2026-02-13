# Clawdbot VS Code Extension

VS Code status bar and sidebar integration for the [Clawdbot](https://docs.clawd.bot/) CLI - a WhatsApp gateway and multi-channel messaging bot with Pi RPC agent capabilities.

## Features

- **Status Bar Control**: Quick access to Clawdbot commands from the VS Code status bar
- **Sidebar Overview**: Activity bar view with organized commands and quick actions
- **Gateway Management**: Start and monitor the Clawdbot gateway server directly from VS Code
- **Terminal Integration**: Runs Clawdbot commands in a dedicated VS Code terminal
- **Auto-Connect**: Optional automatic connection on startup
- **Configuration Wizard**: Guided setup for credentials, models, and channels

## Quick Start

### 1. Prerequisites

**Node.js v22.12.0 or newer** is required:
```bash
node -v  # Should show v22.12.0+
```

If you need to install Node.js, download from [nodejs.org](https://nodejs.org/)

### 2. Install Clawdbot CLI

The Clawdbot CLI must be installed globally:

```bash
# Via npm
npm install -g clawdbot@latest

# Verify installation
clawdbot --version
```

### 3. Install this VS Code Extension

1. Download the `.vsix` file from releases
2. In VS Code, press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Install from VSIX" and select the downloaded file

Or install locally for development:
```bash
cd /path/to/clawdbot-extension
pnpm install
pnpm run compile
code --install-extension ./clawdbot-extension-1.0.0.vsix
```

### 4. Configure Clawdbot

Run the setup wizard from VS Code:
- Press `Cmd+Shift+P` → `Clawdbot: Model Setup Wizard`
- Or click the Clawdbot icon in the Activity Bar → "Model Setup Wizard"

This will guide you through:
- Running `clawdbot onboard` for initial setup
- Configuring credentials (OpenAI, Anthropic, etc.)
- Setting up channels (WhatsApp, Telegram, etc.)

## Usage

### Status Bar

Click the **Clawdbot** status bar item (bottom right) to run your configured command:
- 🔌 Idle: Click to connect
- 🔄 Connecting: Command in progress
- ✅ Connected: Command completed
- ⚠️ Error: Click to retry

### Sidebar View

Open the Clawdbot sidebar from the Activity Bar (left side). It provides:

**Getting Started:**
- **Connect**: Run your configured Clawdbot command
- **Setup**: Install Node.js and Clawdbot CLI
- **Model Setup Wizard**: Configure credentials and models

**Operate:**
- **Start Gateway**: Launch the Clawdbot gateway server
- **Run Status**: Check current Clawdbot status
- **Open Dashboard**: Open the web dashboard (http://127.0.0.1:18789/)

**Help:**
- **Open Docs**: View Clawdbot documentation

### Available Commands

Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) and type "Clawdbot":

- `Clawdbot: Connect` - Run your configured command
- `Clawdbot: Setup` - Install Node.js and Clawdbot CLI
- `Clawdbot: Model Setup Wizard` - Configure credentials and models
- `Clawdbot: Start Gateway` - Launch the gateway server
- `Clawdbot: Show Status` - Check Clawdbot status

## Configuration

Access settings via `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux), then search for "Clawdbot":

### `clawdbot.autoConnect`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Automatically connect to Clawdbot on startup

### `clawdbot.command`
- **Type**: `string`
- **Default**: `"clawdbot status"`
- **Description**: Command to run when connecting
- **Examples**:
  - `clawdbot status`
  - `clawdbot gateway --port 18789`
  - `clawdbot health`
  - `clawdbot channels login`

### `clawdbot.clawdbotPath`
- **Type**: `string`
- **Default**: `"/Users/ghu/aiworker/clawdbot"`
- **Description**: Path to the clawdbot project directory (if using local development version)

### `clawdbot.gatewayPort`
- **Type**: `number`
- **Default**: `18789`
- **Description**: Port number for the Clawdbot gateway server

## Clawdbot Commands Reference

Here are the most commonly used Clawdbot CLI commands:

### Setup & Configuration
```bash
clawdbot setup        # Initialize ~/.clawdbot/clawdbot.json
clawdbot onboard      # Interactive setup wizard
clawdbot configure    # Configure credentials and devices
clawdbot config       # Config helpers (get/set/unset)
```

### Gateway & Service
```bash
clawdbot gateway --port 18789    # Start the gateway server
clawdbot status                  # Show channel health and status
clawdbot health                  # Fetch health from running gateway
clawdbot dashboard               # Open Control UI with current token
```

### Channels
```bash
clawdbot channels login          # Link WhatsApp/Telegram/etc
clawdbot channels list           # List configured channels
clawdbot message send            # Send messages via channels
```

### Models & Agents
```bash
clawdbot models                  # Model configuration
clawdbot agent                   # Run agent turn via Gateway
clawdbot agents                  # Manage isolated agents
```

### Advanced
```bash
clawdbot doctor                  # Health checks + quick fixes
clawdbot logs                    # View gateway logs
clawdbot plugins                 # Plugin management
clawdbot cron                    # Cron scheduler
```

For complete command reference, run:
```bash
clawdbot --help
```

## Project Structure

This extension integrates with your Clawdbot installation:

```
~/.clawdbot/                      # Clawdbot state directory
├── clawdbot.json                # Main configuration
├── agents/                       # Agent workspaces
│   └── main/
│       └── agent/
│           └── auth-profiles.json
├── channels/                     # Channel sessions
└── logs/                         # Gateway logs

/Users/ghu/aiworker/clawdbot/    # Clawdbot source (default path)
├── dist/                         # Compiled code
├── src/                          # TypeScript source
└── package.json
```

## Troubleshooting

### "Command not found: clawdbot"

1. Ensure Clawdbot is installed globally:
   ```bash
   npm install -g clawdbot@latest
   ```

2. Restart VS Code after installation

3. If using a local version, ensure it's built:
   ```bash
   cd /Users/ghu/aiworker/clawdbot
   pnpm install
   pnpm build
   ```

### "Node.js is required"

Clawdbot requires Node.js v22.12.0 or newer:
```bash
node -v  # Check version
```

Download the latest LTS from [nodejs.org](https://nodejs.org/) if needed.

### Gateway won't start

1. Check if the port is already in use:
   ```bash
   lsof -i :18789
   ```

2. Try a different port:
   ```bash
   clawdbot gateway --port 19000
   ```

3. Check gateway logs:
   ```bash
   clawdbot logs
   ```

### Config file not found

Run the setup wizard:
```bash
clawdbot setup
```

Or create the directory manually:
```bash
mkdir -p ~/.clawdbot
```

## Development

### Complete Build and Install Guide

Follow these steps to compile, package, and install the extension locally:

#### 1. Prerequisites

First, ensure you have the required tools installed:

```bash
# Install dependencies (if not already done)
npm install

# Install vsce globally for packaging
npm install -g @vscode/vsce
```

#### 2. Update Version (Optional)

If you're releasing a new version, update the version number in [package.json](package.json):

```json
{
  "version": "1.0.3"  // Increment as needed
}
```

Also update the `installLocal` script to match:

```json
{
  "scripts": {
    "installLocal": "code --install-extension ./clawdbot-extension-1.0.3.vsix"
  }
}
```

#### 3. Compile TypeScript

Compile the TypeScript source code to JavaScript:

```bash
npm run compile
```

This runs `tsc -p ./` and outputs compiled files to the `out/` directory.

**Watch mode** (auto-recompile on changes):
```bash
npm run watch
```

#### 4. Package as VSIX

Package the extension into a `.vsix` file:

```bash
npx vsce package --no-dependencies
```

This creates `clawdbot-extension-1.0.3.vsix` (or whatever version you specified).

**Note**: The `--no-dependencies` flag skips dependency checks, which is useful when you have dev dependencies that aren't needed in the packaged extension.

#### 5. Install Locally

Install the packaged extension in VS Code:

```bash
# Install the extension
code --install-extension ./clawdbot-extension-1.0.3.vsix

# Or use the npm script
npm run installLocal
```

#### 6. Reload VS Code

After installation, reload VS Code to activate the new version:

- Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Developer: Reload Window"
- Press Enter

Alternatively, restart VS Code completely.

### Quick Install Script

For convenience, you can run all steps at once:

```bash
# Update version, compile, package, and install
VERSION="1.0.3"

# Compile TypeScript
npm run compile

# Package extension
npx vsce package --no-dependencies

# Install in VS Code
code --install-extension ./clawdbot-extension-${VERSION}.vsix

# Reload VS Code (you'll need to do this manually)
echo "✅ Extension installed! Press Cmd+Shift+P → 'Developer: Reload Window'"
```

### Uninstall Extension

To uninstall the extension:

```bash
# Find the extension ID
code --list-extensions | grep clawdbot

# Uninstall
code --uninstall-extension ghu.clawdbot-extension
```

### Debug Mode

For development and debugging:

1. Open this project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window
4. Use `console.log()` statements - they appear in the Debug Console
5. Set breakpoints in the TypeScript source files

### Development Workflow

**Recommended workflow** when making changes:

1. Make your code changes
2. Run `npm run compile` or keep `npm run watch` running
3. Press `F5` to test in Extension Development Host
4. Once satisfied, package with `npx vsce package --no-dependencies`
5. Install with ` code --install-extension ./clawdbot-extension-1.0.5.vsix `
6. Reload VS Code

### Common Issues

**TypeScript compilation errors:**
```bash
# Clean and rebuild
rm -rf out/
npm run compile
```

**Extension not updating:**
```bash
# Uninstall old version first
code --uninstall-extension ghu.clawdbot-extension

# Reinstall new version
code --install-extension ./clawdbot-extension-1.0.4.vsix

# Reload VS Code
```

**VSCE packaging errors:**
```bash
# Use --no-dependencies flag to skip dependency validation
npx vsce package --no-dependencies

# Or install missing dependencies
npm install
```

## Contributing

This extension is a wrapper around the [Clawdbot CLI](https://github.com/ghu/clawdbot). For issues with:
- **VS Code Extension**: Open issues in this repository
- **Clawdbot CLI**: Report to the main Clawdbot repository

## License

MIT

## Links

- **Clawdbot Documentation**: https://docs.clawd.bot/
- **Clawdbot CLI Help**: `clawdbot --help`
- **Clawdbot Project**: /Users/ghu/aiworker/clawdbot

---

**Note**: This extension is configured by default to use the Clawdbot installation at `/Users/ghu/aiworker/clawdbot`. Update the `clawdbot.clawdbotPath` setting if your installation is in a different location.
