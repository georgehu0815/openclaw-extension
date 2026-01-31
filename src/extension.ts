import * as vscode from 'vscode';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

let statusBarItem: vscode.StatusBarItem;
let terminal: vscode.Terminal | undefined;
let setupTerminal: vscode.Terminal | undefined;
let isConnecting = false;

const execAsync = promisify(exec);
const OPENCLAW_DOCS_URL = 'https://docs.openclaw.ai/';
const OPENCLAW_UPDATE_DOCS_URL = 'https://docs.openclaw.ai/install/updating';
const OPENCLAW_INSTALL_SCRIPT = 'curl -fsSL https://openclaw.bot/install.sh | bash';
const OPENCLAW_NPM_INSTALL = 'npm install -g openclaw@latest';
const LEGACY_CLI_ALIASES = new Set(['molt', 'molt.exe', 'clawdbot', 'clawdbot.exe']);

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

    // Register setup command
    let setupCommand = vscode.commands.registerCommand('openclaw.setup', async () => {
        await runSetupFlow();
    });
    context.subscriptions.push(setupCommand);

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
        if (setupTerminal && closedTerminal === setupTerminal) {
            setupTerminal = undefined;
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
        let command = configuredCommand.length > 0 ? configuredCommand : defaultCommand;

        if (!command) {
            setStatus('idle');
            vscode.window.showErrorMessage('OpenClaw command is empty. Update OpenClaw: Command in settings.');
            return;
        }

        let executable = command.split(/\s+/)[0];
        const legacyExecutable = getLegacyExecutable(executable);
        if (legacyExecutable) {
            const updatedCommand = await handleLegacyMigration(command, legacyExecutable);
            if (!updatedCommand) {
                setStatus('idle');
                return;
            }
            command = updatedCommand;
            executable = command.split(/\s+/)[0];
        }
        const needsNode = executable === 'openclaw' || executable === 'openclaw.exe';
        if (needsNode) {
            const hasNode = await isCommandAvailable('node');
            if (!hasNode) {
                setStatus('idle');
                await showMissingNodeMessage();
                return;
            }
        }

        const available = await isCommandAvailable(executable);
        if (!available) {
            setStatus('idle');
            const legacyAvailable = await findAvailableLegacyCli();
            if (legacyAvailable) {
                await showLegacyMissingOpenClawMessage(legacyAvailable);
                return;
            }
            const action = await vscode.window.showErrorMessage(
                `Command not found: ${executable}. Install OpenClaw or update OpenClaw: Command in settings.`,
                'Install CLI',
                'Copy install command',
                'Open docs',
                'Open settings'
            );

            if (action === 'Install CLI') {
                await runSetupFlow();
            } else if (action === 'Copy install command') {
                await copyInstallCommand();
            } else if (action === 'Open docs') {
                await openDocs();
            } else if (action === 'Open settings') {
                await openSettings();
            }
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
    if (setupTerminal) {
        setupTerminal.dispose();
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

async function runSetupFlow() {
    const options = getInstallOptions();
    const pick = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select an install method for the OpenClaw CLI'
    });

    if (!pick) {
        return;
    }

    if (pick.action === 'docs') {
        await openDocs();
        return;
    }

    if (pick.action === 'node') {
        await runNodeSetupFlow();
        return;
    }

    if (!pick.command) {
        return;
    }

    if (pick.command.includes('npm') && !(await isCommandAvailable('node'))) {
        await showMissingNodeMessage();
        return;
    }

    await runInstallCommand(pick.command);
}

function getInstallOptions(): Array<{
    label: string;
    description?: string;
    detail?: string;
    command?: string;
    action?: 'docs' | 'node' | 'nodeDocs';
}> {
    const platform = os.platform();
    const isWindows = platform === 'win32';
    const npmCommand = OPENCLAW_NPM_INSTALL;

    return [
        {
            label: 'Install Node.js (required for npm install)',
            description: isWindows ? 'Windows: recommended via winget' : 'macOS/Linux: install Node.js first',
            action: 'node'
        },
        {
            label: 'Install via npm (recommended)',
            description: isWindows ? 'Works on Windows with Node.js' : 'Works on macOS and Linux with Node.js',
            detail: npmCommand,
            command: npmCommand
        },
        {
            label: 'Open installation docs',
            description: 'View all install options',
            action: 'docs'
        }
    ];
}

async function runNodeSetupFlow() {
    const options = getNodeInstallOptions();
    const pick = await vscode.window.showQuickPick(options, {
        placeHolder: 'Install the latest stable Node.js (LTS)'
    });

    if (!pick) {
        return;
    }

    if (pick.action === 'nodeDocs') {
        await openNodeDocs();
        return;
    }

    if (!pick.command) {
        return;
    }

    await runInstallCommand(pick.command);
}

function getNodeInstallOptions(): Array<{
    label: string;
    description?: string;
    detail?: string;
    command?: string;
    action?: 'nodeDocs';
}> {
    const platform = os.platform();
    const isWindows = platform === 'win32';
    const isMac = platform === 'darwin';

    if (isWindows) {
        const command = 'winget install OpenJS.NodeJS.LTS';
        return [
            {
                label: 'Install Node.js (LTS) via winget',
                description: 'Windows',
                detail: command,
                command
            },
            {
                label: 'Open Node.js download page',
                description: 'Manual installer for Windows/macOS/Linux',
                action: 'nodeDocs'
            }
        ];
    }

    if (isMac) {
        const command = 'brew install node';
        return [
            {
                label: 'Install Node.js (LTS) via Homebrew',
                description: 'macOS (requires Homebrew)',
                detail: command,
                command
            },
            {
                label: 'Open Node.js download page',
                description: 'Manual installer for macOS/Linux',
                action: 'nodeDocs'
            }
        ];
    }

    const command = 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs';
    return [
        {
            label: 'Install Node.js (LTS) via apt',
            description: 'Ubuntu/Debian',
            detail: command,
            command
        },
        {
            label: 'Open Node.js download page',
            description: 'Manual installer for Linux',
            action: 'nodeDocs'
        }
    ];
}

async function runInstallCommand(command: string) {
    const decision = await vscode.window.showWarningMessage(
        `Run this command in a terminal?\n${command}`,
        { modal: true },
        'Run install',
        'Copy command',
        'Cancel'
    );

    if (decision === 'Copy command') {
        await vscode.env.clipboard.writeText(command);
        vscode.window.showInformationMessage('Install command copied to clipboard.');
        return;
    }

    if (decision !== 'Run install') {
        return;
    }

    if (!setupTerminal) {
        setupTerminal = vscode.window.createTerminal('OpenClaw Setup');
    }

    setupTerminal.show(true);
    setupTerminal.sendText(command);
}

async function copyInstallCommand() {
    await vscode.env.clipboard.writeText(OPENCLAW_NPM_INSTALL);
    vscode.window.showInformationMessage('Install command copied to clipboard.');
}

async function openDocs() {
    await vscode.env.openExternal(vscode.Uri.parse(OPENCLAW_DOCS_URL));
}

async function openUpdateDocs() {
    await vscode.env.openExternal(vscode.Uri.parse(OPENCLAW_UPDATE_DOCS_URL));
}

async function openNodeDocs() {
    await vscode.env.openExternal(vscode.Uri.parse('https://nodejs.org/en/download'));
}

async function openSettings() {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'openclaw.command');
}

