#!/usr/bin/env bash
# Génère ic_stat_notification.png (silhouette noire du logo, fond transparent) pour Android.
# Le fond accent de la notification est géré par notification_accent / iconColor (pas dans le PNG).
# Prérequis : ImageMagick (`convert`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGO="$ROOT/assets/logo.png"
RES="$ROOT/android/app/src/main/res"
TMP="${TMPDIR:-/tmp}/one-more-notif-icon"

# Couleur primaire app (alignée sur client/src/index.css)
PRIMARY="#1a1a1a"
ACCENT="#dfff5e"

# Logo : ~90 % du canvas (padding léger).
LOGO_RATIO_PERCENT=90
# Décalage visuel vers la droite.
OFFSET_X_RATIO_PERCENT=3

if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick (convert) requis." >&2
  exit 1
fi

if [[ ! -f "$LOGO" ]]; then
  echo "Logo introuvable : $LOGO" >&2
  exit 1
fi

mkdir -p "$TMP"
# Silhouette noire avec canal alpha propre (PNG32, coins transparents).
convert "$LOGO" -colorspace sRGB \
  -fuzz 35% -transparent "#DFFF00" \
  -fuzz 35% -transparent "$ACCENT" \
  \( +clone -alpha extract -write mpr:alpha +delete \) \
  -fill "$PRIMARY" -colorize 100% \
  mpr:alpha -alpha off -compose CopyOpacity -composite \
  -background none -type TrueColorAlpha \
  -trim +repage \
  PNG32:"$TMP/logo_black.png"

declare -A SIZES=(
  [drawable-mdpi]=24
  [drawable-hdpi]=36
  [drawable-xhdpi]=48
  [drawable-xxhdpi]=72
  [drawable-xxxhdpi]=96
)

for dir in "${!SIZES[@]}"; do
  size="${SIZES[$dir]}"
  out="$RES/$dir"
  mkdir -p "$out"

  logo_size=$(( size * LOGO_RATIO_PERCENT / 100 ))
  offset_x=$(( size * OFFSET_X_RATIO_PERCENT / 100 ))
  if (( offset_x < 1 )); then
    offset_x=1
  fi

  convert -size "${size}x${size}" xc:none \
    \( "$TMP/logo_black.png" -resize "${logo_size}x${logo_size}" \) \
    -gravity center -geometry "+${offset_x}+0" -composite \
    -background none -type TrueColorAlpha \
    -define png:color-type=6 \
    PNG32:"$out/ic_stat_notification.png"
done

echo "Icônes générées dans $RES/drawable-*/ic_stat_notification.png"
