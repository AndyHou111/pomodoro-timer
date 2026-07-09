# macOS Pomodoro Timer App — Complete Development Prompt

> Copy this entire prompt into Claude Code (or any AI coding tool) to rebuild the project from scratch.

---

## Project Overview

Build a **native macOS Pomodoro Timer app** using **SwiftUI + AppKit**. The app helps users stay focused with customizable work/rest timers, study plans, task logging, a calendar view, and a floating mini timer.

**Target:** macOS 14.0+  
**Language:** Swift 5.0+  
**Framework:** SwiftUI with AppKit for floating panel and menu bar  
**Persistence:** UserDefaults (JSON-encoded Codable structs)  
**Architecture:** MVVM — a single `TimerViewModel` as the central `@StateObject`, shared via `.environmentObject()`

---

## File Structure

Create an Xcode macOS App project (SwiftUI, Swift) and add these files:

```
Pomodoro/
├── PomodoroApp.swift          # @main App entry + menu bar
├── ContentView.swift           # Tab bar + view routing + alarm overlay
├── Models.swift                # All data models (Plan, TaskLog, Settings, etc.)
├── TimerViewModel.swift        # @MainActor ObservableObject — timer engine
├── StorageManager.swift       # UserDefaults CRUD + SoundManager
├── TimerView.swift            # Main timer screen: progress ring, notes, controls
├── PlansView.swift            # Quick presets + custom plan CRUD
├── CalendarView.swift         # Monthly calendar + daily task detail
├── SettingsView.swift         # Theme, sound, alarm, data management
├── TaskLogView.swift          # Post-session task summary sheet
├── MenuBarView.swift          # Menu bar extra mini timer
├── FloatingPanelManager.swift # NSPanel always-on-top mini window
├── FloatingTimerView.swift    # Content view for the floating panel
└── Assets.xcassets/AppIcon.appiconset/  # App icon (red tomato)
```

---

## 1. Data Models (`Models.swift`)

```swift
// TimerMode: enum { work, rest } — Codable
// TimerStatus: enum { idle, running, paused, finished } — Codable

// Plan: Identifiable, Codable
//   - id: String (UUID)
//   - name: String
//   - steps: [PlanStep]
//   - computed: totalWorkMinutes, totalMinutes

// PlanStep: Identifiable, Codable
//   - id: String (UUID)
//   - type: TimerMode
//   - duration: Int (minutes)

// Preset: Identifiable (not stored, built-in)
//   - static let all: [Preset] = 6 items (25+5, 50+10, 45+15, 90+20, 30+5, 20+5)
//   - id, label, work, rest, icon (emoji)

// TaskLog: Identifiable, Codable
//   - id, date (yyyy-MM-dd), task, duration (seconds), planName, notes, createdAt

// AppSettings: Codable
//   - theme: ThemeMode (.light/.dark/.system)
//   - language: AppLanguage (.chinese/.english) — saved but UI is Chinese by default
//   - soundEnabled: Bool (default true)
//   - alarmDuration: Int (0=off, 5, 10, 30, 60 seconds, default 10)

// ThemeMode: String, Codable, CaseIterable { light, dark, system }
//   - func apply() — sets NSApp.appearance to .aqua / .darkAqua / nil

// BackupData: Codable { logs: [TaskLog], plans: [Plan] } — for JSON export
```

---

## 2. Storage (`StorageManager.swift`)

- `StorageManager.shared` — singleton
- UserDefaults keys: `pomodoro_settings`, `pomodoro_plans`, `pomodoro_logs`
- Methods: `loadSettings()/saveSettings()`, `loadPlans()/savePlans()`, `loadLogs()/saveLogs()/addLog()`, `logsForDate()`, `logsForMonth()`, `clearAll()`
- `SoundManager.shared` — calls `NSSound.beep()` for alarm sound
- Helper functions: `todayString() -> String`, `formatSeconds(_:) -> String`, `formatMinutes(_:) -> String`

---

## 3. Timer Engine (`TimerViewModel.swift`)

**Central class:** `@MainActor class TimerViewModel: ObservableObject`

### Published State
- `status: TimerStatus`, `mode: TimerMode`, `remainingSeconds: Int`, `totalSeconds: Int`
- `currentPlan: Plan?`, `currentStepIndex: Int`, `completedSteps: Int`
- `isAlarming: Bool`, `alarmRemaining: Int`
- `todaySessionCount: Int`, `todayTotalMinutes: Int`
- `settings: AppSettings`
- `progress: Double` (computed: remainingSeconds / totalSeconds)

### Internal State
- `timer: Timer?`, `alarmInterval: Timer?`, `alarmTimer: Timer?`
- `pendingWorkDuration: Int?` — tracks work completion for deferred task log

### Callbacks (set by ContentView, cleared on disappear)
- `onWorkComplete: ((Int) -> Void)?` — triggers task log sheet
- `onPlanComplete: (() -> Void)?` — updates stats

