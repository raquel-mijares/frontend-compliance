import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentState, POLICY_VERSION } from '../src/consent';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(k: string) { return this.map.get(k) ?? null; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  removeItem(k: string) { this.map.delete(k); }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

describe('ConsentState', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('starts at unknown, not denied', () => {
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
    expect(c.resolved).toBe(false);
  });

  it('allows nothing non-essential before a decision', () => {
    const c = new ConsentState(storage);
    expect(c.allows('analytics')).toBe(false);
    expect(c.allows('advertising')).toBe(false);
  });

  it('always allows strictly necessary', () => {
    const c = new ConsentState(storage);
    expect(c.allows('necessary')).toBe(true);
  });

  it('distinguishes denied from unknown', () => {
    const c = new ConsentState(storage);
    c.rejectAll();
    expect(c.get('analytics')).toBe('denied');
    expect(c.resolved).toBe(true);
  });

  it('persists the decision with version and timestamp', () => {
    const c = new ConsentState(storage);
    c.set({ analytics: true, advertising: false });
    const saved = JSON.parse(storage.getItem('consent')!);
    expect(saved.version).toBe(POLICY_VERSION);
    expect(saved.categories).toEqual({ analytics: true, advertising: false });
    expect(Date.parse(saved.timestamp)).not.toBeNaN();
  });

  it('invalidates consent from an earlier policy version', () => {
    storage.setItem('consent', JSON.stringify({
      version: POLICY_VERSION - 1,
      timestamp: new Date().toISOString(),
      categories: { analytics: true, advertising: true },
    }));
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
  });

  it('withdrawal leaves state at unknown, not granted', () => {
    const c = new ConsentState(storage);
    c.acceptAll();
    c.withdraw();
    expect(c.resolved).toBe(false);
    expect(c.allows('analytics')).toBe(false);
  });

  it('does not blow up on corrupt storage', () => {
    storage.setItem('consent', '{no es json');
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
  });

  it('maps to the four Consent Mode v2 signals', () => {
    const c = new ConsentState(storage);
    c.set({ analytics: true, advertising: false });
    expect(c.toGoogleConsentMode()).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });
});
