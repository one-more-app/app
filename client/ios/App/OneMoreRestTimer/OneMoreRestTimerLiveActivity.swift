import ActivityKit
import SwiftUI
import UIKit
import WidgetKit

private enum RestTimerLiveStyle {
    static let accent = Color(red: 223 / 255, green: 255 / 255, blue: 94 / 255)
    static let mutedForeground = Color(white: 0.62)
    static let cardBackground = Color(red: 0.1, green: 0.1, blue: 0.1)
    static let titleFont = Font.system(size: 11, weight: .semibold)
    static let exerciseFont = Font.system(size: 13, weight: .regular)
    static let islandExerciseFont = Font.system(size: 11, weight: .regular)
}

private enum RestTimerBrandCopy {
    static let title = "REPOS ONE MORE"
}

@available(iOS 16.2, *)
private struct RestTimerAppLogoBadge: View {
    var size: CGFloat

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
                .fill(RestTimerLiveStyle.accent)
            Image(systemName: "bolt.fill")
                .font(.system(size: size * 0.46, weight: .black))
                .foregroundStyle(Color.black)
        }
        .frame(width: size, height: size)
    }
}

@available(iOS 16.2, *)
private struct RestTimerAppLogo: View {
    var size: CGFloat

    var body: some View {
        Group {
            if RestTimerWidgetBundle.hasAppLogoAsset {
                appLogoImage
            } else {
                RestTimerAppLogoBadge(size: size)
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
    }

    @ViewBuilder
    private var appLogoImage: some View {
        Image("AppLogo", bundle: RestTimerWidgetBundle.bundle)
            .resizable()
            .renderingMode(.original)
            .interpolation(.high)
            .antialiased(true)
            .scaledToFill()
    }
}

@available(iOS 16.2, *)
private struct RestTimerExerciseName: View {
    let name: String
    var font: Font = RestTimerLiveStyle.exerciseFont

    var body: some View {
        Text(name)
            .font(font)
            .foregroundStyle(RestTimerLiveStyle.mutedForeground)
            .lineLimit(1)
            .truncationMode(.tail)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

@available(iOS 16.2, *)
private struct RestTimerRemainingLabel: View {
    let endDate: Date
    var island = false

    var body: some View {
        Text(timerInterval: Date()...endDate, countsDown: true)
            .font(.system(size: island ? 13 : 22, weight: .bold, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(RestTimerLiveStyle.accent)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .frame(width: island ? 42 : 56, alignment: .trailing)
    }
}

@available(iOS 16.2, *)
private struct RestTimerLiveActivityContent: View {
    let context: ActivityViewContext<RestTimerAttributes>
    var island = false

    var body: some View {
        HStack(alignment: .center, spacing: island ? 8 : 10) {
            RestTimerAppLogo(size: island ? 26 : 34)

            VStack(alignment: .leading, spacing: 3) {
                Text(RestTimerBrandCopy.title)
                    .font(RestTimerLiveStyle.titleFont)
                    .textCase(.uppercase)
                    .tracking(0.4)
                    .foregroundStyle(RestTimerLiveStyle.accent)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                RestTimerExerciseName(
                    name: context.attributes.exerciseName,
                    font: island ? RestTimerLiveStyle.islandExerciseFont : RestTimerLiveStyle.exerciseFont
                )
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .layoutPriority(1)

            RestTimerRemainingLabel(
                endDate: context.state.endDate,
                island: island
            )
            .layoutPriority(2)
        }
        .padding(.horizontal, island ? 10 : 14)
        .padding(.vertical, island ? 8 : 11)
    }
}

@available(iOS 16.2, *)
struct RestTimerLiveActivityView: View {
    let context: ActivityViewContext<RestTimerAttributes>

    var body: some View {
        RestTimerLiveActivityContent(context: context)
    }
}

@available(iOS 16.2, *)
struct OneMoreRestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            RestTimerLiveActivityView(context: context)
                .activityBackgroundTint(RestTimerLiveStyle.cardBackground)
                .activitySystemActionForegroundColor(RestTimerLiveStyle.accent)
                .widgetURL(URL(string: "https://localhost/#\(context.attributes.deepLinkRoute)"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.bottom) {
                    RestTimerLiveActivityContent(context: context, island: true)
                }
            } compactLeading: {
                RestTimerAppLogo(size: 20)
                    .padding(.leading, 1)
            } compactTrailing: {
                RestTimerRemainingLabel(
                    endDate: context.state.endDate,
                    island: true
                )
                .padding(.trailing, 1)
            } minimal: {
                RestTimerAppLogo(size: 18)
            }
        }
    }
}
