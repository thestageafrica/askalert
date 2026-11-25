import {
  buildVendorDocumentPath,
  isAllowedVendorDocumentMime,
  queueScanPlaceholder,
  VENDOR_DOC_MAX_BYTES,
} from './documents';
import type { VendorDocument, VendorDocumentKind } from './types';

export async function prepareVendorDocument(options: {
  file: File;
  kind: VendorDocumentKind;
  ownerUserId: string;
}): Promise<{ ok: true; document: VendorDocument } | { ok: false; error: string }> {
  const { file, kind, ownerUserId } = options;
  if (!isAllowedVendorDocumentMime(file.type)) {
    return { ok: false, error: 'Use JPEG, PNG, WebP or PDF only.' };
  }
  if (file.size > VENDOR_DOC_MAX_BYTES * 2) {
    return { ok: false, error: 'File is too large. Max 5 MB after compress.' };
  }

  let blob: Blob = file;
  let mime = file.type;

  if (file.type.startsWith('image/')) {
    const compressed = await compressImage(file);
    if (!compressed.ok) {
      return compressed;
    }
    blob = compressed.blob;
    mime = compressed.mime;
  }

  if (blob.size > VENDOR_DOC_MAX_BYTES) {
    return { ok: false, error: 'File is still over 5 MB after compress.' };
  }

  const buffer = await blob.arrayBuffer();
  queueScanPlaceholder(buffer);

  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = buildVendorDocumentPath(ownerUserId, id, file.name);
  const url = URL.createObjectURL(blob);

  return {
    ok: true,
    document: {
      id,
      kind,
      fileName: file.name,
      mime,
      bytes: blob.size,
      path: url,
      ownerUserId,
      scanned: true,
      createdAt: new Date().toISOString(),
    },
  };
}

async function compressImage(
  file: File,
): Promise<{ ok: true; blob: Blob; mime: string } | { ok: false; error: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ok: false, error: 'Could not compress that image.' };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const mime =
      file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, mime === 'image/jpeg' ? 0.82 : 0.9),
    );
    if (!blob) {
      return { ok: false, error: 'Could not compress that image.' };
    }
    return { ok: true, blob, mime };
  } catch {
    return { ok: false, error: 'Could not read that image.' };
  }
}
