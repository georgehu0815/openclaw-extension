# Clawdbot VS Code Extension - Complete Usage Guide

## Table of Contents

1. [Installation](#installation)
2. [First-Time Setup](#first-time-setup)
3. [Using the Extension](#using-the-extension)
4. [Configuration](#configuration)
5. [Common Workflows](#common-workflows)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites

Before installing the extension, ensure you have:

1. **Node.js v22.12.0 or newer**
   ```bash
   node -v  # Should output v22.12.0 or higher
   ```
   If you need to install Node.js: https://nodejs.org/

2. **Clawdbot CLI installed globally**
   ```bash
   # Install via npm
   npm install -g clawdbot@latest

   # Or if using pnpm in your local project
   cd /Users/ghu/aiworker/clawdbot
   pnpm install
   pnpm build
   pnpm link --global

   # Verify installation
   clawdbot --version
   ```

### Installing the Extension

The extension has been installed in your VS Code:

```bash
code --install-extension ./clawdbot-extension-1.0.0.vsix
```

To verify it's installed:
1. Open VS Code
2. Go to Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Windows/Linux)
3. Search for "Clawdbot" in your installed extensions

---

## First-Time Setup

### Step 1: Configure Clawdbot CLI

Before using the extension, set up your Clawdbot installation:

```bash
# Initialize configuration
clawdbot setup

# Run the onboarding wizard (recommended)
clawdbot onboard

# Or configure manually
clawdbot configure
```

This creates:
- `~/.clawdbot/clawdbot.json` - Main configuration file
- `~/.clawdbot/agents/` - Agent workspaces
- `~/.clawdbot/channels/` - Channel sessions

### Step 2: Configure Credentials

Set up your AI model providers:

**For OpenAI:**
```bash
clawdbot config set models.provider openai
clawdbot config set models.apiKey YOUR_OPENAI_API_KEY
```

**For Anthropic:**
```bash
clawdbot config set models.provider anthropic
clawdbot config set models.apiKey YOUR_ANTHROPIC_API_KEY
```

**Or edit the config file directly:**
```bash
code ~/.clawdbot/clawdbot.json
```

### Step 3: Test Your Setup

```bash
# Check status
clawdbot status

# Test health
clawdbot health

# Run doctor for diagnostics
clawdbot doctor
```

---

## Using the Extension

### Status Bar

The **Clawdbot** status bar item appears in the bottom-right of VS Code:

- **🔌 Clawdbot** - Idle, click to run configured command
- **🔄 Clawdbot** - Command in progress
- **✅ Clawdbot** - Command completed successfully
- **⚠️ Clawdbot** - Error occurred, click to retry

**Default behavior:** Clicking runs `clawdbot status`

**To customize:** Change the `clawdbot.command` setting (see [Configuration](#configuration))

### Sidebar Panel

Click the **Clawdbot** icon in the Activity Bar (left sidebar) to open the control panel.

#### Getting Started Section

1. **Connect**
   - Runs your configured command (default: `clawdbot status`)
   - Opens a dedicated terminal window
   - Use this for quick status checks

2. **Setup**
   - Guides you through installing Node.js and Clawdbot CLI
   - Provides install commands and links
   - Useful if you haven't installed Clawdbot yet

3. **Model Setup Wizard**
   - Interactive configuration helper
   - Runs `clawdbot onboard` or `clawdbot configure`
   - Opens config files for editing
   - Best for first-time setup

#### Operate Section

1. **Start Gateway**
   - Runs `clawdbot gateway --port 18789`
   - Starts the WebSocket gateway server
   - Required for agent operations and web dashboard
   - Port can be configured in settings

2. **Run Status**
   - Executes `clawdbot status`
   - Shows channel health and recent activity
   - Quick way to check system state

3. **Open Dashboard**
   - Opens http://127.0.0.1:18789/ in your browser
   - Web UI for managing Clawdbot
   - View logs, channels, and agent activity
   - **Note:** Gateway must be running first

#### Help Section

1. **Open Docs**
   - Opens https://docs.clawd.bot/
   - Official Clawdbot documentation
   - CLI reference and guides

### Command Palette

Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux) and type "Clawdbot":

- **Clawdbot: Connect** - Run configured command
- **Clawdbot: Setup** - Install wizard
- **Clawdbot: Model Setup Wizard** - Configuration helper
- **Clawdbot: Start Gateway** - Launch gateway server
- **Clawdbot: Show Status** - Run status command

---

## Configuration

Access VS Code settings: `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)

Search for "Clawdbot" to see all extension settings.

### Available Settings

#### `clawdbot.autoConnect`
- **Type:** Boolean
- **Default:** `false`
- **Description:** Automatically run your configured command when VS Code starts

**Example:**
```json
{
  "clawdbot.autoConnect": true
}
```

#### `clawdbot.command`
- **Type:** String
- **Default:** `"clawdbot status"`
- **Description:** Command executed when clicking the status bar or using "Connect"

**Examples:**
```json
{
  "clawdbot.command": "clawdbot status"
}
```

```json
{
  "clawdbot.command": "clawdbot gateway --port 18789"
}
```

```json
{
  "clawdbot.command": "clawdbot channels login"
}
```

#### `clawdbot.clawdbotPath`
- **Type:** String
- **Default:** `"/Users/ghu/aiworker/clawdbot"`
- **Description:** Path to your Clawdbot project (for local development)

**Update this** if you cloned Clawdbot to a different location:
```json
{
  "clawdbot.clawdbotPath": "/path/to/your/clawdbot"
}
```

#### `clawdbot.gatewayPort`
- **Type:** Number
- **Default:** `18789`
- **Description:** Port for the gateway server

**Example:**
```json
{
  "clawdbot.gatewayPort": 19000
}
```

---

## Common Workflows

### Workflow 1: Start Gateway and Monitor

1. **Start the gateway:**
   - Click Clawdbot icon in sidebar
   - Click "Start Gateway" under Operate section
   - Terminal opens running `clawdbot gateway --port 18789`

2. **Open the dashboard:**
   - Click "Open Dashboard" in sidebar
   - Browser opens to http://127.0.0.1:18789/

3. **Check status periodically:**
   - Click status bar item
   - Or click "Run Status" in sidebar

### Workflow 2: Configure Channels

1. **Open Model Setup Wizard:**
   - Command Palette → `Clawdbot: Model Setup Wizard`
   - Or sidebar → "Model Setup Wizard"

2. **Choose "Configure credentials":**
   - Runs `clawdbot configure` in terminal
   - Follow prompts to set up API keys

3. **Login to a channel:**
   - Update status bar command: `clawdbot.command` = `"clawdbot channels login"`
   - Click status bar
   - Terminal shows QR code for WhatsApp or prompts for other channels

4. **Verify channel is connected:**
   - Run `clawdbot status`
   - Should show channel as active

### Workflow 3: Send Test Messages

1. **Ensure gateway is running:**
   - Sidebar → "Start Gateway"

2. **Send a test message:**
   - In VS Code terminal:
   ```bash
   clawdbot message send --target +15555550123 --message "Hello from Clawdbot!"
   ```

3. **Check delivery:**
   - Sidebar → "Run Status"
   - Or open dashboard to view message log

### Workflow 4: Development with Local Clawdbot

If you're developing Clawdbot itself:

1. **Build your local Clawdbot:**
   ```bash
   cd /Users/ghu/aiworker/clawdbot
   pnpm install
   pnpm build
   ```

2. **Link it globally:**
   ```bash
   pnpm link --global
   ```

3. **Verify the link:**
   ```bash
   which clawdbot
   # Should show: /Users/ghu/Library/pnpm/clawdbot

   clawdbot --version
   # Should show your local version
   ```

4. **Use the extension normally:**
   - All commands now use your local build
   - Rebuild with `pnpm build` when you make changes

### Workflow 5: Troubleshooting Issues

1. **Run diagnostics:**
   - Terminal: `clawdbot doctor`
   - Checks configuration, channels, and connectivity

2. **Check logs:**
   - Terminal: `clawdbot logs`
   - View gateway logs and errors

3. **View detailed status:**
   - Terminal: `clawdbot status --all`
   - Shows comprehensive system state

4. **Restart gateway:**
   - Kill existing gateway process
   - Sidebar → "Start Gateway"

---

## Troubleshooting

### Extension Not Showing

**Problem:** Clawdbot icon missing from Activity Bar

**Solution:**
1. Verify extension is installed:
   - Extensions view (`Cmd+Shift+X`)
   - Search for "Clawdbot"
   - Should show as installed

2. Reload VS Code:
   - Command Palette → "Developer: Reload Window"

3. Check for errors:
   - View → Output → Select "Clawdbot Extension" from dropdown

### Command Not Found

**Problem:** "Command not found: clawdbot"

**Solutions:**

1. **Install Clawdbot globally:**
   ```bash
   npm install -g clawdbot@latest
   ```

2. **Or link local installation:**
   ```bash
   cd /Users/ghu/aiworker/clawdbot
   pnpm link --global
   ```

3. **Verify installation:**
   ```bash
   which clawdbot
   clawdbot --version
   ```

4. **Restart VS Code** after installing

### Gateway Won't Start

**Problem:** Gateway fails to start or port is in use

**Solutions:**

1. **Check if port is occupied:**
   ```bash
   lsof -i :18789
   ```

2. **Kill existing process:**
   ```bash
   kill -9 <PID>
   ```

3. **Use different port:**
   - Settings → `clawdbot.gatewayPort` = `19000`
   - Or run manually: `clawdbot gateway --port 19000`

4. **Check logs:**
   ```bash
   clawdbot logs
   ```

### Configuration Not Loading

**Problem:** Config changes not taking effect

**Solutions:**

1. **Verify config file exists:**
   ```bash
   ls -la ~/.clawdbot/clawdbot.json
   ```

2. **Check syntax:**
   ```bash
   cat ~/.clawdbot/clawdbot.json | json_pp
   ```

3. **Recreate config:**
   ```bash
   clawdbot setup
   ```

4. **Edit in VS Code:**
   - Sidebar → "Model Setup Wizard" → "Open config file"

### Status Bar Not Updating

**Problem:** Status stays in one state

**Solutions:**

1. **Click to force update:**
   - Click the status bar item

2. **Reload window:**
   - Command Palette → "Developer: Reload Window"

3. **Check terminal:**
   - Previous command might still be running
   - Close terminal and try again

### Can't Access Dashboard

**Problem:** http://127.0.0.1:18789/ not loading

**Solutions:**

1. **Ensure gateway is running:**
   ```bash
   clawdbot status
   # Should show gateway as active
   ```

2. **Start gateway if not running:**
   - Sidebar → "Start Gateway"

3. **Check correct port:**
   - Settings → `clawdbot.gatewayPort`
   - URL should match: `http://127.0.0.1:<port>/`

4. **Try opening manually:**
   ```bash
   clawdbot dashboard
   ```

### Terminal Commands Fail

**Problem:** Commands show errors in terminal

**Solutions:**

1. **Run doctor:**
   ```bash
   clawdbot doctor
   ```

2. **Check Node.js version:**
   ```bash
   node -v
   # Must be v22.12.0 or newer
   ```

3. **Reinstall dependencies:**
   ```bash
   cd /Users/ghu/aiworker/clawdbot
   rm -rf node_modules
   pnpm install
   pnpm build
   ```

4. **View detailed errors:**
   ```bash
   clawdbot --help
   DEBUG=* clawdbot status
   ```

---

## Additional Resources

### Clawdbot CLI Documentation

- **Official Docs:** https://docs.clawd.bot/
- **CLI Help:** `clawdbot --help`
- **Command Help:** `clawdbot <command> --help`

### File Locations

- **Extension Config:** VS Code Settings → "Clawdbot"
- **Clawdbot Config:** `~/.clawdbot/clawdbot.json`
- **Agent Profiles:** `~/.clawdbot/agents/main/agent/auth-profiles.json`
- **Channel Sessions:** `~/.clawdbot/channels/`
- **Logs:** `~/.clawdbot/logs/`
- **Clawdbot Source:** `/Users/ghu/aiworker/clawdbot/`

### Useful Commands

```bash
# Setup
clawdbot setup
clawdbot onboard
clawdbot configure

# Status & Health
clawdbot status
clawdbot status --all
clawdbot health
clawdbot doctor

# Gateway
clawdbot gateway --port 18789
clawdbot dashboard

# Channels
clawdbot channels login
clawdbot channels list
clawdbot message send

# Configuration
clawdbot config get
clawdbot config set <key> <value>
clawdbot config unset <key>

# Debugging
clawdbot logs
DEBUG=* clawdbot <command>

# Version & Updates
clawdbot --version
npm update -g clawdbot
```

---

## Need Help?

If you encounter issues not covered in this guide:

1. **Check Clawdbot logs:** `clawdbot logs`
2. **Run diagnostics:** `clawdbot doctor`
3. **View extension logs:** VS Code → View → Output → "Clawdbot Extension"
4. **Check Clawdbot docs:** https://docs.clawd.bot/
5. **Report bugs:** Open an issue in the extension repository

---

**Last Updated:** 2026-02-12
**Extension Version:** 1.0.0
**Clawdbot Version:** 2026.1.25
