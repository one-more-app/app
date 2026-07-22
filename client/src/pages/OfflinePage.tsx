import { ConnectivityStatusLayout } from "@/components/ConnectivityStatusLayout";
import { UI } from "@/lib/translations";
import { WifiOff } from "lucide-react";

export function OfflinePage() {
    return (
        <ConnectivityStatusLayout
            icon={WifiOff}
            title={UI.offlineTitle}
            hint={UI.offlineHint}
            iconTone="muted"
        />
    );
}
