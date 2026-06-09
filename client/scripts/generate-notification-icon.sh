#!/usr/bin/env bash
# Génère ic_stat_notification.png (silhouette blanche du logo) pour Android.
# Prérequis : ImageMagick (`convert`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGO="$ROOT/assets/logo.png"
RES="$ROOT/android/app/src/main/res"
TMP="${TMPDIR:-/tmp}/one-more-notif-icon"

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick (convert) requis." >&2
  exit 1
fi

if [[ ! -f "$LOGO" ]]; then
  echo "Logo introuvable : $LOGO" >&2
  exit 1
fi

mkdir -p "$TMP"
convert "$LOGO" -fuzz 35% -transparent "#DFFF00" "$TMP/base_trans.png"
convert "$TMP/base_trans.png" -fill white -colorize 100% "$TMP/base_white.png"

declare -A SIZES=(
  [drawable-mdpi]=24
  [drawable-hdpi]=36
  [drawable-xhdpi]=48
  [drawable-xxhdpi]=72
  [drawable-xxxhdpi]=96
)

for dir in "${!SIZES[@]}"; do
  out="$RES/$dir"
  mkdir -p "$out"
  convert "$TMP/base_white.png" -resize "${SIZES[$dir]}x${SIZES[$dir]}" "$out/ic_stat_notification.png"
done

echo "Icônes générées dans $RES/drawable-*/ic_stat_notification.png"
