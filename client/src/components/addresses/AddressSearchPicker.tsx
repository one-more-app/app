import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  getAddressDetails,
  searchAddresses,
  type AddressDetails,
  type AddressSuggestion,
} from "@/lib/addresses-api";
import { UI } from "@/lib/translations";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type AddressSearchPickerProps = {
  value: string;
  onChange: (value: string) => void;
  onAddressSelected: (details: AddressDetails) => void;
  className?: string;
};

function addressSearchErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    (error.status === 404 || error.status === 503 || error.status === 0)
  ) {
    return UI.tshirtClaimAddressSearchUnavailable;
  }
  return UI.tshirtClaimAddressSearchEmpty;
}

export function AddressSearchPicker({
  value,
  onChange,
  onAddressSelected,
  className,
}: AddressSearchPickerProps) {
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipNextSearchRef = useRef(false);

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const items = await searchAddresses({ q: trimmed });
      setResults(items);
      if (items.length === 0) {
        setError(UI.tshirtClaimAddressSearchEmpty);
      }
    } catch (err) {
      setResults([]);
      setError(addressSearchErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (!value.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void runSearch(value);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [value, runSearch]);

  const handleChange = (next: string) => {
    onChange(next);
    if (!next.trim()) {
      setResults([]);
      setError(null);
    }
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    void (async () => {
      setSearching(true);
      setError(null);
      try {
        const details = await getAddressDetails(suggestion.placeId);
        skipNextSearchRef.current = true;
        setResults([]);
        onAddressSelected(details);
      } catch (err) {
        setError(addressSearchErrorMessage(err));
      } finally {
        setSearching(false);
      }
    })();
  };

  return (
    <div className={className}>
      <Input
        id="tshirt-street"
        label={UI.tshirtClaimStreet}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={UI.tshirtClaimAddressSearchPlaceholder}
        autoComplete="street-address"
      />
      {searching ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {UI.gymOnboardingWaitGymSearching}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/80 bg-muted/20 p-2">
          {results.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted/60"
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
