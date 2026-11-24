/**
 * Static Cloudflare export only prebuilds a few dynamic shells.
 * Soft Next navigations to new mock IDs 404; a full load hits `_redirects`.
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

export function staticHref(path: string): string {
  const [rawPath, query] = path.split('?');
  const normalized = (rawPath ?? '/').startsWith('/') ? (rawPath ?? '/') : `/${rawPath}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  return query ? `${withSlash}?${query}` : withSlash;
}
