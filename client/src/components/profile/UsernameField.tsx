import { Input } from "@/components/ui/input";
import {
  checkProfileUsernameAvailability,
  checkUsernameAvailability,
} from "@/lib/profile-username-api";
import { UI } from "@/lib/translations";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { useEffect, useState } from "react";

export type UsernameFieldStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

type UsernameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onStatusChange?: (status: UsernameFieldStatus) => void;
  /** When set, uses authenticated check (excludes current user). */
  useProfileCheck?: boolean;
  autoFocus?: boolean;
  id?: string;
};

export function UsernameField({
  value,
  onChange,
  onStatusChange,
  useProfileCheck = false,
  autoFocus = false,
  id = "username",
}: UsernameFieldProps) {
  const [status, setStatus] = useState<UsernameFieldStatus>("idle");
  const normalized = normalizeUsername(value);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    if (!normalized || !isValidUsername(normalized)) {
      setStatus(normalized.length > 0 ? "invalid" : "idle");
      return;
    }

    setStatus("checking");
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const check = useProfileCheck
            ? checkProfileUsernameAvailability
            : checkUsernameAvailability;
          const result = await check(normalized);
          if (!result.available) {
            setStatus(result.reason === "invalid" ? "invalid" : "taken");
            return;
          }
          setStatus("available");
        } catch {
          setStatus("idle");
        }
      })();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [normalized, useProfileCheck]);

  return (
    <div className="space-y-1">
      <Input
        id={id}
        label={UI.usernameLabel}
        value={value}
        onChange={(e) => onChange(normalizeUsername(e.target.value))}
        placeholder={UI.usernamePlaceholder}
        autoCapitalize="none"
        autoCorrect="off"
        autoFocus={autoFocus}
      />
      <p className="text-xs text-muted-foreground">{UI.usernameHint}</p>
      {status === "checking" ? (
        <p className="text-xs text-muted-foreground">{UI.loading}</p>
      ) : null}
      {status === "invalid" ? (
        <p className="text-xs text-destructive">{UI.usernameInvalid}</p>
      ) : null}
      {status === "taken" ? (
        <p className="text-xs text-destructive">{UI.usernameTaken}</p>
      ) : null}
      {status === "available" ? (
        <p className="text-xs text-emerald-600">
          @{normalized} · {UI.usernameAvailable}
        </p>
      ) : null}
    </div>
  );
}
