export class Celular {
  private readonly value: string;

  constructor(celular: string) {
    if (!celular || celular.trim().length === 0) {
      throw new Error('Celular não pode ser vazio');
    }

    const cleaned = celular.replace(/\D/g, '');

    if (!this.isValid(cleaned)) {
      throw new Error('Celular inválido. Deve conter 10 ou 11 dígitos');
    }

    this.value = cleaned;
  }

  private isValid(celular: string): boolean {
    return celular.length === 10 || celular.length === 11;
  }

  getValue(): string {
    return this.value;
  }

  getFormatted(): string {
    if (this.value.length === 11) {
      return this.value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return this.value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  equals(other: Celular): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.getFormatted();
  }
}

