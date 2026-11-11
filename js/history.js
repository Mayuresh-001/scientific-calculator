/**
 * History Manager Module
 * Manages calculation history, persistent storage in localStorage with in-memory fallback.
 */

class HistoryManager {
  constructor(storageKey = 'swisscalc_history') {
    this.storageKey = storageKey;
    this.history = this.load();
    this.onHistoryChange = null;
  }

  init(onChangeCallback) {
    this.onHistoryChange = onChangeCallback;
    this.notify();
  }

  load() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
      }
    } catch (e) {
      // localStorage may throw SecurityError in restricted iframes
    }
    return [];
  }

  save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.history));
      }
    } catch (e) {
      // Ignore if localStorage unavailable
    }
  }

  addEntry(item) {
    if (this.history.length > 0) {
      const last = this.history[0];
      if (last.expression === item.expression && last.result === item.result) {
        return;
      }
    }
    this.history.unshift({
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      expression: item.expression,
      result: item.result,
      timestamp: item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (this.history.length > 50) {
      this.history.pop();
    }

    this.save();
    this.notify();
  }

  clearAll() {
    this.history = [];
    this.save();
    this.notify();
  }

  notify() {
    if (this.onHistoryChange) {
      this.onHistoryChange(this.history);
    }
  }
}

window.HistoryManager = HistoryManager;
