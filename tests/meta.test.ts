import { describe, it, expect } from 'vitest';
import { ConsentState } from '../src/consent';
import { toMetaConsent, bindMetaConsent } from '../src/adapters/meta';
import { MemoryStorage } from './memory-storage';

describe('toMetaConsent', () => {
  it('grants when advertising is allowed', () => {
    const c = new ConsentState(new MemoryStorage());
    c.set({ analytics: false, advertising: true });
    expect(toMetaConsent(c)).toBe('grant');
  });

  it('revokes when advertising is denied, even if analytics is allowed', () => {
    const c = new ConsentState(new MemoryStorage());
    c.set({ analytics: true, advertising: false });
    expect(toMetaConsent(c)).toBe('revoke');
  });

  it('revokes before a decision', () => {
    const c = new ConsentState(new MemoryStorage());
    expect(toMetaConsent(c)).toBe('revoke');
  });
});

describe('bindMetaConsent', () => {
  it('revokes first, then follows every decision', () => {
    const c = new ConsentState(new MemoryStorage());
    const actions: string[] = [];
    bindMetaConsent(c, (_cmd, action) => actions.push(action));
    c.acceptAll();
    c.rejectAll();
    expect(actions).toEqual(['revoke', 'grant', 'revoke']);
  });

  it('stops sending after unsubscribing', () => {
    const c = new ConsentState(new MemoryStorage());
    const actions: string[] = [];
    const stop = bindMetaConsent(c, (_cmd, action) => actions.push(action));
    stop();
    c.acceptAll();
    expect(actions).toEqual(['revoke']);
  });

  it('revokes again when consent is withdrawn after accepting', () => {
    const c = new ConsentState(new MemoryStorage());
    const actions: string[] = [];
    bindMetaConsent(c, (_cmd, action) => actions.push(action));
    c.acceptAll();
    c.withdraw();
    expect(actions).toEqual(['revoke', 'grant', 'revoke']);
  });
});
