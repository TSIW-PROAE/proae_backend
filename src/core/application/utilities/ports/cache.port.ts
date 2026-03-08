export interface CachePort {
  setValue(
    key: string,
    value: unknown,
    expirationSeconds?: number,
  ): Promise<void>;
  getValue<T = unknown>(key: string): Promise<T | null>;
  deleteValue(key: string): Promise<void>;
}

