import {
  findCatalogSeedBySlug,
  listCatalogSeeds,
  type CatalogCategorySeed,
} from '@askalert/catalog';
import { listGeoSeedNodes, listLocationsForState, listStates } from '@askalert/geo';
import { parseFreeTextRequest } from './free-text';
import {
  buildListMessage,
  buildReplyButtons,
  buildTextMessage,
} from './whatsapp-builders';
import {
  createCaptureSession,
  type AdvanceCaptureResult,
  type CaptureDraft,
  type CaptureInbound,
  type CaptureOutbound,
  type CaptureSession,
  type CaptureStep,
  type InvolvementMode,
} from './types';

function stamp(
  session: CaptureSession,
  role: 'user' | 'assistant' | 'system',
  text: string,
): CaptureSession {
  return {
    ...session,
    history: [
      ...session.history,
      { role, text, at: new Date().toISOString() },
    ].slice(-80),
    updatedAt: new Date().toISOString(),
  };
}

function withDraft(session: CaptureSession, patch: Partial<CaptureDraft>): CaptureSession {
  return {
    ...session,
    draft: { ...session.draft, ...patch },
    updatedAt: new Date().toISOString(),
  };
}

function promptForStep(session: CaptureSession, page = 0): CaptureOutbound {
  const seeds = listCatalogSeeds();
  const nodes = listGeoSeedNodes();

  switch (session.step) {
    case 'category':
      return buildListMessage(
        'What do you need help with?',
        seeds.map((seed) => ({
          id: `category:${seed.category_slug}`,
          title: seed.category_name,
        })),
        { page, buttonLabel: 'Categories' },
      );
    case 'type': {
      const seed = findCatalogSeedBySlug(session.draft.categorySlug ?? '');
      return buildListMessage(
        `Which ${(seed?.type_label ?? 'type').toLowerCase()} is this?`,
        (seed?.types ?? [])
          .filter((type) => type.status === 'active')
          .map((type) => ({ id: `type:${type.slug}`, title: type.name })),
        { page, buttonLabel: 'Types' },
      );
    }
    case 'services': {
      const seed = findCatalogSeedBySlug(session.draft.categorySlug ?? '');
      const typeSlug = session.draft.typeSlug;
      const services = (seed?.services ?? []).filter(
        (service) =>
          service.status === 'active' &&
          (!typeSlug || service.type_slugs.includes(typeSlug)),
      );
      const rows = services.map((service) => ({
        id: `service:${service.slug}`,
        title: service.name,
      }));
      if (session.draft.items.length > 0) {
        rows.unshift({ id: 'services:done', title: 'Done' });
      }
      return buildListMessage(
        session.draft.items.length > 0
          ? 'Add another service, or tap Done.'
          : 'Which services do you need?',
        rows,
        { page, buttonLabel: 'Services' },
      );
    }
    case 'details': {
      const item = session.draft.items.find((row) => row.quantity == null);
      const seed = findCatalogSeedBySlug(session.draft.categorySlug ?? '');
      const service = seed?.services.find((row) => row.slug === item?.serviceSlug);
      const bands = service?.default_bands?.slice(0, 3) ?? [];
      const hint =
        bands.length > 0
          ? ` Band hints: ${bands.map((band) => `${band.dimMin}–${band.dimMax}`).join(', ')}.`
          : '';
      return buildTextMessage(
        `How many ${service?.dimension_label ?? service?.name ?? 'units'} for ${service?.name ?? 'this service'}?${hint}`,
      );
    }
    case 'date':
      return buildTextMessage('What date do you need this? (for example 20 December)');
    case 'location_state':
      return buildListMessage(
        'Which state?',
        listStates(nodes).map((state) => ({
          id: `state:${state.slug}`,
          title: state.name,
        })),
        { page, buttonLabel: 'States' },
      );
    case 'location_place':
      return buildListMessage(
        'Which location?',
        listLocationsForState(session.draft.stateSlug ?? 'lagos', nodes, {
          includeStatewide: false,
        }).map((node) => ({
          id: `place:${node.slug}`,
          title: node.name,
        })),
        { page, buttonLabel: 'Locations' },
      );
    case 'budget':
      return buildReplyButtons('Do you have a maximum budget?', [
        { id: 'budget:skip', title: 'Skip' },
        { id: 'budget:ask', title: 'Enter amount' },
      ]);
    case 'mode':
      return buildReplyButtons('How involved should AskAlert be?', [
        { id: 'mode:match', title: 'Match' },
        { id: 'mode:assist', title: 'Assist' },
        { id: 'mode:autopilot', title: 'Autopilot' },
      ]);
    case 'confirm':
      return buildReplyButtons(summarizeDraft(session.draft), [
        { id: 'confirm:submit', title: 'Submit' },
        { id: 'confirm:edit', title: 'Edit' },
        { id: 'confirm:cancel', title: 'Cancel' },
      ]);
    case 'done':
      return buildTextMessage('Request captured. We are matching vendors now.');
    case 'cancelled':
      return buildTextMessage('Cancelled. Send a new message anytime to start again.');
    default:
      return buildTextMessage('Tell me what you need.');
  }
}

