# OpenClaw Extension Testing Guide

## Prerequisites

- OpenClaw CLI installed and available in your PATH
- For Windows + WSL, set `openclaw.command` to `wsl openclaw status`

## Run the extension

1. Open this repo in VS Code
2. Press F5 to launch the Extension Development Host
3. A new VS Code window opens with the extension loaded

## Test Cases

### 1. Initial State

- Status bar shows `$(plug) OpenClaw`
- Tooltip indicates the extension is ready to connect

### 2. Manual Connection

1. Click the status bar item
2. Status bar changes to `$(sync~spin) OpenClaw`
3. Terminal named "OpenClaw" opens and runs your configured command
4. Status bar changes to `$(check) OpenClaw`

### 3. Auto-Connect

1. Open Settings and search for "OpenClaw"
2. Enable `OpenClaw: Auto Connect`
3. Reload the window (Command Palette → "Developer: Reload Window")
4. Verify the command runs on startup

### 4. Terminal Reuse

1. Click the status bar item again
2. Confirm the same “OpenClaw” terminal is reused

### 5. Command Missing error

1. Set `openclaw.command` to a nonexistent command
2. Click the status bar item
3. Confirm the error message appears and the status returns to idle

## Troubleshooting

- If the status bar item does not appear, confirm you are in the Extension Development Host
- If you see "command not found", install the CLI or fix `openclaw.command`
