import ActivityKit
import Foundation

@available(iOS 16.2, *)
enum RestTimerActivityManager {
    private static let activityKind = "rest-timer"

    static func isSupported() -> Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    @discardableResult
    static func start(state: RestTimerPersistedState) throws -> String? {
        let group = DispatchGroup()
        group.enter()
        Task {
            await endAll(dismissalPolicy: .immediate)
            group.leave()
        }
        group.wait()

        let attributes = RestTimerAttributes(
            exerciseName: state.exerciseName,
            exerciseId: state.exerciseId,
            title: state.title,
            finishedTitle: state.finishedTitle,
            deepLinkRoute: state.deepLinkRoute,
            startDate: state.startDate
        )

        let contentState = RestTimerAttributes.ContentState(
            endDate: state.endDate,
            progress: state.progress(at: Date()),
            isFinished: false
        )

        let content = ActivityContent(state: contentState, staleDate: state.endDate)
        let activity = try Activity.request(
            attributes: attributes,
            content: content,
            pushType: nil
        )
        return activity.id
    }

    static func update(state: RestTimerPersistedState) async {
        guard let activity = currentActivity() else { return }
        let now = Date()
        if now >= state.endDate {
            await finish(state: state, playAlert: false)
            return
        }

        let contentState = RestTimerAttributes.ContentState(
            endDate: state.endDate,
            progress: state.progress(at: now),
            isFinished: false
        )
        let content = ActivityContent(state: contentState, staleDate: state.endDate)
        await activity.update(content)
    }

    static func setForegroundVisible(_ visible: Bool, state: RestTimerPersistedState) async {
        if visible {
            if currentActivity() == nil {
                _ = try? start(state: state)
            } else {
                await update(state: state)
            }
            return
        }
        await endAll(dismissalPolicy: .immediate)
    }

    static func finish(state: RestTimerPersistedState, playAlert: Bool) async {
        guard let activity = currentActivity() else { return }

        let contentState = RestTimerAttributes.ContentState(
            endDate: state.endDate,
            progress: 1,
            isFinished: true
        )

        let content = ActivityContent(state: contentState, staleDate: nil)
        if playAlert {
            await activity.end(content, dismissalPolicy: .default)
        } else {
            await activity.end(content, dismissalPolicy: .immediate)
        }
    }

    static func endAll(dismissalPolicy: ActivityUIDismissalPolicy = .immediate) async {
        for activity in Activity<RestTimerAttributes>.activities {
            await activity.end(nil, dismissalPolicy: dismissalPolicy)
        }
    }

    static func endAllImmediately() {
        Task {
            await endAll(dismissalPolicy: .immediate)
        }
    }

    private static func currentActivity() -> Activity<RestTimerAttributes>? {
        Activity<RestTimerAttributes>.activities.first
    }
}

struct RestTimerPersistedState: Codable {
    var createdAtMs: Double
    var targetMs: Double
    var exerciseId: String
    var exerciseName: String
    var title: String
    var finishedTitle: String
    var deepLinkRoute: String
    var foregroundVisible: Bool
    var activityId: String?

    var startDate: Date {
        Date(timeIntervalSince1970: createdAtMs / 1000)
    }

    var endDate: Date {
        Date(timeIntervalSince1970: (createdAtMs + targetMs) / 1000)
    }

    func progress(at date: Date) -> Double {
        let total = targetMs / 1000
        guard total > 0 else { return 1 }
        let elapsed = date.timeIntervalSince(startDate)
        return min(1, max(0, elapsed / total))
    }

    func isActive(at date: Date = Date()) -> Bool {
        date < endDate
    }
}

enum RestTimerPersistence {
    private static let key = "rest_timer_persisted_state_v1"

    static func save(_ state: RestTimerPersistedState?) {
        let defaults = UserDefaults.standard
        guard let state else {
            defaults.removeObject(forKey: key)
            return
        }
        if let data = try? JSONEncoder().encode(state) {
            defaults.set(data, forKey: key)
        }
    }

    static func load() -> RestTimerPersistedState? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(RestTimerPersistedState.self, from: data)
    }
}