### Core Methods
- `startWork(minutes:)` — stop alarm, reset state, begin work timer
- `startPreset(work:rest:)` — create a 2-step plan, start it
- `startPlan(_:)` — begin executing a plan from step 0
- `pause()`, `resume()`, `stop()` — manage timer lifecycle
- `stopAlarm()` — stop alarm, then trigger `onWorkComplete` if `pendingWorkDuration` exists
- `updateTodayStats()` — recalculate today's session count and minutes

### Timer Tick Logic (private)
- Use `Timer.scheduledTimer(withTimeInterval: 1, repeats: true)`
- Each tick: `remainingSeconds -= 1`, if `<= 0` → `stepComplete()`
- `stepComplete()`: store `pendingWorkDuration` if work mode, call `startAlarm()`, advance to next step or finish plan
- `startAlarm()`: invalidate old timers first. If `alarmDuration == 0`, trigger `onWorkComplete` immediately. Otherwise play sound every 2s, auto-stop after configured duration. Both alarm timers use `[weak self] t in` pattern with `guard let self else { t.invalidate(); return }`

---

## 4. App Entry (`PomodoroApp.swift`)

```swift
@main
struct PomodoroMacApp: App {
    @StateObject private var viewModel = TimerViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(viewModel)
                .frame(minWidth: 520, idealWidth: 600, minHeight: 520, idealHeight: 640)
                .preferredColorScheme(colorScheme)  // from vm.settings.theme
                .onAppear { observeSystemThemeChanges() }
        }
        .windowStyle(.hiddenTitleBar)
        .commands { CommandGroup(replacing: .newItem) {} }

        MenuBarExtra("🍅 番茄钟") {
            MenuBarView().environmentObject(viewModel)
        }
    }
}
```

**System theme observation:** Listen for `AppleInterfaceThemeChangedNotification` via `DistributedNotificationCenter`. When fired and theme is `.system`, set `NSApp.appearance = nil`.

---

## 5. Main View (`ContentView.swift`)

- **Tab bar** at top: 计时 (timer icon), 计划 (list.bullet), 日历 (calendar), 设置 (gearshape)
- `@State selectedTab: Int = 0`, `showTaskLog: Bool`, `pendingDuration: Int`, `notesText: String`
- Switch on `selectedTab` to show TimerView/PlansView/CalendarView/SettingsView
- **Alarm overlay:** full-screen semi-transparent overlay when `vm.isAlarming`. Shows 🔔, "时间到！", countdown, and "停止响铃" button
- **Task log sheet:** shown when `showTaskLog == true`, presents `TaskLogView`
- `onAppear`: apply initial theme, set ViewModel callbacks
- `onDisappear`: clear ViewModel callbacks (prevent retain cycles)

---

## 6. Timer View (`TimerView.swift`)

### Layout (top to bottom)
1. **Custom time input** (visible when idle/finished): number field + "分钟" + "自定开始" button
2. **Active plan indicator** (visible during timer): plan name + current step
3. **Circular progress ring** (240x240 SVG-style Circle shapes):
   - Background circle: `.stroke(Color.secondary.opacity(0.2), lineWidth: 10)`
   - Progress circle: `.trim(from: 0, to: vm.progress).stroke(work=red, rest=green)`
   - Center text: `formatSeconds(max(0, vm.remainingSeconds))` + status label
4. **Controls:** Play/Pause button (circle, accent color) + Stop button (circle, gray)
   - Space key shortcut for Play/Pause, Esc for Stop
5. **Extra actions** (visible when running/paused):
   - "笔记" button — toggles notes panel
   - "小窗" button — calls `FloatingPanelManager.shared.toggle(with: vm)`
6. **Notes panel** (collapsible): TextEditor, saves to `notesText` binding
7. **Stats bar:** today's session count + total minutes

---

## 7. Plans View (`PlansView.swift`)

### Layout
1. **"快速开始" section:** LazyVGrid of PresetCards (2 columns). Each shows icon + label + detail + play button. Tap starts the preset.
2. **"自定义计划" section:** List of PlanCards + "新建" button
3. **PlanCard:** name, total work time badge, steps summary, Start/Edit/Delete buttons
4. **PlanEditorView** (sheet): name text field, list of step rows (type picker + duration input + remove button), "添加步骤" button, Save/Cancel. `ForEach($steps)` for binding.

---

## 8. Calendar View (`CalendarView.swift`)

- Month navigation: ← → buttons, `yyyy年 M月` label
- 7 weekday headers: 日一二三四五六
- LazyVGrid of day cells (7 columns): each cell shows day number, task dots (red), total minutes
- Today highlighted with blue border, selected date with accent background
- **Day detail panel** below grid: selected date's task list with time, plan name, duration + daily total
- Use `guard let` (not `!`) when creating dates from components

---

## 9. Settings View (`SettingsView.swift`)

