import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var vm: TimerViewModel
    @State private var currentYear: Int
    @State private var currentMonth: Int
    @State private var selectedDate: String?
    @State private var logs: [TaskLog] = []

    init() {
        let now = Date()
        let cal = Calendar.current
        _currentYear = State(initialValue: cal.component(.year, from: now))
        _currentMonth = State(initialValue: cal.component(.month, from: now))
        _selectedDate = State(initialValue: todayString())
    }

    var body: some View {
        VStack(spacing: 12) {
            // Month nav
            HStack {
                Button(action: { changeMonth(-1) }) {
                    Image(systemName: "chevron.left")
                }
                Text(monthLabel)
                    .font(.title3.bold())
                    .frame(width: 180)
                Button(action: { changeMonth(1) }) {
                    Image(systemName: "chevron.right")
                }
            }

            // Weekday headers
            HStack {
                ForEach(["日","一","二","三","四","五","六"], id: \.self) { d in
                    Text(d)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Day grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 4) {
                ForEach(emptyCells, id: \.self) { _ in
                    Color.clear.aspectRatio(1, contentMode: .fit)
                }
                ForEach(daysInMonth, id: \.self) { day in
                    let dateStr = dayString(day)
                    let info = dayInfo(dateStr)
                    DayCell(
                        day: day,
                        isToday: dateStr == todayString(),
                        isSelected: dateStr == selectedDate,
                        taskCount: info.count,
                        totalMin: info.minutes
                    )
                    .onTapGesture {
                        selectedDate = dateStr
                    }
                }
            }

            // Day detail
            if let date = selectedDate {
                Divider()
                dayDetail(date)
            }
        }
        .padding()
        .onAppear { loadLogs() }
    }

    // MARK: - Day Detail
    func dayDetail(_ date: String) -> some View {
        let dayLogs = logs.filter { $0.date == date }
        return VStack(alignment: .leading, spacing: 8) {
            Text(date)
                .font(.headline)
            if dayLogs.isEmpty {
                Text("暂无任务记录")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                ForEach(dayLogs) { log in
                    HStack {
                        Circle()
                            .fill(log.planName.isEmpty ? Color.red : Color.green)
                            .frame(width: 8, height: 8)
                        VStack(alignment: .leading) {
                            Text(log.task.isEmpty ? "专注时间" : log.task)
                                .font(.body)
                            Text("\(log.createdAt.formatted(date: .omitted, time: .shortened)) · \(log.planName)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text("\(log.durationMinutes)m")
                            .font(.body.bold())
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
                let total = dayLogs.reduce(0) { $0 + $1.durationMinutes }
                Text("当日总专注: \(formatMinutes(total)) · \(dayLogs.count) 个任务")
                    .font(.caption.bold())
                    .foregroundColor(.accentColor)
                    .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Helpers
    func changeMonth(_ delta: Int) {
        currentMonth += delta
        if currentMonth > 12 { currentMonth = 1; currentYear += 1 }
        if currentMonth < 1 { currentMonth = 12; currentYear -= 1 }
        loadLogs()
    }

    func loadLogs() {
        logs = StorageManager.shared.logsForMonth(year: currentYear, month: currentMonth)
    }

    var monthLabel: String {
        "\(currentYear)年 \(currentMonth)月"
    }

    var emptyCells: [Int] {
        guard let first = Calendar.current.date(from: DateComponents(year: currentYear, month: currentMonth, day: 1)) else {
            return []
        }
        let wd = Calendar.current.component(.weekday, from: first) - 1
        return Array(0..<wd)
    }

    var daysInMonth: [Int] {
        guard let first = Calendar.current.date(from: DateComponents(year: currentYear, month: currentMonth, day: 1)),
              let range = Calendar.current.range(of: .day, in: .month, for: first)
        else { return [] }
        return Array(range)
    }

    func dayString(_ day: Int) -> String {
        String(format: "%d-%02d-%02d", currentYear, currentMonth, day)
    }

    func dayInfo(_ date: String) -> (count: Int, minutes: Int) {
        let dayLogs = logs.filter { $0.date == date }
        return (dayLogs.count, dayLogs.reduce(0) { $0 + $1.durationMinutes })
    }
}

struct DayCell: View {
    let day: Int
    let isToday: Bool
    let isSelected: Bool
    let taskCount: Int
    let totalMin: Int

    var body: some View {
        VStack(spacing: 2) {
            Text("\(day)")
                .font(.system(size: 14, weight: isToday ? .bold : .regular))
            if taskCount > 0 {
                Text(String(repeating: "●", count: min(taskCount, 4)))
                    .font(.system(size: 6))
                    .foregroundColor(.red)
                Text("\(totalMin)m")
                    .font(.system(size: 8))
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(1, contentMode: .fit)
        .background(isSelected ? Color.accentColor.opacity(0.15) : isToday ? Color.accentColor.opacity(0.05) : .clear)
        .cornerRadius(6)
    }
}
