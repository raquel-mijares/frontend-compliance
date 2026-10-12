import { describe, it, expect } from 'vitest';
import { ConsentState } from '../src/consent';
import { TagLoader, type Tag } from '../src/loader';
import { MemoryStorage } from './memory-storage';

function fakeDocument() {
  const injected: string[] = [];
  const doc = {
    createElement: () => ({ dataset: {} as Record<string, string>, setAttribute() {} }),
    head: { appendChild: (el: { dataset: Record<string, string> }) => injected.push(el.dataset.tagId!) },
  };
  return { doc: doc as unknown as Document, injected };
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
});
