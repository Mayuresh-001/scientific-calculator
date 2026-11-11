/**
 * Scientific Calculator Engine
 * Handles precision arithmetic, chaining operators, parentheses,
 * scientific & trig functions (DEG/RAD/GRAD), memory registers, and 2nd function.
 */

class CalculatorEngine {
  constructor() {
    this.currentInput = '0';
    this.previousInput = null;
    this.operator = null;
    this.waitingForOperand = false;
    this.expression = '';
    this.angleMode = 'DEG'; // 'DEG', 'RAD', 'GRAD'
    this.is2nd = false;
    this.memory = 0;
    this.hasEvaluated = false;
    this.parenStack = [];
    this.onDisplayUpdate = null;
    this.onHistoryAdd = null;
  }

  init(updateCallback, historyCallback) {
    this.onDisplayUpdate = updateCallback;
    this.onHistoryAdd = historyCallback;
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.onDisplayUpdate) {
      this.onDisplayUpdate({
        value: this.formatNumber(this.currentInput),
        rawInput: this.currentInput,
        expression: this.expression,
        angleMode: this.angleMode,
        is2nd: this.is2nd,
        hasMemory: this.memory !== 0
      });
    }
  }

  formatNumber(valStr) {
    if (valStr === undefined || valStr === null) return '0';
    valStr = String(valStr);
    if (valStr === 'Error' || valStr === 'Infinity' || valStr === '-Infinity' || valStr === 'NaN') {
      return valStr;
    }
    // Don't format if ending with decimal point or user is typing zeros after dot
    if (valStr.endsWith('.') || (valStr.includes('.') && valStr.endsWith('0'))) {
      return valStr;
    }
    const num = parseFloat(valStr);
    if (isNaN(num)) return valStr;

    // Exponential notation for very large/small numbers
    if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-7 && num !== 0)) {
      return num.toExponential(6);
    }

    // Clean precision
    const rounded = parseFloat(num.toPrecision(12));
    const parts = rounded.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  // --- Input Digits & Decimal ---
  inputDigit(digit) {
    if (this.hasEvaluated || this.currentInput === 'Error') {
      this.currentInput = String(digit);
      this.expression = '';
      this.hasEvaluated = false;
      this.waitingForOperand = false;
    } else if (this.waitingForOperand) {
      this.currentInput = String(digit);
      this.waitingForOperand = false;
    } else {
      if (this.currentInput === '0') {
        this.currentInput = String(digit);
      } else {
        this.currentInput += String(digit);
      }
    }
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.hasEvaluated || this.waitingForOperand || this.currentInput === 'Error') {
      this.currentInput = '0.';
      this.waitingForOperand = false;
      this.hasEvaluated = false;
    } else if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
    }
    this.updateDisplay();
  }

  inputBackspace() {
    if (this.hasEvaluated || this.currentInput === 'Error') {
      this.expression = '';
      this.currentInput = '0';
      this.hasEvaluated = false;
      this.waitingForOperand = false;
    } else if (!this.waitingForOperand) {
      if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
        if (this.currentInput === '-' || this.currentInput === '') {
          this.currentInput = '0';
        }
      } else {
        this.currentInput = '0';
      }
    }
    this.updateDisplay();
  }

  clearAll() {
    this.currentInput = '0';
    this.previousInput = null;
    this.operator = null;
    this.waitingForOperand = false;
    this.expression = '';
    this.hasEvaluated = false;
    this.parenStack = [];
    this.updateDisplay();
  }

  toggleSign() {
    if (this.currentInput === '0' || this.currentInput === 'Error') return;
    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
    this.updateDisplay();
  }

  // --- Operators (+, -, ×, ÷, ^) ---
  inputOperator(nextOp) {
    const symbolMap = { '+': '+', '-': '-', '×': '×', '*': '×', '÷': '÷', '/': '÷', '^': '^' };
    const displayOp = symbolMap[nextOp] || nextOp;
    const inputValue = parseFloat(this.currentInput);

    if (this.operator && this.waitingForOperand) {
      // Just change operator if already waiting
      this.operator = displayOp;
      this.expression = `${this.formatNumber(this.previousInput)} ${displayOp}`;
      this.updateDisplay();
      return;
    }

    if (this.previousInput === null || this.hasEvaluated) {
      this.previousInput = inputValue;
    } else if (this.operator) {
      const result = this.executeOperation(this.previousInput, this.operator, inputValue);
      if (result === 'Error') {
        this.currentInput = 'Error';
        this.previousInput = null;
        this.operator = null;
        this.expression = '';
        this.updateDisplay();
        return;
      }
      this.currentInput = String(result);
      this.previousInput = result;
    }

    this.operator = displayOp;
    this.waitingForOperand = true;
    this.hasEvaluated = false;
    this.expression = `${this.formatNumber(this.previousInput)} ${displayOp}`;
    this.updateDisplay();
  }

  executeOperation(a, op, b) {
    let res = 0;
    switch (op) {
      case '+':
        res = a + b;
        break;
      case '-':
        res = a - b;
        break;
      case '×':
        res = a * b;
        break;
      case '÷':
        if (b === 0) return 'Error';
        res = a / b;
        break;
      case '^':
        res = Math.pow(a, b);
        break;
      default:
        return b;
    }
    return parseFloat(res.toPrecision(12));
  }

  inputPercent() {
    const val = parseFloat(this.currentInput);
    if (isNaN(val)) return;

    if (this.previousInput !== null && (this.operator === '+' || this.operator === '-')) {
      // Percentage of previous input (e.g., 200 + 10% = 200 + 20)
      const pct = (this.previousInput * val) / 100;
      this.currentInput = String(pct);
    } else {
      this.currentInput = String(val / 100);
    }
    this.updateDisplay();
  }

  // --- Parentheses ---
  inputParenthesis(p) {
    if (p === '(') {
      if (this.operator) {
        this.parenStack.push({ prev: this.previousInput, op: this.operator, expr: this.expression });
        this.previousInput = null;
        this.operator = null;
        this.expression += ' (';
      } else {
        this.parenStack.push({ prev: null, op: null, expr: '(' });
        this.expression = '(';
      }
      this.currentInput = '0';
      this.waitingForOperand = false;
    } else if (p === ')' && this.parenStack.length > 0) {
      this.calculateIntermediate();
      const frame = this.parenStack.pop();
      const innerVal = parseFloat(this.currentInput);
      if (frame.op) {
        this.previousInput = frame.prev;
        this.operator = frame.op;
        this.expression = `${frame.expr} ${this.formatNumber(innerVal)})`;
      } else {
        this.expression = `(${this.formatNumber(innerVal)})`;
      }
      this.waitingForOperand = true;
    }
    this.updateDisplay();
  }

  calculateIntermediate() {
    if (this.operator && this.previousInput !== null) {
      const b = parseFloat(this.currentInput);
      const res = this.executeOperation(this.previousInput, this.operator, b);
      this.currentInput = String(res);
      this.previousInput = null;
      this.operator = null;
    }
  }

  // --- Angle Modes ---
  toggleAngleMode() {
    if (this.angleMode === 'DEG') this.angleMode = 'RAD';
    else if (this.angleMode === 'RAD') this.angleMode = 'GRAD';
    else this.angleMode = 'DEG';
    this.updateDisplay();
  }

  toRadians(val) {
    if (this.angleMode === 'DEG') return (val * Math.PI) / 180;
    if (this.angleMode === 'GRAD') return (val * Math.PI) / 200;
    return val;
  }

  fromRadians(val) {
    if (this.angleMode === 'DEG') return (val * 180) / Math.PI;
    if (this.angleMode === 'GRAD') return (val * 200) / Math.PI;
    return val;
  }

  toggle2nd() {
    this.is2nd = !this.is2nd;
    this.updateDisplay();
  }

  // --- Scientific Operations ---
  applyScientificFunction(fn) {
    const x = parseFloat(this.currentInput);
    if (isNaN(x)) return;
    let res = 0;

    switch (fn) {
      case 'sin':
        res = this.is2nd ? this.fromRadians(Math.asin(x)) : Math.sin(this.toRadians(x));
        break;
      case 'cos':
        res = this.is2nd ? this.fromRadians(Math.acos(x)) : Math.cos(this.toRadians(x));
        break;
      case 'tan':
        res = this.is2nd ? this.fromRadians(Math.atan(x)) : Math.tan(this.toRadians(x));
        break;
      case 'log':
        res = this.is2nd ? Math.pow(10, x) : Math.log10(x);
        break;
      case 'ln':
        res = this.is2nd ? Math.exp(x) : Math.log(x);
        break;
      case 'sqrt':
        res = this.is2nd ? Math.cbrt(x) : (x >= 0 ? Math.sqrt(x) : 'Error');
        break;
      case 'square':
        res = this.is2nd ? Math.pow(x, 3) : Math.pow(x, 2);
        break;
      case 'cube':
        res = Math.pow(x, 3);
        break;
      case 'factorial':
        res = this.factorial(x);
        break;
      case 'pi':
        res = Math.PI;
        break;
      case 'e':
        res = Math.E;
        break;
      case 'inv':
        res = x !== 0 ? 1 / x : 'Error';
        break;
      case 'pow':
        this.inputOperator('^');
        return;
      default:
        return;
    }

    if (typeof res === 'number') {
      if (isNaN(res) || !isFinite(res)) res = 'Error';
      else if (Math.abs(res) < 1e-15) res = 0;
      else res = parseFloat(res.toPrecision(12));
    }

    this.currentInput = String(res);
    this.waitingForOperand = true;
    this.hasEvaluated = true;
    this.updateDisplay();
  }

  factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return 'Error';
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  // --- Memory ---
  memoryClear() {
    this.memory = 0;
    this.updateDisplay();
  }

  memoryRecall() {
    this.currentInput = String(this.memory);
    this.waitingForOperand = true;
    this.updateDisplay();
  }

  memoryAdd() {
    const val = parseFloat(this.currentInput);
    if (!isNaN(val)) {
      this.memory += val;
      this.waitingForOperand = true;
      this.updateDisplay();
    }
  }

  memorySubtract() {
    const val = parseFloat(this.currentInput);
    if (!isNaN(val)) {
      this.memory -= val;
      this.waitingForOperand = true;
      this.updateDisplay();
    }
  }

  // --- Calculate (=) ---
  calculate() {
    if (this.currentInput === 'Error') {
      this.clearAll();
      return;
    }

    // Resolve any remaining open parentheses
    while (this.parenStack.length > 0) {
      this.calculateIntermediate();
      const frame = this.parenStack.pop();
      const innerVal = parseFloat(this.currentInput);
      if (frame.op) {
        this.previousInput = frame.prev;
        this.operator = frame.op;
      }
    }

    if (this.operator && this.previousInput !== null) {
      const b = parseFloat(this.currentInput);
      const historyExpr = `${this.formatNumber(this.previousInput)} ${this.operator} ${this.formatNumber(this.currentInput)}`;
      const result = this.executeOperation(this.previousInput, this.operator, b);

      if (result === 'Error') {
        this.currentInput = 'Error';
        this.expression = `${historyExpr} =`;
      } else {
        const formattedResult = String(result);
        this.expression = `${historyExpr} =`;
        this.currentInput = formattedResult;

        if (this.onHistoryAdd) {
          this.onHistoryAdd({
            expression: historyExpr,
            result: formattedResult,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }

      this.previousInput = null;
      this.operator = null;
      this.waitingForOperand = true;
      this.hasEvaluated = true;
    }

    this.updateDisplay();
  }

  loadFromHistory(item) {
    this.currentInput = item.result;
    this.expression = `${item.expression} =`;
    this.previousInput = null;
    this.operator = null;
    this.waitingForOperand = true;
    this.hasEvaluated = true;
    this.updateDisplay();
  }
}

window.CalculatorEngine = CalculatorEngine;
