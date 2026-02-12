import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

let statusBarItem: vscode.StatusBarItem;
let terminal: vscode.Terminal | undefined;
let setupTerminal: vscode.Terminal | undefined;
let isConnecting = false;
let overviewProvider: OverviewTreeProvider | undefined;

const execAsync = promisify(exec);
const CLAWDBOT_DOCS_URL = 'https://docs.clawd.bot/';
const CLAWDBOT_DASHBOARD_URL = 'http://127.0.0.1:18789/';
const CLAWDBOT_DEFAULT_PATH = '/Users/ghu/aiworker/clawdbot';
const CLAWDBOT_NPM_INSTALL = 'npm install -g clawdbot@latest';
const LEGACY_CLI_ALIASES = new Set(['molt', 'molt.exe', 'openclaw', 'openclaw.exe']);
const STATUS_LABEL = 'Clawdbot';

export function activate(context: vscode.ExtensionContext) {
    console.log('Clawdbot extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'clawdbot.connect';
    statusBarItem.name = STATUS_LABEL;
    statusBarItem.accessibilityInformation = {
        label: STATUS_LABEL,
        role: 'button'
    };
    setStatus('idle');
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.connect', async () => await connect())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.setup', async () => await runSetupFlow())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.modelSetup', async () => await runModelSetupWizard())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.gateway', async () => await runGateway())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.status', async () => await runStatus())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.tui', async () => await runTui())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('clawdbot.openDocs', async () => await openDocs())
    );

    // Create overview tree provider
    overviewProvider = new OverviewTreeProvider();
    const overviewView = vscode.window.createTreeView('clawdbot.overview', {
        treeDataProvider: overviewProvider
    });
    context.subscriptions.push(overviewView);

    // Check auto-connect setting
    const config = vscode.workspace.getConfiguration('clawdbot');
    const autoConnect = config.get<boolean>('autoConnect', false);

    if (autoConnect) {
        setTimeout(() => connect(), 1000);
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
        vscode.window.showInformationMessage('Clawdbot connection is already in progress.');
        return;
    }

    isConnecting = true;
    try {
        setStatus('connecting');

        const config = vscode.workspace.getConfiguration('clawdbot');
        const configuredCommand = (config.get<string>('command') ?? '').trim();
        const defaultCommand = 'clawdbot status';
        let command = configuredCommand.length > 0 ? configuredCommand : defaultCommand;

        if (!command) {
            setStatus('idle');
            vscode.window.showErrorMessage('Clawdbot command is empty. Update settings.');
            return;
        }

        const executable = command.split(/\s+/)[0];
        const available = await isCommandAvailable(executable);
        if (!available) {
            setStatus('idle');
            const action = await vscode.window.showErrorMessage(
                `Command not found: ${executable}. Install Clawdbot or update settings.`,
                'Install CLI',
                'Open Settings'
            );

            if (action === 'Install CLI') {
                await runSetupFlow();
            } else if (action === 'Open Settings') {
                await openSettings();
            }
            return;
        }

        // Create or reuse terminal
        if (!terminal) {
            terminal = vscode.window.createTerminal('Clawdbot');
        }

        terminal.show(true);
        terminal.sendText(command);
        setStatus('connected');

        vscode.window.showInformationMessage('Clawdbot command sent.');
    } catch (error) {
        setStatus('error');
        vscode.window.showErrorMessage(`Failed to connect: ${error}`);
    } finally {
        isConnecting = false;
    }
}

async function runGateway() {
    const config = vscode.workspace.getConfiguration('clawdbot');
    const port = config.get<number>('gatewayPort', 18789);
    const command = `clawdbot gateway --port ${port}`;

    if (!terminal) {
        terminal = vscode.window.createTerminal('Clawdbot');
    }

    terminal.show(true);
    terminal.sendText(command);
    vscode.window.showInformationMessage(`Starting Clawdbot gateway on port ${port}`);
}

async function runStatus() {
    const command = 'clawdbot status';

    if (!terminal) {
        terminal = vscode.window.createTerminal('Clawdbot');
    }

    terminal.show(true);
    terminal.sendText(command);
}

