import AppTrackingTransparency
import Capacitor
import FBSDKCoreKit
import UIKit

@objc(AdsTrackingPlugin)
public class AdsTrackingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AdsTrackingPlugin"
    public let jsName = "AdsTracking"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
    ]

    @objc func getStatus(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["status": self.currentStatus()])
        }
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.requestAtt(call)
        }
    }

    private func requestAtt(_ call: CAPPluginCall) {
        if #available(iOS 14, *) {
            let apply: (ATTrackingManager.AuthorizationStatus) -> Void = { status in
                self.syncFacebookAdvertiserTracking(authorized: status == .authorized)
                call.resolve(["status": self.map(status)])
            }

            if ATTrackingManager.trackingAuthorizationStatus != .notDetermined {
                apply(ATTrackingManager.trackingAuthorizationStatus)
                return
            }

            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    apply(status)
                }
            }
            return
        }

        syncFacebookAdvertiserTracking(authorized: true)
        call.resolve(["status": "authorized"])
    }

    private func currentStatus() -> String {
        if #available(iOS 14, *) {
            return map(ATTrackingManager.trackingAuthorizationStatus)
        }
        return "authorized"
    }

    private func map(_ status: ATTrackingManager.AuthorizationStatus) -> String {
        switch status {
        case .authorized:
            return "authorized"
        case .denied:
            return "denied"
        case .restricted:
            return "restricted"
        case .notDetermined:
            return "notDetermined"
        @unknown default:
            return "unavailable"
        }
    }

    /// Meta Events Manager : AdvertisingTrackingEnabled = ATT accepté.
    /// iOS 17+ : le SDK lit aussi ATT tout seul ; on le pose quand même pour le checklist Meta.
    private func syncFacebookAdvertiserTracking(authorized: Bool) {
        Settings.shared.isAdvertiserIDCollectionEnabled = true
        Settings.shared.isAdvertiserTrackingEnabled = authorized
    }
}