async function showMissingNodeMessage() {
    const installCommand = getNodeInstallCommandForPlatform();
    const actions: string[] = ['Install Node.js'];

    if (installCommand) {
        actions.push('Copy Node install command');
    }

    actions.push('Open Node.js download page');

    const action = await vscode.window.showErrorMessage(
        'Node.js is required to run the OpenClaw CLI. Install the latest stable Node.js (LTS) and try again.',
        ...actions
    );

    if (action === 'Install Node.js') {
        await runNodeSetupFlow();
        return;
    }

    if (action === 'Copy Node install command' && installCommand) {
        await vscode.env.clipboard.writeText(installCommand);
        vscode.window.showInformationMessage('Node.js install command copied to clipboard.');
        return;
    }

    if (action === 'Open Node.js download page') {
        await openNodeDocs();
    }
}

function getNodeInstallCommandForPlatform(): string | undefined {
    const platform = os.platform();
    if (platform === 'win32') {
        return 'winget install OpenJS.NodeJS.LTS';
    }
    if (platform === 'darwin') {
        return 'brew install node';
    }
    return 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs';
}

function getLegacyExecutable(executable: string): string | undefined {
    const normalized = executable.toLowerCase();
    return LEGACY_CLI_ALIASES.has(normalized) ? executable : undefined;
}

