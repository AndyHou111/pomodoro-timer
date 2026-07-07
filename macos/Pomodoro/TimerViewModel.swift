import Foundation
import SwiftUI

@MainActor
class TimerViewModel: ObservableObject {
    // Timer state
    @Published var status: TimerStatus = .idle
    @Published var mode: TimerMode = .work
    @Published var remainingSeconds: Int = 0
    @Published var totalSeconds: Int = 0
    @Published var completedSteps: Int = 0

    // Plan
    @Published var currentPlan: Plan?
    @Published var currentStepIndex: Int = 0

    // Alarm
    @Published var isAlarming: Bool = false
    @Published var alarmRemaining: Int = 0
    private var pendingWorkDuration: Int?

    // Stats
    @Published var todaySessionCount: Int = 0
    @Published var todayTotalMinutes: Int = 0

    // Settings
    @Published var settings: AppSettings = AppSettings()

    // State
    private var timer: Timer?
    private var alarmTimer: Timer?
    private var alarmInterval: Timer?

    // Completion handlers
    var onWorkComplete: ((Int) -> Void)?
    var onPlanComplete: (() -> Void)?

    // MARK: - Init
    init() {
        settings = StorageManager.shared.loadSettings()
        updateTodayStats()
    }

    // MARK: - Timer Controls
    func startWork(minutes: Int) {
        stopAlarm()
        currentPlan = nil
        currentStepIndex = 0
        completedSteps = 0
        mode = .work
        totalSeconds = minutes * 60
        remainingSeconds = totalSeconds
        startTimer()
    }

    func startPreset(work: Int, rest: Int) {
        stopAlarm()
        let plan = Plan(
            name: "\(work)+\(rest)",
            steps: [
                PlanStep(type: .work, duration: work),
                PlanStep(type: .rest, duration: rest),
            ]
        )
        startPlan(plan)
    }

    func startPlan(_ plan: Plan) {
        stopAlarm()
        currentPlan = plan
        currentStepIndex = 0
        completedSteps = 0
        loadCurrentStep()
        startTimer()
    }

    func togglePause() {
        if status == .running {
            pause()
        } else if status == .paused {
            resume()
        }
    }

    func pause() {
        timer?.invalidate()
        status = .paused
    }

    func resume() {
        startTimer()
    }

    func stop() {
        timer?.invalidate()
        pendingWorkDuration = nil
        stopAlarm()
        status = .idle
        mode = .work
        remainingSeconds = 0
        totalSeconds = 0
        currentPlan = nil
        currentStepIndex = 0
        updateTodayStats()
    }

    func stopAlarm() {
        isAlarming = false
        alarmTimer?.invalidate()
        alarmInterval?.invalidate()
        alarmTimer = nil
        alarmInterval = nil

        // Show task log after alarm stops for work sessions
        if let duration = pendingWorkDuration {
            pendingWorkDuration = nil
            onWorkComplete?(duration)
        }
        updateTodayStats()
    }

    // MARK: - Internal
    private func startTimer() {
        timer?.invalidate()
        status = .running
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tick()
            }
        }
    }

    private func tick() {
        guard status == .running else { return }
        remainingSeconds -= 1
        if remainingSeconds <= 0 {
            stepComplete()
        }
    }

    private func stepComplete() {
        timer?.invalidate()
        let completedMode = mode

        // Store work duration for task log (shown after alarm stops)
        if completedMode == .work {
            pendingWorkDuration = totalSeconds
        }

        // Start alarm
        startAlarm()

        completedSteps += 1

        // Advance to next step
        if let plan = currentPlan, currentStepIndex + 1 < plan.steps.count {
            currentStepIndex += 1
            loadCurrentStep()
            startTimer()
        } else {
            status = .finished
            onPlanComplete?()
        }
    }

    private func loadCurrentStep() {
        guard let plan = currentPlan,
              currentStepIndex < plan.steps.count else { return }
        let step = plan.steps[currentStepIndex]
        mode = step.type
        totalSeconds = step.duration * 60
        remainingSeconds = totalSeconds
    }

    private func startAlarm() {
        let duration = settings.alarmDuration

        // Invalidate any existing alarm timers
        alarmInterval?.invalidate()
        alarmTimer?.invalidate()

        guard duration > 0 else {
            // Still show task log for silent mode
            if let d = pendingWorkDuration {
                pendingWorkDuration = nil
                onWorkComplete?(d)
            }
            return
        }

        isAlarming = true
        alarmRemaining = duration

        // Play sound every 2 seconds
        alarmInterval = Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { [weak self] t in
            guard let self = self else { t.invalidate(); return }
            Task { @MainActor in
                SoundManager.shared.playAlarm(mode: self.mode)
            }
        }

        // Auto-stop after duration
        alarmTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] t in
            guard let self = self else { t.invalidate(); return }
            Task { @MainActor in
                self.alarmRemaining -= 1
                if self.alarmRemaining <= 0 {
                    self.stopAlarm()
                }
            }
        }
    }

    // MARK: - Stats
    func updateTodayStats() {
        let logs = StorageManager.shared.logsForDate(todayString())
        todaySessionCount = logs.count
        todayTotalMinutes = logs.reduce(0) { $0 + $1.duration } / 60
    }

    // MARK: - Progress
    var progress: Double {
        guard totalSeconds > 0 else { return 0 }
        return Double(remainingSeconds) / Double(totalSeconds)
    }

    var currentStepLabel: String {
        guard let plan = currentPlan,
              currentStepIndex < plan.steps.count else { return "" }
        let step = plan.steps[currentStepIndex]
        let typeLabel = step.type == .work ? "工作" : "休息"
        return "\(typeLabel) \(step.duration)min (\(currentStepIndex + 1)/\(plan.steps.count))"
    }
}
