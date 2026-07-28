/** Next.js `basePath` for GitHub Pages deploy. */
export const APP_BASE_PATH = '/flashtor';

const DEFAULT_PUBLIC_APP_URL = 'https://elior2oscar-dot.github.io/flashtor';

export function getPublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return DEFAULT_PUBLIC_APP_URL;
}

export function bookingPath(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${APP_BASE_PATH}/book/${clean}`;
}

export function bookingUrl(slug: string): string {
  return `${getPublicAppOrigin()}${bookingPath(slug)}`;
}

export function portalPath(slug: string): string {
  const clean = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${APP_BASE_PATH}/portal/${clean}`;
}

export function portalUrl(slug: string): string {
  return `${getPublicAppOrigin()}${portalPath(slug)}`;
}
