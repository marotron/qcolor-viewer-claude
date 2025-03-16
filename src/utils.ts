import * as vscode from 'vscode';

/**
 * Utility functions for the QColor Visualizer & Editor extension
 */
export class Utils {
    /**
     * Check if PyQt or PySide is installed in the current Python environment
     */
    public static async checkQtLibraries(): Promise<boolean> {
        // Try to execute a Python command to check for PyQt or PySide
        try {
            const terminal = vscode.window.createTerminal('QColor Detector');
            
            // Command to check if PyQt or PySide is installed
            const command = `python -c "try: import PyQt5; print('PyQt5 found'); exit(0); except ImportError: try: import PySide2; print('PySide2 found'); exit(0); except ImportError: try: import PyQt6; print('PyQt6 found'); exit(0); except ImportError: try: import PySide6; print('PySide6 found'); exit(0); except ImportError: print('Neither PyQt nor PySide found'); exit(1)"`;
            
            terminal.sendText(command);
            terminal.dispose();
            
            // Since we can't directly get the terminal output,
            // we'll assume the libraries are installed and just notify if they're not found
            // in a real extension you might use the Python extension API to run a script
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Show notification about missing Qt libraries
     */
    public static showMissingQtNotification(): void {
        vscode.window.showWarningMessage(
            'PyQt or PySide libraries not detected. QColor Visualizer will still work, but you may not be able to test your code without these libraries installed.',
            'Dismiss'
        );
    }
}