import * as vscode from 'vscode';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export class ChatPanelProvider {
    public static currentPanel: ChatPanelProvider | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (ChatPanelProvider.currentPanel) {
            ChatPanelProvider.currentPanel._panel.reveal(vscode.ViewColumn.Two);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'clawdbotChat',
            'Agentflow Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        ChatPanelProvider.currentPanel = new ChatPanelProvider(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'sendMessage':
                        this._handleUserMessage(message.content);
                        break;
                    case 'clearMessages':
                        this._messages = [];
                        this._update();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleUserMessage(content: string) {
        // Add user message to the list
        this._messages.push({ role: 'user', content });
        this._update();

        // Simulate bot response (you can replace this with actual API call)
        try {
            // Here you can integrate with Clawdbot CLI or any other service
            const response = await this._getBotResponse(content);
            this._messages.push({ role: 'assistant', content: response });
            this._update();
        } catch (error) {
            this._messages.push({
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            this._update();
        }
    }

    private async _getBotResponse(userMessage: string): Promise<string> {
        try {
            // Escape the user message for shell execution
            const escapedMessage = userMessage.replace(/"/g, '\\"');

            // Execute clawdbot command
            const command = `clawdbot agent --agent main --message "${escapedMessage}" --json`;

            const { stdout, stderr } = await execAsync(command, {
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large responses
                timeout: 60000 // 60 second timeout
            });

            if (stderr) {
                console.error('Clawdbot stderr: - chatPanel.ts:103', stderr);
            }

            // Parse JSON response
            const response = JSON.parse(stdout.trim());

            // Extract the text from result.payloads[0].text
            if (response.result?.payloads?.[0]?.text) {
                return response.result.payloads[0].text;
            } else if (response.content) {
                return response.content;
            } else if (response.message) {
                return response.message;
            } else if (response.response) {
                return response.response;
            } else {
                // If the structure is different, return the whole JSON as formatted string
                return JSON.stringify(response, null, 2);
            }
        } catch (error) {
            console.error('Error calling clawdbot: - chatPanel.ts:123', error);

            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('command not found') || error.message.includes('ENOENT')) {
                    throw new Error('Clawdbot CLI not found. Please ensure clawdbot is installed and in your PATH.');
                } else if (error.message.includes('timeout')) {
                    throw new Error('Clawdbot request timed out. Please try again.');
                } else if (error.message.includes('JSON')) {
                    throw new Error('Failed to parse clawdbot response. The response may not be valid JSON.');
                } else {
                    throw new Error(`Clawdbot error: ${error.message}`);
                }
            }

            throw error;
        }
    }

    public dispose() {
        ChatPanelProvider.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const messagesHtml = this._messages
            .map(msg => {
                const escapedContent = this._escapeHtml(msg.content);
                return `
                    <div class="message ${msg.role}" data-role="${msg.role}">
                        <div class="message-role">${msg.role === 'user' ? 'You' : 'Clawdbot'}</div>
                        <div class="message-content ${msg.role === 'assistant' ? 'markdown-content' : ''}" data-content="${this._escapeHtml(msg.content).replace(/"/g, '&quot;')}">${escapedContent}</div>
                    </div>
                `;
            })
            .join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentflow Chat</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        #header {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-sideBar-background);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #header h2 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
        }

        #clearButton {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 12px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 12px;
        }

        #clearButton:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        #messagesContainer {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .message {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 8px;
        }

        .message.user {
            background-color: var(--vscode-inputOption-activeBackground);
            align-self: flex-end;
            max-width: 80%;
        }

        .message.assistant {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            align-self: flex-start;
            max-width: 80%;
        }

        .message-role {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 4px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .message.user .message-role {
            color: var(--vscode-inputOption-activeForeground);
        }

        .message-content {
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        /* Markdown content styling */
        .markdown-content {
            white-space: normal;
        }

        .markdown-content p {
            margin: 0 0 8px 0;
        }

        .markdown-content p:last-child {
            margin-bottom: 0;
        }

        .markdown-content a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
        }

        .markdown-content a:hover {
            color: var(--vscode-textLink-activeForeground);
            text-decoration: underline;
        }

        .markdown-content code {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }

        .markdown-content pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 8px 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
        }

        .markdown-content pre code {
            background-color: transparent;
            padding: 0;
        }

        .markdown-content ul,
        .markdown-content ol {
            margin: 8px 0;
            padding-left: 24px;
        }

        .markdown-content li {
            margin: 4px 0;
        }

        .markdown-content blockquote {
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            background-color: var(--vscode-textBlockQuote-background);
            padding: 8px 12px;
            margin: 8px 0;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
            margin: 12px 0 8px 0;
            font-weight: 600;
        }

        .markdown-content h1 { font-size: 18px; }
        .markdown-content h2 { font-size: 16px; }
        .markdown-content h3 { font-size: 14px; }
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 { font-size: 13px; }

        .markdown-content table {
            border-collapse: collapse;
            margin: 8px 0;
            width: 100%;
        }

        .markdown-content table th,
        .markdown-content table td {
            border: 1px solid var(--vscode-panel-border);
            padding: 6px 12px;
            text-align: left;
        }

        .markdown-content table th {
            background-color: var(--vscode-input-background);
            font-weight: 600;
        }

        .markdown-content hr {
            border: none;
            border-top: 1px solid var(--vscode-panel-border);
            margin: 12px 0;
        }

        .markdown-content img {
            max-width: 100%;
            height: auto;
        }

        #inputContainer {
            border-top: 1px solid var(--vscode-panel-border);
            padding: 16px;
            background-color: var(--vscode-sideBar-background);
            display: flex;
            gap: 8px;
        }

        #messageInput {
            flex: 1;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 8px 12px;
            font-size: 13px;
            font-family: var(--vscode-font-family);
            border-radius: 2px;
            resize: none;
            min-height: 36px;
            max-height: 120px;
        }

        #messageInput:focus {
            outline: 1px solid var(--vscode-focusBorder);
            border-color: var(--vscode-focusBorder);
        }

        #sendButton {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 20px;
            cursor: pointer;
            border-radius: 2px;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
        }

        #sendButton:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        #sendButton:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .empty-state {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 8px;
            opacity: 0.6;
            text-align: center;
            padding: 32px;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 8px;
        }

        .empty-state-text {
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="header">
        <h2>Agentflow Chat</h2>
        <button id="clearButton">Clear</button>
    </div>

    <div id="messagesContainer">
        ${messagesHtml || `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">Start a conversation with Agentflow</div>
            </div>
        `}
    </div>

    <div id="inputContainer">
        <textarea
            id="messageInput"
            placeholder="Type your message..."
            rows="1"
        ></textarea>
        <button id="sendButton">Send</button>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const clearButton = document.getElementById('clearButton');
        const messagesContainer = document.getElementById('messagesContainer');

        // Configure marked
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true
            });
        }

        // Render markdown for assistant messages
        function renderMarkdown() {
            const markdownElements = document.querySelectorAll('.markdown-content');
            markdownElements.forEach(element => {
                const content = element.getAttribute('data-content');
                if (content && typeof marked !== 'undefined') {
                    try {
                        // Decode HTML entities first
                        const textarea = document.createElement('textarea');
                        textarea.innerHTML = content;
                        const decodedContent = textarea.value;

                        // Parse markdown and set innerHTML
                        element.innerHTML = marked.parse(decodedContent);
                    } catch (error) {
                        console.error('Error rendering markdown:', error);
                    }
                }
            });
        }

        // Render markdown after page loads
        renderMarkdown();

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send message on button click
        sendButton.addEventListener('click', sendMessage);

        // Send message on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Clear messages
        clearButton.addEventListener('click', function() {
            vscode.postMessage({
                type: 'clearMessages'
            });
        });

        function sendMessage() {
            const content = messageInput.value.trim();
            if (content) {
                vscode.postMessage({
                    type: 'sendMessage',
                    content: content
                });
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
        }

        // Auto-scroll to bottom when new messages arrive
        const observer = new MutationObserver(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

        observer.observe(messagesContainer, { childList: true, subtree: true });

        // Initial scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    </script>
</body>
</html>`;
    }

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
