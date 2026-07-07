/**
 * App module - Entry point and initialization
 */

(function () {
  'use strict';

  // Initialize the application when DOM is ready
  function init() {
    UI.init();
    Calendar.init();

    // Apply initial theme and language
    const settings = Storage.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en';
    applyI18n();

    // Request notification permission on first load
    if (settings.notificationEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show calendar if navigating back to it
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.classList.contains('active') && tab.dataset.view === 'calendar') {
        Calendar.render();
      }
    });

    console.log('🍅 Pomodoro Timer ready!');
    console.log(`   Theme: ${settings.theme}, Language: ${settings.language}`);
    console.log(`   Plans: ${Plans.getAll().length}, Logs: ${Storage.getLogs().length}`);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