async function runTui() {
    const command = 'clawdbot tui';

    if (!terminal) {
        terminal = vscode.window.createTerminal('Clawdbot');
    }

    terminal.show(true);
    terminal.sendText(command);
    vscode.window.showInformationMessage('Starting Clawdbot TUI...');
}

async function runSetupFlow() {
    const hasNode = await isCommandAvailable('node');
    if (!hasNode) {
        const action = await vscode.window.showErrorMessage(
            'Node.js is required to run Clawdbot. Install Node.js v22+ and try again.',
            'Open Node.js Downloads'
        );

        if (action === 'Open Node.js Downloads') {
            await vscode.env.openExternal(vscode.Uri.parse('https://nodejs.org/en/download'));
        }
        return;
    }

    const hasClawdbot = await isCommandAvailable('clawdbot');
    if (!hasClawdbot) {
        const action = await vscode.window.showWarningMessage(
            'Clawdbot CLI not found. Would you like to install it?',
            'Install via npm',
            'Copy command',
            'Cancel'
        );

        if (action === 'Install via npm') {
            await runInstallCommand(CLAWDBOT_NPM_INSTALL);
        } else if (action === 'Copy command') {
            await vscode.env.clipboard.writeText(CLAWDBOT_NPM_INSTALL);
            vscode.window.showInformationMessage('Install command copied to clipboard.');
        }
        return;
    }

    vscode.window.showInformationMessage('Clawdbot CLI is already installed!');
}

async function runModelSetupWizard() {
    const hasClawdbot = await isCommandAvailable('clawdbot');
    if (!hasClawdbot) {
        await runSetupFlow();
        return;
    }

    const action = await vscode.window.showQuickPick([
        { label: 'Run onboarding wizard', description: 'clawdbot onboard', value: 'onboard' },
        { label: 'Configure credentials', description: 'clawdbot configure', value: 'configure' },
        { label: 'Open config file', description: '~/.clawdbot/clawdbot.json', value: 'config' },
        { label: 'Open documentation', value: 'docs' }
    ], { placeHolder: 'Setup Clawdbot configuration' });

    if (!action) {
        return;
    }

    if (action.value === 'onboard') {
        await runSetupCommand('clawdbot onboard');
    } else if (action.value === 'configure') {
        await runSetupCommand('clawdbot configure');
    } else if (action.value === 'config') {
        await openClawdbotConfig();
    } else if (action.value === 'docs') {
        await openDocs();
    }
}

async function openDocs() {
    await vscode.env.openExternal(vscode.Uri.parse(CLAWDBOT_DOCS_URL));
}

async function openSettings() {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'clawdbot.command');
}

async function openClawdbotConfig() {
    const configPath = path.join(os.homedir(), '.clawdbot', 'clawdbot.json');
    const uri = vscode.Uri.file(configPath);

    try {
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, { preview: false });
    } catch (error) {
        const action = await vscode.window.showErrorMessage(
            `Config file not found at ${configPath}. Run 'clawdbot setup' first.`,
            'Run Setup'
        );
        if (action === 'Run Setup') {
            await runSetupCommand('clawdbot setup');
        }
    }
}

async function runInstallCommand(command: string) {
    const decision = await vscode.window.showWarningMessage(
        `Run this command in a terminal?\n${command}`,
        { modal: true },
        'Run install',
        'Cancel'
    );

    if (decision !== 'Run install') {
        return;
    }

    if (!setupTerminal) {
        setupTerminal = vscode.window.createTerminal('Clawdbot Setup');
    }

    setupTerminal.show(true);
    setupTerminal.sendText(command);
}

