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

function cleanSlug(slug: string) {
  return slug.trim().replace(/^\/+|\/+$/g, '');
}

/** In-app href for Next.js Link (basePath is applied by Next). */
export function bookingHref(slug: string): string {
  return `/book/${cleanSlug(slug)}/`;
}

export function portalHref(slug: string): string {
  return `/portal/${cleanSlug(slug)}/`;
}

export function profileHref(slug: string): string {
  return `/p/${cleanSlug(slug)}/`;
}

/** Absolute public URLs (clipboard / open in new tab). */
export function bookingPath(slug: string): string {
  return `${APP_BASE_PATH}/book/${cleanSlug(slug)}/`;
}

export function portalPath(slug: string): string {
  return `${APP_BASE_PATH}/portal/${cleanSlug(slug)}/`;
}

export function profilePath(slug: string): string {
  return `${APP_BASE_PATH}/p/${cleanSlug(slug)}/`;
}

export function bookingUrl(slug: string): string {
  return `${getPublicAppOrigin()}${bookingPath(slug)}`;
}

export function portalUrl(slug: string): string {
  return `${getPublicAppOrigin()}${portalPath(slug)}`;
}

export function profileUrl(slug: string): string {
  return `${getPublicAppOrigin()}${profilePath(slug)}`;
}
