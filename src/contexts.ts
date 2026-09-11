import type { Tag } from './loader';

export type AudienceContext = 'general' | 'kids';

export class TagRegistry {
  private entries = new Map<string, { tag: Tag; contexts: Set<AudienceContext> }>();

  register(tag: Tag, contexts: readonly AudienceContext[]): void {
    if (contexts.length === 0) {
      throw new Error(`Tag "${tag.id}" must be registered with at least one context`);
    }
    if (this.entries.has(tag.id)) {
      throw new Error(`Tag "${tag.id}" is already registered`);
    }
    if (tag.category === 'advertising' && contexts.includes('kids')) {
      throw new Error(`Advertising tag "${tag.id}" cannot run in the kids context`);
    }
    this.entries.set(tag.id, { tag, contexts: new Set(contexts) });
  }

  for(context: AudienceContext): Tag[] {
    return [...this.entries.values()]
      .filter((entry) => entry.contexts.has(context))
      .map((entry) => entry.tag);
  }
}
