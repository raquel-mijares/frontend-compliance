/** Dominios que no deben recibir una sola petición antes del consentimiento. */
export const TRACKER_HOSTS = [
  'google-analytics.com',
  'analytics.google.com',
  'googletagmanager.com',
  'doubleclick.net',
  'facebook.com',
  'facebook.net',
  'connect.facebook.net',
  'hotjar.com',
  'fullstory.com',
  'segment.io',
  'segment.com',
  'mixpanel.com',
  'amplitude.com',
  'tiktok.com',
  'clarity.ms',
];

export function isTracker(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return TRACKER_HOSTS.some((t) => host === t || host.endsWith(`.${t}`));
  } catch {
    return false;
  }
}
