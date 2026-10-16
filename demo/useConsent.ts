import { useSyncExternalStore } from 'react';
import type { ConsentState, Decision } from '../src/consent';

export interface ConsentSnapshot {
  resolved: boolean;
  analytics: Decision;
  advertising: Decision;
}

export function useConsent(consent: ConsentState): ConsentSnapshot {
  const key = useSyncExternalStore(
    (onChange) => consent.subscribe(onChange),
    () => `${consent.resolved}|${consent.get('analytics')}|${consent.get('advertising')}`,
  );
  const [resolved, analytics, advertising] = key.split('|') as [string, Decision, Decision];
  return { resolved: resolved === 'true', analytics, advertising };
}
