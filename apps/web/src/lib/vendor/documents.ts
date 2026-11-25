import type { VendorDocument } from './types';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export const VENDOR_DOC_MAX_BYTES = 5 * 1024 * 1024;

export function isAllowedVendorDocumentMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

/** Virus-scan placeholder — always “queued” until a real scanner is wired. */
export function queueScanPlaceholder(_bytes: ArrayBuffer | Uint8Array | null): {
  status: 'queued';
  clean: boolean;
} {
  return { status: 'queued', clean: true };
}

export function vendorOwnsDocument(doc: VendorDocument, userId: string): boolean {
  return doc.ownerUserId === userId;
}

/**
 * Access rules:
 * - Vendor: only own documents (path prefix vendor/{userId}/).
 * - Admin: may request a signed URL for any document (Prompt 27 UI).
 */
export function canAccessVendorDocument(options: {
  doc: VendorDocument;
  viewerUserId: string;
  viewerIsAdmin: boolean;
}): boolean {
  if (options.viewerIsAdmin) {
    return true;
  }
  return vendorOwnsDocument(options.doc, options.viewerUserId);
}

/** Object key inside the private `vendor-documents` bucket: `{userId}/…`. */
export function buildVendorDocumentPath(userId: string, documentId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${documentId}-${safe}`;
}

export function createAdminSignedUrlPlaceholder(path: string, expiresInSeconds = 300): {
  url: string;
  expiresInSeconds: number;
} {
  return {
    url: `https://signed.local/${encodeURIComponent(path)}?exp=${expiresInSeconds}`,
    expiresInSeconds,
  };
}

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length < 4) {
    return '••••';
  }
  return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
