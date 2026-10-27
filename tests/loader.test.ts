import { describe, it, expect } from 'vitest';
import { ConsentState } from '../src/consent';
import { TagLoader, type Tag } from '../src/loader';
import { MemoryStorage } from './memory-storage';

function fakeDocument() {
  const injected: string[] = [];
  const reloads: number[] = [];
  const doc = {
    location: { reload: () => reloads.push(1) },
    createElement: () => ({ dataset: {} as Record<string, string>, setAttribute() {} }),
    head: { appendChild: (el: { dataset: Record<string, string> }) => injected.push(el.dataset.tagId!) },
  };
  return { doc: doc as unknown as Document, injected, reloads };
}

const tags: Tag[] = [
  { id: 'ga', category: 'analytics', src: 'https://example.com/ga.js' },
  { id: 'pixel', category: 'advertising', src: 'https://example.com/pixel.js' },
];

describe('TagLoader', () => {
  it('injects nothing before a decision', () => {
    const { doc, injected } = fakeDocument();
    new TagLoader(new ConsentState(new MemoryStorage()), tags, doc).start();
    expect(injected).toEqual([]);
  });

  it('injects only the categories that were granted', () => {
    const { doc, injected } = fakeDocument();
    const consent = new ConsentState(new MemoryStorage());
    new TagLoader(consent, tags, doc).start();
    consent.set({ analytics: true, advertising: false });
    expect(injected).toEqual(['ga']);
  });

  it('injects each tag once even if consent is set again', () => {
    const { doc, injected } = fakeDocument();
    const consent = new ConsentState(new MemoryStorage());
    new TagLoader(consent, tags, doc).start();
    consent.acceptAll();
    consent.acceptAll();
    expect(injected).toEqual(['ga', 'pixel']);
  });

  it('stops reacting to consent changes after dispose', () => {
    const { doc, injected } = fakeDocument();
    const consent = new ConsentState(new MemoryStorage());
    const loader = new TagLoader(consent, tags, doc);
    loader.start();
    loader.dispose();
    consent.acceptAll();
    expect(injected).toEqual([]);
  });

  it('reports loaded tags whose category was revoked without withdraw', () => {
    const { doc, reloads } = fakeDocument();
    const consent = new ConsentState(new MemoryStorage());
    const loader = new TagLoader(consent, tags, doc);
    loader.start();
    consent.acceptAll();
    consent.set({ analytics: false, advertising: true });
    expect(loader.revokedTags()).toEqual(['ga']);
    loader.reloadOnWithdrawal();
    expect(reloads).toHaveLength(1);
  });

  it('does not reload when every loaded tag is still allowed', () => {
    const { doc, reloads } = fakeDocument();
    const consent = new ConsentState(new MemoryStorage());
    const loader = new TagLoader(consent, tags, doc);
    loader.start();
    consent.set({ analytics: true, advertising: false });
    loader.reloadOnWithdrawal();
    expect(loader.revokedTags()).toEqual([]);
    expect(reloads).toHaveLength(0);
  });

  it('injects an async script with the tag src and its extra attributes', () => {
    const appended: Array<{ async?: boolean; src?: string; attrs: Record<string, string> }> = [];
    const doc = {
      createElement: () => {
        const attrs: Record<string, string> = {};
        return { dataset: {}, attrs, setAttribute: (k: string, v: string) => (attrs[k] = v) };
      },
      head: { appendChild: (el: (typeof appended)[number]) => appended.push(el) },
    } as unknown as Document;
    const consent = new ConsentState(new MemoryStorage());
    const tag: Tag = {
      id: 'ga',
      category: 'analytics',
      src: 'https://example.com/ga.js',
      attrs: { nonce: 'abc123', crossorigin: 'anonymous' },
    };
    new TagLoader(consent, [tag], doc).start();
    consent.acceptAll();
    expect(appended).toEqual([
      expect.objectContaining({
        async: true,
        src: 'https://example.com/ga.js',
        attrs: { nonce: 'abc123', crossorigin: 'anonymous' },
      }),
    ]);
  });
});
