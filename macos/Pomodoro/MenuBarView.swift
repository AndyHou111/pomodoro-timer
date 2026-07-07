import SwiftUI

struct MenuBarView: View {
    @EnvironmentObject var vm: TimerViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("🍅 番茄钟")
                .font(.headline)

            if vm.status == .running || vm.status == .paused {
                Text(formatSeconds(vm.remainingSeconds))
                    .font(.system(size: 24, weight: .bold, design: .monospaced))

                Text(vm.mode == .work ? "工作中" : "休息中")
                    .font(.caption)
                    .foregroundColor(vm.mode == .work ? .red : .green)

                Divider()

                if vm.status == .running {
                    Button("暂停") { vm.pause() }
                } else {
                    Button("继续") { vm.resume() }
                }
                Button("停止") { vm.stop() }
            } else {
                Text("准备开始")
                    .foregroundColor(.secondary)

                Divider()

                ForEach(Preset.all.prefix(4)) { preset in
                    Button("\(preset.icon) \(preset.label)") {
                        vm.startPreset(work: preset.work, rest: preset.rest)
                    }
                }
            }

            Divider()

            Button("打开主窗口") {
                NSApp.activate(ignoringOtherApps: true)
                // Find the main window (not the floating mini timer)
                for win in NSApp.windows {
                    if win.frame.width > 300 {
                        win.makeKeyAndOrderFront(nil)
                        break
                    }
                }
            }

            Button("退出") {
                NSApp.terminate(nil)
            }
        }
        .padding()
        .frame(width: 200)
    }
}
