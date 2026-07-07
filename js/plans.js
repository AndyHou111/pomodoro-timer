/**
 * Plans module - Presets and custom plan management
 */

const Plans = {
  /**
   * Built-in presets - quick-start work+rest pairs
   */
  getPresets() {
    return [
      { id: 'preset-25-5',  label: '25 + 5',  work: 25, rest: 5,  icon: '🍅' },
      { id: 'preset-50-10', label: '50 + 10', work: 50, rest: 10, icon: '🔥' },
      { id: 'preset-45-15', label: '45 + 15', work: 45, rest: 15, icon: '⏳' },
      { id: 'preset-90-20', label: '90 + 20', work: 90, rest: 20, icon: '💪' },
      { id: 'preset-30-5',  label: '30 + 5',  work: 30, rest: 5,  icon: '☕' },
      { id: 'preset-20-5',  label: '20 + 5',  work: 20, rest: 5,  icon: '⚡' },
    ];
  },

  /**
   * Get all custom plans from storage
   */
  getAll() {
    return Storage.getPlans();
  },

  /**
   * Get a single plan by id
   */
  get(id) {
    return this.getAll().find(p => p.id === id);
  },

  /**
   * Save a plan (create or update)
   */
  save(plan) {
    const plans = this.getAll();
    const idx = plans.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plan.id = Storage.generateId();
      plans.push(plan);
    }
    Storage.savePlans(plans);
    return plan;
  },

  /**
   * Delete a plan
   */
  remove(id) {
    const plans = this.getAll().filter(p => p.id !== id);
    Storage.savePlans(plans);
  },

  /**
   * Create a new empty plan object
   */
  createEmpty() {
    return {
      id: null,
      name: '',
      steps: [
        { type: 'work', duration: 25 },
        { type: 'rest', duration: 5 },
      ],
    };
  },

  /**
   * Format duration for display
   */
  formatDuration(totalMinutes) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  },

  /**
   * Calculate total work time of a plan
   */
  totalWorkMinutes(plan) {
    return plan.steps
      .filter(s => s.type === 'work')
      .reduce((sum, s) => sum + s.duration, 0);
  },

  /**
   * Get steps summary string
   */
  stepsSummary(plan) {
    return plan.steps
      .map(s => {
        const typeLabel = s.type === 'work' ? t('workStep') : t('restStep');
        return `${typeLabel} ${s.duration}${t('min')}`;
      })
      .join(' → ');
  },
};
