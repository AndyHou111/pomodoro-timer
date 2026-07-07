/**
 * i18n module - Internationalization
 */

const I18N = {
  zh: {
    appTitle: '🍅 番茄钟',
    timer: '计时',
    calendar: '日历',
    theme: '主题',
    themeLight: '☀️ 浅色',
    themeDark: '🌙 深色',
    language: '语言',
    sound: '音效',
    notification: '通知',
    on: '开',
    off: '关',

    // Timer
    ready: '准备开始',
    work: '工作中',
    rest: '休息中',
    paused: '已暂停',
    planComplete: '计划完成！',

    // Quick start
    quickStart: '快速开始',
    customPlans: '自定义计划',
    plans: '作息计划',
    newPlan: '+ 新建计划',
    editPlan: '编辑计划',
    planNamePlaceholder: '计划名称',
    addStep: '+ 添加步骤',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    startPlan: '开始',
    edit: '编辑',
    del: '删除',
    workStep: '工作',
    restStep: '休息',
    min: '分钟',
    noPlans: '暂无自定义计划',

    // Task log
    sessionComplete: '番茄钟完成！',
    whatDidYouDo: '这段时间你做了什么？',
    taskPlaceholder: '输入任务总结...',
    skip: '跳过',
    saveTask: '保存记录',
    focusTime: '专注时长',

    // Calendar
    todaySessions: '今日番茄',
    todayFocus: '今日专注',
    selectDay: '选择日期查看详情',
    noTaskRecord: '暂无任务记录',
    totalFocus: '当日总专注',
    tasks: '个任务',
    hours: '小时',
    minutes: '分钟',
    sun: '日',
    mon: '一',
    tue: '二',
    wed: '三',
    thu: '四',
    fri: '五',
    sat: '六',

    // Presets
    presetWork: '工作',
    presetRest: '休息',

    // Notifications
    workCompleteTitle: '🍅 工作时间结束！',
    workCompleteBody: '太棒了！休息一下吧~',
    restCompleteTitle: '⏰ 休息时间结束！',
    restCompleteBody: '准备开始新的番茄钟！',
    planCompleteTitle: '🎉 计划完成！',
    planCompleteBody: '你完成了整个作息计划！',
    // Custom time
    startCustom: '自定开始',
    customTime: '自定义时长',
    min: '分钟',

    // Notes
    notes: '笔记',
    sessionNotes: '📝 会话笔记',
    notesPlaceholder: '记录想法、待办事项...',

    // PiP
    pipMode: '小窗',
    pipNotSupported: '当前浏览器不支持小窗模式',

    // Alarm
    alarmDuration: '响铃时长',
    alarmSilent: '静音',
    alarm5s: '5 秒',
    alarm10s: '10 秒',
    alarm30s: '30 秒',
    alarm1min: '1 分钟',
    timeUp: '⏰ 时间到！',
    stopAlarm: '停止响铃',
    alarmRinging: '正在响铃...',
  },

  en: {
    appTitle: '🍅 Pomodoro',
    timer: 'Timer',
    calendar: 'Calendar',
    theme: 'Theme',
    themeLight: '☀️ Light',
    themeDark: '🌙 Dark',
    language: 'Language',
    sound: 'Sound',
    notification: 'Notification',
    on: 'On',
    off: 'Off',

    // Timer
    ready: 'Ready',
    work: 'Focusing',
    rest: 'Break',
    paused: 'Paused',
    planComplete: 'Plan Complete!',

    // Quick start
    quickStart: 'Quick Start',
    customPlans: 'Custom Plans',
    plans: 'Study Plans',
    newPlan: '+ New Plan',
    editPlan: 'Edit Plan',
    planNamePlaceholder: 'Plan name',
    addStep: '+ Add Step',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    startPlan: 'Start',
    edit: 'Edit',
    del: 'Del',
    workStep: 'Work',
    restStep: 'Break',
    min: 'min',
    noPlans: 'No custom plans yet',

    // Task log
    sessionComplete: 'Pomodoro Complete!',
    whatDidYouDo: 'What did you work on?',
    taskPlaceholder: 'Enter task summary...',
    skip: 'Skip',
    saveTask: 'Save Record',
    focusTime: 'Focus Time',

    // Calendar
    todaySessions: 'Today\'s Pomodoros',
    todayFocus: 'Today\'s Focus',
    selectDay: 'Select a date to view details',
    noTaskRecord: 'No task records',
    totalFocus: 'Daily Focus Total',
    tasks: 'tasks',
    hours: 'h',
    minutes: 'm',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',

    // Presets
    presetWork: 'Work',
    presetRest: 'Break',

    // Notifications
    workCompleteTitle: '🍅 Work Session Complete!',
    workCompleteBody: 'Great job! Time for a break~',
    restCompleteTitle: '⏰ Break Over!',
    restCompleteBody: 'Ready for a new pomodoro!',
    planCompleteTitle: '🎉 Plan Complete!',
    planCompleteBody: 'You finished the entire study plan!',
    // Custom time
    startCustom: 'Custom Start',
    customTime: 'Custom Time',
    min: 'min',

    // Notes
    notes: 'Notes',
    sessionNotes: '📝 Session Notes',
    notesPlaceholder: 'Jot down ideas, todos...',

    // PiP
    pipMode: 'Mini Window',
    pipNotSupported: 'PiP not supported in this browser',

    // Alarm
    alarmDuration: 'Alarm Duration',
    alarmSilent: 'Silent',
    alarm5s: '5 sec',
    alarm10s: '10 sec',
    alarm30s: '30 sec',
    alarm1min: '1 min',
    timeUp: '⏰ Times Up!',
    stopAlarm: 'Stop Alarm',
    alarmRinging: 'Ringing...',
  },
};

/**
 * Get translated string by key
 */
function t(key) {
  const lang = (Storage.getSettings()).language || 'zh';
  return I18N[lang]?.[key] || I18N.zh[key] || key;
}

/**
 * Apply translations to all [data-i18n] and [data-i18n-placeholder] elements
 */
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      // Skip inputs with user-entered value
      if (!el.value || el.dataset.i18nLast === key) {
        el.placeholder = t(key);
      }
    } else {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Handle select options with data-i18n-opt
  document.querySelectorAll('[data-i18n-opt]').forEach(el => {
    el.textContent = t(el.dataset.i18nOpt);
  });

  // Update document lang
  const lang = (Storage.getSettings()).language || 'zh';
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}
