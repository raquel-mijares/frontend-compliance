import { describe, it, expect } from 'vitest';
import { TagRegistry } from '../src/contexts';
import type { Tag } from '../src/loader';

const analytics: Tag = { id: 'ga4', category: 'analytics', src: 'https://example.com/ga.js' };
const aggregate: Tag = { id: 'agg', category: 'analytics', src: 'https://example.com/agg.js' };
const ads: Tag = { id: 'meta', category: 'advertising', src: 'https://example.com/ads.js' };

describe('TagRegistry', () => {
  it('rejects a tag registered without a context', () => {
    const r = new TagRegistry();
    expect(() => r.register(analytics, [])).toThrow(/at least one context/);
  });

  it('keeps the kids context empty when only general tags exist', () => {
    const r = new TagRegistry();
    r.register(analytics, ['general']);
    r.register(ads, ['general']);
    expect(r.for('kids')).toEqual([]);
  });

  it('includes a tag in kids only when explicitly listed', () => {
    const r = new TagRegistry();
    r.register(analytics, ['general']);
    r.register(aggregate, ['general', 'kids']);
    expect(r.for('kids').map((t) => t.id)).toEqual(['agg']);
    expect(r.for('general').map((t) => t.id)).toEqual(['ga4', 'agg']);
  });

  it('refuses advertising tags in the kids context', () => {
    const r = new TagRegistry();
    expect(() => r.register(ads, ['general', 'kids'])).toThrow(/cannot run in the kids context/);
    expect(r.for('general')).toEqual([]);
  });

  it('rejects duplicate tag ids', () => {
    const r = new TagRegistry();
    r.register(analytics, ['general']);
    expect(() => r.register(analytics, ['kids'])).toThrow(/already registered/);
  });
});
