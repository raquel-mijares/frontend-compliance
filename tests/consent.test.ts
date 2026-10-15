import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentState, POLICY_VERSION } from '../src/consent';
import { MemoryStorage } from './memory-storage';

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

  it('notifies subscribers on each change and stops after unsubscribe', () => {
    const c = new ConsentState(storage);
    const seen: boolean[] = [];
    const unsubscribe = c.subscribe((s) => seen.push(s.allows('analytics')));
    c.acceptAll();
    c.withdraw();
    unsubscribe();
    c.acceptAll();
    expect(seen).toEqual([true, false]);
  });

  it('does not blow up on corrupt storage', () => {
    storage.setItem('consent', '{no es json');
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
  });

  it.each([
    ['null', 'null'],
    ['a record without categories', JSON.stringify({ version: POLICY_VERSION, timestamp: 'now' })],
    ['categories that are not booleans', JSON.stringify({ version: POLICY_VERSION, timestamp: 'now', categories: { analytics: 'yes', advertising: true } })],
    ['a missing timestamp', JSON.stringify({ version: POLICY_VERSION, categories: { analytics: true, advertising: true } })],
  ])('ignores a stored value with %s', (_label, raw) => {
    storage.setItem('consent', raw);
    const c = new ConsentState(storage);
    expect(c.get('analytics')).toBe('unknown');
    expect(c.resolved).toBe(false);
  });
});
