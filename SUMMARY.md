# OpenClaw Extension Summary (Super Simple)

This extension adds a single "OpenClaw" status bar button in VS Code.
Click it to run your OpenClaw CLI command in a terminal.

## What It Does

- Shows connection state in the status bar (idle, connecting, connected, error)
- Runs your configured OpenClaw CLI command in a dedicated terminal
- Can auto-connect on startup
- Helps install Node.js / OpenClaw if missing
- Guides migration from legacy CLI names

## How To Use (The Simplest Path)

1. Install OpenClaw CLI:
   - `npm install -g openclaw@latest`
2. Start the gateway:
   - `openclaw gateway --port 18789`
3. Click the `OpenClaw` status bar item in VS Code.
4. The extension sends your command (default: `openclaw status`).

That's it. If the command is missing, the extension offers install actions.

## Commands You Use in VS Code

- `OpenClaw: Connect` (runs your command)
- `OpenClaw: Setup` (guided install for Node.js and OpenClaw)

## Settings (Optional)

- `openclaw.command`
  - Default: `openclaw status`
  - Example for WSL on Windows: `wsl openclaw status`
- `openclaw.autoConnect`
  - `true` to auto-run on startup

## Status Bar States

- `$(plug) OpenClaw` = idle (click to connect)
- `$(sync~spin) OpenClaw` = connecting
- `$(check) OpenClaw` = connected (command sent)
- `$(alert) OpenClaw` = error (click to retry)

## Simple Flow Diagram

```mermaid
flowchart TD
    A[VS Code starts] --> B{autoConnect?}
    B -->|yes| C[Run OpenClaw command]
    B -->|no| D[Show status bar button]
    D --> E[User clicks OpenClaw]
    E --> C
    C --> F{Command exists?}
    F -->|yes| G[Send command to terminal]
    F -->|no| H[Offer install / docs / settings]
```

## Setup Helper Flow (Missing CLI / Node)

```mermaid
flowchart TD
    A[User clicks OpenClaw] --> B{openclaw found?}
    B -->|no| C{legacy CLI found?}
    C -->|yes| D[Show migration actions]
    C -->|no| E[Offer install actions]
    E --> F{Node.js needed?}
    F -->|yes| G[Offer Node.js install options]
    F -->|no| H[Run install command in terminal]
```

## What You See When It Works

```mermaid
sequenceDiagram
    participant U as You
    participant VS as VS Code
    participant T as Terminal

    U->>VS: Click "OpenClaw" status bar
    VS->>VS: Set status = connecting
    VS->>T: Send CLI command
    VS->>VS: Set status = connected
```

## Troubleshooting (Short Version)

- "command not found: openclaw"
  - Run `OpenClaw: Setup` or reinstall:
  - `npm install -g openclaw@latest`
- "node: command not found"
  - Install latest Node.js LTS from https://nodejs.org/
- Want different CLI command?
  - Update `openclaw.command` in Settings

## ELI5

Click the status bar button and the extension runs your OpenClaw CLI command for you.
