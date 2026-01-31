# OpenClaw VS Code Extension

VS Code status bar shortcut for connecting to OpenClaw. It shows connection state and runs your configured OpenClaw CLI command in a terminal.

## Features

- Status bar indicator with idle, connecting, connected, and error states
- One-click connection command in a dedicated terminal
- Auto-connect on startup (optional)
- Customizable command per user environment

## Quick Start (macOS + Windows)

### 1. Install Node.js (required)

- Download the latest LTS from https://nodejs.org/
- Verify: `node -v` shows `v22.x` or newer

### 2. Install OpenClaw

```
npm install -g openclaw@latest
```

Verify: `openclaw --help`

### 3. Onboard and start the Gateway

```
openclaw onboard --install-daemon
openclaw gateway --port 18789
```

Open the dashboard: `http://127.0.0.1:18789/`

### 4. Log in to a channel (optional)

```
openclaw channels login
```

Scan the QR (WhatsApp) or follow the prompt for your channel.

### 5. Connect from VS Code

Click the `OpenClaw` status bar item. The extension sends your configured command in the terminal.

## Configuration

- `openclaw.autoConnect`: Automatically connect on startup (default: false)
- `openclaw.command`: Command to run when connecting (default: `openclaw status`)

For Windows with WSL, set: `openclaw.command` = `wsl openclaw status`

## Model Setup (Beginner-Friendly)

By default, OpenClaw uses its bundled Pi binary in RPC mode. If you want a different provider or custom settings, update your config:

`~/.openclaw/openclaw.json`

See the OpenClaw docs for configuration examples and provider setup:
https://docs.openclaw.ai/

## Troubleshooting

### "command not found: openclaw"

- Reinstall CLI: `npm install -g openclaw@latest`
- Restart your terminal or VS Code

### "node: command not found" or Node too old

- Install the latest LTS from https://nodejs.org/
- Verify with `node -v` (needs v22+)

### Gateway not running

- Run: `openclaw gateway --port 18789`
- Open: `http://127.0.0.1:18789/`

### No status bar item

- Ensure you are in the Extension Development Host when testing
- Check Output panel for extension logs

### Windows + WSL

- Set `openclaw.command` to `wsl openclaw status`

## Development

1. Install dependencies: `bun install`
2. Compile: `bun run compile`
3. Press F5 to launch the Extension Development Host

## Publishing

1. Create or verify your Marketplace publisher matches `package.json` (`openknot`):
   https://marketplace.visualstudio.com/
2. Create a Personal Access Token (Azure DevOps) with Marketplace scopes:
   https://dev.azure.com/
   - Scopes: Marketplace → Acquire, Publish
3. Install vsce:
   ```
   npm install -g @vscode/vsce
   ```
4. Sign in:
   ```
   vsce login openknot
   ```
5. Publish:
   ```
   vsce publish
   ```

## License

[MIT](./LICENSE)
