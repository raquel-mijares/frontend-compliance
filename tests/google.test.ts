import { describe, it, expect } from 'vitest';
import { ConsentState } from '../src/consent';
import { bindGoogleConsentMode, toGoogleConsentMode, type GoogleConsentMode } from '../src/adapters/google';
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

describe('bindGoogleConsentMode', () => {
  it('sends a denied default first, then an update on every decision', () => {
    const c = new ConsentState(new MemoryStorage());
    const calls: [string, GoogleConsentMode][] = [];
    bindGoogleConsentMode(c, (_cmd, action, params) => calls.push([action, params]));
    c.set({ analytics: true, advertising: false });
    expect(calls.map(([action, p]) => [action, p.analytics_storage, p.ad_storage])).toEqual([
      ['default', 'denied', 'denied'],
      ['update', 'granted', 'denied'],
    ]);
  });

  it('stops sending updates after unsubscribing', () => {
    const c = new ConsentState(new MemoryStorage());
    const actions: string[] = [];
    const stop = bindGoogleConsentMode(c, (_cmd, action) => actions.push(action));
    stop();
    c.acceptAll();
    expect(actions).toEqual(['default']);
  });

  it('denies everything again when consent is withdrawn after accepting', () => {
    const c = new ConsentState(new MemoryStorage());
    const calls: [string, GoogleConsentMode][] = [];
    bindGoogleConsentMode(c, (_cmd, action, params) => calls.push([action, params]));
    c.acceptAll();
    c.withdraw();
    expect(calls.at(-1)).toEqual([
      'update',
      { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' },
    ]);
  });
});
