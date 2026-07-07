import Foundation
import AppKit

// MARK: - Storage Manager (UserDefaults)
class StorageManager {
    static let shared = StorageManager()
    private let defaults = UserDefaults.standard

    private enum Keys {
        static let settings = "pomodoro_settings"
        static let plans = "pomodoro_plans"
        static let logs = "pomodoro_logs"
    }

    // Settings
    func loadSettings() -> AppSettings {
        guard let data = defaults.data(forKey: Keys.settings),
              let settings = try? JSONDecoder().decode(AppSettings.self, from: data)
        else { return AppSettings() }
        return settings
    }

    func saveSettings(_ settings: AppSettings) {
        if let data = try? JSONEncoder().encode(settings) {
            defaults.set(data, forKey: Keys.settings)
        }
    }

    // Plans
    func loadPlans() -> [Plan] {
        guard let data = defaults.data(forKey: Keys.plans),
              let plans = try? JSONDecoder().decode([Plan].self, from: data)
        else { return [] }
        return plans
    }

    func savePlans(_ plans: [Plan]) {
        if let data = try? JSONEncoder().encode(plans) {
            defaults.set(data, forKey: Keys.plans)
        }
    }

    // Logs
    func loadLogs() -> [TaskLog] {
        guard let data = defaults.data(forKey: Keys.logs),
              let logs = try? JSONDecoder().decode([TaskLog].self, from: data)
        else { return [] }
        return logs
    }

    func saveLogs(_ logs: [TaskLog]) {
        if let data = try? JSONEncoder().encode(logs) {
            defaults.set(data, forKey: Keys.logs)
        }
    }

    func addLog(_ log: TaskLog) {
        var logs = loadLogs()
        logs.insert(log, at: 0)
        saveLogs(logs)
    }

    func logsForDate(_ date: String) -> [TaskLog] {
        loadLogs().filter { $0.date == date }
    }

    func logsForMonth(year: Int, month: Int) -> [TaskLog] {
        let prefix = String(format: "%d-%02d", year, month)
        return loadLogs().filter { $0.date.hasPrefix(prefix) }
    }

    func clearAll() {
        defaults.removeObject(forKey: Keys.settings)
        defaults.removeObject(forKey: Keys.plans)
        defaults.removeObject(forKey: Keys.logs)
    }
}

// MARK: - Sound Manager
class SoundManager {
    static let shared = SoundManager()

    func playComplete(mode: TimerMode) {
        guard StorageManager.shared.loadSettings().soundEnabled else { return }
        // Use NSSound for simple beep
        NSSound.beep()
    }

    func playAlarm(mode: TimerMode) {
        guard StorageManager.shared.loadSettings().soundEnabled else { return }
        // Repeated beeps handled by timer
        NSSound.beep()
    }
}

// MARK: - Date Helpers
func todayString() -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
}

func formatSeconds(_ seconds: Int) -> String {
    let m = seconds / 60
    let s = seconds % 60
    return String(format: "%02d:%02d", m, s)
}

func formatMinutes(_ minutes: Int) -> String {
    if minutes >= 60 {
        return "\(minutes / 60)h \(minutes % 60)m"
    }
    return "\(minutes)m"
}
