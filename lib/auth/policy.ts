function hasUnsafeCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return character === '\\' || code <= 32 || code === 127;
  });
}

/** Shared post-login navigation policy. Credentials never belong in a URL. */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (hasUnsafeCharacters(value)) return '/';

  const origin = 'https://pvl.invalid';
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return '/';

    // Check the decoded path as well: reverse proxies may decode it before routing.
    let pathname = url.pathname;
    for (let count = 0; count < 4; count += 1) {
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
    }
    if (pathname.includes('%') || hasUnsafeCharacters(pathname)) return '/';
    const normalized = new URL(pathname, origin);
    if (normalized.origin !== origin) return '/';
    // Do not bounce back into an account flow or send a browser to an API response.
    if (/^\/(?:login|register|api)(?:\/|$)/iu.test(normalized.pathname)) return '/';

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

/**
 * Call only with a user ID verified by the server's session lookup and an
 * allowlist read from server configuration. Never pass browser-supplied roles,
 * emails, localStorage records, or request-body identifiers to this function.
 */
export function hasAdminAccess(
  verifiedUserId: string | null | undefined,
  configuredAdminIds: string | undefined,
): boolean {
  if (!verifiedUserId || !configuredAdminIds) return false;
  return configuredAdminIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(verifiedUserId);
}
