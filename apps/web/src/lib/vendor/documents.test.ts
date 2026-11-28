import { describe, expect, it } from 'vitest';
import {
  buildVendorDocumentPath,
  canAccessVendorDocument,
  createAdminSignedUrlPlaceholder,
  isAllowedVendorDocumentMime,
  maskAccountNumber,
  maskIdentityNumber,
  vendorOwnsDocument,
} from './documents';
import type { VendorDocument } from './types';

const doc: VendorDocument = {
  id: 'doc_1',
  kind: 'id',
  fileName: 'id.jpg',
  mime: 'image/jpeg',
  bytes: 1200,
  path: 'user-a/doc_1-id.jpg',
  ownerUserId: 'user-a',
  scanned: true,
  createdAt: new Date().toISOString(),
};

describe('vendor document access rules', () => {
  it('allows only owner vendor to see their document', () => {
    expect(vendorOwnsDocument(doc, 'user-a')).toBe(true);
    expect(canAccessVendorDocument({ doc, viewerUserId: 'user-a', viewerIsAdmin: false })).toBe(
      true,
    );
    expect(canAccessVendorDocument({ doc, viewerUserId: 'user-b', viewerIsAdmin: false })).toBe(
      false,
    );
  });

  it('allows admin signed URL access', () => {
    expect(canAccessVendorDocument({ doc, viewerUserId: 'admin', viewerIsAdmin: true })).toBe(
      true,
    );
    const signed = createAdminSignedUrlPlaceholder(doc.path, 120);
    expect(signed.url).toContain(encodeURIComponent(doc.path));
    expect(signed.expiresInSeconds).toBe(120);
  });

  it('validates mime and path shape', () => {
    expect(isAllowedVendorDocumentMime('application/pdf')).toBe(true);
    expect(isAllowedVendorDocumentMime('text/plain')).toBe(false);
    expect(buildVendorDocumentPath('user-a', 'doc_1', 'my id.jpg')).toBe(
      'user-a/doc_1-my_id.jpg',
    );
    expect(maskAccountNumber('0123456789')).toBe('••••••6789');
    expect(maskIdentityNumber('12345678901')).toBe('•••••••8901');
  });
});
