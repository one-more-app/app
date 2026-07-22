import { ConnectivityStatusLayout } from "@/components/ConnectivityStatusLayout";
import { UI } from "@/lib/translations";
import { Construction } from "lucide-react";

export function MaintenancePage() {
    return (
        <ConnectivityStatusLayout
            icon={Construction}
            title={UI.maintenanceTitle}
            hint={UI.maintenanceHint}
            iconTone="muted"
        />
    );
}
