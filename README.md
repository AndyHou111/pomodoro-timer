# 🍅 Pomodoro Timer / 番茄钟

一个功能丰富的番茄钟网页应用，支持自定义作息计划、任务记录和日历统计。

A feature-rich Pomodoro timer web app with customizable study plans, task logging, and calendar tracking.

## ✨ Features / 功能

- ⏱️ **Custom Timer** — Adjustable work/rest durations with visual progress ring
- 📋 **Study Plans** — Create custom work-rest sequences (作息计划), one-click to execute
- ⚡ **Quick Presets** — 25/5, 50/10, 45/15, 90/20, and more
- 📝 **Task Logging** — Jot down what you accomplished after each session
- 📅 **Calendar View** — Track daily completed tasks with total focus time
- 🌓 **Dark/Light Theme** — Easy on the eyes, day or night
- 🌐 **i18n** — Full Chinese (中文) and English support
- 🔊 **Notifications** — Sound chimes + browser notifications on session end
- ⌨️ **Keyboard Shortcuts** — Space to start/pause, Esc to stop
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## 🚀 Quick Start

Just open `index.html` in your browser — no build step, no server, no dependencies!

Or deploy to GitHub Pages:
1. Push this folder to a GitHub repository
2. Enable GitHub Pages in Settings → Pages → Deploy from `main` branch
3. Done!

## 🎮 Usage

### Timer
- Click **Start** (▶) or press `Space` to begin a 25-minute work session
- Click **Pause** (⏸) or press `Space` to pause/resume
- Click **Stop** (⏹) or press `Esc` to reset

### Presets & Plans
- Click the **menu icon** (☰) to open the side panel
- Select a **preset** for quick work+rest pair
- Create a **custom plan** with multiple work/rest steps
- Click **Start** on any plan to begin

### After Each Session
- A dialog appears asking what you accomplished
- Write a brief summary and save, or skip
- Tasks are recorded in the **Calendar** view

### Calendar
- Switch to the **Calendar** tab to view your history
- Navigate months with ← → arrows
- Click any date to see task details and total focus time

### Settings
- Click the **gear icon** (⚙) to toggle:
  - ☀️/🌙 Theme (Dark/Light)
  - 中文/English Language
  - 🔊 Sound effects
  - 🔔 Browser notifications

## 🛠️ Tech Stack

- Pure **HTML/CSS/JS** — zero dependencies, zero build tools
- **CSS Custom Properties** for theming
- **localStorage** for data persistence
- **Web Audio API** for notification sounds
- **Notification API** for browser alerts
- **SVG** for circular progress ring

## 📁 Project Structure

```
pomodoro-timer/
├── index.html          # Entry point, all views in one page
├── css/
│   └── style.css       # Complete stylesheet with theming
├── js/
│   ├── app.js          # Initialization & boot
│   ├── timer.js        # Timer engine (countdown + plan execution)
│   ├── storage.js      # localStorage CRUD wrapper
│   ├── i18n.js         # Chinese/English translations
│   ├── plans.js        # Presets & custom plan management
│   ├── calendar.js     # Monthly calendar & task records
│   └── ui.js           # DOM rendering & interaction
└── README.md
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Start / Pause / Resume |
| `Esc` | Stop timer / Close modals |

## 📄 License

MIT — feel free to use, modify, and share!
