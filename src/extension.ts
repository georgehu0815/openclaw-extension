import * as vscode from 'vscode';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

let statusBarItem: vscode.StatusBarItem;
let terminal: vscode.Terminal | undefined;
let isConnecting = false;

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('OpenClaw extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'openclaw.connect';
    setStatus('idle');
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register connect command
    let connectCommand = vscode.commands.registerCommand('openclaw.connect', async () => {
        await connect();
    });
    context.subscriptions.push(connectCommand);

    // Check auto-connect setting
    const config = vscode.workspace.getConfiguration('openclaw');
    const autoConnect = config.get<boolean>('autoConnect', false);

    if (autoConnect) {
        // Auto-connect on startup
        setTimeout(() => {
            connect();
        }, 1000); // Small delay to ensure everything is initialized
    }

    // Listen for terminal close events
    const terminalClosedDisposable = vscode.window.onDidCloseTerminal((closedTerminal) => {
        if (terminal && closedTerminal === terminal) {
            terminal = undefined;
            setStatus('idle');
        }
    });
    context.subscriptions.push(terminalClosedDisposable);
}

async function connect() {
    if (isConnecting) {
        vscode.window.showInformationMessage('OpenClaw connection is already in progress.');
        return;
    }

    isConnecting = true;
    try {
        // Update status to connecting
        setStatus('connecting');

        // Detect OS and read configuration
        const platform = os.platform();
        const isWindows = platform === 'win32';

        const config = vscode.workspace.getConfiguration('openclaw');
        const configuredCommand = (config.get<string>('command') ?? '').trim();
        const defaultCommand = isWindows ? 'openclaw status' : 'openclaw status';
        const command = configuredCommand.length > 0 ? configuredCommand : defaultCommand;

        if (!command) {
            setStatus('idle');
            vscode.window.showErrorMessage('OpenClaw command is empty. Update OpenClaw: Command in settings.');
            return;
        }

        const executable = command.split(/\s+/)[0];
        const available = await isCommandAvailable(executable);
        if (!available) {
            setStatus('idle');
            vscode.window.showErrorMessage(
                `Command not found: ${executable}. Install OpenClaw or update OpenClaw: Command in settings.`
            );
            return;
        }

        // Create or reuse terminal
        if (!terminal) {
            terminal = vscode.window.createTerminal('OpenClaw');
        }

        // Show terminal and send command
        terminal.show(true); // true = preserve focus
        terminal.sendText(command);

        // Update status to connected
        setStatus('connected');

        vscode.window.showInformationMessage('OpenClaw command sent.');
    } catch (error) {
        setStatus('error');
        vscode.window.showErrorMessage(`Failed to connect: ${error}`);
    } finally {
        isConnecting = false;
    }
}

export function deactivate() {
    if (terminal) {
        terminal.dispose();
    }
}

function setStatus(state: 'idle' | 'connecting' | 'connected' | 'error') {
    switch (state) {
        case 'connecting':
            statusBarItem.text = '$(sync~spin) OpenClaw';
            statusBarItem.tooltip = 'Connection in progress';
            break;
        case 'connected':
            statusBarItem.text = '$(check) OpenClaw';
            statusBarItem.tooltip = 'OpenClaw command sent';
            break;
        case 'error':
            statusBarItem.text = '$(alert) OpenClaw';
            statusBarItem.tooltip = 'Connection failed. Click to retry.';
            break;
        case 'idle':
        default:
            statusBarItem.text = '$(plug) OpenClaw';
            statusBarItem.tooltip = 'Click to connect to OpenClaw';
            break;
    }
}

async function isCommandAvailable(command: string) {
    const probe = process.platform === 'win32' ? `where ${command}` : `command -v ${command}`;
    try {
        await execAsync(probe);
        return true;
    } catch {
        return false;
    }
}
