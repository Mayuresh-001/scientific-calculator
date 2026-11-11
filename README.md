# Scientific Calculator & Grapher (SwissCalc Style)

A modern, responsive, neumorphic Scientific Calculator web application faithfully replicating the UI and all features shown in the screenshots from `swisscalcc.netlify.app`.

---

## 🌟 Key Features

### 1. **Basic Calculator Mode**
- Clean 4-column neumorphic keypad with color-coded buttons:
  - **Red (`AC`)**: All Clear
  - **Blue Operators**: `÷`, `×`, `-`, `+`
  - **Green (`=`)**: Prominent evaluation button
  - **Secondary Keys**: `⌫` (Backspace), `%` (Percentage), `±` (Sign toggle)
- Dynamic expression history & big number readout.
- Full keyboard input support (numpad, arithmetic operators, Enter, Backspace, Escape).

### 2. **Scientific Calculator Mode**
- 5-column scientific keypad above the standard keypad:
  - **Memory Registers**: `MC` (Clear), `MR` (Recall), `M+` (Add), `M-` (Subtract) with screen `M` indicator
  - **Angle Units (`DRG`)**: Seamless toggle between `DEG` (Degrees), `RAD` (Radians), and `GRAD` (Gradians)
  - **2nd Function Toggle**: Switches trigonometric and logarithmic functions:
    - `sin` $\leftrightarrow$ `sin⁻¹` (asin)
    - `cos` $\leftrightarrow$ `cos⁻¹` (acos)
    - `tan` $\leftrightarrow$ `tan⁻¹` (atan)
    - `log` $\leftrightarrow$ `10ˣ`
    - `ln` $\leftrightarrow$ `eˣ`
    - `√` $\leftrightarrow$ `∛` (cube root)
    - `x²` $\leftrightarrow$ `xʸ`
  - **Advanced Functions**: `x³` (cube), `x!` (factorial), `π`, `e`, `(`, `)`, `^` (power)

### 3. **Unit Converter Mode**
- Multi-category converter covering 10 domains:
  - **Length**: m, km, cm, mm, in, ft, yd, mi, nmi, nm
  - **Mass**: kg, g, mg, lb, oz, ton, ct
  - **Temperature**: Celsius (°C), Fahrenheit (°F), Kelvin (K)
  - **Area**: m², km², cm², mm², ft², in², acre, hectare
  - **Volume**: L, mL, m³, cm³, gal (US), qt, pt, cup, fl oz
  - **Speed**: m/s, km/h, mph, knot, ft/s
  - **Time**: s, ms, min, hr, day, week, year
  - **Digital Storage**: B, KB, MB, GB, TB, PB
  - **Pressure**: Pa, kPa, bar, psi, atm, mmHg
  - **Energy**: J, kJ, cal, kcal, Wh, kWh, eV
- Live two-way conversion as you type in either input card.
- Dedicated Swap button (`⇄`) to invert source and target units.
- On-screen touch keypad for fast mobile inputs.

### 4. **Graphing Calculator Mode**
- Interactive 2D coordinate system powered by HTML5 Canvas.
- **Multiple Functions**: Add, edit, and remove multiple functions (`f(x) = ...`) simultaneously, each rendered in distinct colors.
- **Navigation Controls**:
  - `+` / `-`: Zoom in and out
  - `←` `→` `↑` `↓`: Pan across the coordinate space
  - `↺`: Reset view to default origin
  - `T`: Open the **Table of Values** modal showing computed values across configurable start, end, and step increments.
- **Touch & Mouse Pan/Zoom**: Drag directly on canvas or use mouse wheel to zoom in on any point.
- **Coordinate Tooltip**: Hover anywhere on the graph to inspect exact `(x, y)` math coordinates.

### 5. **Calculation History Drawer**
- Slide-in side drawer accessible via the top-left clock/history icon.
- Chronological list of calculations with formulas, results, and timestamps.
- **Click-to-Recall**: Click any history card to instantly restore the calculation.
- **Persistent**: Automatically saved to `localStorage`.
- **Clear History**: Dedicated red action button to reset history.

### 6. **Theme & Neumorphic Styling**
- **Dark Theme (Default)**: Deep soft-charcoal with inset & outset shadows matching the reference photos.
- **Light Theme**: Off-white neumorphic surfaces with soft shadows and crisp contrast.
- **Theme Toggle**: Top-right sun/moon icon with smooth rotation.
- **Web Audio API**: Subtle click feedback on button interaction.

---

## 🚀 How to Run

### Option 1: Direct in Browser (No Install Needed)
Simply double-click `index.html` in Windows Explorer or open it directly in Chrome, Edge, or Firefox.

### Option 2: Local HTTP Server
Run from the project folder:
```powershell
python -m http.server 3000
```
Then open `http://localhost:3000` in your web browser.
