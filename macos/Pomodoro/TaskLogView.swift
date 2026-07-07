import SwiftUI

struct TaskLogView: View {
    let durationSeconds: Int
    let notesText: String
    @EnvironmentObject var vm: TimerViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var taskText = ""

    var body: some View {
        VStack(spacing: 16) {
            Text("🎉")
                .font(.system(size: 48))
            Text("番茄钟完成！")
                .font(.title2.bold())

            Text("🍅 专注时长: \(durationSeconds / 60) 分钟")
                .foregroundColor(.secondary)

            VStack(alignment: .leading, spacing: 4) {
                Text("这段时间你做了什么？")
                    .font(.caption)
                    .foregroundColor(.secondary)
                TextField("输入任务总结...", text: $taskText)
                    .textFieldStyle(.roundedBorder)
            }

            // Notes from timer (read-only summary)
            if !notesText.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("📝 会话笔记")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(notesText)
                        .font(.callout)
                        .padding(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.secondary.opacity(0.05))
                        .cornerRadius(6)
                }
            }

            HStack {
                Button("跳过") {
                    saveLog(task: "")
                }
                .buttonStyle(.bordered)

                Spacer()

                Button("保存记录") {
                    saveLog(task: taskText)
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.return, modifiers: [])
            }
        }
        .padding(30)
        .frame(width: 400, height: notesText.isEmpty ? 300 : 400)
    }

    func saveLog(task: String) {
        let log = TaskLog(
            date: todayString(),
            task: task,
            duration: durationSeconds,
            planName: vm.currentPlan?.name ?? "",
            notes: notesText,
            createdAt: Date()
        )
        StorageManager.shared.addLog(log)
        vm.updateTodayStats()
        dismiss()
    }
}
