import { EventLiveCounterHero } from "@/components/event/EventLiveCounterHero";
import { EventWebOnlyGate } from "@/components/event/EventWebOnlyGate";
import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEventLeaderboardRealtime } from "@/hooks/use-event-leaderboard-realtime";
import {
  cancelEventAttempt,
  dismissEventTvDisplay,
  fetchEventLeaderboard,
  fetchEventRecentEntries,
  finalizeEventAttempt,
  patchEventAttemptReps,
  softDeleteAllEventEntries,
  startEventAttempt,
  type EventActiveAttempt,
  type EventActiveCelebration,
  type EventAttemptResult,
  type EventLeaderboardBoard,
  type EventLeaderboardResponse,
  type EventRecentEntry,
} from "@/lib/event-api";
import { getEventLeagueForPerf } from "@/lib/event-league";
import { getEventRecordToBeat } from "@/lib/event-record";
import {
  EVENT_EXERCISES,
  EVENT_EXERCISE_META,
  EVENT_LEADERBOARD_POLL_MS,
  EVENT_LEADERBOARD_WS_FALLBACK_POLL_MS,
  type EventExerciseSlug,
  type EventGenderSlug,
} from "@/lib/event-constants";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AdminStep = "info" | "counting" | "result";

function exerciseLabel(exercise: EventExerciseSlug): string {
  return UI[EVENT_EXERCISE_META[exercise].labelKey];
}

function genderLabel(gender: EventGenderSlug): string {
  return gender === "male" ? UI.eventAdminGenderMale : UI.eventAdminGenderFemale;
}

