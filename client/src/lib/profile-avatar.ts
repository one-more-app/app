const PROFILE_AVATAR_KEY = "one-more-profile-avatar";

const MAX_AVATAR_EDGE = 256;

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
