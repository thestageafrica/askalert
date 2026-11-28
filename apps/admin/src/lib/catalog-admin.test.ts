import { describe, expect, it } from 'vitest';
import {
  archiveCatalogService,
  publishCatalogCategory,
  rollbackCatalogCategory,
  seedCatalogAdminState,
  upsertCatalogCategory,
} from './catalog-admin';
import { canEditCatalog, canPublishCatalog } from './roles';

describe('catalog admin roles', () => {
  it('allows operations to edit and publish catalog', () => {
    expect(canEditCatalog('operations')).toBe(true);
    expect(canPublishCatalog('operations')).toBe(true);
    expect(canPublishCatalog('support')).toBe(false);
  });
});

describe('catalog admin publish flow', () => {
  it('publishes a version and can roll back', () => {
    let state = seedCatalogAdminState();
    const category = state.working.find((item) => item.category_slug === 'events');
    expect(category).toBeDefined();

    const renamed = {
      ...category!,
      category_name: 'Events Lagos',
    };
    const upserted = upsertCatalogCategory(state, renamed, 'operations');
    expect(upserted.ok).toBe(true);
    if (!upserted.ok) {
      return;
    }
    state = upserted.state;

    const published = publishCatalogCategory(state, 'events', 'Rename events', 'operations');
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }
    state = published.state;
    expect(state.versions[0]?.version).toBe(1);

    const again = publishCatalogCategory(state, 'events', 'Second publish', 'operations');
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    state = again.state;
    expect(state.versions[0]?.version).toBe(2);

    const first = state.versions.find((item) => item.version === 1);
    expect(first).toBeDefined();
    const rolled = rollbackCatalogCategory(state, first!.id, 'operations');
    expect(rolled.ok).toBe(true);
    if (!rolled.ok) {
      return;
    }
    expect(
      rolled.state.working.find((item) => item.category_slug === 'events')?.category_name,
    ).toBe('Events Lagos');
  });

  it('archives a service instead of deleting it', () => {
    const state = seedCatalogAdminState();
    const events = state.working.find((item) => item.category_slug === 'events')!;
    const serviceSlug = events.services[0]!.slug;
    const archived = archiveCatalogService(state, 'events', serviceSlug, 'super_admin');
    expect(archived.ok).toBe(true);
    if (!archived.ok) {
      return;
    }
    expect(
      archived.state.working
        .find((item) => item.category_slug === 'events')
        ?.services.find((service) => service.slug === serviceSlug)?.status,
    ).toBe('archived');
  });
});
