import * as assert from 'assert';
import * as vscode from 'vscode';
import { ColorParser, QColorFormat } from '../../src/colorParser';

suite('ColorParser Test Suite', () => {
    test('Parse RGB QColor', () => {
        const testDocument = createTestDocument(`
            # Test RGB QColor
            color = QColor(255, 0, 0)
        `);
        
        const colorMatches = ColorParser.findQColors(testDocument);
        
        assert.strictEqual(colorMatches.length, 1);
        assert.strictEqual(colorMatches[0].color.r, 255);
        assert.strictEqual(colorMatches[0].color.g, 0);
        assert.strictEqual(colorMatches[0].color.b, 0);
        assert.strictEqual(colorMatches[0].color.a, 255);
        assert.strictEqual(colorMatches[0].color.format, QColorFormat.RGB);
    });

    test('Parse RGBA QColor', () => {
        const testDocument = createTestDocument(`
            # Test RGBA QColor
            color = QColor(255, 0, 0, 128)
        `);
        
        const colorMatches = ColorParser.findQColors(testDocument);
        
        assert.strictEqual(colorMatches.length, 1);
        assert.strictEqual(colorMatches[0].color.r, 255);
        assert.strictEqual(colorMatches[0].color.g, 0);
        assert.strictEqual(colorMatches[0].color.b, 0);
        assert.strictEqual(colorMatches[0].color.a, 128);
        assert.strictEqual(colorMatches[0].color.format, QColorFormat.RGBA);
    });

    test('Parse Hex QColor', () => {
        const testDocument = createTestDocument(`
            # Test Hex QColor
            color = QColor("#FF0000")
        `);
        
        const colorMatches = ColorParser.findQColors(testDocument);
        
        assert.strictEqual(colorMatches.length, 1);
        assert.strictEqual(colorMatches[0].color.r, 255);
        assert.strictEqual(colorMatches[0].color.g, 0);
        assert.strictEqual(colorMatches[0].color.b, 0);
        assert.strictEqual(colorMatches[0].color.a, 255);
        assert.strictEqual(colorMatches[0].color.format, QColorFormat.HEX);
    });

    test('Parse Hex with Alpha QColor', () => {
        const testDocument = createTestDocument(`
            # Test Hex with Alpha QColor
            color = QColor("#FF0000FF")
        `);
        
        const colorMatches = ColorParser.findQColors(testDocument);
        
        assert.strictEqual(colorMatches.length, 1);
        assert.strictEqual(colorMatches[0].color.r, 255);
        assert.strictEqual(colorMatches[0].color.g, 0);
        assert.strictEqual(colorMatches[0].color.b, 0);
        assert.strictEqual(colorMatches[0].color.a, 255);
        assert.strictEqual(colorMatches[0].color.format, QColorFormat.HEX);
    });

    test('Parse Named QColor', () => {
        const testDocument = createTestDocument(`
            # Test Named QColor
            color = QColor("red")
        `);
        
        const colorMatches = ColorParser.findQColors(testDocument);
        
        assert.strictEqual(colorMatches.length, 1);
        assert.strictEqual(colorMatches[0].color.r, 255);
        assert.strictEqual(colorMatches[0].color.g, 0);
        assert.strictEqual(colorMatches[0].color.b, 0);
        assert.strictEqual(colorMatches[0].color.a, 255);
        assert.strictEqual(colorMatches[0].color.format, QColorFormat.NAMED);
    });

    test('Parse Multiple QColors', () => {
        const testDocument = createTestDocument(`
            # Test Multiple QColors
            red = QColor(255, 0, 0)
            green = QColor(0, 255, 0)
            blue = QColor("#0000FF")
            transparent_red = QColor(255, 0, 0, 128)
        `);
        
        const colorMatches = ColorParser.findQColors(testDocument);
        
        assert.strictEqual(colorMatches.length, 4);
    });

    test('CSS Color String Generation', () => {
        const rgbColor = {
            r: 255,
            g: 0,
            b: 0,
            a: 255,
            format: QColorFormat.RGB,
            originalArgs: "255, 0, 0"
        };
        
        const rgbaColor = {
            r: 255,
            g: 0,
            b: 0,
            a: 128,
            format: QColorFormat.RGBA,
            originalArgs: "255, 0, 0, 128"
        };
        
        assert.strictEqual(ColorParser.toCssColor(rgbColor), "rgb(255, 0, 0)");
        assert.strictEqual(ColorParser.toCssColor(rgbaColor), "rgba(255, 0, 0, 0.50)");
    });

    test('QColor Code Formatting', () => {
        const rgbColor = {
            r: 255,
            g: 0,
            b: 0,
            a: 255,
            format: QColorFormat.RGB,
            originalArgs: "255, 0, 0"
        };
        
        const hexColor = {
            r: 255,
            g: 0,
            b: 0,
            a: 255,
            format: QColorFormat.HEX,
            originalArgs: '"#FF0000"'
        };
        
        const namedColor = {
            r: 0,
            g: 0,
            b: 255,
            a: 255,
            format: QColorFormat.NAMED,
            originalArgs: '"blue"'
        };
        
        assert.strictEqual(ColorParser.formatQColorCode(rgbColor, QColorFormat.RGB), "QColor(255, 0, 0)");
        assert.strictEqual(ColorParser.formatQColorCode(hexColor, QColorFormat.HEX), 'QColor("#ff0000")');
        
        // Named colors that are modified should be converted to hex
        const modifiedNamedColor = {
            r: 0,
            g: 0,
            b: 200, // Changed from 255 to 200
            a: 255,
            format: QColorFormat.NAMED,
            originalArgs: '"blue"'
        };
        
        assert.strictEqual(ColorParser.formatQColorCode(modifiedNamedColor, QColorFormat.NAMED), 'QColor("#0000c8")');
    });
});

function createTestDocument(content: string): vscode.TextDocument {
    return {
        getText: () => content,
        positionAt: (offset: number) => {
            const text = content.substring(0, offset);
            const lines = text.split('\n');
            const line = lines.length - 1;
            const character = lines[lines.length - 1].length;
            return new vscode.Position(line, character);
        },
        lineAt: (line: number) => {
            const lines = content.split('\n');
            return {
                text: lines[line],
                range: new vscode.Range(
                    new vscode.Position(line, 0),
                    new vscode.Position(line, lines[line].length)
                )
            };
        }
    } as vscode.TextDocument;
}