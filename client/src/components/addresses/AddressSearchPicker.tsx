import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  getAddressDetails,
  searchAddresses,
  type AddressDetails,
  type AddressSuggestion,
} from "@/lib/addresses-api";
import { UI } from "@/lib/translations";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type AddressSearchPickerProps = {
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
  onAddressSelected,
  className,
}: AddressSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
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
    if (!query.trim()) return;
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
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
        setQuery(details.label);
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
      <p className="text-sm font-medium text-foreground">
        {UI.tshirtClaimAddressSearch}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {UI.tshirtClaimAddressSearchHint}
      </p>
      <div className="relative mt-2">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="tshirt-address-search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={UI.tshirtClaimAddressSearchPlaceholder}
          className="pl-9"
          autoComplete="off"
        />
      </div>
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
