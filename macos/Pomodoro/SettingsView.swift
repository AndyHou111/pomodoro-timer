import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var vm: TimerViewModel
    @State private var soundEnabled: Bool = true
    @State private var alarmDuration: Int = 10
    @State private var selectedTheme: ThemeMode = .system

    let alarmOptions = [(0, "静音"), (5, "5 秒"), (10, "10 秒"), (30, "30 秒"), (60, "1 分钟")]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Group {
                    Text("外观").font(.headline).foregroundColor(.secondary)
                    Picker("主题", selection: $selectedTheme) {
                        Text("浅色").tag(ThemeMode.light)
                        Text("深色").tag(ThemeMode.dark)
                        Text("跟随系统").tag(ThemeMode.system)
                    }
                    .pickerStyle(.segmented)
                }

                Divider()

                Group {
                    Text("通知").font(.headline).foregroundColor(.secondary)
                    Toggle("音效", isOn: $soundEnabled)
                    Picker("响铃时长", selection: $alarmDuration) {
                        ForEach(alarmOptions, id: \.0) { opt in
                            Text(opt.1).tag(opt.0)
                        }
                    }
                }

                Divider()

                Group {
                    Text("数据").font(.headline).foregroundColor(.secondary)
                    Button("导出数据 (JSON)") {
                        exportData()
                    }
                    Button("清除所有数据") {
                        clearData()
                    }
                    .foregroundColor(.red)
                }

                Divider()

                Text("🍅 Pomodoro Timer v1.0")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
        }
        .onAppear {
            let s = vm.settings
            soundEnabled = s.soundEnabled
            alarmDuration = s.alarmDuration
            selectedTheme = s.theme
        }
        .onChange(of: soundEnabled) { save() }
        .onChange(of: alarmDuration) { save() }
        .onChange(of: selectedTheme) { save() }
    }

    func save() {
        var s = vm.settings
        s.soundEnabled = soundEnabled
        s.alarmDuration = alarmDuration
        s.theme = selectedTheme
        vm.settings = s
        StorageManager.shared.saveSettings(s)
        s.theme.apply()
    }

    func exportData() {
        let logs = StorageManager.shared.loadLogs()
        let plans = StorageManager.shared.loadPlans()
        let backup = BackupData(logs: logs, plans: plans)
        guard let data = try? JSONEncoder().encode(backup),
              let json = String(data: data, encoding: .utf8) else { return }
        let panel = NSSavePanel()
        panel.allowedContentTypes = [.json]
        panel.nameFieldStringValue = "pomodoro_backup.json"
        panel.begin { response in
            if response == .OK, let url = panel.url {
                try? json.write(to: url, atomically: true, encoding: .utf8)
            }
        }
    }

    func clearData() {
        let alert = NSAlert()
        alert.messageText = "清除所有数据？"
        alert.informativeText = "这将删除所有任务记录和计划，不可恢复。"
        alert.addButton(withTitle: "清除")
        alert.addButton(withTitle: "取消")
        if alert.runModal() == .alertFirstButtonReturn {
            StorageManager.shared.clearAll()
            vm.stop()
        }
    }
}
