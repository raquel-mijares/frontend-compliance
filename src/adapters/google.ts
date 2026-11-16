import type { ConsentState } from '../consent';

export type GoogleConsentSignal = 'granted' | 'denied';

export interface GoogleConsentMode {
  analytics_storage: GoogleConsentSignal;
  ad_storage: GoogleConsentSignal;
  ad_user_data: GoogleConsentSignal;
  ad_personalization: GoogleConsentSignal;
}

export function toGoogleConsentMode(consent: Pick<ConsentState, 'allows'>): GoogleConsentMode {
  const analytics = consent.allows('analytics') ? 'granted' : 'denied';
  const ads = consent.allows('advertising') ? 'granted' : 'denied';
  return {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

export type Gtag = (command: 'consent', action: 'default' | 'update', params: GoogleConsentMode) => void;

export function bindGoogleConsentMode(
  consent: Pick<ConsentState, 'allows' | 'subscribe'>,
  gtag: Gtag,
): () => void {
  let last = toGoogleConsentMode(consent);
  gtag('consent', 'default', last);
  return consent.subscribe(() => {
    const next = toGoogleConsentMode(consent);
    const changed = (Object.keys(next) as (keyof GoogleConsentMode)[]).some((key) => next[key] !== last[key]);
    if (!changed) return;
    last = next;
    gtag('consent', 'update', next);
  });
}
