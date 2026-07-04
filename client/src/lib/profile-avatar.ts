import type { Area } from "react-easy-crop";

const PROFILE_AVATAR_KEY_PREFIX = "one-more-profile-avatar-v2";

const MAX_AVATAR_EDGE = 256;

function avatarStorageKey(userId: string | null | undefined): string | null {
  if (!userId) return null;
  return `${PROFILE_AVATAR_KEY_PREFIX}:${userId}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Image illisible")));
    image.src = src;
  });
}

export function getProfileAvatarUrl(
  userId: string | null | undefined,
): string | null {
  const key = avatarStorageKey(userId);
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setProfileAvatarUrl(
  userId: string | null | undefined,
  dataUrl: string | null,
): void {
  const key = avatarStorageKey(userId);
  if (!key) return;
  try {
    if (dataUrl) {
      localStorage.setItem(key, dataUrl);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // quota ou stockage indisponible
  }
}

export function clearProfileAvatarCache(userId?: string | null): void {
  try {
    if (userId) {
      const key = avatarStorageKey(userId);
      if (key) localStorage.removeItem(key);
      return;
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${PROFILE_AVATAR_KEY_PREFIX}:`)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    // Ancienne clé globale (avant scope par utilisateur)
    localStorage.removeItem("one-more-profile-avatar");
  } catch {
    // stockage indisponible
  }
}

export async function dataUrlToAvatarBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return await response.blob();
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_AVATAR_EDGE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas non disponible");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function cropImageToAvatarDataUrl(
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = MAX_AVATAR_EDGE;
  canvas.height = MAX_AVATAR_EDGE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas non disponible");
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    MAX_AVATAR_EDGE,
    MAX_AVATAR_EDGE,
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}
