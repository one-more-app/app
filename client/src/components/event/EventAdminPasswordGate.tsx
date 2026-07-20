import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EVENT_ADMIN_PASSWORD,
  EVENT_ADMIN_UNLOCK_KEY,
} from "@/lib/event-constants";
import { UI } from "@/lib/translations";
import { useState, type ReactNode } from "react";

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(EVENT_ADMIN_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function EventAdminPasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          if (password === EVENT_ADMIN_PASSWORD) {
            try {
              sessionStorage.setItem(EVENT_ADMIN_UNLOCK_KEY, "1");
            } catch {
              /* ignore */
            }
            setError(null);
            setUnlocked(true);
            return;
          }
          setError(UI.eventAdminPasswordWrong);
        }}
      >
        <h1 className="font-one-more text-lg uppercase italic">{UI.eventAdminTitle}</h1>
        <Input
          type="password"
          label={UI.eventAdminPasswordPrompt}
          placeholder={UI.eventAdminPasswordPlaceholder}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          autoComplete="current-password"
          aria-invalid={error != null}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full">
          {UI.eventAdminPasswordSubmit}
        </Button>
      </form>
    </div>
  );
}
