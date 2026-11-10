import type { ConsentState, OptionalCategory } from './consent';

export interface Tag {
  id: string;
  category: OptionalCategory;
  src: string;
  attrs?: Record<string, string>;
}

export class TagLoader {
  private loaded = new Set<string>();
  private unsubscribe: (() => void) | null = null;
  private readonly tags: readonly Tag[];

  constructor(
    private consent: ConsentState,
    tags: readonly Tag[],
    private doc: Document = document,
  ) {
    this.tags = [...tags];
    const ids = new Set<string>();
    for (const tag of tags) {
      if (ids.has(tag.id)) {
        throw new Error(`Tag "${tag.id}" is listed more than once`);
      }
      ids.add(tag.id);
    }
  }

  start(): void {
    this.unsubscribe ??= this.consent.subscribe(() => this.sync());
    this.sync();
  }

  private sync(): void {
    for (const tag of this.tags) {
      if (this.loaded.has(tag.id)) continue;
      if (!this.consent.allows(tag.category)) continue;
      this.inject(tag);
    }
  }

  private inject(tag: Tag): void {
    const el = this.doc.createElement('script');
    for (const [k, v] of Object.entries(tag.attrs ?? {})) {
      el.setAttribute(k, v);
    }
    el.async = true;
    el.src = tag.src;
    el.dataset.tagId = tag.id;
    this.doc.head.appendChild(el);
    this.loaded.add(tag.id);
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  revokedTags(): string[] {
    return this.tags
      .filter((tag) => this.loaded.has(tag.id) && !this.consent.allows(tag.category))
      .map((tag) => tag.id);
  }

  reloadOnWithdrawal(): void {
    if (this.revokedTags().length > 0) this.doc.location.reload();
  }
}
