import { ConnectivityStatusLayout } from "@/components/ConnectivityStatusLayout";
import { openAppStoreForUpdate } from "@/lib/app-store";
import { UI } from "@/lib/translations";
import { Download } from "lucide-react";

export function ForceUpdatePage() {
  return (
    <ConnectivityStatusLayout
      icon={Download}
      title={UI.forceUpdateTitle}
      hint={UI.forceUpdateHint}
      iconTone="accent"
      primaryAction={{
        label: UI.forceUpdateCta,
        icon: Download,
        onClick: () => {
          void openAppStoreForUpdate().catch(() => {});
        },
      }}
    />
  );
}
