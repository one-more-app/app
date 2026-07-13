import ActivityKit
import SwiftUI
import WidgetKit

private let accentColor = Color(red: 223 / 255, green: 255 / 255, blue: 94 / 255)

@available(iOS 16.2, *)
struct RestTimerLiveActivityView: View {
    let context: ActivityViewContext<RestTimerAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(context.attributes.title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(accentColor)
                Spacer()
                if context.state.isFinished {
                    Text(context.attributes.finishedTitle)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.primary)
                } else {
                    Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                        .font(.title3.monospacedDigit().weight(.semibold))
                        .foregroundStyle(.primary)
                }
            }

            Text(context.attributes.exerciseName)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            ProgressView(value: context.state.isFinished ? 1 : context.state.progress)
                .tint(accentColor)
        }
        .padding(.vertical, 4)
    }
}

@available(iOS 16.2, *)
struct OneMoreRestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            RestTimerLiveActivityView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.85))
                .activitySystemActionForegroundColor(accentColor)
                .widgetURL(URL(string: "https://localhost/#\(context.attributes.deepLinkRoute)"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(accentColor)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isFinished {
                        Text("OK")
                            .font(.caption.weight(.bold))
                    } else {
                        Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                            .font(.caption.monospacedDigit().weight(.semibold))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.exerciseName)
                        .font(.caption2)
                        .lineLimit(1)
                }
            } compactLeading: {
                Image(systemName: "timer")
                    .foregroundStyle(accentColor)
            } compactTrailing: {
                if context.state.isFinished {
                    Image(systemName: "checkmark")
                } else {
                    Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                        .font(.caption2.monospacedDigit())
                }
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(accentColor)
            }
        }
    }
}
