import Foundation
import SwiftUI

// MARK: - Timer State
enum TimerMode: String, Codable {
    case work, rest
}

enum TimerStatus: String, Codable {
    case idle, running, paused, finished
}

// MARK: - Plan
struct Plan: Identifiable, Codable, Equatable {
    var id: String = UUID().uuidString
    var name: String
    var steps: [PlanStep]

    var totalWorkMinutes: Int {
        steps.filter { $0.type == .work }.reduce(0) { $0 + $1.duration }
    }

    var totalMinutes: Int {
        steps.reduce(0) { $0 + $1.duration }
    }
}

struct PlanStep: Identifiable, Codable, Equatable {
    var id: String = UUID().uuidString
    var type: TimerMode
    var duration: Int
}

// MARK: - Preset
struct Preset: Identifiable {
    let id: String
    let label: String
    let work: Int
    let rest: Int
    let icon: String

    static let all: [Preset] = [
        .init(id: "25-5", label: "25+5", work: 25, rest: 5, icon: "🍅"),
        .init(id: "50-10", label: "50+10", work: 50, rest: 10, icon: "🔥"),
        .init(id: "45-15", label: "45+15", work: 45, rest: 15, icon: "⏳"),
        .init(id: "90-20", label: "90+20", work: 90, rest: 20, icon: "💪"),
        .init(id: "30-5", label: "30+5", work: 30, rest: 5, icon: "☕"),
        .init(id: "20-5", label: "20+5", work: 20, rest: 5, icon: "⚡"),
    ]
}

// MARK: - Task Log
struct TaskLog: Identifiable, Codable {
    var id: String = UUID().uuidString
    var date: String
    var task: String
    var duration: Int
    var planName: String
    var notes: String
    var createdAt: Date

    var durationMinutes: Int { duration / 60 }
}

// MARK: - App Settings
struct AppSettings: Codable {
    var theme: ThemeMode = .system
    var language: AppLanguage = .chinese
    var soundEnabled: Bool = true
    var alarmDuration: Int = 10  // 0=off, 5, 10, 30, 60
}

// MARK: - Backup Data (for JSON export)
struct BackupData: Codable {
    let logs: [TaskLog]
    let plans: [Plan]
}

enum ThemeMode: String, Codable, CaseIterable {
    case light, dark, system

    func apply() {
        switch self {
        case .light: NSApp.appearance = NSAppearance(named: .aqua)
        case .dark:  NSApp.appearance = NSAppearance(named: .darkAqua)
        case .system: NSApp.appearance = nil
        }
    }
}

enum AppLanguage: String, Codable, CaseIterable {
    case chinese, english
}
