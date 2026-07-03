import type { Area } from "react-easy-crop";

const PROFILE_AVATAR_KEY = "one-more-profile-avatar";

const MAX_AVATAR_EDGE = 256;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Image illisible")));
    image.src = src;
  });
}

export function getProfileAvatarUrl(): string | null {
  try {
    return localStorage.getItem(PROFILE_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setProfileAvatarUrl(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(PROFILE_AVATAR_KEY, dataUrl);
    } else {
      localStorage.removeItem(PROFILE_AVATAR_KEY);
    }
  } catch {
    // quota ou stockage indisponible
  }
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