export function summarizeDraft(draft: CaptureDraft): string {
  const seed = draft.categorySlug ? findCatalogSeedBySlug(draft.categorySlug) : null;
  const typeName = seed?.types.find((type) => type.slug === draft.typeSlug)?.name ?? draft.typeSlug;
  const services = draft.items
    .map((item) => {
      const name =
        seed?.services.find((service) => service.slug === item.serviceSlug)?.name ??
        item.serviceSlug;
      return `${name}${item.quantity != null ? ` × ${item.quantity}` : ''}`;
    })
    .join(', ');
  return [
    'Please confirm your ask:',
    `• ${seed?.category_name ?? draft.categorySlug ?? 'Category'} · ${typeName ?? 'Type'}`,
    `• ${services || 'No services'}`,
    `• ${draft.startDate ?? 'Date TBD'} · ${draft.locationSlug ?? 'Location TBD'}`,
    draft.budgetMaxMinor != null
      ? `• Budget up to ₦${Math.round(draft.budgetMaxMinor / 100).toLocaleString('en-NG')}`
      : '• Budget not set',
    `• Mode: ${draft.involvement ?? 'assist'}`,
  ].join('\n');
}

function nextAfterServices(session: CaptureSession): CaptureStep {
  if (session.draft.items.some((item) => item.quantity == null)) {
    return 'details';
  }
  return 'date';
}

function applyTap(session: CaptureSession, id: string): CaptureSession {
  if (id.startsWith('more:')) {
    return session;
  }
  if (id.startsWith('category:')) {
    return {
      ...withDraft(session, {
        categorySlug: id.slice('category:'.length),
        typeSlug: null,
        items: [],
      }),
      step: 'type',
    };
  }
  if (id.startsWith('type:')) {
    return {
      ...withDraft(session, { typeSlug: id.slice('type:'.length), items: [] }),
      step: 'services',
      pendingServiceLoop: true,
    };
  }
  if (id === 'services:done') {
    return { ...session, step: nextAfterServices(session), pendingServiceLoop: false };
  }
  if (id.startsWith('service:')) {
    const serviceSlug = id.slice('service:'.length);
    if (session.draft.items.some((item) => item.serviceSlug === serviceSlug)) {
      return session;
    }
    return withDraft(session, {
      items: [...session.draft.items, { serviceSlug, quantity: null }],
    });
  }
  if (id.startsWith('state:')) {
    return {
      ...withDraft(session, {
        stateSlug: id.slice('state:'.length),
        locationSlug: null,
      }),
      step: 'location_place',
    };
  }
  if (id.startsWith('place:')) {
    return {
      ...withDraft(session, { locationSlug: id.slice('place:'.length) }),
      step: 'budget',
    };
  }
  if (id === 'budget:skip') {
    return { ...withDraft(session, { budgetMaxMinor: null }), step: 'mode' };
  }
  if (id === 'budget:ask') {
    return session;
  }
  if (id.startsWith('mode:')) {
    const mode = id.slice('mode:'.length) as InvolvementMode;
    return {
      ...withDraft(session, { involvement: mode }),
      step: 'confirm',
    };
  }
  if (id === 'confirm:submit') {
    return { ...session, step: 'done' };
  }
  if (id === 'confirm:cancel') {
    return { ...session, step: 'cancelled' };
  }
  if (id === 'confirm:edit') {
    return { ...session, step: 'category' };
  }
  return session;
}

function applyText(session: CaptureSession, text: string): CaptureSession {
  const trimmed = text.trim();
  if (!trimmed) {
    return session;
  }

  if (session.step === 'category' || (session.step === 'type' && !session.draft.categorySlug)) {
    const parsed = parseFreeTextRequest(trimmed);
    const next = {
      ...withDraft(session, parsed.draftPatch),
      gaps: [...session.gaps, ...parsed.gaps],
    };
    if (parsed.confidence === 'high' && next.draft.categorySlug && next.draft.typeSlug) {
      if (next.draft.items.length && next.draft.locationSlug && next.draft.startDate) {
        return {
          ...next,
          draft: {
            ...next.draft,
            involvement: next.draft.involvement ?? 'assist',
          },
          step: 'confirm',
        };
      }
      if (next.draft.items.some((item) => item.quantity == null)) {
        return { ...next, step: 'details' };
      }
      if (!next.draft.startDate) {
        return { ...next, step: 'date' };
      }
      if (!next.draft.stateSlug) {
        return { ...next, step: 'location_state' };
      }
      if (!next.draft.locationSlug) {
        return { ...next, step: 'location_place' };
      }
      return { ...next, step: 'budget' };
    }
    if (next.draft.categorySlug && !next.draft.typeSlug) {
      return { ...next, step: 'type' };
    }
    if (next.draft.categorySlug && next.draft.typeSlug) {
      return { ...next, step: 'services' };
    }
    return next;
  }

  if (session.step === 'details') {
    const quantity = Number(trimmed.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return session;
    }
    let filled = false;
    const items = session.draft.items.map((item) => {
      if (!filled && item.quantity == null) {
        filled = true;
        return { ...item, quantity };
      }
      return item;
    });
    const next = withDraft(session, { items });
    if (items.some((item) => item.quantity == null)) {
      return { ...next, step: 'details' };
    }
    return { ...next, step: 'date' };
  }

  if (session.step === 'date') {
    const parsed = parseFreeTextRequest(trimmed);
    if (parsed.draftPatch.startDate) {
      return {
        ...withDraft(session, { startDate: parsed.draftPatch.startDate }),
        step: 'location_state',
      };
    }
    return session;
  }

  if (session.step === 'location_place' || session.step === 'location_state') {
    const parsed = parseFreeTextRequest(trimmed);
    if (parsed.draftPatch.locationSlug) {
      return {
        ...withDraft(session, {
          stateSlug: parsed.draftPatch.stateSlug ?? session.draft.stateSlug,
          locationSlug: parsed.draftPatch.locationSlug,
        }),
        step: 'budget',
      };
    }
    return session;
  }

  if (session.step === 'budget') {
    const parsed = parseFreeTextRequest(`budget ${trimmed}`);
    return {
      ...withDraft(session, {
        budgetMaxMinor: parsed.draftPatch.budgetMaxMinor ?? null,
      }),
      step: 'mode',
    };
  }

  // Opportunistic free-text anytime.
  const parsed = parseFreeTextRequest(trimmed);
  if (parsed.confidence !== 'low') {
    return {
      ...withDraft(session, parsed.draftPatch),
      gaps: [...session.gaps, ...parsed.gaps],
    };
  }
  return session;
}

