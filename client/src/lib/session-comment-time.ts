export function formatSessionCommentTime(
  createdAt: string,
  nowMs: number = Date.now(),
): string {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return "";
  const diffMs = Math.max(0, nowMs - created);
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) {
    const n = Math.max(1, min);
    return `il y a ${n} min`;
  }
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }
  return new Date(created).toLocaleDateString("fr-FR", { weekday: "long" });
}
