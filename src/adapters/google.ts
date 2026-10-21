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
  gtag('consent', 'default', toGoogleConsentMode(consent));
  return consent.subscribe(() => gtag('consent', 'update', toGoogleConsentMode(consent)));
}
