import SwiftUI

struct ContentView: View {
    @EnvironmentObject var vm: TimerViewModel
    @State private var selectedTab = 0
    @State private var showTaskLog = false
    @State private var pendingDuration: Int = 0
    @State private var notesText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            // Tab bar
            HStack(spacing: 0) {
                TabButton(title: "计时", icon: "timer", index: 0, selected: $selectedTab)
                TabButton(title: "计划", icon: "list.bullet", index: 1, selected: $selectedTab)
                TabButton(title: "日历", icon: "calendar", index: 2, selected: $selectedTab)
                TabButton(title: "设置", icon: "gearshape", index: 3, selected: $selectedTab)
            }
            .padding(.horizontal)
            .padding(.top, 8)
            .background(.bar)

            Divider()

            // Content
            Group {
                switch selectedTab {
                case 0: TimerView(showTaskLog: $showTaskLog, pendingDuration: $pendingDuration, notesText: $notesText)
                case 1: PlansView()
                case 2: CalendarView()
                case 3: SettingsView()
                default: EmptyView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onAppear {
            applyInitialTheme()
            vm.onWorkComplete = { duration in
                pendingDuration = duration
                showTaskLog = true
            }
            vm.onPlanComplete = { [weak vm] in
                vm?.updateTodayStats()
            }
        }
        .onDisappear {
            vm.onWorkComplete = nil
            vm.onPlanComplete = nil
        }
        .sheet(isPresented: $showTaskLog) {
            TaskLogView(durationSeconds: pendingDuration, notesText: notesText)
                .environmentObject(vm)
                .onDisappear { notesText = "" }
        }
        // Alarm overlay
        .overlay {
            if vm.isAlarming {
                AlarmOverlay()
            }
        }
        .preferredColorScheme(colorScheme)
    }

    func applyInitialTheme() {
        vm.settings.theme.apply()
    }

    var colorScheme: ColorScheme? {
        switch vm.settings.theme {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }
}

struct TabButton: View {
    let title: String
    let icon: String
    let index: Int
    @Binding var selected: Int

    var body: some View {
        Button(action: { selected = index }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                Text(title)
                    .font(.system(size: 11))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .foregroundColor(selected == index ? .accentColor : .secondary)
            .background(selected == index ? Color.accentColor.opacity(0.1) : .clear)
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }
}

struct AlarmOverlay: View {
    @EnvironmentObject var vm: TimerViewModel

    var body: some View {
        ZStack {
            Color.black.opacity(0.5).ignoresSafeArea()
            VStack(spacing: 20) {
                Text("🔔")
                    .font(.system(size: 60))
                Text("时间到！")
                    .font(.title)
                    .fontWeight(.bold)
                if vm.alarmRemaining > 0 {
                    Text("正在响铃... (\(vm.alarmRemaining)s)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Button("停止响铃") {
                    vm.stopAlarm()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
            }
            .padding(40)
            .background(.regularMaterial)
            .cornerRadius(20)
        }
    }
}
