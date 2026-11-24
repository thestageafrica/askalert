const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_PER_THREAD = 5;

export type PreparedChatImage = {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  url: string;
  bytes: number;
};

export function countThreadImages(mediaCounts: number[]): number {
  return mediaCounts.reduce((sum, n) => sum + n, 0);
}

export async function prepareChatImage(
  file: File,
  existingCount: number,
): Promise<{ ok: true; image: PreparedChatImage } | { ok: false; error: string }> {
  if (existingCount >= MAX_PER_THREAD) {
    return { ok: false, error: 'This chat already has 5 photos.' };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: 'Use JPEG, PNG or WebP only.' };
  }
  if (file.size > MAX_BYTES * 2) {
    return { ok: false, error: 'Photo is too large. Max 3 MB after compress.' };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: false, error: 'Could not compress that photo.' };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const mime: PreparedChatImage['mime'] =
      file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, mime === 'image/jpeg' ? 0.82 : 0.92),
    );
    if (!blob) {
      return { ok: false, error: 'Could not compress that photo.' };
    }
    if (blob.size > MAX_BYTES) {
      return { ok: false, error: 'Photo is still over 3 MB after compress.' };
    }
    return {
      ok: true,
      image: {
        mime,
        url: URL.createObjectURL(blob),
        bytes: blob.size,
      },
    };
  } catch {
    return { ok: false, error: 'Could not read that photo.' };
  }
}