function EventAdminForm() {
  const [step, setStep] = useState<AdminStep>("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<EventGenderSlug>("male");
  const [exercise, setExercise] = useState<EventExerciseSlug>("pull_up");
  const [notes, setNotes] = useState("");
  const [liveAttempt, setLiveAttempt] = useState<EventActiveAttempt | null>(null);
  const [lastResult, setLastResult] = useState<EventAttemptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [recent, setRecent] = useState<EventRecentEntry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [dismissingTv, setDismissingTv] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [serverTvState, setServerTvState] = useState<{
    attempt: EventActiveAttempt | null;
    recentResult: EventAttemptResult | null;
    celebration: EventActiveCelebration | null;
  }>({ attempt: null, recentResult: null, celebration: null });
  const [leaderboardBoard, setLeaderboardBoard] =
    useState<EventLeaderboardBoard | null>(null);
  const resultDismissedRef = useRef(false);
  const dismissedCelebrationEntryIdRef = useRef<string | null>(null);

  const resolveCelebrationForDisplay = useCallback(
    (celebration: EventActiveCelebration | null) => {
      if (
        celebration &&
        celebration.entryId === dismissedCelebrationEntryIdRef.current
      ) {
        return null;
      }
      if (celebration) {
        dismissedCelebrationEntryIdRef.current = null;
      }
      return celebration;
    },
    [],
  );

  const restoreAttemptForm = useCallback((attempt: EventActiveAttempt) => {
    setFirstName(attempt.firstName);
    setLastName(attempt.lastName);
    setEmail(attempt.email);
    setGender(attempt.gender);
    setExercise(attempt.exercise);
    setNotes(attempt.notes ?? "");
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const response = await fetchEventRecentEntries();
      setRecent(response.entries);
    } catch {
      toast.error(UI.eventAdminLoadError);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const applyLeaderboardSync = useCallback(
    (response: EventLeaderboardResponse) => {
      setLeaderboardBoard(response.board);
      setServerTvState({
        attempt: response.activeAttempt,
        recentResult: response.recentResult,
        celebration: resolveCelebrationForDisplay(response.activeCelebration),
      });

      if (resultDismissedRef.current) {
        if (!response.recentResult) {
          resultDismissedRef.current = false;
        }
        return;
      }

      const attempt = response.activeAttempt;
      if (attempt) {
        restoreAttemptForm(attempt);
        setLiveAttempt(attempt);
        setLastResult(null);
        setStep("counting");
        return;
      }

      if (step === "result") {
        if (response.recentResult) {
          setLastResult(response.recentResult);
        } else {
          setLastResult(null);
          setStep("info");
        }
        return;
      }

      if (step === "counting") {
        setLiveAttempt(null);
        if (response.recentResult) {
          setLastResult(response.recentResult);
          setStep("result");
        } else {
          setStep("info");
        }
      }
    },
    [restoreAttemptForm, resolveCelebrationForDisplay, step],
  );

  const pollLeaderboard = useCallback(async () => {
    try {
      const response = await fetchEventLeaderboard();
      applyLeaderboardSync(response);
    } catch {
      /* ignore */
    }
  }, [applyLeaderboardSync]);

  const { connected: realtimeConnected } = useEventLeaderboardRealtime({
    onLeaderboard: applyLeaderboardSync,
    onAttempt: (attempt) => {
      setServerTvState((prev) => ({ ...prev, attempt }));
      if (attempt) {
        restoreAttemptForm(attempt);
        setLiveAttempt(attempt);
        setLastResult(null);
        setStep("counting");
      }
    },
  });

  const loadInitialState = useCallback(async () => {
    try {
      const [recentResponse, leaderboardResponse] = await Promise.all([
        fetchEventRecentEntries(),
        fetchEventLeaderboard(),
      ]);
      setRecent(recentResponse.entries);

      setLeaderboardBoard(leaderboardResponse.board);
      setServerTvState({
        attempt: leaderboardResponse.activeAttempt,
        recentResult: leaderboardResponse.recentResult,
        celebration: resolveCelebrationForDisplay(
          leaderboardResponse.activeCelebration,
        ),
      });

      resultDismissedRef.current = false;

      const attempt = leaderboardResponse.activeAttempt;
      if (attempt) {
        restoreAttemptForm(attempt);
        setLiveAttempt(attempt);
        setLastResult(null);
        setStep("counting");
      } else if (leaderboardResponse.recentResult) {
        setLastResult(leaderboardResponse.recentResult);
        setLiveAttempt(null);
        setStep("result");
      }
    } catch {
      toast.error(UI.eventAdminLoadError);
    } finally {
      setLoadingRecent(false);
      setHydrating(false);
    }
  }, [restoreAttemptForm, resolveCelebrationForDisplay]);

  useEffect(() => {
    void loadInitialState();
    const pollMs = realtimeConnected
      ? EVENT_LEADERBOARD_WS_FALLBACK_POLL_MS
      : EVENT_LEADERBOARD_POLL_MS;
    const interval = window.setInterval(() => {
      void pollLeaderboard();
    }, pollMs);
    return () => window.clearInterval(interval);
  }, [loadInitialState, pollLeaderboard, realtimeConnected]);

  const resetInfoForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setNotes("");
    setGender("male");
    setExercise("pull_up");
  };

  const handleDismissTvDisplay = async () => {
    setDismissingTv(true);
    try {
      await dismissEventTvDisplay();
      resultDismissedRef.current = true;
      dismissedCelebrationEntryIdRef.current =
        serverTvState.celebration?.entryId ?? null;
      setLastResult(null);
      setLiveAttempt(null);
      setServerTvState({ attempt: null, recentResult: null, celebration: null });
      if (step === "result" || step === "counting") {
        resetInfoForm();
        setStep("info");
      }
      toast.success(UI.eventAdminCelebrationDismissed);
    } catch {
      toast.error(UI.eventAdminSaveError);
    } finally {
      setDismissingTv(false);
    }
  };

  const handleStartAttempt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;

    setBusy(true);
    try {
      const response = await startEventAttempt({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        gender,
        exercise,
        notes: notes.trim() || undefined,
      });
      setLiveAttempt(response.attempt);
      resultDismissedRef.current = false;
      setLastResult(null);
      setStep("counting");
    } catch {
      toast.error(UI.eventAdminAttemptError);
    } finally {
      setBusy(false);
    }
  };

  const handlePatchReps = async (nextReps: number) => {
    if (nextReps < 0 || busy) return;

    setBusy(true);
    try {
      const response = await patchEventAttemptReps(nextReps);
      setLiveAttempt(response.attempt);
    } catch {
      toast.error(UI.eventAdminPatchRepsError);
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    if (!liveAttempt || liveAttempt.reps < 1 || busy) {
      toast.error(UI.eventAdminFinalizeMinReps);
      return;
    }

    setBusy(true);
    try {
      const response = await finalizeEventAttempt();
      resultDismissedRef.current = false;
      setLastResult(response.attemptResult);
      setLiveAttempt(null);
      setStep("result");

      toast.success(UI.eventAdminEntrySaved);
      if (response.entry.tshirtAwarded) {
        toast.success(UI.eventAdminTshirtWin, { duration: 8000 });
      }
      toast.message(
        UI.eventAdminRank.replace("{rank}", String(response.entry.rank)),
      );

      await loadRecent();
      await pollLeaderboard();
    } catch {
      toast.error(UI.eventAdminSaveError);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelAttempt = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await cancelEventAttempt();
      setLiveAttempt(null);
      setStep("info");
      toast.message(UI.eventAdminCancelAttemptConfirm);
    } catch {
      toast.error(UI.eventAdminSaveError);
    } finally {
      setBusy(false);
    }
  };

  const handleNewEntry = async () => {
    if (busy) return;

    resultDismissedRef.current = true;
    resetInfoForm();
    setLastResult(null);
    setLiveAttempt(null);
    setStep("info");

    setBusy(true);
    try {
      await dismissEventTvDisplay();
      setServerTvState({ attempt: null, recentResult: null, celebration: null });
    } catch {
      toast.error(UI.eventAdminSaveError);
    } finally {
      setBusy(false);
    }
  };

  const handleSoftDeleteAll = async () => {
    if (busy || resetting || dismissingTv) return;
    if (!window.confirm(UI.eventAdminResetConfirm)) return;

    setResetting(true);
    try {
      await softDeleteAllEventEntries();
      resultDismissedRef.current = true;
      dismissedCelebrationEntryIdRef.current =
        serverTvState.celebration?.entryId ?? null;
      setLiveAttempt(null);
      setLastResult(null);
      setServerTvState({ attempt: null, recentResult: null, celebration: null });
      setRecent([]);
      setLeaderboardBoard(null);
      resetInfoForm();
      setStep("info");
      toast.success(UI.eventAdminResetDone);
      await loadRecent();
    } catch {
      toast.error(UI.eventAdminResetError);
    } finally {
      setResetting(false);
    }
  };

  const tvDisplayActive =
    serverTvState.attempt != null ||
    serverTvState.recentResult != null ||
    serverTvState.celebration != null;

  const tvDisplayKind = serverTvState.attempt
    ? UI.eventAdminTvDisplayLive
    : serverTvState.recentResult
      ? serverTvState.recentResult.beatPreviousLeader
        ? UI.eventAdminTvDisplayRecord
        : UI.eventAdminTvDisplayResult
      : serverTvState.celebration
        ? UI.eventAdminTvDisplayRecord
        : null;

  const tvDisplayName =
    serverTvState.attempt?.displayName ??
    serverTvState.recentResult?.displayName ??
    serverTvState.celebration?.displayName ??
    null;

  const countingLeague =
    liveAttempt && liveAttempt.reps > 0
      ? getEventLeagueForPerf(
          liveAttempt.exercise,
          liveAttempt.gender,
          liveAttempt.reps,
        )
      : null;

  const countingRecordToBeat = liveAttempt
    ? getEventRecordToBeat(
        leaderboardBoard,
        liveAttempt.exercise,
        liveAttempt.gender,
      )
    : null;

  const resultLeague = lastResult
    ? getEventLeagueForPerf(
        lastResult.exercise,
        lastResult.gender,
        lastResult.reps,
      )
    : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-8">
      <h1 className="font-one-more text-2xl uppercase italic">{UI.eventAdminTitle}</h1>

      {tvDisplayActive && tvDisplayKind && tvDisplayName ? (
        <Card className="border-accent/50 bg-accent/10">
          <CardHeader>
            <CardTitle className="text-accent">{UI.eventAdminTvDisplayTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-one-more text-sm uppercase italic tracking-wide text-muted-foreground">
              {tvDisplayKind}
            </p>
            <p className="font-one-more text-lg uppercase italic">{tvDisplayName}</p>
            <p className="text-sm text-muted-foreground">{UI.eventAdminCelebrationHint}</p>
            <Button
              type="button"
              variant="accent"
              className="w-full"
              disabled={dismissingTv || busy}
              onClick={() => void handleDismissTvDisplay()}
            >
              {UI.eventAdminCelebrationDismiss}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hydrating ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-muted-foreground">…</p>
          </CardContent>
        </Card>
      ) : null}

      {!hydrating && step === "info" ? (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle entrée</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleStartAttempt(event)}>
              <Input
                label={UI.eventAdminFirstName}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                autoComplete="given-name"
              />
              <Input
                label={UI.eventAdminLastName}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                autoComplete="family-name"
              />
              <Input
                label={UI.eventAdminEmail}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{UI.eventAdminGender}</span>
                <Select
                  value={gender}
                  onValueChange={(value) => setGender(value as EventGenderSlug)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{UI.eventAdminGenderMale}</SelectItem>
                    <SelectItem value="female">{UI.eventAdminGenderFemale}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{UI.eventAdminExercise}</span>
                <Select
                  value={exercise}
                  onValueChange={(value) => setExercise(value as EventExerciseSlug)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_EXERCISES.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {exerciseLabel(slug)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="event-admin-notes" className="text-sm font-medium">
                  {UI.eventAdminNotesLabel}
                </label>
                <textarea
                  id="event-admin-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={UI.eventAdminNotesPlaceholder}
                  maxLength={500}
                  rows={3}
                  className={cn(
                    "w-full resize-none rounded-lg bg-secondary px-3 py-2 text-base outline-none transition-[color,box-shadow] md:text-sm",
                    "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? UI.eventAdminStartingAttempt : UI.eventAdminStartAttempt}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!hydrating && step === "counting" && liveAttempt ? (
        <Card>
          <CardHeader>
            <CardTitle>{UI.eventAdminCountingTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-3 text-center text-sm">
              <p className="font-one-more text-lg uppercase italic">
                {liveAttempt.displayName}
              </p>
              <p className="mt-1 text-muted-foreground">
                {exerciseLabel(liveAttempt.exercise)} · {genderLabel(liveAttempt.gender)}
              </p>
            </div>

            <EventLiveCounterHero
              reps={liveAttempt.reps}
              league={countingLeague}
              recordToBeat={countingRecordToBeat}
              size="admin"
            />

            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-14 shrink-0 rounded-full"
                aria-label={UI.eventAdminDecreaseReps}
                disabled={busy || liveAttempt.reps <= 0}
                onClick={() => void handlePatchReps(liveAttempt.reps - 1)}
              >
                <Minus className="size-6" />
              </Button>

              <Button
                type="button"
                variant="accent"
                size="icon"
                className="size-16 shrink-0 rounded-full"
                aria-label={UI.eventAdminIncreaseReps}
                disabled={busy}
                onClick={() => void handlePatchReps(liveAttempt.reps + 1)}
              >
                <Plus className="size-7" />
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={busy || liveAttempt.reps < 1}
              onClick={() => void handleFinalize()}
            >
              {busy ? UI.eventAdminValidatingScore : UI.eventAdminValidateScore}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => void handleCancelAttempt()}
            >
              {UI.eventAdminCancelAttempt}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!hydrating && step === "result" && lastResult ? (
        <Card className="border-accent/40">
          <CardHeader>
            <CardTitle>
              {lastResult.beatPreviousLeader
                ? UI.eventAdminResultRecordTitle
                : UI.eventAdminResultTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-one-more text-xl uppercase italic">{lastResult.displayName}</p>
            <p className="font-one-more text-4xl italic tabular-nums text-accent">
              {UI.eventAdminResultScore.replace("{reps}", String(lastResult.reps))}
            </p>
            <p className="font-one-more text-lg uppercase italic">
              {UI.eventAdminResultRank.replace("{rank}", String(lastResult.rank))}
            </p>
            {lastResult.beatPreviousLeader ? (
              <p className="text-sm text-accent">{UI.eventStandCongratsTshirt}</p>
            ) : null}
            {resultLeague ? <RankBadge league={resultLeague} size="md" /> : null}
            <Button
              type="button"
              className="w-full"
              disabled={busy}
              onClick={() => void handleNewEntry()}
            >
              {UI.eventAdminNewEntry}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{UI.eventAdminRecentTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{UI.eventStandEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((entry) => {
                const league = getEventLeagueForPerf(
                  entry.exercise,
                  entry.gender,
                  entry.reps,
                );

                return (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {entry.firstName} {entry.lastName}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span>{exerciseLabel(entry.exercise)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-one-more italic">{entry.reps}</span>
                      {league ? <RankBadge league={league} size="xs" /> : null}
                      <span className="text-muted-foreground">·</span>
                      <span>{genderLabel(entry.gender)}</span>
                      {entry.tshirtAwarded ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-one-more uppercase italic text-accent-foreground">
                          {UI.eventAdminTshirtBadge}
                        </span>
                      ) : null}
                    </div>
                    {entry.notes ? (
                      <p className="mt-1 text-muted-foreground">{entry.notes}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">{UI.eventAdminResetTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{UI.eventAdminResetHint}</p>
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={busy || resetting || dismissingTv || hydrating}
            onClick={() => void handleSoftDeleteAll()}
          >
            {resetting ? UI.eventAdminResetting : UI.eventAdminResetButton}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function EventAdminPage() {
  return (
    <EventWebOnlyGate>
      <EventAdminForm />
    </EventWebOnlyGate>
  );
}
