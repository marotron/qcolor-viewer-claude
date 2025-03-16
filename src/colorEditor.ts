import * as vscode from 'vscode';
import * as path from 'path';
import { ColorParser, QColor, QColorFormat, QColorMatch } from './colorParser';
import { ColorDecorator } from './colorDecorator';


export class ColorEditor implements vscode.Disposable {
    
    private panel: vscode.WebviewPanel | undefined;
    private currentColorMatch: QColorMatch | undefined;
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Register context menu items with explicit editor usage
        context.subscriptions.push(
            vscode.commands.registerTextEditorCommand(
                'qcolor-visualizer.openColorPicker', 
                (activeEditor) => {
                    // Explicitly use activeEditor to prevent unused parameter warning
                    const colorDecorator = this.context.subscriptions.find(
                        d => d instanceof ColorDecorator
                    ) as ColorDecorator | undefined;
                    
                    if (activeEditor && colorDecorator) {
                        const colorMatch = colorDecorator.getColorMatchAtPosition(
                            activeEditor.document, 
                            activeEditor.selection.active
                        );
                        
                        this.open(colorMatch);
                    } else {
                        this.open();
                    }
                }
            )
        );
    }
    
    public open(colorMatch?: QColorMatch): void {
        // If no color match provided, try to get one at the current cursor position
        if (!colorMatch) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.selection) {
                // Get the color decorator instance from extension context
                const colorDecorator = this.context.subscriptions.find(
                    d => d instanceof ColorDecorator
                ) as ColorDecorator | undefined;
                
                if (colorDecorator) {
                    colorMatch = colorDecorator.getColorMatchAtPosition(
                        editor.document, 
                        editor.selection.active
                    );
                }
            }
        }
        
        if (!colorMatch) {
            vscode.window.showInformationMessage('No QColor found at cursor position.');
            return;
        }
        
        this.currentColorMatch = colorMatch;
        
        // Create or show the webview panel
        if (!this.panel) {
            this.panel = vscode.window.createWebviewPanel(
                'qcolorEditor',
                'QColor Editor',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))
                    ],
                    // New Security Configuration
                }
            );
            
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, null, this.context.subscriptions);
            
            this.panel.webview.onDidReceiveMessage(
                message => this.handleWebviewMessage(message),
                undefined,
                this.context.subscriptions
            );
        } else {
            this.panel.reveal();
        }
        
        // Explicitly check panel before setting HTML
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent(colorMatch.color);
        }
    }
    
    private handleWebviewMessage(message: any): void {
        console.log('Received message:', message); // Debugging log
        
        switch (message.command) {
            case 'updateColor':
                // console.log('Received updateColor message:', message.color); // Debugging log
                this.updateColorInDocument(message.color);
                break;
            case 'close':
                if (this.panel) {
                    this.panel.dispose();
                }
                break;
            default:
                console.warn('Unknown message command:', message.command);
        }
    }
    
    private updateColorInDocument(newColor: { r: number, g: number, b: number, a: number }): void {
        // Robust null checks
        if (!this.currentColorMatch) {
            vscode.window.showErrorMessage('No color match available for update.');
            return;
        }
        
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor.');
            return;
        }
        
        const updatedColor: QColor = {
            r: newColor.r,
            g: newColor.g,
            b: newColor.b,
            a: newColor.a,
            format: this.currentColorMatch.color.format,
            originalArgs: this.currentColorMatch.color.originalArgs
        };
        
        const newText = ColorParser.formatQColorCode(updatedColor, updatedColor.format);
        
        editor.edit(editBuilder => {
            // vscode.window.showErrorMessage('Replacing color code with new value: ' + newText);
            // Safe non-null assertion due to earlier checks
            editBuilder.replace(this.currentColorMatch!.range, newText);
        }).then(success => {
            if (success) {
                this.currentColorMatch!.color = updatedColor;
                
                if (this.panel) {
                    this.panel.webview.html = this.getWebviewContent(updatedColor);
                }
                
                vscode.window.showInformationMessage('Color updated successfully.');
            } else {
                vscode.window.showErrorMessage('Failed to update color.');
            }
        });
    }
    
    /**
     * Generate the HTML content for the webview
     */
    private getWebviewContent(color: QColor): string {
        // Convert to HSV for color picker
        // This is a simple conversion, for a real implementation you might use a library
        const r = color.r / 255;
        const g = color.g / 255;
        const b = color.b / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        if (delta > 0) {
            if (max === r) {
                h = ((g - b) / delta) % 6;
            } else if (max === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }
            h = Math.round(h * 60);
            if (h < 0) {
                h += 360;
            }
        }
        
        const s = max === 0 ? 0 : Math.round((delta / max) * 100);
        const v = Math.round(max * 100);
        
        // Generate hex string
        const hexString = `#${ColorParser.toHexString(color.r)}${ColorParser.toHexString(color.g)}${ColorParser.toHexString(color.b)}`;
        
        // HTML for the webview - with proper template literal escaping
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QColor Editor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .color-preview {
            width: 100%;
            height: 60px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .controls {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .control-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        label {
            width: 100px;
            display: inline-block;
        }
        input[type="range"] {
            flex: 1;
        }
        input[type="number"] {
            width: 60px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 4px;
            border-radius: 2px;
        }
        .color-picker {
            position: relative;
            width: 100%;
            height: 150px;
            margin-bottom: 15px;
        }
        .color-picker-sv {
            position: relative;
            width: 100%;
            height: 150px;
            background: linear-gradient(to right, white, hsl(${h}, 100%, 50%));
            cursor: crosshair;
        }
        .color-picker-sv::after {
            content: '';
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, rgba(0,0,0,0), black);
        }
        .color-picker-sv-cursor {
            position: absolute;
            width: 10px;
            height: 10px;
            border: 2px solid white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
            pointer-events: none;
        }
        .color-picker-hue {
            width: 100%;
            height: 20px;
            margin-top: 10px;
            background: linear-gradient(to right, 
                hsl(0, 100%, 50%), 
                hsl(60, 100%, 50%), 
                hsl(120, 100%, 50%), 
                hsl(180, 100%, 50%), 
                hsl(240, 100%, 50%), 
                hsl(300, 100%, 50%), 
                hsl(360, 100%, 50%)
            );
            cursor: crosshair;
            position: relative;
        }
        .color-picker-hue-cursor {
            position: absolute;
            width: 4px;
            height: 20px;
            background-color: white;
            transform: translateX(-50%);
            pointer-events: none;
        }
        .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        button {
            padding: 6px 14px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="color-preview" style="background-color: ${hexString}${color.a < 255 ? Math.round(color.a/2.55)/100 : ''}"></div>
        
        <div class="controls">
            <div class="color-picker">
                <div class="color-picker-sv">
                    <div class="color-picker-sv-cursor" style="left: ${s}%; top: ${100-v}%"></div>
                </div>
                <div class="color-picker-hue">
                    <div class="color-picker-hue-cursor" style="left: ${h/360*100}%"></div>
                </div>
            </div>
            
            <div class="control-group">
                <div class="control-row">
                    <label for="red">Red:</label>
                    <input type="range" id="red" min="0" max="255" value="${color.r}" />
                    <input type="number" id="red-value" min="0" max="255" value="${color.r}" />
                </div>
                <div class="control-row">
                    <label for="green">Green:</label>
                    <input type="range" id="green" min="0" max="255" value="${color.g}" />
                    <input type="number" id="green-value" min="0" max="255" value="${color.g}" />
                </div>
                <div class="control-row">
                    <label for="blue">Blue:</label>
                    <input type="range" id="blue" min="0" max="255" value="${color.b}" />
                    <input type="number" id="blue-value" min="0" max="255" value="${color.b}" />
                </div>
                <div class="control-row">
                    <label for="alpha">Alpha:</label>
                    <input type="range" id="alpha" min="0" max="255" value="${color.a}" />
                    <input type="number" id="alpha-value" min="0" max="255" value="${color.a}" />
                </div>
            </div>
            
            <div class="control-row">
                <label for="hex">Hex:</label>
                <input type="text" id="hex-value" value="${hexString}" style="flex: 1; background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 4px; border-radius: 2px;" />
            </div>
        </div>
        
        <div class="buttons">
            <button id="apply-button">Apply</button>
            <button id="close-button">Close</button>
        </div>
    </div>
    
    <script>
        (function() {
            // Initial color values
            let r = ${color.r};
            let g = ${color.g};
            let b = ${color.b};
            let a = ${color.a};
            let h = ${h};
            let s = ${s};
            let v = ${v};
            
            // DOM elements
            const vscode = acquireVsCodeApi();
            const colorPreview = document.querySelector('.color-preview');
            const redSlider = document.getElementById('red');
            const greenSlider = document.getElementById('green');
            const blueSlider = document.getElementById('blue');
            const alphaSlider = document.getElementById('alpha');
            const redValue = document.getElementById('red-value');
            const greenValue = document.getElementById('green-value');
            const blueValue = document.getElementById('blue-value');
            const alphaValue = document.getElementById('alpha-value');
            const hexValue = document.getElementById('hex-value');
            const applyButton = document.getElementById('apply-button');
            const closeButton = document.getElementById('close-button');
            const svPicker = document.querySelector('.color-picker-sv');
            const svCursor = document.querySelector('.color-picker-sv-cursor');
            const huePicker = document.querySelector('.color-picker-hue');
            const hueCursor = document.querySelector('.color-picker-hue-cursor');
            
            // Update color preview and inputs
            function updateColorDisplay() {
                const hexString = rgbToHex(r, g, b);
                colorPreview.style.backgroundColor = a < 255 
                    ? \`rgba(\${r}, \${g}, \${b}, \${(a/255).toFixed(2)})\`
                    : hexString;
                
                redSlider.value = r;
                greenSlider.value = g;
                blueSlider.value = b;
                alphaSlider.value = a;
                
                redValue.value = r;
                greenValue.value = g;
                blueValue.value = b;
                alphaValue.value = a;
                
                hexValue.value = hexString;
                
                // Update the color picker background
                svPicker.style.background = \`linear-gradient(to right, white, hsl(\${h}, 100%, 50%))\`;
                
                // Update cursor positions
                svCursor.style.left = \`\${s}%\`;
                svCursor.style.top = \`\${100-v}%\`;
                hueCursor.style.left = \`\${h/360*100}%\`;
            }
            
            // Convert RGB to Hex
            function rgbToHex(r, g, b) {
                return '#' + 
                    (r < 16 ? '0' : '') + r.toString(16) + 
                    (g < 16 ? '0' : '') + g.toString(16) + 
                    (b < 16 ? '0' : '') + b.toString(16);
            }
            
            // Convert Hex to RGB
            function hexToRgb(hex) {
                hex = hex.replace(/^#/, '');
                
                if(hex.length === 3) {
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }
                
                const num = parseInt(hex, 16);
                return {
                    r: (num >> 16) & 255,
                    g: (num >> 8) & 255,
                    b: num & 255
                };
            }
            
            // Convert RGB to HSV
            function rgbToHsv(r, g, b) {
                r /= 255;
                g /= 255;
                b /= 255;
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const delta = max - min;
                
                let h = 0;
                if (delta > 0) {
                    if (max === r) {
                        h = ((g - b) / delta) % 6;
                    } else if (max === g) {
                        h = (b - r) / delta + 2;
                    } else {
                        h = (r - g) / delta + 4;
                    }
                    h = Math.round(h * 60);
                    if (h < 0) {
                        h += 360;
                    }
                }
                
                const s = max === 0 ? 0 : Math.round((delta / max) * 100);
                const v = Math.round(max * 100);
                
                return { h, s, v };
            }
            
            // Convert HSV to RGB
            function hsvToRgb(h, s, v) {
                s /= 100;
                v /= 100;
                
                const c = v * s;
                const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                const m = v - c;
                
                let r, g, b;
                if (h >= 0 && h < 60) {
                    [r, g, b] = [c, x, 0];
                } else if (h >= 60 && h < 120) {
                    [r, g, b] = [x, c, 0];
                } else if (h >= 120 && h < 180) {
                    [r, g, b] = [0, c, x];
                } else if (h >= 180 && h < 240) {
                    [r, g, b] = [0, x, c];
                } else if (h >= 240 && h < 300) {
                    [r, g, b] = [x, 0, c];
                } else {
                    [r, g, b] = [c, 0, x];
                }
                
                return {
                    r: Math.round((r + m) * 255),
                    g: Math.round((g + m) * 255),
                    b: Math.round((b + m) * 255)
                };
            }
            
            // RGB value input handlers
            redSlider.addEventListener('input', () => {
                r = parseInt(redSlider.value);
                redValue.value = r;
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
                updateColorDisplay();
            });
            
            greenSlider.addEventListener('input', () => {
                g = parseInt(greenSlider.value);
                greenValue.value = g;
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
                updateColorDisplay();
            });
            
            blueSlider.addEventListener('input', () => {
                b = parseInt(blueSlider.value);
                blueValue.value = b;
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
                updateColorDisplay();
            });
            
            alphaSlider.addEventListener('input', () => {
                a = parseInt(alphaSlider.value);
                alphaValue.value = a;
                updateColorDisplay();
            });
            
            // Number input handlers
            redValue.addEventListener('change', () => {
                r = Math.min(255, Math.max(0, parseInt(redValue.value) || 0));
                redValue.value = r;
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
                updateColorDisplay();
            });
            
            greenValue.addEventListener('change', () => {
                g = Math.min(255, Math.max(0, parseInt(greenValue.value) || 0));
                greenValue.value = g;
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
                updateColorDisplay();
            });
            
            blueValue.addEventListener('change', () => {
                b = Math.min(255, Math.max(0, parseInt(blueValue.value) || 0));
                blueValue.value = b;
                const hsv = rgbToHsv(r, g, b);
                h = hsv.h;
                s = hsv.s;
                v = hsv.v;
                updateColorDisplay();
            });
            
            alphaValue.addEventListener('change', () => {
                a = Math.min(255, Math.max(0, parseInt(alphaValue.value) || 0));
                alphaValue.value = a;
                updateColorDisplay();
            });
            
            // Hex input handler
            hexValue.addEventListener('change', () => {
                const hex = hexValue.value.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    const rgb = hexToRgb(hex);
                    r = rgb.r;
                    g = rgb.g;
                    b = rgb.b;
                    const hsv = rgbToHsv(r, g, b);
                    h = hsv.h;
                    s = hsv.s;
                    v = hsv.v;
                    updateColorDisplay();
                } else {
                    hexValue.value = rgbToHex(r, g, b);
                }
            });
            
            // Color picker handlers
            function handleSvPicker(event) {
                const rect = svPicker.getBoundingClientRect();
                const saturation = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
                const value = Math.max(0, Math.min(100, 100 - ((event.clientY - rect.top) / rect.height) * 100));
                
                s = Math.round(saturation);
                v = Math.round(value);
                
                const rgb = hsvToRgb(h, s, v);
                r = rgb.r;
                g = rgb.g;
                b = rgb.b;
                
                updateColorDisplay();
            }
            
            function handleHuePicker(event) {
                const rect = huePicker.getBoundingClientRect();
                const hueValue = Math.max(0, Math.min(360, ((event.clientX - rect.left) / rect.width) * 360));
                
                h = Math.round(hueValue);
                
                const rgb = hsvToRgb(h, s, v);
                r = rgb.r;
                g = rgb.g;
                b = rgb.b;
                
                updateColorDisplay();
            }
            
            svPicker.addEventListener('mousedown', (event) => {
                handleSvPicker(event);
                
                function handleMouseMove(e) {
                    handleSvPicker(e);
                }
                
                function handleMouseUp() {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                }
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
            
            huePicker.addEventListener('mousedown', (event) => {
                handleHuePicker(event);
                
                function handleMouseMove(e) {
                    handleHuePicker(e);
                }
                
                function handleMouseUp() {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                }
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
            
            // Button handlers
            applyButton.addEventListener('click', () => {
                console.log('Applying color:', { r, g, b, a });
                vscode.postMessage({
                    command: 'updateColor',
                    color: { r, g, b, a }
                });
            });
            
            closeButton.addEventListener('click', () => {
                vscode.postMessage({
                    command: 'close'
                });
            });
        })();
    </script>
</body>
</html>`;
    }
    
    /**
     * Clean up resources when the extension is deactivated
     */
    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}