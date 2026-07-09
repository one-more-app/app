import Capacitor
import CoreLocation
import UserNotifications

@objc(GymGeofencePlugin)
public class GymGeofencePlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "GymGeofencePlugin"
    public let jsName = "GymGeofence"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "register", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unregister", returnType: CAPPluginReturnPromise),
    ]

    private let locationManager = CLLocationManager()
    private let prefsKey = "gym_geofence_prefs"
    private let notificationId = "gym_geofence_enter"

    public override func load() {
        locationManager.delegate = self
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
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
            locationManager.requestAlwaysAuthorization()
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

    private func scheduleEnterNotification() {
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
    }
}
