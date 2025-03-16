(function() {
    // Establish connection to VS Code extension
    const vscode = acquireVsCodeApi();

    // Color state (will be initialized from VS Code)
    let colorState = {
        r: 0,
        g: 0,
        b: 0,
        a: 255,
        h: 0,
        s: 0,
        v: 0
    };

    // DOM Elements
    const colorPreview = document.getElementById('colorPreview');
    const svArea = document.getElementById('saturation-value-area');
    const svCursor = document.getElementById('saturation-value-cursor');
    const huePicker = document.getElementById('hue-picker');
    const hueCursor = document.getElementById('hue-cursor');
    
    const redSlider = document.getElementById('red-slider');
    const greenSlider = document.getElementById('green-slider');
    const blueSlider = document.getElementById('blue-slider');
    const alphaSlider = document.getElementById('alpha-slider');
    
    const redValue = document.getElementById('red-value');
    const greenValue = document.getElementById('green-value');
    const blueValue = document.getElementById('blue-value');
    const alphaValue = document.getElementById('alpha-value');
    const hexValue = document.getElementById('hex-value');
    
    const applyButton = document.getElementById('apply-button');
    const closeButton = document.getElementById('close-button');

    // Initialize from message data (if any)
    window.addEventListener('message', event => {
        const message = event.data;
        
        if (message.type === 'init') {
            // Set initial color values
            colorState.r = message.r;
            colorState.g = message.g;
            colorState.b = message.b;
            colorState.a = message.a;
            
            // Calculate HSV
            const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
            colorState.h = hsv.h;
            colorState.s = hsv.s;
            colorState.v = hsv.v;
            
            // Update UI
            updateUI();
        }
    });

    // Color conversion utilities
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
    
    function rgbToHex(r, g, b) {
        return '#' + 
            (r < 16 ? '0' : '') + r.toString(16) + 
            (g < 16 ? '0' : '') + g.toString(16) + 
            (b < 16 ? '0' : '') + b.toString(16);
    }
    
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

    // Update UI based on current color state
    function updateUI() {
        // Update sliders
        redSlider.value = colorState.r;
        greenSlider.value = colorState.g;
        blueSlider.value = colorState.b;
        alphaSlider.value = colorState.a;
        
        // Update numeric inputs
        redValue.value = colorState.r;
        greenValue.value = colorState.g;
        blueValue.value = colorState.b;
        alphaValue.value = colorState.a;
        
        // Update hex input
        hexValue.value = rgbToHex(colorState.r, colorState.g, colorState.b);
        
        // Update color preview
        const alphaValue = (colorState.a / 255).toFixed(2);
        colorPreview.style.backgroundColor = `rgba(${colorState.r}, ${colorState.g}, ${colorState.b}, ${alphaValue})`;
        
        // Update color pickers
        svArea.style.backgroundColor = `hsl(${colorState.h}, 100%, 50%)`;
        
        // Position cursors
        const svRect = svArea.getBoundingClientRect();
        svCursor.style.left = `${(colorState.s / 100) * svRect.width}px`;
        svCursor.style.top = `${(1 - colorState.v / 100) * svRect.height}px`;
        
        const hueRect = huePicker.getBoundingClientRect();
        hueCursor.style.left = `${(colorState.h / 360) * hueRect.width}px`;
    }

    // Event Handlers
    function handleSVPicker(e) {
        const rect = svArea.getBoundingClientRect();
        let s = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
        let v = Math.max(0, Math.min(100, 100 - (e.clientY - rect.top) / rect.height * 100));
        
        colorState.s = Math.round(s);
        colorState.v = Math.round(v);
        
        // Update RGB from HSV
        const rgb = hsvToRgb(colorState.h, colorState.s, colorState.v);
        colorState.r = rgb.r;
        colorState.g = rgb.g;
        colorState.b = rgb.b;
        
        updateUI();
    }
    
    function handleHuePicker(e) {
        const rect = huePicker.getBoundingClientRect();
        let h = Math.max(0, Math.min(360, (e.clientX - rect.left) / rect.width * 360));
        
        colorState.h = Math.round(h);
        
        // Update RGB from HSV
        const rgb = hsvToRgb(colorState.h, colorState.s, colorState.v);
        colorState.r = rgb.r;
        colorState.g = rgb.g;
        colorState.b = rgb.b;
        
        updateUI();
    }

    // Saturation-Value picker events
    svArea.addEventListener('mousedown', e => {
        handleSVPicker(e);
        
        const mouseMoveHandler = ev => {
            handleSVPicker(ev);
        };
        
        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    // Hue picker events
    huePicker.addEventListener('mousedown', e => {
        handleHuePicker(e);
        
        const mouseMoveHandler = ev => {
            handleHuePicker(ev);
        };
        
        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    // RGB slider events
    redSlider.addEventListener('input', () => {
        colorState.r = parseInt(redSlider.value);
        redValue.value = colorState.r;
        
        // Update HSV from RGB
        const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
        colorState.h = hsv.h;
        colorState.s = hsv.s;
        colorState.v = hsv.v;
        
        updateUI();
    });
    
    greenSlider.addEventListener('input', () => {
        colorState.g = parseInt(greenSlider.value);
        greenValue.value = colorState.g;
        
        // Update HSV from RGB
        const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
        colorState.h = hsv.h;
        colorState.s = hsv.s;
        colorState.v = hsv.v;
        
        updateUI();
    });
    
    blueSlider.addEventListener('input', () => {
        colorState.b = parseInt(blueSlider.value);
        blueValue.value = colorState.b;
        
        // Update HSV from RGB
        const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
        colorState.h = hsv.h;
        colorState.s = hsv.s;
        colorState.v = hsv.v;
        
        updateUI();
    });
    
    alphaSlider.addEventListener('input', () => {
        colorState.a = parseInt(alphaSlider.value);
        alphaValue.value = colorState.a;
        updateUI();
    });

    // Input field events
    redValue.addEventListener('change', () => {
        colorState.r = Math.max(0, Math.min(255, parseInt(redValue.value) || 0));
        redValue.value = colorState.r;
        
        // Update HSV from RGB
        const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
        colorState.h = hsv.h;
        colorState.s = hsv.s;
        colorState.v = hsv.v;
        
        updateUI();
    });
    
    greenValue.addEventListener('change', () => {
        colorState.g = Math.max(0, Math.min(255, parseInt(greenValue.value) || 0));
        greenValue.value = colorState.g;
        
        // Update HSV from RGB
        const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
        colorState.h = hsv.h;
        colorState.s = hsv.s;
        colorState.v = hsv.v;
        
        updateUI();
    });
    
    blueValue.addEventListener('change', () => {
        colorState.b = Math.max(0, Math.min(255, parseInt(blueValue.value) || 0));
        blueValue.value = colorState.b;
        
        // Update HSV from RGB
        const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
        colorState.h = hsv.h;
        colorState.s = hsv.s;
        colorState.v = hsv.v;
        
        updateUI();
    });
    
    alphaValue.addEventListener('change', () => {
        colorState.a = Math.max(0, Math.min(255, parseInt(alphaValue.value) || 0));
        alphaValue.value = colorState.a;
        updateUI();
    });

    // Hex input event
    hexValue.addEventListener('change', () => {
        const hex = hexValue.value.trim();
        if (/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
            const rgb = hexToRgb(hex);
            colorState.r = rgb.r;
            colorState.g = rgb.g;
            colorState.b = rgb.b;
            
            // Update HSV from RGB
            const hsv = rgbToHsv(colorState.r, colorState.g, colorState.b);
            colorState.h = hsv.h;
            colorState.s = hsv.s;
            colorState.v = hsv.v;
            
            updateUI();
        } else {
            // Reset to current color if invalid hex
            hexValue.value = rgbToHex(colorState.r, colorState.g, colorState.b);
        }
    });

    // Button events
    applyButton.addEventListener('click', () => {
        // Send updated color back to VS Code
        vscode.postMessage({
            command: 'updateColor',
            color: {
                r: colorState.r,
                g: colorState.g,
                b: colorState.b,
                a: colorState.a
            }
        });
    });
    
    closeButton.addEventListener('click', () => {
        vscode.postMessage({
            command: 'close'
        });
    });

    // Initial UI update
    updateUI();
})();