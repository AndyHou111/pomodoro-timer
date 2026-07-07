import SwiftUI
import AppKit

class FloatingPanelManager {
    static let shared = FloatingPanelManager()
    private var panel: NSPanel?
    private var hostingView: NSHostingView<AnyView>?

    func toggle(with viewModel: TimerViewModel) {
        if let panel = panel, panel.isVisible {
            close()
        } else {
            show(with: viewModel)
        }
    }

    func show(with viewModel: TimerViewModel) {
        close()

        let content = FloatingTimerView().environmentObject(viewModel)
        hostingView = NSHostingView(rootView: AnyView(content))

        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 180, height: 250),
            styleMask: [.titled, .closable, .nonactivatingPanel, .resizable],
            backing: .buffered,
            defer: false
        )

        panel.title = "🍅 番茄钟"
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
        panel.isFloatingPanel = true
        panel.becomesKeyOnlyIfNeeded = true
        panel.hidesOnDeactivate = false
        panel.titlebarAppearsTransparent = true
        panel.standardWindowButton(.miniaturizeButton)?.isHidden = true
        panel.standardWindowButton(.zoomButton)?.isHidden = true
        panel.contentView = hostingView
        panel.contentMinSize = NSSize(width: 160, height: 200)
        panel.isReleasedWhenClosed = false

        // Position at top-right of screen
        if let screen = NSScreen.main {
            let screenFrame = screen.visibleFrame
            let x = screenFrame.maxX - 200
            let y = screenFrame.maxY - 270
            panel.setFrameOrigin(NSPoint(x: x, y: y))
        }

        panel.makeKeyAndOrderFront(nil)
        self.panel = panel
    }

    func close() {
        panel?.close()
        panel = nil
        hostingView = nil
    }

    func updateIfOpen(with viewModel: TimerViewModel) {
        guard let panel = panel, panel.isVisible, let hostingView = hostingView else { return }
        hostingView.rootView = AnyView(FloatingTimerView().environmentObject(viewModel))
    }
}
