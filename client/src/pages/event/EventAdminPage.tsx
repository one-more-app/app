import { EventAdminPasswordGate } from "@/components/event/EventAdminPasswordGate";
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
import {
  createEventEntry,
  dismissEventCelebration,
  fetchEventLeaderboard,
  fetchEventRecentEntries,
  type EventActiveCelebration,
  type EventRecentEntry,
} from "@/lib/event-api";
import { getEventLeagueForPerf } from "@/lib/event-league";
import {
  EVENT_EXERCISES,
  EVENT_EXERCISE_META,
  EVENT_LEADERBOARD_POLL_MS,
  type EventExerciseSlug,
  type EventGenderSlug,
} from "@/lib/event-constants";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function exerciseLabel(exercise: EventExerciseSlug): string {
  return UI[EVENT_EXERCISE_META[exercise].labelKey];
}

function genderLabel(gender: EventGenderSlug): string {
  return gender === "male" ? UI.eventAdminGenderMale : UI.eventAdminGenderFemale;
}

function EventAdminForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<EventGenderSlug>("male");
  const [exercise, setExercise] = useState<EventExerciseSlug>("pull_up");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState<EventRecentEntry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [activeCelebration, setActiveCelebration] =
    useState<EventActiveCelebration | null>(null);
  const [dismissingCelebration, setDismissingCelebration] = useState(false);

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

  const loadCelebration = useCallback(async () => {
    try {
      const response = await fetchEventLeaderboard();
      setActiveCelebration(response.activeCelebration);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadRecent();
    void loadCelebration();
    const interval = window.setInterval(() => {
      void loadCelebration();
    }, EVENT_LEADERBOARD_POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadRecent, loadCelebration]);

  const handleDismissCelebration = async () => {
    setDismissingCelebration(true);
    try {
      await dismissEventCelebration();
      setActiveCelebration(null);
      toast.success(UI.eventAdminCelebrationDismissed);
    } catch {
      toast.error(UI.eventAdminSaveError);
    } finally {
      setDismissingCelebration(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedReps = Number.parseInt(reps, 10);
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !Number.isFinite(parsedReps) ||
      parsedReps < 1
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await createEventEntry({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        gender,
        exercise,
        reps: parsedReps,
        notes: notes.trim() || undefined,
      });

      toast.success(UI.eventAdminEntrySaved);
      if (response.entry.tshirtAwarded) {
        toast.success(UI.eventAdminTshirtWin, { duration: 8000 });
      }
      toast.message(UI.eventAdminRank.replace("{rank}", String(response.entry.rank)));

      setFirstName("");
      setLastName("");
      setEmail("");
      setReps("");
      setNotes("");
      await loadRecent();
      await loadCelebration();
    } catch {
      toast.error(UI.eventAdminSaveError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-8">
      <h1 className="font-one-more text-2xl uppercase italic">{UI.eventAdminTitle}</h1>

      {activeCelebration ? (
        <Card className="border-accent/50 bg-accent/10">
          <CardHeader>
            <CardTitle className="text-accent">{UI.eventAdminCelebrationOnTv}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-one-more text-lg uppercase italic">
              {activeCelebration.displayName}
            </p>
            <p className="text-sm text-muted-foreground">
              {exerciseLabel(activeCelebration.exercise)} · {activeCelebration.reps} reps ·{" "}
              {genderLabel(activeCelebration.gender)}
            </p>
            <p className="text-sm text-muted-foreground">{UI.eventAdminCelebrationHint}</p>
            <Button
              type="button"
              variant="accent"
              className="w-full"
              disabled={dismissingCelebration}
              onClick={() => void handleDismissCelebration()}
            >
              {UI.eventAdminCelebrationDismiss}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle entrée</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
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

            <Input
              label={UI.eventAdminReps}
              type="number"
              inputMode="numeric"
              min={1}
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              required
            />

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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? UI.eventAdminSubmitting : UI.eventAdminSubmit}
            </Button>
          </form>
        </CardContent>
      </Card>

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
    </div>
  );
}

export function EventAdminPage() {
  return (
    <EventWebOnlyGate>
      <EventAdminPasswordGate>
        <EventAdminForm />
      </EventAdminPasswordGate>
    </EventWebOnlyGate>
  );
}
