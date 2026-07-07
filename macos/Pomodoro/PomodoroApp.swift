import SwiftUI
import AppKit

@main
struct PomodoroMacApp: App {
    @StateObject private var viewModel = TimerViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(viewModel)
                .frame(minWidth: 520, idealWidth: 600, minHeight: 520, idealHeight: 640)
                .preferredColorScheme(colorScheme)
                .onAppear {
                    observeSystemThemeChanges()
                }
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }

        // Menu bar extra
        MenuBarExtra("🍅 番茄钟") {
            MenuBarView()
                .environmentObject(viewModel)
        }
    }

    var colorScheme: ColorScheme? {
        switch viewModel.settings.theme {
        case .light: return .light
        case .dark: return .dark
        case .system: return nil
        }
    }

    func observeSystemThemeChanges() {
        DistributedNotificationCenter.default.addObserver(
            forName: NSNotification.Name("AppleInterfaceThemeChangedNotification"),
            object: nil,
            queue: .main
        ) { _ in
            DispatchQueue.main.async {
                if viewModel.settings.theme == .system {
                    NSApp.appearance = nil
                }
            }
        }
    }
}
