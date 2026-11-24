/**
 * Static Cloudflare export only prebuilds a few dynamic shells.
 * Soft Next navigations to new mock IDs 404. Prefer the always-built
 * `/open` and `/done` pages with query ids, and full page loads.
 */
export function navigateStatic(path: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const [rawPath, query] = path.split('?');
  const normalized = (rawPath ?? '/').startsWith('/') ? (rawPath ?? '/') : `/${rawPath}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  window.location.assign(query ? `${withSlash}?${query}` : withSlash);
}

export function requestHref(requestId: string): string {
  return `/app/request/open/?id=${encodeURIComponent(requestId)}`;
}

export function chatHref(chatId: string): string {
  return `/app/chat/open/?id=${encodeURIComponent(chatId)}`;
}

export function requestDoneHref(requestId: string, quoteId?: string): string {
  const base = `/app/request/done/?id=${encodeURIComponent(requestId)}`;
  return quoteId ? `${base}&quote=${encodeURIComponent(quoteId)}` : base;
}

export function staticHref(path: string): string {
  const [rawPath, query] = path.split('?');
  const normalized = (rawPath ?? '/').startsWith('/') ? (rawPath ?? '/') : `/${rawPath}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return query ? `${withSlash}?${query}` : withSlash;
}
