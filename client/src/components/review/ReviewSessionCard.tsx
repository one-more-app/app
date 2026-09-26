import { Button } from "@/components/ui/button";
import { AnalyticsEvents, track } from "@/lib/analytics";
import {
  openStoreReviewListing,
  setReviewSessionCardPending,
} from "@/lib/app-review";
import { getReviewCopy } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
  onDismissCard: () => void;
};

export function ReviewSessionCard({ onDismissCard }: Props) {
  const copy = getReviewCopy();

  useEffect(() => {
    track(AnalyticsEvents.REVIEW_SESSION_CARD_SHOWN, {});
  }, []);

  const handleStore = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast(copy.toast.storeOffline);
      return;
    }
    track(AnalyticsEvents.REVIEW_STORE_OPENED, { source: "session_card" });
    await openStoreReviewListing();
    setReviewSessionCardPending(false);
    onDismissCard();
  };

  const handleDismiss = () => {
    track(AnalyticsEvents.REVIEW_SESSION_CARD_DISMISSED, {});
    setReviewSessionCardPending(false);
    onDismissCard();
  };

  if (!Capacitor.isNativePlatform()) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {copy.sessionSummaryCard.title}
        </p>
        <p className="text-sm text-muted-foreground">
          {copy.sessionSummaryCard.text}
        </p>
      </div>
      <Button variant="accent" className="w-full" onClick={() => void handleStore()}>
        {copy.sessionSummaryCard.cta}
      </Button>
      <button
        type="button"
        className="w-full py-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={handleDismiss}
      >
        {copy.sessionSummaryCard.dismiss}
      </button>
    </div>
  );
}
