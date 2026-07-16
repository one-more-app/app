import Foundation
import UIKit

enum RestTimerWidgetBundle {
    static let bundle: Bundle = {
        if let widgetBundle = Bundle(identifier: "com.one-more.app.OneMoreRestTimer") {
            return widgetBundle
        }
        return Bundle.main
    }()

    static var hasAppLogoAsset: Bool {
        UIImage(named: "AppLogo", in: bundle, with: nil) != nil
    }
}
