import SwiftUI

struct TimerView: View {
    @EnvironmentObject var vm: TimerViewModel
    @Binding var showTaskLog: Bool
    @Binding var pendingDuration: Int
    @Binding var notesText: String
    @State private var customMinutes: Int = 25
    @State private var showNotes = false

    var body: some View {
        VStack(spacing: 20) {
            // Custom time input (when idle)
            if vm.status == .idle || vm.status == .finished {
                HStack(spacing: 8) {
                    TextField("25", value: $customMinutes, format: .number)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 60)
                        .font(.title3.monospacedDigit())
                        .multilineTextAlignment(.center)
                    Text("分钟")
                        .foregroundColor(.secondary)
                    Button("自定开始") {
                        vm.startWork(minutes: max(1, min(180, customMinutes)))
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                }
                .padding(.horizontal)
            }

            // Active plan
            if let plan = vm.currentPlan, vm.status != .idle {
                VStack(spacing: 2) {
                    Text(plan.name)
                        .font(.headline)
                        .foregroundColor(.accentColor)
                    Text(vm.currentStepLabel)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Circular Progress
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 10)
                Circle()
                    .trim(from: 0, to: vm.progress)
                    .stroke(
                        vm.mode == .rest ? Color.green : Color.red,
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: vm.progress)

                VStack(spacing: 4) {
                    Text(formatSeconds(max(0, vm.remainingSeconds)))
                        .font(.system(size: 48, weight: .bold, design: .monospaced))
                    Text(statusLabel)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 240, height: 240)

            // Controls
            HStack(spacing: 24) {
                Button(action: {
                    if vm.status == .running {
                        vm.pause()
                    } else if vm.status == .paused {
                        vm.resume()
                    } else {
                        vm.startWork(minutes: customMinutes)
                    }
                }) {
                    Image(systemName: vm.status == .running ? "pause.fill" : "play.fill")
                        .font(.title)
                        .frame(width: 56, height: 56)
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .keyboardShortcut(.space, modifiers: [])

                if vm.status != .idle && vm.status != .finished {
                    Button(action: { vm.stop() }) {
                        Image(systemName: "stop.fill")
                            .font(.title2)
                            .frame(width: 44, height: 44)
                            .background(Color.secondary.opacity(0.15))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut(.escape, modifiers: [])
                }
            }

            // Extra actions (during timer)
            if vm.status == .running || vm.status == .paused {
                HStack(spacing: 12) {
                    Button(action: { showNotes.toggle() }) {
                        Label(showNotes ? "收起笔记" : "笔记", systemImage: showNotes ? "note.text.badge.minus" : "note.text")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)

                    Button(action: { FloatingPanelManager.shared.toggle(with: vm) }) {
                        Label("小窗", systemImage: "macwindow.on.rectangle")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
            }

            // Notes panel
            if showNotes {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("📝 会话笔记")
                            .font(.headline)
                        Spacer()
                        Button("关闭") { showNotes = false }
                            .buttonStyle(.plain)
                            .font(.caption)
                    }
                    TextEditor(text: $notesText)
                        .frame(height: 100)
                        .font(.body)
                        .scrollContentBackground(.hidden)
                        .padding(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                        )
                }
                .padding()
                .background(Color.secondary.opacity(0.05))
                .cornerRadius(10)
            }

            // Stats
            HStack(spacing: 40) {
                StatItem(value: "\(vm.todaySessionCount)", label: "今日番茄")
                StatItem(value: "\(vm.todayTotalMinutes)m", label: "今日专注")
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 24)
            .background(Color.secondary.opacity(0.05))
            .cornerRadius(10)
        }
        .padding()
    }

    var statusLabel: String {
        switch vm.status {
        case .idle: return "准备开始"
        case .running: return vm.mode == .work ? "工作中" : "休息中"
        case .paused: return "已暂停"
        case .finished: return "计划完成！"
        }
    }
}

struct StatItem: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(.accentColor)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
