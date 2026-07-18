import Capacitor
import Foundation
import UIKit
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
        CAPPluginMethod(name: "consumeSuppressToastExerciseId", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
    ]

    private var completionTimer: Timer?

    public override func load() {
        super.load()
        // Plugin load can run off-main; UIKit + Timer need the main run loop.
        runOnMain { [weak self] in
            self?.resumePersistedTimerIfNeeded()
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        runOnMain { [weak self] in
            self?.startOnMain(call)
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        runOnMain { [weak self] in
            self?.updateOnMain(call)
        }
    }

    @objc func setForegroundVisible(_ call: CAPPluginCall) {
        runOnMain { [weak self] in
            self?.setForegroundVisibleOnMain(call)
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        runOnMain { [weak self] in
            self?.cancelInternal()
            call.resolve()
        }
    }

    @objc func consumeSuppressToastExerciseId(_ call: CAPPluginCall) {
        let key = "rest_timer_suppress_toast_exercise_id"
        let exerciseId = UserDefaults.standard.string(forKey: key)
        if exerciseId != nil {
            UserDefaults.standard.removeObject(forKey: key)
        }
        call.resolve(["exerciseId": exerciseId ?? NSNull()])
    }

    @objc public override func checkPermissions(_ call: CAPPluginCall) {
        Self.resolvePermissionGranted { granted in
            call.resolve(["granted": granted])
        }
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            Self.resolvePermissionGranted { granted in
                call.resolve(["granted": granted])
            }
        }
    }

    private func startOnMain(_ call: CAPPluginCall) {
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

        let appInForeground = UIApplication.shared.applicationState == .active
        let state = RestTimerPersistedState(
            createdAtMs: createdAtMs,
            targetMs: max(0, targetMs),
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            title: title,
            finishedTitle: finishedTitle,
            deepLinkRoute: deepLinkRoute,
            foregroundVisible: !appInForeground,
            activityId: nil
        )

        if !state.isActive() {
            cancelInternal()
            call.resolve()
            return
        }

        applyStart(state: state, call: call)
    }

    private func updateOnMain(_ call: CAPPluginCall) {
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

    private func setForegroundVisibleOnMain(_ call: CAPPluginCall) {
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
            Task { @MainActor in
                await RestTimerActivityManager.setForegroundVisible(visible, state: state)
            }
        }
        scheduleCompletionTimer(for: state)
        if visible {
            scheduleFinishedBackupNotification(for: state)
        } else {
            cancelFinishedBackupNotification()
        }
        call.resolve()
    }

    private func applyStart(state: RestTimerPersistedState, call: CAPPluginCall) {
        let finishStart = { (saved: RestTimerPersistedState) in
            self.saveAndSchedule(saved)
            call.resolve()
        }

        if #available(iOS 16.2, *), state.foregroundVisible {
            Task { @MainActor in
                var saved = state
                if RestTimerActivityManager.isSupported() {
                    saved.activityId = await RestTimerActivityManager.startForBackground(state: state)
                }
                finishStart(saved)
            }
            return
        }

        finishStart(state)
    }

    private func saveAndSchedule(_ state: RestTimerPersistedState) {
        RestTimerPersistence.save(state)
        scheduleCompletionTimer(for: state)
        if state.foregroundVisible {
            scheduleFinishedBackupNotification(for: state)
        } else {
            cancelFinishedBackupNotification()
        }
    }

    private func persistAndSync(state: RestTimerPersistedState) {
        RestTimerPersistence.save(state)
        if #available(iOS 16.2, *) {
            Task { @MainActor in
                if state.foregroundVisible {
                    await RestTimerActivityManager.syncForBackground(state: state)
                }
            }
        }
        scheduleCompletionTimer(for: state)
        if state.foregroundVisible {
            scheduleFinishedBackupNotification(for: state)
        }
    }

    private func cancelInternal() {
        completionTimer?.invalidate()
        completionTimer = nil
        RestTimerPersistence.save(nil)
        if #available(iOS 16.2, *) {
            RestTimerActivityManager.endAllImmediately()
        }
        cancelFinishedBackupNotification()
    }

    /// Must run on the main run loop — `Timer.scheduledTimer` attaches to the current thread's run loop.
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
            Task { @MainActor in
                await RestTimerActivityManager.finish(state: state)
            }
        }
        if state.foregroundVisible {
            scheduleFinishedBackupNotification(for: state, fireImmediately: true)
        }
        RestTimerPersistence.save(nil)
    }

    private func resumePersistedTimerIfNeeded() {
        guard var state = RestTimerPersistence.load(), state.isActive() else {
            cancelInternal()
            return
        }

        let appInForeground = UIApplication.shared.applicationState == .active
        state.foregroundVisible = !appInForeground
        RestTimerPersistence.save(state)

        scheduleCompletionTimer(for: state)
        if state.foregroundVisible {
            scheduleFinishedBackupNotification(for: state)
            if #available(iOS 16.2, *) {
                Task { @MainActor in
                    _ = await RestTimerActivityManager.startForBackground(state: state)
                }
            }
        } else {
            cancelFinishedBackupNotification()
        }
    }

    private func scheduleFinishedBackupNotification(
        for state: RestTimerPersistedState,
        fireImmediately: Bool = false
    ) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            guard Self.notificationAuthorizationGranted(settings.authorizationStatus) else { return }

            DispatchQueue.main.async {
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
        }
    }

    private func cancelFinishedBackupNotification() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [Self.finishedNotificationId])
        center.removeDeliveredNotifications(withIdentifiers: [Self.finishedNotificationId])
    }

    private func runOnMain(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    private static func notificationAuthorizationGranted(_ status: UNAuthorizationStatus) -> Bool {
        switch status {
        case .authorized, .provisional, .ephemeral:
            return true
        default:
            return false
        }
    }

    private static func resolvePermissionGranted(completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let notificationsGranted = notificationAuthorizationGranted(settings.authorizationStatus)
            let granted: Bool
            if #available(iOS 16.2, *) {
                granted = notificationsGranted || RestTimerActivityManager.isSupported()
            } else {
                granted = notificationsGranted
            }
            DispatchQueue.main.async {
                completion(granted)
            }
        }
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
