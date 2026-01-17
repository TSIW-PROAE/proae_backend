export class URL {
  private readonly value: string;

  constructor(url: string) {
    if (!url || url.trim().length === 0) {
      throw new Error('URL não pode ser vazia');
    }

    const trimmed = url.trim();

    if (!this.isValid(trimmed)) {
      throw new Error('URL inválida');
    }

    this.value = trimmed;
  }

  private isValid(url: string): boolean {
    try {
      new globalThis.URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    try {
      const urlObj = new globalThis.URL(this.value);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  equals(other: URL): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