- **Theme:** segmented picker (浅色/深色/跟随系统), changes apply immediately via `ThemeMode.apply()`
- **Sound:** toggle
- **Alarm duration:** picker (静音/5秒/10秒/30秒/1分钟)
- **Data:** Export JSON button (NSSavePanel + JSONEncoder), Clear All button (NSAlert confirm + StorageManager.clearAll())
- Local `@State` copies sync from `vm.settings` on appear, save on change

---

## 10. Task Log View (`TaskLogView.swift`)

- Sheet presented after alarm stops for work sessions
- Shows 🎉, "番茄钟完成！", focus duration, task summary text field
- Shows notes from timer session (read-only, if not empty)
- Skip / Save buttons — both save to StorageManager and dismiss

---

## 11. Menu Bar (`MenuBarView.swift`)

- Shows timer state: remaining time + work/rest mode (when running), or "准备开始" + preset quick-start buttons (when idle)
- Pause/Resume/Stop buttons (when running)
- "打开主窗口" — finds main window by checking `win.frame.width > 300` (to skip floating panel)
- "退出" button

---

## 12. Floating Panel (`FloatingPanelManager.swift` + `FloatingTimerView.swift`)

### FloatingPanelManager (singleton)
- Creates an `NSPanel` with:
  - `styleMask: [.titled, .closable, .nonactivatingPanel, .resizable]`
  - `level: .floating` (always on top)
  - `collectionBehavior: [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]`
  - `isFloatingPanel = true`, `becomesKeyOnlyIfNeeded = true`, `hidesOnDeactivate = false`
  - Title bar transparent, minimize/zoom buttons hidden
- Positions at top-right of screen
- `toggle(with:)` — show/hide; `close()` — clean up; `updateIfOpen(with:)` — refresh content

### FloatingTimerView
- Mini circular progress ring (140x140) with time + status
- Quick play/pause and stop buttons
- Current plan name (if active)
- Frame: 180x250

---

## 13. App Icon

Generate PNG icons programmatically: red circle (#e74c3c) with green stem (#27ae60, #2ecc71) and white highlight. Sizes: 16, 32, 64, 128, 256, 512, 1024. Save to `Assets.xcassets/AppIcon.appiconset/` with proper `Contents.json`.

---

## 14. Implementation Order

1. **Models.swift** — all data types
2. **StorageManager.swift** — persistence layer
3. **TimerViewModel.swift** — core timer engine
4. **PomodoroApp.swift + MenuBarView.swift** — app entry + menu bar
5. **ContentView.swift** — tab framework + alarm overlay
6. **TimerView.swift** — main timer UI
7. **PlansView.swift** — presets + plans
8. **CalendarView.swift** — calendar + history
9. **SettingsView.swift** — settings
10. **TaskLogView.swift** — post-session log
11. **FloatingPanelManager.swift + FloatingTimerView.swift** — floating window
12. **App Icon** — generate PNGs
13. **Test & fix** — build, verify all features

---

## 15. Critical Edge Cases to Handle

- ✅ `CalendarView`: Use `guard let` NOT force-unwrap (`!`) for date operations
- ✅ `TimerViewModel`: `startWork/startPlan/startPreset` must call `stopAlarm()` first
- ✅ `TimerViewModel`: When `alarmDuration == 0`, still trigger task log (don't skip)
- ✅ `TimerViewModel`: Invalidate old alarm timers before creating new ones
- ✅ `TimerViewModel`: Alarm timer closures use `[weak self] t in guard let self else { t.invalidate(); return }`
- ✅ `ContentView`: Clear `onWorkComplete`/`onPlanComplete` in `onDisappear`
- ✅ `MenuBarView`: Find main window by checking `frame.width > 300` (not `.first`)
- ✅ `ThemeMode.apply()`: Single source of truth for NSApp.appearance changes
- ✅ `StorageManager`: Provide `clearAll()` method, don't hardcode keys in SettingsView
- ✅ `TimerView`: Display `max(0, remainingSeconds)` not `remainingSeconds > 0 ? remainingSeconds : totalSeconds`
- ✅ App must compile with **zero warnings** on Xcode 16

---

## 16. Build Verification

```bash
xcodebuild -project Pomodoro.xcodeproj -scheme Pomodoro -configuration Release build
# Expected: ** BUILD SUCCEEDED ** with zero errors and zero warnings
```

Run the app and verify:
1. Theme toggle (light/dark/system) applies instantly
2. Timer counts down, ring animates, mode switches work→rest→work
3. Alarm rings, overlay shows, manual stop works, task log appears
4. Plans: presets work, custom plans save/edit/delete/start
5. Calendar: month navigation, date selection, task detail display
6. Notes: toggle, type, content appears in task log
7. Floating panel: opens, stays on top, draggable, closes
8. Menu bar: shows timer state, presets when idle, controls when running
9. Settings persist across app restart
10. Data export produces valid JSON
