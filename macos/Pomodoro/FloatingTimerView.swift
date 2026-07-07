import SwiftUI

struct FloatingTimerView: View {
    @EnvironmentObject var vm: TimerViewModel

    var body: some View {
        VStack(spacing: 8) {
            // Mini progress circle
            ZStack {
                Circle()
                    .stroke(Color.secondary.opacity(0.15), lineWidth: 5)
                Circle()
                    .trim(from: 0, to: vm.progress)
                    .stroke(
                        vm.mode == .rest ? Color.green : Color.red,
                        style: StrokeStyle(lineWidth: 5, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: vm.progress)

                VStack(spacing: 2) {
                    Text(formatSeconds(max(0, vm.remainingSeconds)))
                        .font(.system(size: 36, weight: .bold, design: .monospaced))
                    Text(statusLabel)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 140, height: 140)

            // Quick controls
            HStack(spacing: 16) {
                Button(action: {
                    if vm.status == .running { vm.pause() }
                    else if vm.status == .paused { vm.resume() }
                }) {
                    Image(systemName: vm.status == .running ? "pause.fill" : "play.fill")
                        .font(.title2)
                        .frame(width: 36, height: 36)
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .disabled(vm.status == .idle || vm.status == .finished)

                Button(action: { vm.stop() }) {
                    Image(systemName: "stop.fill")
                        .font(.title2)
                        .frame(width: 30, height: 30)
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
                .disabled(vm.status == .idle || vm.status == .finished)
            }

            if let plan = vm.currentPlan {
                Text(plan.name)
                    .font(.caption)
                    .foregroundColor(.accentColor)
                    .lineLimit(1)
            }
        }
        .padding(20)
        .frame(width: 180, height: 250)
    }

    var statusLabel: String {
        switch vm.status {
        case .idle: return "准备开始"
        case .running: return vm.mode == .work ? "工作中" : "休息中"
        case .paused: return "已暂停"
        case .finished: return "已完成"
        }
    }
}
