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

  it('arranca en unknown, no en denied', () => {
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
    expect(c.resolved).toBe(false);
  });

  it('no permite nada no esencial antes de decidir', () => {
    const c = new ConsentState(storage);
    expect(c.allows('analytics')).toBe(false);
    expect(c.allows('advertising')).toBe(false);
  });

  it('siempre permite lo estrictamente necesario', () => {
    const c = new ConsentState(storage);
    expect(c.allows('necessary')).toBe(true);
  });

  it('distingue denied de unknown', () => {
    const c = new ConsentState(storage);
    c.rejectAll();
    expect(c.get('analytics')).toBe('denied');
    expect(c.resolved).toBe(true);
  });

  it('persiste la decisión con versión y marca de tiempo', () => {
    const c = new ConsentState(storage);
    c.set({ analytics: true, advertising: false });
    const saved = JSON.parse(storage.getItem('consent')!);
    expect(saved.version).toBe(POLICY_VERSION);
    expect(saved.categories).toEqual({ analytics: true, advertising: false });
    expect(Date.parse(saved.timestamp)).not.toBeNaN();
  });

  it('invalida el consentimiento de una versión anterior de la política', () => {
    storage.setItem('consent', JSON.stringify({
      version: POLICY_VERSION - 1,
      timestamp: new Date().toISOString(),
      categories: { analytics: true, advertising: true },
    }));
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
  });

  it('retirar deja el estado en unknown, no en granted', () => {
    const c = new ConsentState(storage);
    c.acceptAll();
    c.withdraw();
    expect(c.resolved).toBe(false);
    expect(c.allows('analytics')).toBe(false);
  });

  it('no revienta si el almacenamiento tiene basura', () => {
    storage.setItem('consent', '{no es json');
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
  });

  it('traduce a las cuatro señales de Consent Mode v2', () => {
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
