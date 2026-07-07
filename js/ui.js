/**
 * UI module - DOM manipulation, rendering, view switching
 */

const UI = {
  // --- Init ---
  init() {
    this._bindEvents();
    this._renderPresets();
    this._renderPlans();
    this._applySettings();
    this._updateTimerDisplay(0, 0, 'work');
    this._updateSessionStats();
    this._requestNotificationPermission();
  },

  // --- Event Binding ---
  _bindEvents() {
    // Menu button
    document.getElementById('btn-menu').addEventListener('click', () => this._toggleSidePanel());

    // Settings
    document.getElementById('btn-settings').addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleSettings();
    });
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('settings-dropdown');
      const btn = document.getElementById('btn-settings');
      if (dropdown && btn && !dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Theme toggle
    document.getElementById('toggle-theme').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.theme = e.target.checked ? 'dark' : 'light';
      Storage.saveSettings(settings);
      this._applyTheme();
    });

    // Language toggle
    document.getElementById('toggle-lang').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.language = e.target.checked ? 'en' : 'zh';
      Storage.saveSettings(settings);
      applyI18n();
      this._renderPresets();
      this._renderPlans();
      Calendar.render();
      this._updateTimerDisplay(Timer.remainingSeconds, Timer.totalSeconds, Timer.mode);
      this._updateSessionStats();
    });

    // Sound toggle
    document.getElementById('toggle-sound').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.soundEnabled = e.target.checked;
      Storage.saveSettings(settings);
    });

    // Notification toggle
    document.getElementById('toggle-notification').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.notificationEnabled = e.target.checked;
      Storage.saveSettings(settings);
      if (e.target.checked) this._requestNotificationPermission();
    });

    // Timer controls
    document.getElementById('btn-start').addEventListener('click', () => this._handleStart());
    document.getElementById('btn-pause').addEventListener('click', () => Timer.pause());
    document.getElementById('btn-stop').addEventListener('click', () => Timer.stop());

    // Task log
    document.getElementById('btn-save-log').addEventListener('click', () => this._saveTaskLog());
    document.getElementById('btn-skip-log').addEventListener('click', () => this._skipTaskLog());
    document.getElementById('task-log-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._saveTaskLog();
      }
    });

    // Side panel
    document.getElementById('btn-close-panel').addEventListener('click', () => this._closeSidePanel());
    document.getElementById('overlay').addEventListener('click', () => {
      this._closeSidePanel();
      this._hideTaskLogModal();
    });

    // Plan editor
    document.getElementById('btn-new-plan').addEventListener('click', () => this._showPlanEditor());
    document.getElementById('btn-cancel-plan').addEventListener('click', () => this._hidePlanEditor());
    document.getElementById('btn-save-plan').addEventListener('click', () => this._savePlan());
    document.getElementById('btn-add-step').addEventListener('click', () => this._addPlanStep());

    // View switching
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        this._switchView(view);
      });
    });

    // Calendar navigation
    document.getElementById('btn-prev-month').addEventListener('click', () => Calendar.prevMonth());
    document.getElementById('btn-next-month').addEventListener('click', () => Calendar.nextMonth());

    // Timer callbacks
    Timer.onTick = (remaining, total, mode) => this._updateTimerDisplay(remaining, total, mode);
    Timer.onStateChange = (state, mode) => this._updateControls(state, mode);
    Timer.onStepComplete = (mode, duration, planName) => this._onStepComplete(mode, duration, planName);
    Timer.onPlanComplete = (planName) => this._onPlanComplete(planName);
    Timer.onAlarmStart = (duration) => this._onAlarmStart(duration);
    Timer.onAlarmStop = () => this._onAlarmStop();

    // Custom time start
    document.getElementById('btn-custom-start').addEventListener('click', () => {
      const mins = parseInt(document.getElementById('custom-minutes').value) || 25;
      document.getElementById('custom-minutes').value = mins; // normalize
      Timer.startWork(Math.max(1, Math.min(180, mins)));
    });

    // Notes panel
    document.getElementById('btn-toggle-notes').addEventListener('click', () => this._toggleNotes());
    document.getElementById('btn-close-notes').addEventListener('click', () => this._closeNotes());

    // PiP mode
    document.getElementById('btn-pip').addEventListener('click', () => this._openPiP());

    // Alarm stop
    document.getElementById('btn-stop-alarm').addEventListener('click', () => {
      Timer.stopAlarm();
    });

    // Alarm duration setting
    document.getElementById('select-alarm-duration').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.alarmDuration = parseInt(e.target.value);
      Storage.saveSettings(settings);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (Timer.state === 'running') Timer.pause();
        else if (Timer.state === 'paused') Timer.resume();
        else if (Timer.state === 'idle' || Timer.state === 'finished') this._handleStart();
      }
      if (e.code === 'Escape') {
        if (Timer.isAlarming) {
          Timer.stopAlarm();
          return;
        }
        Timer.stop();
        this._hideTaskLogModal();
        this._closeSidePanel();
      }
    });
  },

  // --- Timer Display ---
  _updateTimerDisplay(remaining, total, mode) {
    const timeEl = document.getElementById('timer-time');
    const modeEl = document.getElementById('timer-mode');

    // Format time
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Mode label
    if (Timer.state === 'idle') {
      modeEl.textContent = t('ready');
    } else if (Timer.state === 'paused') {
      modeEl.textContent = t('paused');
    } else if (Timer.state === 'finished') {
      modeEl.textContent = t('planComplete');
    } else {
      modeEl.textContent = mode === 'work' ? t('work') : t('rest');
    }

    // Progress ring
    this._updateProgressRing(remaining, total);

    // Active plan display
    this._updateActivePlanDisplay();
  },

  _updateProgressRing(remaining, total) {
    const ring = document.getElementById('progress-ring-fill');
    if (!ring) return;

    const radius = 90;
    const circumference = 2 * Math.PI * radius;

    if (total <= 0) {
      ring.style.strokeDasharray = `${circumference} ${circumference}`;
      ring.style.strokeDashoffset = circumference;
      return;
    }

    const progress = remaining / total;
    const offset = circumference * (1 - progress);

    ring.style.strokeDasharray = `${circumference} ${circumference}`;
    ring.style.strokeDashoffset = offset;

    // Update color based on mode
    const mode = Timer.mode;
    ring.style.stroke = mode === 'rest'
      ? 'var(--accent-rest)'
      : 'var(--accent)';
  },

  _updateActivePlanDisplay() {
    const nameEl = document.getElementById('active-plan-name');
    const stepEl = document.getElementById('active-plan-step');

    if (!Timer.currentPlan || Timer.state === 'idle') {
      nameEl.textContent = '';
      stepEl.textContent = '';
      return;
    }

    nameEl.textContent = Timer.currentPlan.name;
    const step = Timer.currentPlan.steps[Timer.currentStepIndex];
    if (step) {
      const typeLabel = step.type === 'work' ? t('workStep') : t('restStep');
      stepEl.textContent = `${typeLabel} ${step.duration}${t('min')} (${Timer.currentStepIndex + 1}/${Timer.currentPlan.steps.length})`;
    }
  },

  // --- Controls ---
  _updateControls(state, mode) {
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');
    const ring = document.getElementById('progress-ring-fill');
    const customTime = document.getElementById('custom-time-input');
    const extraActions = document.querySelector('.timer-extra-actions');

    const isIdle = state === 'idle' || state === 'finished';

    switch (state) {
      case 'idle':
        btnStart.style.display = '';
        btnPause.style.display = 'none';
        btnStop.style.display = 'none';
        ring.style.stroke = 'var(--accent)';
        break;
      case 'running':
        btnStart.style.display = 'none';
        btnPause.style.display = '';
        btnStop.style.display = '';
        ring.style.stroke = mode === 'rest' ? 'var(--accent-rest)' : 'var(--accent)';
        break;
      case 'paused':
        btnStart.style.display = '';
        btnPause.style.display = 'none';
        btnStop.style.display = '';
        ring.style.stroke = 'var(--text-secondary)';
        break;
      case 'finished':
        btnStart.style.display = '';
        btnPause.style.display = 'none';
        btnStop.style.display = 'none';
        break;
    }

    // Show/hide custom time input
    if (customTime) customTime.style.display = isIdle ? '' : 'none';
    // Show/hide extra actions (notes, PiP)
    if (extraActions) extraActions.style.display = isIdle ? 'none' : '';
  },

  // --- Handle Start ---
  _handleStart() {
    if (Timer.state === 'paused') {
      Timer.resume();
      return;
    }

    if (Timer.state === 'finished') {
      if (Timer.currentPlan) {
        Timer.startPlan(Timer.currentPlan);
        return;
      }
      Timer.stop();
    }

    // If a plan was stopped mid-way, restart it
    if (Timer.currentPlan && Timer.state === 'idle') {
      Timer.startPlan(Timer.currentPlan);
      return;
    }

    // Default: start a 25-minute work session
    Timer.startWork(25);
  },

  // --- Step Complete ---
  _onStepComplete(mode, duration, planName) {
    if (mode === 'work') {
      // Auto-save pending log from previous session
      if (this._pendingLog) {
        this._saveLogSilent();
      }
      // Store log data - will be shown after alarm is dismissed
      this._pendingLog = {
        duration: duration,
        planName: planName || '',
      };
      // Task log modal shown after alarm stops (see _onAlarmStop)
    }

    this._updateSessionStats();
    Calendar.render();
  },

  // --- Plan Complete ---
  _onPlanComplete(planName) {
    this._updateSessionStats();
    Calendar.render();
  },

  // --- Task Log Modal ---
  _pendingLog: null,

  _showTaskLogModal(durationSeconds) {
    const modal = document.getElementById('task-log-modal');
    const durationEl = document.getElementById('task-log-duration');
    const input = document.getElementById('task-log-input');

    const mins = Math.floor(durationSeconds / 60);
    durationEl.textContent = `🍅 ${t('focusTime')}: ${mins} ${t('min')}`;
    input.value = '';
    modal.classList.add('open');
    setTimeout(() => input.focus(), 300);
  },

  _hideTaskLogModal() {
    document.getElementById('task-log-modal').classList.remove('open');
  },

  _saveLogSilent() {
    if (this._pendingLog) {
      const notes = this._getNotes();
      Storage.addLog({
        id: Storage.generateId(),
        date: this._todayStr(),
        task: '',
        duration: this._pendingLog.duration,
        planName: this._pendingLog.planName,
        notes: notes,
        createdAt: new Date().toISOString(),
      });
      this._clearNotes();
      this._pendingLog = null;
    }
  },

  _saveTaskLog() {
    const input = document.getElementById('task-log-input');
    const task = input.value.trim();
    const notes = this._getNotes();

    if (this._pendingLog) {
      Storage.addLog({
        id: Storage.generateId(),
        date: this._todayStr(),
        task: task,
        duration: this._pendingLog.duration,
        planName: this._pendingLog.planName,
        notes: notes,
        createdAt: new Date().toISOString(),
      });
    }

    this._pendingLog = null;
    this._clearNotes();
    this._hideTaskLogModal();
    this._updateSessionStats();
    Calendar.render();
  },

  _skipTaskLog() {
    // Save without task description
    if (this._pendingLog) {
      const notes = this._getNotes();
      Storage.addLog({
        id: Storage.generateId(),
        date: this._todayStr(),
        task: '',
        duration: this._pendingLog.duration,
        planName: this._pendingLog.planName,
        notes: notes,
        createdAt: new Date().toISOString(),
      });
    }

    this._pendingLog = null;
    this._clearNotes();
    this._hideTaskLogModal();
    this._updateSessionStats();
    Calendar.render();
  },

  // --- Session Stats ---
  _updateSessionStats() {
    const today = this._todayStr();
    const logs = Storage.getLogsByDate(today);
    const count = logs.length;
    const totalSec = logs.reduce((s, l) => s + l.duration, 0);
    const totalMin = Math.floor(totalSec / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;

    document.getElementById('session-count').textContent = count;
    const timeStr = h > 0 ? `${h}h${m}m` : `${m}m`;
    document.getElementById('session-total-time').textContent = timeStr;
  },

  // --- Side Panel ---
  _toggleSidePanel() {
    const panel = document.getElementById('side-panel');
    const overlay = document.getElementById('overlay');
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      this._closeSidePanel();
    } else {
      panel.classList.add('open');
      overlay.classList.add('open');
    }
  },

  _closeSidePanel() {
    document.getElementById('side-panel').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  },

  // --- Settings ---
  _toggleSettings() {
    document.getElementById('settings-dropdown').classList.toggle('open');
  },

  _applySettings() {
    const settings = Storage.getSettings();
    document.getElementById('toggle-theme').checked = settings.theme === 'dark';
    document.getElementById('toggle-lang').checked = settings.language === 'en';
    document.getElementById('toggle-sound').checked = settings.soundEnabled !== false;
    document.getElementById('toggle-notification').checked = settings.notificationEnabled !== false;
    const alarmSelect = document.getElementById('select-alarm-duration');
    if (alarmSelect) alarmSelect.value = settings.alarmDuration || 10;
    this._applyTheme();
    applyI18n();
  },

  _applyTheme() {
    const settings = Storage.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme);
  },

  // --- Presets ---
  _renderPresets() {
    const container = document.getElementById('preset-list');
    if (!container) return;

    const presets = Plans.getPresets();
    container.innerHTML = presets.map(p => `
      <div class="preset-card" data-preset-id="${p.id}">
        <span class="preset-icon">${p.icon}</span>
        <div class="preset-info">
          <span class="preset-label">${p.label}</span>
          <span class="preset-detail">${t('presetWork')} ${p.work}${t('min')} · ${t('presetRest')} ${p.rest}${t('min')}</span>
        </div>
        <button class="btn btn-sm btn-primary preset-start-btn" data-preset-id="${p.id}">
          ${t('startPlan')}
        </button>
      </div>
    `).join('');

    // Bind preset clicks
    container.querySelectorAll('.preset-start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const preset = presets.find(p => p.id === btn.dataset.presetId);
        if (preset) {
          this._closeSidePanel();
          Timer.startPreset(preset.work, preset.rest);
        }
      });
    });

    container.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const preset = presets.find(p => p.id === card.dataset.presetId);
        if (preset) {
          this._closeSidePanel();
          Timer.startPreset(preset.work, preset.rest);
        }
      });
    });
  },

  // --- Plans ---
  _editingPlanId: null,

  _renderPlans() {
    const container = document.getElementById('plan-list');
    if (!container) return;

    const plans = Plans.getAll();
    if (!plans.length) {
      container.innerHTML = `<div class="empty-hint">${t('noPlans')}</div>`;
      return;
    }

    container.innerHTML = plans.map(p => {
      const totalWork = Plans.totalWorkMinutes(p);
      return `
        <div class="plan-card" data-plan-id="${p.id}">
          <div class="plan-card-header">
            <span class="plan-card-name">${this._escapeHtml(p.name)}</span>
            <span class="plan-card-total">${Plans.formatDuration(totalWork)}</span>
          </div>
          <div class="plan-card-steps">${this._escapeHtml(Plans.stepsSummary(p))}</div>
          <div class="plan-card-actions">
            <button class="btn btn-sm btn-primary plan-start-btn" data-plan-id="${p.id}">${t('startPlan')}</button>
            <button class="btn btn-sm btn-ghost plan-edit-btn" data-plan-id="${p.id}">${t('edit')}</button>
            <button class="btn btn-sm btn-ghost plan-del-btn" data-plan-id="${p.id}">${t('del')}</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind events
    container.querySelectorAll('.plan-start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const plan = Plans.get(btn.dataset.planId);
        if (plan) {
          this._closeSidePanel();
          Timer.startPlan(plan);
        }
      });
    });

    container.querySelectorAll('.plan-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const plan = Plans.get(btn.dataset.planId);
        if (plan) this._showPlanEditor(plan);
      });
    });

    container.querySelectorAll('.plan-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(t('delete') + '?')) {
          Plans.remove(btn.dataset.planId);
          this._renderPlans();
        }
      });
    });
  },

  // --- Plan Editor ---
  _showPlanEditor(plan) {
    const editor = document.getElementById('plan-editor');
    const nameInput = document.getElementById('plan-name-input');

    if (plan) {
      this._editingPlanId = plan.id;
      nameInput.value = plan.name;
      this._renderPlanSteps(plan.steps);
    } else {
      this._editingPlanId = null;
      const empty = Plans.createEmpty();
      nameInput.value = '';
      this._renderPlanSteps(empty.steps);
    }

    editor.style.display = '';
    nameInput.focus();
  },

  _hidePlanEditor() {
    document.getElementById('plan-editor').style.display = 'none';
    this._editingPlanId = null;
  },

  _renderPlanSteps(steps) {
    const container = document.getElementById('plan-steps');
    container.innerHTML = steps.map((step, i) => `
      <div class="step-row">
        <span class="step-index">${i + 1}</span>
        <select class="step-type-select">
          <option value="work" ${step.type === 'work' ? 'selected' : ''}>${t('workStep')}</option>
          <option value="rest" ${step.type === 'rest' ? 'selected' : ''}>${t('restStep')}</option>
        </select>
        <input type="number" class="step-duration-input" value="${step.duration}" min="1" max="180">
        <span class="step-unit">${t('min')}</span>
        <button class="btn-icon btn-step-remove" ${steps.length <= 1 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `).join('');

    // Bind remove buttons
    container.querySelectorAll('.btn-step-remove').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        btn.closest('.step-row').remove();
        this._updateStepIndices();
      });
    });
  },

  _addPlanStep() {
    const container = document.getElementById('plan-steps');
    const row = document.createElement('div');
    const index = container.children.length + 1;
    row.className = 'step-row';
    row.innerHTML = `
      <span class="step-index">${index}</span>
      <select class="step-type-select">
        <option value="work">${t('workStep')}</option>
        <option value="rest">${t('restStep')}</option>
      </select>
      <input type="number" class="step-duration-input" value="25" min="1" max="180">
      <span class="step-unit">${t('min')}</span>
      <button class="btn-icon btn-step-remove">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    container.appendChild(row);

    row.querySelector('.btn-step-remove').addEventListener('click', () => {
      row.remove();
      this._updateStepIndices();
    });
  },

  _updateStepIndices() {
    const container = document.getElementById('plan-steps');
    container.querySelectorAll('.step-row').forEach((row, i) => {
      row.querySelector('.step-index').textContent = i + 1;
    });
    // Disable remove if only 1 step
    const removeBtns = container.querySelectorAll('.btn-step-remove');
    if (removeBtns.length <= 1) {
      removeBtns.forEach(b => b.disabled = true);
    } else {
      removeBtns.forEach(b => b.disabled = false);
    }
  },

  _savePlan() {
    const name = document.getElementById('plan-name-input').value.trim();
    if (!name) {
      document.getElementById('plan-name-input').focus();
      return;
    }

    const stepRows = document.getElementById('plan-steps').querySelectorAll('.step-row');
    const steps = [];
    stepRows.forEach(row => {
      const type = row.querySelector('.step-type-select').value;
      const duration = parseInt(row.querySelector('.step-duration-input').value) || 25;
      steps.push({ type, duration: Math.max(1, Math.min(180, duration)) });
    });

    const plan = {
      id: this._editingPlanId,
      name: name,
      steps: steps,
    };

    Plans.save(plan);
    this._hidePlanEditor();
    this._renderPlans();
  },

  // --- View Switching ---
  _switchView(viewName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === viewName);
    });

    // Update views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.toggle('active', v.id === `view-${viewName}`);
    });

    // Render calendar if switching to it
    if (viewName === 'calendar') {
      Calendar.init();
      Calendar.render();
    }
  },

  // --- Notifications ---
  _requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  // --- Alarm Overlay ---
  _alarmTaskLogPending: false,

  _onAlarmStart(duration) {
    const overlay = document.getElementById('alarm-overlay');
    const subtitle = document.getElementById('alarm-subtitle');
    if (duration <= 0) {
      subtitle.textContent = '';
    } else {
      subtitle.textContent = t('alarmRinging') + ' (' + duration + 's)';
    }
    overlay.classList.add('active');
    this._alarmTaskLogPending = true;

    // Countdown update
    if (duration > 0) {
      this._alarmCountdown = duration;
      this._alarmCountdownInterval = setInterval(() => {
        this._alarmCountdown--;
        if (this._alarmCountdown <= 0) {
          clearInterval(this._alarmCountdownInterval);
          return;
        }
        subtitle.textContent = t('alarmRinging') + ' (' + this._alarmCountdown + 's)';
      }, 1000);
    }
  },

  _onAlarmStop() {
    const overlay = document.getElementById('alarm-overlay');
    overlay.classList.remove('active');
    if (this._alarmCountdownInterval) {
      clearInterval(this._alarmCountdownInterval);
      this._alarmCountdownInterval = null;
    }

    // Show task log if a work session just completed
    if (this._alarmTaskLogPending && this._pendingLog) {
      this._showTaskLogModal(this._pendingLog.duration);
    }
    this._alarmTaskLogPending = false;
  },

  // --- Notes Panel ---
  _notesOpen: false,

  _toggleNotes() {
    const panel = document.getElementById('notes-panel');
    this._notesOpen = !this._notesOpen;
    panel.classList.toggle('open', this._notesOpen);
    if (this._notesOpen) {
      document.getElementById('notes-textarea').focus();
    }
  },

  _closeNotes() {
    this._notesOpen = false;
    document.getElementById('notes-panel').classList.remove('open');
  },

  _getNotes() {
    const ta = document.getElementById('notes-textarea');
    return ta ? ta.value.trim() : '';
  },

  _clearNotes() {
    const ta = document.getElementById('notes-textarea');
    if (ta) ta.value = '';
  },

  // --- Picture-in-Picture ---
  _pipWindow: null,
  _pipUpdateInterval: null,

  _openPiP() {
    // Check for Document Picture-in-Picture API
    if (!('documentPictureInPicture' in window)) {
      alert(t('pipNotSupported'));
      return;
    }

    // Toggle: close if already open
    if (this._pipWindow && !this._pipWindow.closed) {
      this._closePiP();
      return;
    }

    // Clear any stale interval
    if (this._pipUpdateInterval) {
      clearInterval(this._pipUpdateInterval);
      this._pipUpdateInterval = null;
    }

    const pipOptions = { width: 200, height: 120 };
    documentPictureInPicture.requestWindow(pipOptions).then(win => {
      this._pipWindow = win;
      this._setupPiPWindow(win);
      // Update PiP window every 500ms
      this._pipUpdateInterval = setInterval(() => {
        if (!win || win.closed) {
          this._closePiP();
          return;
        }
        this._updatePiPWindow(win);
      }, 500);

      // Handle window close by user
      win.addEventListener('pagehide', () => {
        this._closePiP();
      });
    }).catch(() => {
      // User cancelled or API error
      this._pipWindow = null;
    });
  },

  _closePiP() {
    if (this._pipUpdateInterval) {
      clearInterval(this._pipUpdateInterval);
      this._pipUpdateInterval = null;
    }
    if (this._pipWindow) {
      try { this._pipWindow.close(); } catch (e) {}
      this._pipWindow = null;
    }
  },

  _setupPiPWindow(win) {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var bg = isDark ? '#1a1a2e' : '#ffffff';
    var fg = isDark ? '#e8e8ed' : '#1a1a2e';
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>';
    html += '*{margin:0;padding:0;box-sizing:border-box}';
    html += 'body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:' + bg + ';color:' + fg + ';padding:12px;user-select:none}';
    html += '.pip-time{font-size:2.5rem;font-weight:700;font-variant-numeric:tabular-nums;font-family:monospace}';
    html += '.pip-mode{font-size:.75rem;opacity:.6;margin-top:4px}';
    html += '</style></head><body>';
    html += '<div class="pip-time" id="pip-time">--:--</div>';
    html += '<div class="pip-mode" id="pip-mode"></div>';
    html += '</body></html>';
    win.document.write(html);
    win.document.close();
  },

  _updatePiPWindow(win) {
    try {
      const timeEl = win.document.getElementById('pip-time');
      const modeEl = win.document.getElementById('pip-mode');
      if (timeEl) {
        const m = Math.floor(Timer.remainingSeconds / 60);
        const s = Timer.remainingSeconds % 60;
        timeEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }
      if (modeEl) {
        const mode = Timer.mode === 'work' ? t('work') : t('rest');
        modeEl.textContent = Timer.state === 'running' ? mode : Timer.state === 'paused' ? t('paused') : '';
      }
    } catch (e) {
      this._closePiP();
    }
  },

  // --- Helpers ---
  _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
