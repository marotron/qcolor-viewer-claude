import * as vscode from 'vscode';

// Define interfaces for our color objects
export interface QColorMatch {
    range: vscode.Range;
    color: QColor;
    originalText: string;
}

export interface QColor {
    r: number;
    g: number;
    b: number;
    a: number;
    format: QColorFormat;
    originalArgs: string;
}

export enum QColorFormat {
    RGB = 'rgb',
    RGBA = 'rgba',
    HEX = 'hex',
    NAMED = 'named'
}

// Map of common color names to their RGB values
const NAMED_COLORS: Record<string, [number, number, number]> = {
    'black': [0, 0, 0],
    'white': [255, 255, 255],
    'red': [255, 0, 0],
    'green': [0, 255, 0],
    'blue': [0, 0, 255],
    'yellow': [255, 255, 0],
    'cyan': [0, 255, 255],
    'magenta': [255, 0, 255],
    'gray': [128, 128, 128],
    'darkGray': [64, 64, 64],
    'lightGray': [192, 192, 192],
    // Add more named colors as needed
};

export class ColorParser {
    /**
     * Find all QColor instances in the given text
     */
    public static findQColors(document: vscode.TextDocument): QColorMatch[] {
        const matches: QColorMatch[] = [];
        
        // Regular expression to match QColor constructor calls
        // This pattern matches the following formats:
        // QColor(r, g, b)
        // QColor(r, g, b, a)
        // QColor("#RRGGBB")
        // QColor("#RRGGBBAA")
        // QColor("colorName")
        const qcolorRegex = /QColor\s*\(\s*([^)]+)\s*\)/g;
        
        const text = document.getText();
        let match;
        
        while ((match = qcolorRegex.exec(text)) !== null) {
            const args = match[1].trim();
            const color = this.parseQColorArgs(args);
            
            if (color) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                
                matches.push({
                    range: new vscode.Range(startPos, endPos),
                    color,
                    originalText: match[0]
                });
            }
        }
        
        return matches;
    }
    
    /**
     * Parse QColor constructor arguments
     */
    private static parseQColorArgs(args: string): QColor | null {
        // Try to parse as comma-separated values (RGB or RGBA)
        if (args.includes(',')) {
            return this.parseRgbArgs(args);
        }
        
        // Try to parse as string (hex or named color)
        if ((args.startsWith('"') && args.endsWith('"')) || 
            (args.startsWith("'") && args.endsWith("'"))) {
            return this.parseStringArg(args.substring(1, args.length - 1));
        }
        
        return null;
    }
    
    /**
     * Parse RGB or RGBA format: r, g, b [, a]
     */
    private static parseRgbArgs(args: string): QColor | null {
        const values = args.split(',').map(v => parseInt(v.trim(), 10));
        
        if (values.length === 3 || values.length === 4) {
            const [r, g, b] = values;
            const a = values.length === 4 ? values[3] : 255;
            
            // Validate ranges
            if (this.isValidRgb(r, g, b, a)) {
                return {
                    r, g, b, a,
                    format: values.length === 3 ? QColorFormat.RGB : QColorFormat.RGBA,
                    originalArgs: args
                };
            }
        }
        
        return null;
    }
    
    /**
     * Parse string argument (hex code or named color)
     */
    private static parseStringArg(arg: string): QColor | null {
        // Check if it's a hex color
        if (arg.startsWith('#')) {
            return this.parseHexColor(arg);
        }
        
        // Check if it's a named color
        return this.parseNamedColor(arg);
    }
    
    /**
     * Parse hex color formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
     */
    private static parseHexColor(hex: string): QColor | null {
        hex = hex.toLowerCase();
        
        // Strip # if present
        if (hex.startsWith('#')) {
            hex = hex.substring(1);
        }
        
        let r = 0, g = 0, b = 0, a = 255;
        
        if (hex.length === 3) {
            // #RGB format
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 4) {
            // #RGBA format
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
            a = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 6) {
            // #RRGGBB format
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else if (hex.length === 8) {
            // #RRGGBBAA format
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
            a = parseInt(hex.substring(6, 8), 16);
        } else {
            return null;
        }
        
        if (this.isValidRgb(r, g, b, a)) {
            return {
                r, g, b, a,
                format: QColorFormat.HEX,
                originalArgs: `"#${hex}"`
            };
        }
        
        return null;
    }
    
    /**
     * Parse named colors like "red", "blue", etc.
     */
    private static parseNamedColor(name: string): QColor | null {
        const colorName = name.trim();
        const rgb = NAMED_COLORS[colorName];
        
        if (rgb) {
            const [r, g, b] = rgb;
            return {
                r, g, b, a: 255,
                format: QColorFormat.NAMED,
                originalArgs: `"${colorName}"`
            };
        }
        
        return null;
    }
    
    /**
     * Validate RGB(A) values are in valid ranges
     */
    private static isValidRgb(r: number, g: number, b: number, a: number): boolean {
        return !isNaN(r) && r >= 0 && r <= 255 &&
               !isNaN(g) && g >= 0 && g <= 255 &&
               !isNaN(b) && b >= 0 && b <= 255 &&
               !isNaN(a) && a >= 0 && a <= 255;
    }
    
    /**
     * Generate a CSS color string from a QColor object
     */
    public static toCssColor(color: QColor): string {
        if (color.a < 255) {
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a / 255).toFixed(2)})`;
        } else {
            return `rgb(${color.r}, ${color.g}, ${color.b})`;
        }
    }
    
    /**
     * Format a QColor for insertion into Python code
     */
    public static formatQColorCode(color: QColor, originalFormat: QColorFormat): string {
        switch (originalFormat) {
            case QColorFormat.RGB:
                return `QColor(${color.r}, ${color.g}, ${color.b})`;
            case QColorFormat.RGBA:
                return `QColor(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
            case QColorFormat.HEX:
                return color.a < 255 
                    ? `QColor("#${this.toHexString(color.r)}${this.toHexString(color.g)}${this.toHexString(color.b)}${this.toHexString(color.a)}")`
                    : `QColor("#${this.toHexString(color.r)}${this.toHexString(color.g)}${this.toHexString(color.b)}")`;
            case QColorFormat.NAMED:
                // If it was a named color that's been changed, convert to hex
                return `QColor("#${this.toHexString(color.r)}${this.toHexString(color.g)}${this.toHexString(color.b)}")`;
            default:
                return `QColor(${color.r}, ${color.g}, ${color.b})`;
        }
    }
    
    /**
     * Convert a number to a two-digit hex string
     */
    public static toHexString(num: number): string {
        const hex = num.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }
}