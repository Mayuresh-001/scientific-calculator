/**
 * 2D Function Grapher & Plotter Module
 * Handles mathematical parsing, canvas coordinate rendering, pan/zoom,
 * asymptote handling, multi-curve visualization, and table of values.
 */

class Grapher {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Viewport coordinates
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;
    
    // Functions list
    this.functions = [
      { id: 1, expr: 'x^2 * sin(x)', color: '#38bdf8' },
      { id: 2, expr: 'sin(x)', color: '#fb923c' }
    ];
    this.nextFuncId = 3;
    this.palette = ['#38bdf8', '#fb923c', '#4ade80', '#c084fc', '#facc15', '#f43f5e'];

    // Interaction states
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastPanX = 0;
    this.lastPanY = 0;

    this.initCanvas();
    this.attachEvents();
  }

  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.draw();
    });
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = (rect.width || 400) * dpr;
    this.canvas.height = (rect.height || 280) * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width || 400;
    this.displayHeight = rect.height || 280;
  }

  attachEvents() {
    // Mouse Pan & Zoom
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (this.isDragging) {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;

        this.xMin -= (dx / this.displayWidth) * xRange;
        this.xMax -= (dx / this.displayWidth) * xRange;
        this.yMin += (dy / this.displayHeight) * yRange;
        this.yMax += (dy / this.displayHeight) * yRange;

        this.draw();
      }

      this.updateTooltip(mouseX, mouseY);
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.88 : 1.14;
      this.zoomAtPoint(e.clientX, e.clientY, zoomFactor);
    }, { passive: false });

    // Touch events
    let touchStartX = 0;
    let touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;

        this.xMin -= (dx / this.displayWidth) * xRange;
        this.xMax -= (dx / this.displayWidth) * xRange;
        this.yMin += (dy / this.displayHeight) * yRange;
        this.yMax += (dy / this.displayHeight) * yRange;

        this.draw();
      }
    }, { passive: true });
  }

  zoomAtPoint(clientX, clientY, factor) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const mathX = this.xMin + (mouseX / this.displayWidth) * (this.xMax - this.xMin);
    const mathY = this.yMax - (mouseY / this.displayHeight) * (this.yMax - this.yMin);

    const newXRange = (this.xMax - this.xMin) * factor;
    const newYRange = (this.yMax - this.yMin) * factor;

    // Keep mathX, mathY under pointer
    const xRatio = mouseX / this.displayWidth;
    const yRatio = mouseY / this.displayHeight;

    this.xMin = mathX - xRatio * newXRange;
    this.xMax = mathX + (1 - xRatio) * newXRange;
    this.yMax = mathY + yRatio * newYRange;
    this.yMin = mathY - (1 - yRatio) * newYRange;

    this.draw();
  }

  updateTooltip(px, py) {
    const tooltip = document.getElementById('canvasCoords');
    if (!tooltip) return;

    if (px < 0 || px > this.displayWidth || py < 0 || py > this.displayHeight) {
      tooltip.style.display = 'none';
      return;
    }

    const mathX = this.xMin + (px / this.displayWidth) * (this.xMax - this.xMin);
    const mathY = this.yMax - (py / this.displayHeight) * (this.yMax - this.yMin);

    tooltip.style.display = 'block';
    tooltip.textContent = `x: ${mathX.toFixed(2)}, y: ${mathY.toFixed(2)}`;
  }

  // --- Toolbar Controls (+, -, arrows, reset) ---
  zoomIn() {
    this.zoom(0.8);
  }

  zoomOut() {
    this.zoom(1.25);
  }

  zoom(factor) {
    const cx = (this.xMin + this.xMax) / 2;
    const cy = (this.yMin + this.yMax) / 2;
    const halfX = ((this.xMax - this.xMin) * factor) / 2;
    const halfY = ((this.yMax - this.yMin) * factor) / 2;

    this.xMin = cx - halfX;
    this.xMax = cx + halfX;
    this.yMin = cy - halfY;
    this.yMax = cy + halfY;
    this.draw();
  }

  pan(direction) {
    const stepX = (this.xMax - this.xMin) * 0.2;
    const stepY = (this.yMax - this.yMin) * 0.2;

    if (direction === 'left') {
      this.xMin -= stepX;
      this.xMax -= stepX;
    } else if (direction === 'right') {
      this.xMin += stepX;
      this.xMax += stepX;
    } else if (direction === 'up') {
      this.yMin += stepY;
      this.yMax += stepY;
    } else if (direction === 'down') {
      this.yMin -= stepY;
      this.yMax -= stepY;
    }
    this.draw();
  }

  resetView() {
    this.xMin = -10;
    this.xMax = 10;
    this.yMin = -10;
    this.yMax = 10;
    this.draw();
  }

  // --- Function Management ---
  addFunction(expr = '') {
    const color = this.palette[this.functions.length % this.palette.length];
    const newFunc = { id: this.nextFuncId++, expr, color };
    this.functions.push(newFunc);
    return newFunc;
  }

  removeFunction(id) {
    this.functions = this.functions.filter(f => f.id !== id);
    if (this.functions.length === 0) {
      this.addFunction('');
    }
    this.draw();
  }

  updateFunctionExpr(id, expr) {
    const f = this.functions.find(fn => fn.id === id);
    if (f) {
      f.expr = expr;
    }
  }

  // --- Coordinate Mapping ---
  toPixelX(x) {
    return ((x - this.xMin) / (this.xMax - this.xMin)) * this.displayWidth;
  }

  toPixelY(y) {
    return ((this.yMax - y) / (this.yMax - this.yMin)) * this.displayHeight;
  }

  // --- Math Parsing & Evaluation ---
  compileExpression(exprStr) {
    if (!exprStr || !exprStr.trim()) return null;
    let s = exprStr.trim().toLowerCase();

    // Replacements for math functions & syntax
    s = s.replace(/\s+/g, '');
    // Insert multiplication: 2x -> 2*x, x sin(x) -> x*sin(x), )x -> )*x
    s = s.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
    s = s.replace(/(\))([a-zA-Z0-9(])/g, '$1*$2');
    s = s.replace(/(x)(sin|cos|tan|log|ln|sqrt|cbrt|abs|exp)/g, '$1*$2');

    // Powers
    s = s.replace(/\^/g, '**');

    // Trig and logs
    s = s.replace(/\bsin\b/g, 'Math.sin');
    s = s.replace(/\bcos\b/g, 'Math.cos');
    s = s.replace(/\btan\b/g, 'Math.tan');
    s = s.replace(/\basin\b/g, 'Math.asin');
    s = s.replace(/\bacos\b/g, 'Math.acos');
    s = s.replace(/\batan\b/g, 'Math.atan');
    s = s.replace(/\bsqrt\b/g, 'Math.sqrt');
    s = s.replace(/\bcbrt\b/g, 'Math.cbrt');
    s = s.replace(/\blog\b/g, 'Math.log10');
    s = s.replace(/\bln\b/g, 'Math.log');
    s = s.replace(/\babs\b/g, 'Math.abs');
    s = s.replace(/\bexp\b/g, 'Math.exp');
    s = s.replace(/\bpi\b/g, 'Math.PI');
    s = s.replace(/\be\b/g, 'Math.E');

    try {
      // Return compiled lambda function
      // eslint-disable-next-line no-new-func
      const fn = new Function('x', `"use strict"; return (${s});`);
      // Test execution with x = 1 to verify syntax
      fn(1);
      return fn;
    } catch (e) {
      return null;
    }
  }

  // --- Grid & Axis Rendering ---
  calculateStep(range) {
    const rawStep = range / 8;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step;
    if (residual > 5) step = 10 * magnitude;
    else if (residual > 2) step = 5 * magnitude;
    else if (residual > 1) step = 2 * magnitude;
    else step = magnitude;
    return step;
  }

  draw() {
    this.resizeCanvas();
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Compute steps for grid ticks
    const xStep = this.calculateStep(this.xMax - this.xMin);
    const yStep = this.calculateStep(this.yMax - this.yMin);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)';
    const axisColor = isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.35)';
    const textColor = isLight ? '#64748b' : '#9ca3af';

    // Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Vertical grid lines
    const startX = Math.floor(this.xMin / xStep) * xStep;
    for (let x = startX; x <= this.xMax; x += xStep) {
      const px = this.toPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();

      // Tick number
      if (Math.abs(x) > 1e-6) {
        const originY = this.toPixelY(0);
        const textY = Math.min(Math.max(originY + 4, 12), h - 16);
        ctx.fillText(parseFloat(x.toPrecision(6)), px, textY);
      }
    }

    // Horizontal grid lines
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const startY = Math.floor(this.yMin / yStep) * yStep;
    for (let y = startY; y <= this.yMax; y += yStep) {
      const py = this.toPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();

      // Tick number
      if (Math.abs(y) > 1e-6) {
        const originX = this.toPixelX(0);
        const textX = Math.min(Math.max(originX - 6, 26), w - 4);
        ctx.fillText(parseFloat(y.toPrecision(6)), textX, py);
      }
    }

    // Main Axes (X=0 and Y=0)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = axisColor;

    const originX = this.toPixelX(0);
    const originY = this.toPixelY(0);

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.stroke();

    // Origin label "0"
    if (originX >= 0 && originX <= w && originY >= 0 && originY <= h) {
      ctx.fillText('0', originX - 5, originY + 10);
    }

    // Plot Functions
    this.functions.forEach(f => {
      if (!f.expr.trim()) return;
      const fn = this.compileExpression(f.expr);
      if (!fn) return;

      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const numSamples = w * 2;
      let isFirstPoint = true;
      let prevY = null;

      for (let i = 0; i <= numSamples; i++) {
        const px = (i / numSamples) * w;
        const x = this.xMin + (px / w) * (this.xMax - this.xMin);

        try {
          const y = fn(x);
          if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
            isFirstPoint = true;
            prevY = null;
            continue;
          }

          const py = this.toPixelY(y);

          // Asymptote detection: don't connect points with huge vertical jumps
          if (prevY !== null && Math.abs(py - prevY) > h * 0.8) {
            isFirstPoint = true;
          }

          if (isFirstPoint) {
            ctx.moveTo(px, py);
            isFirstPoint = false;
          } else {
            ctx.lineTo(px, py);
          }
          prevY = py;
        } catch (e) {
          isFirstPoint = true;
          prevY = null;
        }
      }

      ctx.stroke();
      ctx.restore();
    });
  }

  // --- Table of Values ('T' Button) ---
  generateTableData(xStart = -5, xEnd = 5, step = 1) {
    const compiled = this.functions.map(f => ({
      color: f.color,
      expr: f.expr,
      fn: this.compileExpression(f.expr)
    })).filter(f => f.fn !== null);

    const rows = [];
    for (let x = xStart; x <= xEnd + 1e-9; x += step) {
      const row = { x: parseFloat(x.toFixed(4)), values: [] };
      compiled.forEach(item => {
        try {
          const y = item.fn(row.x);
          if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
            row.values.push(parseFloat(y.toFixed(4)));
          } else {
            row.values.push('Undefined');
          }
        } catch (e) {
          row.values.push('Error');
        }
      });
      rows.push(row);
    }

    return { functions: compiled, rows };
  }
}

window.Grapher = Grapher;
