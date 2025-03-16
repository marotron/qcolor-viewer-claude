# QColor Visualizer and Editor

An extension that enhances the Python development experience within VS Code by providing visual representations and interactive editing for `QColor` objects from the PyQt or PySide libraries.

![QColor Visualizer Preview](https://via.placeholder.com/800x400?text=QColor+Visualizer+Preview)

> Note: This extension works with any Python files using QColor from PyQt5, PyQt6, PySide2, or PySide6 libraries.

## Features

### QColor Visualization
- Automatically detects `QColor` objects in your Python code
- Displays a visual color swatch next to each detected `QColor`
- Supports various `QColor` constructor formats:
  - `QColor(r, g, b)` - RGB values
  - `QColor(r, g, b, a)` - RGBA values with alpha
  - `QColor("#RRGGBB")` - Hexadecimal string
  - `QColor("#RRGGBBAA")` - Hexadecimal string with alpha
  - `QColor("colorName")` - Named colors (e.g., "red", "blue")

### QColor Editor
- Click on any color swatch to open the color editor
- Full-featured color picker with:
  - Hue/Saturation/Value (HSV) selectors
  - RGB value sliders and input fields
  - Alpha (opacity) control
  - Hexadecimal input/output
- Live preview of selected color
- Real-time code updating as you modify colors
- Preserves original color format when possible

## Requirements

- Visual Studio Code 1.60.0 or higher
- Python files using PyQt or PySide libraries (PyQt5, PyQt6, PySide2, PySide6)

## Extension Settings

This extension contributes the following settings:

* `qcolorVisualizer.enabled`: Enable/disable QColor visualization
* `qcolorVisualizer.decorationType`: Choose where to show color decoration (`inline` or `gutter`)
* `qcolorVisualizer.colorSampleSize`: Size of the color sample box in pixels

## Usage

1. Open any Python file that uses QColor objects from PyQt or PySide
2. The extension will automatically display color swatches next to QColor declarations
3. Click on any color swatch to open the color editor
4. Modify the color using the editor controls
5. Click "Apply" to update the color in your code, or "Close" to cancel

### Color Editor

The color editor provides multiple ways to edit colors:

- **HSV Color Picker**: Click and drag in the 2D color field to select saturation and value; use the hue slider to change the base hue
- **RGB Sliders**: Adjust the red, green, and blue components individually
- **Alpha Slider**: Control the opacity level
- **Hex Input**: Directly enter a hexadecimal color value
- **Numeric Inputs**: Enter precise RGB or alpha values

### Example

```python
# The extension will visualize these QColor objects
background_color = QColor(240, 240, 240)  # Light gray
text_color = QColor(33, 33, 33)  # Dark gray
accent_color = QColor("#2196F3")  # Material blue
highlight_color = QColor(255, 235, 59, 128)  # Semi-transparent yellow
warning_color = QColor("red")  # Named color
```

See the `samples/colors_demo.py` file for more examples.

## Known Issues

- The extension does not provide syntax highlighting for QColor constructors
- Some named colors may not be recognized if they are specific to certain Qt versions

## Release Notes

### 0.1.0

- Initial release of QColor Visualizer and Editor
- Basic support for QColor visualization and editing
- Support for RGB, RGBA, hex, and named color formats

---

## Development

### Building the Extension

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile TypeScript files
4. Press F5 in VS Code to launch the extension in debug mode

### Testing

Run the tests using:

```
npm test
```

### Packaging

Create a VSIX package for distribution:

```
npm run package
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.