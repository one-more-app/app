import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestTargetMs } from "@/hooks/use-rest-target-ms";
import {
  formatRestElapsed,
  msToRestTargetParts,
  restTargetPartsToMs,
} from "@/lib/format-rest-elapsed";
import { UI } from "@/lib/translations";
import { useMemo } from "react";

const MINUTE_OPTIONS = [0, 1, 2, 3, 4, 5] as const;
const SECOND_OPTIONS = [0, 15, 30, 45] as const;

export function RestTimeSettingsCard() {
  const { targetMs, setTargetMs } = useRestTargetMs();
  const { minutes, seconds } = useMemo(
    () => msToRestTargetParts(targetMs),
    [targetMs],
  );

  const preview = formatRestElapsed(targetMs);

  const handleMinutesChange = (nextMinutes: string) => {
    setTargetMs(restTargetPartsToMs(Number(nextMinutes), seconds));
  };

  const handleSecondsChange = (nextSeconds: string) => {
    setTargetMs(restTargetPartsToMs(minutes, Number(nextSeconds)));
  };

  return (
    <Card id="rest-time-settings">
      <CardHeader>
        <CardTitle>{UI.restTimeSettingsTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {UI.restTimeSettingsDescription}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rest-time-minutes">{UI.restTimeMinutes}</Label>
            <Select value={String(minutes)} onValueChange={handleMinutesChange}>
              <SelectTrigger id="rest-time-minutes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MINUTE_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rest-time-seconds">{UI.restTimeSeconds}</Label>
            <Select value={String(seconds)} onValueChange={handleSecondsChange}>
              <SelectTrigger id="rest-time-seconds">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECOND_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {String(value).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {UI.restTimeCurrent.replace("{time}", preview)}
        </p>
      </CardContent>
    </Card>
  );
}
