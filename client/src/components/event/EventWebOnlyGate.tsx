import { UI } from "@/lib/translations";
import { Capacitor } from "@capacitor/core";
import type { ReactNode } from "react";

export function EventWebOnlyGate({ children }: { children: ReactNode }) {
  if (Capacitor.isNativePlatform()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-lg font-medium">{UI.eventStandWebOnly}</p>
          <p className="text-sm text-muted-foreground">{UI.eventStandWebOnlyHint}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
