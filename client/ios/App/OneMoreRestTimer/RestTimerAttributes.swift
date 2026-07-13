import ActivityKit
import Foundation

public struct RestTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var endDate: Date
        public var progress: Double
        public var isFinished: Bool

        public init(endDate: Date, progress: Double, isFinished: Bool) {
            self.endDate = endDate
            self.progress = progress
            self.isFinished = isFinished
        }
    }

    public var exerciseName: String
    public var exerciseId: String
    public var title: String
    public var finishedTitle: String
    public var deepLinkRoute: String
    public var startDate: Date

    public init(
        exerciseName: String,
        exerciseId: String,
        title: String,
        finishedTitle: String,
        deepLinkRoute: String,
        startDate: Date
    ) {
        self.exerciseName = exerciseName
        self.exerciseId = exerciseId
        self.title = title
        self.finishedTitle = finishedTitle
        self.deepLinkRoute = deepLinkRoute
        self.startDate = startDate
    }
}
