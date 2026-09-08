export type Category = 'necessary' | 'analytics' | 'advertising';

export type Decision = 'unknown' | 'granted' | 'denied';

export interface ConsentRecord {
  version: number;
  timestamp: string;
  categories: Record<Exclude<Category, 'necessary'>, boolean>;
}

export const POLICY_VERSION = 1;

const STORAGE_KEY = 'consent';

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
      const parsed = JSON.parse(raw) as ConsentRecord;
      if (parsed.version !== POLICY_VERSION) return null;
      return parsed;
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
      // Modo privado o almacenamiento lleno: el estado vive en memoria esta
      // sesión y se vuelve a preguntar en la siguiente. Nunca asumir concedido.
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
      // ignorado a propósito
    }
    this.record = null;
    this.emit();
  }

  subscribe(fn: (s: ConsentState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this);
  }

  toGoogleConsentMode(): Record<string, 'granted' | 'denied'> {
    const analytics = this.allows('analytics') ? 'granted' : 'denied';
    const ads = this.allows('advertising') ? 'granted' : 'denied';
    return {
      analytics_storage: analytics,
      ad_storage: ads,
      ad_user_data: ads,
      ad_personalization: ads,
    };
  }
}
