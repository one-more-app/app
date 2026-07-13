import SwiftUI
import WidgetKit

@main
struct OneMoreRestTimerBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.2, *) {
            OneMoreRestTimerLiveActivity()
        }
    }
}
