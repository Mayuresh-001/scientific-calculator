/**
 * Main Application Coordinator
 * Binds DOM interactions, audio feedback, theme switching, tab navigation,
 * keyboard shortcuts, and delegates to the specialized modules.
 */

function initApp() {
  // Safe Storage Helpers
  function getSafeStorage(key, fallback) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || fallback;
      }
    } catch (e) {}
    return fallback;
  }

  function setSafeStorage(key, val) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, val);
      }
    } catch (e) {}
  }

  // --- Initialize Core Modules ---
  const historyMgr = new HistoryManager();
  const calc = new CalculatorEngine();
  const unitConv = new UnitConverter();
  let grapher = null;

  // --- Audio Feedback (Web Audio API - initialized lazily on user gesture) ---
  let audioCtx = null;
  function playClickSound(freq = 600, duration = 0.02) {
    try {
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      }
    } catch (e) {
      // Audio autoplay policy or device without audio
    }
  }

  // --- Theme Toggling (Dark / Light) ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  function initTheme() {
    const savedTheme = getSafeStorage('swisscalc_theme', 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
  }

  function updateThemeIcons(theme) {
    if (!sunIcon || !moonIcon) return;
    if (theme === 'light') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      playClickSound(800, 0.03);
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      setSafeStorage('swisscalc_theme', newTheme);
      updateThemeIcons(newTheme);
      if (grapher) grapher.draw();
    });
  }

  initTheme();

  // --- Calculator Screen Elements ---
  const displayValEl = document.getElementById('displayValue');
  const displayExpEl = document.getElementById('displayExpression');
  const angleModeEl = document.getElementById('angleModeIndicator');
  const memoryIndicatorEl = document.getElementById('memoryIndicator');
  const secondIndicatorEl = document.getElementById('secondIndicator');

  // --- Scientific 2nd Function Key Labels ---
  const btnSin = document.getElementById('btnSin');
  const btnCos = document.getElementById('btnCos');
  const btnTan = document.getElementById('btnTan');
  const btnLog = document.getElementById('btnLog');
  const btnLn = document.getElementById('btnLn');
  const btnSqrt = document.getElementById('btnSqrt');
  const btnSquare = document.getElementById('btnSquare');
  const btn2nd = document.getElementById('btn2nd');

  function update2ndLabels(is2nd) {
    if (btn2nd) {
      if (is2nd) btn2nd.classList.add('btn-active-highlight');
      else btn2nd.classList.remove('btn-active-highlight');
    }
    if (btnSin) btnSin.textContent = is2nd ? 'sin⁻¹' : 'sin';
    if (btnCos) btnCos.textContent = is2nd ? 'cos⁻¹' : 'cos';
    if (btnTan) btnTan.textContent = is2nd ? 'tan⁻¹' : 'tan';
    if (btnLog) btnLog.textContent = is2nd ? '10ˣ' : 'log';
    if (btnLn) btnLn.textContent = is2nd ? 'eˣ' : 'ln';
    if (btnSqrt) btnSqrt.textContent = is2nd ? '∛' : '√';
    if (btnSquare) btnSquare.textContent = is2nd ? 'xʸ' : 'x²';
  }

  // Link Calculator Engine callbacks
  calc.init(
    (state) => {
      if (displayValEl) displayValEl.textContent = state.value;
      if (displayExpEl) displayExpEl.textContent = state.expression;
      if (angleModeEl) angleModeEl.textContent = state.angleMode;
      if (memoryIndicatorEl) memoryIndicatorEl.style.display = state.hasMemory ? 'inline-block' : 'none';
      if (secondIndicatorEl) secondIndicatorEl.style.display = state.is2nd ? 'inline-block' : 'none';

      update2ndLabels(state.is2nd);
    },
    (entry) => {
      historyMgr.addEntry(entry);
    }
  );

  if (angleModeEl) {
    angleModeEl.addEventListener('click', () => {
      playClickSound(700, 0.02);
      calc.toggleAngleMode();
    });
  }

  // --- Tabs Navigation (Basic, Scientific, Unit, Graph) ---
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const viewPanels = {
    basic: document.getElementById('viewBasic'),
    scientific: document.getElementById('viewScientific'),
    unit: document.getElementById('viewUnit'),
    graph: document.getElementById('viewGraph')
  };

  const calculatorDisplay = document.getElementById('calculatorDisplay');

  function switchTab(targetTab) {
    tabButtons.forEach(btn => {
      if (btn.dataset.tab === targetTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    Object.keys(viewPanels).forEach(key => {
      if (viewPanels[key]) {
        if (key === targetTab) {
          viewPanels[key].classList.add('active');
        } else {
          viewPanels[key].classList.remove('active');
        }
      }
    });

    if (calculatorDisplay) {
      if (targetTab === 'basic' || targetTab === 'scientific') {
        calculatorDisplay.style.display = 'flex';
      } else {
        calculatorDisplay.style.display = 'none';
      }
    }

    if (targetTab === 'graph') {
      if (!grapher) {
        initGrapher();
      } else {
        setTimeout(() => { grapher.draw(); }, 60);
      }
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound(550, 0.02);
      switchTab(btn.dataset.tab);
    });
  });

  // --- Keypad Buttons Event Delegation (Basic & Scientific) ---
  document.querySelectorAll('[data-calc-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playClickSound(500, 0.02);
      const action = btn.getAttribute('data-calc-action');
      const val = btn.getAttribute('data-val');

      switch (action) {
        case 'digit':
          calc.inputDigit(val);
          break;
        case 'decimal':
          calc.inputDecimal();
          break;
        case 'operator':
          calc.inputOperator(val);
          break;
        case 'percent':
          calc.inputPercent();
          break;
        case 'backspace':
          calc.inputBackspace();
          break;
        case 'clear':
          calc.clearAll();
          break;
        case 'equal':
          calc.calculate();
          break;
        case 'sign':
          calc.toggleSign();
          break;
        case 'paren':
          calc.inputParenthesis(val);
          break;
        case 'sci':
          calc.applyScientificFunction(val);
          break;
        case '2nd':
          calc.toggle2nd();
          break;
        case 'drg':
          calc.toggleAngleMode();
          break;
        case 'mc':
          calc.memoryClear();
          break;
        case 'mr':
          calc.memoryRecall();
          break;
        case 'm+':
          calc.memoryAdd();
          break;
        case 'm-':
          calc.memorySubtract();
          break;
      }
    });
  });

  // --- Unit Converter Bindings (Image 2) ---
  const unitCategorySelect = document.getElementById('unitCategorySelect');
  const unitPicker1 = document.getElementById('unitPicker1');
  const unitPicker2 = document.getElementById('unitPicker2');
  const unitInput1 = document.getElementById('unitInput1');
  const unitInput2 = document.getElementById('unitInput2');
  const unitSwapBtn = document.getElementById('unitSwapBtn');

  function populateUnitDropdowns() {
    if (!unitPicker1 || !unitPicker2) return;
    const units = unitConv.getUnitsForCurrentCategory();
    unitPicker1.innerHTML = '';
    unitPicker2.innerHTML = '';

    Object.keys(units).forEach(key => {
      const opt1 = document.createElement('option');
      opt1.value = key;
      opt1.textContent = units[key].name || key;
      if (key === unitConv.unit1) opt1.selected = true;
      unitPicker1.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = key;
      opt2.textContent = units[key].name || key;
      if (key === unitConv.unit2) opt2.selected = true;
      unitPicker2.appendChild(opt2);
    });

    if (unitInput1) unitInput1.value = unitConv.value1;
    if (unitInput2) unitInput2.value = unitConv.value2;
  }

  if (unitCategorySelect) {
    unitCategorySelect.addEventListener('change', (e) => {
      playClickSound(650, 0.02);
      unitConv.setCategory(e.target.value);
      populateUnitDropdowns();
    });
  }

  if (unitPicker1) {
    unitPicker1.addEventListener('change', (e) => {
      unitConv.setUnit(1, e.target.value);
      if (unitInput1) unitInput1.value = unitConv.value1;
      if (unitInput2) unitInput2.value = unitConv.value2;
    });
  }

  if (unitPicker2) {
    unitPicker2.addEventListener('change', (e) => {
      unitConv.setUnit(2, e.target.value);
      if (unitInput1) unitInput1.value = unitConv.value1;
      if (unitInput2) unitInput2.value = unitConv.value2;
    });
  }

  if (unitSwapBtn) {
    unitSwapBtn.addEventListener('click', () => {
      playClickSound(750, 0.03);
      unitConv.swapUnits();
      if (unitPicker1) unitPicker1.value = unitConv.unit1;
      if (unitPicker2) unitPicker2.value = unitConv.unit2;
      if (unitInput1) unitInput1.value = unitConv.value1;
      if (unitInput2) unitInput2.value = unitConv.value2;
    });
  }

  if (unitInput1) {
    unitInput1.addEventListener('input', (e) => {
      unitConv.setValue(1, e.target.value);
      if (unitInput2) unitInput2.value = unitConv.value2;
    });
    unitInput1.addEventListener('focus', () => {
      unitConv.activeInputIndex = 1;
    });
  }

  if (unitInput2) {
    unitInput2.addEventListener('input', (e) => {
      unitConv.setValue(2, e.target.value);
      if (unitInput1) unitInput1.value = unitConv.value1;
    });
    unitInput2.addEventListener('focus', () => {
      unitConv.activeInputIndex = 2;
    });
  }

  document.querySelectorAll('[data-unit-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      playClickSound(500, 0.02);
      const action = btn.getAttribute('data-unit-action');
      const val = btn.getAttribute('data-val');

      if (action === 'digit') {
        unitConv.inputDigit(val);
      } else if (action === 'decimal') {
        unitConv.inputDecimal();
      } else if (action === 'backspace') {
        unitConv.inputBackspace();
      } else if (action === 'clear') {
        unitConv.clear();
      }
      if (unitInput1) unitInput1.value = unitConv.value1;
      if (unitInput2) unitInput2.value = unitConv.value2;
    });
  });

  populateUnitDropdowns();

  // --- Grapher Initialization ---
  function initGrapher() {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    grapher = new Grapher('graphCanvas');

    const graphFuncsList = document.getElementById('graphFunctionsList');
    const btnAddFunction = document.getElementById('btnAddFunction');
    const btnPlot = document.getElementById('btnPlot');

    function renderGraphFunctionInputs() {
      if (!graphFuncsList) return;
      graphFuncsList.innerHTML = '';
      grapher.functions.forEach((f) => {
        const row = document.createElement('div');
        row.className = 'graph-func-row';

        const label = document.createElement('span');
        label.className = 'func-label';
        label.style.color = f.color;
        label.textContent = 'f(x) = ';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'func-input';
        input.placeholder = 'e.g., x^2 * sin(x)';
        input.value = f.expr;
        input.addEventListener('input', (e) => {
          grapher.updateFunctionExpr(f.id, e.target.value);
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            grapher.draw();
          }
        });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'func-remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove function';
        removeBtn.addEventListener('click', () => {
          playClickSound(400, 0.02);
          grapher.removeFunction(f.id);
          renderGraphFunctionInputs();
        });

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(removeBtn);
        graphFuncsList.appendChild(row);
      });
    }

    if (btnAddFunction) {
      btnAddFunction.addEventListener('click', () => {
        playClickSound(650, 0.02);
        grapher.addFunction('');
        renderGraphFunctionInputs();
        const allInputs = graphFuncsList.querySelectorAll('.func-input');
        if (allInputs.length > 0) {
          allInputs[allInputs.length - 1].focus();
        }
      });
    }

    if (btnPlot) {
      btnPlot.addEventListener('click', () => {
        playClickSound(700, 0.03);
        grapher.draw();
      });
    }

    // Graph toolbar
    const bindBtn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    bindBtn('graphZoomIn', () => { playClickSound(600, 0.02); grapher.zoomIn(); });
    bindBtn('graphZoomOut', () => { playClickSound(550, 0.02); grapher.zoomOut(); });
    bindBtn('graphPanLeft', () => { playClickSound(500, 0.02); grapher.pan('left'); });
    bindBtn('graphPanRight', () => { playClickSound(500, 0.02); grapher.pan('right'); });
    bindBtn('graphPanUp', () => { playClickSound(500, 0.02); grapher.pan('up'); });
    bindBtn('graphPanDown', () => { playClickSound(500, 0.02); grapher.pan('down'); });
    bindBtn('graphReset', () => { playClickSound(650, 0.03); grapher.resetView(); });

    renderGraphFunctionInputs();
    setTimeout(() => { grapher.draw(); }, 60);

    // Table of Values
    const graphTableBtn = document.getElementById('graphTableBtn');
    const tableModalOverlay = document.getElementById('tableModalOverlay');
    const tableModalClose = document.getElementById('tableModalClose');
    const valuesTableHead = document.getElementById('valuesTableHead');
    const valuesTableBody = document.getElementById('valuesTableBody');
    const tableStartInput = document.getElementById('tableStart');
    const tableEndInput = document.getElementById('tableEnd');
    const tableStepInput = document.getElementById('tableStep');

    function openTableModal() {
      renderTableOfValues();
      if (tableModalOverlay) tableModalOverlay.classList.add('open');
    }

    function closeTableModal() {
      if (tableModalOverlay) tableModalOverlay.classList.remove('open');
    }

    function renderTableOfValues() {
      if (!valuesTableHead || !valuesTableBody) return;
      const start = parseFloat(tableStartInput?.value) || -5;
      const end = parseFloat(tableEndInput?.value) || 5;
      const step = parseFloat(tableStepInput?.value) || 1;

      const data = grapher.generateTableData(start, end, Math.max(step, 0.1));

      valuesTableHead.innerHTML = '';
      const trHead = document.createElement('tr');
      const thX = document.createElement('th');
      thX.textContent = 'x';
      trHead.appendChild(thX);

      data.functions.forEach((f, idx) => {
        const thF = document.createElement('th');
        thF.style.color = f.color;
        thF.textContent = `f${idx + 1}(x)`;
        trHead.appendChild(thF);
      });
      valuesTableHead.appendChild(trHead);

      valuesTableBody.innerHTML = '';
      data.rows.forEach(row => {
        const tr = document.createElement('tr');
        const tdX = document.createElement('td');
        tdX.textContent = row.x;
        tdX.style.fontWeight = '600';
        tr.appendChild(tdX);

        row.values.forEach(v => {
          const tdV = document.createElement('td');
          tdV.textContent = v;
          tr.appendChild(tdV);
        });
        valuesTableBody.appendChild(tr);
      });
    }

    if (graphTableBtn) {
      graphTableBtn.addEventListener('click', () => {
        playClickSound(650, 0.02);
        openTableModal();
      });
    }

    if (tableModalClose) tableModalClose.addEventListener('click', closeTableModal);
    if (tableModalOverlay) {
      tableModalOverlay.addEventListener('click', (e) => {
        if (e.target === tableModalOverlay) closeTableModal();
      });
    }

    [tableStartInput, tableEndInput, tableStepInput].forEach(inp => {
      if (inp) inp.addEventListener('change', renderTableOfValues);
    });
  }

  // --- Calculation History Drawer ---
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyDrawerOverlay = document.getElementById('historyDrawerOverlay');
  const historyDrawer = document.getElementById('historyDrawer');
  const historyCloseBtn = document.getElementById('historyCloseBtn');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  function openHistoryDrawer() {
    if (historyDrawerOverlay) historyDrawerOverlay.classList.add('open');
    if (historyDrawer) historyDrawer.classList.add('open');
  }

  function closeHistoryDrawer() {
    if (historyDrawerOverlay) historyDrawerOverlay.classList.remove('open');
    if (historyDrawer) historyDrawer.classList.remove('open');
  }

  if (historyToggleBtn) {
    historyToggleBtn.addEventListener('click', () => {
      playClickSound(600, 0.02);
      openHistoryDrawer();
    });
  }

  if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistoryDrawer);
  if (historyDrawerOverlay) historyDrawerOverlay.addEventListener('click', closeHistoryDrawer);

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      playClickSound(400, 0.04);
      historyMgr.clearAll();
    });
  }

  function renderHistory(items) {
    if (!historyList) return;
    historyList.innerHTML = '';
    if (items.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'history-empty-message';
      emptyMsg.textContent = 'No history yet.';
      historyList.appendChild(emptyMsg);
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-item-exp">${item.expression}</div>
        <div class="history-item-res">${item.result}</div>
        <div class="history-item-time">${item.timestamp}</div>
      `;
      card.addEventListener('click', () => {
        playClickSound(600, 0.02);
        calc.loadFromHistory(item);
        closeHistoryDrawer();
        switchTab('basic');
      });
      historyList.appendChild(card);
    });
  }

  historyMgr.init(renderHistory);

  // --- Keyboard Shortcuts Support ---
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'select') return;

    if (e.key >= '0' && e.key <= '9') {
      calc.inputDigit(e.key);
      playClickSound(500, 0.02);
    } else if (e.key === '.') {
      calc.inputDecimal();
      playClickSound(500, 0.02);
    } else if (e.key === '+' || e.key === '-') {
      calc.inputOperator(e.key);
      playClickSound(550, 0.02);
    } else if (e.key === '*') {
      calc.inputOperator('×');
      playClickSound(550, 0.02);
    } else if (e.key === '/') {
      e.preventDefault();
      calc.inputOperator('÷');
      playClickSound(550, 0.02);
    } else if (e.key === '%') {
      calc.inputPercent();
      playClickSound(550, 0.02);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calc.calculate();
      playClickSound(700, 0.03);
    } else if (e.key === 'Backspace') {
      calc.inputBackspace();
      playClickSound(450, 0.02);
    } else if (e.key === 'Escape') {
      calc.clearAll();
      playClickSound(400, 0.03);
    } else if (e.key === '(' || e.key === ')') {
      calc.inputParenthesis(e.key);
      playClickSound(550, 0.02);
    }
  });

  console.log('SwissCalc Scientific Calculator initialized successfully.');
}

// Immediate execution if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
