/**
 * Storage module - localStorage CRUD wrapper
 */

const Storage = {
  _prefix: 'pomodoro_',

  _key(name) {
    return this._prefix + name;
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this._key(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this._key(key), JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },

  remove(key) {
    localStorage.removeItem(this._key(key));
  },

  // --- Settings ---
  getSettings() {
    return this.get('settings', {
      theme: 'light',
      language: 'zh',
      soundEnabled: true,
      notificationEnabled: true,
      alarmDuration: 10,
    });
  },

  saveSettings(settings) {
    this.set('settings', settings);
  },

  // --- Plans ---
  getPlans() {
    return this.get('plans', []);
  },

  savePlans(plans) {
    this.set('plans', plans);
  },

  // --- Task Logs ---
  getLogs() {
    return this.get('logs', []);
  },

  saveLogs(logs) {
    this.set('logs', logs);
  },

  addLog(log) {
    const logs = this.getLogs();
    logs.unshift(log);
    this.saveLogs(logs);
    return log;
  },

  getLogsByDate(dateStr) {
    return this.getLogs().filter(l => l.date === dateStr);
  },

  getLogsByMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return this.getLogs().filter(l => l.date.startsWith(prefix));
  },

  // --- Helpers ---
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  // Clear all data (for debugging)
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this._prefix))
      .forEach(k => localStorage.removeItem(k));
  },
};
