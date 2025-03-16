#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
QColor Visualizer and Editor Demo
=================================

This file demonstrates different QColor constructor formats 
that are supported by the QColor Visualizer & Editor extension.
"""

from PyQt5.QtGui import QColor
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QLabel


class ColorDemo(QMainWindow):
    """A simple demo window showing different QColor instances."""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("QColor Demo")
        self.setGeometry(100, 100, 400, 600)
        
        # Main widget and layout
        main_widget = QWidget()
        layout = QVBoxLayout(main_widget)
        self.setCentralWidget(main_widget)
        
        # Create color examples
        self.create_color_examples(layout)
    
    def create_color_examples(self, layout):
        """Create examples of different QColor constructor formats."""
        
        # RGB format
        rgb_label = QLabel("RGB Format: QColor(r, g, b)")
        rgb_color = QColor(255, 0, 0)  # Pure red
        self.add_color_sample(layout, rgb_label, rgb_color)
        
        # RGBA format
        rgba_label = QLabel("RGBA Format: QColor(r, g, b, a)")
        rgba_color = QColor(0, 255, 0, 128)  # Semi-transparent green
        self.add_color_sample(layout, rgba_label, rgba_color)
        
        # Hex format
        hex_label = QLabel("Hex Format: QColor('#RRGGBB')")
        hex_color = QColor("#0000FF")  # Pure blue
        self.add_color_sample(layout, hex_label, hex_color)
        
        # Hex with alpha format
        hex_alpha_label = QLabel("Hex with Alpha Format: QColor('#RRGGBBAA')")
        hex_alpha_color = QColor("#FF00FF80")  # Semi-transparent magenta
        self.add_color_sample(layout, hex_alpha_label, hex_alpha_color)
        
        # Named color format
        named_label = QLabel("Named Color Format: QColor('name')")
        named_color = QColor("cyan")  # Cyan color
        self.add_color_sample(layout, named_label, named_color)
        
        # Custom colors for a color palette
        layout.addSpacing(20)
        layout.addWidget(QLabel("Color Palette Example:"))
        
        # Define a palette of colors
        palette = [
            QColor(33, 150, 243),    # Blue
            QColor(0, 150, 136),     # Teal
            QColor(76, 175, 80),     # Green
            QColor(255, 235, 59),    # Yellow
            QColor(255, 152, 0),     # Orange
            QColor(244, 67, 54),     # Red
            QColor(156, 39, 176),    # Purple
        ]
        
        # Display palette colors
        for i, color in enumerate(palette):
            layout.addWidget(QLabel(f"Palette Color {i+1}: {color.name()}"))
            self.create_color_widget(layout, color)
    
    def add_color_sample(self, layout, label, color):
        """Add a labeled color sample to the layout."""
        layout.addSpacing(10)
        layout.addWidget(label)
        self.create_color_widget(layout, color)
    
    def create_color_widget(self, layout, color):
        """Create a widget displaying the specified color."""
        color_widget = QWidget()
        color_widget.setFixedHeight(40)
        color_widget.setStyleSheet(f"background-color: {color.name()}; border: 1px solid black;")
        layout.addWidget(color_widget)


if __name__ == "__main__":
    app = QApplication([])
    window = ColorDemo()
    window.show()
    app.exec_()