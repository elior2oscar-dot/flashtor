/** Next.js `basePath` for GitHub Pages deploy. */
export const APP_BASE_PATH = '/flashtor';

const DEFAULT_SITE_ORIGIN = 'https://elior2oscar-dot.github.io';

/**
 * Host origin only (no basePath). Accepts either:
 * - https://elior2oscar-dot.github.io
 * - https://elior2oscar-dot.github.io/flashtor
 */
export function getPublicAppOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  if (raw) {
    if (raw.endsWith(APP_BASE_PATH)) {
      return raw.slice(0, -APP_BASE_PATH.length) || raw;
    }
    return raw;
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return DEFAULT_SITE_ORIGIN;
}

export function bookingPath(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${APP_BASE_PATH}/book/${clean}/`;
}

export function portalPath(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${APP_BASE_PATH}/portal/${clean}/`;
}

export function bookingUrl(slug: string): string {
  return `${getPublicAppOrigin()}${bookingPath(slug)}`;
}

export function portalUrl(slug: string): string {
  return `${getPublicAppOrigin()}${portalPath(slug)}`;
}