async function runSetupCommand(command: string) {
    if (!setupTerminal) {
        setupTerminal = vscode.window.createTerminal('Clawdbot Setup');
    }
    setupTerminal.show(true);
    setupTerminal.sendText(command);
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

function setStatus(state: 'idle' | 'connecting' | 'connected' | 'error') {
    switch (state) {
        case 'connecting':
            statusBarItem.text = `$(sync~spin) ${STATUS_LABEL}`;
            statusBarItem.tooltip = 'Connection in progress';
            break;
        case 'connected':
            statusBarItem.text = `$(check) ${STATUS_LABEL}`;
            statusBarItem.tooltip = 'Clawdbot command sent';
            break;
        case 'error':
            statusBarItem.text = `$(alert) ${STATUS_LABEL}`;
            statusBarItem.tooltip = 'Connection failed. Click to retry.';
            break;
        case 'idle':
        default:
            statusBarItem.text = `$(plug) ${STATUS_LABEL}`;
            statusBarItem.tooltip = 'Click to connect to Clawdbot';
            break;
    }
}

class OverviewItem extends vscode.TreeItem {
    readonly children?: OverviewItem[];

    constructor(
        label: string,
        options: {
            description?: string;
            tooltip?: string;
            icon?: vscode.ThemeIcon;
            command?: vscode.Command;
            children?: OverviewItem[];
            collapsibleState?: vscode.TreeItemCollapsibleState;
        } = {}
    ) {
        const collapsibleState =
            options.collapsibleState ??
            (options.children && options.children.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None);
        super(label, collapsibleState);
        this.description = options.description;
        this.tooltip = options.tooltip;
        this.iconPath = options.icon;
        this.command = options.command;
        this.children = options.children;
    }
}

class OverviewTreeProvider implements vscode.TreeDataProvider<OverviewItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<OverviewItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: OverviewItem) {
        return element;
    }

    getChildren(element?: OverviewItem) {
        if (element) {
            return element.children ?? [];
        }
        return [
            this.buildGettingStartedSection(),
            this.buildOperateSection(),
            this.buildHelpSection()
        ];
    }

    private buildGettingStartedSection() {
        return new OverviewItem('Getting Started', {
            icon: new vscode.ThemeIcon('rocket'),
            collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
            children: [
                new OverviewItem('Connect', {
                    description: 'Run your Clawdbot command',
                    icon: new vscode.ThemeIcon('plug'),
                    command: {
                        command: 'clawdbot.connect',
                        title: 'Clawdbot Connect'
                    }
                }),
                new OverviewItem('Setup', {
                    description: 'Install Node + Clawdbot',
                    icon: new vscode.ThemeIcon('tools'),
                    command: {
                        command: 'clawdbot.setup',
                        title: 'Clawdbot Setup'
                    }
                }),
                new OverviewItem('Model Setup Wizard', {
                    description: 'Configure credentials & models',
                    icon: new vscode.ThemeIcon('settings-gear'),
                    command: {
                        command: 'clawdbot.modelSetup',
                        title: 'Clawdbot Model Setup Wizard'
                    }
                })
            ]
        });
    }

    private buildOperateSection() {
        return new OverviewItem('Operate', {
            icon: new vscode.ThemeIcon('dashboard'),
            children: [
                new OverviewItem('Start Gateway', {
                    description: 'Launch Clawdbot gateway server',
                    icon: new vscode.ThemeIcon('server'),
                    command: {
                        command: 'clawdbot.gateway',
                        title: 'Start Clawdbot Gateway'
                    }
                }),
                new OverviewItem('Run Status', {
                    description: 'Check Clawdbot status',
                    icon: new vscode.ThemeIcon('terminal'),
                    command: {
                        command: 'clawdbot.status',
                        title: 'Run Clawdbot Status'
                    }
                }),
                new OverviewItem('Run TUI', {
                    description: 'Launch Clawdbot Terminal UI',
                    icon: new vscode.ThemeIcon('window'),
                    command: {
                        command: 'clawdbot.tui',
                        title: 'Run Clawdbot TUI'
                    }
                }),
                new OverviewItem('Open Dashboard', {
                    description: CLAWDBOT_DASHBOARD_URL,
                    icon: new vscode.ThemeIcon('globe'),
                    command: {
                        command: 'vscode.open',
                        title: 'Open Clawdbot Dashboard',
                        arguments: [vscode.Uri.parse(CLAWDBOT_DASHBOARD_URL)]
                    }
                })
            ]
        });
    }

    private buildHelpSection() {
        return new OverviewItem('Help', {
            icon: new vscode.ThemeIcon('question'),
            children: [
                new OverviewItem('Open Docs', {
                    description: 'docs.clawd.bot',
                    icon: new vscode.ThemeIcon('book'),
                    command: {
                        command: 'clawdbot.openDocs',
                        title: 'Open Clawdbot Docs'
                    }
                })
            ]
        });
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
