import type { ConsentState } from '../consent';

export type MetaConsentAction = 'grant' | 'revoke';

export function toMetaConsent(consent: Pick<ConsentState, 'allows'>): MetaConsentAction {
  return consent.allows('advertising') ? 'grant' : 'revoke';
}

export type Fbq = (command: 'consent', action: MetaConsentAction) => void;

export function bindMetaConsent(
  consent: Pick<ConsentState, 'allows' | 'subscribe'>,
  fbq: Fbq,
): () => void {
  fbq('consent', toMetaConsent(consent));
  return consent.subscribe(() => fbq('consent', toMetaConsent(consent)));
}
