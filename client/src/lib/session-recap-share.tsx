import {
  SessionRecapShareCard,
  type SessionRecapShareMode,
  type SessionRecapSharePayload,
  type SessionRecapShareVariant,
} from "@/components/share/SessionRecapShareCard";
import { captureShareElement } from "@/lib/celebration-share-capture";
import { saveImageBlob, shareImageBlob } from "@/lib/celebration-share";
import { createShareTrace } from "@/lib/celebration-share-debug";
import { preloadShareImage, resolvePublicAssetUrl } from "@/lib/exercise-share-media";
import { UI } from "@/lib/translations";
import { yieldToMain } from "@/lib/yield-to-main";
import { createRoot } from "react-dom/client";

export type SessionRecapShareOptions = {
  payload: SessionRecapSharePayload;
  variant: SessionRecapShareVariant;
  mode: SessionRecapShareMode;
  photoUrl?: string | null;
};

/** Plus grand côté de la photo embarquée dans l'export (garde la capture rapide). */
const MAX_PHOTO_SIDE = 1920;

/** Lit une photo choisie et la réduit en data URL (pas de CORS à la capture). */
export async function readSharePhoto(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("readAsDataURL"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = source;
  });
  const ratio = Math.min(
    1,
    MAX_PHOTO_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  if (ratio === 1 && file.size < 2_000_000) return source;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * ratio);
  canvas.height = Math.round(image.naturalHeight * ratio);
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Rend la carte hors écran puis la capture en PNG (transparent pour le sticker). */
export async function createSessionRecapBlob(
  options: SessionRecapShareOptions,
): Promise<Blob> {
  const trace = createShareTrace("createSessionRecapBlob", {
    variant: options.variant,
    mode: options.mode,
  });
  await yieldToMain();
  await preloadShareImage(resolvePublicAssetUrl("logo-white-text.png"));

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;z-index:-9999;pointer-events:none";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(<SessionRecapShareCard {...options} />);
    let el: HTMLElement | null = null;
    for (let attempt = 0; attempt < 60 && !el; attempt += 1) {
      el = host.querySelector("[data-share-card-root]");
      if (!el) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
      }
    }
    if (!el) throw new Error("SessionRecapShareCard introuvable");
    return await captureShareElement(el, true, trace, {
      transparent: options.mode === "sticker",
    });
  } finally {
    root.unmount();
    host.remove();
  }
}

function shareKind(variant: SessionRecapShareVariant): string {
  return `session_recap_${variant}`;
}

export async function shareSessionRecapPng(
  options: SessionRecapShareOptions,
): Promise<"shared" | "downloaded"> {
  const trace = createShareTrace("shareSessionRecapPng", {
    variant: options.variant,
  });
  const blob = await createSessionRecapBlob(options);
  return shareImageBlob(
    blob,
    UI.recapStoryShareText,
    shareKind(options.variant),
    trace,
  );
}

export async function saveSessionRecapPng(
  options: SessionRecapShareOptions,
): Promise<"shared" | "downloaded"> {
  const trace = createShareTrace("saveSessionRecapPng", {
    variant: options.variant,
  });
  const blob = await createSessionRecapBlob(options);
  return saveImageBlob(blob, shareKind(options.variant), trace);
}
