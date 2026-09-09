import { ConsentState, type Category } from './consent';

export interface Tag {
  id: string;
  category: Exclude<Category, 'necessary'>;
  src: string;
  attrs?: Record<string, string>;
}

export class TagLoader {
  private loaded = new Set<string>();

  constructor(
    private consent: ConsentState,
    private tags: Tag[],
    private doc: Document = document,
  ) {
    this.consent.subscribe(() => this.sync());
  }

  start(): void {
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
    el.async = true;
    el.src = tag.src;
    el.dataset.tagId = tag.id;
    for (const [k, v] of Object.entries(tag.attrs ?? {})) {
      el.setAttribute(k, v);
    }
    this.doc.head.appendChild(el);
    this.loaded.add(tag.id);
  }

  reloadOnWithdrawal(): void {
    if (this.loaded.size > 0) this.doc.location.reload();
  }
}
