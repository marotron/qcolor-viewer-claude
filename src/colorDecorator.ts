import * as vscode from 'vscode';
import { ColorParser, QColorMatch, QColor } from './colorParser';

export class ColorDecorator implements vscode.Disposable {
    private decorationType: vscode.TextEditorDecorationType;
    private colorMatches: QColorMatch[] = [];
    private timeout: NodeJS.Timer | undefined = undefined;
    private readonly debounceTime = 300; // ms
    
    constructor(private context: vscode.ExtensionContext) {
        // Create the decoration type for inline color squares
        this.decorationType = this.createColorDecorationType();
    }
    
    /**
     * Create the decoration type for color squares
     */
    private createColorDecorationType(): vscode.TextEditorDecorationType {
        const config = vscode.workspace.getConfiguration('qcolorVisualizer');
        const decorationType = config.get<string>('decorationType', 'inline');
        const colorSampleSize = config.get<number>('colorSampleSize', 16);
        
        if (decorationType === 'gutter') {
            return vscode.window.createTextEditorDecorationType({
                gutterIconSize: `${colorSampleSize}px`,
            });
        } else {
            return vscode.window.createTextEditorDecorationType({
                // Will be set dynamically for each decoration
                before: undefined,
                // Don't take up space in the editor
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
        }
    }
    
    /**
     * Update decorations in the editor
     */
    public updateDecorations(editor: vscode.TextEditor): void {
        if (!editor || editor.document.languageId !== 'python') {
            return;
        }
        
        const config = vscode.workspace.getConfiguration('qcolorVisualizer');
        if (!config.get<boolean>('enabled', true)) {
            this.clearDecorations(editor);
            return;
        }
        
        // Debounce updates to avoid performance issues with rapid typing
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        
        this.timeout = setTimeout(() => {
            this.updateDecorationsNow(editor);
        }, this.debounceTime);
    }
    
    /**
     * Update decorations without debouncing
     */
    private updateDecorationsNow(editor: vscode.TextEditor): void {
        // Find QColor instances in the current document
        const colorMatches = ColorParser.findQColors(editor.document);
        this.colorMatches = colorMatches;
        
        // Create decorations for each color
        const decorations: vscode.DecorationOptions[] = [];
        
        const config = vscode.workspace.getConfiguration('qcolorVisualizer');
        const decorationType = config.get<string>('decorationType', 'inline');
        const colorSampleSize = config.get<number>('colorSampleSize', 16);
        
        colorMatches.forEach(match => {
            const cssColor = ColorParser.toCssColor(match.color);
            
            // Create decoration based on configuration
            if (decorationType === 'gutter') {
                // Create SVG icon for gutter
                const svgIcon = this.createColorSvg(match.color, colorSampleSize);
                const uri = this.svgToUri(svgIcon);
                
                decorations.push({
                    range: match.range,
                    renderOptions: {
                        // Using the after property instead of gutterIconPath for better compatibility
                        after: {
                            contentIconPath: uri,
                            margin: '0 0 0 5px'
                        }
                    }
                });
            } else {
                // Create inline decoration
                decorations.push({
                    range: match.range,
                    renderOptions: {
                        before: {
                            contentText: '',
                            backgroundColor: cssColor,
                            width: `${colorSampleSize}px`,
                            height: `${colorSampleSize}px`,
                            margin: '0 5px 0 0'
                        }
                    }
                });
            }
        });
        
        // Apply the decorations
        editor.setDecorations(this.decorationType, decorations);
    }
    
    /**
     * Clear all decorations
     */
    private clearDecorations(editor: vscode.TextEditor): void {
        editor.setDecorations(this.decorationType, []);
    }
    
    /**
     * Create an SVG for the color (used for gutter icons)
     */
    private createColorSvg(color: QColor, size: number): string {
        const cssColor = ColorParser.toCssColor(color);
        
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" fill="${cssColor}" />
        </svg>`;
    }
    
    /**
     * Convert SVG string to a data URI
     */
    private svgToUri(svg: string): vscode.Uri {
        const encoded = encodeURIComponent(svg);
        return vscode.Uri.parse(`data:image/svg+xml;utf8,${encoded}`);
    }
    
    /**
     * Get color match for a given position
     */
    public getColorMatchAtPosition(_document: vscode.TextDocument, position: vscode.Position): QColorMatch | undefined {
        // Find the color match containing the position
        return this.colorMatches.find(match => match.range.contains(position));
    }
    
    /**
     * Clean up resources
     */
    public dispose(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.decorationType.dispose();
    }
}