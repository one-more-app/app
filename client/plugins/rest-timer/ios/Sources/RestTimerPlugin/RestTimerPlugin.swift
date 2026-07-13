import Capacitor
import Foundation
import UserNotifications

@objc(RestTimerPlugin)
public class RestTimerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RestTimerPlugin"
    public let jsName = "RestTimer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setForegroundVisible", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
    ]

    private var completionTimer: Timer?

    public override func load() {
        super.load()
        resumePersistedTimerIfNeeded()
    }

    @objc func start(_ call: CAPPluginCall) {
        guard let createdAt = call.getString("createdAt"),
              let targetMs = call.getDouble("targetMs") else {
            call.reject("createdAt et targetMs sont requis.")
            return
        }

        let exerciseId = call.getString("exerciseId") ?? ""
        let exerciseName = call.getString("exerciseName") ?? ""
        let title = call.getString("title") ?? "Repos"
        let finishedTitle = call.getString("finishedTitle") ?? "Temps de repos terminé"
        let deepLinkRoute = call.getString("deepLinkRoute") ?? "/home"

        guard let createdAtMs = Self.parseIsoMillis(createdAt) else {
            call.reject("createdAt invalide.")
            return
        }

        let state = RestTimerPersistedState(
            createdAtMs: createdAtMs,
            targetMs: max(0, targetMs),
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            title: title,
            finishedTitle: finishedTitle,
            deepLinkRoute: deepLinkRoute,
            foregroundVisible: true,
            activityId: nil
        )

        if !state.isActive() {
            cancelInternal()
            call.resolve()
            return
        }

        applyStart(state: state, call: call)
    }

    @objc func update(_ call: CAPPluginCall) {
        guard let targetMs = call.getDouble("targetMs") else {
            call.reject("targetMs est requis.")
            return
        }

        guard var state = RestTimerPersistence.load() else {
            call.resolve()
            return
        }

        state.targetMs = max(0, targetMs)
        if !state.isActive() {
            cancelInternal()
            call.resolve()
            return
        }

        persistAndSync(state: state)
        call.resolve()
    }

    @objc func setForegroundVisible(_ call: CAPPluginCall) {
        guard let visible = call.getBool("visible") else {
            call.reject("visible est requis.")
            return
        }

        guard var state = RestTimerPersistence.load() else {
            call.resolve()
            return
        }

        state.foregroundVisible = visible
        if !state.isActive() {
            cancelInternal()
            call.resolve()
            return
        }

        RestTimerPersistence.save(state)
        if #available(iOS 16.2, *) {
            Task {
                await RestTimerActivityManager.setForegroundVisible(visible, state: state)
            }
        }
        scheduleCompletionTimer(for: state)
        call.resolve()
    }

    @objc func cancel(_ call: CAPPluginCall) {
        cancelInternal()
        call.resolve()
    }

    @objc func checkPermissions(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            let granted = RestTimerActivityManager.isSupported()
            call.resolve(["granted": granted])
            return
        }
        call.resolve(["granted": false])
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            DispatchQueue.main.async {
                self.checkPermissions(call)
            }
        }
    }

    private func applyStart(state: RestTimerPersistedState, call: CAPPluginCall) {
        var next = state
        if #available(iOS 16.2, *) {
            do {
                next.activityId = try RestTimerActivityManager.start(state: state)
            } catch {
                call.reject("Impossible de démarrer la Live Activity: \(error.localizedDescription)")
                return
            }
        }

        RestTimerPersistence.save(next)
        scheduleCompletionTimer(for: next)
        scheduleFinishedBackupNotification(for: next)
        call.resolve()
    }

    private func persistAndSync(state: RestTimerPersistedState) {
        RestTimerPersistence.save(state)
        if #available(iOS 16.2, *) {
            Task {
                await RestTimerActivityManager.update(state: state)
            }
        }
        scheduleCompletionTimer(for: state)
        scheduleFinishedBackupNotification(for: state)
    }

    private func cancelInternal() {
        completionTimer?.invalidate()
        completionTimer = nil
        RestTimerPersistence.save(nil)
        if #available(iOS 16.2, *) {
            RestTimerActivityManager.endAllImmediately()
        }
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: [Self.finishedNotificationId]
        )
        UNUserNotificationCenter.current().removeDeliveredNotifications(
            withIdentifiers: [Self.finishedNotificationId]
        )
    }

    private func scheduleCompletionTimer(for state: RestTimerPersistedState) {
        completionTimer?.invalidate()
        let interval = state.endDate.timeIntervalSinceNow
        guard interval > 0 else {
            handleCompletion(state: state)
            return
        }
        completionTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: false) { [weak self] _ in
            guard let state = RestTimerPersistence.load() else { return }
            self?.handleCompletion(state: state)
        }
    }

    private func handleCompletion(state: RestTimerPersistedState) {
        if #available(iOS 16.2, *) {
            Task {
                await RestTimerActivityManager.finish(state: state, playAlert: !state.foregroundVisible)
            }
        }
        if !state.foregroundVisible {
            scheduleFinishedBackupNotification(for: state, fireImmediately: true)
        }
        RestTimerPersistence.save(nil)
    }

    private func resumePersistedTimerIfNeeded() {
        guard let state = RestTimerPersistence.load(), state.isActive() else {
            cancelInternal()
            return
        }
        scheduleCompletionTimer(for: state)
        if state.foregroundVisible, #available(iOS 16.2, *) {
            _ = try? RestTimerActivityManager.start(state: state)
        }
    }

    private func scheduleFinishedBackupNotification(
        for state: RestTimerPersistedState,
        fireImmediately: Bool = false
    ) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [Self.finishedNotificationId])

        let content = UNMutableNotificationContent()
        content.title = state.finishedTitle
        content.body = state.exerciseName
        content.sound = .default
        content.userInfo = ["route": state.deepLinkRoute]

        let trigger: UNNotificationTrigger?
        if fireImmediately {
            trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.2, repeats: false)
        } else {
            let interval = max(1, state.endDate.timeIntervalSinceNow)
            trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        }

        let request = UNNotificationRequest(
            identifier: Self.finishedNotificationId,
            content: content,
            trigger: trigger
        )
        center.add(request)
    }

    private static let finishedNotificationId = "rest-timer-finished-42"

    private static func parseIsoMillis(_ value: String) -> Double? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: value) {
            return date.timeIntervalSince1970 * 1000
        }
        formatter.formatOptions = [.withInternetDateTime]
        guard let date = formatter.date(from: value) else { return nil }
        return date.timeIntervalSince1970 * 1000
    }
}
