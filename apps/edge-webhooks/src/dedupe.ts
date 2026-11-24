const DEFAULT_MAX = 5_000;

/**
 * Process-local dedupe store.
 * Downstream Supabase also dedupes by event id (Prompt 15). This cuts obvious
 * Meta retries inside a single Worker isolate.
 */
export class DedupeStore {
  private readonly seen = new Set<string>();
  private readonly max: number;

  constructor(max = DEFAULT_MAX) {
    this.max = max;
  }

  /** Returns true if this id is new (and records it). False if duplicate. */
  claim(id: string): boolean {
    if (this.seen.has(id)) {
      return false;
    }
    if (this.seen.size >= this.max) {
      const first = this.seen.values().next().value;
      if (typeof first === 'string') {
        this.seen.delete(first);
      }
    }
    this.seen.add(id);
    return true;
  }

  clear(): void {
    this.seen.clear();
  }
}

export const defaultDedupe = new DedupeStore();
