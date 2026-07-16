import Capacitor
import CoreLocation
import UIKit
import UserNotifications

@objc(GymGeofencePlugin)
public class GymGeofencePlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "GymGeofencePlugin"
    public let jsName = "GymGeofence"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unregister", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise),
    ]

    private let locationManager = CLLocationManager()
    private let prefsKey = "gym_geofence_prefs"
    private let notificationId = "gym_geofence_enter"
    private let lastNotificationKey = "gym_geofence_last_notif_ms"
    private let cooldownMs: Int64 = 4 * 60 * 60 * 1000
    private var pendingPermissionCall: CAPPluginCall?

    public override func load() {
        locationManager.delegate = self
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onAppDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    @objc private func onAppDidBecomeActive() {
        resolvePendingPermissionCall()
    }

    private func resolvePendingPermissionCall() {
        guard let call = pendingPermissionCall else { return }
        pendingPermissionCall = nil
        call.resolve(buildPermissionResult())
    }

    @objc public override func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(buildPermissionResult())
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        let current = buildPermissionResult()
        if current["ready"] as? Bool == true {
            call.resolve(current)
            return
        }
        if current["needsSettings"] as? Bool == true {
            call.resolve(current)
            return
        }
        if pendingPermissionCall != nil {
            call.resolve(buildPermissionResult())
            return
        }

        pendingPermissionCall = call
        let status = locationManager.authorizationStatus
        switch status {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse:
            locationManager.requestAlwaysAuthorization()
        default:
            pendingPermissionCall = nil
            call.resolve(buildPermissionResult())
        }
    }

    @objc func openSettings(_ call: CAPPluginCall) {
        guard let url = URL(string: UIApplication.openSettingsURLString) else {
            call.reject("Impossible d'ouvrir les réglages.")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url)
            call.resolve()
        }
    }

    @objc func register(_ call: CAPPluginCall) {
        guard
            let lat = call.getDouble("lat"),
            let lng = call.getDouble("lng"),
            let radiusM = call.getDouble("radiusM")
        else {
            call.reject("lat, lng et radiusM sont requis.")
            return
        }

        let permissionResult = buildPermissionResult()
        if permissionResult["ready"] as? Bool != true {
            call.reject("Permissions de localisation insuffisantes.", "NOT_AUTHORIZED")
            return
        }

        let identifier = call.getString("identifier") ?? "one-more-home-gym"
        let title = call.getString("notificationTitle") ?? "Tu es à la salle"
        let body = call.getString("notificationBody") ?? "Enregistre ta perf."
        let route = call.getString("deepLinkRoute") ?? "/home"

        UserDefaults.standard.set(title, forKey: "\(prefsKey)_title")
        UserDefaults.standard.set(body, forKey: "\(prefsKey)_body")
        UserDefaults.standard.set(route, forKey: "\(prefsKey)_route")
        UserDefaults.standard.set(identifier, forKey: "\(prefsKey)_id")

        unregisterMonitoredRegions()

        let center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let region = CLCircularRegion(
            center: center,
            radius: min(radiusM, locationManager.maximumRegionMonitoringDistance),
            identifier: identifier
        )
        region.notifyOnEntry = true
        region.notifyOnExit = false

        if CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) {
            locationManager.startMonitoring(for: region)
            call.resolve()
        } else {
            call.reject("Le géofencing n'est pas disponible sur cet appareil.")
        }
    }

    @objc func unregister(_ call: CAPPluginCall) {
        unregisterMonitoredRegions()
        UserDefaults.standard.removeObject(forKey: "\(prefsKey)_title")
        UserDefaults.standard.removeObject(forKey: "\(prefsKey)_body")
        UserDefaults.standard.removeObject(forKey: "\(prefsKey)_route")
        UserDefaults.standard.removeObject(forKey: "\(prefsKey)_id")
        call.resolve()
    }

    private func unregisterMonitoredRegions() {
        for region in locationManager.monitoredRegions {
            locationManager.stopMonitoring(for: region)
        }
    }

    public func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        scheduleEnterNotification()
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard let call = pendingPermissionCall else { return }
        let status = manager.authorizationStatus
        if status == .notDetermined {
            return
        }
        if status == .authorizedWhenInUse {
            manager.requestAlwaysAuthorization()
            return
        }
        call.resolve(buildPermissionResult())
        pendingPermissionCall = nil
    }

    private func buildPermissionResult() -> JSObject {
        let status = locationManager.authorizationStatus
        let locationGranted = status == .authorizedWhenInUse || status == .authorizedAlways
        let backgroundGranted = status == .authorizedAlways
        let needsSettings = status == .authorizedWhenInUse || status == .denied || status == .restricted

        var result = JSObject()
        result["ready"] = backgroundGranted
        result["location"] = locationGranted ? "granted" : "denied"
        result["backgroundLocation"] = backgroundGranted ? "granted" : "denied"
        result["needsSettings"] = needsSettings && !backgroundGranted
        return result
    }

    private func canShowEnterNotification() -> Bool {
        let last = UserDefaults.standard.object(forKey: lastNotificationKey) as? Int64 ?? 0
        if last <= 0 { return true }
        let now = Int64(Date().timeIntervalSince1970 * 1000)
        return now - last >= cooldownMs
    }

    private func markEnterNotificationShown() {
        let now = Int64(Date().timeIntervalSince1970 * 1000)
        UserDefaults.standard.set(now, forKey: lastNotificationKey)
    }

    private func scheduleEnterNotification() {
        guard canShowEnterNotification() else { return }

        let title = UserDefaults.standard.string(forKey: "\(prefsKey)_title") ?? "Tu es à la salle"
        let body = UserDefaults.standard.string(forKey: "\(prefsKey)_body") ?? "Enregistre ta perf."
        let route = UserDefaults.standard.string(forKey: "\(prefsKey)_route") ?? "/home"

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = ["route": route]

        let request = UNNotificationRequest(
            identifier: notificationId,
            content: content,
            trigger: nil
        )

        UNUserNotificationCenter.current().add(request)
        markEnterNotificationShown()
    }
}