function replaceExecutable(command: string, newExecutable: string): string {
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) {
        return command;
    }
    parts[0] = newExecutable;
    return parts.join(' ');
}

async function updateOpenClawCommandSetting(command: string) {
    const config = vscode.workspace.getConfiguration('openclaw');
    await config.update('command', command, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('Updated OpenClaw: Command setting.');
}

async function handleLegacyMigration(command: string, legacyExecutable: string): Promise<string | null> {
    const hasOpenClaw = await isCommandAvailable('openclaw');
    const newCommand = replaceExecutable(command, 'openclaw');
    const actions: string[] = [];

    if (hasOpenClaw) {
        actions.push('Use openclaw');
    }
    actions.push('Open update docs', 'Copy installer command', 'Copy npm update command', 'Open settings');

    const action = await vscode.window.showWarningMessage(
        `This command uses legacy "${legacyExecutable}". OpenClaw is the new name. Update to OpenClaw for safe migrations.`,
        ...actions
    );

    if (action === 'Use openclaw') {
        await updateOpenClawCommandSetting(newCommand);
        return newCommand;
    }

    if (action === 'Copy installer command') {
        await vscode.env.clipboard.writeText(OPENCLAW_INSTALL_SCRIPT);
        vscode.window.showInformationMessage('Installer command copied to clipboard.');
        return null;
    }

    if (action === 'Copy npm update command') {
        await vscode.env.clipboard.writeText(OPENCLAW_NPM_INSTALL);
        vscode.window.showInformationMessage('npm update command copied to clipboard.');
        return null;
    }

    if (action === 'Open update docs') {
        await openUpdateDocs();
        return null;
    }

    if (action === 'Open settings') {
        await openSettings();
        return null;
    }

    return null;
}

async function findAvailableLegacyCli(): Promise<string | undefined> {
    for (const legacy of LEGACY_CLI_ALIASES) {
        if (await isCommandAvailable(legacy)) {
            return legacy;
        }
    }
    return undefined;
}

async function showLegacyMissingOpenClawMessage(legacyExecutable: string) {
    const action = await vscode.window.showErrorMessage(
        `Found legacy CLI "${legacyExecutable}". OpenClaw is the new name. Update to OpenClaw to continue.`,
        'Open update docs',
        'Copy installer command',
        'Copy npm update command',
        'Open settings'
    );

    if (action === 'Open update docs') {
        await openUpdateDocs();
        return;
    }

    if (action === 'Copy installer command') {
        await vscode.env.clipboard.writeText(OPENCLAW_INSTALL_SCRIPT);
        vscode.window.showInformationMessage('Installer command copied to clipboard.');
        return;
    }

    if (action === 'Copy npm update command') {
        await vscode.env.clipboard.writeText(OPENCLAW_NPM_INSTALL);
        vscode.window.showInformationMessage('npm update command copied to clipboard.');
        return;
    }

    if (action === 'Open settings') {
        await openSettings();
    }
}