export function advanceCapture(
  session: CaptureSession,
  inbound: CaptureInbound,
  options?: { listPage?: number },
): AdvanceCaptureResult {
  let next = session;
  const outbound: CaptureOutbound[] = [];

  if (inbound.kind === 'cancel' || (inbound.kind === 'tap' && inbound.id === 'confirm:cancel')) {
    next = { ...stamp(next, 'user', 'Cancel'), step: 'cancelled' };
    const message = promptForStep(next);
    next = stamp(next, 'assistant', message.kind === 'text' ? message.body : message.body);
    return {
      session: next,
      outbound: [message],
      extracted: null,
      completed: false,
      cancelled: true,
    };
  }

  if (inbound.kind === 'submit' || (inbound.kind === 'tap' && inbound.id === 'confirm:submit')) {
    next = stamp(next, 'user', 'Submit');
    next = { ...next, step: 'done' };
    const message = promptForStep(next);
    next = stamp(next, 'assistant', message.body);
    return {
      session: next,
      outbound: [message],
      extracted: next.draft,
      completed: true,
      cancelled: false,
    };
  }

  if (inbound.kind === 'edit') {
    next = stamp(next, 'user', 'Edit');
    next = { ...next, step: inbound.step ?? 'category' };
  } else if (inbound.kind === 'tap') {
    next = stamp(next, 'user', inbound.title ?? inbound.id);
    if (inbound.id.startsWith('more:')) {
      const page = Number(inbound.id.slice('more:'.length)) || 0;
      const message = promptForStep(next, page);
      next = stamp(next, 'assistant', message.body);
      return {
        session: next,
        outbound: [message],
        extracted: null,
        completed: false,
        cancelled: false,
      };
    }
    if (inbound.id === 'budget:ask') {
      const message = buildTextMessage('What is your maximum budget in naira?');
      next = stamp(next, 'assistant', message.body);
      return {
        session: next,
        outbound: [message],
        extracted: null,
        completed: false,
        cancelled: false,
      };
    }
    next = applyTap(next, inbound.id);
  } else if (inbound.kind === 'text') {
    next = stamp(next, 'user', inbound.text);
    const before = next.step;
    next = applyText(next, inbound.text);
    if (before === next.step && before === 'details') {
      outbound.push(buildTextMessage('Please send a number, for example 120.'));
    }
    if (before === next.step && before === 'date') {
      outbound.push(buildTextMessage('Try a date like 20 December.'));
    }
  }

  if (next.step === 'services' && inbound.kind === 'tap' && inbound.id.startsWith('service:')) {
    // Stay on services to allow Add another / Done.
    outbound.push(promptForStep(next));
  } else if (next.step !== 'done' && next.step !== 'cancelled') {
    outbound.push(promptForStep(next, options?.listPage ?? 0));
  } else {
    outbound.push(promptForStep(next));
  }

  for (const message of outbound) {
    next = stamp(next, 'assistant', message.body);
  }

  return {
    session: next,
    outbound,
    extracted: next.step === 'done' ? next.draft : null,
    completed: next.step === 'done',
    cancelled: next.step === 'cancelled',
  };
}

export function startCapture(seeds?: readonly CatalogCategorySeed[]): AdvanceCaptureResult {
  void seeds;
  const session = createCaptureSession();
  const message = promptForStep(session);
  const stamped = stamp(session, 'assistant', message.body);
  return {
    session: stamped,
    outbound: [message],
    extracted: null,
    completed: false,
    cancelled: false,
  };
}
