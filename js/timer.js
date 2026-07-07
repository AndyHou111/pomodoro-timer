/**
 * Timer module - Core countdown engine
 */

const Timer = {
  // State
  state: 'idle', // idle | running | paused | finished
  mode: 'work',   // work | rest
  totalSeconds: 0,
  remainingSeconds: 0,
  intervalId: null,
  alarmIntervalId: null,
  alarmStopTimeoutId: null,
  isAlarming: false,

  // Plan tracking
  currentPlan: null,     // { id, name, steps: [...] }
  currentStepIndex: 0,
  completedSteps: 0,

  // Callbacks
  onTick: null,           // (remainingSeconds, totalSeconds, mode)
  onStepComplete: null,   // (mode, duration, planName) - when a work/rest step finishes
  onPlanComplete: null,   // (planName) - when entire plan finishes
  onAlarmStart: null,     // (duration) - when alarm starts ringing
  onAlarmStop: null,      // () - when alarm is stopped
  onStateChange: null,    // (state, mode)

  /**
   * Start a simple work session (no plan, just one work period)
   */
  startWork(minutes) {
    this.currentPlan = null;
    this.currentStepIndex = 0;
    this.completedSteps = 0;
    this.mode = 'work';
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this._start();
  },

  /**
   * Start a plan
   */
  startPlan(plan) {
    this.currentPlan = plan;
    this.currentStepIndex = 0;
    this.completedSteps = 0;
    this._loadStep(0);
    this._start();
  },

  /**
   * Start from a preset (work + rest pair)
   */
  startPreset(workMin, restMin) {
    this.currentPlan = {
      id: 'preset',
      name: `${workMin}+${restMin}`,
      steps: [
        { type: 'work', duration: workMin },
        { type: 'rest', duration: restMin },
      ],
    };
    this.currentStepIndex = 0;
    this.completedSteps = 0;
    this._loadStep(0);
    this._start();
  },

  /**
   * Load a specific step
   */
  _loadStep(index) {
    if (!this.currentPlan || index >= this.currentPlan.steps.length) {
      this._finishPlan();
      return;
    }
    const step = this.currentPlan.steps[index];
    this.currentStepIndex = index;
    this.mode = step.type;
    this.totalSeconds = step.duration * 60;
    this.remainingSeconds = this.totalSeconds;
  },

  /**
   * Start the interval
   */
  _start() {
    this._clearInterval();
    this.state = 'running';
    this._fireStateChange();
    this.intervalId = setInterval(() => this._tick(), 1000);
  },

  /**
   * Each second
   */
  _tick() {
    if (this.state !== 'running') return;

    this.remainingSeconds--;

    if (this.onTick) {
      this.onTick(this.remainingSeconds, this.totalSeconds, this.mode);
    }

    if (this.remainingSeconds <= 0) {
      this._onStepEnd();
    }
  },

  /**
   * When a step finishes
   */
  _onStepEnd() {
    const completedMode = this.mode;
    const completedDuration = this.totalSeconds;

    // Fire step complete callback BEFORE alarm (so UI updates)
    if (this.onStepComplete) {
      const planName = this.currentPlan ? this.currentPlan.name : '';
      this.onStepComplete(completedMode, completedDuration, planName);
    }

    // Start repeated alarm
    this._startAlarm(completedMode);

    this.completedSteps++;

    // Advance to next step
    if (this.currentPlan && this.currentStepIndex + 1 < this.currentPlan.steps.length) {
      this.currentStepIndex++;
      this._loadStep(this.currentStepIndex);
      // Auto-start next step
      if (this.onStateChange) this.onStateChange(this.state, this.mode);
      if (this.onTick) {
        this.onTick(this.remainingSeconds, this.totalSeconds, this.mode);
      }
    } else {
      this._finishPlan();
    }
  },

  /**
   * Start repeated alarm ringing
   */
  _startAlarm(mode) {
    const settings = Storage.getSettings();
    const duration = settings.alarmDuration || 10;

    this._stopAlarm(); // Clear any existing alarm
    this.isAlarming = true;

    // Send browser notification (always, regardless of sound)
    if (settings.notificationEnabled) {
      this._sendNotification(mode);
    }

    // Play sound loop if enabled and duration > 0
    if (settings.soundEnabled && duration > 0) {
      this._playSound(mode);
      this.alarmIntervalId = setInterval(() => {
        this._playSound(mode);
      }, 2000);
    }

    // Auto-stop after configured duration (always, even if silent)
    if (duration > 0) {
      this.alarmStopTimeoutId = setTimeout(() => {
        this._stopAlarm();
      }, duration * 1000);
    }

    // Notify UI (always show alarm overlay)
    if (this.onAlarmStart) {
      this.onAlarmStart(duration);
    }
  },

  /**
   * Stop alarm manually
   */
  stopAlarm() {
    this._stopAlarm();
    if (this.onAlarmStop) {
      this.onAlarmStop();
    }
  },

  _stopAlarm() {
    if (this.alarmIntervalId) {
      clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }
    if (this.alarmStopTimeoutId) {
      clearTimeout(this.alarmStopTimeoutId);
      this.alarmStopTimeoutId = null;
    }
    this.isAlarming = false;
  },

  /**
   * Plan complete
   */
  _finishPlan() {
    this._clearInterval();
    this.state = 'finished';
    this._fireStateChange();

    if (this.onPlanComplete) {
      const planName = this.currentPlan ? this.currentPlan.name : '';
      this.onPlanComplete(planName);
    }
  },

  /**
   * Pause timer
   */
  pause() {
    if (this.state !== 'running') return;
    this._clearInterval();
    this.state = 'paused';
    this._fireStateChange();
  },

  /**
   * Resume timer
   */
  resume() {
    if (this.state !== 'paused') return;
    this._start();
  },

  /**
   * Stop timer completely
   */
  stop() {
    this._clearInterval();
    this.state = 'idle';
    this.currentPlan = null;
    this.currentStepIndex = 0;
    this.completedSteps = 0;
    this.mode = 'work';
    this.remainingSeconds = 0;
    this._stopAlarm();
    this.totalSeconds = 0;
    this._fireStateChange();

    if (this.onTick) {
      this.onTick(0, 0, 'work');
    }
  },

  /**
   * Skip current step
   */
  skipStep() {
    if (this.state !== 'running' && this.state !== 'paused') return;
    this.remainingSeconds = 0;
    this._onStepEnd();
  },

  /**
   * Clear interval
   */
  _clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  _fireStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state, this.mode);
    }
  },

  /**
   * Generate sound using Web Audio API
   */
  _playSound(mode) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = mode === 'work' ? [523, 659, 784] : [784, 659, 523]; // C E G ascending or descending
      const duration = 0.15;

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * duration);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * duration + duration);
        osc.start(ctx.currentTime + i * duration);
        osc.stop(ctx.currentTime + i * duration + duration);
      });

      // Cleanup
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      // Web Audio not supported
    }
  },

  /**
   * Send browser notification
   */
  _sendNotification(mode) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const title = mode === 'work'
      ? t('workCompleteTitle')
      : t('restCompleteTitle');
    const body = mode === 'work'
      ? t('workCompleteBody')
      : t('restCompleteBody');

    try {
      new Notification(title, { body });
    } catch (e) {
      // Notification failed
    }
  },
};
