import { describe, it, expect } from 'vitest';
import { ConsentState } from '../src/consent';
import { toGoogleConsentMode } from '../src/adapters/google';
import { MemoryStorage } from './memory-storage';

describe('toGoogleConsentMode', () => {
  it('maps to the four Consent Mode v2 signals', () => {
    const c = new ConsentState(new MemoryStorage());
    c.set({ analytics: true, advertising: false });
    expect(toGoogleConsentMode(c)).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('denies every signal before a decision', () => {
    const c = new ConsentState(new MemoryStorage());
    expect(Object.values(toGoogleConsentMode(c))).toEqual(['denied', 'denied', 'denied', 'denied']);
  });
});
