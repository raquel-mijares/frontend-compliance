export type Category = 'necessary' | 'analytics' | 'advertising';

export type OptionalCategory = Exclude<Category, 'necessary'>;

export type Decision = 'unknown' | 'granted' | 'denied';

export interface ConsentRecord {
  version: number;
  timestamp: string;
  categories: Record<OptionalCategory, boolean>;
}

export const POLICY_VERSION = 1;

const STORAGE_KEY = 'consent';

export function isConsentRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  const categories = record.categories as Record<string, unknown> | null;
  return (
    record.version === POLICY_VERSION &&
    typeof record.timestamp === 'string' &&
    typeof categories === 'object' &&
    categories !== null &&
    typeof categories.analytics === 'boolean' &&
    typeof categories.advertising === 'boolean'
  );
}

export class ConsentState {
  private record: ConsentRecord | null = null;
  private listeners = new Set<(s: ConsentState) => void>();

  constructor(private storage: Storage = localStorage) {
    this.record = this.load();
  }

  private load(): ConsentRecord | null {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isConsentRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  get(category: Category): Decision {
    if (category === 'necessary') return 'granted';
    if (!this.record) return 'unknown';
    return this.record.categories[category] ? 'granted' : 'denied';
  }

  allows(category: Category): boolean {
    return this.get(category) === 'granted';
  }

  get resolved(): boolean {
    return this.record !== null;
  }

  set(categories: ConsentRecord['categories']): void {
    this.record = {
      version: POLICY_VERSION,
      timestamp: new Date().toISOString(),
      categories,
    };
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.record));
    } catch {
    }
    this.emit();
  }

  acceptAll(): void {
    this.set({ analytics: true, advertising: true });
  }

  rejectAll(): void {
    this.set({ analytics: false, advertising: false });
  }

  withdraw(): void {
    try {
      this.storage.removeItem(STORAGE_KEY);
    } catch {
    }
    this.record = null;
    this.emit();
  }

  syncAcrossTabs(target: EventTarget = window): () => void {
    const onStorage = (event: Event) => {
      const { key, storageArea } = event as StorageEvent;
      if (storageArea !== this.storage) return;
      if (key !== null && key !== STORAGE_KEY) return;
      this.record = this.load();
      this.emit();
    };
    target.addEventListener('storage', onStorage);
    return () => target.removeEventListener('storage', onStorage);
  }

  subscribe(fn: (s: ConsentState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this);
  }
}
