import type { ConsentState } from '../consent';

export type MetaConsentAction = 'grant' | 'revoke';

export function toMetaConsent(consent: Pick<ConsentState, 'allows'>): MetaConsentAction {
  return consent.allows('advertising') ? 'grant' : 'revoke';
}
