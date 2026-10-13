import { describe, it, expect } from 'vitest';
import { ConsentState } from '../src/consent';
import { toMetaConsent } from '../src/adapters/meta';
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
