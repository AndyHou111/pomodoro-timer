/**
 * Calendar module - Monthly view with task records
 */

const Calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1, // 1-indexed
  selectedDate: null,

  /**
   * Initialize calendar with today selected
   */
  init() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth() + 1;
    this.selectedDate = this._dateStr(today);
  },

  /**
   * Render the calendar grid
   */
  render() {
    this._renderMonthLabel();
    this._renderGrid();
    this._renderDayDetail();
  },

  /**
   * Navigate to previous month
   */
  prevMonth() {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.render();
  },

  /**
   * Navigate to next month
   */
  nextMonth() {
    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.render();
  },

  /**
   * Select a date and show details
   */
  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this._renderDayDetail();
    this._highlightSelectedDay();
  },

  // --- Private ---

  _dateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  _renderMonthLabel() {
    const el = document.getElementById('calendar-month-label');
    if (!el) return;
    const monthNames = {
      zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    };
    const lang = (Storage.getSettings()).language || 'zh';
    el.textContent = lang === 'zh'
      ? `${this.currentYear}年${monthNames.zh[this.currentMonth - 1]}`
      : `${monthNames.en[this.currentMonth - 1]} ${this.currentYear}`;
  },

  _renderGrid() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;

    // Weekday headers
    const weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let html = weekDays.map(d => `<div class="cal-cell cal-header">${t(d)}</div>`).join('');

    // Get month data
    const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0=Sun

    // Get logs for this month
    const monthLogs = Storage.getLogsByMonth(this.currentYear, this.currentMonth);
    const dateMap = {};
    monthLogs.forEach(log => {
      if (!dateMap[log.date]) dateMap[log.date] = { count: 0, totalSec: 0 };
      dateMap[log.date].count++;
      dateMap[log.date].totalSec += log.duration;
    });

    const today = this._dateStr(new Date());

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      html += '<div class="cal-cell cal-empty"></div>';
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const info = dateMap[dateStr];
      const isToday = dateStr === today;
      const isSelected = dateStr === this.selectedDate;

      let cls = 'cal-cell cal-day';
      if (isToday) cls += ' cal-today';
      if (isSelected) cls += ' cal-selected';

      let indicators = '';
      if (info) {
        const hours = Math.floor(info.totalSec / 3600);
        const mins = Math.floor((info.totalSec % 3600) / 60);
        const timeStr = hours > 0 ? `${hours}h` : `${mins}m`;
        indicators = `
          <span class="cal-dot">${'●'.repeat(Math.min(info.count, 4))}</span>
          <span class="cal-time">${timeStr}</span>
        `;
      }

      html += `
        <div class="${cls}" data-date="${dateStr}">
          <span class="cal-day-num">${day}</span>
          ${indicators}
        </div>`;
    }

    grid.innerHTML = html;

    // Bind click events
    grid.querySelectorAll('.cal-day').forEach(cell => {
      cell.addEventListener('click', () => {
        this.selectDate(cell.dataset.date);
      });
    });
  },

  _highlightSelectedDay() {
    document.querySelectorAll('.cal-day').forEach(cell => {
      cell.classList.toggle('cal-selected', cell.dataset.date === this.selectedDate);
    });
  },

  _renderDayDetail() {
    const titleEl = document.getElementById('day-detail-title');
    const listEl = document.getElementById('day-detail-list');
    const summaryEl = document.getElementById('day-detail-summary');

    if (!this.selectedDate) {
      if (titleEl) titleEl.textContent = t('selectDay');
      if (listEl) listEl.innerHTML = '';
      if (summaryEl) summaryEl.innerHTML = '';
      return;
    }

    // Format date for display
    const [y, m, d] = this.selectedDate.split('-');
    const lang = (Storage.getSettings()).language || 'zh';
    const displayDate = lang === 'zh'
      ? `${y}年${parseInt(m)}月${parseInt(d)}日`
      : `${parseInt(m)}/${parseInt(d)}/${y}`;
    if (titleEl) titleEl.textContent = displayDate;

    // Get logs for selected date
    const logs = Storage.getLogsByDate(this.selectedDate);

    if (!logs.length) {
      if (listEl) {
        listEl.innerHTML = `<div class="day-detail-empty">📝 ${t('noTaskRecord')}</div>`;
      }
      if (summaryEl) summaryEl.innerHTML = '';
      return;
    }

    // Render task list
    let listHtml = '';
    let totalSec = 0;
    logs.forEach((log, i) => {
      totalSec += log.duration;
      const min = Math.floor(log.duration / 60);
      const time = new Date(log.createdAt).toLocaleTimeString(
        lang === 'zh' ? 'zh-CN' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
      );
      listHtml += `
        <div class="day-detail-item">
          <div class="day-detail-item-left">
            <span class="day-detail-dot ${log.planName ? 'dot-plan' : 'dot-single'}"></span>
            <div>
              <div class="day-detail-task">${log.task || t('focusTime')}</div>
              <div class="day-detail-meta">${time} · ${log.planName || '🍅 Pomodoro'}</div>
            </div>
          </div>
          <span class="day-detail-duration">${min} ${t('min')}</span>
        </div>
      `;
    });
    if (listEl) listEl.innerHTML = listHtml;

    // Summary
    const h = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    let summaryText = '';
    if (h > 0) {
      summaryText = `${t('totalFocus')}: ${h}${t('hours')} ${mins}${t('minutes')} · ${logs.length}${t('tasks')}`;
    } else {
      summaryText = `${t('totalFocus')}: ${mins}${t('minutes')} · ${logs.length}${t('tasks')}`;
    }
    if (summaryEl) summaryEl.innerHTML = `<span>${summaryText}</span>`;
  },
};
