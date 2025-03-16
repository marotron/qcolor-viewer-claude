import * as vscode from 'vscode';
import { ColorDecorator } from './colorDecorator';
import { ColorEditor } from './colorEditor';

export function activate(context: vscode.ExtensionContext) {
    console.log('QColor Visualizer & Editor is now active');
    
    // Create instances of our main components
    const colorDecorator = new ColorDecorator(context);
    const colorEditor = new ColorEditor(context);
    
    // Register a command to open the color picker
    const openColorPickerCommand = vscode.commands.registerCommand(
        'qcolor-visualizer.openColorPicker', 
        (args) => colorEditor.open(args)
    );
    
    // Register event listeners for active editor changes
    const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(
        editor => {
            if (editor && editor.document.languageId === 'python') {
                colorDecorator.updateDecorations(editor);
            }
        }
    );
    
    // Register event listeners for document changes
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument(
        event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document && 
                editor.document.languageId === 'python') {
                colorDecorator.updateDecorations(editor);
            }
        }
    );
    
    // Initial decoration of active editor if it's a Python file
    if (vscode.window.activeTextEditor && 
        vscode.window.activeTextEditor.document.languageId === 'python') {
        colorDecorator.updateDecorations(vscode.window.activeTextEditor);
    }
    
    // Add all disposables to context for proper cleanup
    context.subscriptions.push(
        openColorPickerCommand,
        activeEditorChangeListener,
        documentChangeListener,
        colorDecorator,
        colorEditor
    );
}

export function deactivate() {
    // Cleanup will be handled automatically via disposables
    console.log('QColor Visualizer & Editor is now deactivated');
}